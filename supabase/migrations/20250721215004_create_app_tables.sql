-- Company Settings Table (Story 1.2)
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  logo_url TEXT,
  default_tax_rate NUMERIC(5, 2) DEFAULT 0.00,
  default_markup_rate NUMERIC(5, 2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own company settings" 
  ON public.company_settings FOR ALL USING (auth.uid() = id);

-- Line Items Table (Story 1.3)
CREATE TABLE public.line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT,
  cost NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own line items" 
  ON public.line_items FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_line_items_user_id ON public.line_items(user_id);

-- Quotes Table (Stories 1.4 & 1.5)
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_contact TEXT,
  quote_data JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_rate NUMERIC(5, 2) NOT NULL,
  markup_rate NUMERIC(5, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own quotes" 
  ON public.quotes FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);