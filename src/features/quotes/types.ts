// src/features/quotes/types.ts
// Quote status enum matching Story 2.6 requirements
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

// Database quote type - define locally since quotes table is not in clean subscription schema
export interface DatabaseQuote {
  id: string;
  user_id: string;
  quote_number: string;
  status: QuoteStatus;
  client_id: string;
  client_name: string;
  client_contact: string;
  title: string;
  description?: string;
  quote_data: any; // JSON data containing line items
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  markup_rate: number;
  total: number;
  valid_until?: string;
  sent_at?: string;
  expires_at?: string;
  follow_up_date?: string;
  notes?: string;
  is_template?: boolean;
  template_name?: string;
  created_at: string;
  updated_at: string;
}

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
  // Client information - new client_id field takes precedence
  client_id?: string | null;
  client_name: string; // Kept for backward compatibility
  client_contact: string | null; // Kept for backward compatibility
  quote_data: QuoteLineItem[];
  subtotal: number;
  tax_rate: number;
  markup_rate: number;
  total: number;
  created_at: string;
  // Enhanced fields for Story 2.6
  status?: QuoteStatus;
  quote_number?: string;
  updated_at?: string;
  sent_at?: string | null;
  expires_at?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  is_template?: boolean;
  template_name?: string | null;
}

export interface QuoteCalculation {
  subtotal: number;
  taxAmount: number;
  markupAmount: number;
  total: number;
}

export interface CreateQuoteData {
  // Client information - prefer client_id over client_name
  client_id?: string | null;
  client_name: string; // Fallback if no client_id provided
  client_contact: string | null; // Fallback if no client_id provided
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
  // Client information - prefer client_id over client_name
  client_id?: string | null;
  client_name?: string; // Fallback if no client_id provided
  client_contact?: string | null; // Fallback if no client_id provided
  quote_data?: QuoteLineItem[];
  tax_rate?: number;
  markup_rate?: number;
}

// Quote management interfaces for Story 2.6
export interface QuoteFilters {
  status?: QuoteStatus | 'all';
  client?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  searchTerm?: string;
}

export interface QuoteSortOptions {
  field: 'created_at' | 'client_name' | 'total' | 'status' | 'quote_number';
  direction: 'asc' | 'desc';
}

export interface BulkQuoteActions {
  updateStatus: (quoteIds: string[], status: QuoteStatus) => Promise<void>;
  delete: (quoteIds: string[]) => Promise<void>;
  export: (quoteIds: string[]) => Promise<void>;
  sendEmails: (quoteIds: string[]) => Promise<void>;
}

// Utility function to convert database quote to application quote
export function convertDatabaseQuoteToQuote(dbQuote: DatabaseQuote): Quote {
  return {
    id: dbQuote.id,
    user_id: dbQuote.user_id,
    client_name: dbQuote.client_name,
    client_contact: dbQuote.client_contact,
    quote_data: dbQuote.quote_data as unknown as QuoteLineItem[],
    subtotal: dbQuote.subtotal,
    tax_rate: dbQuote.tax_rate,
    markup_rate: dbQuote.markup_rate,
    total: dbQuote.total,
    created_at: dbQuote.created_at || '',
    status: dbQuote.status as QuoteStatus || 'draft',
    quote_number: dbQuote.quote_number || undefined,
    updated_at: dbQuote.updated_at || undefined,
    sent_at: dbQuote.sent_at,
    expires_at: dbQuote.expires_at,
    follow_up_date: dbQuote.follow_up_date,
    notes: dbQuote.notes,
    is_template: dbQuote.is_template || false,
    template_name: dbQuote.template_name,
  };
}