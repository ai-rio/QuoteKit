import { redirect } from "next/navigation"

import { getDashboardData } from "@/features/dashboard/actions"
import { DashboardStatsComponent } from "@/features/dashboard/components/dashboard-stats"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { RecentQuotes } from "@/features/dashboard/components/recent-quotes"
import { WelcomeMessage } from "@/features/dashboard/components/welcome-message"
import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth/login')
  }

  // Get dashboard data
  const dashboardData = await getDashboardData()
  
  // Extract user name from email or metadata
  const userName = user.user_metadata?.full_name || 
                  user.email?.split('@')[0] || 
                  'there'

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal">Dashboard</h1>
        <p className="text-charcoal/70 mt-1">
          Welcome to your LawnQuote dashboard
        </p>
      </div>

      {/* Welcome Message */}
      <WelcomeMessage 
        userName={userName} 
        progress={dashboardData.progress}
      />

      {/* Dashboard Stats */}
      <DashboardStatsComponent stats={dashboardData.stats} />

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal mb-4">
          Quick Actions
        </h2>
        <QuickActions actions={dashboardData.quickActions} />
      </div>

      {/* Recent Quotes */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal mb-4">
          Recent Activity
        </h2>
        <RecentQuotes quotes={dashboardData.recentQuotes} />
      </div>
    </div>
  )
}