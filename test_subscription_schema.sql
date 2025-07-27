-- Test script to verify the subscription schema fixes
-- Run this after applying the migration to ensure everything works correctly

-- 1. Test free plan subscription insertion (simulates the fixed checkout action)
BEGIN;

-- Create a test user first (if not exists)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com', 
  NOW(), 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test User'
) ON CONFLICT (id) DO NOTHING;

-- Create a test free price (if not exists) 
INSERT INTO public.prices (id, product_id, active, unit_amount, currency, type)
VALUES (
  'price_free_test',
  'prod_test', 
  true,
  0,
  'usd',
  'recurring'
) ON CONFLICT (id) DO NOTHING;

-- Test inserting a free subscription (this should work now)
INSERT INTO public.subscriptions (
  user_id,
  status,
  price_id,
  stripe_subscription_id,
  stripe_customer_id,
  current_period_start,
  current_period_end,
  created,
  trial_start,
  trial_end,
  cancel_at,
  cancel_at_period_end,
  canceled_at,
  ended_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'active',
  'price_free_test',
  NULL, -- This should work now
  NULL, -- This should work now  
  NOW(),
  NULL,
  NOW(),
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  NULL
);

-- Verify the insertion worked and internal_id was generated
SELECT 
  internal_id,
  id,
  stripe_subscription_id,
  stripe_customer_id,
  user_id,
  status,
  price_id
FROM public.subscriptions 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Test the new view
SELECT * FROM subscription_details 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Test the helper function
SELECT * FROM get_user_active_subscription('00000000-0000-0000-0000-000000000001');

ROLLBACK; -- Don't actually insert test data

-- 2. Test paid plan subscription insertion (simulates webhook handler)
BEGIN;

-- Simulate what would happen when a paid subscription is created via Stripe
INSERT INTO public.subscriptions (
  id, -- Stripe subscription ID  
  user_id,
  status,
  price_id,
  stripe_subscription_id, -- Same as id for paid plans
  stripe_customer_id,
  current_period_start,
  current_period_end,
  created
) VALUES (
  'sub_stripe_test_123',
  '00000000-0000-0000-0000-000000000001',
  'active',
  'price_paid_test',
  'sub_stripe_test_123',
  'cus_stripe_test_123',
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW()
);

-- Verify the paid subscription
SELECT 
  internal_id,
  id,
  stripe_subscription_id,
  stripe_customer_id,
  subscription_type
FROM subscription_details 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

ROLLBACK;

-- 3. Test constraint validation
BEGIN;

-- This should fail due to the constraint (partial stripe data)
INSERT INTO public.subscriptions (
  user_id,
  status,
  price_id,
  stripe_subscription_id, -- Has this but not stripe_customer_id
  current_period_start,
  created
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'active',
  'price_test',
  'sub_partial',
  NOW(),
  NOW()
);

ROLLBACK;

COMMIT;