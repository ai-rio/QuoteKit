'use server';

import { revalidatePath } from 'next/cache';

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface PaymentMethodResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Add a new payment method for the authenticated user
 */
export async function addPaymentMethod(data: {
  billing_name: string;
  set_as_default?: boolean;
}): Promise<PaymentMethodResult> {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    if (!data.billing_name?.trim()) {
      return { success: false, error: 'Billing name is required' };
    }

    // Get Stripe configuration
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;
    
    let stripe;
    if (stripeConfig?.secret_key) {
      stripe = createStripeAdminClient({
        secret_key: stripeConfig.secret_key,
        mode: stripeConfig.mode || 'test'
      });
    } else if (process.env.STRIPE_SECRET_KEY) {
      stripe = createStripeAdminClient({
        secret_key: process.env.STRIPE_SECRET_KEY,
        mode: 'test'
      });
    } else {
      return { success: false, error: 'Stripe not configured' };
    }

    // Get or create customer
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = customer?.stripe_customer_id;

    if (!customerId) {
      // Create new customer in Stripe
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: data.billing_name.trim(),
        metadata: {
          userId: user.id,
        },
      });

      // Save customer ID to database
      await supabase
        .from('stripe_customers')
        .insert([{ id: user.id, stripe_customer_id: newCustomer.id }]);

      customerId = newCustomer.id;
    }

    // Create setup intent for adding payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        user_id: user.id,
        billing_name: data.billing_name.trim(),
        set_as_default: data.set_as_default ? 'true' : 'false',
      },
    });

    return {
      success: true,
      data: {
        client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id,
      },
    };

  } catch (error) {
    console.error('Error in addPaymentMethod:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add payment method',
    };
  }
}

/**
 * Set a payment method as the default for the authenticated user
 */
export async function setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethodResult> {
  try {
    // Validate input
    if (!paymentMethodId?.trim()) {
      return { success: false, error: 'Payment method ID is required' };
    }

    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get Stripe configuration
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;
    
    let stripe;
    if (stripeConfig?.secret_key) {
      stripe = createStripeAdminClient({
        secret_key: stripeConfig.secret_key,
        mode: stripeConfig.mode || 'test'
      });
    } else if (process.env.STRIPE_SECRET_KEY) {
      stripe = createStripeAdminClient({
        secret_key: process.env.STRIPE_SECRET_KEY,
        mode: 'test'
      });
    } else {
      return { success: false, error: 'Stripe not configured' };
    }

    // Get customer ID from database
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return { success: false, error: 'Customer not found' };
    }

    // Verify that the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (paymentMethod.customer !== customer.stripe_customer_id) {
      return { success: false, error: 'Payment method not found' };
    }

    // Update customer's default payment method
    await stripe.customers.update(customer.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update all active subscriptions to use this payment method
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'active',
    });

    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.update(subscription.id, {
        default_payment_method: paymentMethodId,
      });
    }

    // Update database to reflect the new default payment method
    try {
      // First, unset all other payment methods as default for this customer
      await supabase
        .from('payment_methods')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', customer.stripe_customer_id);

      // Then set this payment method as default
      await supabase
        .from('payment_methods')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', paymentMethodId);

    } catch (dbError) {
      console.error('Failed to update payment method default status in database:', dbError);
      // Don't fail the request - Stripe update succeeded
    }

    // Revalidate the account page to show updated data
    revalidatePath('/account');

    return { success: true };

  } catch (error) {
    console.error('Error in setDefaultPaymentMethod:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set default payment method',
    };
  }
}

/**
 * Delete a payment method for the authenticated user
 */
