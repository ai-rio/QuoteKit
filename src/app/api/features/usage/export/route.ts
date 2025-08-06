import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'
import { FREE_PLAN_FEATURES, parseStripeMetadata } from '@/types/features'

/**
 * POST /api/features/usage/export
 * Export usage data as CSV (Premium feature)
 */
export async function POST(request: NextRequest) {
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

    // Get request parameters
    const { format = 'csv', includeHistory = true } = await request.json()

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
        { error: 'Data export requires premium access', upgradeRequired: true },
        { status: 403 }
      )
    }

    // Get current usage
    const { count: quotesCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_template', false)

    // Get historical data if requested
    let historicalData: any[] = []
    if (includeHistory) {
      const { data: usageHistory } = await supabase
        .from('user_usage')
        .select('month_year, quotes_count, pdf_exports_count, bulk_operations_count, created_at')
        .eq('user_id', user.id)
        .order('month_year', { ascending: true })

      historicalData = usageHistory || []
    }

    // Generate CSV content
    if (format === 'csv') {
      const csvRows = []
      
      // Header
      csvRows.push('Month,Quotes Created,PDF Exports,Bulk Operations,Date Recorded')
      
      // Current month data
      const currentMonth = new Date().toISOString().slice(0, 7)
      csvRows.push(`${currentMonth},${quotesCount || 0},0,0,${new Date().toISOString()}`)
      
      // Historical data
      historicalData.forEach(record => {
        csvRows.push([
          record.month_year,
          record.quotes_count || 0,
          record.pdf_exports_count || 0,
          record.bulk_operations_count || 0,
          record.created_at
        ].join(','))
      })
      
      const csvContent = csvRows.join('\\n')
      
      // Return CSV file
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="usage-analytics-${new Date().toISOString().slice(0, 10)}.csv"`
        }
      })
    }

    // JSON format fallback
    return NextResponse.json({
      current: {
        month: new Date().toISOString().slice(0, 7),
        quotes_count: quotesCount || 0,
        pdf_exports_count: 0,
        bulk_operations_count: 0
      },
      history: historicalData,
      exported_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in usage export API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
