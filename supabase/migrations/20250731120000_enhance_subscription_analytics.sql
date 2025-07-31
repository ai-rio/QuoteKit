-- ============================================================================
-- SUBSCRIPTION ANALYTICS ENHANCEMENTS
-- ============================================================================
-- Adds business intelligence views and helper functions for subscription management
-- This migration is safe and focused on read-only analytics improvements

-- Create comprehensive subscription analytics view
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
  s.id as subscription_id,
  s.user_id,
  u.full_name as user_name,
  s.status,
  p.name as product_name,
  pr.unit_amount,
  pr.currency,
  pr.interval as billing_interval,
  s.current_period_start,
  s.current_period_end,
  s.trial_start,
  s.trial_end,
  s.canceled_at,
  
  -- Computed metrics
  CASE 
    WHEN s.status IN ('active', 'trialing') THEN true
    ELSE false
  END as is_active,
  
  CASE 
    WHEN s.trial_start IS NOT NULL AND s.trial_end > now() THEN true
    ELSE false
  END as is_trialing,
  
  -- Age calculations
  EXTRACT(days FROM (now() - s.created)) as subscription_age_days,
  
  -- Financial metrics (basic MRR calculation)
  CASE 
    WHEN pr.interval = 'month' THEN pr.unit_amount
    WHEN pr.interval = 'year' THEN pr.unit_amount / 12
    ELSE 0
  END as monthly_revenue_cents,
  
  s.created as created_at,
  s.metadata
FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN prices pr ON s.price_id = pr.id
JOIN products p ON pr.product_id = p.id;

-- Grant access to the view
GRANT SELECT ON subscription_analytics TO authenticated, service_role;

-- Helper function to get user's active subscription details
CREATE OR REPLACE FUNCTION get_user_subscription_details_v2(p_user_id uuid)
RETURNS TABLE (
  subscription_id text,
  product_name text,
  status text,
  current_period_end timestamptz,
  is_trialing boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    s.id,
    p.name,
    s.status::text,
    s.current_period_end,
    CASE WHEN s.trial_end > now() THEN true ELSE false END
  FROM subscriptions s
  JOIN prices pr ON s.price_id = pr.id
  JOIN products p ON pr.product_id = p.id
  WHERE s.user_id = p_user_id 
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created DESC
  LIMIT 1;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION get_user_subscription_details_v2(uuid) TO authenticated, service_role;

-- Add helpful indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_created ON subscriptions(status, created);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON subscriptions(trial_end) WHERE trial_end IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ SUBSCRIPTION ANALYTICS ENHANCEMENTS COMPLETED!';
    RAISE NOTICE 'Added:';
    RAISE NOTICE '  • subscription_analytics view for business intelligence';
    RAISE NOTICE '  • get_user_subscription_details_v2() helper function';
    RAISE NOTICE '  • Performance indexes for analytics queries';
END $$;