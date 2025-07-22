// src/features/settings/types.ts
export interface CompanySettings {
  id: string; // Corresponds to user_id
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  logo_url: string | null;
  default_tax_rate: number | null;
  default_markup_rate: number | null;
}