'use client';

import { useState, useEffect, useCallback } from 'react';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_url: string;
  description: string;
  type?: 'stripe_invoice' | 'subscription_change' | 'billing_record';
}

interface UseBillingHistoryReturn {
  data: BillingHistoryItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

/**
 * Custom hook for managing billing history data with real-time updates
 * Provides caching, error handling, and automatic refresh capabilities
 */
export function useBillingHistory(initialData: BillingHistoryItem[] = []): UseBillingHistoryReturn {
  const [data, setData] = useState<BillingHistoryItem[]>(initialData);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);
  const [error, setError] = useState<Error | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  // Fetch billing history from API
  const fetchBillingHistory = useCallback(async (isRefetch = false) => {
    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch('/api/billing-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache control for fresh data on refetch
        cache: isRefetch ? 'no-cache' : 'default',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `Failed to fetch billing history: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      
      // Validate response structure
      if (!Array.isArray(result.data)) {
        throw new Error('Invalid response format: expected array of billing history items');
      }

      // Validate each item has required fields
      const validatedData = result.data.map((item: any, index: number) => {
        if (!item.id || !item.date || typeof item.amount !== 'number') {
          console.warn(`Invalid billing history item at index ${index}:`, item);
          throw new Error(`Invalid billing history item: missing required fields`);
        }
        
        return {
          id: item.id,
          date: item.date,
          amount: item.amount,
          status: item.status || 'unknown',
          invoice_url: item.invoice_url || '#',
          description: item.description || 'Invoice',
          type: item.type || undefined,
        };
      });

      setData(validatedData);
      
      console.debug('useBillingHistory: Successfully fetched billing history', {
        itemCount: validatedData.length,
        isRefetch,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      
      console.error('useBillingHistory: Failed to fetch billing history', {
        error: error.message,
        isRefetch,
        timestamp: new Date().toISOString()
      });

      // If this is initial load and we have no data, keep empty array
      // If this is a refetch, keep existing data
      if (!isRefetch && data.length === 0) {
        setData([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [data.length]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    await fetchBillingHistory(true);
  }, [fetchBillingHistory]);

  // Initial data fetch (only if no initial data provided)
  useEffect(() => {
    if (initialData.length === 0) {
      fetchBillingHistory(false);
    } else {
      // If we have initial data, we're not loading
      setIsLoading(false);
      console.debug('useBillingHistory: Using initial data', {
        itemCount: initialData.length
      });
    }
  }, [fetchBillingHistory, initialData.length]);

  // Auto-refresh every 5 minutes for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if we're not currently loading/refetching and have no errors
      if (!isLoading && !isRefetching && !error) {
        console.debug('useBillingHistory: Auto-refreshing billing history');
        fetchBillingHistory(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchBillingHistory, isLoading, isRefetching, error]);

  // Listen for focus events to refresh data when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if we're not currently loading and have no errors
      if (!isLoading && !isRefetching && !error) {
        console.debug('useBillingHistory: Refreshing on window focus');
        fetchBillingHistory(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchBillingHistory, isLoading, isRefetching, error]);

  // Listen for online events to refresh data when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      // Refresh data when coming back online
      if (!isLoading && !isRefetching) {
        console.debug('useBillingHistory: Refreshing on connection restored');
        fetchBillingHistory(true);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchBillingHistory, isLoading, isRefetching]);

  // Listen for plan change events to refresh billing history immediately
  useEffect(() => {
    const handlePlanChange = () => {
      // Refresh billing history immediately after plan changes
      if (!isLoading && !isRefetching) {
        console.debug('useBillingHistory: Refreshing after plan change');
        fetchBillingHistory(true);
      }
    };

    const handlePaymentSuccess = () => {
      // Refresh billing history after successful payments
      if (!isLoading && !isRefetching) {
        console.debug('useBillingHistory: Refreshing after payment success');
        fetchBillingHistory(true);
      }
    };

    // Listen for custom plan change and payment events
    window.addEventListener('plan-change-completed', handlePlanChange);
    window.addEventListener('billing-history-updated', handlePlanChange);
    window.addEventListener('payment-success', handlePaymentSuccess);
    window.addEventListener('subscription-updated', handlePlanChange);
    
    return () => {
      window.removeEventListener('plan-change-completed', handlePlanChange);
      window.removeEventListener('billing-history-updated', handlePlanChange);
      window.removeEventListener('payment-success', handlePaymentSuccess);
      window.removeEventListener('subscription-updated', handlePlanChange);
    };
  }, [fetchBillingHistory, isLoading, isRefetching]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
}

/**
 * Hook for invalidating billing history cache
 * Useful after payment method changes or subscription updates
 */
export function useInvalidateBillingHistory() {
  return useCallback(() => {
    // This could be enhanced to work with a global cache invalidation system
    // For now, we'll trigger a custom event that the useBillingHistory hook can listen to
    window.dispatchEvent(new CustomEvent('invalidate-billing-history'));
  }, []);
}

/**
 * Enhanced version of useBillingHistory that listens for cache invalidation events
 */
export function useBillingHistoryWithInvalidation(initialData: BillingHistoryItem[] = []): UseBillingHistoryReturn {
  const billingHistory = useBillingHistory(initialData);

  // Listen for cache invalidation events
  useEffect(() => {
    const handleInvalidation = () => {
      console.debug('useBillingHistory: Cache invalidated, refetching data');
      billingHistory.refetch();
    };

    window.addEventListener('invalidate-billing-history', handleInvalidation);
    return () => window.removeEventListener('invalidate-billing-history', handleInvalidation);
  }, [billingHistory.refetch]);

  return billingHistory;
}
