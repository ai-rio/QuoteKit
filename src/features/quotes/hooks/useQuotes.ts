'use client';

import { useCallback, useEffect,useState } from 'react';

import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client';

import { convertDatabaseQuoteToQuote,Quote } from '../types';

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseClientClient();

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setQuotes((data || []).map(convertDatabaseQuoteToQuote));
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return {
    quotes,
    loading,
    error,
    refetch: fetchQuotes
  };
}