-- Fix RLS policies for subscriptions table
-- Users need to be able to INSERT and UPDATE their own subscriptions

-- Add INSERT policy - users can create subscriptions for themselves
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy - users can update their own subscriptions  
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy - users can delete their own subscriptions (optional)
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add comment for clarity
COMMENT ON POLICY "Users can insert own subscriptions" ON public.subscriptions IS 'Allow users to create subscriptions for themselves';
COMMENT ON POLICY "Users can update own subscriptions" ON public.subscriptions IS 'Allow users to update their own subscription details';
COMMENT ON POLICY "Users can delete own subscriptions" ON public.subscriptions IS 'Allow users to delete their own subscriptions';
