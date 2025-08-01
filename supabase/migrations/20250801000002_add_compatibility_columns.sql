-- Add compatibility columns to match what the existing code expects
-- This allows the existing code to work without major refactoring

-- Add stripe_subscription_id as an alias for id in subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN stripe_subscription_id TEXT;

-- Create a trigger to keep stripe_subscription_id in sync with id
CREATE OR REPLACE FUNCTION sync_subscription_id()
RETURNS TRIGGER AS $$
BEGIN
  -- On insert or update, sync stripe_subscription_id with id
  NEW.stripe_subscription_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_subscription_id_trigger
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_id();

-- Update existing records (if any)
UPDATE public.subscriptions SET stripe_subscription_id = id WHERE stripe_subscription_id IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Compatibility alias for id column (Stripe subscription ID)';
