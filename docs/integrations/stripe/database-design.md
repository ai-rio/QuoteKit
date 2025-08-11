# Database Design - Account-Stripe Integration

## Database Schema Design and Migration Strategy

This document outlines the comprehensive database design changes required for the Account-Stripe Integration epic, including new tables, schema modifications, migration strategies, and data integrity considerations.

---

## Current Schema Analysis

### Existing Tables Assessment
Based on the current system analysis, these tables already exist:

#### `subscriptions` table
```sql
-- Current structure (inferred from codebase)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT REFERENCES prices(id),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `prices` table
```sql
-- Current structure (inferred from codebase)
CREATE TABLE prices (
  id TEXT PRIMARY KEY,  -- Stripe price ID
  product_id TEXT REFERENCES products(id),
  unit_amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  recurring_interval TEXT, -- 'month' or 'year'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `products` table
```sql
-- Current structure (inferred from codebase)
CREATE TABLE products (
  id TEXT PRIMARY KEY,  -- Stripe product ID
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Enhanced Schema Design

### 1. Enhanced Subscriptions Table

#### Migration: Add Missing Subscription Fields
```sql
-- Migration: 2025_01_25_001_enhance_subscriptions.sql
-- Add missing fields to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS latest_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS discount_id TEXT,
ADD COLUMN IF NOT EXISTS collection_method TEXT DEFAULT 'charge_automatically',
ADD COLUMN IF NOT EXISTS default_payment_method_id TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 2. Customer Management Table

#### New Table: Enhanced Customer Analytics
```sql
-- Migration: 2025_01_25_002_add_customer_management.sql
CREATE TABLE IF NOT EXISTS customer_management (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  
  -- Customer lifecycle data
  customer_since TIMESTAMPTZ DEFAULT NOW(),
  first_subscription_date TIMESTAMPTZ,
  last_subscription_date TIMESTAMPTZ,
  
  -- Financial metrics
  lifetime_value DECIMAL(12,2) DEFAULT 0.00,
  total_amount_paid DECIMAL(12,2) DEFAULT 0.00,
  monthly_recurring_revenue DECIMAL(10,2) DEFAULT 0.00,
  
  -- Payment history
  total_payments INTEGER DEFAULT 0,
  successful_payments INTEGER DEFAULT 0,
  failed_payments INTEGER DEFAULT 0,
  last_payment_date TIMESTAMPTZ,
  last_payment_amount DECIMAL(10,2),
  
  -- Customer status and health
  customer_status customer_status_enum DEFAULT 'active',
  churn_risk_score INTEGER DEFAULT 0 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100),
  churn_risk_level churn_risk_enum DEFAULT 'low',
  
  -- Support and notes
  support_priority support_priority_enum DEFAULT 'standard',
  internal_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Contact preferences
  marketing_consent BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supporting enums
CREATE TYPE customer_status_enum AS ENUM (
  'active',
  'past_due', 
  'canceled',
  'incomplete',
  'trialing',
  'paused'
);

CREATE TYPE churn_risk_enum AS ENUM (
  'low',
  'medium', 
  'high',
  'critical'
);

CREATE TYPE support_priority_enum AS ENUM (
  'low',
  'standard',
  'high',
  'enterprise'
);

-- Add indexes
CREATE INDEX idx_customer_management_user_id ON customer_management(user_id);
CREATE INDEX idx_customer_management_stripe_customer_id ON customer_management(stripe_customer_id);
CREATE INDEX idx_customer_management_status ON customer_management(customer_status);
CREATE INDEX idx_customer_management_churn_risk ON customer_management(churn_risk_level);
CREATE INDEX idx_customer_management_ltv ON customer_management(lifetime_value DESC);
CREATE INDEX idx_customer_management_created_at ON customer_management(created_at);

-- Add trigger for updated_at
CREATE TRIGGER customer_management_updated_at
  BEFORE UPDATE ON customer_management
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 3. Webhook Processing Audit

#### New Table: Webhook Event Tracking
```sql
-- Migration: 2025_01_25_003_add_webhook_audit.sql
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  
  -- Processing status
  processing_status processing_status_enum DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Error handling
  error_message TEXT,
  error_code TEXT,
  error_details JSONB,
  
  -- Timing
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  -- Data
  event_data JSONB NOT NULL,
  processing_result JSONB,
  
  -- Metadata
  api_version TEXT,
  request_id TEXT,
  livemode BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enum for processing status
CREATE TYPE processing_status_enum AS ENUM (
  'pending',
  'processing',
  'processed',
  'failed',
  'dead_letter',
  'skipped'
);

-- Add indexes for efficient querying
CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(processing_status);
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at);
CREATE INDEX idx_webhook_events_retry_count ON webhook_events(retry_count) WHERE processing_status = 'failed';
CREATE INDEX idx_webhook_events_next_retry ON webhook_events(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER webhook_events_updated_at
  BEFORE UPDATE ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 4. Subscription Events and Analytics

#### New Table: Subscription Event Tracking
```sql
-- Migration: 2025_01_25_004_add_subscription_events.sql
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customer_management(id) ON DELETE CASCADE,
  subscription_id TEXT, -- Stripe subscription ID
  
  -- Event details
  event_type subscription_event_enum NOT NULL,
  event_source event_source_enum DEFAULT 'system',
  
  -- Plan information
  old_price_id TEXT REFERENCES prices(id),
  new_price_id TEXT REFERENCES prices(id),
  old_plan_name TEXT,
  new_plan_name TEXT,
  
  -- Financial impact
  revenue_change DECIMAL(10,2) DEFAULT 0.00,
  mrr_change DECIMAL(10,2) DEFAULT 0.00,
  
  -- Event context
  reason TEXT,
  initiated_by_user BOOLEAN DEFAULT TRUE,
  admin_user_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  event_data JSONB DEFAULT '{}',
  stripe_event_id TEXT,
  
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enum for subscription events
CREATE TYPE subscription_event_enum AS ENUM (
  'subscription_created',
  'subscription_activated',
  'subscription_upgraded',
  'subscription_downgraded', 
  'subscription_renewed',
  'subscription_canceled',
  'subscription_reactivated',
  'subscription_paused',
  'subscription_resumed',
  'trial_started',
  'trial_ended',
  'trial_extended',
  'payment_succeeded',
  'payment_failed',
  'payment_retry',
  'discount_applied',
  'discount_removed',
  'plan_changed'
);

CREATE TYPE event_source_enum AS ENUM (
  'user',
  'admin',
  'system',
  'webhook',
  'api',
  'scheduled'
);

-- Add indexes for analytics queries
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_customer_id ON subscription_events(customer_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_occurred_at ON subscription_events(occurred_at);
CREATE INDEX idx_subscription_events_revenue_change ON subscription_events(revenue_change) WHERE revenue_change != 0;

-- Composite indexes for common analytics queries
CREATE INDEX idx_subscription_events_analytics ON subscription_events(event_type, occurred_at, revenue_change);
CREATE INDEX idx_subscription_events_user_timeline ON subscription_events(user_id, occurred_at);
```

### 5. Payment Methods and Billing

#### New Table: Payment Methods Tracking
```sql
-- Migration: 2025_01_25_005_add_payment_methods.sql
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  
  -- Payment method details
  type payment_method_type_enum NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Card details (if applicable)
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_country TEXT,
  card_funding TEXT, -- 'credit', 'debit', 'prepaid', 'unknown'
  
  -- Bank account details (if applicable)
  bank_name TEXT,
  bank_last4 TEXT,
  bank_account_type TEXT,
  bank_routing_number TEXT,
  
  -- Status and metadata
  status payment_method_status_enum DEFAULT 'active',
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- For cards
);

-- Create enums
CREATE TYPE payment_method_type_enum AS ENUM (
  'card',
  'bank_account',
  'sepa_debit',
  'ideal',
  'sofort',
  'giropay',
  'bancontact'
);

CREATE TYPE payment_method_status_enum AS ENUM (
  'active',
  'expired',
  'failed',
  'canceled'
);

-- Add indexes
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_pm_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_stripe_customer_id ON payment_methods(stripe_customer_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_payment_methods_status ON payment_methods(status);
CREATE INDEX idx_payment_methods_expires_at ON payment_methods(expires_at) WHERE expires_at IS NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Ensure only one default payment method per user
CREATE UNIQUE INDEX idx_payment_methods_one_default_per_user 
  ON payment_methods(user_id) 
  WHERE is_default = TRUE;
```

### 6. Billing History and Invoices

#### New Table: Invoice Tracking
```sql
-- Migration: 2025_01_25_006_add_invoice_tracking.sql
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customer_management(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  
  -- Invoice details
  invoice_number TEXT,
  status invoice_status_enum NOT NULL,
  
  -- Financial details
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER DEFAULT 0, -- in cents
  amount_remaining INTEGER DEFAULT 0, -- in cents
  subtotal INTEGER NOT NULL, -- in cents
  tax INTEGER DEFAULT 0, -- in cents
  total INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  
  -- Dates
  created_at_stripe TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  
  -- Payment details
  payment_intent_id TEXT,
  charge_id TEXT,
  payment_method_id TEXT,
  
  -- Invoice content
  description TEXT,
  statement_descriptor TEXT,
  customer_email TEXT,
  customer_name TEXT,
  customer_address JSONB,
  
  -- Line items (simplified - could be separate table)
  line_items JSONB DEFAULT '[]',
  
  -- Files and links
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  
  -- Discount and tax details
  discount JSONB,
  tax_details JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enum for invoice status
CREATE TYPE invoice_status_enum AS ENUM (
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible'
);

-- Add indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_stripe_subscription_id ON invoices(stripe_subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at_stripe ON invoices(created_at_stripe);
CREATE INDEX idx_invoices_amount_due ON invoices(amount_due);

-- Add trigger for updated_at
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## Views and Materialized Views

### 1. Customer Analytics View
```sql
-- Migration: 2025_01_25_007_create_analytics_views.sql
-- Comprehensive customer analytics view
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
  cm.id as customer_id,
  cm.user_id,
  cm.stripe_customer_id,
  u.email,
  u.created_at as user_created_at,
  
  -- Subscription info
  s.id as subscription_id,
  s.status as subscription_status,
  s.current_period_start,
  s.current_period_end,
  p.unit_amount as monthly_amount,
  pr.name as plan_name,
  
  -- Financial metrics
  cm.lifetime_value,
  cm.monthly_recurring_revenue,
  cm.total_amount_paid,
  cm.total_payments,
  cm.successful_payments,
  cm.failed_payments,
  
  -- Calculated metrics
  CASE 
    WHEN cm.total_payments > 0 
    THEN ROUND((cm.successful_payments::DECIMAL / cm.total_payments) * 100, 2)
    ELSE 100.0
  END as payment_success_rate,
  
  -- Churn risk
  cm.churn_risk_score,
  cm.churn_risk_level,
  
  -- Activity metrics
  cm.last_payment_date,
  EXTRACT(DAYS FROM NOW() - cm.last_payment_date) as days_since_last_payment,
  
  -- Customer lifecycle
  cm.customer_since,
  EXTRACT(DAYS FROM NOW() - cm.customer_since) as customer_age_days,
  
  cm.created_at as customer_record_created,
  cm.updated_at as customer_record_updated

FROM customer_management cm
LEFT JOIN auth.users u ON cm.user_id = u.id
LEFT JOIN subscriptions s ON cm.stripe_customer_id = s.stripe_customer_id 
  AND s.status IN ('active', 'trialing', 'past_due')
LEFT JOIN prices p ON s.price_id = p.id
LEFT JOIN products pr ON p.product_id = pr.id;
```

### 2. Subscription Metrics Materialized View
```sql
-- Materialized view for fast analytics queries
CREATE MATERIALIZED VIEW subscription_metrics AS
SELECT 
  DATE_TRUNC('day', se.occurred_at) as metric_date,
  se.event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT se.user_id) as unique_users,
  SUM(se.revenue_change) as total_revenue_change,
  SUM(se.mrr_change) as total_mrr_change,
  
  -- Subscription counts by status
  COUNT(*) FILTER (WHERE se.event_type = 'subscription_created') as new_subscriptions,
  COUNT(*) FILTER (WHERE se.event_type = 'subscription_canceled') as canceled_subscriptions,
  COUNT(*) FILTER (WHERE se.event_type = 'subscription_upgraded') as upgrades,
  COUNT(*) FILTER (WHERE se.event_type = 'subscription_downgraded') as downgrades,
  
  -- Payment metrics
  COUNT(*) FILTER (WHERE se.event_type = 'payment_succeeded') as successful_payments,
  COUNT(*) FILTER (WHERE se.event_type = 'payment_failed') as failed_payments,
  SUM(se.revenue_change) FILTER (WHERE se.event_type = 'payment_succeeded') as payment_revenue

