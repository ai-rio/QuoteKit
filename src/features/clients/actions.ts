'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { 
  BulkPropertyOperation,
  Client, 
  ClientOption,
  ClientSearchFilters, 
  ClientWithAnalytics,
  Property,
  PropertyAccess,
  PropertyOption,
  PropertySearchFilters,
  PropertyType,
  PropertyWithAnalytics,
  PropertyWithClient} from './types';

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

    // Transform data to handle null values
    const transformedData = (data || []).map(item => ({
      ...item,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      email: item.email || undefined,
      phone: item.phone || undefined,
      address: item.address || undefined,
      notes: item.notes || undefined,
    }));

    return { data: transformedData, error: null };
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
      id: item.client_id || '',
      user_id: item.user_id || '',
      name: item.client_name || '',
      email: item.email || undefined,
      phone: item.phone || undefined,
      address: null, // Not included in analytics view, would need separate query
      notes: null, // Not included in analytics view, would need separate query
      client_type: item.client_type || 'residential',
      created_at: item.client_since || new Date().toISOString(),
      updated_at: item.client_since || new Date().toISOString(), // Using created_at as fallback
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

    // Transform data to handle null values
    const transformedData = data ? {
      ...data,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
    } : null;

    return { data: transformedData, error: null };
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

    // Base fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const notes = formData.get('notes') as string;
    const clientType = formData.get('client_type') as string;
    const clientStatus = formData.get('client_status') as string;
    const preferredCommunication = formData.get('preferred_communication') as string;

    // Commercial fields
    const companyName = formData.get('company_name') as string;
    const billingAddress = formData.get('billing_address') as string;
    const primaryContactPerson = formData.get('primary_contact_person') as string;
    const taxId = formData.get('tax_id') as string;
    const businessLicense = formData.get('business_license') as string;
    const serviceArea = formData.get('service_area') as string;
    const creditTerms = formData.get('credit_terms') as string;
    const creditLimit = formData.get('credit_limit') as string;

    // Validation
    if (!name?.trim()) {
      return { data: null, error: { message: 'Client name is required' } };
    }

    // Commercial client validation
    if (clientType === 'commercial') {
      if (!companyName?.trim()) {
        return { data: null, error: { message: 'Company name is required for commercial clients' } };
      }
      if (!primaryContactPerson?.trim()) {
        return { data: null, error: { message: 'Primary contact person is required for commercial clients' } };
      }
    }

    // Email validation if provided
    if (email && email.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        return { data: null, error: { message: 'Please enter a valid email address' } };
      }
    }

    // Build client data object
    const clientData: any = {
      user_id: user.id,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      client_type: clientType || 'residential',
      client_status: clientStatus || 'lead',
      preferred_communication: preferredCommunication || null,
    };

    // Add commercial fields if client type is commercial
    if (clientType === 'commercial') {
      clientData.company_name = companyName?.trim() || null;
      clientData.billing_address = billingAddress?.trim() || null;
      clientData.primary_contact_person = primaryContactPerson?.trim() || null;
      clientData.tax_id = taxId?.trim() || null;
      clientData.business_license = businessLicense?.trim() || null;
      clientData.service_area = serviceArea?.trim() || null;
      clientData.credit_terms = creditTerms ? parseInt(creditTerms) : 30;
      clientData.credit_limit = creditLimit ? parseFloat(creditLimit) : 0;
    }

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
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while creating the client' } 
    };
  }
}

