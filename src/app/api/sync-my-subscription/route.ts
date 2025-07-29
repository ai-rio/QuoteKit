import { NextRequest, NextResponse } from 'next/server';

import { manualSyncSubscription } from '@/features/account/controllers/manual-sync-subscription';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

/**
 * User-facing endpoint to sync their own subscription data
 * This is a temporary fix for when webhooks fail to create subscription records
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔄 User ${user.id} requesting subscription sync`);

    // Get or create customer using the enhanced helper that avoids PGRST116 errors
    const { getOrCreateCustomerForUser } = await import('@/features/account/controllers/get-or-create-customer');
    
    let stripe_customer_id;
    try {
      stripe_customer_id = await getOrCreateCustomerForUser({ 
        userId: user.id, 
        email: user.email!, 
        supabaseClient: supabase 
      });
      
      console.log(`🔗 Got/created customer ID: ${stripe_customer_id} for user ${user.id}`);
    } catch (customerError) {
      console.error('Failed to get/create customer for sync:', {
        userId: user.id,
        error: customerError instanceof Error ? customerError.message : 'Unknown error'
      });
      return NextResponse.json({
        error: 'Failed to create customer record',
        message: 'Unable to create or retrieve Stripe customer. Please try again or contact support.'
      }, { status: 500 });
    }

    // Sync subscriptions for this customer
    const result = await manualSyncSubscription(stripe_customer_id);

    if (result.synced === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions found in Stripe',
        details: result
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.synced} subscription(s)`,
      details: result
    });

  } catch (error) {
    console.error('❌ User sync endpoint error:', error);
    return NextResponse.json({
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/sync-my-subscription',
    description: 'Sync your subscription data from Stripe to fix display issues',
    note: 'This is a temporary fix for when webhook events fail to create subscription records',
    usage: 'Send a POST request to sync your subscription data'
  });
}