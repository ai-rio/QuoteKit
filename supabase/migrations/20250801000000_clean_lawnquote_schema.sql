-- =====================================================
-- CLEAN LAWNQUOTE SCHEMA - CONSOLIDATED MIGRATION
-- =====================================================
-- This migration creates a clean, consolidated schema for the complete LawnQuote system
-- Includes all essential features: auth, quotes, clients, items, company settings, and Stripe integration

-- =====================================================
-- ENUMS
-- =====================================================

-- Quote status lifecycle
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted');

-- Subscription status (Stripe)
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

-- Pricing types (Stripe)
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  billing_address JSONB,
  payment_method JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can view own user data." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own user data." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Company Settings
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_address TEXT,
  company_email TEXT,
  company_phone TEXT,
  logo_url TEXT,
  logo_file_name TEXT,
  default_tax_rate NUMERIC(5, 2) DEFAULT 0.00,
  default_markup_rate NUMERIC(5, 2) DEFAULT 0.00,
  preferred_currency TEXT DEFAULT 'USD',
  quote_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own company settings" ON public.company_settings FOR ALL USING (auth.uid() = id);

-- =====================================================
-- LAWNQUOTE CORE TABLES
-- =====================================================

-- Item Categories for organization
CREATE TABLE public.item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own categories" ON public.item_categories FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_item_categories_user_id ON public.item_categories(user_id);

-- Line Items (Service/Material Catalog)
CREATE TABLE public.line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT,
  cost NUMERIC(10, 2) NOT NULL,
  category TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own line items" ON public.line_items FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_line_items_user_id ON public.line_items(user_id);
CREATE INDEX idx_line_items_category ON public.line_items(user_id, category);
CREATE INDEX idx_line_items_favorites ON public.line_items(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_line_items_search ON public.line_items USING gin(to_tsvector('english', name || ' ' || COALESCE(category, '')));

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_name ON public.clients(user_id, name);
CREATE INDEX idx_clients_search ON public.clients USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(notes, '')));

-- Quotes
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_contact TEXT,
  quote_number TEXT,
  quote_data JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_rate NUMERIC(5, 2) NOT NULL,
  markup_rate NUMERIC(5, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status quote_status DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  follow_up_date TIMESTAMPTZ,
  notes TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  template_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own quotes" ON public.quotes FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX idx_quotes_status ON public.quotes(user_id, status);
CREATE INDEX idx_quotes_templates ON public.quotes(user_id, is_template) WHERE is_template = TRUE;
CREATE INDEX idx_quotes_search ON public.quotes USING gin(to_tsvector('english', client_name || ' ' || COALESCE(notes, '') || ' ' || COALESCE(template_name, '')));

-- =====================================================
-- STRIPE INTEGRATION TABLES
-- =====================================================

-- Stripe Customers (mapping)
CREATE TABLE public.customers (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- No policies - this is a private table

-- Stripe Products
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  active BOOLEAN,
  name TEXT,
  description TEXT,
  image TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.products FOR SELECT USING (true);

-- Stripe Prices
CREATE TABLE public.prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products,
  active BOOLEAN,
  description TEXT,
  unit_amount BIGINT,
  currency TEXT CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.prices FOR SELECT USING (true);

-- Stripe Subscriptions
CREATE TABLE public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  status subscription_status,
  metadata JSONB,
  price_id TEXT REFERENCES public.prices,
  quantity INTEGER,
  cancel_at_period_end BOOLEAN,
  created TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can only view own subs data." ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- Quote Analytics View
CREATE VIEW public.quote_analytics AS
SELECT 
  q.user_id,
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE q.status = 'draft') as draft_quotes,
  COUNT(*) FILTER (WHERE q.status = 'sent') as sent_quotes,
  COUNT(*) FILTER (WHERE q.status = 'accepted') as accepted_quotes,
  COUNT(*) FILTER (WHERE q.status = 'declined') as declined_quotes,
  COUNT(*) FILTER (WHERE q.status = 'expired') as expired_quotes,
  COUNT(*) FILTER (WHERE q.status = 'converted') as converted_quotes,
  COUNT(*) FILTER (WHERE q.is_template = true) as template_count,
  SUM(q.total) as total_quote_value,
  SUM(q.total) FILTER (WHERE q.status = 'accepted') as accepted_value,
  AVG(q.total) as average_quote_value,
  ROUND(
    COUNT(*) FILTER (WHERE q.status = 'accepted')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE q.status IN ('accepted', 'declined'))::numeric, 0) * 100, 
    2
  ) as acceptance_rate_percent,
  COUNT(DISTINCT q.client_id) FILTER (WHERE q.client_id IS NOT NULL) as unique_clients_count
FROM public.quotes q
WHERE q.is_template = false
GROUP BY q.user_id;

-- Client Analytics View
CREATE VIEW public.client_analytics AS
SELECT 
  c.user_id,
  c.id as client_id,
  c.name as client_name,
  c.email,
  c.phone,
  COUNT(q.id) as total_quotes,
  COUNT(q.id) FILTER (WHERE q.status = 'accepted') as accepted_quotes,
  COUNT(q.id) FILTER (WHERE q.status = 'declined') as declined_quotes,
  SUM(q.total) as total_quote_value,
  SUM(q.total) FILTER (WHERE q.status = 'accepted') as accepted_value,
  AVG(q.total) as average_quote_value,
  ROUND(
    COUNT(q.id) FILTER (WHERE q.status = 'accepted')::numeric / 
    NULLIF(COUNT(q.id) FILTER (WHERE q.status IN ('accepted', 'declined'))::numeric, 0) * 100, 
    2
  ) as acceptance_rate_percent,
  MAX(q.created_at) as last_quote_date,
  c.created_at as client_since
FROM public.clients c
LEFT JOIN public.quotes q ON c.id = q.client_id AND q.is_template = false
GROUP BY c.id, c.user_id, c.name, c.email, c.phone, c.created_at;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_categories_updated_at BEFORE UPDATE ON public.item_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_line_items_updated_at BEFORE UPDATE ON public.line_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON public.prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update item last_used_at when used in quotes
CREATE OR REPLACE FUNCTION update_item_last_used(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.line_items 
  SET last_used_at = NOW() 
  WHERE id = item_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  quote_count INTEGER;
  current_year TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get count of quotes for this user this year
  SELECT COUNT(*) + 1 INTO quote_count
  FROM public.quotes 
  WHERE user_id = user_uuid 
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Return formatted quote number
  RETURN 'Q-' || current_year || '-' || LPAD(quote_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.products, public.prices;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'Extended user profiles with billing information';
COMMENT ON TABLE public.company_settings IS 'Business information and default quote settings';
COMMENT ON TABLE public.item_categories IS 'Categories for organizing line items';
COMMENT ON TABLE public.line_items IS 'Catalog of services and materials for quotes';
COMMENT ON TABLE public.clients IS 'Client contact information and relationship management';
COMMENT ON TABLE public.quotes IS 'Quote management with full lifecycle tracking';
COMMENT ON TABLE public.customers IS 'Stripe customer ID mapping (private)';
COMMENT ON TABLE public.products IS 'Stripe products for subscription billing';
COMMENT ON TABLE public.prices IS 'Stripe pricing information';
COMMENT ON TABLE public.subscriptions IS 'User subscription status and billing periods';
COMMENT ON VIEW public.quote_analytics IS 'Aggregated quote statistics per user';
COMMENT ON VIEW public.client_analytics IS 'Client performance and relationship metrics';
