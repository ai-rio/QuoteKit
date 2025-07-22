'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { CreateQuoteData, Quote, SaveDraftData } from './types';
import { calculateQuote } from './utils';

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
      quote_data: quoteData.quote_data as any,
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

    return { data: data as unknown as Quote, error: null };
  } catch (error) {
    console.error('Error creating quote:', error);
    return { data: null, error: { message: 'Failed to create quote' } };
  }
}

export async function saveDraft(draftData: SaveDraftData): Promise<ActionResponse<Quote>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // If updating existing draft
    if (draftData.id) {
      const updateData: any = {};
      
      if (draftData.client_name !== undefined) updateData.client_name = draftData.client_name.trim();
      if (draftData.client_contact !== undefined) updateData.client_contact = draftData.client_contact?.trim() || null;
      if (draftData.quote_data !== undefined) updateData.quote_data = draftData.quote_data as any;
      if (draftData.tax_rate !== undefined) updateData.tax_rate = draftData.tax_rate;
      if (draftData.markup_rate !== undefined) updateData.markup_rate = draftData.markup_rate;

      // Recalculate totals if needed
      if (draftData.quote_data !== undefined || draftData.tax_rate !== undefined || draftData.markup_rate !== undefined) {
        const calculation = calculateQuote(
          draftData.quote_data || [],
          draftData.tax_rate || 0,
          draftData.markup_rate || 0
        );
        updateData.subtotal = calculation.subtotal;
        updateData.total = calculation.total;
      }

      const { data, error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', draftData.id)
        .eq('user_id', user.id)
        .eq('status', 'draft') // Only update drafts
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: data as unknown as Quote, error: null };
    }

    // Create new draft
    if (!draftData.client_name?.trim()) {
      return { data: null, error: { message: 'Client name is required' } };
    }

    const calculation = calculateQuote(
      draftData.quote_data || [],
      draftData.tax_rate || 0,
      draftData.markup_rate || 0
    );

    const newDraft = {
      user_id: user.id,
      client_name: draftData.client_name.trim(),
      client_contact: draftData.client_contact?.trim() || null,
      quote_data: (draftData.quote_data || []) as any,
      subtotal: calculation.subtotal,
      tax_rate: draftData.tax_rate || 0,
      markup_rate: draftData.markup_rate || 0,
      total: calculation.total,
      status: 'draft' as const,
    };

    const { data, error } = await supabase
      .from('quotes')
      .insert(newDraft)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as Quote, error: null };
  } catch (error) {
    console.error('Error saving draft:', error);
    return { data: null, error: { message: 'Failed to save draft' } };
  }
}