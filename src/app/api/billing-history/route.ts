import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getEnhancedBillingHistory } from '@/features/billing/api/enhanced-billing-history';

/**
 * GET /api/billing-history
 * Fetch billing history for the authenticated user using enhanced production-ready logic
 * 
 * Query Parameters:
 * - limit: number (optional, default: 50, max: 100)
 * - offset: number (optional, default: 0)
 * - status: string (optional, filter by status)
 * - from_date: string (optional, ISO date string)
 * - to_date: string (optional, ISO date string)
 * - include_subscription_history: boolean (optional, default: false in production)
 * - production_mode: boolean (optional, force production behavior)
 */
export async function GET(request: NextRequest) {
  try {
    console.debug('billing-history API: Processing GET request with enhanced logic');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const statusFilter = searchParams.get('status') || undefined;
    const fromDate = searchParams.get('from_date') || undefined;
    const toDate = searchParams.get('to_date') || undefined;
    const includeSubscriptionHistory = searchParams.get('include_subscription_history') === 'true';
    const productionMode = searchParams.get('production_mode') === 'true' || 
                          process.env.NODE_ENV === 'production';

    console.debug('billing-history API: Query parameters', {
      limit,
      offset,
      statusFilter,
      fromDate,
      toDate,
      includeSubscriptionHistory,
      productionMode
    });

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('billing-history API: Authentication failed', {
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

    console.debug('billing-history API: User authenticated', {
      userId: user.id,
      email: user.email
    });

    // Use enhanced billing history logic
    const billingHistoryResponse = await getEnhancedBillingHistory(user.id, {
      limit,
      offset,
      statusFilter,
      fromDate,
      toDate,
      includeSubscriptionHistory,
      productionMode
    });

    console.debug('billing-history API: Successfully retrieved enhanced billing history', {
      userId: user.id,
      itemCount: billingHistoryResponse.data.length,
      hasStripeInvoices: billingHistoryResponse.metadata.hasStripeInvoices,
      hasSubscriptionHistory: billingHistoryResponse.metadata.hasSubscriptionHistory,
      hasBillingRecords: billingHistoryResponse.metadata.hasBillingRecords,
      isProductionMode: billingHistoryResponse.metadata.isProductionMode,
      stripeCustomerId: billingHistoryResponse.metadata.stripeCustomerId
    });

    // Return the enhanced response
    return NextResponse.json(billingHistoryResponse);

  } catch (error) {
    console.error('billing-history API: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing-history/refresh
 * Force refresh billing history cache
 * This endpoint can be called after payment events to ensure fresh data
 */
export async function POST(request: NextRequest) {
  try {
    console.debug('billing-history API: Processing POST refresh request');

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('billing-history API: Authentication failed for refresh', {
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

    // For now, just return success - the GET endpoint always fetches fresh data from Stripe
    // In the future, this could invalidate any caching layers
    console.debug('billing-history API: Refresh requested', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Billing history cache refreshed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('billing-history API: Refresh error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Failed to refresh billing history',
        code: 'REFRESH_ERROR'
      },
      { status: 500 }
    );
  }
}
