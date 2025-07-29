import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * Admin endpoint to debug webhook events and subscription sync issues
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using the is_admin function
    const { data: isAdmin, error: adminCheckError } = await supabase
      .rpc('is_admin', { user_id: user.id });

    if (adminCheckError || !isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const customerStripeId = searchParams.get('customerStripeId');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 Admin webhook debug request:', { customerStripeId, eventType, limit, userId: user.id });

    // Build query for webhook events
    let query = supabaseAdminClient
      .from('stripe_webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: webhookEvents, error: webhookError } = await query;

    if (webhookError) {
      console.error('❌ Failed to fetch webhook events:', webhookError);
      return NextResponse.json({ error: 'Failed to fetch webhook events' }, { status: 500 });
    }

    // If specific customer requested, get their subscription data too
    let customerData = null;
    let subscriptionData: any[] | null = null;

    if (customerStripeId) {
      // Get customer mapping
      const { data: customer } = await supabaseAdminClient
        .from('customers')
        .select('*')
        .eq('stripe_customer_id', customerStripeId)
        .single();

      customerData = customer;

      if (customer) {
        // Get subscription data
        const { data: subscriptions } = await supabaseAdminClient
          .from('subscriptions')
          .select('*')
          .eq('user_id', customer.id)
          .order('created', { ascending: false });

        subscriptionData = subscriptions;
      }

      // Filter webhook events for this customer if provided
      const customerEvents = webhookEvents?.filter(event => {
        const eventData = event.data;
        // Type guard for Json object access
        if (typeof eventData === 'object' && eventData !== null && !Array.isArray(eventData)) {
          const eventObject = eventData as { [key: string]: any };
          if (eventObject.object?.customer === customerStripeId) return true;
          if (eventObject.object?.subscription) {
            // For subscription events, check if subscription belongs to customer
            return subscriptionData?.some(sub => sub.stripe_subscription_id === eventObject.object.subscription);
          }
        }
        return false;
      });

      return NextResponse.json({
        success: true,
        customer: {
          stripeCustomerId: customerStripeId,
          mapping: customerData,
          subscriptions: subscriptionData
        },
        webhookEvents: customerEvents,
        totalEvents: customerEvents?.length || 0,
        debug: {
          allWebhookEvents: webhookEvents?.length || 0,
          hasCustomerMapping: !!customerData,
          subscriptionCount: subscriptionData?.length || 0
        }
      });
    }

    // Return general webhook event summary
    const eventTypeCounts = webhookEvents?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const processingStats = webhookEvents?.reduce((acc, event) => {
      if (event.processed) acc.processed++;
      else acc.failed++;
      return acc;
    }, { processed: 0, failed: 0 });

    return NextResponse.json({
      success: true,
      summary: {
        totalEvents: webhookEvents?.length || 0,
        eventTypes: eventTypeCounts,
        processing: processingStats,
        recentEvents: webhookEvents?.slice(0, 10).map(event => ({
          id: event.stripe_event_id,
          type: event.event_type,
          processed: event.processed,
          created: event.created_at,
          error: 'error_message' in event ? event.error_message : null
        }))
      },
      webhookEvents: webhookEvents
    });

  } catch (error) {
    console.error('❌ Webhook debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using the is_admin function
    const { data: isAdmin, error: adminCheckError } = await supabase
      .rpc('is_admin', { user_id: user.id });

    if (adminCheckError || !isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, eventId } = body;

    if (action === 'reprocess' && eventId) {
      // Mark webhook event as unprocessed to trigger reprocessing
      const { error } = await supabaseAdminClient
        .from('stripe_webhook_events')
        .update({ 
          processed: false, 
          error_message: null,
          processed_at: null 
        })
        .eq('stripe_event_id', eventId);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: `Webhook event ${eventId} marked for reprocessing`
      });
    }

    return NextResponse.json({
      error: 'Invalid action',
      supportedActions: ['reprocess']
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Webhook debug action error:', error);
    return NextResponse.json({
      error: 'Action failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}