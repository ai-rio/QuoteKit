-- Sample Stripe Products and Prices for Local Development
-- Run this in your local Supabase Studio or via psql to populate test data

-- Insert sample products
INSERT INTO public.stripe_products (stripe_product_id, name, description, active) VALUES
  ('prod_sample_basic', 'Basic Plan', 'Perfect for small businesses starting out', true),
  ('prod_sample_professional', 'Professional Plan', 'For growing businesses with advanced needs', true),
  ('prod_sample_enterprise', 'Enterprise Plan', 'Custom solutions for large organizations', true)
ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  updated_at = now();

-- Insert sample prices
INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, unit_amount, currency, recurring_interval, active) VALUES
  -- Basic Plan - Monthly
  ('price_sample_basic_monthly', 'prod_sample_basic', 999, 'usd', 'month', true),
  -- Basic Plan - Annual
  ('price_sample_basic_annual', 'prod_sample_basic', 9999, 'usd', 'year', true),
  -- Professional Plan - Monthly
  ('price_sample_pro_monthly', 'prod_sample_professional', 2999, 'usd', 'month', true),
  -- Professional Plan - Annual
  ('price_sample_pro_annual', 'prod_sample_professional', 29999, 'usd', 'year', true),
  -- Enterprise Plan - Monthly
  ('price_sample_enterprise_monthly', 'prod_sample_enterprise', 9999, 'usd', 'month', true),
  -- Enterprise Plan - Annual
  ('price_sample_enterprise_annual', 'prod_sample_enterprise', 99999, 'usd', 'year', true)
ON CONFLICT (stripe_price_id) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  unit_amount = EXCLUDED.unit_amount,
  currency = EXCLUDED.currency,
  recurring_interval = EXCLUDED.recurring_interval,
  active = EXCLUDED.active,
  updated_at = now();

-- Verify the data was inserted
SELECT 
  sp.name as product_name,
  sp.description,
  spr.unit_amount / 100.0 as price_dollars,
  spr.currency,
  spr.recurring_interval
FROM stripe_products sp
JOIN stripe_prices spr ON sp.stripe_product_id = spr.stripe_product_id
ORDER BY sp.name, spr.unit_amount;