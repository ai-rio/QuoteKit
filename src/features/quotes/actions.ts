'use server';

import { updateItemLastUsed } from '@/features/items/actions';
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

    // Update last_used_at for all items in the quote
    try {
      await Promise.all(
        quoteData.quote_data.map(async (item) => {
          if (item.id) {
            await updateItemLastUsed(item.id);
          }
        })
      );
    } catch (updateError) {
      // Don't fail the quote creation if updating last_used_at fails
      console.warn('Failed to update item last_used_at:', updateError);
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

export async function duplicateQuote(quoteId: string): Promise<ActionResponse<Quote>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Fetch the original quote
    const { data: originalQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !originalQuote) {
      return { data: null, error: { message: 'Quote not found or access denied' } };
    }

    // Create duplicated quote data
    const duplicatedQuote = {
      user_id: user.id,
      client_name: `${originalQuote.client_name} (Copy)`,
      client_contact: originalQuote.client_contact,
      quote_data: originalQuote.quote_data,
      subtotal: originalQuote.subtotal,
      tax_rate: originalQuote.tax_rate,
      markup_rate: originalQuote.markup_rate,
      total: originalQuote.total,
      status: 'draft' as const, // Always create duplicates as drafts
      notes: originalQuote.notes,
      expires_at: null, // Reset expiration
      follow_up_date: null, // Reset follow-up
    };

    const { data, error } = await supabase
      .from('quotes')
      .insert(duplicatedQuote)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Update last_used_at for all items in the quote
    try {
      if (originalQuote.quote_data && Array.isArray(originalQuote.quote_data)) {
        await Promise.all(
          originalQuote.quote_data.map(async (item: any) => {
            if (item.id) {
              await updateItemLastUsed(item.id);
            }
          })
        );
      }
    } catch (updateError) {
      // Don't fail the duplication if updating last_used_at fails
      console.warn('Failed to update item last_used_at:', updateError);
    }

    return { data: data as unknown as Quote, error: null };
  } catch (error) {
    console.error('Error duplicating quote:', error);
    return { data: null, error: { message: 'Failed to duplicate quote' } };
  }
}

export async function updateQuoteStatus(
  quoteIds: string[], 
  status: string
): Promise<ActionResponse<{ updated: number }>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Validate status
    const validStatuses = ['draft', 'sent', 'accepted', 'declined', 'expired', 'converted'];
    if (!validStatuses.includes(status)) {
      return { data: null, error: { message: 'Invalid status value' } };
    }

    // Update the quotes
    const { data, error } = await supabase
      .from('quotes')
      .update({ status })
      .in('id', quoteIds)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      return { data: null, error };
    }

    return { 
      data: { updated: data?.length || 0 }, 
      error: null 
    };
  } catch (error) {
    console.error('Error updating quote status:', error);
    return { data: null, error: { message: 'Failed to update quote status' } };
  }
}

export async function deleteQuotes(quoteIds: string[]): Promise<ActionResponse<{ deleted: number }>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Delete the quotes
    const { data, error } = await supabase
      .from('quotes')
      .delete()
      .in('id', quoteIds)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      return { data: null, error };
    }

    return { 
      data: { deleted: data?.length || 0 }, 
      error: null 
    };
  } catch (error) {
    console.error('Error deleting quotes:', error);
    return { data: null, error: { message: 'Failed to delete quotes' } };
  }
}

// Template Management Actions

export async function createTemplate(
  templateName: string, 
  baseQuoteId: string
): Promise<ActionResponse<Quote>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Validation
    if (!templateName?.trim()) {
      return { data: null, error: { message: 'Template name is required' } };
    }

    // Fetch the base quote
    const { data: baseQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', baseQuoteId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !baseQuote) {
      return { data: null, error: { message: 'Base quote not found or access denied' } };
    }

    // Create template from base quote
    const templateData = {
      user_id: user.id,
      client_name: baseQuote.client_name,
      client_contact: baseQuote.client_contact,
      quote_data: baseQuote.quote_data,
      subtotal: baseQuote.subtotal,
      tax_rate: baseQuote.tax_rate,
      markup_rate: baseQuote.markup_rate,
      total: baseQuote.total,
      notes: baseQuote.notes,
      is_template: true,
      template_name: templateName.trim(),
    };

    const { data, error } = await supabase
      .from('quotes')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as Quote, error: null };
  } catch (error) {
    console.error('Error creating template:', error);
    return { data: null, error: { message: 'Failed to create template' } };
  }
}

export async function updateTemplate(
  templateId: string, 
  templateName: string
): Promise<ActionResponse<Quote>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Validation
    if (!templateName?.trim()) {
      return { data: null, error: { message: 'Template name is required' } };
    }

    // Update the template
    const { data, error } = await supabase
      .from('quotes')
      .update({ template_name: templateName.trim() })
      .eq('id', templateId)
      .eq('user_id', user.id)
      .eq('is_template', true)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Template not found or access denied' } };
    }

    return { data: data as unknown as Quote, error: null };
  } catch (error) {
    console.error('Error updating template:', error);
    return { data: null, error: { message: 'Failed to update template' } };
  }
}

export async function deleteTemplate(templateId: string): Promise<ActionResponse<{ deleted: boolean }>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Delete the template
    const { data, error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', templateId)
      .eq('user_id', user.id)
      .eq('is_template', true)
      .select('id');

    if (error) {
      return { data: null, error };
    }

    return { 
      data: { deleted: (data?.length || 0) > 0 }, 
      error: null 
    };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { data: null, error: { message: 'Failed to delete template' } };
  }
}

export async function getTemplateById(templateId: string): Promise<ActionResponse<Quote>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Fetch the template
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', user.id)
      .eq('is_template', true)
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Template not found or access denied' } };
    }

    return { data: data as unknown as Quote, error: null };
  } catch (error) {
    console.error('Error fetching template:', error);
    return { data: null, error: { message: 'Failed to fetch template' } };
  }
}