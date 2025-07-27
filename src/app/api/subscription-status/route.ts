import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * User-facing endpoint to check subscription status and recent webhook activity
 * Helps users understand why their subscription might not be showing correctly
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`📊 User ${user.id} checking subscription status`);

    // Get user's customer record
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    // Get user's current subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false });

    const status = {
      user: {
        id: user.id,
        email: user.email
      },
      customer: {
        hasStripeCustomer: !!customerData?.stripe_customer_id,
        stripeCustomerId: customerData?.stripe_customer_id || null,
        customerEmail: customerData?.email || null
      },
      subscriptions: {
        count: subscriptions?.length || 0,
        active: subscriptions?.filter(sub => ['active', 'trialing'].includes(sub.status)),
        all: subscriptions?.map(sub => ({
          id: sub.id,
          status: sub.status,
          priceId: sub.price_id,
          stripeSubscriptionId: sub.stripe_subscription_id,
          created: sub.created,
          isPaid: !!sub.stripe_subscription_id
        })) || []
      }
    };

    // If user has a Stripe customer ID, get recent webhook events
    let recentWebhookActivity = null;
    if (customerData?.stripe_customer_id) {
      const { data: recentEvents } = await supabaseAdminClient
        .from('stripe_webhook_events')
        .select('stripe_event_id, event_type, processed, created_at, error_message')
        .order('created_at', { ascending: false })
        .limit(20);

      // Filter events related to this customer
      const customerEvents = recentEvents?.filter(event => {
        const eventData = event.data;
        return eventData?.object?.customer === customerData.stripe_customer_id ||
               status.subscriptions.all.some(sub => 
                 sub.stripeSubscriptionId && 
                 eventData?.object?.id === sub.stripeSubscriptionId
               );
      });

      recentWebhookActivity = {
        totalRecentEvents: recentEvents?.length || 0,
        customerRelatedEvents: customerEvents?.length || 0,
        events: customerEvents?.slice(0, 10).map(event => ({
          id: event.stripe_event_id,
          type: event.event_type,
          processed: event.processed,
          timestamp: event.created_at,
          hasError: !!event.error_message,
          error: event.error_message
        })) || []
      };
    }

    // Determine likely issues
    const diagnostics = [];
    
    if (!customerData?.stripe_customer_id) {
      diagnostics.push({
        level: 'warning',
        issue: 'No Stripe customer mapping',
        description: 'Your account is not linked to a Stripe customer record',
        recommendation: 'Contact support if you have made a payment'
      });
    }

    if (status.subscriptions.count === 0) {
      diagnostics.push({
        level: 'info',
        issue: 'No subscriptions found',
        description: 'No subscription records in the database',
        recommendation: 'Use the sync button if you recently made a payment'
      });
    }

    if (status.subscriptions.count > 1) {
      diagnostics.push({
        level: 'warning',
        issue: 'Multiple subscriptions',
        description: `Found ${status.subscriptions.count} subscription records`,
        recommendation: 'This may cause display issues. Contact support for cleanup.'
      });
    }

    const hasFailedWebhooks = recentWebhookActivity?.events?.some(event => !event.processed);
    if (hasFailedWebhooks) {
      diagnostics.push({
        level: 'error',
        issue: 'Failed webhook processing',
        description: 'Some recent webhook events failed to process',
        recommendation: 'Try the sync button or contact support'
      });
    }

    return NextResponse.json({
      success: true,
      status,
      recentWebhookActivity,
      diagnostics,
      recommendations: {
        canSync: !!customerData?.stripe_customer_id,
        shouldContactSupport: diagnostics.some(d => d.level === 'error') || 
                               (!customerData?.stripe_customer_id && status.subscriptions.count === 0)
      }
    });

  } catch (error) {
    console.error('❌ Subscription status endpoint error:', error);
    return NextResponse.json({
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}