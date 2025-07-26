-- Add foreign key constraint between stripe_prices and stripe_products
-- This enables Supabase relationship queries like stripe_prices(*)

ALTER TABLE public.stripe_prices 
ADD CONSTRAINT fk_stripe_prices_product_id 
FOREIGN KEY (stripe_product_id) 
REFERENCES public.stripe_products(stripe_product_id);

-- Add sample data for local development
INSERT INTO public.stripe_products (stripe_product_id, name, description, active) VALUES
('prod_basic', 'Basic Plan', 'Perfect for individuals and small businesses', true),
('prod_pro', 'Professional Plan', 'Advanced features for growing businesses', true),
('prod_enterprise', 'Enterprise Plan', 'Full-featured solution for large organizations', true)
ON CONFLICT (stripe_product_id) DO NOTHING;

-- Insert sample Stripe prices
INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, unit_amount, currency, recurring_interval, active) VALUES
-- Basic Plan
('price_basic_monthly', 'prod_basic', 999, 'usd', 'month', true),
('price_basic_yearly', 'prod_basic', 9999, 'usd', 'year', true),
-- Professional Plan  
('price_pro_monthly', 'prod_pro', 2999, 'usd', 'month', true),
('price_pro_yearly', 'prod_pro', 29999, 'usd', 'year', true),
-- Enterprise Plan
('price_enterprise_monthly', 'prod_enterprise', 9999, 'usd', 'month', true),
('price_enterprise_yearly', 'prod_enterprise', 99999, 'usd', 'year', true)
ON CONFLICT (stripe_price_id) DO NOTHING;