/**
 * Survey Analytics Dashboard Page
 * 
 * Main dashboard for viewing and analyzing Formbricks survey responses.
 * Includes metrics overview, response table, filtering, and real-time updates.
 */

'use client';

import { 
  AlertCircle,
  BarChart3, 
  Download,
  Info,
  RefreshCw, 
  TrendingUp} from 'lucide-react';
import { useCallback, useEffect,useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsErrorBoundary, AnalyticsErrorFallback } from '@/features/analytics/components/analytics-error-boundary';
// Analytics components
import { AnalyticsMetricsCards } from '@/features/analytics/components/analytics-metrics-cards';
import { SurveyResponsesTable } from '@/features/analytics/components/survey-responses-table';
// Analytics hooks (using API endpoints)
import { 
  useApiAnalyticsData as useAnalyticsData,
  useApiAnalyticsResponses as useAnalyticsResponses,
  useApiDataExport as useDataExport,
  useApiRealTimeUpdates as useRealTimeUpdates,
  useApiResponseSearch as useResponseSearch} from '@/features/analytics/hooks/use-formbricks-api';
// Types
import { 
  FormbricksAnalyticsFilters,
  FormbricksAnalyticsSortOptions
} from '@/libs/formbricks/types';

export default function SurveyAnalyticsPage() {
  // State for filters and sorting
  const [filters, setFilters] = useState<FormbricksAnalyticsFilters>({});
  const [sort, setSort] = useState<FormbricksAnalyticsSortOptions>({
    field: 'createdAt',
    direction: 'desc'
  });

  // Analytics data hooks
  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useAnalyticsData(filters);

  const {
    responses,
    total,
    hasMore,
    loading: responsesLoading,
    error: responsesError,
    loadMore,
    refetch: refetchResponses
  } = useAnalyticsResponses({ ...filters, sort });

  // Real-time updates
  const { newResponsesCount, resetNewResponsesCount } = useRealTimeUpdates(30000);

  // Search functionality
  const {
    searchResults,
    searching,
    searchError,
    searchResponses,
    clearSearch
  } = useResponseSearch();

  // Export functionality
  const { exporting, exportError, exportResponses } = useDataExport();

  // Handle refresh all data
  const handleRefreshAll = useCallback(async () => {
    await Promise.all([
      refetchAnalytics(),
      refetchResponses()
    ]);
    resetNewResponsesCount();
  }, [refetchAnalytics, refetchResponses, resetNewResponsesCount]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FormbricksAnalyticsFilters) => {
    setFilters(newFilters);
    clearSearch(); // Clear search when filters change
  }, [clearSearch]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: FormbricksAnalyticsSortOptions) => {
    setSort(newSort);
  }, []);

  // Handle search
  const handleSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.trim()) {
      await searchResponses(searchTerm, filters);
    } else {
      clearSearch();
    }
  }, [searchResponses, clearSearch, filters]);

  // Handle export
  const handleExport = useCallback(async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `formbricks-responses-${timestamp}.csv`;
    await exportResponses(filters, filename);
  }, [exportResponses, filters]);

  // Auto-refresh when new responses are detected
  useEffect(() => {
    if (newResponsesCount > 0) {
      // You could show a notification here or auto-refresh
      console.log(`${newResponsesCount} new responses detected`);
    }
  }, [newResponsesCount]);

  // Determine which responses to show (search results or filtered results)
  const displayResponses = searchResults.length > 0 ? searchResults : responses;
  const displayTotal = searchResults.length > 0 ? searchResults.length : total;

  return (
    <AnalyticsErrorBoundary fallback={AnalyticsErrorFallback}>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Survey Analytics</h1>
          <p className="text-charcoal/70 mt-1">
            Monitor and analyze Formbricks survey responses
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {newResponsesCount > 0 && (
            <Button
              onClick={handleRefreshAll}
              variant="outline"
              className="relative"
            >
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {newResponsesCount}
              </Badge>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          
          <Button
            onClick={handleRefreshAll}
            variant="outline"
            disabled={analyticsLoading || responsesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(analyticsLoading || responsesLoading) ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Real-time Update Alert */}
      {newResponsesCount > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {newResponsesCount} new response{newResponsesCount > 1 ? 's' : ''} detected. 
            <Button 
              variant="link" 
              className="p-0 ml-1 h-auto text-blue-600"
              onClick={handleRefreshAll}
            >
              Refresh to view
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alerts */}
      {analyticsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Analytics Error: {analyticsError}
          </AlertDescription>
        </Alert>
      )}

      {searchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Search Error: {searchError}
          </AlertDescription>
        </Alert>
      )}

      {exportError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Export Error: {exportError}
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <AnalyticsMetricsCards
        data={analyticsData}
        loading={analyticsLoading}
        error={analyticsError}
      />

      {/* Survey Summary Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performing Surveys */}
          <Card className="bg-white border-stone-gray/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Performing Surveys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.completionRates
                  .sort((a, b) => b.completionRate - a.completionRate)
                  .slice(0, 3)
                  .map((survey, index) => (
                    <div key={survey.surveyId} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate">
                          {survey.surveyName}
                        </p>
                        <p className="text-xs text-charcoal/60">
                          {survey.completionRate}% completion rate
                        </p>
                      </div>
                      <Badge 
                        variant={index === 0 ? "default" : "secondary"}
                        className={index === 0 ? "bg-green-100 text-green-700" : ""}
                      >
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                {analyticsData.completionRates.length === 0 && (
                  <p className="text-sm text-charcoal/60 text-center py-4">
                    No survey data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white border-stone-gray/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.responsesByPeriod
                  .slice(-5)
                  .reverse()
                  .map((period) => (
                    <div key={period.date} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {new Date(period.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {period.count} response{period.count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                {analyticsData.responsesByPeriod.length === 0 && (
                  <p className="text-sm text-charcoal/60 text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Responses Table */}
      <SurveyResponsesTable
        responses={displayResponses}
        surveys={analyticsData?.surveys || []}
        total={displayTotal}
        hasMore={hasMore && searchResults.length === 0} // Don't show load more for search results
        loading={responsesLoading || searching}
        error={responsesError}
        filters={filters}
        sort={sort}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onLoadMore={loadMore}
        onRefresh={refetchResponses}
        onExport={handleExport}
        onSearch={handleSearch}
      />

      {/* Export Status */}
      {exporting && (
        <Alert className="border-blue-200 bg-blue-50">
          <Download className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            Exporting survey responses... This may take a moment for large datasets.
          </AlertDescription>
        </Alert>
      )}
      </div>
    </AnalyticsErrorBoundary>
  );
}