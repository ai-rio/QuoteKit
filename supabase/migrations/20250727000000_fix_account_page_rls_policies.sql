-- Fix RLS policies for account page functionality
-- This migration addresses the issue where authenticated users cannot access their account data
-- due to overly restrictive RLS policies on customers, stripe_prices, and stripe_products tables

-- 1. Add policy for customers table to allow users to read their own customer record
-- This is needed for getBillingHistory() and getPaymentMethods() functions
CREATE POLICY "Users can view own customer data" 
ON public.customers FOR SELECT 
USING (auth.uid() = id);

-- 2. Add policy for stripe_prices table to allow authenticated users to read price data
-- This is needed for subscription display and price information on account page
CREATE POLICY "Authenticated users can view stripe prices" 
ON public.stripe_prices FOR SELECT 
USING (auth.role() = 'authenticated' AND active = true);

-- 3. Add policy for stripe_products table to allow authenticated users to read product data  
-- This is needed for subscription display and product information on account page
CREATE POLICY "Authenticated users can view stripe products" 
ON public.stripe_products FOR SELECT 
USING (auth.role() = 'authenticated' AND active = true);

-- Note: These policies maintain security by:
-- - Only allowing SELECT operations (no INSERT, UPDATE, DELETE)
-- - Only allowing access to active products/prices
-- - Customers table only allows users to see their own record
-- - Admin policies remain unchanged for full management access