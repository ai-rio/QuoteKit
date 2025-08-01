-- Fix table names to match what the application code expects
-- The code expects stripe_products and stripe_prices, not products and prices

-- Rename products to stripe_products
ALTER TABLE public.products RENAME TO stripe_products;

-- Rename prices to stripe_prices  
ALTER TABLE public.prices RENAME TO stripe_prices;

-- Update the foreign key reference in stripe_prices
ALTER TABLE public.stripe_prices DROP CONSTRAINT IF EXISTS prices_product_id_fkey;
ALTER TABLE public.stripe_prices ADD CONSTRAINT stripe_prices_stripe_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.stripe_products(id);

-- Rename the product_id column to stripe_product_id to match expectations
ALTER TABLE public.stripe_prices RENAME COLUMN product_id TO stripe_product_id;

-- Update the foreign key reference in subscriptions
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_price_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_stripe_price_id_fkey 
  FOREIGN KEY (price_id) REFERENCES public.stripe_prices(id);

-- Rename price_id to stripe_price_id in subscriptions
ALTER TABLE public.subscriptions RENAME COLUMN price_id TO stripe_price_id;

-- Update RLS policies with new table names
DROP POLICY IF EXISTS "Allow public read-only access." ON public.stripe_products;
CREATE POLICY "Allow public read-only access." ON public.stripe_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access." ON public.stripe_prices;  
CREATE POLICY "Allow public read-only access." ON public.stripe_prices FOR SELECT USING (true);

-- Update realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.stripe_products, public.stripe_prices;

-- Update comments
COMMENT ON TABLE public.stripe_products IS 'Stripe products for subscription billing';
COMMENT ON TABLE public.stripe_prices IS 'Stripe pricing information';
