# Migration Guide: Current Schema to Comprehensive SaaS Schema

## Overview

This guide outlines the migration path from your current subscription schema to the comprehensive SaaS subscription management schema. The migration is designed to be non-destructive and allows for gradual rollout.

## Current State Analysis

### Existing Tables
- `users` - Basic user information
- `customers` - Stripe customer mapping
- `products` - Basic Stripe products
- `prices` - Basic Stripe prices
- `subscriptions` - Basic subscription data
- `subscription_changes` - Plan change tracking
- `payment_methods` - Simple payment method storage

### Key Gaps Identified
1. **Usage Tracking**: No metering or usage-based billing
2. **Feature Management**: No feature gates or access control
3. **Trial Management**: Basic trial support only
4. **Invoice Management**: Missing invoice and payment tracking
5. **Analytics**: Limited business intelligence capabilities
6. **Proration**: Basic proration handling
7. **Enterprise Features**: Missing advanced subscription features

## Migration Strategy

### Phase 1: Foundation Enhancement (Week 1-2)
Enhance existing tables and add critical missing functionality.

### Phase 2: Usage and Metering (Week 3-4)
Add comprehensive usage tracking and billing capabilities.

### Phase 3: Advanced Features (Week 5-6)
Add enterprise features, analytics, and advanced subscription management.

### Phase 4: Optimization and Cleanup (Week 7-8)
Optimize performance, add final features, and clean up legacy data.

## Detailed Migration Steps

### Phase 1: Foundation Enhancement

#### Step 1.1: Enhance Users Table
```sql
-- Add company and preference fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_size text CHECK (company_size IN ('1', '2-10', '11-50', '51-200', '201-500', '500+'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'churned', 'prospect'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_ids jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Add updated_at trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Step 1.2: Enhance Stripe Integration
```sql
-- Rename customers to stripe_customers for clarity
ALTER TABLE customers RENAME TO stripe_customers_old;

-- Create new enhanced stripe_customers table
CREATE TABLE stripe_customers (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,
  phone text,
  address jsonb,
  shipping jsonb,
  currency text DEFAULT 'usd' CHECK (length(currency) = 3),
  payment_method_types text[] DEFAULT ARRAY['card'],
  tax_exempt boolean DEFAULT false,
  stripe_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Migrate data from old table
INSERT INTO stripe_customers (user_id, stripe_customer_id, email, created_at)
SELECT id, stripe_customer_id, u.email, now()
FROM stripe_customers_old sc
JOIN users u ON sc.id = u.id;

-- Drop old table after verification
-- DROP TABLE stripe_customers_old;
```

#### Step 1.3: Enhance Products and Pricing
```sql
-- Add product categories
CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  parent_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enhance existing products table
ALTER TABLE products RENAME TO stripe_products_old;

-- Create enhanced products table
CREATE TABLE stripe_products (
  stripe_product_id text PRIMARY KEY,
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  statement_descriptor text,
  type text DEFAULT 'service' CHECK (type IN ('service', 'good')),
  active boolean DEFAULT true,
  tier text DEFAULT 'standard' CHECK (tier IN ('free', 'starter', 'standard', 'professional', 'enterprise')),
  target_audience text[] DEFAULT ARRAY['small_business'],
  usage_type text DEFAULT 'licensed' CHECK (usage_type IN ('licensed', 'metered')),
  billing_scheme text DEFAULT 'per_unit' CHECK (billing_scheme IN ('per_unit', 'tiered', 'volume')),
  features jsonb DEFAULT '{}',
  limits jsonb DEFAULT '{}',
  highlight_text text,
  marketing_features text[],
  comparison_features jsonb DEFAULT '{}',
  images text[],
  logo_url text,
  icon_url text,
  seo_title text,
  seo_description text,
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Migrate products data
INSERT INTO stripe_products (
  stripe_product_id, name, description, active, stripe_metadata, created_at
)
SELECT id, name, description, active, metadata, now()
FROM stripe_products_old;
```

#### Step 1.4: Enhance Payment Methods
```sql
-- Rename and enhance payment_methods table
ALTER TABLE payment_methods RENAME TO payment_methods_old;

CREATE TABLE payment_methods (
  id text PRIMARY KEY, -- Stripe payment method ID
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('card', 'bank_account', 'us_bank_account', 'sepa_debit', 'ach_debit')),
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  card_country text,
  bank_name text,
  bank_last4 text,
  bank_account_type text,
  is_default boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'requires_action', 'failed')),
  stripe_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Migrate payment methods (if any exist)
