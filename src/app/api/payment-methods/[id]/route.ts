import { NextRequest, NextResponse } from 'next/server';

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔄 DELETE /api/payment-methods/' + id + ' - Starting...');
    
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('❌ Authentication failed:', error?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use environment variable for Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.log('❌ STRIPE_SECRET_KEY not found in environment');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = createStripeAdminClient({
      secret_key: stripeSecretKey,
      mode: 'test'
    });

    // Get customer by email
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length === 0) {
      console.log('❌ Customer not found');
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerId = existingCustomers.data[0].id;
    console.log('✅ Found customer:', customerId);

    // Verify that the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    
    if (paymentMethod.customer !== customerId) {
      console.log('❌ Payment method does not belong to customer');
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Check if this payment method is being used by any active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    const isUsedByActiveSubscription = subscriptions.data.some(
      sub => sub.default_payment_method === id
    );

    if (isUsedByActiveSubscription) {
      console.log('❌ Payment method is used by active subscription');
      return NextResponse.json({ 
        error: 'Cannot delete payment method that is used by an active subscription' 
      }, { status: 400 });
    }

    // Detach payment method from customer
    console.log('🔄 Detaching payment method from customer...');
    await stripe.paymentMethods.detach(id);

    console.log('✅ Payment method deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('💥 Error deleting payment method:', error);
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
    console.log('🔄 PATCH /api/payment-methods/' + id + ' - Starting...');
    
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('❌ Authentication failed:', error?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use environment variable for Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.log('❌ STRIPE_SECRET_KEY not found in environment');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = createStripeAdminClient({
      secret_key: stripeSecretKey,
      mode: 'test'
    });

    // Get customer by email
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length === 0) {
      console.log('❌ Customer not found');
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerId = existingCustomers.data[0].id;
    console.log('✅ Found customer:', customerId);

    // Verify that the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    
    if (paymentMethod.customer !== customerId) {
      console.log('❌ Payment method does not belong to customer');
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Update customer's default payment method
    console.log('🔄 Setting default payment method...');
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: id,
      },
    });

    // Update all active subscriptions to use this payment method
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    console.log(`🔄 Updating ${subscriptions.data.length} active subscriptions...`);
    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.update(subscription.id, {
        default_payment_method: id,
      });
    }

    console.log('✅ Default payment method updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated successfully'
    });

  } catch (error) {
    console.error('💥 Error updating default payment method:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}