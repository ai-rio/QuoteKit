-- =====================================================
-- SETUP BASIC PRODUCTS AND PRICES FOR LOCAL DEVELOPMENT
-- =====================================================
-- This migration ensures that basic products and prices exist for local development
-- This prevents the "Unable to load subscription or free plan information" error

-- Insert Free Plan product
INSERT INTO public.stripe_products (
  id,
  name,
  description,
  active,
  metadata,
  created_at,
  updated_at
) VALUES (
  'prod_free_plan',
  'Free Plan',
  'Basic features for getting started',
  true,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Insert Premium Plan product
INSERT INTO public.stripe_products (
  id,
  name,
  description,
  active,
  metadata,
  created_at,
  updated_at
) VALUES (
  'prod_premium_plan',
  'Premium Plan',
  'Advanced features for growing businesses',
  true,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Insert Free Plan price
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
  'price_free_plan',
  'prod_free_plan',
  0,
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
  currency = EXCLUDED.currency,
  type = EXCLUDED.type,
  interval = EXCLUDED.interval,
  interval_count = EXCLUDED.interval_count,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Insert Premium Plan price
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
  'price_premium_plan',
  'prod_premium_plan',
  2900,
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
  currency = EXCLUDED.currency,
  type = EXCLUDED.type,
  interval = EXCLUDED.interval,
  interval_count = EXCLUDED.interval_count,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Function to create free subscription for any user who doesn't have one
CREATE OR REPLACE FUNCTION ensure_user_has_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has an active subscription
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = NEW.id 
    AND status IN ('active', 'trialing', 'past_due')
  ) THEN
    -- Create a free subscription for the new user
    -- NOTE: Don't set stripe_subscription_id for free subscriptions to ensure proper plan change flow
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
      'sub_free_' || NEW.id,
      NEW.id,
      'active',
      'price_free_plan',
      1,
      false,
      NOW(),
      NOW(),
      NOW() + INTERVAL '30 days',
      '{}'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create free subscriptions for new users
DROP TRIGGER IF EXISTS ensure_user_subscription_trigger ON public.users;
CREATE TRIGGER ensure_user_subscription_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_has_subscription();

-- Ensure existing users have subscriptions (run once)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM public.users 
    WHERE NOT EXISTS (
      SELECT 1 FROM public.subscriptions 
      WHERE user_id = public.users.id 
      AND status IN ('active', 'trialing', 'past_due')
    )
  LOOP
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
      'sub_free_' || user_record.id,
      user_record.id,
      'active',
      'price_free_plan',
      1,
      false,
      NOW(),
      NOW(),
      NOW() + INTERVAL '30 days',
      '{}'
    );
  END LOOP;
END $$;

-- Fix existing subscriptions that have invalid stripe_subscription_id values
-- Free subscriptions should not have stripe_subscription_id set
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  UPDATE public.subscriptions 
  SET stripe_subscription_id = NULL
  WHERE stripe_subscription_id IS NOT NULL 
  AND (
    stripe_subscription_id LIKE 'sub_free_%' OR
    stripe_subscription_id LIKE 'sub_admin_%' OR
    stripe_subscription_id LIKE 'sub_dev_%'
  );
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % existing subscriptions with invalid stripe_subscription_id', fixed_count;
END $$;

-- Log the setup
DO $$
BEGIN
  RAISE NOTICE 'Basic products and prices setup completed:';
  RAISE NOTICE '- Free Plan product and price created';
  RAISE NOTICE '- Premium Plan product and price created';
  RAISE NOTICE '- Automatic free subscription trigger enabled';
  RAISE NOTICE '- Existing users without subscriptions have been given free subscriptions';
END $$;
