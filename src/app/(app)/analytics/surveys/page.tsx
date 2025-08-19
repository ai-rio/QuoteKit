import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

import { SurveyAnalyticsContent } from './survey-analytics-content'

export const metadata: Metadata = {
  title: 'Survey Analytics | QuoteKit',
  description: 'Comprehensive survey analytics and feedback insights powered by Formbricks integration.',
}

export default async function SurveyAnalyticsPage() {
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

  // Check if user has analytics access
  const hasAnalyticsAccess = subscription?.prices?.products?.metadata?.analytics_access === 'true'

  return (
    <div className="space-y-6">
      <PageBreadcrumbs />
      <SurveyAnalyticsContent hasAccess={hasAnalyticsAccess} />
    </div>
  )
}
