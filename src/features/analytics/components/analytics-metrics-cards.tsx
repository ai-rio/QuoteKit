/**
 * Analytics Metrics Cards Component
 * 
 * Displays key metrics for Formbricks survey analytics in card format.
 */

'use client';

import { 
  AlertCircle, 
  BarChart3, 
  CheckCircle,
  MessageSquare, 
  TrendingUp, 
  Users} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FormbricksAnalyticsData } from '@/libs/formbricks/types';

interface AnalyticsMetricsCardsProps {
  data: FormbricksAnalyticsData | null;
  loading: boolean;
  error: string | null;
}

export function AnalyticsMetricsCards({ data, loading, error }: AnalyticsMetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-white border-stone-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-red-200 col-span-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to load metrics: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const metrics = [
    {
      title: "Total Surveys",
      value: data.metrics.totalSurveys,
      description: `${data.metrics.activeSurveys} active`,
      icon: BarChart3,
      trend: data.metrics.activeSurveys > 0 ? "positive" : "neutral",
    },
    {
      title: "Total Responses",
      value: data.metrics.totalResponses,
      description: "All survey responses",
      icon: MessageSquare,
      trend: data.metrics.totalResponses > 0 ? "positive" : "neutral",
    },
    {
      title: "Completion Rate", // completionRate metric
      value: `${data.metrics.averageCompletionRate}%`,
      description: "Average across all surveys",
      icon: CheckCircle,
      trend: data.metrics.averageCompletionRate > 70 ? "positive" : 
             data.metrics.averageCompletionRate > 40 ? "neutral" : "negative",
    },
    {
      title: "Response Rate",
      value: data.metrics.responseRate.toFixed(1),
      description: "Responses per survey",
      icon: TrendingUp,
      trend: data.metrics.responseRate > 10 ? "positive" : 
             data.metrics.responseRate > 5 ? "neutral" : "negative",
    },
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-charcoal/70";
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case "positive":
        return <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">Good</Badge>;
      case "negative":
        return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">Low</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">OK</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="bg-white border-stone-gray/20 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-charcoal/70">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${getTrendColor(metric.trend)}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-charcoal">
                    {metric.value}
                  </div>
                  <p className="text-xs text-charcoal/60 mt-1">
                    {metric.description}
                  </p>
                </div>
                <div className="ml-2">
                  {getTrendBadge(metric.trend)}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}