-- ============================================================================
-- CLEAN SUBSCRIPTION SCHEMA v2.0
-- ============================================================================
-- This is a complete redesign of the subscription system with:
-- - Clear naming conventions
-- - Minimal, focused tables
-- - Proper foreign key relationships
-- - Stripe-first design approach
-- - Zero technical debt
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE (Minimal Core User Data)
-- ============================================================================
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: Users can only see/update their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid() = id);

-- ============================================================================
-- 2. STRIPE_CUSTOMERS TABLE (User <-> Stripe Customer Mapping)
-- ============================================================================
CREATE TABLE stripe_customers (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: Users can only see their own customer record
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_customers_own_data" ON stripe_customers
  FOR ALL USING (auth.uid() = user_id);

-- Service role needs full access for webhooks
CREATE POLICY "stripe_customers_service_access" ON stripe_customers
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- 3. STRIPE_PRODUCTS TABLE (Product Catalog)
-- ============================================================================
CREATE TABLE stripe_products (
  stripe_product_id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: Public read access
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_products_public_read" ON stripe_products
  FOR SELECT USING (active = true);

-- Service role needs full access for webhooks
CREATE POLICY "stripe_products_service_access" ON stripe_products
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- 4. STRIPE_PRICES TABLE (Pricing Information)
-- ============================================================================
CREATE TABLE stripe_prices (
  stripe_price_id text PRIMARY KEY,
  stripe_product_id text NOT NULL REFERENCES stripe_products(stripe_product_id) ON DELETE CASCADE,
  unit_amount integer, -- null for free prices
  currency text DEFAULT 'usd' NOT NULL,
  recurring_interval text, -- 'month', 'year', null for one-time
  recurring_interval_count integer DEFAULT 1,
  active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_currency CHECK (length(currency) = 3),
  CONSTRAINT valid_recurring_interval CHECK (
    recurring_interval IS NULL OR 
    recurring_interval IN ('day', 'week', 'month', 'year')
  ),
  CONSTRAINT valid_unit_amount CHECK (unit_amount IS NULL OR unit_amount >= 0)
);

-- RLS: Public read access for active prices
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_prices_public_read" ON stripe_prices
  FOR SELECT USING (active = true);

-- Service role needs full access for webhooks
CREATE POLICY "stripe_prices_service_access" ON stripe_prices
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- 5. SUBSCRIPTIONS TABLE (Core Subscription Data)
-- ============================================================================
CREATE TYPE subscription_status AS ENUM (
  'incomplete',
  'incomplete_expired', 
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE, -- null for free plans
  stripe_customer_id text REFERENCES stripe_customers(stripe_customer_id) ON DELETE SET NULL,
  stripe_price_id text NOT NULL REFERENCES stripe_prices(stripe_price_id) ON DELETE RESTRICT,
  
  -- Subscription state
  status subscription_status DEFAULT 'active' NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  
  -- Billing periods (required for all subscriptions)
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  
  -- Cancellation info
  cancel_at_period_end boolean DEFAULT false NOT NULL,
  cancel_at timestamptz,
  canceled_at timestamptz,
  ended_at timestamptz,
  
  -- Trial info
  trial_start timestamptz,
  trial_end timestamptz,
  
  -- Metadata and timestamps
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT valid_period CHECK (current_period_end > current_period_start),
  CONSTRAINT free_plan_rules CHECK (
    -- Free plans: no stripe_subscription_id, customer optional
    (stripe_subscription_id IS NULL) OR
    -- Paid plans: must have stripe_subscription_id and customer
    (stripe_subscription_id IS NOT NULL AND stripe_customer_id IS NOT NULL)
  )
);

-- RLS: Users can only see their own subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own_data" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Service role needs full access for webhooks
CREATE POLICY "subscriptions_service_access" ON subscriptions
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- 6. WEBHOOK_EVENTS TABLE (Idempotency and Debugging)
-- ============================================================================
CREATE TABLE webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0 NOT NULL,
  event_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: Service role only
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_events_service_only" ON webhook_events
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);

-- Stripe Customers
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_stripe_customers_email ON stripe_customers(email);

-- Stripe Products
CREATE INDEX idx_stripe_products_active ON stripe_products(active);

-- Stripe Prices
CREATE INDEX idx_stripe_prices_product ON stripe_prices(stripe_product_id);
CREATE INDEX idx_stripe_prices_active ON stripe_prices(active);
CREATE INDEX idx_stripe_prices_amount ON stripe_prices(unit_amount);

-- Subscriptions (most important for performance)
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_price ON subscriptions(stripe_price_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, status) 
  WHERE status IN ('active', 'trialing');

-- Webhooks
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed_at);
CREATE INDEX idx_webhook_events_unprocessed ON webhook_events(created_at) 
  WHERE processed_at IS NULL;

