'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { CompanySettings } from './types';

export async function getCompanySettings(): Promise<ActionResponse<CompanySettings | null>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { data: null, error };
    }

    // Ensure all required fields are present for type safety
    const settingsData = data ? {
      ...data,
      company_email: (data as any).company_email || null,
      logo_file_name: (data as any).logo_file_name || null,
      preferred_currency: (data as any).preferred_currency || 'USD',
      quote_terms: (data as any).quote_terms || null,
    } as CompanySettings : null;

    return { data: settingsData, error: null };
  } catch (error) {
    console.error('Error getting company settings:', error);
    return { data: null, error: { message: 'Failed to get company settings' } };
  }
}

export async function saveCompanySettings(formData: FormData): Promise<ActionResponse<CompanySettings>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const company_name = formData.get('company_name') as string;
    const company_address = formData.get('company_address') as string;
    const company_phone = formData.get('company_phone') as string;
    const company_email = formData.get('company_email') as string;
    const logo_url = formData.get('logo_url') as string;
    const logo_file_name = formData.get('logo_file_name') as string;
    const preferred_currency = formData.get('preferred_currency') as string;
    const quote_terms = formData.get('quote_terms') as string;
    const default_tax_rate = parseFloat(formData.get('default_tax_rate') as string) || 0;
    const default_markup_rate = parseFloat(formData.get('default_markup_rate') as string) || 0;

    // Validate numeric inputs
    if (formData.get('default_tax_rate') && (default_tax_rate < 0 || default_tax_rate > 100)) {
      return { data: null, error: { message: 'Tax rate must be between 0 and 100' } };
    }
    
    if (formData.get('default_markup_rate') && (default_markup_rate < 0 || default_markup_rate > 1000)) {
      return { data: null, error: { message: 'Markup rate must be between 0 and 1000' } };
    }

    // Validate required fields
    if (!company_name?.trim()) {
      return { data: null, error: { message: 'Company name is required' } };
    }

    // Validate email format if provided
    if (company_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company_email)) {
      return { data: null, error: { message: 'Please enter a valid email address' } };
    }

    const settingsData = {
      id: user.id,
      company_name: company_name.trim(),
      company_address: company_address || null,
      company_phone: company_phone || null,
      company_email: company_email || null,
      logo_url: logo_url || null,
      logo_file_name: logo_file_name || null,
      preferred_currency: preferred_currency || 'USD',
      quote_terms: quote_terms || null,
      default_tax_rate: formData.get('default_tax_rate') ? default_tax_rate : null,
      default_markup_rate: formData.get('default_markup_rate') ? default_markup_rate : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('company_settings')
      .upsert(settingsData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Ensure returned data matches CompanySettings interface
    const returnData = {
      ...data,
      company_email: (data as any).company_email || null,
      logo_file_name: (data as any).logo_file_name || null,
      preferred_currency: (data as any).preferred_currency || 'USD',
      quote_terms: (data as any).quote_terms || null,
    } as CompanySettings;

    return { data: returnData, error: null };
  } catch (error) {
    console.error('Error saving company settings:', error);
    return { data: null, error: { message: 'Failed to save company settings' } };
  }
}