FROM subscription_events se
WHERE se.occurred_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY DATE_TRUNC('day', se.occurred_at), se.event_type;

-- Add indexes for fast querying
CREATE UNIQUE INDEX idx_subscription_metrics_date_type 
  ON subscription_metrics(metric_date, event_type);
CREATE INDEX idx_subscription_metrics_date 
  ON subscription_metrics(metric_date);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_subscription_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY subscription_metrics;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (to be called by cron job)
-- SELECT cron.schedule('refresh-subscription-metrics', '0 1 * * *', 'SELECT refresh_subscription_metrics();');
```

---

## Data Integrity and Constraints

### 1. Foreign Key Relationships
```sql
-- Migration: 2025_01_25_008_add_data_integrity.sql
-- Add missing foreign key constraints

-- Ensure subscription events reference valid customers
ALTER TABLE subscription_events 
ADD CONSTRAINT fk_subscription_events_customer_id 
FOREIGN KEY (customer_id) REFERENCES customer_management(id) ON DELETE CASCADE;

-- Ensure payment methods reference valid users
ALTER TABLE payment_methods
ADD CONSTRAINT fk_payment_methods_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure invoices reference valid customers
ALTER TABLE invoices
ADD CONSTRAINT fk_invoices_customer_id
FOREIGN KEY (customer_id) REFERENCES customer_management(id) ON DELETE CASCADE;
```

### 2. Data Validation Constraints
```sql
-- Add check constraints for data validation
ALTER TABLE customer_management
ADD CONSTRAINT chk_lifetime_value_positive 
CHECK (lifetime_value >= 0),
ADD CONSTRAINT chk_payment_counts_valid
CHECK (successful_payments <= total_payments),
ADD CONSTRAINT chk_churn_risk_score_valid
CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100);