export async function updateClient(clientId: string, formData: FormData): Promise<ActionResponse<Client>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Base fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const notes = formData.get('notes') as string;
    const clientType = formData.get('client_type') as string;
    const clientStatus = formData.get('client_status') as string;
    const preferredCommunication = formData.get('preferred_communication') as string;

    // Commercial fields
    const companyName = formData.get('company_name') as string;
    const billingAddress = formData.get('billing_address') as string;
    const primaryContactPerson = formData.get('primary_contact_person') as string;
    const taxId = formData.get('tax_id') as string;
    const businessLicense = formData.get('business_license') as string;
    const serviceArea = formData.get('service_area') as string;
    const creditTerms = formData.get('credit_terms') as string;
    const creditLimit = formData.get('credit_limit') as string;

    // Validation
    if (!name?.trim()) {
      return { data: null, error: { message: 'Client name is required' } };
    }

    // Commercial client validation
    if (clientType === 'commercial') {
      if (!companyName?.trim()) {
        return { data: null, error: { message: 'Company name is required for commercial clients' } };
      }
      if (!primaryContactPerson?.trim()) {
        return { data: null, error: { message: 'Primary contact person is required for commercial clients' } };
      }
    }

    // Email validation if provided
    if (email && email.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        return { data: null, error: { message: 'Please enter a valid email address' } };
      }
    }

    // Build update data object
    const updateData: any = {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      client_type: clientType || 'residential',
      client_status: clientStatus || 'lead',
      preferred_communication: preferredCommunication || null,
      updated_at: new Date().toISOString(),
    };

    // Add commercial fields if client type is commercial
    if (clientType === 'commercial') {
      updateData.company_name = companyName?.trim() || null;
      updateData.billing_address = billingAddress?.trim() || null;
      updateData.primary_contact_person = primaryContactPerson?.trim() || null;
      updateData.tax_id = taxId?.trim() || null;
      updateData.business_license = businessLicense?.trim() || null;
      updateData.service_area = serviceArea?.trim() || null;
      updateData.credit_terms = creditTerms ? parseInt(creditTerms) : 30;
      updateData.credit_limit = creditLimit ? parseFloat(creditLimit) : 0;
    } else {
      // Clear commercial fields for residential clients
      updateData.company_name = null;
      updateData.billing_address = null;
      updateData.primary_contact_person = null;
      updateData.tax_id = null;
      updateData.business_license = null;
      updateData.service_area = null;
      updateData.credit_terms = null;
      updateData.credit_limit = null;
    }

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

    if (!data) {
      return { data: null, error: { message: 'Client not found or access denied' } };
    }

    revalidatePath('/clients');
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating client:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while updating the client' } 
    };
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

// =====================================================
// PROPERTY ACTIONS - Blueprint Implementation
// =====================================================

export async function getProperties(
  filters?: Partial<PropertySearchFilters>
): Promise<ActionResponse<PropertyWithClient[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    let query = supabase
      .from('properties')
      .select(`
        *,
        clients!inner(
          id,
          name,
          company_name,
          client_status,
          email,
          phone
        )
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (filters?.search) {
      query = query.or(
        `service_address.ilike.%${filters.search}%,` +
        `property_name.ilike.%${filters.search}%,` +
        `clients.name.ilike.%${filters.search}%`
      );
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.property_type) {
      query = query.eq('property_type', filters.property_type);
    }

    if (filters?.property_access) {
      query = query.eq('property_access', filters.property_access);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.service_frequency) {
      query = query.eq('service_frequency', filters.service_frequency);
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    const ascending = sortOrder === 'asc';

    if (sortBy === 'client_name') {
      query = query.order('name', { ascending, foreignTable: 'clients' });
    } else {
      query = query.order(sortBy, { ascending });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching properties:', error);
      return { data: null, error };
    }

    // Transform data to match PropertyWithClient interface
    const transformedData = (data || []).map(item => ({
      ...item,
      client_name: item.clients.name,
      client_email: item.clients.email || undefined,
      client_phone: item.clients.phone || undefined,
      company_name: item.clients.company_name || undefined,
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Unexpected error fetching properties:', error);
    return { data: null, error: { message: 'Failed to fetch properties' } };
  }
}

export async function getPropertiesWithAnalytics(
  filters?: Partial<PropertySearchFilters>
): Promise<ActionResponse<PropertyWithAnalytics[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    let query = supabase
      .from('property_analytics')
      .select('*')
      .eq('user_id', user.id);

    // Apply search filter
    if (filters?.search) {
      query = query.or(
        `service_address.ilike.%${filters.search}%,` +
        `property_name.ilike.%${filters.search}%,` +
        `client_name.ilike.%${filters.search}%`
      );
    }

    // Apply other filters
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.property_type) {
      query = query.eq('property_type', filters.property_type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.service_frequency) {
      query = query.eq('service_frequency', filters.service_frequency);
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    const ascending = sortOrder === 'asc';

    query = query.order(sortBy, { ascending });

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching properties with analytics:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching properties with analytics:', error);
    return { data: null, error: { message: 'Failed to fetch properties with analytics' } };
  }
}

export async function getPropertyById(propertyId: string): Promise<ActionResponse<PropertyWithClient>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        clients!inner(
          id,
          name,
          company_name,
          client_status,
          email,
          phone
        )
      `)
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error fetching property:', error);
      return { data: null, error };
    }

    // Transform data to match PropertyWithClient interface
    const transformedData = data ? {
      ...data,
      client_name: data.clients?.name || '',
      client_email: data.clients?.email || undefined,
      client_phone: data.clients?.phone || undefined,
      company_name: data.clients?.company_name || undefined,
    } : null;

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Unexpected error fetching property:', error);
    return { data: null, error: { message: 'Failed to fetch property' } };
  }
}