-- This migration will depend on your current payment_methods structure
```

### Phase 2: Usage and Metering

#### Step 2.1: Create Usage Tracking System
```sql
-- Create usage metrics definitions
CREATE TABLE usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text NOT NULL REFERENCES stripe_products(stripe_product_id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  metric_name text NOT NULL,
  metric_description text,
  unit text NOT NULL,
  unit_label text,
  aggregation_method text DEFAULT 'sum' CHECK (aggregation_method IN ('sum', 'max', 'last_during_period', 'max_during_period')),
  is_billable boolean DEFAULT true,
  overage_pricing jsonb,
  soft_limit integer,
  hard_limit integer,
  alert_thresholds integer[],
  display_order integer DEFAULT 0,
  is_visible_to_user boolean DEFAULT true,
  chart_type text DEFAULT 'line' CHECK (chart_type IN ('line', 'bar', 'gauge', 'counter')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(stripe_product_id, metric_key)
);

-- Create current usage tracking
CREATE TABLE user_usage_current (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES usage_metrics(id) ON DELETE CASCADE,
  usage_amount numeric(15,4) NOT NULL DEFAULT 0,
  last_reported_at timestamptz DEFAULT now(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  usage_breakdown jsonb DEFAULT '{}',
  included_amount numeric(15,4) DEFAULT 0,
  overage_amount numeric(15,4) DEFAULT 0,
  overage_cost integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, metric_id, period_start)
);

-- Create historical usage tracking
CREATE TABLE user_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES usage_metrics(id) ON DELETE CASCADE,
  usage_amount numeric(15,4) NOT NULL,
  included_amount numeric(15,4) DEFAULT 0,
  overage_amount numeric(15,4) DEFAULT 0,
  overage_cost integer DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  period_type text DEFAULT 'month' CHECK (period_type IN ('day', 'week', 'month', 'year')),
  billed_at timestamptz,
  stripe_invoice_id text,
  stripe_invoice_item_id text,
  usage_breakdown jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create real-time usage events
CREATE TABLE usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES usage_metrics(id) ON DELETE CASCADE,
  usage_amount numeric(15,4) NOT NULL DEFAULT 1,
  event_timestamp timestamptz DEFAULT now() NOT NULL,
  source text,
  source_id text,
  session_id text,
  request_id text,
  ip_address inet,
  user_agent text,
  country_code text,
  feature_used text,
  plan_tier text,
  metadata jsonb DEFAULT '{}',
  created_date date GENERATED ALWAYS AS (date(event_timestamp)) STORED
);
```

#### Step 2.2: Add Feature Management
```sql
-- Create product features table
CREATE TABLE product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text NOT NULL REFERENCES stripe_products(stripe_product_id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  feature_name text NOT NULL,
  feature_description text,
  feature_type text NOT NULL CHECK (feature_type IN ('boolean', 'limit', 'access')),
  default_value jsonb,
  limit_value integer,
  limit_period text CHECK (limit_period IN ('minute', 'hour', 'day', 'week', 'month', 'year')),
  access_levels text[] DEFAULT ARRAY['read'],
  required_permissions text[],
  category text,
  display_order integer DEFAULT 0,
  is_highlighted boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(stripe_product_id, feature_key)
);
```

### Phase 3: Advanced Features

#### Step 3.1: Enhanced Subscription Management
```sql
-- Add missing fields to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS collection_method text DEFAULT 'charge_automatically' CHECK (collection_method IN ('charge_automatically', 'send_invoice'));
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS days_until_due integer;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS proration_behavior text DEFAULT 'create_prorations' CHECK (proration_behavior IN ('none', 'create_prorations', 'always_invoice'));
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle_anchor timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_reason text CHECK (cancellation_reason IN ('user_requested', 'payment_failed', 'fraud', 'policy_violation', 'other'));
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_feedback text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_days_used integer DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS default_payment_method text REFERENCES payment_methods(id) ON DELETE SET NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_end timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_based_billing boolean DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_usage jsonb DEFAULT '{}';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_alerts jsonb DEFAULT '{}';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mrr_amount integer;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS arr_amount integer;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS ltv_amount integer;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS account_manager_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_invoice_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_at timestamptz;
```

#### Step 3.2: Add Invoice and Payment Management
```sql
-- Create invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_number text,
  status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount_due integer NOT NULL,
  amount_paid integer DEFAULT 0,
  amount_remaining integer NOT NULL,
  subtotal integer NOT NULL,
  tax integer DEFAULT 0,
  total integer NOT NULL,
  discount_amount integer DEFAULT 0,
  discount_description text,
  currency text NOT NULL CHECK (length(currency) = 3),
  collection_method text CHECK (collection_method IN ('charge_automatically', 'send_invoice')),
  created_at timestamptz NOT NULL,
  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  payment_intent_id text,
  payment_method_id text REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_attempt_count integer DEFAULT 0,
  next_payment_attempt timestamptz,
  description text,
  footer text,
  custom_fields jsonb DEFAULT '{}',
  hosted_invoice_url text,
  invoice_pdf_url text,
  receipt_number text,
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  amount_received integer DEFAULT 0,
  currency text NOT NULL CHECK (length(currency) = 3),
  status text NOT NULL CHECK (status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled')),
  payment_method_id text REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_method_type text,
  created_at timestamptz NOT NULL,
  processed_at timestamptz,
  failed_at timestamptz,
  canceled_at timestamptz,
  failure_code text,
  failure_message text,
  application_fee_amount integer DEFAULT 0,
  processing_fee integer DEFAULT 0,
  receipt_email text,
  receipt_number text,
  receipt_url text,
  confirmation_number text,
  refunded_amount integer DEFAULT 0,
  refunds_count integer DEFAULT 0,
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

#### Step 3.3: Add Trial and Onboarding Management
```sql
-- Create enhanced trial management
CREATE TABLE subscription_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  trial_type text DEFAULT 'time_based' CHECK (trial_type IN ('time_based', 'usage_based', 'feature_based')),
  trial_length_days integer,
  trial_start timestamptz NOT NULL,
  trial_end timestamptz NOT NULL,
  usage_limits jsonb DEFAULT '{}',
  feature_limits jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted', 'canceled')),
  conversion_date timestamptz,
  cancellation_date timestamptz,
  cancellation_reason text,
  onboarding_completed boolean DEFAULT false,
  key_actions_completed text[] DEFAULT ARRAY[]::text[],
  engagement_score integer DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  days_to_convert integer,
  conversion_touchpoint text,
  conversion_value integer,
  reminder_emails_sent integer DEFAULT 0,
  last_reminder_sent timestamptz,
  trial_extended_days integer DEFAULT 0,
  extension_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create onboarding tracking
CREATE TABLE user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  onboarding_flow text DEFAULT 'standard' CHECK (onboarding_flow IN ('standard', 'enterprise', 'self_serve', 'assisted')),
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  current_step text,
  completed_steps text[] DEFAULT ARRAY[]::text[],
  skipped_steps text[] DEFAULT ARRAY[]::text[],
  total_steps integer DEFAULT 5,
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  company_info_completed boolean DEFAULT false,
  payment_method_added boolean DEFAULT false,
  first_project_created boolean DEFAULT false,
  team_invited boolean DEFAULT false,
  integrations_configured boolean DEFAULT false,
  help_requests_count integer DEFAULT 0,
  last_help_request timestamptz,
  assigned_success_manager uuid REFERENCES users(id) ON DELETE SET NULL,
  time_to_complete_minutes integer,
  drop_off_step text,
  conversion_rate numeric(5,4),
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

### Phase 4: Optimization and Analytics

#### Step 4.1: Add Analytics Views
```sql
-- Create subscription analytics view
CREATE VIEW subscription_analytics AS
SELECT 
  s.id AS subscription_id,
  s.user_id,
  u.email,
  u.company_name,
  u.company_size,
  u.industry,
  s.status,
  s.stripe_subscription_id,
  p.name AS product_name,
  pr.unit_amount,
  pr.currency,
  pr.recurring_interval,
  s.quantity,
  s.mrr_amount,
  s.arr_amount,
  s.ltv_amount,
  s.created_at AS subscription_created_at,
  s.current_period_start,
  s.current_period_end,
  s.trial_start,
  s.trial_end,
  s.canceled_at,
  s.ended_at,
  CASE 
    WHEN s.stripe_subscription_id IS NULL THEN 'free'
    ELSE 'paid'
  END AS subscription_type,
  CASE 
    WHEN s.status IN ('active', 'trialing') THEN true
    ELSE false
  END AS is_active,
  CASE 
    WHEN s.trial_start IS NOT NULL AND s.trial_end > now() THEN true
    ELSE false
  END AS is_trialing,
  EXTRACT(days FROM (now() - s.created_at)) AS subscription_age_days,
  EXTRACT(days FROM (COALESCE(s.ended_at, now()) - s.created_at)) AS total_subscription_days,
  s.metadata AS subscription_metadata,
  s.updated_at AS last_updated
FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN stripe_prices pr ON s.stripe_price_id = pr.stripe_price_id
JOIN stripe_products p ON pr.stripe_product_id = p.stripe_product_id;
```

#### Step 4.2: Add Performance Indexes
```sql
-- Add critical indexes for performance
CREATE INDEX CONCURRENTLY idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX CONCURRENTLY idx_subscriptions_mrr ON subscriptions(mrr_amount) WHERE mrr_amount IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX CONCURRENTLY idx_usage_events_user_time ON usage_events(user_id, event_timestamp);
CREATE INDEX CONCURRENTLY idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX CONCURRENTLY idx_payments_user_status ON payments(user_id, status);
```

## Data Migration Scripts

### Script 1: Migrate Users Data
```sql
-- Update existing users with default values for new columns
UPDATE users SET
  account_status = 'active',
  metadata = '{}',
  updated_at = now()
WHERE account_status IS NULL;
```

### Script 2: Initialize Product Features
```sql
-- Add basic features for existing products
INSERT INTO product_features (stripe_product_id, feature_key, feature_name, feature_type, default_value)
SELECT 
  stripe_product_id,
  'quotes_limit',
  'Monthly Quote Limit',
  'limit',
  CASE 
    WHEN tier = 'free' THEN '{"value": 5}'::jsonb
    WHEN tier = 'starter' THEN '{"value": 25}'::jsonb
    WHEN tier = 'standard' THEN '{"value": 100}'::jsonb
    WHEN tier = 'professional' THEN '{"value": 500}'::jsonb
    ELSE '{"value": -1}'::jsonb -- unlimited
  END
FROM stripe_products
ON CONFLICT (stripe_product_id, feature_key) DO NOTHING;
```

### Script 3: Initialize Usage Metrics
```sql
-- Add basic usage metrics for quote generation
INSERT INTO usage_metrics (stripe_product_id, metric_key, metric_name, unit, unit_label)
SELECT DISTINCT
  stripe_product_id,
  'quotes_generated',
  'Quotes Generated',
  'count',
  'quotes'
FROM stripe_products
ON CONFLICT (stripe_product_id, metric_key) DO NOTHING;
```

## Rollback Plan

Each phase includes rollback procedures:

### Phase 1 Rollback
```sql
-- Rollback user enhancements
ALTER TABLE users DROP COLUMN IF EXISTS company_name;
ALTER TABLE users DROP COLUMN IF EXISTS company_size;
-- ... (drop other added columns)

-- Restore original tables if needed
-- ALTER TABLE stripe_customers_old RENAME TO customers;
```

### Phase 2 Rollback
```sql
-- Drop usage tracking tables
DROP TABLE IF EXISTS usage_events;
DROP TABLE IF EXISTS user_usage_history;
DROP TABLE IF EXISTS user_usage_current;
DROP TABLE IF EXISTS usage_metrics;
DROP TABLE IF EXISTS product_features;
```

## Testing Strategy

1. **Schema Validation**: Test all constraints and relationships
2. **Data Integrity**: Verify data migration accuracy
3. **Performance Testing**: Benchmark query performance
4. **Application Testing**: Test all application functionality
5. **Webhook Testing**: Verify Stripe webhook processing

## Monitoring and Alerting

Set up monitoring for:
- Migration progress
- Data integrity checks
- Performance metrics
- Error rates
- User impact

## Timeline and Resources

- **Total Duration**: 8 weeks
- **Database Downtime**: Minimal (< 30 minutes total)
- **Required Resources**: 
  - 1 Senior Database Engineer
  - 1 Backend Developer
  - 1 QA Engineer
- **Risk Level**: Medium (well-planned migration with rollback options)

## Success Criteria

1. ✅ All existing functionality preserved
2. ✅ New features available and tested
3. ✅ Performance maintained or improved
4. ✅ Zero data loss
5. ✅ Successful webhook processing
6. ✅ User experience uninterrupted

This migration plan provides a safe, gradual path to the comprehensive schema while maintaining system stability and user experience.