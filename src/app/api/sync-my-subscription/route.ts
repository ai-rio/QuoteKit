import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { manualSyncSubscription } from '@/features/account/controllers/manual-sync-subscription';

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

    // Get user's customer record
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (customerError || !customerData?.stripe_customer_id) {
      return NextResponse.json({
        error: 'No Stripe customer found',
        message: 'You don\'t have a Stripe customer record. Please contact support.'
      }, { status: 404 });
    }

    const { stripe_customer_id } = customerData;
    console.log(`🔗 Found customer ID: ${stripe_customer_id} for user ${user.id}`);

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