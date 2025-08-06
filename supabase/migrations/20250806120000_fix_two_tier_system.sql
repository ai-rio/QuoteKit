-- =====================================================
-- FIX TWO-TIER SYSTEM - CONVERT THREE TIERS TO TWO
-- =====================================================
-- This migration fixes the tier mismatch between the subscription system (free/premium)
-- and the global items library (free/paid/premium) by consolidating to a proper two-tier system.

-- Problem: 
-- - Subscription system: free + premium (2 tiers)
-- - Global items: free + paid + premium (3 tiers)  
-- - The "paid" tier is inaccessible since no subscription maps to it

-- Solution: Convert all "paid" tier items to "premium" tier

-- =====================================================
-- STEP 1: UPDATE GLOBAL ITEMS - CONVERT PAID TO PREMIUM
-- =====================================================

-- Move all "paid" tier items to "premium" tier
UPDATE public.global_items 
SET access_tier = 'premium', updated_at = NOW()
WHERE access_tier = 'paid';

-- =====================================================
-- STEP 2: UPDATE GLOBAL CATEGORIES - CONVERT PAID TO PREMIUM  
-- =====================================================

-- Move all "paid" tier categories to "premium" tier
UPDATE public.global_categories 
SET access_tier = 'premium', updated_at = NOW()
WHERE access_tier = 'paid';

-- =====================================================
-- STEP 3: UPDATE GET_USER_TIER FUNCTION - SIMPLIFY TO TWO TIERS
-- =====================================================

-- Replace the function to only return 'free' or 'premium'
CREATE OR REPLACE FUNCTION public.get_user_tier(user_id UUID DEFAULT auth.uid()) 
RETURNS TEXT AS $$
BEGIN
  -- Return 'free' if no user_id provided
  IF user_id IS NULL THEN
    RETURN 'free';
  END IF;

  -- Check user's subscription status - simplified to two tiers
  RETURN CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions s 
      JOIN public.stripe_prices p ON s.stripe_price_id = p.id 
      WHERE s.user_id = get_user_tier.user_id 
      AND s.status = 'active' 
      AND p.id = 'price_premium_plan'
    ) THEN 'premium'
    ELSE 'free'
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: UPDATE CHECK CONSTRAINTS TO ONLY ALLOW TWO TIERS
-- =====================================================

-- Update global_categories constraint
ALTER TABLE public.global_categories 
DROP CONSTRAINT IF EXISTS global_categories_access_tier_check;

ALTER TABLE public.global_categories 
ADD CONSTRAINT global_categories_access_tier_check 
CHECK (access_tier IN ('free', 'premium'));

-- Update global_items constraint  
ALTER TABLE public.global_items 
DROP CONSTRAINT IF EXISTS global_items_access_tier_check;

ALTER TABLE public.global_items 
ADD CONSTRAINT global_items_access_tier_check 
CHECK (access_tier IN ('free', 'premium'));

-- =====================================================
-- STEP 5: UPDATE COPY FUNCTION TO HANDLE TWO TIERS
-- =====================================================

