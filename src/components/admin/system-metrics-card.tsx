"use client"

import { useEffect, useState } from 'react'
import { 
  Activity,
  AlertTriangle,
  DollarSign,
  FileText, 
  Loader2,
  TrendingUp,
  Users} from "lucide-react"

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
}

export function SystemMetricsCard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/admin/metrics')
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch metrics')
        }
        
        setMetrics(result.data)
      } catch (error) {
        console.error('Error fetching metrics:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

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

  const conversionRate = metrics.quotes_created > 0 
    ? Math.round((metrics.quotes_accepted / metrics.quotes_created) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {metrics.total_users}
            </div>
            <p className="text-xs text-charcoal/70">
              Platform users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Quotes Created
            </CardTitle>
            <FileText className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {metrics.quotes_created}
            </div>
            <p className="text-xs text-charcoal/70">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {conversionRate}%
            </div>
            <p className="text-xs text-charcoal/70">
              {metrics.quotes_accepted} of {metrics.quotes_created} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              ${metrics.total_revenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-charcoal/70">
              From accepted quotes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title text-charcoal">
            Quote Performance
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Quote creation and conversion metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-charcoal/70">Quotes Created</span>
            <span className="font-mono text-charcoal font-semibold">
              {metrics.quotes_created}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-charcoal/70">Quotes Sent</span>
            <span className="font-mono text-charcoal font-semibold">
              {metrics.quotes_sent}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-charcoal/70">Quotes Accepted</span>
            <span className="font-mono text-charcoal font-semibold">
              {metrics.quotes_accepted}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-charcoal/70">Conversion Rate</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-charcoal font-semibold">
                {conversionRate}%
              </span>
              <div className="w-16 bg-stone-gray/30 rounded-full h-2">
                <div 
                  className="bg-forest-green h-2 rounded-full" 
                  style={{ width: `${Math.min(conversionRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}