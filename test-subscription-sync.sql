-- COMPREHENSIVE SUBSCRIPTION SYNC TEST SCRIPT
-- Run these queries after implementing the RLS fix to validate sync functionality

-- ==============================================
-- 1. TEST RLS POLICIES
-- ==============================================

-- Test 1: Verify service role can access subscriptions table
-- (Run this as service role)
-- SELECT COUNT(*) FROM public.subscriptions;

-- Test 2: Verify users can see only their own subscriptions  
-- (Run this as authenticated user)
-- SELECT * FROM public.subscriptions WHERE user_id = auth.uid();

-- ==============================================
-- 2. VALIDATE WEBHOOK EVENT PROCESSING
-- ==============================================

-- Check recent webhook events and their processing status
SELECT 
  stripe_event_id,
  event_type,
  processed,
  processed_at,
  error_message,
  created_at,
  data->'object'->>'id' as session_or_subscription_id,
  data->'object'->>'customer' as customer_id,
  data->'object'->>'status' as object_status
FROM stripe_webhook_events 
WHERE event_type IN ('checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated')
ORDER BY created_at DESC
LIMIT 10;

-- Find failed webhook events that need investigation
SELECT 
  stripe_event_id,
  event_type,
  error_message,
  created_at,
  data
FROM stripe_webhook_events 
WHERE processed = false OR error_message IS NOT NULL
ORDER BY created_at DESC;

-- ==============================================
-- 3. SUBSCRIPTION DATA INTEGRITY CHECKS
-- ==============================================

-- Check for users with multiple active subscriptions (should be cleaned up)
SELECT 
  user_id,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 END) as paid_subscriptions,
  COUNT(CASE WHEN stripe_subscription_id IS NULL THEN 1 END) as free_subscriptions,
  array_agg(status ORDER BY created DESC) as statuses,
  array_agg(stripe_subscription_id ORDER BY created DESC) as stripe_ids
FROM subscriptions 
WHERE status IN ('active', 'trialing', 'past_due')
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Check for orphaned subscriptions (no customer mapping)
SELECT 
  s.id,
  s.user_id,
  s.stripe_customer_id,
  s.status,
  c.stripe_customer_id as mapped_customer_id
FROM subscriptions s
LEFT JOIN customers c ON s.user_id = c.id
WHERE s.stripe_subscription_id IS NOT NULL 
  AND c.id IS NULL;

-- ==============================================
-- 4. TEST GETSUBSCRIPTION LOGIC
-- ==============================================

-- Test the exact query logic from getSubscription() 
-- Replace 'USER_ID_HERE' with actual user ID from test case
/*
SELECT 
  id,
  user_id,
  status,
  price_id,
  stripe_subscription_id,
  stripe_customer_id,
  created,
  current_period_start,
  current_period_end,
  CASE WHEN stripe_subscription_id IS NOT NULL THEN 'paid' ELSE 'free' END as subscription_type
FROM subscriptions 
WHERE user_id = 'USER_ID_HERE'
  AND status IN ('trialing', 'active', 'past_due')
ORDER BY stripe_subscription_id DESC NULLS LAST, created DESC;
*/

-- ==============================================
-- 5. CUSTOMER MAPPING VALIDATION
-- ==============================================

-- Check for customers without proper auth.users mapping
SELECT 
  c.id as user_id,
  c.stripe_customer_id,
  c.email as customer_email,
  u.email as auth_email,
  u.created_at as user_created,
  c.created_at as customer_created
FROM customers c
LEFT JOIN auth.users u ON c.id = u.id
WHERE u.id IS NULL;

-- Check for auth users without customer mapping who have subscriptions
SELECT 
  u.id as user_id,
  u.email,
  COUNT(s.id) as subscription_count,
  array_agg(s.stripe_customer_id) as stripe_customer_ids
FROM auth.users u
LEFT JOIN customers c ON u.id = c.id
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE c.id IS NULL 
  AND s.id IS NOT NULL
GROUP BY u.id, u.email;

