-- Create Stripe products table
CREATE TABLE public.stripe_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_product_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe prices table
CREATE TABLE public.stripe_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_price_id text UNIQUE NOT NULL,
  stripe_product_id text NOT NULL,
  unit_amount integer NOT NULL,
  currency text NOT NULL,
  recurring_interval text, -- 'month', 'year', null for one-time
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe webhook events table for debugging and idempotency
CREATE TABLE public.stripe_webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  data jsonb
);

-- Add RLS policies for admin access
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policies allowing only admin users to access these tables
CREATE POLICY "Admin users can manage stripe products" 
ON public.stripe_products FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can manage stripe prices" 
ON public.stripe_prices FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can view stripe webhook events" 
ON public.stripe_webhook_events FOR SELECT 
USING (is_admin(auth.uid()));

-- Allow service role to insert webhook events (for the webhook handler)
CREATE POLICY "Service role can manage webhook events" 
ON public.stripe_webhook_events FOR ALL 
USING (auth.role() = 'service_role');

-- Add indexes for better performance
CREATE INDEX idx_stripe_products_stripe_id ON public.stripe_products(stripe_product_id);
CREATE INDEX idx_stripe_products_active ON public.stripe_products(active);

CREATE INDEX idx_stripe_prices_stripe_id ON public.stripe_prices(stripe_price_id);
CREATE INDEX idx_stripe_prices_product_id ON public.stripe_prices(stripe_product_id);
CREATE INDEX idx_stripe_prices_active ON public.stripe_prices(active);

CREATE INDEX idx_stripe_webhook_events_stripe_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_type ON public.stripe_webhook_events(event_type);
CREATE INDEX idx_stripe_webhook_events_processed ON public.stripe_webhook_events(processed);

-- Add updated_at trigger for stripe_products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stripe_products_updated_at BEFORE UPDATE ON public.stripe_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_prices_updated_at BEFORE UPDATE ON public.stripe_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();