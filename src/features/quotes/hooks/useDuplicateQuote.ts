import { useState } from 'react';

import { duplicateQuote } from '../actions';
import { Quote } from '../types';

interface DuplicateQuoteResponse {
  success: boolean;
  quote?: Quote;
  error?: string;
}

export function useDuplicateQuote() {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = async (quoteId: string): Promise<DuplicateQuoteResponse> => {
    setIsDuplicating(true);
    setError(null);

    try {
      const result = await duplicateQuote(quoteId);

      if (result?.error) {
        const errorMessage = result.error.message || 'Failed to duplicate quote';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (result?.data) {
        return {
          success: true,
          quote: result.data!,
        };
      }

      // This shouldn't happen, but handle it gracefully
      const errorMessage = 'Unexpected error occurred while duplicating quote';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsDuplicating(false);
    }
  };

  return {
    duplicate,
    isDuplicating,
    error,
  };
}