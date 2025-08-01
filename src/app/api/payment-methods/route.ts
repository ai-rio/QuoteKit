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
  is_default?: boolean;
}

// Get payment methods for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/payment-methods - Starting...');
    
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('❌ Authentication failed:', error?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Use environment variable for Stripe (bypass database config)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.log('❌ STRIPE_SECRET_KEY not found in environment');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = createStripeAdminClient({
      secret_key: stripeSecretKey,
      mode: 'test'
    });

    console.log('✅ Stripe client created');

    // Get or create customer in Stripe
    let customerId: string;
    
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        console.log('✅ Found existing Stripe customer:', customerId);
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = newCustomer.id;
        console.log('✅ Created new Stripe customer:', customerId);
      }
    } catch (customerError) {
      console.error('❌ Customer creation/retrieval failed:', customerError);
      return NextResponse.json({ error: 'Failed to get customer' }, { status: 500 });
    }

    // Get payment methods from Stripe
    console.log('🔄 Fetching payment methods from Stripe...');
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    console.log(`✅ Found ${paymentMethods.data.length} payment methods in Stripe`);

    // Get customer's default payment method
    let defaultPaymentMethodId: string | null = null;
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (typeof customer !== 'string' && customer.invoice_settings?.default_payment_method) {
        defaultPaymentMethodId = customer.invoice_settings.default_payment_method as string;
      }
    } catch (error) {
      console.warn('⚠️ Could not get default payment method:', error);
    }

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
      customer: pm.customer as string,
      is_default: pm.id === defaultPaymentMethodId
    }));

    console.log('✅ Formatted payment methods for frontend');

    return NextResponse.json({
      success: true,
      data: formattedPaymentMethods,
      source: 'stripe-direct'
    });

  } catch (error) {
    console.error('💥 Error in GET /api/payment-methods:', error);
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
    console.log('🔄 POST /api/payment-methods - Starting...');
    
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('❌ Authentication failed:', error?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    console.log('📝 Request body:', body);

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

    // Get or create customer
    let customerId: string;
    
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        console.log('✅ Found existing Stripe customer:', customerId);
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: body.billing_name || user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = newCustomer.id;
        console.log('✅ Created new Stripe customer:', customerId);
      }
    } catch (customerError) {
      console.error('❌ Customer creation/retrieval failed:', customerError);
      return NextResponse.json({ error: 'Failed to get customer' }, { status: 500 });
    }

    // Create setup intent for adding payment method
    console.log('🔄 Creating setup intent...');
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        user_id: user.id,
        billing_name: body.billing_name || user.email,
        set_as_default: body.set_as_default ? 'true' : 'false',
      },
    });

    console.log('✅ Setup intent created:', setupIntent.id);

    return NextResponse.json({
      success: true,
      data: {
        client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id,
      }
    });

  } catch (error) {
    console.error('💥 Error in POST /api/payment-methods:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}