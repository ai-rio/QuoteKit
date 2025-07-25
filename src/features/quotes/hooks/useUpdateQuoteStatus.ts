import { useState } from 'react';

import { QuoteStatus } from '../types';

interface UpdateQuoteStatusResponse {
  success: boolean;
  quote?: any;
  message?: string;
  error?: string;
}

export function useUpdateQuoteStatus() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateQuoteStatus = async (
    quoteId: string,
    newStatus: QuoteStatus
  ): Promise<UpdateQuoteStatusResponse> => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to update quote status';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        quote: data.quote,
        message: data.message,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateQuoteStatus,
    isUpdating,
    error,
  };
}