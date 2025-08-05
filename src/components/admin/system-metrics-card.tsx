"use client"

import { 
  Activity,
  AlertTriangle,
  DollarSign,
  FileText, 
  Loader2,
  RefreshCw,
  TrendingUp,
  Users
} from "lucide-react"
import { useEffect, useState } from 'react'

import { Badge } from "@/components/ui/badge"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"

interface SystemMetrics {
  total_users: number
  quotes_created: number
  quotes_sent: number
  quotes_accepted: number
  total_revenue: number
  conversion_rate: number
  send_rate: number
  average_quote_value: number
  last_updated: string
  error?: string
}

export function SystemMetricsCard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [rateLimits, setRateLimits] = useState<any>(null)

  const fetchMetrics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch('/api/admin/metrics')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch metrics')
      }
      
      setMetrics(result.data)
      setRateLimits(result.rate_limits)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-charcoal/70" />
          <span className="ml-2 text-charcoal/70">Loading metrics...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-paper-white border-stone-gray shadow-sm border-l-4 border-l-equipment-yellow">
        <CardContent className="flex items-center p-4">
          <AlertTriangle className="h-5 w-5 text-equipment-yellow mr-3" />
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">
              Error Loading Metrics
            </p>
            <p className="text-xs text-charcoal/70">
              {error}
            </p>
          </div>
          <Badge variant="outline" className="text-equipment-yellow border-equipment-yellow">
            Error
          </Badge>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  // Use backend-calculated rates, fallback to local calculation
  const conversionRate = metrics.conversion_rate ?? (metrics.quotes_created > 0 
    ? Math.round((metrics.quotes_accepted / metrics.quotes_created) * 100)
    : 0)
  
  const sendRate = metrics.send_rate ?? (metrics.quotes_created > 0
    ? Math.round((metrics.quotes_sent / metrics.quotes_created) * 100)
    : 0)

  return (
    <div className="space-y-6">
      {/* PostHog Configuration Notice */}
      {metrics.error && metrics.error.includes('not configured') && (
        <Card className="bg-paper-white border-stone-gray shadow-sm border-l-4 border-l-equipment-yellow">
          <CardContent className="flex items-center p-4">
            <AlertTriangle className="h-5 w-5 text-equipment-yellow mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-charcoal">
                PostHog Analytics Setup Required
              </p>
              <p className="text-xs text-charcoal/70">
                Configure PostHog in Admin Settings to see real system metrics. Currently showing zero values.
              </p>
            </div>
            <Badge variant="outline" className="text-equipment-yellow border-equipment-yellow">
              Setup Required
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Header with Refresh and Status - Mobile Responsive */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-charcoal">System Analytics</h2>
          <p className="text-xs sm:text-sm text-charcoal/70">
            Live metrics from PostHog • Last updated: {new Date(metrics.last_updated).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Rate Limit Status - Hidden on mobile */}
          {rateLimits && (
            <div className="hidden md:block text-xs text-charcoal/60">
              <div>API Usage: {rateLimits.current_minute}/{rateLimits.limits.per_minute}/min</div>
              <div>{rateLimits.current_hour}/{rateLimits.limits.per_hour}/hour</div>
            </div>
          )}
          
          {/* Status Badge */}
          {metrics.error ? (
            <Badge variant="outline" className="text-equipment-yellow border-equipment-yellow">
              {metrics.error.includes('not configured') ? 'Setup Required' : 'Connection Issue'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-success-green border-success-green">
              Live Data
            </Badge>
          )}
          
          {/* Refresh Button - Touch friendly */}
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="flex items-center space-x-1 px-3 py-2 bg-light-concrete text-charcoal rounded-lg font-semibold hover:bg-stone-gray/20 focus:ring-2 focus:ring-forest-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] justify-center sm:justify-start"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid - Mobile First Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-charcoal truncate">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 lg:h-5 lg:w-5 text-charcoal/70 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="font-mono text-xl sm:text-2xl font-bold text-charcoal">
              {metrics.total_users}
            </div>
            <p className="text-xs text-charcoal/70">
              Platform users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-charcoal truncate">
              Quotes Created
            </CardTitle>
            <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-charcoal/70 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="font-mono text-xl sm:text-2xl font-bold text-charcoal">
              {metrics.quotes_created}
            </div>
            <p className="text-xs text-charcoal/70">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-charcoal truncate">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-charcoal/70 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="font-mono text-xl sm:text-2xl font-bold text-charcoal">
              {conversionRate}%
            </div>
            <p className="text-xs text-charcoal/70">
              {metrics.quotes_accepted} of {metrics.quotes_created} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-charcoal truncate">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-charcoal/70 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="font-mono text-xl sm:text-2xl font-bold text-charcoal">
              ${metrics.total_revenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-charcoal/70">
              From accepted quotes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-charcoal truncate">
              Avg Quote Value
            </CardTitle>
            <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-charcoal/70 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="font-mono text-xl sm:text-2xl font-bold text-charcoal">
              ${metrics.average_quote_value?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-charcoal/70">
              Per accepted quote
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics - Mobile Enhanced */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-charcoal">
            Quote Performance
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-charcoal/70">
            Quote creation and conversion metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
            <span className="text-sm text-charcoal/70">Quotes Created</span>
            <span className="font-mono text-charcoal font-semibold text-base">
              {metrics.quotes_created}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
            <span className="text-sm text-charcoal/70">Quotes Sent</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-charcoal font-semibold text-base">
                {metrics.quotes_sent}
              </span>
              <span className="text-xs text-charcoal/60">
                ({sendRate}% sent rate)
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
            <span className="text-sm text-charcoal/70">Quotes Accepted</span>
            <span className="font-mono text-charcoal font-semibold text-base">
              {metrics.quotes_accepted}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <span className="text-sm text-charcoal/70">Conversion Rate</span>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-charcoal font-semibold text-base">
                {conversionRate}%
              </span>
              <div className="w-20 sm:w-16 bg-stone-gray/30 rounded-full h-2">
                <div 
                  className="bg-forest-green h-2 rounded-full" 
                  style={{ width: `${Math.min(conversionRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-charcoal/70">Average Quote Value</span>
            <span className="font-mono text-charcoal font-semibold">
              ${metrics.average_quote_value?.toLocaleString() || '0'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}