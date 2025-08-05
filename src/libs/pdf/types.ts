// src/libs/pdf/types.ts
export interface PDFQuoteData {
  id: string;
  client_name: string;
  client_contact: string | null;
  quote_data: {
    id: string;
    name: string;
    unit: string;
    cost: number;
    quantity: number;
  }[];
  subtotal: number;
  tax_rate: number;
  total: number;
  created_at: string;
}

export interface PDFCompanyData {
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  logo_url: string | null;
}

export interface PDFGenerationOptions {
  quote: PDFQuoteData;
  company: PDFCompanyData;
  showWatermark?: boolean;
  watermarkText?: string;
}