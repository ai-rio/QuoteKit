import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { getUser } from '@/features/account/controllers/get-user';
import { manualSyncSubscription } from '@/features/account/controllers/manual-sync-subscription';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getStripeSubscriptionId,getSubscriptionType } from '@/types/subscription-safe-types';

/**
 * DEBUG ENDPOINT: Comprehensive subscription sync diagnostics
 * 
 * This endpoint provides detailed information about subscription sync issues
 * and can perform manual sync operations for testing.
 * 
 * Usage:
 * GET /api/debug/subscription-sync - Get current user's subscription sync status
 * POST /api/debug/subscription-sync - Perform manual sync for current user
 * 
 * Query params:
 * - userId: Admin can check specific user (optional)
 * - action: 'sync' to perform manual sync (POST only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    // Get current session to check if user is authenticated
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const targetUserId = userIdParam || session.user.id;

    // For admin users, allow checking other users
    if (userIdParam && userIdParam !== session.user.id) {
      // Check if current user is admin
      const { data: adminCheck } = await supabaseAdminClient
        .from('admin_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!adminCheck) {
        return NextResponse.json({ error: 'Not authorized to check other users' }, { status: 403 });
      }
    }

    console.log(`🔍 [DEBUG] Starting subscription sync diagnosis for user: ${targetUserId}`);

    // 1. Get user information
    const { data: userData } = await supabaseAdminClient
      .from('users')
      .select('id, email, created_at')
      .eq('id', targetUserId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Get customer mapping
    const { data: customerData } = await supabaseAdminClient
      .from('stripe_customers')
      .select('*')
      .eq('id', targetUserId)
      .single();

    // 3. Get all subscription records for this user
    const { data: subscriptions } = await supabaseAdminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created', { ascending: false });

    // 4. Get current subscription using the app logic
    const currentSubscription = await getSubscription();

    // 5. Get recent webhook events related to this user
    const { data: webhookEvents } = await supabaseAdminClient
      .from('stripe_webhook_events')
      .select('*')
      .or(`data->>customer.eq.${customerData?.stripe_customer_id},data->>subscription.in.(${subscriptions?.map(s => s.stripe_subscription_id).filter(Boolean).join(',') || 'none'})`)
      .order('created_at', { ascending: false })
      .limit(10);

    // 6. Analysis and recommendations
    const analysis = {
      hasCustomerMapping: !!customerData,
      subscriptionCount: subscriptions?.length || 0,
      activeSubscriptions: subscriptions?.filter(s => ['active', 'trialing', 'past_due'].includes(s.status)).length || 0,
      paidSubscriptions: subscriptions?.filter(s => s.stripe_subscription_id).length || 0,
      freeSubscriptions: subscriptions?.filter(s => !s.stripe_subscription_id).length || 0,
      currentSubscriptionType: getSubscriptionType(currentSubscription),
      recentWebhookEvents: webhookEvents?.length || 0,
      failedWebhooks: webhookEvents?.filter(w => !w.processed || w.error_message).length || 0
    };

    const issues = [];
    const recommendations = [];

    // Detect issues
    if (!customerData && subscriptions?.some(s => s.stripe_subscription_id)) {
      issues.push('User has paid subscriptions but no customer mapping');
      recommendations.push('Create customer mapping in customers table');
    }

    if (analysis.activeSubscriptions > 1) {
      issues.push(`User has ${analysis.activeSubscriptions} active subscriptions`);
      recommendations.push('Run cleanup to consolidate subscriptions');
    }

    if (analysis.paidSubscriptions > 0 && analysis.currentSubscriptionType === 'free') {
      issues.push('User has paid subscriptions but getSubscription returns free plan');
      recommendations.push('Check getSubscription query logic and RLS policies');
    }

    if (analysis.failedWebhooks > 0) {
      issues.push(`${analysis.failedWebhooks} failed webhook events found`);
      recommendations.push('Review webhook processing errors');
    }

    const diagnostics = {
      user: userData,
      customer: customerData,
      subscriptions: subscriptions?.map(s => ({
        id: s.id,
        status: s.status,
        stripe_subscription_id: getStripeSubscriptionId(s),
        stripe_customer_id: s.stripe_customer_id,
        price_id: s.stripe_price_id,
        created: s.created_at,
        current_period_end: s.current_period_end,
        type: getSubscriptionType(s)
      })),
      currentSubscription: currentSubscription ? {
        id: currentSubscription.id,
        status: currentSubscription.status,
        stripe_subscription_id: getStripeSubscriptionId(currentSubscription),
        price_id: currentSubscription.stripe_price_id,
        type: getSubscriptionType(currentSubscription),
        hasPrice: !!currentSubscription.prices
      } : null,
      webhookEvents: webhookEvents?.map(w => ({
        stripe_event_id: w.stripe_event_id,
        event_type: w.event_type,
        processed: w.processed,
        error_message: w.error_message,
        created_at: w.created_at
      })),
      analysis,
      issues,
      recommendations
    };

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      timestamp: new Date().toISOString(),
      diagnostics
    });

  } catch (error) {
    console.error('🚨 [ERROR] Subscription sync diagnosis failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Diagnosis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userIdParam = searchParams.get('userId');

    // Get current session
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const targetUserId = userIdParam || session.user.id;

    // For admin users, allow syncing other users
    if (userIdParam && userIdParam !== session.user.id) {
      const { data: adminCheck } = await supabaseAdminClient
        .from('admin_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!adminCheck) {
        return NextResponse.json({ error: 'Not authorized to sync other users' }, { status: 403 });
      }
    }

    if (action === 'sync') {
      console.log(`🔄 [DEBUG] Starting manual sync for user: ${targetUserId}`);

      // Get customer mapping
      const { data: customerData } = await supabaseAdminClient
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('id', targetUserId)
        .single();

      if (!customerData?.stripe_customer_id) {
        return NextResponse.json({
          success: false,
          error: 'No Stripe customer ID found for user'
        }, { status: 400 });
      }

      // Perform manual sync
      const syncResult = await manualSyncSubscription(customerData.stripe_customer_id);

      return NextResponse.json({
        success: true,
        action: 'sync',
        userId: targetUserId,
        timestamp: new Date().toISOString(),
        result: syncResult
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
      supportedActions: ['sync']
    }, { status: 400 });

  } catch (error) {
    console.error('🚨 [ERROR] Manual sync failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}