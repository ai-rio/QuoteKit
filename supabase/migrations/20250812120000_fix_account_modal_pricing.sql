-- =====================================================
-- FIX ACCOUNT MODAL PRICING - Update from $29 to correct pricing
-- =====================================================
-- This migration fixes the account page upgrade modal showing $29 USD plans
-- instead of the correct $12 monthly and $115.20 annual pricing
-- 
-- Generated: 2025-08-12T12:00:00.000Z
-- Issue: Account page upgrade modal showing old $29 pricing instead of $12/$115.20

-- Step 1: Insert the correct price records with proper IDs
-- Free plan with correct price ID
INSERT INTO public.stripe_prices (
  id,
  stripe_product_id,
  unit_amount,
  currency,
  type,
  interval,
  interval_count,
  active,
  metadata,
  created_at,
  updated_at
) VALUES (
  'price_1RriYWGgBK1ooXYFFHN7Jgsq', -- Free price ID from constants
  'prod_free_plan',
  0, -- Free
  'usd',
  'recurring',
  'month',
  1,
  true,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  unit_amount = EXCLUDED.unit_amount,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Premium monthly plan with correct price ID
INSERT INTO public.stripe_prices (
  id,
  stripe_product_id,
  unit_amount,
  currency,
  type,
  interval,
  interval_count,
  active,
  metadata,
  created_at,
  updated_at
) VALUES (
  'price_1RvGIjGgBK1ooXYF4LHswUuU', -- Monthly price ID from constants
  'prod_premium_plan',
  1200, -- $12.00 in cents
  'usd',
  'recurring',
  'month',
  1,
  true,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  unit_amount = EXCLUDED.unit_amount,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Premium annual plan with correct price ID
INSERT INTO public.stripe_prices (
  id,
  stripe_product_id,
  unit_amount,
  currency,
  type,
  interval,
  interval_count,
  active,
  metadata,
  created_at,
  updated_at
) VALUES (
  'price_1RvGIkGgBK1ooXYFEwnMclJR', -- Annual price ID from constants
  'prod_premium_plan',
  11520, -- $115.20 in cents (12 * 12 * 0.8 = $115.20)
  'usd',
  'recurring',
  'year',
  1,
  true,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  unit_amount = EXCLUDED.unit_amount,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Step 2: Update any existing subscriptions to use the correct price IDs
-- Get current old price IDs that need to be updated
DO $$
DECLARE
    old_free_price_id text;
    old_premium_price_id text;
BEGIN
    -- Find the old free plan price ID
    SELECT id INTO old_free_price_id
    FROM public.stripe_prices 
    WHERE stripe_product_id = 'prod_free_plan' 
    AND unit_amount = 0 
    AND id != 'price_1RriYWGgBK1ooXYFFHN7Jgsq'
    LIMIT 1;
    
    -- Find the old premium plan price ID (could be $29 or local dev IDs)
    SELECT id INTO old_premium_price_id  
    FROM public.stripe_prices 
    WHERE stripe_product_id = 'prod_premium_plan'
    AND interval = 'month'
    AND id != 'price_1RvGIjGgBK1ooXYF4LHswUuU'
    AND (unit_amount = 2900 OR id LIKE 'price_premium_plan%')
    LIMIT 1;
    
    -- Update subscriptions to use correct free plan price ID
    IF old_free_price_id IS NOT NULL THEN
        UPDATE public.subscriptions 
        SET stripe_price_id = 'price_1RriYWGgBK1ooXYFFHN7Jgsq',
            updated_at = NOW()
        WHERE stripe_price_id = old_free_price_id;
        
        RAISE NOTICE 'Updated subscriptions from old free price % to %', old_free_price_id, 'price_1RriYWGgBK1ooXYFFHN7Jgsq';
    END IF;
    
    -- Update subscriptions to use correct premium plan price ID
    IF old_premium_price_id IS NOT NULL THEN
        UPDATE public.subscriptions 
        SET stripe_price_id = 'price_1RvGIjGgBK1ooXYF4LHswUuU',
            updated_at = NOW()
        WHERE stripe_price_id = old_premium_price_id;
        
        RAISE NOTICE 'Updated subscriptions from old premium price % to %', old_premium_price_id, 'price_1RvGIjGgBK1ooXYF4LHswUuU';
    END IF;
    
    -- Also handle any subscriptions with common local dev price IDs
    UPDATE public.subscriptions 
    SET stripe_price_id = 'price_1RriYWGgBK1ooXYFFHN7Jgsq',
        updated_at = NOW()
    WHERE stripe_price_id = 'price_free_plan';
    
    UPDATE public.subscriptions 
    SET stripe_price_id = 'price_1RvGIjGgBK1ooXYF4LHswUuU',
        updated_at = NOW()
    WHERE stripe_price_id = 'price_premium_plan';
    
END $$;

-- Step 3: Deactivate old pricing records now that subscriptions are updated
UPDATE public.stripe_prices 
SET active = false, 
    updated_at = NOW()
WHERE (unit_amount = 2900 OR id LIKE 'price_premium_plan%' OR id LIKE 'price_free_plan%')
AND id NOT IN ('price_1RvGIjGgBK1ooXYF4LHswUuU', 'price_1RvGIkGgBK1ooXYFEwnMclJR', 'price_1RriYWGgBK1ooXYFFHN7Jgsq');

-- Step 4: Clean up old price records after a delay (optional - commented out for safety)
-- DELETE FROM public.stripe_prices 
-- WHERE active = false 
-- AND (unit_amount = 2900 OR id LIKE 'price_premium_plan%' OR id LIKE 'price_free_plan%')
-- AND id NOT IN ('price_1RvGIjGgBK1ooXYF4LHswUuU', 'price_1RvGIkGgBK1ooXYFEwnMclJR', 'price_1RriYWGgBK1ooXYFFHN7Jgsq');

-- Verify the pricing fix
DO $$
DECLARE
    monthly_price_count INTEGER;
    annual_price_count INTEGER;
    free_price_count INTEGER;
    monthly_amount INTEGER;
    annual_amount INTEGER;
BEGIN
    -- Check monthly price
    SELECT COUNT(*), MAX(unit_amount) INTO monthly_price_count, monthly_amount
    FROM public.stripe_prices 
    WHERE stripe_product_id = 'prod_premium_plan' 
    AND interval = 'month' 
    AND active = true;
    
    -- Check annual price  
    SELECT COUNT(*), MAX(unit_amount) INTO annual_price_count, annual_amount
    FROM public.stripe_prices 
    WHERE stripe_product_id = 'prod_premium_plan' 
    AND interval = 'year' 
    AND active = true;
    
    -- Check free price
    SELECT COUNT(*) INTO free_price_count
    FROM public.stripe_prices 
    WHERE stripe_product_id = 'prod_free_plan' 
    AND unit_amount = 0 
    AND active = true;
    
    RAISE NOTICE 'Pricing fix verification:';
    RAISE NOTICE '- Monthly plan: % records found, price: $%.2f', monthly_price_count, monthly_amount::decimal / 100;
    RAISE NOTICE '- Annual plan: % records found, price: $%.2f', annual_price_count, annual_amount::decimal / 100;
    RAISE NOTICE '- Free plan: % records found', free_price_count;
    
    -- Verify correct amounts
    IF monthly_amount != 1200 THEN
        RAISE WARNING 'Monthly price should be $12.00 (1200 cents), but found $%.2f', monthly_amount::decimal / 100;
    END IF;
    
    IF annual_amount != 11520 THEN
        RAISE WARNING 'Annual price should be $115.20 (11520 cents), but found $%.2f', annual_amount::decimal / 100;
    END IF;
    
    IF monthly_price_count = 1 AND annual_price_count = 1 AND free_price_count = 1 
       AND monthly_amount = 1200 AND annual_amount = 11520 THEN
        RAISE NOTICE '✅ Account modal pricing fix completed successfully!';
        RAISE NOTICE '✅ The upgrade modal will now show:';
        RAISE NOTICE '   - Free Plan: $0.00/month';  
        RAISE NOTICE '   - Premium Monthly: $12.00/month';
        RAISE NOTICE '   - Premium Annual: $115.20/year ($9.60/month)';
    ELSE
        RAISE WARNING '❌ Pricing fix may not have completed correctly. Please check the database manually.';
    END IF;
END $$;