ALTER TABLE subscription_events
ADD CONSTRAINT chk_revenue_change_reasonable
CHECK (revenue_change >= -10000 AND revenue_change <= 10000); -- Max $100 change

ALTER TABLE invoices
ADD CONSTRAINT chk_invoice_amounts_valid
CHECK (amount_due >= 0 AND amount_paid >= 0 AND total >= 0),
ADD CONSTRAINT chk_amount_remaining_valid
CHECK (amount_remaining = amount_due - amount_paid);
```

### 3. Triggers for Data Consistency
```sql
-- Trigger to update customer metrics when subscription events occur
CREATE OR REPLACE FUNCTION update_customer_metrics_on_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer management record based on subscription event
  IF NEW.event_type IN ('payment_succeeded', 'payment_failed') THEN
    UPDATE customer_management 
    SET 
      total_payments = total_payments + 1,
      successful_payments = CASE 
        WHEN NEW.event_type = 'payment_succeeded' 
        THEN successful_payments + 1 
        ELSE successful_payments 
      END,
      failed_payments = CASE 
        WHEN NEW.event_type = 'payment_failed' 
        THEN failed_payments + 1 
        ELSE failed_payments 
      END,
      last_payment_date = CASE 
        WHEN NEW.event_type = 'payment_succeeded' 
        THEN NEW.occurred_at 
        ELSE last_payment_date 
      END,
      total_amount_paid = CASE 
        WHEN NEW.event_type = 'payment_succeeded' 
        THEN total_amount_paid + COALESCE(NEW.revenue_change, 0) 
        ELSE total_amount_paid 
      END,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_events_update_customer_metrics
  AFTER INSERT ON subscription_events
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_metrics_on_event();
```

---

## Migration Strategy

### 1. Migration Execution Plan

#### Phase 1: Core Schema Enhancements (Week 1)
```bash
# Execute in order:
1. 2025_01_25_001_enhance_subscriptions.sql
2. 2025_01_25_002_add_customer_management.sql
3. 2025_01_25_003_add_webhook_audit.sql
```

#### Phase 2: Analytics and Events (Week 2)
```bash
4. 2025_01_25_004_add_subscription_events.sql
5. 2025_01_25_005_add_payment_methods.sql
6. 2025_01_25_006_add_invoice_tracking.sql
```

#### Phase 3: Views and Data Integrity (Week 3)
```bash
7. 2025_01_25_007_create_analytics_views.sql
8. 2025_01_25_008_add_data_integrity.sql
```

### 2. Data Migration Scripts

#### Backfill Customer Management Data
```sql
-- Migration script to populate customer_management from existing data
INSERT INTO customer_management (
  user_id,
  stripe_customer_id,
  customer_since,
  first_subscription_date,
  customer_status,
  created_at,
  updated_at
)
SELECT DISTINCT
  s.user_id,
  s.stripe_customer_id,
  MIN(s.created_at) as customer_since,
  MIN(s.created_at) as first_subscription_date,
  CASE 
    WHEN s.status = 'active' THEN 'active'::customer_status_enum
    WHEN s.status = 'past_due' THEN 'past_due'::customer_status_enum
    WHEN s.status = 'canceled' THEN 'canceled'::customer_status_enum
    ELSE 'incomplete'::customer_status_enum
  END as customer_status,
  NOW() as created_at,
  NOW() as updated_at
