-- Fix RLS policies for subscriptions table to allow webhook operations
-- This is CRITICAL for subscription sync to work properly

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Can only view own subs data." ON public.subscriptions;

-- Create comprehensive RLS policies for subscriptions table

-- 1. Users can view their own subscription data
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Service role can manage all subscription data (for webhooks)
CREATE POLICY "Service role can manage subscriptions" 
ON public.subscriptions FOR ALL 
USING (auth.role() = 'service_role');

-- 3. Admin users can view all subscription data  
CREATE POLICY "Admin users can view all subscriptions" 
ON public.subscriptions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'admin'
  )
);

-- 4. Admin users can manage all subscription data
CREATE POLICY "Admin users can manage subscriptions" 
ON public.subscriptions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'admin'
  )
);

-- 5. Allow authenticated users to insert/update their own subscriptions 
-- (This supports user-initiated subscription changes via server actions)
CREATE POLICY "Users can upsert own subscriptions" 
ON public.subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add comment explaining the policy structure
COMMENT ON TABLE public.subscriptions IS 'Subscription data with RLS policies allowing: user self-access, service role full access (webhooks), admin full access';

-- Verify RLS is enabled (should already be enabled but let's be safe)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;