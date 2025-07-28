-- Test script to validate subscription database fixes
-- Run this after applying the migration to ensure everything works correctly

-- 1. Test the diagnostic view
SELECT 'Testing subscription diagnostics view' as test_name;
SELECT * FROM subscription_diagnostics LIMIT 5;

-- 2. Test free plan creation function
SELECT 'Testing free plan creation' as test_name;
DO $$
DECLARE 
  test_user_id uuid := '123e4567-e89b-12d3-a456-426614174000';
  result_id uuid;
BEGIN
  -- Clean up any existing test data
  DELETE FROM subscriptions WHERE user_id = test_user_id;
  DELETE FROM customers WHERE id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
  
  -- Create test user
  INSERT INTO users (id, full_name) VALUES (test_user_id, 'Test User');
  
  -- Test creating free plan subscription
  SELECT create_free_plan_subscription(test_user_id) INTO result_id;
  
  RAISE NOTICE 'Created free plan subscription with internal_id: %', result_id;
  
  -- Verify the subscription was created correctly
  IF EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE internal_id = result_id 
      AND user_id = test_user_id 
      AND stripe_subscription_id IS NULL 
      AND id IS NULL
      AND status = 'active'
  ) THEN
    RAISE NOTICE 'SUCCESS: Free plan subscription created correctly';
  ELSE
    RAISE EXCEPTION 'FAILED: Free plan subscription not created correctly';
  END IF;
  
  -- Clean up test data
  DELETE FROM subscriptions WHERE user_id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
END;
$$;

-- 3. Test subscription upgrade function
SELECT 'Testing subscription upgrade' as test_name;
DO $$
DECLARE 
  test_user_id uuid := '123e4567-e89b-12d3-a456-426614174001';
  free_id uuid;
  paid_id uuid;
  stripe_sub_id text := 'sub_test123';
  stripe_customer_id text := 'cus_test123';
  test_price_id text;
BEGIN
  -- Clean up any existing test data
  DELETE FROM subscriptions WHERE user_id = test_user_id;
  DELETE FROM customers WHERE id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
  
  -- Create test user
  INSERT INTO users (id, full_name) VALUES (test_user_id, 'Test User 2');
  
  -- Get a valid price_id for testing (or create one if none exists)
  SELECT id INTO test_price_id FROM prices WHERE active = true LIMIT 1;
  
  IF test_price_id IS NULL THEN
    -- Create a test price if none exists
    INSERT INTO products (id, active, name, description) 
    VALUES ('prod_test', true, 'Test Product', 'Test product for migration testing');
    
    INSERT INTO prices (id, product_id, active, currency, unit_amount) 
    VALUES ('price_test', 'prod_test', true, 'usd', 999);
    
    test_price_id := 'price_test';
  END IF;
  
  -- First create a free plan
  SELECT create_free_plan_subscription(test_user_id, test_price_id) INTO free_id;
  RAISE NOTICE 'Created free plan with internal_id: %', free_id;
  
  -- Then upgrade to paid
  SELECT upgrade_subscription_to_paid(
    test_user_id, 
    stripe_sub_id, 
    stripe_customer_id, 
    test_price_id
  ) INTO paid_id;
  
  RAISE NOTICE 'Upgraded to paid plan with internal_id: %', paid_id;
  
  -- Verify the upgrade worked correctly
  IF EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE internal_id = paid_id 
      AND user_id = test_user_id 
      AND stripe_subscription_id = stripe_sub_id 
      AND id = stripe_sub_id
      AND status = 'active'
  ) THEN
    RAISE NOTICE 'SUCCESS: Subscription upgrade created correctly';
  ELSE
    RAISE EXCEPTION 'FAILED: Subscription upgrade not created correctly';
  END IF;
  
  -- Verify the free subscription was canceled
  IF EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE internal_id = free_id 
      AND status = 'canceled'
  ) THEN
    RAISE NOTICE 'SUCCESS: Free subscription was properly canceled';
  ELSE
    RAISE EXCEPTION 'FAILED: Free subscription was not canceled';
  END IF;
  
  -- Clean up test data
  DELETE FROM subscriptions WHERE user_id = test_user_id;
  DELETE FROM customers WHERE id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
  DELETE FROM prices WHERE id = 'price_test';
  DELETE FROM products WHERE id = 'prod_test';
END;
$$;

-- 4. Test constraint validations
SELECT 'Testing constraint validations' as test_name;
DO $$
DECLARE 
  test_user_id uuid := '123e4567-e89b-12d3-a456-426614174002';
  test_internal_id uuid := gen_random_uuid();
BEGIN
  -- Clean up any existing test data
  DELETE FROM subscriptions WHERE user_id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
  
  -- Create test user
  INSERT INTO users (id, full_name) VALUES (test_user_id, 'Test User 3');
  
  -- Test 1: Valid free plan (no stripe IDs)
  BEGIN
    INSERT INTO subscriptions (
      internal_id, user_id, status, stripe_subscription_id, id
    ) VALUES (
      test_internal_id, test_user_id, 'active', NULL, NULL
    );
    RAISE NOTICE 'SUCCESS: Valid free plan constraint passed';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'FAILED: Valid free plan rejected by constraint: %', SQLERRM;
  END;
  
  DELETE FROM subscriptions WHERE internal_id = test_internal_id;
  
  -- Test 2: Valid paid plan (matching stripe IDs)
  BEGIN
    INSERT INTO subscriptions (
      internal_id, user_id, status, stripe_subscription_id, id
    ) VALUES (
      test_internal_id, test_user_id, 'active', 'sub_test123', 'sub_test123'
    );
    RAISE NOTICE 'SUCCESS: Valid paid plan constraint passed';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'FAILED: Valid paid plan rejected by constraint: %', SQLERRM;
  END;
  
  DELETE FROM subscriptions WHERE internal_id = test_internal_id;
  
  -- Test 3: Invalid case (mismatched stripe IDs) - should fail
  BEGIN
    INSERT INTO subscriptions (
      internal_id, user_id, status, stripe_subscription_id, id
    ) VALUES (
      test_internal_id, test_user_id, 'active', 'sub_test123', 'sub_different456'
    );
    RAISE EXCEPTION 'FAILED: Invalid constraint should have been rejected';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'SUCCESS: Invalid mismatched IDs properly rejected by constraint';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'FAILED: Unexpected error testing invalid constraint: %', SQLERRM;
  END;
  
  -- Clean up test data
  DELETE FROM subscriptions WHERE user_id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
END;
$$;

-- 5. Test RLS policies (requires different users/roles)
SELECT 'Testing RLS policies' as test_name;
SELECT 'RLS policies must be tested with different authenticated users - see application tests' as note;

-- 6. Test performance with indexes
SELECT 'Testing query performance' as test_name;
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM subscriptions 
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000' 
  AND status IN ('active', 'trialing', 'past_due');

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM subscriptions 
WHERE stripe_customer_id = 'cus_test123' 
  AND status = 'active';

-- 7. Test the subscription_details view
SELECT 'Testing subscription_details view' as test_name;
SELECT 
  user_id,
  subscription_type,
  data_validity,
  product_name,
  price_amount
FROM subscription_details 
LIMIT 5;

-- 8. Summary
SELECT 'Migration validation complete' as test_name;
SELECT 
  'Check the output above for any FAILED messages' as instruction,
  'All tests should show SUCCESS messages' as expected_result;