export async function createProperty(formData: FormData): Promise<ActionResponse<Property>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Extract form data
    const client_id = formData.get('client_id') as string;
    const property_name = formData.get('property_name') as string;
    const service_address = formData.get('service_address') as string;
    const billing_address = formData.get('billing_address') as string;
    const property_type = formData.get('property_type') as PropertyType;
    const property_access = formData.get('property_access') as PropertyAccess;
    
    // Validation
    if (!client_id?.trim()) {
      return { data: null, error: { message: 'Client selection is required' } };
    }

    if (!service_address?.trim()) {
      return { data: null, error: { message: 'Service address is required' } };
    }

    if (!property_type) {
      return { data: null, error: { message: 'Property type is required' } };
    }

    // Verify client ownership
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !clientData) {
      return { data: null, error: { message: 'Invalid client selection' } };
    }

    // Prepare property data
    const propertyData = {
      user_id: user.id,
      client_id: client_id.trim(),
      property_name: property_name?.trim() || null,
      service_address: service_address.trim(),
      billing_address: billing_address?.trim() || null,
      property_type: property_type,
      property_access: property_access || 'easy',
      square_footage: parseFloat(formData.get('square_footage') as string) || null,
      lot_size: parseFloat(formData.get('lot_size') as string) || null,
      access_instructions: formData.get('access_instructions') as string || null,
      gate_code: formData.get('gate_code') as string || null,
      parking_location: formData.get('parking_location') as string || null,
      lawn_area: parseFloat(formData.get('lawn_area') as string) || null,
      landscape_area: parseFloat(formData.get('landscape_area') as string) || null,
      hardscape_area: parseFloat(formData.get('hardscape_area') as string) || null,
      safety_considerations: formData.get('safety_considerations') as string || null,
      pet_information: formData.get('pet_information') as string || null,
      latitude: parseFloat(formData.get('latitude') as string) || null,
      longitude: parseFloat(formData.get('longitude') as string) || null,
      service_frequency: formData.get('service_frequency') as string || null,
      preferred_service_time: formData.get('preferred_service_time') as string || null,
      season_start_date: formData.get('season_start_date') as string || null,
      season_end_date: formData.get('season_end_date') as string || null,
      property_notes: formData.get('property_notes') as string || null,
      client_requirements: formData.get('client_requirements') as string || null,
      billing_notes: formData.get('billing_notes') as string || null,
    };

    

    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating property:', error);
      return { data: null, error };
    }

    revalidatePath('/clients');
    revalidatePath('/properties');
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating property:', error);
    return { data: null, error: { message: 'Failed to create property' } };
  }
}

export async function updateProperty(propertyId: string, formData: FormData): Promise<ActionResponse<Property>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Extract form data (similar to create but for updates)
    const property_name = formData.get('property_name') as string;
    const service_address = formData.get('service_address') as string;
    const billing_address = formData.get('billing_address') as string;
    const property_type = formData.get('property_type') as PropertyType;
    const property_access = formData.get('property_access') as PropertyAccess;

    // Validation
    if (!service_address?.trim()) {
      return { data: null, error: { message: 'Service address is required' } };
    }

    if (!property_type) {
      return { data: null, error: { message: 'Property type is required' } };
    }

    // Prepare update data
    const updateData = {
      property_name: property_name?.trim() || null,
      service_address: service_address.trim(),
      billing_address: billing_address?.trim() || null,
      property_type: property_type,
      property_access: property_access || 'easy',
      square_footage: parseFloat(formData.get('square_footage') as string) || null,
      lot_size: parseFloat(formData.get('lot_size') as string) || null,
      access_instructions: formData.get('access_instructions') as string || null,
      gate_code: formData.get('gate_code') as string || null,
      parking_location: formData.get('parking_location') as string || null,
      lawn_area: parseFloat(formData.get('lawn_area') as string) || null,
      landscape_area: parseFloat(formData.get('landscape_area') as string) || null,
      hardscape_area: parseFloat(formData.get('hardscape_area') as string) || null,
      safety_considerations: formData.get('safety_considerations') as string || null,
      pet_information: formData.get('pet_information') as string || null,
      latitude: parseFloat(formData.get('latitude') as string) || null,
      longitude: parseFloat(formData.get('longitude') as string) || null,
      service_frequency: formData.get('service_frequency') as string || null,
      preferred_service_time: formData.get('preferred_service_time') as string || null,
      season_start_date: formData.get('season_start_date') as string || null,
      season_end_date: formData.get('season_end_date') as string || null,
      property_notes: formData.get('property_notes') as string || null,
      client_requirements: formData.get('client_requirements') as string || null,
      billing_notes: formData.get('billing_notes') as string || null,
      updated_at: new Date().toISOString(),
    };

    

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating property:', error);
      return { data: null, error };
    }

    revalidatePath('/clients');
    revalidatePath('/properties');
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating property:', error);
    return { data: null, error: { message: 'Failed to update property' } };
  }
}

