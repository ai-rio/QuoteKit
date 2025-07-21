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

    return { data: data || null, error: null };
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
    const default_tax_rate = parseFloat(formData.get('default_tax_rate') as string) || 0;
    const default_markup_rate = parseFloat(formData.get('default_markup_rate') as string) || 0;

    // Validate numeric inputs
    if (default_tax_rate < 0 || default_tax_rate > 100) {
      return { data: null, error: { message: 'Tax rate must be between 0 and 100' } };
    }
    
    if (default_markup_rate < 0 || default_markup_rate > 1000) {
      return { data: null, error: { message: 'Markup rate must be between 0 and 1000' } };
    }

    const settingsData = {
      id: user.id,
      company_name: company_name || null,
      company_address: company_address || null,
      company_phone: company_phone || null,
      logo_url: null, // TODO: Handle file upload in future iteration
      default_tax_rate,
      default_markup_rate,
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

    return { data, error: null };
  } catch (error) {
    console.error('Error saving company settings:', error);
    return { data: null, error: { message: 'Failed to save company settings' } };
  }
}