// src/features/settings/types.ts
export interface CompanySettings {
  id: string; // Corresponds to user_id
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  logo_url: string | null;
  logo_file_name: string | null;
  default_tax_rate: number | null;
  default_markup_rate: number | null;
  preferred_currency: string | null;
  quote_terms: string | null;
}

export interface SettingsFormData {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  default_tax_rate: number;
  default_markup_rate: number;
  preferred_currency: string;
  quote_terms: string;
}

export interface SettingsValidation {
  company_name: boolean;
  company_email: boolean;
  default_tax_rate: boolean;
  default_markup_rate: boolean;
}