FROM subscriptions s
WHERE s.user_id IS NOT NULL 
  AND s.stripe_customer_id IS NOT NULL
GROUP BY s.user_id, s.stripe_customer_id, s.status
ON CONFLICT (stripe_customer_id) DO NOTHING;
```

#### Backfill Subscription Events
```sql
-- Create historical subscription events from existing subscription data
INSERT INTO subscription_events (
  user_id,
  customer_id,
  subscription_id,
  event_type,
  event_source,
  new_price_id,
  occurred_at,
  created_at
)
SELECT 
  s.user_id,
  cm.id as customer_id,
  s.stripe_subscription_id,
  'subscription_created'::subscription_event_enum,
  'system'::event_source_enum,
  s.price_id,
  s.created_at as occurred_at,
  NOW() as created_at
FROM subscriptions s
JOIN customer_management cm ON s.stripe_customer_id = cm.stripe_customer_id
WHERE s.created_at IS NOT NULL;
```

### 3. Rollback Strategy

#### Rollback Scripts
```sql
-- Rollback script for emergency situations
-- Execute in reverse order of migrations

-- Drop new tables
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS subscription_events CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS customer_management CASCADE;

-- Drop new columns from existing tables
ALTER TABLE subscriptions 
DROP COLUMN IF EXISTS trial_start,
DROP COLUMN IF EXISTS trial_end,
DROP COLUMN IF EXISTS cancel_at_period_end,
DROP COLUMN IF EXISTS canceled_at,
DROP COLUMN IF EXISTS ended_at,
DROP COLUMN IF EXISTS latest_invoice_id,
DROP COLUMN IF EXISTS discount_id,
DROP COLUMN IF EXISTS collection_method,
DROP COLUMN IF EXISTS default_payment_method_id;

