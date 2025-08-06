'use client'

import { BarChart3, Calendar, Crown,Download, TrendingUp } from 'lucide-react'
import { useEffect,useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

interface UsageData {
  quotes_count: number
  pdf_exports_count?: number
  bulk_operations_count?: number
  monthly_history?: MonthlyUsage[]
}

interface MonthlyUsage {
  month_year: string
  quotes_count: number
  pdf_exports_count: number
  bulk_operations_count: number
}

interface UsageAnalyticsDashboardProps {
  /** Show compact version */
  compact?: boolean
  /** Show only specific features */
  features?: ('quotes' | 'pdf_exports' | 'bulk_operations')[]
  /** Custom title */
  title?: string
}

export function UsageAnalyticsDashboard({ 
  compact = false, 
  features = ['quotes', 'pdf_exports', 'bulk_operations'],
  title = 'Usage Analytics'
}: UsageAnalyticsDashboardProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [historicalData, setHistoricalData] = useState<MonthlyUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { features: planFeatures, usage, canAccess, isFreePlan } = useFeatureAccess()

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      
      // Fetch current usage
      const usageResponse = await fetch('/api/features/usage')
      if (!usageResponse.ok) {
        throw new Error('Failed to fetch usage data')
      }
      const { usage: currentUsage } = await usageResponse.json()
      setUsageData(currentUsage)

      // Fetch historical data if user has analytics access
      const analyticsAccess = canAccess('analytics')
      if (analyticsAccess.hasAccess) {
        const historyResponse = await fetch('/api/features/usage/history')
        if (historyResponse.ok) {
          const { history } = await historyResponse.json()
          setHistoricalData(history || [])
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }

  const exportUsageData = async () => {
    try {
      const response = await fetch('/api/features/usage/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv', includeHistory: true })
      })
      
      if (!response.ok) {
        throw new Error('Failed to export usage data')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `usage-analytics-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-forest-green'
  }

  if (loading) {
    return (
      <Card className="bg-paper-white border-stone-gray">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-paper-white border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchUsageData} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const UsageMetric = ({ 
    label, 
    current, 
    limit, 
    icon: Icon, 
    description 
  }: {
    label: string
    current: number
    limit: number
    icon: any
    description: string
  }) => {
    const percentage = getUsagePercentage(current, limit)
    const isUnlimited = limit === -1
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-charcoal/70" />
            <span className="font-medium text-charcoal">{label}</span>
            {isUnlimited && (
              <Badge className="bg-equipment-yellow text-charcoal text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Unlimited
              </Badge>
            )}
          </div>
          <span className="text-sm font-semibold text-charcoal">
            {current}{!isUnlimited && `/${limit}`}
          </span>
        </div>
        
        {!isUnlimited && (
          <div className="space-y-1">
            <Progress 
              value={percentage} 
              className="h-2"
              // Apply custom color based on usage level
            />
            <p className="text-xs text-charcoal/60">{description}</p>
          </div>
        )}
        
        {isUnlimited && (
          <p className="text-xs text-charcoal/60">{description}</p>
        )}
      </div>
    )
  }

  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const quotesUsed = usageData?.quotes_count || 0
  const quotesLimit = planFeatures.max_quotes

  return (
    <Card className="bg-paper-white border-stone-gray">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-charcoal flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              Track your feature usage and limits
            </CardDescription>
          </div>
          
          {!isFreePlan && (
            <Button 
              onClick={exportUsageData}
              variant="outline" 
              size="sm"
              className="text-charcoal border-charcoal/20 hover:bg-charcoal/5"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Usage Metrics */}
        <div className="space-y-4">
          {features.includes('quotes') && (
            <UsageMetric
              label="Quotes Created"
              current={quotesUsed}
              limit={quotesLimit}
              icon={Calendar}
              description={`This month (${currentMonth})`}
            />
          )}
          
          {features.includes('pdf_exports') && planFeatures.pdf_export && (
            <UsageMetric
              label="PDF Exports"
              current={usageData?.pdf_exports_count || 0}
              limit={-1} // Unlimited for premium users
              icon={Download}
              description="Professional PDF exports this month"
            />
          )}
          
          {features.includes('bulk_operations') && planFeatures.bulk_operations && (
            <UsageMetric
              label="Bulk Operations"
              current={usageData?.bulk_operations_count || 0}
              limit={-1} // Unlimited for premium users
              icon={TrendingUp}
              description="Bulk actions performed this month"
            />
          )}
        </div>

        {/* Historical Trends (Premium Feature) */}
        {!isFreePlan && historicalData.length > 0 && !compact && (
          <div className="border-t border-stone-gray pt-4">
            <h4 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Usage Trends (Last 6 Months)
            </h4>
            
            <div className="space-y-2">
              {historicalData.slice(-6).map((month) => (
                <div key={month.month_year} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal/70">{month.month_year}</span>
                  <div className="flex gap-4 text-charcoal">
                    <span>{month.quotes_count} quotes</span>
                    {planFeatures.pdf_export && (
                      <span>{month.pdf_exports_count} PDFs</span>
                    )}
                    {planFeatures.bulk_operations && (
                      <span>{month.bulk_operations_count} bulk ops</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Prompt for Free Users */}
        {isFreePlan() && (
          <div className="border-t border-stone-gray pt-4">
            <div className="bg-equipment-yellow/10 border border-equipment-yellow/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-equipment-yellow" />
                <span className="font-semibold text-charcoal">Unlock Advanced Analytics</span>
              </div>
              <p className="text-sm text-charcoal/70 mb-3">
                Get detailed usage trends, export capabilities, and unlimited features.
              </p>
              <Button 
                size="sm" 
                className="bg-forest-green text-paper-white hover:opacity-90"
                onClick={() => window.location.href = '/pricing?source=usage_dashboard'}
              >
                Upgrade to Premium
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for sidebars or small spaces
 */
export function CompactUsageAnalytics() {
  return (
    <UsageAnalyticsDashboard 
      compact={true} 
      features={['quotes']} 
      title="Usage Overview"
    />
  )
}