-- Update the copy function to work with the new two-tier system
CREATE OR REPLACE FUNCTION public.copy_global_item_to_personal(
  global_item_id UUID,
  custom_cost NUMERIC DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_item_id UUID;
  global_item RECORD;
  category_name TEXT;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get global item details
  SELECT gi.* INTO global_item
  FROM public.global_items gi
  WHERE gi.id = global_item_id AND gi.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Global item not found or inactive';
  END IF;

  -- Get category name
  SELECT gc.name INTO category_name
  FROM public.global_categories gc
  WHERE gc.id = global_item.category_id;

  -- Check if user has access to this tier (simplified to two tiers)
  IF NOT (
    global_item.access_tier = 'free' OR
    (global_item.access_tier = 'premium' AND public.get_user_tier() = 'premium')
  ) THEN
    RAISE EXCEPTION 'User does not have access to this item tier: %', global_item.access_tier;
  END IF;
  
  -- Insert into personal library
  INSERT INTO public.line_items (
    user_id, 
    name, 
    unit, 
    cost, 
    category, 
    tags,
    created_at,
    updated_at
  ) VALUES (
    auth.uid(),
    global_item.name,
    global_item.unit,
    COALESCE(custom_cost, global_item.cost),
    category_name,
    global_item.tags,
    NOW(),
    NOW()
  ) RETURNING id INTO new_item_id;
  
  -- Update usage tracking
  INSERT INTO public.user_global_item_usage (
    user_id, 
    global_item_id, 
    usage_count, 
    last_used_at,
    created_at,
    updated_at
  ) VALUES (
    auth.uid(), 
    global_item_id, 
    1, 
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, global_item_id) 
  DO UPDATE SET 
    usage_count = user_global_item_usage.usage_count + 1, 
    last_used_at = NOW(),
    updated_at = NOW();
  
  RETURN new_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: UPDATE ANALYTICS VIEW
-- =====================================================

-- Recreate the analytics view (no changes needed, but refresh for consistency)
DROP VIEW IF EXISTS public.global_items_analytics;

CREATE VIEW public.global_items_analytics AS
SELECT 
  gi.id,
  gi.name,
  gc.name as category_name,
  gi.access_tier,
  COUNT(ugiu.id) as total_users,
  COUNT(ugiu.id) FILTER (WHERE ugiu.is_favorite = true) as favorite_count,
  AVG(ugiu.usage_count) as avg_usage_count,
  MAX(ugiu.last_used_at) as last_used,
  gi.created_at
FROM public.global_items gi
LEFT JOIN public.global_categories gc ON gi.category_id = gc.id
LEFT JOIN public.user_global_item_usage ugiu ON gi.id = ugiu.global_item_id
WHERE gi.is_active = true
GROUP BY gi.id, gi.name, gc.name, gi.access_tier, gi.created_at;

-- =====================================================
-- VERIFICATION AND LOGGING
-- =====================================================

-- Log the changes
DO $$
DECLARE
  free_count INTEGER;
  premium_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO free_count FROM public.global_items WHERE access_tier = 'free';
  SELECT COUNT(*) INTO premium_count FROM public.global_items WHERE access_tier = 'premium';
  SELECT COUNT(*) INTO total_count FROM public.global_items;
  
  RAISE NOTICE 'Two-tier system conversion completed successfully:';
  RAISE NOTICE '- Converted all "paid" tier items to "premium" tier';
  RAISE NOTICE '- Updated get_user_tier() function to return only free/premium';
  RAISE NOTICE '- Updated constraints to enforce two-tier system';
  RAISE NOTICE '- Current distribution:';
  RAISE NOTICE '  - Free tier: % items', free_count;
  RAISE NOTICE '  - Premium tier: % items', premium_count;
  RAISE NOTICE '  - Total items: %', total_count;
  RAISE NOTICE '- System now properly aligned: free subscription → free items, premium subscription → all items';
END $$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.get_user_tier IS 'Determines user subscription tier for access control - simplified to two tiers (free/premium)';
COMMENT ON FUNCTION public.copy_global_item_to_personal IS 'Copies a global item to user personal library - updated for two-tier system';

-- Final verification query to ensure no "paid" tier items remain
DO $$
DECLARE
  paid_items_count INTEGER;
  paid_categories_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO paid_items_count FROM public.global_items WHERE access_tier = 'paid';
  SELECT COUNT(*) INTO paid_categories_count FROM public.global_categories WHERE access_tier = 'paid';
  
  IF paid_items_count > 0 OR paid_categories_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % paid items and % paid categories still exist', paid_items_count, paid_categories_count;
  ELSE
    RAISE NOTICE 'Verification passed: No "paid" tier items or categories remain';
  END IF;
END $$;