export async function deleteProperty(propertyId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Check if property has quotes before deletion
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('property_id', propertyId)
      .limit(1);

    if (quotesError) {
      console.error('Error checking property quotes:', quotesError);
      return { data: null, error: { message: 'Failed to check property quotes' } };
    }

    if (quotes && quotes.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete property with existing quotes. Please delete quotes first or reassign them to another property.' } 
      };
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error deleting property:', error);
      return { data: null, error };
    }

    revalidatePath('/clients');
    revalidatePath('/properties');
    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error deleting property:', error);
    return { data: null, error: { message: 'Failed to delete property' } };
  }
}

export async function getPropertyOptions(clientId?: string): Promise<ActionResponse<PropertyOption[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    let query = supabase
      .from('properties')
      .select(`
        id,
        property_name,
        service_address,
        property_type,
        is_active,
        clients!inner(name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    query = query.order('service_address', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching property options:', error);
      return { data: null, error };
    }

    const transformedData = (data || []).map(item => ({
      id: item.id,
      property_name: item.property_name,
      service_address: item.service_address,
      client_name: (item.clients as any)[0].name,
      property_type: item.property_type,
      is_active: item.is_active,
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Unexpected error fetching property options:', error);
    return { data: null, error: { message: 'Failed to fetch property options' } };
  }
}

export async function togglePropertyStatus(propertyId: string, isActive: boolean): Promise<ActionResponse<Property>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('properties')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error toggling property status:', error);
      return { data: null, error };
    }

    revalidatePath('/clients');
    revalidatePath('/properties');
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error toggling property status:', error);
    return { data: null, error: { message: 'Failed to toggle property status' } };
  }
}

export async function getPropertiesByClient(clientId: string): Promise<ActionResponse<Property[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Verify client ownership
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !clientData) {
      return { data: null, error: { message: 'Invalid client selection or access denied' } };
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching properties by client:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching properties by client:', error);
    return { data: null, error: { message: 'Failed to fetch properties' } };
  }
}

export async function bulkPropertyOperation(operation: BulkPropertyOperation): Promise<ActionResponse<{ affected: number }>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    let result;
    let affected = 0;

    switch (operation.operation) {
      case 'activate':
        result = await supabase
          .from('properties')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .in('id', operation.propertyIds)
          .eq('user_id', user.id)
          .select();
        
        affected = result.data?.length || 0;
        break;

      case 'deactivate':
        result = await supabase
          .from('properties')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .in('id', operation.propertyIds)
          .eq('user_id', user.id)
          .select();
        
        affected = result.data?.length || 0;
        break;

      case 'delete':
        // Check for quotes before deleting
        const { data: quotesCheck, error: quotesError } = await supabase
          .from('quotes')
          .select('property_id')
          .in('property_id', operation.propertyIds)
          .limit(1);

        if (quotesError) {
          return { data: null, error: { message: 'Failed to check property quotes' } };
        }

        if (quotesCheck && quotesCheck.length > 0) {
          return { 
            data: null, 
            error: { message: 'Cannot delete properties with existing quotes. Please delete quotes first.' } 
          };
        }

        result = await supabase
          .from('properties')
          .delete()
          .in('id', operation.propertyIds)
          .eq('user_id', user.id)
          .select();
        
        affected = result.data?.length || 0;
        break;

      default:
        return { data: null, error: { message: 'Invalid operation' } };
    }

    if (result?.error) {
      console.error(`Database error in bulk ${operation.operation}:`, result.error);
      return { data: null, error: result.error };
    }

    revalidatePath('/clients');
    revalidatePath('/properties');
    return { data: { affected }, error: null };
  } catch (error) {
    console.error(`Unexpected error in bulk ${operation.operation}:`, error);
    return { data: null, error: { message: `Failed to ${operation.operation} properties` } };
  }
}