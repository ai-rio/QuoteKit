'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { GlobalCategory, GlobalItem, ItemAccessTier, UserGlobalItemUsage } from './types';

// Global Categories Actions

export async function getGlobalCategories(): Promise<ActionResponse<GlobalCategory[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Debug: Check user tier for debugging
    const { data: userTierData, error: tierError } = await supabase
      .rpc('get_user_tier', { user_id: user.id });
    
    console.log('Global Categories Debug - User ID:', user.id, 'User Tier:', userTierData, 'Tier Error:', tierError);

    const { data, error } = await supabase
      .from('global_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    console.log('Global Categories Query Result - Count:', data?.length || 0, 'Error:', error);

    if (error) {
      console.error('Database error getting global categories:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting global categories:', error);
    return { data: null, error: { message: 'Failed to get global categories' } };
  }
}

// Global Items Actions

export async function getGlobalItems(filters?: {
  category_id?: string;
  search?: string;
}): Promise<ActionResponse<GlobalItem[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Debug: Check user tier for debugging
    const { data: userTierData, error: tierError } = await supabase
      .rpc('get_user_tier', { user_id: user.id });
    
    console.log('Global Items Debug - User ID:', user.id, 'User Tier:', userTierData, 'Tier Error:', tierError);

    let query = supabase
      .from('global_items')
      .select(`
        *,
        category:global_categories(*)
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.search) {
      query = query.textSearch('name', filters.search);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    console.log('Global Items Query Result - Count:', data?.length || 0, 'Error:', error, 'Filters:', filters);

    if (error) {
      console.error('Database error getting global items:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting global items:', error);
    return { data: null, error: { message: 'Failed to get global items' } };
  }
}

export async function getUserTier(): Promise<ActionResponse<ItemAccessTier>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Call the database function to get user tier
    const { data, error } = await supabase.rpc('get_user_tier', {
      user_id: user.id
    });

    if (error) {
      console.error('Error getting user tier:', error);
      return { data: 'free', error: null }; // Default to free on error
    }

    return { data: data as ItemAccessTier || 'free', error: null };
  } catch (error) {
    console.error('Error getting user tier:', error);
    return { data: 'free', error: null }; // Default to free on error
  }
}

export async function copyGlobalItemToPersonal(
  globalItemId: string,
  customCost?: number
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!globalItemId) {
      return { data: null, error: { message: 'Global item ID is required' } };
    }

    // Call the database function to copy the item
    const { data, error } = await supabase.rpc('copy_global_item_to_personal', {
      global_item_id: globalItemId,
      custom_cost: customCost || null
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data as string, error: null };
  } catch (error) {
    console.error('Error copying global item to personal:', error);
    return { data: null, error: { message: 'Failed to copy item to personal library' } };
  }
}

export async function toggleGlobalItemFavorite(
  globalItemId: string
): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!globalItemId) {
      return { data: null, error: { message: 'Global item ID is required' } };
    }

    // Call the database function to toggle favorite
    const { data, error } = await supabase.rpc('toggle_global_item_favorite', {
      global_item_id: globalItemId
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data as boolean, error: null };
  } catch (error) {
    console.error('Error toggling global item favorite:', error);
    return { data: null, error: { message: 'Failed to toggle favorite status' } };
  }
}

export async function getUserGlobalItemUsage(): Promise<ActionResponse<UserGlobalItemUsage[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('user_global_item_usage')
      .select(`
        *,
        global_item:global_items(
          *,
          category:global_categories(*)
        )
      `)
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false, nullsFirst: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting user global item usage:', error);
    return { data: null, error: { message: 'Failed to get user usage data' } };
  }
}

// Admin-only actions for managing global items

export async function createGlobalCategory(formData: FormData): Promise<ActionResponse<GlobalCategory>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      return { data: null, error: { message: 'Admin access required' } };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const access_tier = formData.get('access_tier') as ItemAccessTier;
    const sort_order = parseInt(formData.get('sort_order') as string) || 0;

    // Validation
    if (!name?.trim()) {
      return { data: null, error: { message: 'Category name is required' } };
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim() || null,
      color: color?.trim() || null,
      access_tier: access_tier || 'free',
      sort_order,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('global_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating global category:', error);
    return { data: null, error: { message: 'Failed to create global category' } };
  }
}

export async function createGlobalItem(formData: FormData): Promise<ActionResponse<GlobalItem>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      return { data: null, error: { message: 'Admin access required' } };
    }

    const name = formData.get('name') as string;
    const category_id = formData.get('category_id') as string;
    const subcategory = formData.get('subcategory') as string;
    const unit = formData.get('unit') as string;
    const cost = parseFloat(formData.get('cost') as string);
    const description = formData.get('description') as string;
    const notes = formData.get('notes') as string;
    const access_tier = formData.get('access_tier') as ItemAccessTier;
    const tags = formData.get('tags') as string;
    const sort_order = parseInt(formData.get('sort_order') as string) || 0;

    // Validation
    if (!name?.trim()) {
      return { data: null, error: { message: 'Item name is required' } };
    }
    
    if (!category_id) {
      return { data: null, error: { message: 'Category is required' } };
    }

    const itemData = {
      name: name.trim(),
      category_id,
      subcategory: subcategory?.trim() || null,
      unit: unit?.trim() || null,
      cost: isNaN(cost) ? null : cost,
      description: description?.trim() || null,
      notes: notes?.trim() || null,
      access_tier: access_tier || 'free',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      sort_order,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('global_items')
      .insert(itemData)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating global item:', error);
    return { data: null, error: { message: 'Failed to create global item' } };
  }
}