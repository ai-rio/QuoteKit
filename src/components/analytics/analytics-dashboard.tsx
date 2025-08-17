"use client"

/**
 * Analytics Dashboard Main Component
 * FB-013: Design Analytics Dashboard UI
 */

import { Download, Filter, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AnalyticsErrorState } from './analytics-error-state';
import { AnalyticsLoadingState } from './analytics-loading-state';
import { AnalyticsMetricsCards } from './analytics-metrics-cards';
import { CompletionRateChart } from './completion-rate-chart';
import { DataExportInterface } from './data-export-interface';
import { ResponseChart } from './response-chart';
import { ResponseFilters } from './response-filters';
import { SurveyResponsesList } from './survey-responses-list';
import type { 
  AnalyticsDashboardProps, 
  FilterState, 
  FormbricksAnalyticsData 
} from './types';

export function AnalyticsDashboard({
  initialData,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}: AnalyticsDashboardProps) {
  // State management
  const [data, setData] = useState<FormbricksAnalyticsData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filter state - use stable initial values to prevent infinite loops
  const [filters, setFilters] = useState<FilterState>(() => ({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    },
    surveyIds: [],
    completed: undefined,
    limit: 50,
    offset: 0
  }));

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => ({
    dateRange: filters.dateRange,
    surveyIds: filters.surveyIds,
    completed: filters.completed,
    limit: filters.limit,
    offset: filters.offset
  }), [
    filters.dateRange.start.getTime(),
    filters.dateRange.end.getTime(),
    filters.surveyIds.join(','),
    filters.completed,
    filters.limit,
    filters.offset
  ]);

  // Fetch analytics data - memoized to prevent infinite loops
  const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🔄 Fetching analytics data with filters:', memoizedFilters);
      
      // Use the admin API route instead of direct service call
      const response = await fetch('/api/admin/analytics/formbricks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
        console.log('✅ Analytics data fetched successfully');
      } else {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('❌ Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Remove memoizedFilters from dependencies to prevent loops

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    fetchAnalyticsData(true);
  }, [fetchAnalyticsData]);

  // Handle filter changes - debounced to prevent excessive API calls
  const handleFiltersChange = useCallback((newFilters: Partial<FilterState>) => {
    console.log('🔧 Filters changed:', newFilters);
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset pagination when filters change
    }));
  }, []);

  // Auto-refresh effect - only depends on autoRefresh and refreshInterval
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    console.log('⏰ Setting up auto-refresh interval:', refreshInterval);
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh triggered');
      fetchAnalyticsData(true);
    }, refreshInterval);

    return () => {
      console.log('⏰ Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchAnalyticsData]);

  // Initial data fetch - only run once if no initial data
  useEffect(() => {
    if (!initialData) {
      console.log('🚀 Initial data fetch');
      fetchAnalyticsData();
    }
  }, [fetchAnalyticsData, initialData]);

  // REMOVED: The problematic useEffect that was causing infinite loops
  // This was re-fetching data every time filters changed, causing the loop
  // Instead, we'll handle filter changes differently

  // Debounced filter effect to prevent excessive API calls
  useEffect(() => {
    if (!data) return; // Don't fetch if we don't have initial data yet

    const timeoutId = setTimeout(() => {
      console.log('🔍 Filters changed, fetching new data after debounce');
      fetchAnalyticsData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    memoizedFilters.dateRange.start.getTime(),
    memoizedFilters.dateRange.end.getTime(),
    memoizedFilters.surveyIds.join(','),
    memoizedFilters.completed
  ]); // Only depend on actual filter values, not the fetchAnalyticsData function

  // Loading state
  if (loading && !data) {
    return <AnalyticsLoadingState variant="full" />;
  }

  // Error state
  if (error && !data) {
    return (
      <AnalyticsErrorState
        title="Failed to Load Analytics"
        message={error}
        onRetry={() => fetchAnalyticsData()}
        variant="banner"
      />
    );
  }

  if (!data) {
    return (
      <AnalyticsErrorState
        title="No Data Available"
        message="Unable to load analytics data. Please try again."
        onRetry={() => fetchAnalyticsData()}
        variant="banner"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex-1">
          <h1 className="text-4xl md:text-6xl font-black text-forest-green">
            Survey Analytics
          </h1>
          <p className="text-lg text-charcoal">
            Formbricks survey response data and insights
          </p>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          {/* Status and Last Updated */}
          <div className="flex flex-col items-start sm:items-end space-y-1">
            <div className="flex items-center space-x-2">
              {error ? (
                <Badge variant="destructive">Connection Error</Badge>
              ) : (
                <Badge variant="outline" className="text-forest-green border-forest-green">
                  Live Data
                </Badge>
              )}
              {autoRefresh && (
                <Badge variant="secondary">Auto-refresh</Badge>
              )}
            </div>
            <p className="text-sm text-charcoal">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="min-h-[44px]"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExport(!showExport)}
              className="min-h-[44px]"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">Filters</CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Customize the data view with date ranges and survey filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponseFilters
              filters={filters}
              onChange={handleFiltersChange}
              surveys={data.surveys}
            />
          </CardContent>
        </Card>
      )}

      {/* Export Panel */}
      {showExport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">Export Data</CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Download analytics data in various formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataExportInterface
              data={data}
              filters={filters}
              onExport={() => setShowExport(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <AnalyticsMetricsCards
        data={data}
        loading={refreshing}
        error={error}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="surveys">Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponseChart
              data={data.responsesByPeriod}
              loading={refreshing}
              title="Responses Over Time"
            />
            <CompletionRateChart
              data={data.completionRates as any}
              loading={refreshing}
              title="Survey Completion Rates"
            />
          </div>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          <SurveyResponsesList
            responses={data.responses}
            surveys={data.surveys}
            loading={refreshing}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </TabsContent>

        <TabsContent value="surveys" className="space-y-6">
          <div className="grid gap-6">
            {data.surveys.map((survey) => (
              <Card key={survey.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">{survey.name}</CardTitle>
                    <Badge 
                      variant={survey.status === 'inProgress' ? 'default' : 'secondary'}
                    >
                      {survey.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-lg text-charcoal">
                    {survey.questions.length} questions • {survey.responseCount} responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-lg">
                    <div>
                      <p className="text-charcoal">Type</p>
                      <p className="font-medium capitalize">{survey.type}</p>
                    </div>
                    <div>
                      <p className="text-charcoal">Responses</p>
                      <p className="font-mono font-medium text-forest-green">{survey.responseCount}</p>
                    </div>
                    <div>
                      <p className="text-charcoal">Completion Rate</p>
                      <p className="font-mono font-medium text-forest-green">{survey.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-charcoal">Created</p>
                      <p className="font-medium">
                        {new Date(survey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

