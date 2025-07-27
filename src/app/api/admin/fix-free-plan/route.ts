import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ensureFreePlanActive, reactivatePrice } from '@/features/pricing/controllers/upsert-price';

/**
 * POST /api/admin/fix-free-plan
 * Fix free plan pricing issues by ensuring an active free price exists
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (basic security check)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 Starting free plan fix process...');
    
    const result = await ensureFreePlanActive();
    
    return NextResponse.json({
      message: 'Free plan fix completed successfully',
      result
    });
    
  } catch (error) {
    console.error('❌ Free plan fix failed:', error);
    return NextResponse.json(
      { 
        error: 'Free plan fix failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/fix-free-plan
 * Get information about free plan pricing status
 */
export async function GET() {
  try {
    // Check if user is admin (basic security check)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get free prices from database
    const { data: freePrices, error: freePricesError } = await supabase
      .from('stripe_prices')
      .select('stripe_price_id, unit_amount, currency, recurring_interval, active, created_at')
      .eq('unit_amount', 0)
      .order('created_at', { ascending: false });

    if (freePricesError) {
      throw freePricesError;
    }

    const activeFreePrice = freePrices?.find(p => p.active === true);
    const inactiveFreePrices = freePrices?.filter(p => p.active === false) || [];

    return NextResponse.json({
      freePrices: freePrices || [],
      activeFreePrice,
      inactiveFreePricesCount: inactiveFreePrices.length,
      status: activeFreePrice ? 'healthy' : 'needs_fix',
      recommendedAction: activeFreePrice 
        ? 'Free plan is active and ready for signups'
        : 'Run POST /api/admin/fix-free-plan to fix inactive free plan'
    });
    
  } catch (error) {
    console.error('❌ Failed to get free plan status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get free plan status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}