/**
 * React hooks for Formbricks analytics dashboard
 * 
 * Provides data fetching, real-time updates, and state management
 * for the analytics dashboard components.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { formbricksAnalyticsService } from '@/libs/formbricks/analytics-service';
import { 
  FormbricksAnalyticsData,
  FormbricksAnalyticsFilters,
  FormbricksAnalyticsQueryParams,
  FormbricksSurveyResponse
} from '@/libs/formbricks/types';

interface UseAnalyticsDataResult {
  data: FormbricksAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAnalyticsResponsesResult {
  responses: FormbricksSurveyResponse[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing analytics overview data
 */
export function useAnalyticsData(filters: FormbricksAnalyticsFilters = {}): UseAnalyticsDataResult {
  const [data, setData] = useState<FormbricksAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to prevent infinite loops
  const memoizedFilters = useMemo(() => ({
    dateRange: filters.dateRange,
    surveyIds: filters.surveyIds || [],
    completed: filters.completed,
    limit: filters.limit,
    offset: filters.offset
  }), [
    filters.dateRange?.start?.getTime(),
    filters.dateRange?.end?.getTime(),
    JSON.stringify(filters.surveyIds || []),
    filters.completed,
    filters.limit,
    filters.offset
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching analytics data via hook with filters:', memoizedFilters);
      
      const analyticsData = await formbricksAnalyticsService.fetchAnalyticsData(memoizedFilters);
      setData(analyticsData);
      console.log('✅ Analytics data fetched successfully via hook');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);
      console.error('❌ Analytics data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  // Debounced effect to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for paginated survey responses with filtering
 */
export function useAnalyticsResponses(
  params: FormbricksAnalyticsQueryParams = {}
): UseAnalyticsResponsesResult {
  const [responses, setResponses] = useState<FormbricksSurveyResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Memoize params to prevent infinite loops
  const memoizedParams = useMemo(() => ({
    page: params.page,
    limit: params.limit || 20,
    sort: params.sort,
    surveyId: params.surveyId,
    finished: params.finished,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo
  }), [
    params.page,
    params.limit,
    JSON.stringify(params.sort),
    params.surveyId,
    params.finished,
    params.dateFrom,
    params.dateTo
  ]);

  const fetchResponses = useCallback(async (page = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching responses via hook:', { page, append, params: memoizedParams });
      
      const result = await formbricksAnalyticsService.fetchSurveyResponses({
        ...memoizedParams,
        page,
      });

      if (append) {
        setResponses(prev => [...prev, ...result.responses]);
      } else {
        setResponses(result.responses);
      }
      
      setTotal(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(page);
      
      console.log('✅ Responses fetched successfully via hook:', {
        count: result.responses.length,
        total: result.total,
        hasMore: result.hasMore
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch responses';
      setError(errorMessage);
      console.error('❌ Responses fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchResponses(currentPage + 1, true);
    }
  }, [loading, hasMore, currentPage, fetchResponses]);

  const refetch = useCallback(async () => {
    setCurrentPage(1);
    await fetchResponses(1, false);
  }, [fetchResponses]);

  // Debounced effect to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [memoizedParams]);

  return {
    responses,
    total,
    hasMore,
    loading,
    error,
    loadMore,
    refetch,
  };
}

/**
 * Hook for real-time updates
 */
export function useRealTimeUpdates(interval = 30000) {
  const [lastUpdate, setLastUpdate] = useState<string>(() => new Date().toISOString());
  const [newResponsesCount, setNewResponsesCount] = useState(0);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const latestResponses = await formbricksAnalyticsService.fetchLatestResponses(lastUpdate);
        if (latestResponses.length > 0) {
          setNewResponsesCount(prev => prev + latestResponses.length);
          setLastUpdate(new Date().toISOString());
        }
      } catch (error) {
        console.error('Error checking for real-time updates:', error);
      }
    };

    const intervalId = setInterval(checkForUpdates, interval);
    return () => clearInterval(intervalId);
  }, [lastUpdate, interval]);

  const resetNewResponsesCount = useCallback(() => {
    setNewResponsesCount(0);
    setLastUpdate(new Date().toISOString());
  }, []);

  return {
    newResponsesCount,
    resetNewResponsesCount,
  };
}

/**
 * Hook for searching responses
 */
export function useResponseSearch() {
  const [searchResults, setSearchResults] = useState<FormbricksSurveyResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchResponses = useCallback(async (
    searchTerm: string, 
    filters: FormbricksAnalyticsFilters = {}
  ) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setSearchError(null);
      
      const results = await formbricksAnalyticsService.searchResponses(searchTerm, filters);
      setSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    searching,
    searchError,
    searchResponses,
    clearSearch,
  };
}

/**
 * Hook for exporting data
 */
export function useDataExport() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportResponses = useCallback(async (
    filters: FormbricksAnalyticsFilters = {},
    filename = 'formbricks-responses.csv'
  ) => {
    try {
      setExporting(true);
      setExportError(null);
      
      const csvContent = await formbricksAnalyticsService.exportResponses(filters);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exporting,
    exportError,
    exportResponses,
  };
}