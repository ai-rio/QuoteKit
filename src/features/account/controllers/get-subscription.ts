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

    // CRITICAL FIX: Query subscriptions with proper priority logic
    // 1. Get all active/trialing subscriptions for the user
    // 2. Order by subscription type (paid first) then by creation date
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('stripe_price_id', { ascending: false, nullsFirst: false }) // Paid subscriptions first (non-null stripe_price_id)
      .order('created_at', { ascending: false }); // Then by creation date as tiebreaker

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
      stripeSubscriptionId: subscription.id,
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

    // Check if stripe_price_id exists
    if (!subscription.stripe_price_id) {
      console.warn('Subscription has no stripe_price_id:', subscription.id);
      console.debug('getSubscription: Missing stripe_price_id', {
        subscriptionId: subscription.id,
        subscriptionData: subscription
      });
      return {
        ...subscription,
        prices: null
      };
    }

    // Fetch the price data separately (same pattern as getProducts)
    const { data: priceData, error: priceError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('stripe_price_id', subscription.stripe_price_id)
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
      console.warn('No price data found for stripe_price_id:', subscription.stripe_price_id);
      console.debug('getSubscription: Price not found in database', {
        priceId: subscription.stripe_price_id,
        subscriptionId: subscription.id
      });
      return {
        ...subscription,
        prices: null
      };
    }

    // Fetch the product data separately
    const { data: productData, error: productError } = await supabase
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
    }

    // Transform price data to match the expected type (same as in get-products.ts)
    const transformedPriceData = {
      ...priceData,
      interval: priceData.recurring_interval, // Map recurring_interval to interval for compatibility
      type: priceData.recurring_interval ? 'recurring' as const : 'one_time' as const, // Add type field based on recurring_interval
      products: productData || null // Add the product data
    };

    console.debug('getSubscription: Successfully retrieved subscription data', {
      subscriptionId: subscription.id,
      priceId: subscription.stripe_price_id,
      hasProductData: !!productData,
      subscriptionType: subscription.stripe_price_id ? 'paid' : 'free'
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

    // Get the free plan price
    const { data: freePrice, error: priceError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('stripe_product_id', freeProduct.stripe_product_id)
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
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

    // Get or create customer using the enhanced helper that avoids PGRST116 errors
    const { getOrCreateCustomerForUser } = await import('@/features/account/controllers/get-or-create-customer');
    
    let stripeCustomerId;
    try {
      stripeCustomerId = await getOrCreateCustomerForUser({ 
        userId: user.id, 
        email: user.email!, 
        supabaseClient: supabase 
      });
      
      console.debug('getBillingHistory: Got/created customer', {
        userId: user.id,
        stripeCustomerId
      });
    } catch (customerError) {
      console.error('getBillingHistory: Failed to get/create customer', {
        userId: user.id,
        error: customerError instanceof Error ? customerError.message : 'Unknown error'
      });
      // Return empty array instead of failing completely
      return [];
    }

    console.debug('getBillingHistory: Found customer, fetching invoices', {
      userId: user.id,
      stripeCustomerId
    });

    // Import stripeAdmin to fetch real invoice data
    const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
    
    // Fetch invoices from Stripe
    const invoices = await stripeAdmin.invoices.list({
      customer: stripeCustomerId,
      limit: 10, // Last 10 invoices
    });

    console.debug('getBillingHistory: Retrieved invoices from Stripe', {
      userId: user.id,
      stripeCustomerId,
      invoiceCount: invoices.data.length
    });

    // Transform Stripe invoice data to match our interface
    const billingHistory = invoices.data.map(invoice => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000).toISOString(),
      amount: invoice.amount_paid || 0,
      status: invoice.status || 'unknown',
      invoice_url: invoice.hosted_invoice_url || '#',
      description: invoice.description || `Invoice for ${invoice.lines.data[0]?.description || 'subscription'}`,
    }));

    console.debug('getBillingHistory: Successfully transformed billing data', {
      userId: user.id,
      billingRecordCount: billingHistory.length
    });

    return billingHistory;
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

    // Get or create customer using the enhanced helper that avoids PGRST116 errors
    const { getOrCreateCustomerForUser } = await import('@/features/account/controllers/get-or-create-customer');
    
    let stripeCustomerId;
    try {
      stripeCustomerId = await getOrCreateCustomerForUser({ 
        userId: user.id, 
        email: user.email!, 
        supabaseClient: supabase 
      });
      
      console.debug('getPaymentMethods: Got/created customer', {
        userId: user.id,
        stripeCustomerId
      });
    } catch (customerError) {
      console.error('getPaymentMethods: Failed to get/create customer', {
        userId: user.id,
        error: customerError instanceof Error ? customerError.message : 'Unknown error'
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