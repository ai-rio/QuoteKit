import { NextRequest, NextResponse } from 'next/server';

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    country: string;
    exp_month: number;
    exp_year: number;
    last4: string;
    funding: string;
  };
  created: number;
  customer: string;
}

// Get payment methods for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe configuration
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;

    if (!stripeConfig?.secret_key) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Get customer ID from database
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripe_customer_id,
      type: 'card',
    });

    // Format payment methods for frontend
    const formattedPaymentMethods: PaymentMethod[] = paymentMethods.data.map(pm => ({
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

    return NextResponse.json({
      success: true,
      data: formattedPaymentMethods
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Create a setup intent for adding a new payment method
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe configuration
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;

    if (!stripeConfig?.secret_key) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Get or create customer
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = customer?.stripe_customer_id;

    if (!customerId) {
      // Create new customer in Stripe
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      // Save customer ID to database
      await supabase
        .from('customers')
        .insert([{ id: user.id, stripe_customer_id: newCustomer.id }]);

      customerId = newCustomer.id;
    }

    // Create setup intent for adding payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // For future payments
    });

    return NextResponse.json({
      success: true,
      data: {
        client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id
      }
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}