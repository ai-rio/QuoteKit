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

    // Query subscriptions filtered by the current user - get the most recent active subscription
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created', { ascending: false })
      .limit(1);

    if (subError) {
      console.error('Subscription query error:', subError);
      console.debug('getSubscription: Database query failed', {
        userId: user.id,
        error: subError.message,
        code: subError.code
      });
      return null;
    }

    // Get the first (most recent) subscription
    const subscription = subscriptions?.[0];
    
    if (!subscription) {
      console.log('No active subscription found for user:', user.id);
      console.debug('getSubscription: No subscription found', {
        userId: user.id,
        searchStatuses: ['trialing', 'active']
      });
      return null;
    }

    console.debug('getSubscription: Found subscription', {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.price_id
    });

    // Check if price_id exists
    if (!subscription.price_id) {
      console.warn('Subscription has no price_id:', subscription.id);
      console.debug('getSubscription: Missing price_id', {
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
      .eq('stripe_price_id', subscription.price_id)
      .maybeSingle();

    if (priceError) {
      console.error('Price query error:', priceError);
      console.debug('getSubscription: Price lookup failed', {
        priceId: subscription.price_id,
        error: priceError.message
      });
      // Return subscription with null price data if price lookup fails
      return {
        ...subscription,
        prices: null
      };
    }

    if (!priceData) {
      console.warn('No price data found for price_id:', subscription.price_id);
      console.debug('getSubscription: Price not found in database', {
        priceId: subscription.price_id,
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
      priceId: subscription.price_id,
      hasProductData: !!productData
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

    // Get the user's customer record to find their Stripe customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (customerError || !customerData?.stripe_customer_id) {
      console.warn('No customer record found for user:', user.id);
      console.debug('getBillingHistory: Customer lookup failed', {
        userId: user.id,
        hasCustomerError: !!customerError,
        hasCustomerData: !!customerData,
        hasStripeCustomerId: !!customerData?.stripe_customer_id,
        errorCode: customerError?.code,
        errorMessage: customerError?.message
      });
      return [];
    }

    console.debug('getBillingHistory: Found customer, fetching invoices', {
      userId: user.id,
      stripeCustomerId: customerData.stripe_customer_id
    });

    // Import stripeAdmin to fetch real invoice data
    const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
    
    // Fetch invoices from Stripe
    const invoices = await stripeAdmin.invoices.list({
      customer: customerData.stripe_customer_id,
      limit: 10, // Last 10 invoices
    });

    console.debug('getBillingHistory: Retrieved invoices from Stripe', {
      userId: user.id,
      stripeCustomerId: customerData.stripe_customer_id,
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

    // Get the user's customer record to find their Stripe customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (customerError || !customerData?.stripe_customer_id) {
      console.warn('No customer record found for user:', user.id);
      console.debug('getPaymentMethods: Customer lookup failed', {
        userId: user.id,
        hasCustomerError: !!customerError,
        hasCustomerData: !!customerData,
        hasStripeCustomerId: !!customerData?.stripe_customer_id,
        errorCode: customerError?.code,
        errorMessage: customerError?.message
      });
      return [];
    }

    console.debug('getPaymentMethods: Found customer, fetching payment methods', {
      userId: user.id,
      stripeCustomerId: customerData.stripe_customer_id
    });

    // Import stripeAdmin to fetch real payment method data
    const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
    
    // Fetch payment methods from Stripe
    const paymentMethods = await stripeAdmin.paymentMethods.list({
      customer: customerData.stripe_customer_id,
      type: 'card',
    });

    console.debug('getPaymentMethods: Retrieved payment methods from Stripe', {
      userId: user.id,
      stripeCustomerId: customerData.stripe_customer_id,
      paymentMethodCount: paymentMethods.data.length
    });

    // Get the customer's default payment method
    const customer = await stripeAdmin.customers.retrieve(customerData.stripe_customer_id);
    const defaultPaymentMethodId = !customer.deleted ? customer.invoice_settings?.default_payment_method : null;

    console.debug('getPaymentMethods: Retrieved customer default payment method', {
      userId: user.id,
      stripeCustomerId: customerData.stripe_customer_id,
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