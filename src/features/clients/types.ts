export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export interface ClientWithAnalytics extends Client {
  total_quotes: number;
  accepted_quotes: number;
  declined_quotes: number;
  total_quote_value: number;
  accepted_value: number;
  average_quote_value: number;
  acceptance_rate_percent: number;
  last_quote_date: string | null;
}

export interface ClientSearchFilters {
  search: string;
  sortBy: 'name' | 'created_at' | 'last_quote_date' | 'total_quotes' | 'total_quote_value';
  sortOrder: 'asc' | 'desc';
  hasQuotes?: boolean;
}

export interface ClientValidation {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
  notes: boolean;
}

// For client selector component
export interface ClientOption {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

// Form validation schema types
export type ClientFormErrors = {
  [K in keyof ClientFormData]?: string;
};