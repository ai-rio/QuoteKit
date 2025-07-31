import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/features/account/controllers/get-session';
import { upsertUserSubscription } from '@/features/account/controllers/upsert-user-subscription';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔍 Debug: Checking subscriptions for user ${session.user.id}`);

    // Get user's customer ID
    const { data: customer } = await supabaseAdminClient
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }

    console.log(`🔍 Debug: Found customer ${customer.stripe_customer_id}`);

    // Get all subscriptions for this customer from Stripe
    const subscriptions = await stripeAdmin.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'all',
      limit: 10
    });

    console.log(`🔍 Debug: Found ${subscriptions.data.length} subscriptions in Stripe`);

    // Get existing subscriptions in database
    const { data: dbSubscriptions } = await supabaseAdminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id);

    console.log(`🔍 Debug: Found ${dbSubscriptions?.length || 0} subscriptions in database`);

    // Find active subscription that's missing from database
    const activeStripeSubscription = subscriptions.data.find(sub => sub.status === 'active');
    const missingSubscription = activeStripeSubscription && 
      !dbSubscriptions?.find(dbSub => dbSub.stripe_subscription_id === activeStripeSubscription.id);

    if (missingSubscription && activeStripeSubscription) {
      console.log(`🔄 Syncing missing active subscription: ${activeStripeSubscription.id}`);
      
      await upsertUserSubscription({
        subscriptionId: activeStripeSubscription.id,
        customerId: customer.stripe_customer_id,
        isCreateAction: true
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Missing subscription synced successfully',
        syncedSubscription: activeStripeSubscription.id
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'No missing subscriptions found',
      stripeSubscriptions: subscriptions.data.length,
      dbSubscriptions: dbSubscriptions?.length || 0
    });

  } catch (error) {
    console.error('Debug subscription error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}