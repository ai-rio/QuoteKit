/**
 * Edge Cases API - Step 2.3 Implementation
 * 
 * API endpoints for manual edge case management including:
 * - Refund processing
 * - Credit note creation
 * - Plan change previews and execution
 * - Dispute evidence submission
 * - Payment method validation
 * - Edge case analytics
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  manuallyCreateCreditNote,
  manuallyExecutePlanChange,
  manuallyPreviewPlanChange,
  manuallyProcessRefund,
  manuallySubmitDisputeEvidence
} from '@/features/billing/controllers/edge-case-coordinator';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

/**
 * GET /api/billing/edge-cases
 * Get edge case summary and recent events for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [EDGE_CASES_API] Processing GET request for edge case summary');

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [EDGE_CASES_API] Authentication failed', {
        hasAuthError: !!authError,
        hasUser: !!user,
        errorMessage: authError?.message
      });
      
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    console.log('✅ [EDGE_CASES_API] User authenticated:', user.id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeEvents = searchParams.get('include_events') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Get edge case summary using stored procedure
    const { data: summaryData, error: summaryError } = await supabaseAdminClient
      .rpc('get_user_edge_case_summary', { p_user_id: user.id });

    if (summaryError) {
      console.error('❌ [EDGE_CASES_API] Failed to get edge case summary:', summaryError);
      return NextResponse.json(
        { 
          error: 'Failed to retrieve edge case summary',
          code: 'SUMMARY_ERROR'
        },
        { status: 500 }
      );
    }

    const summary = summaryData?.[0] || {
      total_events: 0,
      successful_events: 0,
      failed_events: 0,
      recent_failures: 0,
      unread_notifications: 0,
      active_disputes: 0
    };

    console.log('✅ [EDGE_CASES_API] Edge case summary retrieved:', summary);

    let recentEvents = [];
    if (includeEvents) {
      const { data: eventsData, error: eventsError } = await supabaseAdminClient
        .from('edge_case_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventsError) {
        console.warn('⚠️ [EDGE_CASES_API] Failed to get recent events:', eventsError);
      } else {
        recentEvents = eventsData || [];
        console.log('✅ [EDGE_CASES_API] Recent events retrieved:', recentEvents.length);
      }
    }

    // Get unread notifications
    const { data: notifications, error: notificationsError } = await supabaseAdminClient
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (notificationsError) {
      console.warn('⚠️ [EDGE_CASES_API] Failed to get notifications:', notificationsError);
    }

    const response = {
      summary: {
        totalEvents: summary.total_events,
        successfulEvents: summary.successful_events,
        failedEvents: summary.failed_events,
        recentFailures: summary.recent_failures,
        unreadNotifications: summary.unread_notifications,
        activeDisputes: summary.active_disputes,
        successRate: summary.total_events > 0 
          ? ((summary.successful_events / summary.total_events) * 100).toFixed(2)
          : '100.00'
      },
      recentEvents: includeEvents ? recentEvents : undefined,
      notifications: notifications || [],
      timestamp: new Date().toISOString()
    };

    console.log('🎉 [EDGE_CASES_API] GET request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 [EDGE_CASES_API] Unexpected error in GET:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/edge-cases
 * Process manual edge case actions
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [EDGE_CASES_API] Processing POST request for manual edge case action');

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [EDGE_CASES_API] Authentication failed', {
        hasAuthError: !!authError,
        hasUser: !!user,
        errorMessage: authError?.message
      });
      
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    console.log('✅ [EDGE_CASES_API] User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    const { action, ...params } = body;

    console.log('🔧 [EDGE_CASES_API] Processing action:', action, 'with params:', params);

    // Get Stripe configuration
    const { data: configData, error: configError } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (configError || !configData?.value) {
      console.error('❌ [EDGE_CASES_API] Failed to get Stripe config:', configError);
      return NextResponse.json(
        { 
          error: 'Stripe configuration not available',
          code: 'CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    const stripeConfig = configData.value as any;

    // Process the requested action
    let result;
    switch (action) {
      case 'process_refund':
        console.log('💰 [REFUND] Processing refund request');
        result = await manuallyProcessRefund(user.id, params.refundRequest, stripeConfig);
        break;

      case 'create_credit_note':
        console.log('📝 [CREDIT] Creating credit note');
        result = await manuallyCreateCreditNote(user.id, params.creditRequest, stripeConfig);
        break;

      case 'preview_plan_change':
        console.log('🔍 [PRORATION] Previewing plan change');
        result = await manuallyPreviewPlanChange(
          params.subscriptionId,
          params.newPriceId,
          stripeConfig
        );
        break;

      case 'execute_plan_change':
        console.log('🔄 [PRORATION] Executing plan change');
        result = await manuallyExecutePlanChange(
          params.subscriptionId,
          params.newPriceId,
          stripeConfig,
          params.options
        );
        break;

      case 'submit_dispute_evidence':
        console.log('⚖️ [DISPUTE] Submitting dispute evidence');
        result = await manuallySubmitDisputeEvidence(
          params.disputeId,
          params.evidence,
          stripeConfig,
          user.id
        );
        break;

      case 'mark_notification_read':
        console.log('📧 [NOTIFICATION] Marking notification as read');
        const { data: markReadResult, error: markReadError } = await supabaseAdminClient
          .rpc('mark_notification_read', {
            p_notification_id: params.notificationId,
            p_user_id: user.id
          });

        if (markReadError) {
          throw new Error(`Failed to mark notification as read: ${markReadError.message}`);
        }

        result = { success: markReadResult, notificationId: params.notificationId };
        break;

      default:
        console.error('❌ [EDGE_CASES_API] Unknown action:', action);
        return NextResponse.json(
          { 
            error: `Unknown action: ${action}`,
            code: 'UNKNOWN_ACTION'
          },
          { status: 400 }
        );
    }

    console.log('✅ [EDGE_CASES_API] Action completed:', action, 'Result:', result);

    // Record the manual action for audit trail
    try {
      await supabaseAdminClient
        .from('edge_case_events')
        .insert({
          event_type: `manual_${action}`,
          event_id: `manual_${Date.now()}`,
          user_id: user.id,
          handler_used: 'manual_api',
          success: (result as any)?.success !== false,
          actions: [action],
          context_metadata: params,
          result_metadata: result,
          created_at: new Date().toISOString()
        });

      console.log('📝 [EDGE_CASES_API] Manual action recorded for audit trail');
    } catch (auditError) {
      console.warn('⚠️ [EDGE_CASES_API] Failed to record audit trail:', auditError);
      // Don't fail the request if audit logging fails
    }

    const response = {
      success: (result as any)?.success !== false,
      action,
      result,
      timestamp: new Date().toISOString()
    };

    console.log('🎉 [EDGE_CASES_API] POST request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 [EDGE_CASES_API] Unexpected error in POST:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Failed to process edge case action',
        code: 'PROCESSING_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