-- Drop enums
DROP TYPE IF EXISTS customer_status_enum CASCADE;
DROP TYPE IF EXISTS churn_risk_enum CASCADE;
DROP TYPE IF EXISTS support_priority_enum CASCADE;
DROP TYPE IF EXISTS processing_status_enum CASCADE;
DROP TYPE IF EXISTS subscription_event_enum CASCADE;
DROP TYPE IF EXISTS event_source_enum CASCADE;
DROP TYPE IF EXISTS payment_method_type_enum CASCADE;
DROP TYPE IF EXISTS payment_method_status_enum CASCADE;
DROP TYPE IF EXISTS invoice_status_enum CASCADE;

-- Drop views
DROP MATERIALIZED VIEW IF EXISTS subscription_metrics CASCADE;
DROP VIEW IF EXISTS customer_analytics CASCADE;
```

---

## Performance Optimization

### 1. Indexing Strategy
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_customer_analytics_queries 
  ON customer_management(customer_status, churn_risk_level, created_at);

CREATE INDEX idx_subscription_events_analytics 
  ON subscription_events(event_type, occurred_at) 
  WHERE occurred_at >= CURRENT_DATE - INTERVAL '1 year';

CREATE INDEX idx_webhook_events_retry_queue 
  ON webhook_events(next_retry_at) 
  WHERE processing_status = 'failed' AND next_retry_at IS NOT NULL;

-- Partial indexes for active data
CREATE INDEX idx_active_subscriptions 
  ON subscriptions(user_id, current_period_end) 
  WHERE status IN ('active', 'trialing');

CREATE INDEX idx_failed_payments_recent 
  ON subscription_events(customer_id, occurred_at) 
  WHERE event_type = 'payment_failed' 
    AND occurred_at >= CURRENT_DATE - INTERVAL '90 days';
```

