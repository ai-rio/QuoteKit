import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'
import { FREE_PLAN_FEATURES, parseStripeMetadata } from '@/types/features'

/**
 * GET /api/features/usage/history
 * Get historical usage data for the authenticated user (Premium feature)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has analytics access (premium feature)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stripe_prices!inner (
          *,
          stripe_products!inner (
            metadata
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Parse features from subscription or use free plan defaults
    let features = FREE_PLAN_FEATURES
    if (subscription?.stripe_prices?.stripe_products?.metadata) {
      features = parseStripeMetadata(subscription.stripe_prices.stripe_products.metadata)
    }

    // Check analytics access
    if (!features.analytics) {
      return NextResponse.json(
        { error: 'Analytics access required', upgradeRequired: true },
        { status: 403 }
      )
    }

    // Get historical usage data from user_usage table
    const { data: usageHistory, error: historyError } = await supabase
      .from('user_usage')
      .select('month_year, quotes_count, pdf_exports_count, bulk_operations_count')
      .eq('user_id', user.id)
      .order('month_year', { ascending: false })
      .limit(12) // Last 12 months

    if (historyError) {
      console.error('Error fetching usage history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch usage history' },
        { status: 500 }
      )
    }

    // Format the data for the frontend
    const history = (usageHistory || []).map(record => ({
      month_year: record.month_year,
      quotes_count: record.quotes_count || 0,
      pdf_exports_count: record.pdf_exports_count || 0,
      bulk_operations_count: record.bulk_operations_count || 0
    }))

    return NextResponse.json({ history })

  } catch (error) {
    console.error('Error in usage history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
