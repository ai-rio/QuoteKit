-- Create subscription changes table for audit trail and plan change tracking
CREATE TABLE public.subscription_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id text NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  old_price_id text REFERENCES public.prices(id),
  new_price_id text NOT NULL REFERENCES public.prices(id),
  change_type text NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'cancellation', 'reactivation')),
  effective_date timestamptz NOT NULL,
  stripe_subscription_id text NOT NULL,
  reason text, -- Optional reason for the change (useful for cancellations)
  proration_amount integer, -- Amount charged/credited for proration
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS for subscription changes
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;

-- Create policy allowing users to view their own subscription changes
CREATE POLICY "Users can view own subscription changes" 
ON public.subscription_changes FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy allowing admin users to view all subscription changes
CREATE POLICY "Admin users can view all subscription changes" 
ON public.subscription_changes FOR ALL 
USING (is_admin(auth.uid()));

-- Allow service role to insert subscription changes (for server actions)
CREATE POLICY "Service role can manage subscription changes" 
ON public.subscription_changes FOR ALL 
USING (auth.role() = 'service_role');

-- Add indexes for better performance
CREATE INDEX idx_subscription_changes_user_id ON public.subscription_changes(user_id);
CREATE INDEX idx_subscription_changes_subscription_id ON public.subscription_changes(subscription_id);
CREATE INDEX idx_subscription_changes_stripe_id ON public.subscription_changes(stripe_subscription_id);
CREATE INDEX idx_subscription_changes_type ON public.subscription_changes(change_type);
CREATE INDEX idx_subscription_changes_effective_date ON public.subscription_changes(effective_date);
CREATE INDEX idx_subscription_changes_created_at ON public.subscription_changes(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_subscription_changes_updated_at 
BEFORE UPDATE ON public.subscription_changes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();