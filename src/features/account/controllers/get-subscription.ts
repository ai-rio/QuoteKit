import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getSubscription() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error in getSubscription:', authError);
      console.debug('getSubscription: User authentication failed', { 
        hasAuthError: !!authError, 
        hasUser: !!user,
        errorCode: authError?.message 
      });
      return null;
    }

    console.debug('getSubscription: Querying for user:', { userId: user.id });

    // CRITICAL FIX: Query subscriptions with corrected schema after sync fix
    // 1. Get all active/trialing subscriptions for the user
    // 2. Order by subscription type (paid first) then by creation date
    console.debug('getSubscription: Querying database with corrected schema');
    
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('stripe_price_id', { ascending: false, nullsFirst: false }) // Paid subscriptions first (non-null stripe_price_id)
      .order('created', { ascending: false }); // Then by creation date as tiebreaker

    if (subError) {
      console.error('Subscription query error:', subError);
      console.debug('getSubscription: Database query failed', {
        userId: user.id,
        error: subError.message,
        code: subError.code
      });
      return null;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscription found for user:', user.id);
      console.debug('getSubscription: No subscription found', {
        userId: user.id,
        searchStatuses: ['trialing', 'active', 'past_due']
      });
      return null;
    }

    // Get the first subscription (highest priority due to our ordering)
    const subscription = subscriptions[0];
    
    console.debug('getSubscription: Found subscription', {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.stripe_price_id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      subscriptionType: subscription.stripe_price_id ? 'paid' : 'free',
      totalSubscriptions: subscriptions.length
    });

    // Log warning if user has multiple subscriptions (should be cleaned up)
    if (subscriptions.length > 1) {
      const paidCount = subscriptions.filter(s => s.stripe_price_id).length;
      const freeCount = subscriptions.filter(s => !s.stripe_price_id).length;
      
      console.warn('User has multiple active subscriptions - cleanup needed:', {
        userId: user.id,
        totalSubscriptions: subscriptions.length,
        paidSubscriptions: paidCount,
        freeSubscriptions: freeCount,
        selectedSubscription: {
          id: subscription.id,
          type: subscription.stripe_price_id ? 'paid' : 'free'
        }
      });
    }

    // Get the price ID - handle both price_id and stripe_price_id fields
    const priceId = subscription.stripe_price_id || subscription.price_id;
    
    if (!priceId) {
      console.warn('Subscription has no price ID (stripe_price_id or price_id):', subscription.id);
      console.debug('getSubscription: Missing price ID', {
        subscriptionId: subscription.id,
        stripePrice: subscription.stripe_price_id,
        legacyPrice: subscription.price_id,
        subscriptionData: subscription
      });
      return {
        ...subscription,
        prices: null
      };
    }

    // Fetch the price data with product relationship in a single query
    const { data: priceData, error: priceError } = await supabase
      .from('stripe_prices')
      .select(`
        *,
        stripe_products!stripe_prices_stripe_product_id_fkey(*)
      `)
      .eq('id', priceId)  // Use 'id' instead of 'stripe_price_id'
      .maybeSingle();

    if (priceError) {
      console.error('Price query error:', priceError);
      console.debug('getSubscription: Price lookup failed', {
        priceId: subscription.stripe_price_id,
        error: priceError.message
      });
      // Return subscription with null price data if price lookup fails
      return {
        ...subscription,
        prices: null
      };
    }

    if (!priceData) {
      console.warn('No price data found for price ID:', priceId);
      console.debug('getSubscription: Price not found in database', {
        priceId,
        subscriptionId: subscription.id
      });
      
      // Try to sync the missing price data from Stripe
      try {
        console.log('🔄 Attempting to sync missing price data for:', priceId);
        const { syncMissingPriceData } = await import('./sync-missing-price-data');
        const syncedPriceData = await syncMissingPriceData(priceId);
        
        if (syncedPriceData) {
          console.log('✅ Successfully synced missing price data');
          // Continue with the newly synced data
          const transformedPriceData = {
            ...syncedPriceData,
            interval: syncedPriceData.recurring_interval,
            type: syncedPriceData.recurring_interval ? 'recurring' as const : 'one_time' as const,
            products: syncedPriceData.product_data || null
          };
          
          return {
            ...subscription,
            prices: transformedPriceData
          };
        }
      } catch (syncError) {
        console.warn('Failed to sync missing price data:', syncError);
      }
      
      return {
        ...subscription,
        prices: null
      };
    }

    // Get the product data from the joined query
    const productData = priceData.stripe_products;
    
    // If no product data from join, try to fetch separately as fallback
    let finalProductData = productData;
    if (!finalProductData && priceData.stripe_product_id) {
      console.log('🔄 Product not found in join, fetching separately for:', priceData.stripe_product_id);
      const { data: separateProductData, error: productError } = await supabase
        .from('stripe_products')
        .select('*')
        .eq('stripe_product_id', priceData.stripe_product_id)
        .maybeSingle();

      if (productError) {
        console.error('Product query error:', productError);
        console.debug('getSubscription: Product lookup failed', {
          productId: priceData.stripe_product_id,
          error: productError.message
        });
      } else {
        finalProductData = separateProductData;
      }
    }

    // Transform price data to match the expected type (same as in get-products.ts)
    const transformedPriceData = {
      ...priceData,
      interval: priceData.recurring_interval, // Map recurring_interval to interval for compatibility
      type: priceData.recurring_interval ? 'recurring' as const : 'one_time' as const, // Add type field based on recurring_interval
      products: finalProductData || null // Add the product data
    };

    console.debug('getSubscription: Successfully retrieved subscription data', {
      subscriptionId: subscription.id,
      priceId,
      hasProductData: !!finalProductData,
      productName: finalProductData?.name || 'No product name',
      subscriptionType: priceId ? 'paid' : 'free'
    });

    // Combine the data
    return {
      ...subscription,
      prices: transformedPriceData
    };
  } catch (error) {
    console.error('getSubscription function error:', error);
    console.debug('getSubscription: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

/**
 * Get the free plan information for users without active subscriptions
 * This provides a consistent interface for displaying free tier users
 */
export async function getFreePlanInfo() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the free plan product
    const { data: freeProduct, error: productError } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('name', 'Free Plan')
      .eq('active', true)
      .maybeSingle();

    if (productError) {
      console.error('Error fetching free plan product:', productError);
      return null;
    }

    if (!freeProduct) {
      console.warn('Free plan product not found in database');
      return null;
    }

    // Get the free plan price - use freeProduct.id to match stripe_product_id
    const { data: freePrice, error: priceError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('stripe_product_id', freeProduct.id) // Use freeProduct.id instead of freeProduct.stripe_product_id
      .eq('active', true)
      .maybeSingle();

    if (priceError) {
      console.error('Error fetching free plan price:', priceError);
      return null;
    }

    if (!freePrice) {
      console.warn('Free plan price not found in database');
      return null;
    }

    // Transform the data to match the expected format
    const transformedPriceData = {
      ...freePrice,
      interval: freePrice.recurring_interval || null,
      type: freePrice.recurring_interval ? 'recurring' as const : 'one_time' as const,
      products: freeProduct
    };

    console.debug('getFreePlanInfo: Successfully retrieved free plan data', {
      productName: freeProduct.name,
      priceAmount: freePrice.unit_amount
    });

    return transformedPriceData;
  } catch (error) {
    console.error('getFreePlanInfo function error:', error);
    return null;
  }
}

/**
 * Clean up duplicate subscriptions for a user
 * This function handles the case where a user has both free and paid subscriptions
 * It deactivates free subscriptions when paid ones exist
 */
export async function cleanupDuplicateSubscriptions(userId: string) {
  try {
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');

    // Get all active subscriptions for the user
    const { data: subscriptions, error: fetchError } = await supabaseAdminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['trialing', 'active', 'past_due']);

    if (fetchError) {
      console.error('Error fetching subscriptions for cleanup:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!subscriptions || subscriptions.length <= 1) {
      console.log('No duplicate subscriptions found for user:', userId);
      return { success: true, message: 'No duplicates found' };
    }

    // Separate paid and free subscriptions
    const paidSubscriptions = subscriptions.filter(s => s.stripe_price_id);
    const freeSubscriptions = subscriptions.filter(s => !s.stripe_price_id);

    console.log('Found subscriptions for cleanup:', {
      userId,
      totalSubscriptions: subscriptions.length,
      paidSubscriptions: paidSubscriptions.length,
      freeSubscriptions: freeSubscriptions.length
    });

    // If user has both paid and free subscriptions, deactivate the free ones
    if (paidSubscriptions.length > 0 && freeSubscriptions.length > 0) {
      const freeSubscriptionIds = freeSubscriptions.map(s => s.id);
      
      const { error: updateError } = await supabaseAdminClient
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        })
        .in('id', freeSubscriptionIds);

      if (updateError) {
        console.error('Error updating free subscriptions:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('Successfully deactivated free subscriptions:', {
        userId,
        deactivatedSubscriptions: freeSubscriptionIds
      });

      return { 
        success: true, 
        message: `Deactivated ${freeSubscriptionIds.length} free subscription(s)`,
        deactivatedCount: freeSubscriptionIds.length
      };
    }

    // If user has multiple paid subscriptions, keep the most recent one
    if (paidSubscriptions.length > 1) {
      const sortedPaid = paidSubscriptions.sort((a, b) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      );
      
      const subscriptionsToDeactivate = sortedPaid.slice(1); // Keep the first (most recent)
      const idsToDeactivate = subscriptionsToDeactivate.map(s => s.id);

      const { error: updateError } = await supabaseAdminClient
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        })
        .in('id', idsToDeactivate);

      if (updateError) {
        console.error('Error updating duplicate paid subscriptions:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('Successfully deactivated duplicate paid subscriptions:', {
        userId,
        deactivatedSubscriptions: idsToDeactivate,
        keptSubscription: sortedPaid[0].id
      });

      return { 
        success: true, 
        message: `Deactivated ${idsToDeactivate.length} duplicate paid subscription(s)`,
        deactivatedCount: idsToDeactivate.length
      };
    }

    return { success: true, message: 'No cleanup needed' };

  } catch (error) {
    console.error('Error in cleanupDuplicateSubscriptions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getBillingHistory() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error in getBillingHistory:', authError);
      console.debug('getBillingHistory: User authentication failed', {
        hasAuthError: !!authError,
        hasUser: !!user,
        errorCode: authError?.message
      });
      return [];
    }

    console.debug('getBillingHistory: Looking up customer for user:', { userId: user.id });

    // Import helper functions
    const { getOrCreateCustomerForUser, userNeedsStripeCustomer } = await import('@/features/account/controllers/get-or-create-customer');
    
    // Check if user actually needs a Stripe customer (has paid subscriptions)
    const needsCustomer = await userNeedsStripeCustomer(user.id, supabase);
    
    if (!needsCustomer) {
      console.debug('getBillingHistory: User is on free plan, no billing history needed', { userId: user.id });
      return [];
    }

    // For users who need a customer (have paid subscriptions), try to get Stripe data first
    let stripeCustomerId;
    let hasStripeInvoices = false;
    
    try {
      // Only try to get existing customer, don't force creation for billing history lookup
      stripeCustomerId = await getOrCreateCustomerForUser({ 
        userId: user.id, 
        email: user.email!, 
        supabaseClient: supabase,
        forceCreate: false // Don't create customer just to check billing history
      });
      
      if (stripeCustomerId) {
        console.debug('getBillingHistory: Found existing customer', {
          userId: user.id,
          stripeCustomerId
        });

        // Try to fetch Stripe invoices
        const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
        
        try {
          const invoices = await stripeAdmin.invoices.list({
            customer: stripeCustomerId,
            limit: 10, // Last 10 invoices
          });

          console.debug('getBillingHistory: Retrieved invoices from Stripe', {
            userId: user.id,
            stripeCustomerId,
            invoiceCount: invoices.data.length
          });

          if (invoices.data.length > 0) {
            hasStripeInvoices = true;
            
            // Transform Stripe invoice data to match our interface
            const billingHistory = invoices.data.map(invoice => ({
              id: invoice.id,
              date: new Date(invoice.created * 1000).toISOString(),
              amount: invoice.amount_paid || 0,
              status: invoice.status || 'unknown',
              invoice_url: invoice.hosted_invoice_url || '#',
              description: invoice.description || `Invoice for ${invoice.lines.data[0]?.description || 'subscription'}`,
            }));

            console.debug('getBillingHistory: Successfully transformed Stripe billing data', {
              userId: user.id,
              billingRecordCount: billingHistory.length
            });

            return billingHistory;
          }
        } catch (stripeError) {
          console.error('getBillingHistory: Stripe API error, falling back to local data', {
            userId: user.id,
            error: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
          });
        }
      }
    } catch (customerError) {
      console.error('getBillingHistory: Failed to get customer, falling back to local data', {
        userId: user.id,
        error: customerError instanceof Error ? customerError.message : 'Unknown customer error'
      });
    }

    // Fallback: Show local subscription data as billing history for newly upgraded users
    console.debug('getBillingHistory: No Stripe invoices found, showing local subscription data', {
      userId: user.id,
      hasStripeCustomer: !!stripeCustomerId
    });

    // Fetch subscription changes from local database as billing history
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        created,
        updated_at,
        status,
        stripe_price_id,
        prices:stripe_prices(
          unit_amount,
          interval,
          products:stripe_products(name)
        )
      `)
      .eq('user_id', user.id)
      .order('created', { ascending: false })
      .limit(10);

    if (subError) {
      console.error('getBillingHistory: Failed to fetch local subscriptions', {
        userId: user.id,
        error: subError.message
      });
      return [];
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.debug('getBillingHistory: No local subscriptions found', { userId: user.id });
      return [];
    }

    // Transform subscription data to billing history format
    const subscriptionHistory = subscriptions.map((sub: any, index: number) => {
      const price = sub.prices;
      const amount = price?.unit_amount || 0;
      const planName = price?.products?.name || 'Unknown Plan';
      
      // Create a description based on whether this is the first subscription or a change
      let description = `Subscription to ${planName}`;
      if (index < subscriptions.length - 1) {
        description = `Plan change to ${planName}`;
      }

      return {
        id: `sub_${sub.id}`,
        date: sub.updated_at || sub.created,
        amount: amount,
        status: sub.status === 'active' ? 'paid' : sub.status,
        invoice_url: '#', // No invoice available for local subscriptions
        description: description,
      };
    });

    console.debug('getBillingHistory: Successfully created billing history from local subscriptions', {
      userId: user.id,
      billingRecordCount: subscriptionHistory.length,
      fallbackReason: hasStripeInvoices ? 'none' : 'no-stripe-invoices'
    });

    return subscriptionHistory;

  } catch (error) {
    console.error('getBillingHistory error:', error);
    console.debug('getBillingHistory: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}

export async function getPaymentMethods() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error in getPaymentMethods:', authError);
      console.debug('getPaymentMethods: User authentication failed', {
        hasAuthError: !!authError,
        hasUser: !!user,
        errorCode: authError?.message
      });
      return [];
    }

    console.debug('getPaymentMethods: Looking up customer for user:', { userId: user.id });

    // Import helper functions
    const { getOrCreateCustomerForUser, userNeedsStripeCustomer } = await import('@/features/account/controllers/get-or-create-customer');
    
    // Check if user actually needs a Stripe customer (has paid subscriptions)
    const needsCustomer = await userNeedsStripeCustomer(user.id, supabase);
    
    if (!needsCustomer) {
      console.debug('getPaymentMethods: User is on free plan, no payment methods needed', { userId: user.id });
      return [];
    }
    
    let stripeCustomerId;
    try {
      // Only try to get existing customer, don't force creation for payment methods lookup
      stripeCustomerId = await getOrCreateCustomerForUser({ 
        userId: user.id, 
        email: user.email!, 
        supabaseClient: supabase,
        forceCreate: false // Don't create customer just to check payment methods
      });
      
      if (!stripeCustomerId) {
        console.debug('getPaymentMethods: No existing Stripe customer, returning empty array', { userId: user.id });
        return [];
      }
      
      console.debug('getPaymentMethods: Found existing customer', {
        userId: user.id,
        stripeCustomerId
      });
    } catch (customerError) {
      console.error('getPaymentMethods: Failed to get customer', {
        userId: user.id,
        error: customerError instanceof Error ? customerError.message : 'Unknown customer error',
        stack: customerError instanceof Error ? customerError.stack : undefined
      });
      // Return empty array instead of failing completely
      return [];
    }

    console.debug('getPaymentMethods: Found customer, fetching payment methods', {
      userId: user.id,
      stripeCustomerId
    });

    // Import stripeAdmin to fetch real payment method data
    const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
    
    // Fetch payment methods from Stripe
    const paymentMethods = await stripeAdmin.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    console.debug('getPaymentMethods: Retrieved payment methods from Stripe', {
      userId: user.id,
      stripeCustomerId,
      paymentMethodCount: paymentMethods.data.length
    });

    // Get the customer's default payment method
    const customer = await stripeAdmin.customers.retrieve(stripeCustomerId);
    const defaultPaymentMethodId = !customer.deleted ? customer.invoice_settings?.default_payment_method : null;

    console.debug('getPaymentMethods: Retrieved customer default payment method', {
      userId: user.id,
      stripeCustomerId,
      defaultPaymentMethodId,
      customerDeleted: customer.deleted
    });

    // Transform Stripe payment method data to match our interface
    const transformedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card?.brand || '',
        last4: pm.card?.last4 || '',
        exp_month: pm.card?.exp_month || 0,
        exp_year: pm.card?.exp_year || 0,
      },
      is_default: pm.id === defaultPaymentMethodId,
    }));

    console.debug('getPaymentMethods: Successfully transformed payment methods', {
      userId: user.id,
      transformedCount: transformedPaymentMethods.length,
      defaultCount: transformedPaymentMethods.filter(pm => pm.is_default).length
    });

    return transformedPaymentMethods;
  } catch (error) {
    console.error('getPaymentMethods error:', error);
    console.debug('getPaymentMethods: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}