-- ============================================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_products_updated_at BEFORE UPDATE ON stripe_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_prices_updated_at BEFORE UPDATE ON stripe_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Get user's active subscription
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id uuid)
RETURNS TABLE (
  subscription_id uuid,
  stripe_subscription_id text,
  stripe_price_id text,
  product_name text,
  unit_amount integer,
  currency text,
  status subscription_status,
  current_period_end timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    s.id,
    s.stripe_subscription_id,
    s.stripe_price_id,
    p.name,
    pr.unit_amount,
    pr.currency,
    s.status,
    s.current_period_end
  FROM subscriptions s
  JOIN stripe_prices pr ON s.stripe_price_id = pr.stripe_price_id
  JOIN stripe_products p ON pr.stripe_product_id = p.stripe_product_id
  WHERE s.user_id = p_user_id 
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

-- Create or update subscription (webhook helper)
CREATE OR REPLACE FUNCTION upsert_subscription(
  p_user_id uuid,
  p_stripe_subscription_id text,
  p_stripe_customer_id text,
  p_stripe_price_id text,
  p_status subscription_status,
  p_quantity integer,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_cancel_at timestamptz,
  p_canceled_at timestamptz,
  p_ended_at timestamptz,
  p_trial_start timestamptz,
  p_trial_end timestamptz,
  p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id uuid;
BEGIN
  INSERT INTO subscriptions (
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    stripe_price_id,
    status,
    quantity,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    cancel_at,
    canceled_at,
    ended_at,
    trial_start,
    trial_end,
    metadata
  ) VALUES (
    p_user_id,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_stripe_price_id,
    p_status,
    p_quantity,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_cancel_at,
    p_canceled_at,
    p_ended_at,
    p_trial_start,
    p_trial_end,
    p_metadata
  )
  ON CONFLICT (stripe_subscription_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    quantity = EXCLUDED.quantity,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    cancel_at = EXCLUDED.cancel_at,
    canceled_at = EXCLUDED.canceled_at,
    ended_at = EXCLUDED.ended_at,
    trial_start = EXCLUDED.trial_start,
    trial_end = EXCLUDED.trial_end,
    metadata = EXCLUDED.metadata,
    updated_at = now()
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$;

-- Create free subscription
CREATE OR REPLACE FUNCTION create_free_subscription(
  p_user_id uuid,
  p_stripe_price_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id uuid;
  v_far_future timestamptz;
BEGIN
  -- Set far future date for free plans (10 years)
  v_far_future := now() + INTERVAL '10 years';
  
  INSERT INTO subscriptions (
    user_id,
    stripe_subscription_id, -- null for free
    stripe_customer_id, -- null for free (initially)
    stripe_price_id,
    status,
    quantity,
    current_period_start,
    current_period_end,
    metadata
  ) VALUES (
    p_user_id,
    NULL,
    NULL,
    p_stripe_price_id,
    'active',
    1,
    now(),
    v_far_future,
    '{"type": "free", "created_by": "system"}'::jsonb
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_active_subscription(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_subscription(uuid, text, text, text, subscription_status, integer, timestamptz, timestamptz, boolean, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION create_free_subscription(uuid, text) TO authenticated, service_role;

-- ============================================================================
-- 10. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Subscription overview with product details
CREATE VIEW subscription_details AS
SELECT 
  s.id AS subscription_id,
  s.user_id,
  u.email AS user_email,
  s.stripe_subscription_id,
  s.status,
  
  -- Product information
  p.stripe_product_id,
  p.name AS product_name,
  p.description AS product_description,
  
  -- Price information
  pr.stripe_price_id,
  pr.unit_amount,
  pr.currency,
  pr.recurring_interval,
  
  -- Subscription periods
  s.current_period_start,
  s.current_period_end,
  s.trial_start,
  s.trial_end,
  
  -- Cancellation info
  s.cancel_at_period_end,
  s.canceled_at,
  s.ended_at,
  
  -- Metadata
  s.quantity,
  s.metadata AS subscription_metadata,
  s.created_at,
  s.updated_at,
  
  -- Computed fields
  CASE 
    WHEN s.stripe_subscription_id IS NULL THEN 'free'
    ELSE 'paid'
  END AS subscription_type,
  
  CASE 
    WHEN s.status IN ('active', 'trialing') THEN true
    ELSE false
  END AS is_active
  
FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN stripe_prices pr ON s.stripe_price_id = pr.stripe_price_id
JOIN stripe_products p ON pr.stripe_product_id = p.stripe_product_id;

-- Grant view access
ALTER VIEW subscription_details OWNER TO postgres;
GRANT SELECT ON subscription_details TO authenticated, service_role;

-- ============================================================================
-- SCHEMA VALIDATION COMPLETE
-- ============================================================================
-- This schema provides:
-- ✅ Clear, consistent naming
-- ✅ Proper foreign key relationships
-- ✅ Minimal, focused tables
-- ✅ Stripe-first design
-- ✅ Robust constraints
-- ✅ Efficient indexes
-- ✅ Simple RLS policies
-- ✅ Helper functions for common operations
-- ✅ Views for complex queries
-- ✅ Zero technical debt
-- ============================================================================