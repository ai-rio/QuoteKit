'use server';

import { redirect } from 'next/navigation';

import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { getSession } from '@/features/account/controllers/get-session';
import { Price } from '@/features/pricing/types';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

export async function createCheckoutAction({ price }: { price: Price }) {
  // DEBUG: Log immediately at function start
  console.error('🚨 CHECKOUT ACTION CALLED!');
  console.error('🚨 Price object type check:', {
    hasType: 'type' in price,
    typeValue: price.type,
    hasInterval: 'interval' in price,
    intervalValue: price.interval,
    recurringInterval: price.recurring_interval
  });
  
  // DEBUG: Log the price object to understand the issue
  console.error('🔍 DEBUG: Price object passed to createCheckoutAction:', {
    id: price.id,
    stripe_price_id: price.stripe_price_id,
    recurring_interval: price.recurring_interval,
    interval: price.interval,
    type: price.type,
    unit_amount: price.unit_amount,
    active: price.active,
    full_price_object: price
  });

  // 1. FIRST: Check if user is authenticated - redirect to signup if not
  const session = await getSession();

  if (!session?.user) {
    console.log('🔐 User not authenticated, redirecting to signup with plan info');
    
    // Create search params to preserve plan selection during signup
    const searchParams = new URLSearchParams();
    searchParams.set('plan', price.stripe_price_id);
    searchParams.set('amount', price.unit_amount.toString());
    searchParams.set('interval', price.interval || 'one_time');
    searchParams.set('type', price.type || 'one_time');
    
    const signupUrl = `${getURL()}/signup?${searchParams.toString()}`;
    console.log('🔗 Redirecting to:', signupUrl);
    
    return redirect(signupUrl);
  }

  if (!session.user.email) {
    throw Error('Could not get email');
  }

  console.log('✅ User is authenticated, proceeding with subscription creation');

  // 2. Check if this is a free plan (unit_amount = 0)
  if (price.unit_amount === 0) {
    console.log('🆓 Processing free plan signup - bypassing Stripe payment collection');
    
    try {
      // For free plans, create a database-only subscription without going through Stripe
      const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
      
      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabaseAdminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing'])
        .single();

      if (existingSubscription) {
        console.log('ℹ️ User already has active subscription, redirecting to account');
        return redirect(`${getURL()}/account?message=already_subscribed`);
      }

      // Create a local subscription record for the free plan (using updated schema)
      const subscriptionData = {
        user_id: session.user.id,
        status: 'active',
        price_id: price.id,
        // For free plans, we don't need Stripe IDs (now these columns exist)
        stripe_subscription_id: null,
        stripe_customer_id: null,
        current_period_start: new Date().toISOString(),
        current_period_end: null, // Free plans don't expire
        created: new Date().toISOString(),
        trial_start: null,
        trial_end: null,
        cancel_at: null,
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null
      };

      const { error: subscriptionError } = await supabaseAdminClient
        .from('subscriptions')
        .insert([subscriptionData]);

      if (subscriptionError) {
        console.error('❌ Failed to create free subscription:', subscriptionError);
        throw new Error(`Failed to create free subscription: ${subscriptionError.message}`);
      }

      console.log('✅ Free plan subscription created successfully');
      return redirect(`${getURL()}/account?subscription=created&plan=free`);
      
    } catch (error) {
      console.error('❌ Free plan signup failed:', error);
      throw new Error(`Free plan signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 3. For paid plans, validate price is active before proceeding
  if (price.active === false) {
    console.error('❌ ERROR: Attempting to create checkout with inactive price:', price.stripe_price_id);
    throw new Error(`Price ${price.stripe_price_id} is inactive and cannot be used for checkout. Please contact support or try refreshing the page.`);
  }

  // Additional validation: Verify price exists in Stripe before creating checkout
  try {
    const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    
    // Get Stripe config to validate price status
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (configData?.value) {
      const stripeConfig = configData.value as { secret_key: string; mode: 'test' | 'live' };
      const stripe = createStripeAdminClient(stripeConfig);
      
      // Verify price is still active in Stripe
      const stripePrice = await stripe.prices.retrieve(price.stripe_price_id);
      
      if (!stripePrice.active) {
        console.error('❌ ERROR: Price is inactive in Stripe:', {
          price_id: price.stripe_price_id,
          stripe_active: stripePrice.active,
          db_active: price.active
        });
        throw new Error(`Price ${price.stripe_price_id} is no longer active in Stripe. Please try a different plan or contact support.`);
      }
      
      console.log('✅ Price validation passed - price is active in both database and Stripe');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('inactive')) {
      throw error; // Re-throw our custom validation errors
    }
    console.warn('⚠️ Could not validate price in Stripe (proceeding anyway):', error);
  }

  // 4. Retrieve or create the customer in Stripe for paid plans
  const customer = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email,
  });

  // For paid plans, use Stripe Checkout
  const checkoutMode = price.recurring_interval ? 'subscription' : 'payment';
  console.log(`🔍 DEBUG: Checkout mode determined: ${checkoutMode} (recurring_interval: ${price.recurring_interval})`);
  console.log(`🔍 DEBUG: About to create Stripe checkout with mode: ${checkoutMode}`);

  try {
    // 5. Create a checkout session in Stripe
    const checkoutSession = await stripeAdmin.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer,
      customer_update: {
        address: 'auto',
      },
      line_items: [
        {
          price: price.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: checkoutMode,
      allow_promotion_codes: true,
      success_url: `${getURL()}/account`,
      cancel_url: `${getURL()}/pricing`,
    });

    if (!checkoutSession || !checkoutSession.url) {
      throw Error('checkoutSession is not defined');
    }

    // 6. Redirect to checkout url
    redirect(checkoutSession.url);
  } catch (error) {
    console.error('❌ Checkout session creation failed:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      priceId: price.stripe_price_id,
      customer,
      checkoutMode
    });
    
    // Enhanced error message for inactive price
    if (error instanceof Error && error.message.includes('inactive')) {
      throw new Error(`This pricing plan is currently unavailable (${price.stripe_price_id}). Please try a different plan or contact support.`);
    }
    
    throw error;
  }
}
