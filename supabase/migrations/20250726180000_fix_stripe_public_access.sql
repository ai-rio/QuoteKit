-- Fix RLS policies for stripe_products and stripe_prices to allow public read access
-- This is needed for the pricing page to work for all users

-- Add public read access for stripe_products
CREATE POLICY "Public users can view active stripe products" 
ON public.stripe_products FOR SELECT 
USING (active = true);

-- Add public read access for stripe_prices  
CREATE POLICY "Public users can view active stripe prices" 
ON public.stripe_prices FOR SELECT 
USING (active = true);

-- Note: The existing admin policies remain in place for full management access