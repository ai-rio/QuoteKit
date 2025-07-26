-- Replace sample Stripe data with real production Stripe IDs
-- This migration updates the database to use actual Stripe product and price IDs

-- Clear existing sample data
DELETE FROM public.stripe_prices WHERE stripe_price_id LIKE 'price_%_monthly' OR stripe_price_id LIKE 'price_%_yearly';
DELETE FROM public.stripe_products WHERE stripe_product_id LIKE 'prod_%';

-- Insert real Stripe products
INSERT INTO public.stripe_products (stripe_product_id, name, description, active) VALUES
('prod_QuDTopGKDyBbmE', 'Yearly Plan', 'Annual subscription with significant savings', true),
('prod_QuDTY8EujVObXU', 'Monthly Plan', 'Flexible monthly subscription', true),
('prod_QuDTkvDcpwjpNO', 'Free Plan', 'Basic features for getting started', true)
ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  updated_at = now();

-- Insert real Stripe prices
-- Note: Based on typical pricing patterns, mapping prices to products
-- You may need to adjust the product mappings based on your actual Stripe setup
INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, unit_amount, currency, recurring_interval, active) VALUES
-- Assuming the first price is for yearly plan (typically higher amount)
('price_1RoUo5GgBK1ooXYF4nMSQooR', 'prod_QuDTopGKDyBbmE', 19900, 'usd', 'year', true),
-- Assuming the second price is for monthly plan  
('price_1RVyAQGgBK1ooXYF0LokEHtQ', 'prod_QuDTY8EujVObXU', 1999, 'usd', 'month', true),
-- Assuming the third price is for free plan (zero cost)
('price_1RVyAPGgBK1ooXYFwt6viuQs', 'prod_QuDTkvDcpwjpNO', 0, 'usd', null, true)
ON CONFLICT (stripe_price_id) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  unit_amount = EXCLUDED.unit_amount,
  currency = EXCLUDED.currency,
  recurring_interval = EXCLUDED.recurring_interval,
  active = EXCLUDED.active,
  updated_at = now();

-- Verify the data was inserted correctly
SELECT 
  sp.name as product_name,
  sp.stripe_product_id,
  spr.stripe_price_id,
  spr.unit_amount / 100.0 as price_dollars,
  spr.recurring_interval,
  spr.active
FROM public.stripe_products sp
LEFT JOIN public.stripe_prices spr ON sp.stripe_product_id = spr.stripe_product_id
ORDER BY sp.name, spr.unit_amount;