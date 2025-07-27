import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { manualSyncSubscription, manualSyncAllSubscriptions } from '@/features/account/controllers/manual-sync-subscription';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { customerStripeId, syncAll } = body;

    console.log('🔧 Admin sync request:', { customerStripeId, syncAll, userId: user.id });

    if (syncAll) {
      // Sync all customers
      const result = await manualSyncAllSubscriptions();
      return NextResponse.json({
        success: true,
        message: 'Bulk subscription sync completed',
        ...result
      });
    } else if (customerStripeId) {
      // Sync specific customer
      const result = await manualSyncSubscription(customerStripeId);
      return NextResponse.json({
        success: true,
        message: `Subscription sync completed for customer ${customerStripeId}`,
        customerStripeId,
        ...result
      });
    } else {
      return NextResponse.json({
        error: 'Either customerStripeId or syncAll=true must be provided'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Admin sync endpoint error:', error);
    return NextResponse.json({
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoints: {
      'POST /api/admin/sync-subscriptions': {
        description: 'Manually sync subscription data from Stripe',
        body: {
          customerStripeId: 'string (optional) - Sync specific customer',
          syncAll: 'boolean (optional) - Sync all customers'
        },
        examples: [
          {
            description: 'Sync specific customer',
            body: { customerStripeId: 'cus_Sl3jj0Il1V7kay' }
          },
          {
            description: 'Sync all customers',
            body: { syncAll: true }
          }
        ]
      }
    }
  });
}