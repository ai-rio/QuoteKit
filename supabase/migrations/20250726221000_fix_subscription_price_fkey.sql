-- Fix subscription price_id foreign key to reference stripe_prices instead of old prices table
-- This resolves the issue where Stripe webhooks fail because price_id references the wrong table

-- Drop the old foreign key constraint
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_price_id_fkey;

-- Add new foreign key constraint pointing to stripe_prices
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_price_id_fkey 
FOREIGN KEY (price_id) 
REFERENCES public.stripe_prices(stripe_price_id);

-- Optionally, we could drop the old tables if they're no longer needed
-- But for safety, we'll keep them for now
-- DROP TABLE IF EXISTS public.prices;
-- DROP TABLE IF EXISTS public.products;

-- Verify the constraint was added
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'subscriptions_price_id_fkey';