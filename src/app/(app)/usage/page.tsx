import { Metadata } from "next"
import { redirect } from "next/navigation"

import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs"
import { UsageAnalyticsDashboard } from "@/components/UsageAnalyticsDashboard"
import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client"

export const metadata: Metadata = {
  title: "Usage Analytics | QuoteKit",
  description: "Track your feature usage and limits with detailed analytics.",
}

export default async function UsagePage() {
  const supabase = await createSupabaseServerClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is on premium plan - if so, redirect to analytics
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

  // If user has premium subscription, redirect to analytics instead
  const isPremium = subscription?.stripe_prices?.stripe_products?.metadata?.analytics_access === 'true'
  if (isPremium) {
    redirect("/analytics?from=usage")
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumbs />
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal">Usage Analytics</h1>
        <p className="text-charcoal/70 mt-1">
          Monitor your feature usage, track limits, and view historical trends
        </p>
      </div>

      {/* Main Usage Dashboard */}
      <UsageAnalyticsDashboard />

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-paper-white border border-stone-gray rounded-lg p-6">
          <h3 className="font-semibold text-charcoal mb-3">Understanding Your Limits</h3>
          <div className="space-y-2 text-sm text-charcoal/70">
            <p>• <strong>Free Plan:</strong> 5 quotes per month</p>
            <p>• <strong>Premium Plan:</strong> Unlimited quotes and features</p>
            <p>• Usage resets on the 1st of each month</p>
            <p>• Deleted quotes don&apos;t count toward your limit</p>
          </div>
        </div>

        <div className="bg-paper-white border border-stone-gray rounded-lg p-6">
          <h3 className="font-semibold text-charcoal mb-3">Premium Features</h3>
          <div className="space-y-2 text-sm text-charcoal/70">
            <p>• <strong>Unlimited quotes</strong> and templates</p>
            <p>• <strong>PDF exports</strong> with custom branding</p>
            <p>• <strong>Bulk operations</strong> for efficiency</p>
            <p>• <strong>Advanced analytics</strong> and reporting</p>
            <p>• <strong>Usage data export</strong> capabilities</p>
          </div>
        </div>
      </div>
    </div>
  )
}
