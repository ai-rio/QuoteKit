// src/features/quotes/types.ts

// Quote status enum matching database enum
export type QuoteStatus = 'draft' | 'final' | 'sent' | 'approved' | 'rejected';

export interface QuoteLineItem {
  id: string;
  name: string;
  unit: string | null;
  cost: number;
  quantity: number;
}

export interface Quote {
  id: string;
  user_id: string;
  client_name: string;
  client_contact: string | null;
  quote_data: QuoteLineItem[];
  subtotal: number;
  tax_rate: number;
  markup_rate: number;
  total: number;
  created_at: string;
  // New fields for Story 2.3 (optional until migration is applied)
  status?: QuoteStatus;
  quote_number?: string;
  updated_at?: string;
}

export interface QuoteCalculation {
  subtotal: number;
  taxAmount: number;
  markupAmount: number;
  total: number;
}

export interface CreateQuoteData {
  client_name: string;
  client_contact: string | null;
  quote_data: QuoteLineItem[];
  tax_rate: number;
  markup_rate: number;
  // New optional fields for Story 2.3
  status?: QuoteStatus;
  quote_number?: string;
}

// New interface for draft save functionality
export interface SaveDraftData {
  id?: string; // If provided, update existing draft
  client_name?: string;
  client_contact?: string | null;
  quote_data?: QuoteLineItem[];
  tax_rate?: number;
  markup_rate?: number;
}