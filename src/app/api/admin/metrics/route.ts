import { NextRequest, NextResponse } from 'next/server'

import { getSystemMetrics } from '@/libs/posthog/posthog-admin'
import { isAdmin } from '@/libs/supabase/admin-utils'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get system metrics from PostHog (with graceful fallback)
    const metrics = await getSystemMetrics()

    // Get rate limit stats for monitoring
    const { getRateLimitStats } = await import('@/libs/posthog/posthog-admin')
    const rateLimitStats = getRateLimitStats()

    // Check if metrics contains configuration error
    if (metrics.error && metrics.error.includes('PostHog not configured')) {
      // Return success with empty metrics and configuration warning
      return NextResponse.json({
        success: true,
        data: metrics,
        rate_limits: rateLimitStats,
        warning: 'PostHog not configured. Configure PostHog in Admin Settings to view metrics.'
      })
    }

    return NextResponse.json({
      success: true,
      data: metrics,
      rate_limits: rateLimitStats
    })

  } catch (error) {
    // Only log non-configuration errors
    if (error instanceof Error && !error.message.includes('PostHog configuration missing')) {
      console.error('Error fetching admin metrics:', error)
    }
    
    // Return graceful fallback for PostHog configuration errors
    if (error instanceof Error && error.message.includes('PostHog configuration missing')) {
      return NextResponse.json({
        success: true,
        data: {
          total_users: 0,
          quotes_created: 0,
          quotes_sent: 0,
          quotes_accepted: 0,
          total_revenue: 0,
          conversion_rate: 0,
          send_rate: 0,
          average_quote_value: 0,
          last_updated: new Date().toISOString(),
          error: 'PostHog not configured. Please configure PostHog in Admin Settings.'
        },
        warning: 'PostHog not configured. Configure PostHog in Admin Settings to view metrics.'
      })
    }
    
    console.error('Unexpected error in admin metrics:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}