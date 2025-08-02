-- =====================================================
-- FIX SUBSCRIPTION ID TRIGGER FOR PROPER PLAN CHANGES
-- =====================================================
-- This migration fixes the sync_subscription_id trigger to only set
-- stripe_subscription_id for real Stripe subscriptions, not local free ones

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS sync_subscription_id_trigger ON public.subscriptions;
DROP FUNCTION IF EXISTS sync_subscription_id();

-- Create a smarter sync function that only sets stripe_subscription_id for real Stripe subscriptions
CREATE OR REPLACE FUNCTION sync_subscription_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set stripe_subscription_id if this is a real Stripe subscription
  -- (starts with 'sub_' but not 'sub_free_', 'sub_admin_', or 'sub_dev_')
  IF NEW.id ~ '^sub_[0-9A-Za-z]+$' AND 
     NEW.id NOT LIKE 'sub_free_%' AND 
     NEW.id NOT LIKE 'sub_admin_%' AND 
     NEW.id NOT LIKE 'sub_dev_%' THEN
    -- This looks like a real Stripe subscription ID
    NEW.stripe_subscription_id = NEW.id;
  ELSE
    -- This is a local/free subscription, don't set stripe_subscription_id
    NEW.stripe_subscription_id = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger
CREATE TRIGGER sync_subscription_id_trigger
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_id();

-- Fix existing subscriptions that have incorrect stripe_subscription_id values
UPDATE public.subscriptions 
SET stripe_subscription_id = NULL
WHERE stripe_subscription_id IS NOT NULL 
AND (
  stripe_subscription_id LIKE 'sub_free_%' OR
  stripe_subscription_id LIKE 'sub_admin_%' OR
  stripe_subscription_id LIKE 'sub_dev_%'
);

-- Log the fix
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE 'Fixed subscription ID trigger and updated % existing subscriptions', fixed_count;
  RAISE NOTICE 'Free subscriptions will now properly trigger new subscription flow for plan changes';
END $$;
