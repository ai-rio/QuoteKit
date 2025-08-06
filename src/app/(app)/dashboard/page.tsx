import { CheckCircle, Crown, DollarSign, FileText, List, Package, Plus, Send, Settings, TrendingUp, User, Zap } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs"
import { getDashboardData } from "@/features/dashboard/actions"
import { QuoteStatusBadge } from "@/features/quotes/components/QuoteStatusBadge"
import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client"

// Utility functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString))
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
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
                  'Carlos'
  
  // Define stat cards data matching HTML mock
  const statCards = [
    {
      title: "Total Quotes",
      value: dashboardData.stats.totalQuotes,
      icon: FileText,
      bgColor: "bg-blue-500"
    },
    {
      title: "Quotes Sent", 
      value: dashboardData.stats.sentQuotes,
      icon: Send,
      bgColor: "bg-purple-500"
    },
    {
      title: "Quotes Accepted",
      value: dashboardData.stats.acceptedQuotes,
      icon: CheckCircle,
      bgColor: "bg-green-600"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardData.stats.totalRevenue),
      icon: DollarSign,
      bgColor: "bg-forest-green",
      trend: "+15%"
    },
    {
      title: "Items in Library",
      value: dashboardData.stats.totalItems,
      icon: List,
      bgColor: "bg-charcoal"
    },
    {
      title: "Quote Templates",
      value: dashboardData.stats.totalTemplates,
      icon: FileText,
      bgColor: "bg-stone-gray"
    }
  ]
  
  // Quick actions matching HTML mock
  const quickActions = [
    { href: '/quotes/new', icon: Plus, label: 'Create New Quote' },
    { href: '/quotes', icon: FileText, label: 'Manage Quotes' },
    { href: '/items', icon: List, label: 'Item Library' },
    { href: '/account', icon: User, label: 'Account & Billing' },
    { href: '/settings', icon: Settings, label: 'Company Settings' }
  ]

  return (
    <div className="space-y-8">
      <PageBreadcrumbs />
      
      {/* Welcome Banner */}
      <div className="bg-forest-green text-paper-white p-6 rounded-2xl shadow-lg mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-paper-white">{getGreeting()}, {userName}!</h1>
        <p className="mt-1 text-stone-gray">
          Your account is fully set up. Ready to create professional quotes for your clients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.title} className="bg-paper-white p-6 rounded-2xl border border-stone-gray/20 shadow-sm flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
                    <Icon className="w-6 h-6 text-paper-white" />
                  </div>
                  <div>
                    <p className="text-sm text-charcoal/70 font-medium">{stat.title}</p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-3xl font-black font-mono text-charcoal">{stat.value}</p>
                      {stat.trend && (
                        <div className="flex items-center text-sm font-bold text-green-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {stat.trend}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Usage Analytics & Upgrade Prompt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Usage Analytics Card */}
            <div className="bg-paper-white p-6 rounded-2xl border border-stone-gray/20 shadow-sm">
              <h2 className="text-xl font-bold text-charcoal mb-4">Usage Analytics</h2>
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#F5F5F5" strokeWidth="10" fill="none"></circle>
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      stroke="#2A3D2F" 
                      strokeWidth="10" 
                      fill="none" 
                      strokeLinecap="round" 
                      transform="rotate(-90 50 50)" 
                      strokeDasharray="282.74" 
                      strokeDashoffset="226.19"
                    ></circle>
                  </svg>
                  <div className="text-center">
                    <p className="text-3xl font-black font-mono text-charcoal">{dashboardData.stats.totalQuotes}</p>
                    <p className="text-sm text-charcoal/60">/ 5</p>
                  </div>
                </div>
                <p className="font-bold mt-4">Quotes Created This Month</p>
                <p className="text-sm text-charcoal/70">Your free plan includes 5 quotes per month.</p>
              </div>
            </div>
            
            {/* Upgrade Prompt Card */}
            <div className="bg-equipment-yellow border border-yellow-300 p-6 rounded-2xl flex flex-col items-center text-center shadow-lg">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-forest-green/80 mb-4">
                <Zap className="w-6 h-6 text-equipment-yellow" />
              </div>
              <h2 className="text-xl font-bold text-charcoal">Unlock Advanced Analytics</h2>
              <p className="mt-2 text-sm text-charcoal/80 flex-grow">Get detailed usage trends, export capabilities, and unlimited features.</p>
              <Button className="w-full mt-6 bg-forest-green text-paper-white font-bold py-3 rounded-lg hover:bg-green-800 transition-all duration-300 transform hover:scale-105 shadow-[0_4px_20px_rgba(42,61,47,0.4)] hover:shadow-[0_6px_25px_rgba(42,61,47,0.6)] flex items-center justify-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Unlock Your Growth</span>
              </Button>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-paper-white p-6 rounded-2xl border border-stone-gray/20 shadow-sm">
            <h2 className="text-xl font-bold text-charcoal mb-2">Recent Activity</h2>
            <div className="divide-y divide-stone-gray/20">
              {dashboardData.recentQuotes.length > 0 ? (
                dashboardData.recentQuotes.map((quote) => (
                  <div key={quote.id} className="grid grid-cols-12 gap-4 items-center py-4 px-2 hover:bg-light-concrete rounded-lg transition-colors">
                    <div className="col-span-12 md:col-span-5">
                      <p className="font-bold text-charcoal">{quote.clientName}</p>
                      <p className="text-sm text-charcoal/60 md:hidden">{formatDate(quote.createdAt)}</p>
                    </div>
                    <div className="hidden md:block col-span-3 text-sm text-charcoal/70">
                      {formatDate(quote.createdAt)}
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-stone-gray/60 text-charcoal">
                        {quote.status === 'draft' ? 'Draft' : 
                         quote.status === 'sent' ? 'Sent' :
                         quote.status === 'accepted' ? 'Accepted' :
                         quote.status === 'declined' ? 'Declined' :
                         quote.status === 'expired' ? 'Expired' :
                         quote.status === 'converted' ? 'Converted' : 'Draft'}
                      </span>
                    </div>
                    <div className="col-span-6 md:col-span-2 text-right font-mono font-bold text-charcoal">
                      {formatCurrency(quote.total)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 gap-4 items-center py-4 px-2 hover:bg-light-concrete rounded-lg transition-colors">
                  <div className="col-span-12 md:col-span-5">
                    <p className="font-bold text-charcoal">Sample Client</p>
                    <p className="text-sm text-charcoal/60 md:hidden">Aug 5, 2025</p>
                  </div>
                  <div className="hidden md:block col-span-3 text-sm text-charcoal/70">Aug 5, 2025</div>
                  <div className="col-span-6 md:col-span-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-stone-gray/60 text-charcoal">Draft</span>
                  </div>
                  <div className="col-span-6 md:col-span-2 text-right font-mono font-bold text-charcoal">$242.78</div>
                </div>
              )}
            </div>
            <div className="text-center mt-6">
              <Button asChild className="font-bold text-forest-green hover:underline" variant="ghost">
                <Link href="/quotes">View All Quotes</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar Column */}
        <div className="lg:col-span-1">
          <div className="bg-paper-white p-6 rounded-2xl border border-stone-gray/20 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold text-charcoal mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link 
                    key={action.href}
                    href={action.href} 
                    className="flex items-center p-4 bg-light-concrete hover:bg-stone-gray/50 rounded-lg transition-colors"
                  >
                    <Icon className="w-6 h-6 text-forest-green" />
                    <span className="ml-4 font-bold text-charcoal">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