export async function deletePaymentMethod(paymentMethodId: string): Promise<PaymentMethodResult> {
  try {
    // Validate input
    if (!paymentMethodId?.trim()) {
      return { success: false, error: 'Payment method ID is required' };
    }

    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get Stripe configuration
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;
    
    let stripe;
    if (stripeConfig?.secret_key) {
      stripe = createStripeAdminClient({
        secret_key: stripeConfig.secret_key,
        mode: stripeConfig.mode || 'test'
      });
    } else if (process.env.STRIPE_SECRET_KEY) {
      stripe = createStripeAdminClient({
        secret_key: process.env.STRIPE_SECRET_KEY,
        mode: 'test'
      });
    } else {
      return { success: false, error: 'Stripe not configured' };
    }

    // Get customer ID from database
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return { success: false, error: 'Customer not found' };
    }

    // Verify that the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (paymentMethod.customer !== customer.stripe_customer_id) {
      return { success: false, error: 'Payment method not found' };
    }

    // Check if this payment method is being used by any active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'active',
    });

    const isUsedByActiveSubscription = subscriptions.data.some(
      sub => sub.default_payment_method === paymentMethodId
    );

    if (isUsedByActiveSubscription) {
      return { 
        success: false, 
        error: 'Cannot delete payment method that is used by an active subscription. Please set a different default payment method first.' 
      };
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    // Remove from database
    try {
      await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

    } catch (dbError) {
      console.error('Failed to remove payment method from database:', dbError);
      // Don't fail the request - Stripe deletion succeeded
    }

    // Revalidate the account page to show updated data
    revalidatePath('/account');

    return { success: true };

  } catch (error) {
    console.error('Error in deletePaymentMethod:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete payment method',
    };
  }
}

/**
 * Get payment methods for the authenticated user
 */
export async function getPaymentMethods(): Promise<PaymentMethodResult> {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get Stripe configuration
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;
    
    let stripe;
    if (stripeConfig?.secret_key) {
      stripe = createStripeAdminClient({
        secret_key: stripeConfig.secret_key,
        mode: stripeConfig.mode || 'test'
      });
    } else if (process.env.STRIPE_SECRET_KEY) {
      stripe = createStripeAdminClient({
        secret_key: process.env.STRIPE_SECRET_KEY,
        mode: 'test'
      });
    } else {
      return { success: false, error: 'Stripe not configured' };
    }

    // Get customer ID from database
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return { success: true, data: [] };
    }

    // Try to get payment methods from database first (cached)
    const { data: cachedPaymentMethods, error: dbError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!dbError && cachedPaymentMethods && cachedPaymentMethods.length > 0) {
      // Format cached payment methods for frontend
      const formattedPaymentMethods = cachedPaymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card_data ? {
          brand: pm.card_data.brand || 'unknown',
          country: pm.card_data.country || '',
          exp_month: pm.card_data.exp_month || 0,
          exp_year: pm.card_data.exp_year || 0,
          last4: pm.card_data.last4 || '****',
          funding: pm.card_data.funding || 'unknown'
        } : undefined,
        created: Math.floor(new Date(pm.created_at).getTime() / 1000),
        customer: pm.stripe_customer_id,
        is_default: pm.is_default
      }));

      return {
        success: true,
        data: formattedPaymentMethods,
      };
    }

    // Fallback to Stripe API if no cached data
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripe_customer_id,
      type: 'card',
    });

    // Cache payment methods to database for future use
    if (paymentMethods.data.length > 0) {
      try {
        for (const pm of paymentMethods.data) {
          const cardData = pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            country: pm.card.country || '',
            funding: pm.card.funding || 'unknown'
          } : {};

          await supabase
            .from('payment_methods')
            .upsert({
              id: pm.id,
              user_id: user.id,
              stripe_customer_id: customer.stripe_customer_id,
              type: pm.type,
              card_data: cardData,
              is_default: false,
              metadata: pm.metadata || {},
              created_at: new Date(pm.created * 1000).toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
        }
      } catch (cacheError) {
        console.error('Failed to cache payment methods:', cacheError);
      }
    }

    // Format payment methods for frontend
    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        country: pm.card.country || '',
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
        last4: pm.card.last4,
        funding: pm.card.funding || 'unknown'
      } : undefined,
      created: pm.created,
      customer: pm.customer as string
    }));

    return {
      success: true,
      data: formattedPaymentMethods,
    };

  } catch (error) {
    console.error('Error in getPaymentMethods:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment methods',
    };
  }
}
