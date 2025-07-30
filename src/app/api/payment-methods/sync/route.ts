import { NextRequest, NextResponse } from 'next/server';

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// Sync payment methods for the authenticated user from Stripe to database
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
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    // Get customer ID from database
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json({
        success: true,
        message: 'No customer record found',
        synced: 0
      });
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripe_customer_id,
      type: 'card',
    });

    let syncedCount = 0;

    // Get customer's default payment method from Stripe
    const stripeCustomer = await stripe.customers.retrieve(customer.stripe_customer_id);
    const defaultPaymentMethodId = stripeCustomer.invoice_settings?.default_payment_method as string || null;

    // Save each payment method to database
    for (const pm of paymentMethods.data) {
      try {
        const cardData = pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
          country: pm.card.country || '',
          funding: pm.card.funding || 'unknown'
        } : {};

        const isDefault = defaultPaymentMethodId === pm.id;

        await supabase
          .from('payment_methods')
          .upsert({
            id: pm.id,
            user_id: user.id,
            stripe_customer_id: customer.stripe_customer_id,
            type: pm.type,
            card_data: cardData,
            is_default: isDefault,
            metadata: pm.metadata || {},
            created_at: new Date(pm.created * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync payment method ${pm.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} payment methods`,
      synced: syncedCount,
      total: paymentMethods.data.length
    });

  } catch (error) {
    console.error('Error syncing payment methods:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}