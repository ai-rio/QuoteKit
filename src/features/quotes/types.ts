// src/features/quotes/types.ts
export interface QuoteLineItem {
  id: string;
  name: string;
  unit: string;
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
}