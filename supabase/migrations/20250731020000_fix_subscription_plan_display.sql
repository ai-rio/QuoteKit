-- Fix subscription plan display issues
-- This migration addresses the "Unknown Plan" problem by:
-- 1. Adding proper foreign key constraints
-- 2. Ensuring consistent field usage
-- 3. Creating indexed relationships for performance

-- First, ensure the stripe_price_id column exists in subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Populate stripe_price_id from existing price_id where available
UPDATE public.subscriptions 
SET stripe_price_id = price_id 
WHERE stripe_price_id IS NULL AND price_id IS NOT NULL;

-- Now create proper indexes for joins
CREATE INDEX IF NOT EXISTS idx_stripe_prices_stripe_product_id 
ON public.stripe_prices (stripe_product_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_price_id 
ON public.subscriptions (stripe_price_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_price_id 
ON public.subscriptions (price_id);

-- Add foreign key constraint from stripe_prices to stripe_products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stripe_prices_stripe_product_id_fkey'
    ) THEN
        ALTER TABLE public.stripe_prices 
        ADD CONSTRAINT stripe_prices_stripe_product_id_fkey 
        FOREIGN KEY (stripe_product_id) 
        REFERENCES public.stripe_products(stripe_product_id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create a function to sync stripe_price_id when price_id is set
-- This ensures both fields stay in sync during the transition period
CREATE OR REPLACE FUNCTION sync_subscription_price_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- If stripe_price_id is set but price_id is not, copy it over
    IF NEW.stripe_price_id IS NOT NULL AND NEW.price_id IS NULL THEN
        NEW.price_id = NEW.stripe_price_id;
    END IF;
    
    -- If price_id is set but stripe_price_id is not, copy it over
    IF NEW.price_id IS NOT NULL AND NEW.stripe_price_id IS NULL THEN
        NEW.stripe_price_id = NEW.price_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep price fields in sync
DROP TRIGGER IF EXISTS sync_subscription_price_fields_trigger ON public.subscriptions;
CREATE TRIGGER sync_subscription_price_fields_trigger
    BEFORE INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_subscription_price_fields();

-- Update any existing subscriptions where one field is missing
UPDATE public.subscriptions 
SET stripe_price_id = price_id 
WHERE stripe_price_id IS NULL AND price_id IS NOT NULL;

UPDATE public.subscriptions 
SET price_id = stripe_price_id 
WHERE price_id IS NULL AND stripe_price_id IS NOT NULL;

-- Create a view for easy subscription querying with all related data
CREATE OR REPLACE VIEW subscription_with_plan_details AS
SELECT 
    s.internal_id,
    s.id as stripe_subscription_id_legacy,
    s.stripe_subscription_id,
    s.user_id,
    s.status,
    s.stripe_price_id,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.created,
    s.canceled_at,
    s.ended_at,
    -- Price details
    sp.unit_amount,
    sp.currency,
    sp.recurring_interval,
    sp.active as price_active,
    -- Product details  
    spr.name as product_name,
    spr.description as product_description,
    spr.active as product_active,
    -- Computed fields
    CASE 
        WHEN s.stripe_price_id IS NULL THEN 'free'
        ELSE 'paid'
    END as subscription_type,
    CASE 
        WHEN spr.name IS NOT NULL THEN spr.name
        WHEN s.stripe_price_id IS NULL THEN 'Free Plan'
        ELSE 'Unknown Plan'
    END as display_name
FROM public.subscriptions s
LEFT JOIN public.stripe_prices sp ON s.stripe_price_id = sp.stripe_price_id
LEFT JOIN public.stripe_products spr ON sp.stripe_product_id = spr.stripe_product_id;

-- Grant access to the view
GRANT SELECT ON subscription_with_plan_details TO authenticated, service_role;

-- Create function to get subscription with fallback mechanisms
CREATE OR REPLACE FUNCTION get_subscription_with_plan(p_user_id uuid)
RETURNS TABLE (
    internal_id uuid,
    stripe_subscription_id text,
    user_id uuid,
    status text,
    stripe_price_id text,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean,
    created timestamptz,
    canceled_at timestamptz,
    ended_at timestamptz,
    unit_amount integer,
    currency text,
    recurring_interval text,
    product_name text,
    product_description text,
    subscription_type text,
    display_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        svpd.internal_id,
        svpd.stripe_subscription_id,
        svpd.user_id,
        svpd.status,
        svpd.stripe_price_id,
        svpd.current_period_start,
        svpd.current_period_end,
        svpd.cancel_at_period_end,
        svpd.created,
        svpd.canceled_at,
        svpd.ended_at,
        svpd.unit_amount,
        svpd.currency,
        svpd.recurring_interval,
        svpd.product_name,
        svpd.product_description,
        svpd.subscription_type,
        svpd.display_name
    FROM subscription_with_plan_details svpd
    WHERE svpd.user_id = p_user_id
      AND svpd.status IN ('trialing', 'active', 'past_due')
    ORDER BY 
        CASE WHEN svpd.stripe_price_id IS NOT NULL THEN 0 ELSE 1 END, -- Paid subscriptions first
        svpd.created DESC
    LIMIT 1;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_subscription_with_plan(uuid) TO authenticated, service_role;

-- Create a function to ensure product/price data exists for a subscription
CREATE OR REPLACE FUNCTION ensure_subscription_plan_data(p_stripe_price_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_price_exists boolean := false;
    v_product_exists boolean := false;
    v_product_id text;
BEGIN
    -- Check if price exists
    SELECT EXISTS(
        SELECT 1 FROM public.stripe_prices 
        WHERE stripe_price_id = p_stripe_price_id
    ) INTO v_price_exists;
    
    IF NOT v_price_exists THEN
        -- Log missing price data (this would trigger a sync in the application)
        INSERT INTO public.stripe_webhook_events (
            stripe_event_id,
            event_type,
            processed,
            data,
            error_message
        ) VALUES (
            'missing_price_' || p_stripe_price_id || '_' || extract(epoch from now()),
            'missing_price_data',
            false,
            jsonb_build_object('stripe_price_id', p_stripe_price_id, 'requested_at', now()),
            'Price data missing for subscription - needs sync'
        );
        
        RETURN false;
    END IF;
    
    -- Check if product exists for this price
    SELECT sp.stripe_product_id INTO v_product_id
    FROM public.stripe_prices sp
    WHERE sp.stripe_price_id = p_stripe_price_id;
    
    IF v_product_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.stripe_products 
            WHERE stripe_product_id = v_product_id
        ) INTO v_product_exists;
        
        IF NOT v_product_exists THEN
            -- Log missing product data
            INSERT INTO public.stripe_webhook_events (
                stripe_event_id,
                event_type,
                processed,
                data,
                error_message
            ) VALUES (
                'missing_product_' || v_product_id || '_' || extract(epoch from now()),
                'missing_product_data',
                false,
                jsonb_build_object('stripe_product_id', v_product_id, 'requested_at', now()),
                'Product data missing for price - needs sync'
            );
            
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_subscription_plan_data(text) TO authenticated, service_role;

-- Add helpful comments
COMMENT ON VIEW subscription_with_plan_details IS 'Complete subscription data with product and price information for UI display';
COMMENT ON FUNCTION get_subscription_with_plan(uuid) IS 'Get user subscription with all plan details and fallbacks';
COMMENT ON FUNCTION ensure_subscription_plan_data(text) IS 'Verify and log missing product/price data for subscriptions';
COMMENT ON FUNCTION sync_subscription_price_fields() IS 'Keep price_id and stripe_price_id fields synchronized';

-- Create index on the webhook events table for the missing data queries
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type_processed 
ON public.stripe_webhook_events (event_type, processed);