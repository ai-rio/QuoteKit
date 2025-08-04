import { NextResponse } from 'next/server';

import { getSession } from '@/features/account/controllers/get-session';
import { getStripePublishableKey } from '@/features/account/controllers/get-stripe-config';
import { getPaymentMethods, getSubscription } from '@/features/account/controllers/get-subscription';
import { getBillingHistory } from '@/features/billing/api/billing-history';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Starting account data debugging...');
    
    // Test session
    const session = await getSession();
    console.log('🔍 DEBUG: Session result:', { 
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email 
    });

    if (!session) {
      return NextResponse.json({
        error: 'No session found',
        session: null,
        subscription: null,
        billingHistory: null,
        paymentMethods: null,
        stripeKey: null
      });
    }

    // Get session first to get userId
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Test all account functions
    const [subscription, billingHistory, paymentMethods, stripeKey] = await Promise.all([
      getSubscription(),
      getBillingHistory(session.user.id), 
      getPaymentMethods(),
      getStripePublishableKey()
    ]);

    console.log('🔍 DEBUG: Account data results:', {
      subscription: {
        hasSubscription: !!subscription,
        subscriptionId: subscription?.id,
        status: subscription?.status,
        priceId: subscription?.stripe_price_id
      },
      billingHistory: {
        count: billingHistory?.data?.length || 0,
        hasData: !!billingHistory?.data && billingHistory.data.length > 0
      },
      paymentMethods: {
        count: paymentMethods?.length || 0,
        hasData: !!paymentMethods && paymentMethods.length > 0
      },
      stripeKey: {
        hasKey: !!stripeKey,
        keyPrefix: stripeKey ? stripeKey.substring(0, 8) + '...' : 'none'
      }
    });

    return NextResponse.json({
      debug: 'Account data debugging',
      session: {
        userId: session.user.id,
        email: session.user.email
      },
      subscription,
      billingHistory,
      paymentMethods,
      stripeKey,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 DEBUG: Error in account debugging:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}