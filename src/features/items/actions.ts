'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { ItemCategory, LineItem } from './types';

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
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
    
    const supabase = await createSupabaseServerClient();
    
    console.log('Creating line item - checking authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return { data: null, error: { message: 'User not authenticated' } };
    }

    console.log('User authenticated:', user.id);

    const name = formData.get('name') as string;
    const unit = formData.get('unit') as string;
    const cost = parseFloat(formData.get('cost') as string);
    const category = formData.get('category') as string;

    console.log('Form data received:', { name, unit, cost, category });

    // Validation
    if (!name?.trim()) {
      console.error('Validation failed: Item name is required');
      return { data: null, error: { message: 'Item name is required' } };
    }
    
    if (!unit?.trim()) {
      console.error('Validation failed: Unit is required');
      return { data: null, error: { message: 'Unit is required' } };
    }
    
    if (isNaN(cost) || cost < 0) {
      console.error('Validation failed: Invalid cost:', cost);
      return { data: null, error: { message: 'Cost must be a valid positive number' } };
    }

    const itemData = {
      user_id: user.id,
      name: name.trim(),
      unit: unit.trim(),
      cost,
      category: category?.trim() || null,
    };

    console.log('Inserting item data:', itemData);

    const { data, error } = await supabase
      .from('line_items')
      .insert(itemData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating line item:', error);
      return { data: null, error };
    }

    console.log('Line item created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating line item:', error);
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
    const category = formData.get('category') as string;

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
      category: category?.trim() || null,
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

export async function toggleItemFavorite(itemId: string, isFavorite: boolean): Promise<ActionResponse<LineItem>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!itemId) {
      return { data: null, error: { message: 'Item ID is required' } };
    }

    // Update the is_favorite field in the database
    const { data, error } = await supabase
      .from('line_items')
      .update({ is_favorite: isFavorite })
      .eq('id', itemId)
      .eq('user_id', user.id) // Ensure user owns the item
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error toggling item favorite:', error);
    return { data: null, error: { message: 'Failed to toggle item favorite' } };
  }
}

export async function updateItemLastUsed(itemId: string): Promise<ActionResponse<LineItem>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!itemId) {
      return { data: null, error: { message: 'Item ID is required' } };
    }

    // Update the last_used_at field to current timestamp
    const { data, error } = await supabase
      .from('line_items')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('user_id', user.id) // Ensure user owns the item
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating item last used:', error);
    return { data: null, error: { message: 'Failed to update item last used' } };
  }
}

// Category Management Actions

export async function getCategories(): Promise<ActionResponse<ItemCategory[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('item_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting categories:', error);
    return { data: null, error: { message: 'Failed to get categories' } };
  }
}

export async function createCategory(formData: FormData): Promise<ActionResponse<ItemCategory>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const name = formData.get('name') as string;
    const color = formData.get('color') as string;

    // Validation
    if (!name?.trim()) {
      return { data: null, error: { message: 'Category name is required' } };
    }
    
    if (!color?.trim()) {
      return { data: null, error: { message: 'Category color is required' } };
    }

    const categoryData = {
      user_id: user.id,
      name: name.trim(),
      color: color.trim(),
    };

    const { data, error } = await supabase
      .from('item_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating category:', error);
    return { data: null, error: { message: 'Failed to create category' } };
  }
}

export async function deleteCategory(categoryId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!categoryId) {
      return { data: null, error: { message: 'Category ID is required' } };
    }

    // First, update any items that use this category to remove the category
    await supabase
      .from('line_items')
      .update({ category: null })
      .eq('user_id', user.id)
      .eq('category', categoryId);

    // Then delete the category
    const { error } = await supabase
      .from('item_categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', user.id); // Ensure user owns the category

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { data: null, error: { message: 'Failed to delete category' } };
  }
}