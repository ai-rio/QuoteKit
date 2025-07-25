'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { Client, ClientFormData, ClientOption,ClientSearchFilters, ClientWithAnalytics } from './types';

export async function getClients(): Promise<ActionResponse<Client[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error fetching clients:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching clients:', error);
    return { data: null, error: { message: 'Failed to fetch clients' } };
  }
}

export async function getClientsWithAnalytics(
  filters?: Partial<ClientSearchFilters>
): Promise<ActionResponse<ClientWithAnalytics[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    let query = supabase
      .from('client_analytics')
      .select('*')
      .eq('user_id', user.id);

    // Apply search filter
    if (filters?.search) {
      query = query.ilike('client_name', `%${filters.search}%`);
    }

    // Apply hasQuotes filter
    if (filters?.hasQuotes !== undefined) {
      if (filters.hasQuotes) {
        query = query.gt('total_quotes', 0);
      } else {
        query = query.eq('total_quotes', 0);
      }
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'name';
    const sortOrder = filters?.sortOrder || 'asc';
    const ascending = sortOrder === 'asc';

    // Map sortBy to the correct column names in the view
    const sortColumn = sortBy === 'name' ? 'client_name' : sortBy;
    query = query.order(sortColumn, { ascending });

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching clients with analytics:', error);
      return { data: null, error };
    }

    // Transform the data to match our ClientWithAnalytics interface
    const transformedData = (data || []).map(item => ({
      id: item.client_id,
      user_id: item.user_id,
      name: item.client_name,
      email: item.email,
      phone: item.phone,
      address: null, // Not included in analytics view, would need separate query
      notes: null, // Not included in analytics view, would need separate query
      created_at: item.client_since,
      updated_at: item.client_since, // Using created_at as fallback
      total_quotes: item.total_quotes || 0,
      accepted_quotes: item.accepted_quotes || 0,
      declined_quotes: item.declined_quotes || 0,
      total_quote_value: item.total_quote_value || 0,
      accepted_value: item.accepted_value || 0,
      average_quote_value: item.average_quote_value || 0,
      acceptance_rate_percent: item.acceptance_rate_percent || 0,
      last_quote_date: item.last_quote_date,
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Unexpected error fetching clients with analytics:', error);
    return { data: null, error: { message: 'Failed to fetch clients with analytics' } };
  }
}

export async function getClientById(clientId: string): Promise<ActionResponse<Client>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error fetching client:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching client:', error);
    return { data: null, error: { message: 'Failed to fetch client' } };
  }
}

export async function createClient(formData: FormData): Promise<ActionResponse<Client>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const notes = formData.get('notes') as string;

    // Validation
    if (!name?.trim()) {
      return { data: null, error: { message: 'Client name is required' } };
    }

    // Email validation if provided
    if (email && email.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        return { data: null, error: { message: 'Please enter a valid email address' } };
      }
    }

    const clientData = {
      user_id: user.id,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating client:', error);
      return { data: null, error };
    }

    revalidatePath('/clients');
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating client:', error);
    return { data: null, error: { message: 'Failed to create client' } };
  }
}

export async function updateClient(clientId: string, formData: FormData): Promise<ActionResponse<Client>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const notes = formData.get('notes') as string;

    // Validation
    if (!name?.trim()) {
      return { data: null, error: { message: 'Client name is required' } };
    }

    // Email validation if provided
    if (email && email.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        return { data: null, error: { message: 'Please enter a valid email address' } };
      }
    }

    const updateData = {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating client:', error);
      return { data: null, error };
    }

    revalidatePath('/clients');
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating client:', error);
    return { data: null, error: { message: 'Failed to update client' } };
  }
}

export async function deleteClient(clientId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Check if client has quotes before deletion
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);

    if (quotesError) {
      console.error('Error checking client quotes:', quotesError);
      return { data: null, error: { message: 'Failed to check client quotes' } };
    }

    if (quotes && quotes.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete client with existing quotes. Please delete quotes first or reassign them to another client.' } 
      };
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error deleting client:', error);
      return { data: null, error };
    }

    revalidatePath('/clients');
    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error deleting client:', error);
    return { data: null, error: { message: 'Failed to delete client' } };
  }
}

export async function getClientOptions(): Promise<ActionResponse<ClientOption[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error fetching client options:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching client options:', error);
    return { data: null, error: { message: 'Failed to fetch client options' } };
  }
}