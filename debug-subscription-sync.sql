-- CRITICAL SUBSCRIPTION SYNC DEBUG QUERIES
-- Use these queries to investigate why paid subscriptions show as "Free Plan"

-- ==============================================
-- 1. SUBSCRIPTION RECORDS ANALYSIS
-- ==============================================

-- Check all subscription records for a specific user (replace with actual user ID)
-- SELECT 
--   id,
--   user_id,
--   status,
--   price_id,
--   stripe_subscription_id,
--   stripe_customer_id,
--   current_period_start,
--   current_period_end,
--   created,
--   metadata
-- FROM subscriptions 
-- WHERE user_id = 'USER_ID_HERE'
-- ORDER BY created DESC;

-- Count subscription types per user
SELECT 
  user_id,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 END) as paid_subscriptions,
  COUNT(CASE WHEN stripe_subscription_id IS NULL THEN 1 END) as free_subscriptions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
  COUNT(CASE WHEN status = 'trialing' THEN 1 END) as trialing_subscriptions
FROM subscriptions 
GROUP BY user_id
HAVING COUNT(*) > 1 OR COUNT(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 END) > 0
ORDER BY total_subscriptions DESC;

-- ==============================================
-- 2. CUSTOMER MAPPING VERIFICATION
-- ==============================================

-- Check customer mapping table for potential issues
SELECT 
  c.id as user_id,
  c.stripe_customer_id,
  c.email,
  u.email as user_email,
  COUNT(s.id) as subscription_count
FROM customers c
LEFT JOIN auth.users u ON c.id = u.id
LEFT JOIN subscriptions s ON s.user_id = c.id
GROUP BY c.id, c.stripe_customer_id, c.email, u.email
ORDER BY subscription_count DESC;

-- Find users with subscriptions but no customer mapping
SELECT DISTINCT 
  s.user_id,
  s.stripe_customer_id,
  COUNT(s.id) as subscriptions
FROM subscriptions s
LEFT JOIN customers c ON s.user_id = c.id
WHERE c.id IS NULL AND s.stripe_customer_id IS NOT NULL
GROUP BY s.user_id, s.stripe_customer_id;

-- ==============================================
-- 3. WEBHOOK EVENT ANALYSIS
-- ==============================================

-- Check recent webhook events (especially checkout.session.completed)
SELECT 
  stripe_event_id,
  event_type,
  processed,
  processed_at,
  error_message,
  created_at,
  data->'object'->>'id' as object_id,
  data->'object'->>'customer' as customer_id
FROM stripe_webhook_events 
WHERE event_type = 'checkout.session.completed'
ORDER BY created_at DESC
LIMIT 20;

-- Check for failed webhook processing
SELECT 
  stripe_event_id,
  event_type,
  error_message,
  created_at,
  data
FROM stripe_webhook_events 
WHERE processed = false OR error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ==============================================
-- 4. SUBSCRIPTION PRIORITY QUERY TEST
-- ==============================================

-- Test the exact query used in getSubscription() for a specific user
-- This matches the logic in src/features/account/controllers/get-subscription.ts
-- SELECT *
-- FROM subscriptions
-- WHERE user_id = 'USER_ID_HERE'
--   AND status IN ('trialing', 'active', 'past_due')
-- ORDER BY stripe_subscription_id DESC NULLS LAST, created DESC;

-- ==============================================
-- 5. PRICE AND PRODUCT DATA VALIDATION
-- ==============================================

-- Check if subscription price_ids exist in stripe_prices table
SELECT 
  s.id as subscription_id,
  s.price_id,
  s.stripe_subscription_id,
  p.stripe_price_id,
  p.recurring_interval,
  pr.name as product_name
FROM subscriptions s
LEFT JOIN stripe_prices p ON s.price_id = p.stripe_price_id
LEFT JOIN stripe_products pr ON p.stripe_product_id = pr.stripe_product_id
WHERE s.status IN ('active', 'trialing', 'past_due')
  AND s.stripe_subscription_id IS NOT NULL;

-- ==============================================
-- 6. RECENT SUBSCRIPTION ACTIVITY
-- ==============================================

-- Show recent subscription creations/updates
SELECT 
  id,
  user_id,
  status,
  price_id,
  stripe_subscription_id,
  created,
  current_period_start,
  current_period_end
FROM subscriptions 
WHERE created >= NOW() - INTERVAL '7 days'
ORDER BY created DESC;

-- ==============================================
-- 7. USER AUTHENTICATION CHECK
-- ==============================================

-- Verify users exist in auth.users table
SELECT 
  s.user_id,
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created,
  COUNT(s.id) as subscription_count
FROM subscriptions s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE s.stripe_subscription_id IS NOT NULL
GROUP BY s.user_id, u.email, u.email_confirmed_at, u.created_at
ORDER BY user_created DESC;