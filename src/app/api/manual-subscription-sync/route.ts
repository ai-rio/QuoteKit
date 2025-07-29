import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { cleanupDuplicateSubscriptions } from '@/features/account/controllers/get-subscription';

/**
 * POST /api/manual-subscription-sync
 * Manually sync and cleanup subscriptions for the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 Starting manual subscription sync for user:', user.id);
    
    // Step 1: Get all current subscriptions for this user
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false });
    
    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    console.log('📊 Found subscriptions:', {
      total: subscriptions?.length || 0,
      subscriptions: subscriptions?.map(s => ({
        id: s.id,
        status: s.status,
        type: (s as any).stripe_subscription_id ? 'paid' : 'free',
        created: s.created
      }))
    });

    // Step 2: Run cleanup for duplicate subscriptions
    const cleanupResult = await cleanupDuplicateSubscriptions(user.id);
    
    console.log('🧹 Cleanup result:', cleanupResult);

    // Step 3: Get the current active subscription after cleanup
    const { data: currentSubscription, error: currentError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('stripe_subscription_id', { ascending: false, nullsFirst: false })
      .order('created', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentError) {
      console.error('Error fetching current subscription:', currentError);
      return NextResponse.json({ error: 'Failed to fetch current subscription' }, { status: 500 });
    }

    console.log('✅ Current active subscription after sync:', {
      subscription: currentSubscription ? {
        id: currentSubscription.id,
        status: currentSubscription.status,
        type: (currentSubscription as any).stripe_subscription_id ? 'paid' : 'free',
        price_id: currentSubscription.price_id,
        stripe_subscription_id: (currentSubscription as any).stripe_subscription_id
      } : null
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription sync completed successfully',
      result: {
        cleanup: cleanupResult,
        currentSubscription: currentSubscription ? {
          id: currentSubscription.id,
          status: currentSubscription.status,
          type: currentSubscription.stripe_subscription_id ? 'paid' : 'free',
          price_id: currentSubscription.price_id
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ Manual subscription sync failed:', error);
    return NextResponse.json(
      { 
        error: 'Manual subscription sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/manual-subscription-sync
 * Get current subscription status for the user (for debugging)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all subscriptions for this user
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false });
    
    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const activeSubs = subscriptions?.filter(s => ['active', 'trialing', 'past_due'].includes(s.status)) || [];
    const paidSubs = activeSubs.filter(s => s.stripe_subscription_id);
    const freeSubs = activeSubs.filter(s => !s.stripe_subscription_id);

    return NextResponse.json({
      userId: user.id,
      subscriptions: {
        total: subscriptions?.length || 0,
        active: activeSubs.length,
        paid: paidSubs.length,
        free: freeSubs.length
      },
      details: subscriptions?.map(s => ({
        id: s.id,
        status: s.status,
        type: s.stripe_subscription_id ? 'paid' : 'free',
        stripe_subscription_id: s.stripe_subscription_id,
        price_id: s.price_id,
        created: s.created
      })) || [],
      needsCleanup: paidSubs.length > 0 && freeSubs.length > 0
    });
    
  } catch (error) {
    console.error('❌ Failed to get subscription status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}