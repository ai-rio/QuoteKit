/**
 * Client-side hooks for Formbricks Analytics API
 * 
 * These hooks use the server-side API endpoints to ensure proper
 * admin authentication and server-side data fetching.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { 
  FormbricksAnalyticsData,
  FormbricksAnalyticsFilters,
  FormbricksAnalyticsQueryParams,
  FormbricksSurvey,
  FormbricksSurveyResponse} from '@/libs/formbricks/types';

interface UseApiAnalyticsDataResult {
  data: FormbricksAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseApiAnalyticsResponsesResult {
  responses: FormbricksSurveyResponse[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching analytics overview data via API
 */
export function useApiAnalyticsData(filters: FormbricksAnalyticsFilters = {}): UseApiAnalyticsDataResult {
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

      console.log('🔄 API: Fetching analytics overview data');

      const queryParams = new URLSearchParams({
        action: 'overview',
        ...Object.entries(memoizedFilters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/admin/analytics/formbricks?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }

      const result = await response.json();
      setData(result.data);
      console.log('✅ API: Analytics overview data fetched successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error('❌ API: Analytics API error:', err);
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
 * Hook for fetching paginated responses via API
 */
export function useApiAnalyticsResponses(
  params: FormbricksAnalyticsQueryParams = {}
): UseApiAnalyticsResponsesResult {
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

      console.log('🔄 API: Fetching responses data', { page, append, params: memoizedParams });

      const queryParams = new URLSearchParams({
        action: 'responses',
        page: page.toString(),
        limit: memoizedParams.limit.toString(),
        ...(memoizedParams.sort && {
          sortField: memoizedParams.sort.field,
          sortDirection: memoizedParams.sort.direction,
        }),
        ...Object.entries(memoizedParams).reduce((acc, [key, value]) => {
          if (key !== 'page' && key !== 'limit' && key !== 'sort' && value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/admin/analytics/formbricks?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch responses');
      }

      const result = await response.json();
      const { responses: newResponses, total: newTotal, hasMore: newHasMore } = result.data;

      if (append) {
        setResponses(prev => [...prev, ...newResponses]);
      } else {
        setResponses(newResponses);
      }
      
      setTotal(newTotal);
      setHasMore(newHasMore);
      setCurrentPage(page);
      
      console.log('✅ API: Responses data fetched successfully', {
        count: newResponses.length,
        total: newTotal,
        hasMore: newHasMore
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch responses');
      console.error('❌ API: Responses API error:', err);
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
      console.log('🔍 API: Params changed, fetching responses after debounce');
      refetch();
    }, 500); // 500ms debounce for responses (longer than overview)

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
 * Hook for fetching surveys list via API
 */
export function useApiSurveys() {
  const [surveys, setSurveys] = useState<FormbricksSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/analytics/formbricks?action=surveys');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch surveys');
      }

      const result = await response.json();
      setSurveys(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch surveys');
      console.error('Surveys API error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  return {
    surveys,
    loading,
    error,
    refetch: fetchSurveys,
  };
}

/**
 * Hook for searching responses via API
 */
export function useApiResponseSearch() {
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

      const queryParams = new URLSearchParams({
        action: 'search',
        q: searchTerm,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/admin/analytics/formbricks?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const result = await response.json();
      setSearchResults(result.data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      console.error('Search API error:', err);
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
 * Hook for real-time updates via API
 */
export function useApiRealTimeUpdates(interval = 30000) {
  const [lastUpdate, setLastUpdate] = useState<string>(() => new Date().toISOString());
  const [newResponsesCount, setNewResponsesCount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);

  // Disable real-time updates initially to prevent immediate API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEnabled(true);
    }, 5000); // Wait 5 seconds before enabling real-time updates

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const checkForUpdates = async () => {
      try {
        console.log('🔄 API: Checking for real-time updates');
        
        const response = await fetch('/api/admin/analytics/formbricks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ since: lastUpdate }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            console.log('✅ API: Found new responses:', result.data.length);
            setNewResponsesCount(prev => prev + result.data.length);
            setLastUpdate(new Date().toISOString());
          }
        }
      } catch (error) {
        console.error('❌ API: Error checking for real-time updates:', error);
      }
    };

    const intervalId = setInterval(checkForUpdates, interval);
    return () => clearInterval(intervalId);
  }, [lastUpdate, interval, isEnabled]);

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
 * Hook for data export via API
 */
export function useApiDataExport() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportResponses = useCallback(async (
    filters: FormbricksAnalyticsFilters = {},
    filename?: string
  ) => {
    try {
      setExporting(true);
      setExportError(null);

      const queryParams = new URLSearchParams({
        action: 'export',
        format: 'csv',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/admin/analytics/formbricks?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename || `formbricks-responses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
      console.error('Export API error:', err);
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