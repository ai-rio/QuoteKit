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
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // First try to get payment methods from database (cached)
    const { data: cachedPaymentMethods, error: dbError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!dbError && cachedPaymentMethods && cachedPaymentMethods.length > 0) {
      console.log(`✅ Using cached payment methods (${cachedPaymentMethods.length} found)`);
      
      // Format cached payment methods for frontend
      const formattedPaymentMethods: PaymentMethod[] = cachedPaymentMethods.map(pm => ({
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

      return NextResponse.json({
        success: true,
        data: formattedPaymentMethods,
        source: 'database'
      });
    }

    console.log(`⚠️ No cached payment methods found, falling back to Stripe API`);

    // Fallback to Stripe API if no cached data
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripe_customer_id,
      type: 'card',
    });

    // Save payment methods to database for future use
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
              is_default: false, // We don't know which is default from Stripe list
              metadata: pm.metadata || {},
              created_at: new Date(pm.created * 1000).toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
        }
        console.log(`💾 Cached ${paymentMethods.data.length} payment methods to database`);
      } catch (cacheError) {
        console.error('Failed to cache payment methods:', cacheError);
        // Continue anyway - API still works
      }
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
      customer: pm.customer as string
    }));

    return NextResponse.json({
      success: true,
      data: formattedPaymentMethods,
      source: 'stripe'
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