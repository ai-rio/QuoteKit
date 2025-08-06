import { Crown, FileText, Package, Plus, Settings } from "lucide-react"
import { redirect } from "next/navigation"

import { UsageAnalyticsDashboard } from "@/components/UsageAnalyticsDashboard"
import { getDashboardData } from "@/features/dashboard/actions"
import { DashboardStatsComponent } from "@/features/dashboard/components/dashboard-stats"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { RecentQuotes } from "@/features/dashboard/components/recent-quotes"
import { WelcomeMessage } from "@/features/dashboard/components/welcome-message"
import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client"

// Helper functions for Quick Actions
function getQuickActionIcon(iconName: string) {
  switch (iconName) {
    case 'plus':
      return Plus
    case 'package':
      return Package
    case 'settings':
      return Settings
    case 'file-text':
      return FileText
    case 'crown':
      return Crown
    default:
      return Plus
  }
}

function getQuickActionColorClasses(color: string) {
  switch (color) {
    case 'forest-green':
      return 'bg-forest-green/10'
    case 'equipment-yellow':
      return 'bg-equipment-yellow/10'
    case 'stone-gray':
      return 'bg-stone-gray/10'
    default:
      return 'bg-forest-green/10'
  }
}

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
        <h1 className="text-4xl md:text-6xl font-black text-forest-green">Dashboard</h1>
        <p className="text-lg text-charcoal/70 mt-1">
          Welcome to your LawnQuote dashboard
        </p>
      </div>

      {/* Welcome Message */}
      <WelcomeMessage 
        userName={userName} 
        progress={dashboardData.progress}
      />

      {/* Dashboard Stats */}
      <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <div className="p-8">
          <DashboardStatsComponent stats={dashboardData.stats} />
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Usage Analytics Section */}
        <div className="xl:col-span-3">
          <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <div className="p-8 border-b border-stone-gray/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-forest-green">
                    Usage Analytics
                  </h2>
                  <p className="text-base text-charcoal/60 mt-1">
                    Track your quote creation and feature usage
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-forest-green rounded-full"></div>
                  <span className="text-sm text-charcoal/60">Live Data</span>
                </div>
              </div>
            </div>
            <div className="p-8">
              <UsageAnalyticsDashboard />
            </div>
          </div>
        </div>
        
        {/* Quick Actions Section */}
        <div className="xl:col-span-1">
          <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg h-fit">
            <div className="p-8 border-b border-stone-gray/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-equipment-yellow/10 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-equipment-yellow rounded-sm"></div>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-forest-green">
                    Quick Actions
                  </h2>
                  <p className="text-sm text-charcoal/60">
                    Get started quickly
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {dashboardData.quickActions.map((action, index) => {
                  const Icon = getQuickActionIcon(action.icon)
                  return (
                    <div key={action.href} className="group">
                      <a 
                        href={action.href}
                        className="flex items-center gap-3 p-3 rounded-lg border border-stone-gray/20 hover:border-stone-gray/40 hover:bg-stone-gray/5 transition-all duration-200"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getQuickActionColorClasses(action.color)}`}>
                          <Icon className="w-5 h-5 text-charcoal" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-charcoal text-base group-hover:text-forest-green transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-charcoal/60 truncate">
                            {action.description}
                          </p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-stone-gray/10 flex items-center justify-center group-hover:bg-forest-green/10 transition-colors">
                          <div className="w-2 h-2 border-r border-b border-charcoal/40 rotate-[-45deg] group-hover:border-forest-green transition-colors"></div>
                        </div>
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <div className="p-8 border-b border-stone-gray/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-forest-green/10 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-forest-green" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-forest-green">
                  Recent Activity
                </h2>
                <p className="text-base text-charcoal/60">
                  Your latest quotes and updates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-charcoal/60">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          <RecentQuotes quotes={dashboardData.recentQuotes} />
        </div>
      </div>
    </div>
  )
}
