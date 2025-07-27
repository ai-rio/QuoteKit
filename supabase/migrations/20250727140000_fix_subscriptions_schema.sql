-- Fix subscriptions table schema to match application code requirements
-- This migration addresses critical missing columns that cause subscription creation to fail

-- 1. Add missing columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- 2. Update the primary key strategy for mixed Stripe/local subscriptions
-- For free plans, we need to support local-only subscriptions without Stripe IDs
-- Change the id column to support both Stripe subscription IDs and generated UUIDs

-- First, check if we have any existing data that would conflict
DO $$
BEGIN
  -- Add a new UUID column for internal tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' 
                 AND column_name = 'internal_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN internal_id uuid DEFAULT gen_random_uuid();
    
    -- Update existing records to have internal IDs
    UPDATE public.subscriptions SET internal_id = gen_random_uuid() WHERE internal_id IS NULL;
    
    -- Make internal_id NOT NULL and unique
    ALTER TABLE public.subscriptions ALTER COLUMN internal_id SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_internal_id ON public.subscriptions(internal_id);
  END IF;
END $$;

-- 3. Update the primary key strategy for mixed Stripe/local subscriptions
-- We need to change the primary key from 'id' to 'internal_id' to support NULL stripe IDs

-- Step 1: First handle the foreign key dependencies
-- Drop existing foreign key constraints that reference subscriptions.id
ALTER TABLE public.subscription_changes 
DROP CONSTRAINT IF EXISTS subscription_changes_subscription_id_fkey;

-- Step 2: Drop the existing primary key constraint
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;

-- Step 3: Make internal_id the new primary key
ALTER TABLE public.subscriptions ADD PRIMARY KEY (internal_id);

-- Step 4: Now we can make id nullable (since it's no longer a primary key)
ALTER TABLE public.subscriptions ALTER COLUMN id DROP NOT NULL;

-- 4. Add proper indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);

-- 5. Add a constraint to ensure data integrity
-- Either both stripe IDs are null (free plan) or both are present (paid plan)
ALTER TABLE public.subscriptions 
ADD CONSTRAINT chk_stripe_ids_consistency 
CHECK (
  (stripe_subscription_id IS NULL AND stripe_customer_id IS NULL AND id IS NULL) OR 
  (stripe_subscription_id IS NOT NULL AND stripe_customer_id IS NOT NULL AND id IS NOT NULL)
);

-- 6. Update subscription_changes table to use internal_id instead of id
ALTER TABLE public.subscription_changes 
ADD COLUMN IF NOT EXISTS subscription_internal_id uuid;

-- 7. Re-add foreign key constraint using internal_id
ALTER TABLE public.subscription_changes 
ADD CONSTRAINT subscription_changes_subscription_internal_id_fkey 
FOREIGN KEY (subscription_internal_id) REFERENCES public.subscriptions(internal_id) ON DELETE CASCADE;

-- 8. Add a view for easier querying that handles both free and paid subscriptions
CREATE OR REPLACE VIEW subscription_details AS
SELECT 
  s.internal_id,
  s.id as stripe_subscription_id_legacy, -- Keep for backward compatibility
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.user_id,
  s.status,
  s.metadata,
  s.price_id,
  s.quantity,
  s.cancel_at_period_end,
  s.created,
  s.current_period_start,
  s.current_period_end,
  s.ended_at,
  s.cancel_at,
  s.canceled_at,
  s.trial_start,
  s.trial_end,
  s.updated_at,
  CASE 
    WHEN s.stripe_subscription_id IS NULL THEN 'free'
    ELSE 'paid'
  END as subscription_type,
  p.description as price_description,
  p.unit_amount as price_amount,
  p.currency as price_currency
FROM public.subscriptions s
LEFT JOIN public.prices p ON s.price_id = p.id;

-- 9. Grant appropriate permissions on the view
ALTER VIEW subscription_details OWNER TO postgres;

-- Enable RLS on the view (inherits from underlying tables)
-- Note: Views inherit RLS from their underlying tables

-- 10. Create a helper function to get user's active subscription
CREATE OR REPLACE FUNCTION get_user_active_subscription(user_uuid uuid)
RETURNS TABLE (
  internal_id uuid,
  stripe_subscription_id text,
  stripe_customer_id text,
  status subscription_status,
  price_id text,
  subscription_type text,
  price_description text,
  price_amount bigint,
  price_currency text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    sd.internal_id,
    sd.stripe_subscription_id,
    sd.stripe_customer_id,
    sd.status,
    sd.price_id,
    sd.subscription_type,
    sd.price_description,
    sd.price_amount,
    sd.price_currency
  FROM subscription_details sd
  WHERE sd.user_id = user_uuid 
    AND sd.status IN ('active', 'trialing')
  ORDER BY sd.created DESC
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_active_subscription(uuid) TO authenticated;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON public.subscriptions(user_id) WHERE status IN ('active', 'trialing');

-- 12. Add comments for documentation
COMMENT ON COLUMN public.subscriptions.internal_id IS 'Internal UUID for all subscriptions (primary identifier)';
COMMENT ON COLUMN public.subscriptions.id IS 'Stripe subscription ID for paid plans, NULL for free plans';  
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID (duplicates id for paid plans, NULL for free plans)';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'Stripe customer ID for paid plans, NULL for free plans';
COMMENT ON VIEW subscription_details IS 'Unified view for both free and paid subscriptions with pricing information';
COMMENT ON FUNCTION get_user_active_subscription(uuid) IS 'Helper function to get a users active subscription with pricing details';