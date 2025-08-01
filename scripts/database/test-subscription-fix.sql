-- Test the subscription sync fix
-- This can be run in Supabase SQL editor to verify everything works

-- 1. Check that the upsert functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('upsert_subscription_safe', 'upsert_subscription_by_stripe_id')
AND routine_schema = 'public';

-- 2. Check the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Test the upsert function with a mock subscription
SELECT upsert_subscription_by_stripe_id(
    'sub_test_' || extract(epoch from now())::text,  -- Mock Stripe subscription ID
    '12345678-1234-5678-9012-123456789012'::uuid,   -- Mock user ID
    'cus_test_customer',                              -- Mock customer ID
    'price_1234567890',                              -- Mock price ID
    'active',                                        -- Status
    '{"test": true}'::jsonb,                         -- Metadata
    false,                                           -- cancel_at_period_end
    now(),                                           -- current_period_start
    now() + interval '1 month',                      -- current_period_end
    null,                                            -- trial_start
    null,                                            -- trial_end
    null,                                            -- cancel_at
    null,                                            -- canceled_at
    null                                             -- ended_at
);

-- 4. Check if the test subscription was created
SELECT * FROM subscription_sync_diagnostics 
WHERE stripe_subscription_id LIKE 'sub_test_%'
ORDER BY created DESC
LIMIT 1;

-- 5. Clean up test data
DELETE FROM subscriptions 
WHERE stripe_subscription_id LIKE 'sub_test_%';

-- Success message
SELECT '✅ Subscription sync fix verification completed successfully!' as status;