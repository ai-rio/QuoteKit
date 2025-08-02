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
    
    // Enhanced environment logging
    console.log('🌍 Environment Check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    });
    
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('❌ Authentication failed:', error?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', { 
      userId: user.id, 
      email: user.email,
      emailDomain: user.email?.split('@')[1] 
    });

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

    // Get or create customer using the same method as subscription actions
    let customerId: string;
    
    try {
      // Use the same customer lookup method as subscription actions
      const { getOrCreateCustomerForUser } = await import('@/features/account/controllers/get-or-create-customer');
      
      customerId = await getOrCreateCustomerForUser({
        userId: user.id,
        email: user.email!,
        supabaseClient: supabase,
        forceCreate: true
      });
      
      console.log('✅ Got customer using consistent method:', customerId);
      
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

    console.log('✅ Formatted payment methods for frontend:', {
      totalMethods: formattedPaymentMethods.length,
      defaultMethodId: defaultPaymentMethodId,
      methodDetails: formattedPaymentMethods.map(pm => ({
        id: pm.id.substring(0, 8) + '...',
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        isDefault: pm.is_default,
        expired: pm.card ? new Date(pm.card.exp_year, pm.card.exp_month - 1) < new Date() : false
      }))
    });

    return NextResponse.json({
      success: true,
      data: formattedPaymentMethods,
      source: 'stripe-direct',
      debug: {
        customerId: customerId.substring(0, 8) + '...',
        defaultPaymentMethodId: defaultPaymentMethodId?.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      }
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

    // Get or create customer using the same method as subscription actions
    let customerId: string;
    
    try {
      // Use the same customer lookup method as subscription actions
      const { getOrCreateCustomerForUser } = await import('@/features/account/controllers/get-or-create-customer');
      
      customerId = await getOrCreateCustomerForUser({
        userId: user.id,
        email: user.email!,
        supabaseClient: supabase,
        forceCreate: true
      });
      
      console.log('✅ Got customer using consistent method:', customerId);
      
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