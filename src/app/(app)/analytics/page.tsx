import { redirect } from 'next/navigation'

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs'
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user's subscription and feature access
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      prices:stripe_price_id (
        *,
        products:stripe_product_id (
          *
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // Get analytics data (only if user has access)
  let analyticsData = null
  const hasAnalyticsAccess = subscription?.prices?.products?.metadata?.analytics_access === 'true'
  
  if (hasAnalyticsAccess) {
    // Fetch quote analytics
    const { data: quoteAnalytics } = await supabase
      .from('quote_analytics')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Fetch client analytics
    const { data: clientAnalytics } = await supabase
      .from('client_analytics')
      .select('*')
      .eq('user_id', user.id)

    // Fetch recent quotes for trends
    const { data: recentQuotes } = await supabase
      .from('quotes')
      .select('id, total, status, created_at, client_name')
      .eq('user_id', user.id)
      .eq('is_template', false)
      .order('created_at', { ascending: false })
      .limit(50)

    analyticsData = {
      quoteAnalytics,
      clientAnalytics: clientAnalytics || [],
      recentQuotes: recentQuotes || []
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumbs />
      <AnalyticsDashboard 
        hasAccess={hasAnalyticsAccess}
        analyticsData={analyticsData}
      />
    </div>
  )
}
