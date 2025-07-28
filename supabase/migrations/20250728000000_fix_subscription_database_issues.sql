-- Fix critical subscription database issues for Stripe integration
-- This migration addresses:
-- 1. Free plan subscription creation and upgrade paths
-- 2. RLS policy issues preventing webhook operations
-- 3. Database constraints blocking subscription lifecycle operations
-- 4. Customer record creation issues

-- First, ensure we have the proper enum types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM (
            'incomplete',
            'incomplete_expired', 
            'trialing',
            'active',
            'past_due',
            'canceled',
            'unpaid'
        );
    END IF;
END $$;

-- 1. Fix subscription table structure for better free plan support
-- Add internal_id as a proper UUID primary key if it doesn't exist
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS internal_id uuid DEFAULT gen_random_uuid() NOT NULL;

-- Update the primary key to use internal_id instead of id
-- First drop existing constraints that depend on the old primary key
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (internal_id);

-- Create unique constraint on stripe_subscription_id for paid subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_unique 
ON public.subscriptions (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- Add index for efficient user lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON public.subscriptions (user_id, status);

-- 2. Update RLS policies to properly handle all subscription types
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

-- Create comprehensive RLS policies
CREATE POLICY "subscriptions_user_select" ON public.subscriptions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "subscriptions_user_insert" ON public.subscriptions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscriptions_user_update" ON public.subscriptions
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow service role (webhooks) full access
CREATE POLICY "subscriptions_service_all" ON public.subscriptions
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 3. Fix customers table RLS policies
DROP POLICY IF EXISTS "Users can view their own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customer record" ON public.customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;

CREATE POLICY "customers_user_select" ON public.customers
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "customers_user_insert" ON public.customers
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "customers_user_update" ON public.customers
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow service role full access to customers
CREATE POLICY "customers_service_all" ON public.customers
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 4. Create function to safely create free plan subscriptions
CREATE OR REPLACE FUNCTION create_free_plan_subscription(
    p_user_id uuid,
    p_price_id text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_id uuid;
    v_far_future timestamptz;
BEGIN
    -- Set far future date for free plans (100 years)
    v_far_future := NOW() + INTERVAL '100 years';
    
    -- Insert new free plan subscription
    INSERT INTO public.subscriptions (
        internal_id,
        id, -- null for free plans
        user_id,
        status,
        price_id,
        stripe_subscription_id, -- null for free plans
        stripe_customer_id, -- null for free plans initially
        current_period_start,
        current_period_end,
        created,
        cancel_at_period_end,
        trial_start,
        trial_end,
        cancel_at,
        canceled_at,
        ended_at
    ) VALUES (
        gen_random_uuid(),
        NULL, -- Free plans have null Stripe subscription ID
        p_user_id,
        'active',
        p_price_id,
        NULL, -- No Stripe subscription for free plans
        NULL, -- Will be set when customer record is created
        NOW(),
        v_far_future,
        NOW(),
        false,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    ) RETURNING internal_id INTO v_subscription_id;
    
    RETURN v_subscription_id;
END;
$$;

-- 5. Create function to upgrade free plan to paid subscription
CREATE OR REPLACE FUNCTION upgrade_subscription_to_paid(
    p_user_id uuid,
    p_stripe_subscription_id text,
    p_stripe_customer_id text,
    p_price_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, cancel any existing free subscriptions
    UPDATE public.subscriptions 
    SET 
        status = 'canceled',
        canceled_at = NOW(),
        ended_at = NOW()
    WHERE user_id = p_user_id 
      AND stripe_subscription_id IS NULL 
      AND status IN ('active', 'trialing');
    
    -- Note: The actual paid subscription will be created by webhook
    -- This function just cleans up the free subscription
    
    RETURN true;
END;
$$;

-- 6. Create diagnostic view for troubleshooting
CREATE OR REPLACE VIEW subscription_diagnostics AS
SELECT 
    s.internal_id,
    s.user_id,
    s.id as stripe_subscription_id_legacy,
    s.stripe_subscription_id,
    s.stripe_customer_id,
    s.status,
    s.price_id,
    sp.stripe_price_id,
    sp.unit_amount,
    spr.name as product_name,
    CASE 
        WHEN s.stripe_subscription_id IS NULL THEN 'free'
        ELSE 'paid'
    END as subscription_type,
    s.current_period_start,
    s.current_period_end,
    s.created,
    c.stripe_customer_id as customer_stripe_id
FROM public.subscriptions s
LEFT JOIN public.stripe_prices sp ON s.price_id = sp.stripe_price_id
LEFT JOIN public.stripe_products spr ON sp.stripe_product_id = spr.stripe_product_id
LEFT JOIN public.customers c ON s.user_id = c.id;

-- 7. Grant proper permissions
GRANT SELECT ON subscription_diagnostics TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_free_plan_subscription(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION upgrade_subscription_to_paid(uuid, text, text, text) TO authenticated, service_role;

-- 8. Update subscription_changes table if it exists to use internal_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_changes') THEN
        -- Add new column if it doesn't exist
        ALTER TABLE public.subscription_changes 
        ADD COLUMN IF NOT EXISTS subscription_internal_id uuid;
        
        -- Create foreign key to new primary key
        ALTER TABLE public.subscription_changes 
        DROP CONSTRAINT IF EXISTS subscription_changes_subscription_internal_id_fkey;
        
        ALTER TABLE public.subscription_changes 
        ADD CONSTRAINT subscription_changes_subscription_internal_id_fkey 
        FOREIGN KEY (subscription_internal_id) REFERENCES public.subscriptions(internal_id);
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_subscription_changes_internal_id 
        ON public.subscription_changes (subscription_internal_id);
    END IF;
END $$;

-- 9. Add helpful comments
COMMENT ON COLUMN public.subscriptions.internal_id IS 'Primary key UUID for all subscriptions (always unique)';
COMMENT ON COLUMN public.subscriptions.id IS 'Stripe subscription ID for paid plans, NULL for free plans';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Duplicate of id field for clarity in queries';
COMMENT ON VIEW subscription_diagnostics IS 'Comprehensive view for troubleshooting subscription issues';
COMMENT ON FUNCTION create_free_plan_subscription(uuid, text) IS 'Safely creates a free plan subscription with proper defaults';
COMMENT ON FUNCTION upgrade_subscription_to_paid(uuid, text, text, text) IS 'Handles upgrade from free to paid subscription';