### 2. Partitioning Strategy
```sql
-- Partition large tables by date for better performance
-- Subscription events partitioning (if volume is high)
CREATE TABLE subscription_events_y2025m01 PARTITION OF subscription_events
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE subscription_events_y2025m02 PARTITION OF subscription_events
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Webhook events partitioning
CREATE TABLE webhook_events_y2025m01 PARTITION OF webhook_events
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 3. Query Optimization
```sql
-- Function for efficient customer search
CREATE OR REPLACE FUNCTION search_customers(
  search_term TEXT DEFAULT NULL,
  status_filter customer_status_enum[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 25,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  customer_id UUID,
  user_email TEXT,
  customer_status customer_status_enum,
  lifetime_value DECIMAL,
  subscription_status TEXT,
  last_payment_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.customer_id,
    ca.email as user_email,
    ca.customer_status,
    ca.lifetime_value,
    ca.subscription_status,
    ca.last_payment_date
  FROM customer_analytics ca
  WHERE 
    (search_term IS NULL OR ca.email ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR ca.customer_status = ANY(status_filter))
  ORDER BY ca.lifetime_value DESC, ca.customer_record_created DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Backup and Recovery

### 1. Backup Strategy
```sql
-- Critical tables for backup priority
-- 1. customer_management (customer data)
-- 2. subscriptions (subscription state)
-- 3. subscription_events (financial history)
-- 4. invoices (billing records)
-- 5. payment_methods (payment data)
-- 6. webhook_events (integration audit)

-- Backup command for critical data
pg_dump --host=localhost --port=5432 --username=postgres \
  --table=customer_management \
  --table=subscriptions \
  --table=subscription_events \
  --table=invoices \
  --data-only --inserts \
  quotekit_db > critical_subscription_data_backup.sql
```

### 2. Point-in-Time Recovery
```sql
-- Create restore points before major operations
SELECT pg_create_restore_point('before_subscription_migration_' || 
  to_char(now(), 'YYYY_MM_DD_HH24_MI_SS'));

-- WAL archiving configuration for PITR
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
wal_level = replica
```

---

## Monitoring and Maintenance

### 1. Health Check Queries
```sql
-- Check for data inconsistencies
-- Subscriptions without customer management records
SELECT s.id, s.user_id, s.stripe_customer_id
FROM subscriptions s
LEFT JOIN customer_management cm ON s.stripe_customer_id = cm.stripe_customer_id
WHERE cm.id IS NULL;

-- Check for orphaned payment methods
SELECT pm.id, pm.user_id, pm.stripe_payment_method_id
FROM payment_methods pm
LEFT JOIN auth.users u ON pm.user_id = u.id
WHERE u.id IS NULL;

-- Check webhook processing health
SELECT 
  processing_status,
  COUNT(*) as count,
  MIN(received_at) as oldest_event,
  MAX(received_at) as newest_event
FROM webhook_events
WHERE received_at >= CURRENT_DATE - INTERVAL '24 hours'
GROUP BY processing_status;
```

### 2. Automated Maintenance
```sql
-- Cleanup old webhook events (keep 90 days)
DELETE FROM webhook_events 
WHERE received_at < CURRENT_DATE - INTERVAL '90 days'
  AND processing_status = 'processed';

-- Update customer churn risk scores (daily job)
CREATE OR REPLACE FUNCTION update_churn_risk_scores()
RETURNS void AS $$
BEGIN
  UPDATE customer_management
  SET 
    churn_risk_score = CASE
      WHEN failed_payments >= 3 THEN 80
      WHEN failed_payments >= 2 THEN 60
      WHEN last_payment_date < CURRENT_DATE - INTERVAL '45 days' THEN 70
      WHEN last_payment_date < CURRENT_DATE - INTERVAL '30 days' THEN 40
      ELSE 20
    END,
    churn_risk_level = CASE
      WHEN failed_payments >= 3 THEN 'critical'::churn_risk_enum
      WHEN failed_payments >= 2 THEN 'high'::churn_risk_enum
      WHEN last_payment_date < CURRENT_DATE - INTERVAL '30 days' THEN 'medium'::churn_risk_enum
      ELSE 'low'::churn_risk_enum
    END,
    updated_at = NOW()
  WHERE customer_status = 'active';
END;
$$ LANGUAGE plpgsql;
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-25  
**Next Review**: After migration completion  
**Document Owner**: Database Team Lead

---

## Related Documents
- [Technical Architecture](./technical-architecture.md)
- [API Specifications](./api-specs.md)
- [Implementation Guide](./implementation-guide.md)
- [Testing Strategy](./testing-strategy.md) *(Final)*