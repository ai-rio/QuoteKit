-- =====================================================
-- FIX ANALYTICS ACCESS METADATA
-- =====================================================
-- This migration fixes the analytics access issue by adding proper metadata
-- to the premium plan product to enable analytics access for pro tier users.

-- Problem: Premium plan product metadata is empty '{}', so analytics access check fails
-- Solution: Update premium plan metadata to include analytics_access: true

-- Update Premium Plan product metadata to include analytics access
UPDATE public.stripe_products 
SET 
  metadata = jsonb_build_object('analytics_access', 'true'),
  updated_at = NOW()
WHERE id = 'prod_premium_plan';

-- Also update the premium price metadata for consistency
UPDATE public.stripe_prices 
SET 
  metadata = jsonb_build_object('analytics_access', 'true'),
  updated_at = NOW()
WHERE id = 'price_premium_plan';

-- Create a premium subscription for the admin user (carlos@ai.rio.br)
-- This ensures the admin user has access to all premium features including analytics
INSERT INTO public.subscriptions (
  id,
  user_id,
  status,
  stripe_price_id,
  quantity,
  cancel_at_period_end,
  created,
  current_period_start,
  current_period_end,
  metadata
) VALUES (
  'sub_admin_premium',
  '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
  'active',
  'price_premium_plan',
  1,
  false,
  NOW(),
  NOW(),
  NOW() + INTERVAL '365 days', -- Give admin user a year of premium access
  jsonb_build_object('admin_subscription', 'true')
)
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  stripe_price_id = 'price_premium_plan',
  current_period_end = NOW() + INTERVAL '365 days',
  updated_at = NOW();

-- Remove any existing free subscription for the admin user to avoid conflicts
DELETE FROM public.subscriptions 
WHERE user_id = '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid 
AND id != 'sub_admin_premium';

-- Verify the fix by checking analytics access for the admin user
DO $$
DECLARE
  has_access BOOLEAN;
  subscription_info RECORD;
BEGIN
  -- Check if admin user now has analytics access
  SELECT 
    s.status,
    p.id as price_id,
    pr.name as product_name,
    pr.metadata->>'analytics_access' as analytics_access
  INTO subscription_info
  FROM public.subscriptions s
  JOIN public.stripe_prices p ON s.stripe_price_id = p.id
  JOIN public.stripe_products pr ON p.stripe_product_id = pr.id
  WHERE s.user_id = '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid
  AND s.status = 'active';
  
  has_access := subscription_info.analytics_access = 'true';
  
  RAISE NOTICE 'Analytics access fix completed:';
  RAISE NOTICE '- Updated premium product metadata with analytics_access: true';
  RAISE NOTICE '- Created premium subscription for admin user';
  RAISE NOTICE '- Admin user subscription: % (% - %)', 
    subscription_info.status, 
    subscription_info.product_name,
    subscription_info.price_id;
  RAISE NOTICE '- Analytics access enabled: %', has_access;
  
  IF NOT has_access THEN
    RAISE EXCEPTION 'Analytics access fix failed - admin user still does not have access';
  END IF;
END $$;

-- Add helpful comment
COMMENT ON TABLE public.stripe_products IS 'Stripe products with metadata for feature access control. Premium products should have analytics_access: true';
