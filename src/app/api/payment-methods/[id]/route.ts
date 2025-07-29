import { NextRequest, NextResponse } from 'next/server';

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe configuration - try database first, then environment variables
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;
    
    let stripe;
    if (stripeConfig?.secret_key) {
      // Use database configuration
      stripe = createStripeAdminClient({
        secret_key: stripeConfig.secret_key,
        mode: stripeConfig.mode || 'test'
      });
    } else if (process.env.STRIPE_SECRET_KEY) {
      // Fallback to environment variables
      stripe = createStripeAdminClient({
        secret_key: process.env.STRIPE_SECRET_KEY,
        mode: 'test' // Default to test mode for env vars
      });
    } else {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    // Get customer ID from database
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify that the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    
    if (paymentMethod.customer !== customer.stripe_customer_id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Check if this payment method is being used by any active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'active',
    });

    const isUsedByActiveSubscription = subscriptions.data.some(
      sub => sub.default_payment_method === id
    );

    if (isUsedByActiveSubscription) {
      return NextResponse.json({ 
        error: 'Cannot delete payment method that is used by an active subscription' 
      }, { status: 400 });
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(id);

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Update default payment method
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe configuration - try database first, then environment variables
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;
    
    let stripe;
    if (stripeConfig?.secret_key) {
      // Use database configuration
      stripe = createStripeAdminClient({
        secret_key: stripeConfig.secret_key,
        mode: stripeConfig.mode || 'test'
      });
    } else if (process.env.STRIPE_SECRET_KEY) {
      // Fallback to environment variables
      stripe = createStripeAdminClient({
        secret_key: process.env.STRIPE_SECRET_KEY,
        mode: 'test' // Default to test mode for env vars
      });
    } else {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    // Get customer ID from database
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify that the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    
    if (paymentMethod.customer !== customer.stripe_customer_id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Update customer's default payment method
    await stripe.customers.update(customer.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: id,
      },
    });

    // Update all active subscriptions to use this payment method
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'active',
    });

    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.update(subscription.id, {
        default_payment_method: id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated successfully'
    });

  } catch (error) {
    console.error('Error updating default payment method:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}