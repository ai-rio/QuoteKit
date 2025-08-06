'use client'

import { 
  BarChart3, 
  Calendar,
  Crown,
  DollarSign, 
  FileText,
  Lock,
  PieChart,
  Target,
  TrendingUp, 
  Users} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

interface AnalyticsData {
  quoteAnalytics: {
    total_quotes: number
    draft_quotes: number
    sent_quotes: number
    accepted_quotes: number
    declined_quotes: number
    expired_quotes: number
    converted_quotes: number
    template_count: number
    total_quote_value: number
    accepted_value: number
    average_quote_value: number
    acceptance_rate_percent: number
    unique_clients_count: number
  } | null
  clientAnalytics: Array<{
    client_id: string
    client_name: string
    email: string
    phone: string
    total_quotes: number
    accepted_quotes: number
    declined_quotes: number
    total_quote_value: number
    accepted_value: number
    average_quote_value: number
    acceptance_rate_percent: number
    last_quote_date: string
    client_since: string
  }>
  recentQuotes: Array<{
    id: string
    total: number
    status: string
    created_at: string
    client_name: string
  }>
}

interface AnalyticsDashboardProps {
  hasAccess: boolean
  analyticsData: AnalyticsData | null
}

export function AnalyticsDashboard({ hasAccess, analyticsData }: AnalyticsDashboardProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { isFreePlan } = useFeatureAccess()

  // If user doesn't have access, show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="space-y-6 bg-light-concrete min-h-screen p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-charcoal flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              Analytics Dashboard
              <Badge variant="outline" className="bg-equipment-yellow/10 text-equipment-yellow border-equipment-yellow">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </h1>
            <p className="text-charcoal/70">
              Get insights into your quote performance and business metrics
            </p>
          </div>
        </div>

        {/* Locked Analytics Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Quotes', value: '••', icon: FileText },
            { title: 'Acceptance Rate', value: '••%', icon: Target },
            { title: 'Total Revenue', value: '$•,•••', icon: DollarSign },
            { title: 'Active Clients', value: '••', icon: Users },
          ].map((stat, index) => (
            <Card key={index} className="bg-paper-white border-stone-gray shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-charcoal/5 flex items-center justify-center">
                <Lock className="w-8 h-8 text-charcoal/30" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 opacity-50">
                <CardTitle className="text-sm font-medium text-charcoal/70">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-charcoal/50" />
              </CardHeader>
              <CardContent className="opacity-50">
                <div className="text-2xl font-bold text-charcoal/70">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Locked Charts Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-paper-white border-stone-gray shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-charcoal/5 flex items-center justify-center z-10">
              <div className="text-center">
                <Lock className="w-12 h-12 text-charcoal/30 mx-auto mb-2" />
                <p className="text-sm text-charcoal/60 font-medium">Quote Performance Chart</p>
              </div>
            </div>
            <CardHeader className="opacity-30">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quote Performance
              </CardTitle>
              <CardDescription>Track your quote success over time</CardDescription>
            </CardHeader>
            <CardContent className="opacity-30">
              <div className="h-64 bg-light-concrete rounded-lg"></div>
            </CardContent>
          </Card>

          <Card className="bg-paper-white border-stone-gray shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-charcoal/5 flex items-center justify-center z-10">
              <div className="text-center">
                <Lock className="w-12 h-12 text-charcoal/30 mx-auto mb-2" />
                <p className="text-sm text-charcoal/60 font-medium">Client Analytics Chart</p>
              </div>
            </div>
            <CardHeader className="opacity-30">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Client Breakdown
              </CardTitle>
              <CardDescription>Analyze your client relationships</CardDescription>
            </CardHeader>
            <CardContent className="opacity-30">
              <div className="h-64 bg-light-concrete rounded-lg"></div>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Prompt */}
        <UpgradePrompt
          feature="Analytics Dashboard"
          title="Unlock Powerful Business Analytics"
          description="Get detailed insights into your quote performance, client relationships, and business growth with our comprehensive analytics dashboard."
          inline={true}
          benefits={[
            'Detailed quote performance metrics',
            'Client relationship analytics',
            'Revenue tracking and forecasting',
            'Acceptance rate optimization',
            'Custom date range analysis',
            'Export analytics reports'
          ]}
          onUpgrade={() => setShowUpgradeModal(true)}
        />

        {/* Upgrade Modal */}
        <UpgradePrompt
          feature="Analytics Dashboard"
          title="Upgrade for Advanced Analytics"
          description="Transform your quote data into actionable business insights with our comprehensive analytics suite."
          modal={true}
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          benefits={[
            'Complete quote performance dashboard',
            'Client analytics and relationship tracking',
            'Revenue forecasting and trends',
            'Acceptance rate optimization insights',
            'Custom reporting and data export',
            'Advanced business intelligence tools'
          ]}
        />
      </div>
    )
  }

  // User has access - show full analytics
  const stats = analyticsData?.quoteAnalytics

  return (
    <div className="space-y-6 bg-light-concrete min-h-screen p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Analytics Dashboard
          </h1>
          <p className="text-charcoal/70">
            Insights into your quote performance and business metrics
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Custom Date Range
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Quotes
            </CardTitle>
            <FileText className="h-4 w-4 text-forest-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {stats?.total_quotes || 0}
            </div>
            <p className="text-xs text-charcoal/60">
              {stats?.template_count || 0} templates
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Acceptance Rate
            </CardTitle>
            <Target className="h-4 w-4 text-equipment-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {stats?.acceptance_rate_percent || 0}%
            </div>
            <Progress 
              value={stats?.acceptance_rate_percent || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              ${(stats?.accepted_value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-charcoal/60">
              Avg: ${(stats?.average_quote_value || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Active Clients
            </CardTitle>
            <Users className="h-4 w-4 text-forest-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {stats?.unique_clients_count || 0}
            </div>
            <p className="text-xs text-charcoal/60">
              Unique clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-light-concrete border border-stone-gray">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-paper-white data-[state=active]:text-charcoal text-charcoal/60"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="quotes"
            className="data-[state=active]:bg-paper-white data-[state=active]:text-charcoal text-charcoal/60"
          >
            Quote Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="clients"
            className="data-[state=active]:bg-paper-white data-[state=active]:text-charcoal text-charcoal/60"
          >
            Client Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quote Status Breakdown */}
          <Card className="bg-paper-white border-stone-gray shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Quote Status Breakdown
              </CardTitle>
              <CardDescription>
                Distribution of your quotes by current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Draft', value: stats?.draft_quotes || 0, color: 'bg-charcoal/20' },
                  { label: 'Sent', value: stats?.sent_quotes || 0, color: 'bg-equipment-yellow/20' },
                  { label: 'Accepted', value: stats?.accepted_quotes || 0, color: 'bg-success-green/20' },
                  { label: 'Declined', value: stats?.declined_quotes || 0, color: 'bg-error-red/20' },
                  { label: 'Expired', value: stats?.expired_quotes || 0, color: 'bg-stone-gray/20' },
                  { label: 'Converted', value: stats?.converted_quotes || 0, color: 'bg-forest-green/20' },
                ].map((status) => (
                  <div key={status.label} className={`p-3 rounded-lg ${status.color}`}>
                    <div className="text-lg font-bold text-charcoal">{status.value}</div>
                    <div className="text-sm text-charcoal/70">{status.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          <Card className="bg-paper-white border-stone-gray shadow-sm">
            <CardHeader>
              <CardTitle>Quote Performance Analysis</CardTitle>
              <CardDescription>
                Detailed analysis of your quote success and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-charcoal/60">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-charcoal/30" />
                <p>Quote performance charts and trends will be displayed here</p>
                <p className="text-sm mt-2">Feature coming soon in the next update</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card className="bg-paper-white border-stone-gray shadow-sm">
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
              <CardDescription>
                Your most valuable client relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.clientAnalytics && analyticsData.clientAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.clientAnalytics.slice(0, 10).map((client) => (
                    <div key={client.client_id} className="flex items-center justify-between p-3 bg-light-concrete rounded-lg">
                      <div>
                        <div className="font-medium text-charcoal">{client.client_name}</div>
                        <div className="text-sm text-charcoal/60">
                          {client.total_quotes} quotes • {client.acceptance_rate_percent}% acceptance
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-charcoal">
                          ${(client.accepted_value || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-charcoal/60">revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-charcoal/60">
                  <Users className="w-12 h-12 mx-auto mb-4 text-charcoal/30" />
                  <p>No client data available yet</p>
                  <p className="text-sm mt-2">Create some quotes to see client analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