-- ==============================================
-- 6. PRICING DATA VALIDATION
-- ==============================================

-- Check for subscriptions with missing price data
SELECT 
  s.id as subscription_id,
  s.price_id,
  s.stripe_subscription_id,
  sp.stripe_price_id,
  sp.unit_amount,
  sp.currency,
  sp.recurring_interval,
  spr.name as product_name
FROM subscriptions s
LEFT JOIN stripe_prices sp ON s.price_id = sp.stripe_price_id
LEFT JOIN stripe_products spr ON sp.stripe_product_id = spr.stripe_product_id
WHERE s.status IN ('active', 'trialing', 'past_due')
  AND s.stripe_subscription_id IS NOT NULL
  AND sp.stripe_price_id IS NULL;

-- ==============================================
-- 7. RECENT SUBSCRIPTION ACTIVITY
-- ==============================================

-- Show recent subscription changes with full context
SELECT 
  s.id,
  s.user_id,
  u.email,
  s.status,
  s.price_id,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.created,
  s.current_period_start,
  s.current_period_end,
  sp.unit_amount,
  sp.currency,
  sp.recurring_interval,
  spr.name as product_name,
  CASE WHEN s.stripe_subscription_id IS NOT NULL THEN 'paid' ELSE 'free' END as subscription_type
FROM subscriptions s
LEFT JOIN auth.users u ON s.user_id = u.id
LEFT JOIN stripe_prices sp ON s.price_id = sp.stripe_price_id
LEFT JOIN stripe_products spr ON sp.stripe_product_id = spr.stripe_product_id
WHERE s.created >= NOW() - INTERVAL '24 hours'
ORDER BY s.created DESC;

-- ==============================================
-- 8. PERFORMANCE ANALYSIS
-- ==============================================

-- Check index usage for subscription queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * 
FROM subscriptions 
WHERE user_id = 'test-user-id'
  AND status IN ('trialing', 'active', 'past_due')
ORDER BY stripe_subscription_id DESC NULLS LAST, created DESC
LIMIT 1;

-- ==============================================
-- 9. MANUAL SYNC TEST QUERIES
-- ==============================================

-- Get customers that might need manual sync
SELECT 
  c.id as user_id,
  c.stripe_customer_id,
  c.email,
  COUNT(s.id) as db_subscriptions,
  MAX(s.created) as last_subscription_sync
FROM customers c
LEFT JOIN subscriptions s ON c.id = s.user_id AND s.stripe_subscription_id IS NOT NULL
WHERE c.stripe_customer_id IS NOT NULL
GROUP BY c.id, c.stripe_customer_id, c.email
ORDER BY last_subscription_sync ASC NULLS FIRST;

-- ==============================================
-- 10. SUCCESS METRICS
-- ==============================================

-- Overall subscription sync health metrics
SELECT 
  'Total Users' as metric,
  COUNT(DISTINCT u.id) as count
FROM auth.users u
UNION ALL
SELECT 
  'Users with Customer Mapping' as metric,
  COUNT(DISTINCT c.id) as count
FROM customers c
UNION ALL
SELECT 
  'Users with Active Subscriptions' as metric,
  COUNT(DISTINCT s.user_id) as count
FROM subscriptions s
WHERE s.status IN ('active', 'trialing', 'past_due')
UNION ALL
SELECT 
  'Users with Paid Subscriptions' as metric,
  COUNT(DISTINCT s.user_id) as count
FROM subscriptions s
WHERE s.status IN ('active', 'trialing', 'past_due')
  AND s.stripe_subscription_id IS NOT NULL
UNION ALL
SELECT 
  'Successful Webhooks (Last 24h)' as metric,
  COUNT(*) as count
FROM stripe_webhook_events
WHERE processed = true 
  AND created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'Failed Webhooks (Last 24h)' as metric,
  COUNT(*) as count
FROM stripe_webhook_events
WHERE processed = false 
  AND created_at >= NOW() - INTERVAL '24 hours';