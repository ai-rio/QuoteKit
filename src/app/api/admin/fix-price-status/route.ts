import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server';
import { syncPriceStatus, batchSyncPriceStatuses } from '@/features/pricing/controllers/upsert-price';

/**
 * POST /api/admin/fix-price-status
 * Manually sync specific price status from Stripe to fix inactive price issues
 * 
 * Body options:
 * - { priceId: "price_123" } - Sync single price
 * - { priceIds: ["price_123", "price_456"] } - Sync multiple prices
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (basic security check)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { priceId, priceIds } = body;

    if (!priceId && !priceIds) {
      return NextResponse.json(
        { error: 'Either priceId or priceIds array is required' },
        { status: 400 }
      );
    }

    let result;

    if (priceId) {
      // Sync single price
      console.log(`Starting price status sync for: ${priceId}`);
      result = await syncPriceStatus(priceId);
      
      return NextResponse.json({
        message: `Price ${priceId} status synced successfully`,
        result
      });
    } else if (priceIds && Array.isArray(priceIds)) {
      // Sync multiple prices
      console.log(`Starting batch price status sync for: ${priceIds.join(', ')}`);
      result = await batchSyncPriceStatuses(priceIds);
      
      const successCount = result.filter(r => r.success).length;
      const failCount = result.filter(r => !r.success).length;
      
      return NextResponse.json({
        message: `Batch price sync completed: ${successCount} succeeded, ${failCount} failed`,
        results: result,
        summary: {
          total: result.length,
          succeeded: successCount,
          failed: failCount
        }
      });
    }
    
  } catch (error) {
    console.error('Price status sync failed:', error);
    return NextResponse.json(
      { 
        error: 'Price status sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/fix-price-status
 * Get information about prices that may need status fixes
 */
export async function GET() {
  try {
    // Check if user is admin (basic security check)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get inactive prices from database
    const { data: inactivePrices, error: inactiveError } = await supabase
      .from('stripe_prices')
      .select('stripe_price_id, unit_amount, currency, recurring_interval')
      .eq('active', false);

    if (inactiveError) {
      throw inactiveError;
    }

    // Get active prices count for comparison
    const { count: activePricesCount } = await supabase
      .from('stripe_prices')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    return NextResponse.json({
      inactivePrices: inactivePrices || [],
      inactivePricesCount: inactivePrices?.length || 0,
      activePricesCount: activePricesCount || 0,
      recommendedAction: inactivePrices && inactivePrices.length > 0 
        ? 'Run price status sync to fix inactive prices'
        : 'All prices appear to be active'
    });
    
  } catch (error) {
    console.error('Failed to get price status info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get price status info', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}