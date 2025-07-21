'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { CreateQuoteData, Quote } from './types';
import { calculateQuote } from './utils';

export async function getQuotes(): Promise<ActionResponse<Quote[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting quotes:', error);
    return { data: null, error: { message: 'Failed to get quotes' } };
  }
}

export async function createQuote(quoteData: CreateQuoteData): Promise<ActionResponse<Quote>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Validation
    if (!quoteData.client_name?.trim()) {
      return { data: null, error: { message: 'Client name is required' } };
    }

    if (!quoteData.quote_data || quoteData.quote_data.length === 0) {
      return { data: null, error: { message: 'At least one line item is required' } };
    }

    if (quoteData.tax_rate < 0 || quoteData.tax_rate > 100) {
      return { data: null, error: { message: 'Tax rate must be between 0 and 100' } };
    }

    if (quoteData.markup_rate < 0 || quoteData.markup_rate > 1000) {
      return { data: null, error: { message: 'Markup rate must be between 0 and 1000' } };
    }

    // Calculate totals
    const calculation = calculateQuote(quoteData.quote_data, quoteData.tax_rate, quoteData.markup_rate);

    const newQuote = {
      user_id: user.id,
      client_name: quoteData.client_name.trim(),
      client_contact: quoteData.client_contact?.trim() || null,
      quote_data: quoteData.quote_data,
      subtotal: calculation.subtotal,
      tax_rate: quoteData.tax_rate,
      markup_rate: quoteData.markup_rate,
      total: calculation.total,
    };

    const { data, error } = await supabase
      .from('quotes')
      .insert(newQuote)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating quote:', error);
    return { data: null, error: { message: 'Failed to create quote' } };
  }
}

export async function deleteQuote(quoteId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!quoteId) {
      return { data: null, error: { message: 'Quote ID is required' } };
    }

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('user_id', user.id); // Ensure user owns the quote

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error deleting quote:', error);
    return { data: null, error: { message: 'Failed to delete quote' } };
  }
}

