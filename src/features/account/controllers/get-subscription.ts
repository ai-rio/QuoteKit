import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getSubscription() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error in getSubscription:', authError);
      return null;
    }

    // Query subscriptions filtered by the current user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .maybeSingle();

    if (subError) {
      console.error('Subscription query error:', subError);
      return null;
    }

    if (!subscription) {
      console.log('No active subscription found for user:', user.id);
      return null;
    }

    // Check if price_id exists
    if (!subscription.price_id) {
      console.log('Subscription has no price_id:', subscription.id);
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
      // Return subscription with null price data if price lookup fails
      return {
        ...subscription,
        prices: null
      };
    }

    if (!priceData) {
      console.log('No price data found for price_id:', subscription.price_id);
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
    }

    // Transform price data to match the expected type (same as in get-products.ts)
    const transformedPriceData = {
      ...priceData,
      interval: priceData.recurring_interval, // Map recurring_interval to interval for compatibility
      type: priceData.recurring_interval ? 'recurring' as const : 'one_time' as const, // Add type field based on recurring_interval
      products: productData || null // Add the product data
    };

    // Combine the data
    return {
      ...subscription,
      prices: transformedPriceData
    };
  } catch (error) {
    console.error('getSubscription function error:', error);
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
      return [];
    }

    // Get the user's customer record to find their Stripe customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (customerError || !customerData?.stripe_customer_id) {
      console.log('No customer record found for user:', user.id);
      return [];
    }

    // Import stripeAdmin to fetch real invoice data
    const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
    
    // Fetch invoices from Stripe
    const invoices = await stripeAdmin.invoices.list({
      customer: customerData.stripe_customer_id,
      limit: 10, // Last 10 invoices
    });

    // Transform Stripe invoice data to match our interface
    return invoices.data.map(invoice => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000).toISOString(),
      amount: invoice.amount_paid || 0,
      status: invoice.status || 'unknown',
      invoice_url: invoice.hosted_invoice_url || '#',
      description: invoice.description || `Invoice for ${invoice.lines.data[0]?.description || 'subscription'}`,
    }));
  } catch (error) {
    console.error('getBillingHistory error:', error);
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
      return [];
    }

    // Get the user's customer record to find their Stripe customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (customerError || !customerData?.stripe_customer_id) {
      console.log('No customer record found for user:', user.id);
      return [];
    }

    // Import stripeAdmin to fetch real payment method data
    const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
    
    // Fetch payment methods from Stripe
    const paymentMethods = await stripeAdmin.paymentMethods.list({
      customer: customerData.stripe_customer_id,
      type: 'card',
    });

    // Get the customer's default payment method
    const customer = await stripeAdmin.customers.retrieve(customerData.stripe_customer_id);
    const defaultPaymentMethodId = !customer.deleted ? customer.invoice_settings?.default_payment_method : null;

    // Transform Stripe payment method data to match our interface
    return paymentMethods.data.map(pm => ({
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
  } catch (error) {
    console.error('getPaymentMethods error:', error);
    return [];
  }
}