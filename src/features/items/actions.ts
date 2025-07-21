'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { LineItem } from './types';

export async function getLineItems(): Promise<ActionResponse<LineItem[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('line_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting line items:', error);
    return { data: null, error: { message: 'Failed to get line items' } };
  }
}

export async function createLineItem(formData: FormData): Promise<ActionResponse<LineItem>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const name = formData.get('name') as string;
    const unit = formData.get('unit') as string;
    const cost = parseFloat(formData.get('cost') as string);

    // Validation
    if (!name?.trim()) {
      return { data: null, error: { message: 'Item name is required' } };
    }
    
    if (!unit?.trim()) {
      return { data: null, error: { message: 'Unit is required' } };
    }
    
    if (isNaN(cost) || cost < 0) {
      return { data: null, error: { message: 'Cost must be a valid positive number' } };
    }

    const itemData = {
      user_id: user.id,
      name: name.trim(),
      unit: unit.trim(),
      cost,
    };

    const { data, error } = await supabase
      .from('line_items')
      .insert(itemData)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating line item:', error);
    return { data: null, error: { message: 'Failed to create line item' } };
  }
}

export async function updateLineItem(formData: FormData): Promise<ActionResponse<LineItem>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const unit = formData.get('unit') as string;
    const cost = parseFloat(formData.get('cost') as string);

    // Validation
    if (!id) {
      return { data: null, error: { message: 'Item ID is required' } };
    }
    
    if (!name?.trim()) {
      return { data: null, error: { message: 'Item name is required' } };
    }
    
    if (!unit?.trim()) {
      return { data: null, error: { message: 'Unit is required' } };
    }
    
    if (isNaN(cost) || cost < 0) {
      return { data: null, error: { message: 'Cost must be a valid positive number' } };
    }

    const updateData = {
      name: name.trim(),
      unit: unit.trim(),
      cost,
    };

    const { data, error } = await supabase
      .from('line_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the item
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating line item:', error);
    return { data: null, error: { message: 'Failed to update line item' } };
  }
}

export async function deleteLineItem(itemId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!itemId) {
      return { data: null, error: { message: 'Item ID is required' } };
    }

    const { error } = await supabase
      .from('line_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id); // Ensure user owns the item

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error deleting line item:', error);
    return { data: null, error: { message: 'Failed to delete line item' } };
  }
}