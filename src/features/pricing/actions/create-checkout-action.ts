'use server';

import { redirect } from 'next/navigation';

import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { getSession } from '@/features/account/controllers/get-session';
import { createFreePlanSubscription } from '@/features/account/controllers/subscription-helpers';
import { Price } from '@/features/pricing/types';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

export async function createCheckoutAction({ price }: { price: Price }) {
  // DEBUG: Log immediately at function start
  console.log('🚨 CHECKOUT ACTION CALLED - Analyzing price object');
  console.log('🔍 Price object analysis:', {
    id: price.id, // This is the Stripe price ID
    unit_amount: price.unit_amount,
    currency: price.currency,
    interval: price.interval, // Use interval instead of recurring_interval
    type: price.type,
    active: price.active,
    // Validation checks
    hasInterval: !!price.interval,
    hasType: !!price.type,
    isSubscription: !!price.interval,
    isFree: (price.unit_amount ?? 0) === 0
  });

  // 1. FIRST: Check if user is authenticated - redirect to signup if not
  const session = await getSession();

  if (!session?.user) {
    console.log('🔐 User not authenticated, redirecting to signup with plan info');
    
    // Create search params to preserve plan selection during signup
    const searchParams = new URLSearchParams();
    searchParams.set('plan', price.id);
    searchParams.set('amount', (price.unit_amount ?? 0).toString());
    searchParams.set('interval', price.interval || 'one_time');
    searchParams.set('type', price.type || 'one_time');
    
    const signupUrl = `${getURL()}/signup?${searchParams.toString()}`;
    console.log('🔗 Redirecting to:', signupUrl);
    
    redirect(signupUrl);
  }

  if (!session.user.email) {
    throw Error('Could not get email');
  }

  console.log('✅ User is authenticated, proceeding with subscription creation');

  // 2. Check if this is a free plan (unit_amount = 0)
  if (price.unit_amount === 0) {
    console.log('🆓 Processing free plan signup - bypassing Stripe payment collection');
    
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
      redirect(`${getURL()}/account?message=already_subscribed`);
    }

    // Create free plan subscription using robust helper function
    try {
      await createFreePlanSubscription(session.user.id);
    } catch (error) {
      console.error('❌ Failed to create free subscription:', error);
      throw new Error(`Failed to create free subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    redirect(`${getURL()}/account?subscription=created&plan=free`);
  }

  // 3. For paid plans, validate price is active before proceeding
  if (price.active === false) {
    console.error('❌ ERROR: Attempting to create checkout with inactive price:', price.id);
    throw new Error(`Price ${price.id} is inactive and cannot be used for checkout. Please contact support or try refreshing the page.`);
  }

  // Get Stripe configuration and initialize admin client
  const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
  const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');
  
  // Get Stripe config from environment variables
  const secretKey = process.env.STRIPE_SECRET_KEY;
  let stripeConfig: any = null;

  if (secretKey) {
    stripeConfig = {
      secret_key: secretKey,
      mode: process.env.NODE_ENV === 'production' ? 'live' : 'test'
    };
  } else {
    throw new Error('Stripe configuration not found. Please check environment variables.');
  }

  if (!stripeConfig?.secret_key) {
    throw new Error('Stripe not configured - cannot create checkout session');
  }

  const stripeAdmin = createStripeAdminClient(stripeConfig);

  // Additional validation: Verify price exists in Stripe before creating checkout
  try {
    // Verify price is still active in Stripe
    const stripePrice = await stripeAdmin.prices.retrieve(price.id);
    
    if (!stripePrice.active) {
      console.error('❌ ERROR: Price is inactive in Stripe:', {
        price_id: price.id,
        stripe_active: stripePrice.active,
        db_active: price.active
      });
      throw new Error(`Price ${price.id} is no longer active in Stripe. Please try a different plan or contact support.`);
    }
    
    console.log('✅ Price validation passed - price is active in both database and Stripe');
  } catch (error) {
    if (error instanceof Error && error.message.includes('inactive')) {
      throw error; // Re-throw our custom validation errors
    }
    console.warn('⚠️ Could not validate price in Stripe (proceeding anyway):', error);
  }

  // 4. Check if user already has an active subscription for paid plans
  const { data: existingSubscription } = await supabaseAdminClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .in('status', ['active', 'trialing'])
    .single();

  if (existingSubscription) {
    console.log('ℹ️ User already has active subscription, checking if this is a plan change');
    
    // If trying to select the same plan, redirect to account
    if (existingSubscription.stripe_price_id === price.id) {
      console.log('ℹ️ User trying to select same plan, redirecting to account');
      redirect(`${getURL()}/account?message=same_plan`);
    }
    
    // If different plan, this should be handled by the plan change functionality
    console.log('ℹ️ User trying to change plan, redirecting to account for plan change');
    redirect(`${getURL()}/account?message=use_plan_change&target_price=${price.id}`);
  }

  // 5. Retrieve or create the customer in Stripe for paid plans
  const customer = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email,
  });

  // Also check if user has active subscriptions in Stripe that aren't synced to database
  try {
    // Check for active subscriptions in Stripe
    const stripeSubscriptions = await stripeAdmin.subscriptions.list({
      customer,
      status: 'active',
      limit: 10
    });
    
    if (stripeSubscriptions.data.length > 0) {
      console.log(`⚠️ Found ${stripeSubscriptions.data.length} active Stripe subscription(s) not synced to database. Triggering sync.`);
      
      // Import and trigger manual sync
      const { manualSyncSubscription } = await import('@/features/account/controllers/manual-sync-subscription');
      
      try {
        const syncResult = await manualSyncSubscription(customer);
        console.log('✅ Subscription sync completed:', syncResult);
        
        // After sync, redirect to account page
        redirect(`${getURL()}/account?message=subscription_synced`);
      } catch (syncError) {
        console.error('❌ Failed to sync subscription:', syncError);
        // Continue with checkout creation despite sync failure
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not check Stripe subscriptions (proceeding with checkout):', error);
  }

  // CRITICAL FIX: Determine checkout mode using interval field
  const isSubscription = !!price.interval;
  const checkoutMode = isSubscription ? 'subscription' : 'payment';
  
  console.log('🔍 CHECKOUT MODE DETERMINATION:', {
    interval: price.interval,
    type: price.type,
    isSubscription,
    checkoutMode,
    decision_logic: 'Using interval presence to determine mode'
  });
  
  // Additional validation for subscription mode
  if (checkoutMode === 'subscription' && !price.interval) {
    console.error('❌ ERROR: Subscription mode selected but no interval found:', {
      interval: price.interval,
      type: price.type
    });
    throw new Error('Invalid price configuration: subscription mode requires interval');
  }

  // 6. Create a checkout session in Stripe
  console.log('🚀 Creating Stripe checkout session with:', {
    mode: checkoutMode,
    price_id: price.id,
    customer,
    success_url: `${getURL()}/account`,
    cancel_url: `${getURL()}/pricing`
  });
  
  const checkoutSession = await stripeAdmin.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer,
    customer_update: {
      address: 'auto',
    },
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    mode: checkoutMode,
    allow_promotion_codes: true,
    success_url: `${getURL()}/account`,
    cancel_url: `${getURL()}/pricing`,
  });
  
  console.log('✅ Stripe checkout session created successfully:', {
    session_id: checkoutSession.id,
    url: checkoutSession.url,
    mode: checkoutSession.mode,
    customer: checkoutSession.customer
  });

  if (!checkoutSession || !checkoutSession.url) {
    throw Error('checkoutSession is not defined');
  }

  // 7. Redirect to checkout url
  redirect(checkoutSession.url);
}
