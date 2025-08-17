"use client"

/**
 * Analytics Metrics Cards Component
 * FB-013: Key statistics display for Formbricks analytics
 */

import { 
  Activity,
  BarChart3, 
  Calendar,
  CheckCircle, 
  MessageSquare, 
  Target,
  TrendingUp, 
  Users} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { AnalyticsErrorState } from './analytics-error-state';
import type { FormbricksAnalyticsData, MetricsCardData } from './types';

interface AnalyticsMetricsCardsProps {
  data: FormbricksAnalyticsData;
  loading?: boolean;
  error?: string | null;
}

export function AnalyticsMetricsCards({
  data,
  loading = false,
  error = null
}: AnalyticsMetricsCardsProps) {
  // Calculate derived metrics
  const totalSurveys = data.metrics.totalSurveys;
  const totalResponses = data.metrics.totalResponses;
  const avgCompletionRate = data.metrics.averageCompletionRate;
  const responseRate = data.metrics.responseRate;
  const activeSurveys = data.metrics.activeSurveys;
  
  // Recent responses (last 7 days vs previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const recentResponses = data.responsesByPeriod.filter(
    item => new Date(item.date) >= sevenDaysAgo
  ).reduce((sum, item) => sum + item.count, 0);
  
  const previousWeekResponses = data.responsesByPeriod.filter(
    item => {
      const date = new Date(item.date);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    }
  ).reduce((sum, item) => sum + item.count, 0);
  
  const responsesTrend = previousWeekResponses > 0 
    ? ((recentResponses - previousWeekResponses) / previousWeekResponses) * 100
    : 0;

  // Calculate active survey completion rate
  const activeSurveysCompletionRate = data.surveys
    .filter(survey => survey.status === 'inProgress')
    .reduce((sum, survey) => sum + survey.completionRate, 0) / Math.max(activeSurveys, 1);

  // Metrics cards data
  const metricsCards: MetricsCardData[] = [
    {
      title: "Total Surveys",
      value: totalSurveys,
      subtitle: `${activeSurveys} active`,
      icon: BarChart3,
      loading,
      error: error ? "Failed to load" : undefined
    },
    {
      title: "Total Responses",
      value: totalResponses.toLocaleString(),
      subtitle: `${recentResponses} this week`,
      icon: MessageSquare,
      trend: {
        value: Math.abs(responsesTrend),
        direction: responsesTrend > 0 ? 'up' : responsesTrend < 0 ? 'down' : 'neutral',
        label: `vs last week`
      },
      loading,
      error: error ? "Failed to load" : undefined
    },
    {
      title: "Avg Completion Rate",
      value: `${avgCompletionRate.toFixed(1)}%`,
      subtitle: "All surveys",
      icon: CheckCircle,
      loading,
      error: error ? "Failed to load" : undefined
    },
    {
      title: "Response Rate",
      value: `${responseRate.toFixed(1)}%`,
      subtitle: "Survey engagement",
      icon: Target,
      loading,
      error: error ? "Failed to load" : undefined
    },
    {
      title: "Active Surveys",
      value: activeSurveys,
      subtitle: `${activeSurveysCompletionRate.toFixed(1)}% avg completion`,
      icon: Activity,
      loading,
      error: error ? "Failed to load" : undefined
    },
    {
      title: "This Week",
      value: recentResponses,
      subtitle: "New responses",
      icon: Calendar,
      trend: {
        value: Math.abs(responsesTrend),
        direction: responsesTrend > 0 ? 'up' : responsesTrend < 0 ? 'down' : 'neutral',
        label: `${responsesTrend > 0 ? '+' : responsesTrend < 0 ? '-' : ''}${Math.round(Math.abs(responsesTrend))}%`
      },
      loading,
      error: error ? "Failed to load" : undefined
    }
  ];

  if (error && !data) {
    return (
      <AnalyticsErrorState
        title="Metrics Unavailable"
        message={error}
        variant="card"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-charcoal">
          Key Metrics
        </h2>
        {loading && (
          <Badge variant="outline" className="text-charcoal/60">
            Refreshing...
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {metricsCards.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
    </div>
  );
}

interface MetricCardProps {
  metric: MetricsCardData;
}

function MetricCard({ metric }: MetricCardProps) {
  const { title, value, subtitle, icon: Icon, trend, loading, error } = metric;

  return (
    <Card className="bg-paper-white border-stone-gray shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-charcoal truncate pr-2">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-charcoal/70 flex-shrink-0" />
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : error ? (
          <div className="space-y-1">
            <div className="text-lg font-mono text-charcoal/40">
              --
            </div>
            <p className="text-xs text-red-600">
              {error}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="font-mono text-xl sm:text-2xl font-bold text-charcoal">
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-charcoal/70">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center space-x-1 mt-2">
                <TrendingUp 
                  className={`h-3 w-3 ${
                    trend.direction === 'up' 
                      ? 'text-success-green' 
                      : trend.direction === 'down' 
                        ? 'text-red-500 rotate-180' 
                        : 'text-charcoal/50'
                  }`} 
                />
                <span 
                  className={`text-xs font-medium ${
                    trend.direction === 'up' 
                      ? 'text-success-green' 
                      : trend.direction === 'down' 
                        ? 'text-red-500' 
                        : 'text-charcoal/50'
                  }`}
                >
                  {trend.label}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}