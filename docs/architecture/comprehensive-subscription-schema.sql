-- ============================================================================
-- COMPREHENSIVE SAAS SUBSCRIPTION MANAGEMENT SCHEMA v3.0
-- ============================================================================
-- A complete, future-proof subscription management system that integrates with:
-- - Existing LawnQuote user/company/quote system  
-- - Stripe subscription and payment models
-- - Multi-tier product/plan structure with feature gates
-- - Usage tracking and metering for billing
-- - Trial periods and plan changes with proration
-- - Invoice and payment method management
-- - Subscription lifecycle management
-- 
-- This schema is designed to minimize future migrations by anticipating:
-- - Complex billing scenarios (usage-based, tiered, per-seat)
-- - Advanced subscription features (add-ons, discounts, coupons)
-- - Enterprise requirements (custom contracts, invoicing)
-- - Multi-tenant and marketplace scenarios
-- - Comprehensive audit trails and analytics
-- ============================================================================

-- ============================================================================
-- 1. ENHANCED USER MANAGEMENT (Building on existing auth.users)
-- ============================================================================

-- Users table (extends existing structure)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  
  -- Company/Organization info
  company_name text,
  company_size text CHECK (company_size IN ('1', '2-10', '11-50', '51-200', '201-500', '500+')),
  industry text,
  
  -- Contact preferences
  phone text,
  timezone text DEFAULT 'UTC',
  locale text DEFAULT 'en',
  
  -- Account status
  email_verified boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'churned', 'prospect')),
  
  -- Billing preferences
  billing_address jsonb,
  tax_ids jsonb, -- Store VAT numbers, tax IDs, etc.
  
  -- Metadata and audit
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_seen_at timestamptz
);

-- ============================================================================
-- 2. STRIPE INTEGRATION LAYER
-- ============================================================================

-- Stripe Customers (1:1 with users)
CREATE TABLE stripe_customers (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  
  -- Customer details from Stripe
  name text,
  phone text,
  address jsonb,
  shipping jsonb,
  
  -- Customer settings
  currency text DEFAULT 'usd' CHECK (length(currency) = 3),
  payment_method_types text[] DEFAULT ARRAY['card'],
  tax_exempt boolean DEFAULT false,
  
  -- Metadata
  stripe_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Payment Methods (stored securely with Stripe references)
CREATE TABLE payment_methods (
  id text PRIMARY KEY, -- Stripe payment method ID
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE,
  
  -- Payment method details (stored safely)
  type text NOT NULL CHECK (type IN ('card', 'bank_account', 'us_bank_account', 'sepa_debit', 'ach_debit')),
  
  -- Card details (if applicable)
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  card_country text,
  
  -- Bank account details (if applicable)  
  bank_name text,
  bank_last4 text,
  bank_account_type text,
  
  -- Status and preferences
  is_default boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'requires_action', 'failed')),
  
  -- Metadata
  stripe_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 3. PRODUCT CATALOG AND PRICING SYSTEM
-- ============================================================================

-- Product Categories (for organization)
CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  
  -- Hierarchy support
  parent_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enhanced Products (extends Stripe products)
CREATE TABLE stripe_products (
  stripe_product_id text PRIMARY KEY,
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  
  -- Basic product info
  name text NOT NULL,
  description text,
  statement_descriptor text, -- Appears on credit card statements
  
  -- Product configuration
  type text DEFAULT 'service' CHECK (type IN ('service', 'good')),
  active boolean DEFAULT true,
  
  -- Product tier and targeting
  tier text DEFAULT 'standard' CHECK (tier IN ('free', 'starter', 'standard', 'professional', 'enterprise')),
  target_audience text[] DEFAULT ARRAY['small_business'], -- small_business, enterprise, individual
  
  -- Usage-based billing support  
  usage_type text DEFAULT 'licensed' CHECK (usage_type IN ('licensed', 'metered')),
  billing_scheme text DEFAULT 'per_unit' CHECK (billing_scheme IN ('per_unit', 'tiered', 'volume')),
  
  -- Feature configuration
  features jsonb DEFAULT '{}', -- Store feature list for this product
  limits jsonb DEFAULT '{}', -- Store usage limits (API calls, storage, etc.)
  
  -- Marketing and display
  highlight_text text, -- "Most Popular", "Best Value", etc.
  marketing_features text[], -- Bullet points for marketing
  comparison_features jsonb DEFAULT '{}', -- For comparison tables
  
  -- Images and assets
  images text[], -- Multiple product images
  logo_url text,
  icon_url text,
  
  -- SEO and content
  seo_title text,
  seo_description text,
  
  -- Metadata and audit
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enhanced Pricing with complex billing support
CREATE TABLE stripe_prices (
  stripe_price_id text PRIMARY KEY,
  stripe_product_id text NOT NULL REFERENCES stripe_products(stripe_product_id) ON DELETE CASCADE,
  
  -- Basic pricing
  unit_amount integer, -- null for free or usage-based
  currency text DEFAULT 'usd' NOT NULL CHECK (length(currency) = 3),
  
  -- Billing configuration
  billing_scheme text DEFAULT 'per_unit' CHECK (billing_scheme IN ('per_unit', 'tiered', 'volume')),
  usage_type text DEFAULT 'licensed' CHECK (usage_type IN ('licensed', 'metered')),
  
  -- Recurring billing
  recurring_interval text CHECK (recurring_interval IN ('day', 'week', 'month', 'year')),
  recurring_interval_count integer DEFAULT 1,
  recurring_usage_type text CHECK (recurring_usage_type IN ('metered', 'licensed')),
  
  -- Tiered pricing support
  tiers jsonb, -- Store tiered pricing structure
  tiers_mode text CHECK (tiers_mode IN ('graduated', 'volume')),
  
  -- Trial configuration
  trial_period_days integer,
  trial_period_end timestamptz,
  
  -- Price modifiers
  tax_behavior text DEFAULT 'unspecified' CHECK (tax_behavior IN ('inclusive', 'exclusive', 'unspecified')),
  transform_quantity jsonb, -- For usage transformations
  
  -- Status and configuration
  active boolean DEFAULT true,
  nickname text, -- Human-readable identifier
  lookup_key text UNIQUE, -- For price lookups
  
  -- Display and marketing
  display_name text, -- For UI display
  description text,
  recommended boolean DEFAULT false,
  
  -- Metadata
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add-ons and Product Extensions
CREATE TABLE product_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text NOT NULL REFERENCES stripe_products(stripe_product_id) ON DELETE CASCADE,
  stripe_price_id text NOT NULL REFERENCES stripe_prices(stripe_price_id) ON DELETE CASCADE,
  
  -- Add-on configuration
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('feature', 'usage', 'support', 'integration')),
  
  -- Availability
  available_tiers text[] DEFAULT ARRAY['standard', 'professional', 'enterprise'],
  requires_approval boolean DEFAULT false,
  
  -- Billing
  is_recurring boolean DEFAULT true,
  proration_behavior text DEFAULT 'create_prorations' CHECK (proration_behavior IN ('none', 'create_prorations', 'always_invoice')),
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Feature definitions and access control
CREATE TABLE product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text NOT NULL REFERENCES stripe_products(stripe_product_id) ON DELETE CASCADE,
  
  -- Feature identification
  feature_key text NOT NULL, -- Technical identifier (e.g., 'api_access', 'advanced_reporting')
  feature_name text NOT NULL, -- Display name
  feature_description text,
  
  -- Feature configuration
  feature_type text NOT NULL CHECK (feature_type IN ('boolean', 'limit', 'access')),
  default_value jsonb, -- Default value for this feature
  
  -- Limits and constraints
  limit_value integer, -- For numeric limits (API calls, storage GB, etc.)
  limit_period text CHECK (limit_period IN ('minute', 'hour', 'day', 'week', 'month', 'year')),
  
  -- Access control
  access_levels text[] DEFAULT ARRAY['read'], -- read, write, admin
  required_permissions text[],
  
  -- Display and grouping
  category text, -- Group features in UI
  display_order integer DEFAULT 0,
  is_highlighted boolean DEFAULT false,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(stripe_product_id, feature_key)
);

-- ============================================================================
-- 4. SUBSCRIPTION MANAGEMENT CORE
-- ============================================================================

-- Enhanced subscription status type
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

-- Subscription lifecycle tracking
CREATE TYPE subscription_lifecycle_event AS ENUM (
  'created',
  'activated',
  'trialing',
  'upgraded',
  'downgraded',
  'renewed',
  'paused',
  'resumed',
  'canceled',
  'expired',
  'failed_payment',
  'payment_recovered'
);

-- Core subscription table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stripe integration
  stripe_subscription_id text UNIQUE, -- null for free plans
  stripe_customer_id text REFERENCES stripe_customers(stripe_customer_id) ON DELETE SET NULL,
  stripe_price_id text NOT NULL REFERENCES stripe_prices(stripe_price_id) ON DELETE RESTRICT,
  
  -- Subscription configuration
  status subscription_status DEFAULT 'active' NOT NULL,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  
  -- Billing periods
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  
  -- Billing configuration
  collection_method text DEFAULT 'charge_automatically' CHECK (collection_method IN ('charge_automatically', 'send_invoice')),
  days_until_due integer, -- For invoice collection method
  
  -- Proration and billing behavior
  proration_behavior text DEFAULT 'create_prorations' CHECK (proration_behavior IN ('none', 'create_prorations', 'always_invoice')),
  billing_cycle_anchor timestamptz,
  
  -- Cancellation management
  cancel_at_period_end boolean DEFAULT false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  cancellation_reason text CHECK (cancellation_reason IN ('user_requested', 'payment_failed', 'fraud', 'policy_violation', 'other')),
  cancellation_feedback text,
  ended_at timestamptz,
  
  -- Trial management
  trial_start timestamptz,
  trial_end timestamptz,
  trial_days_used integer DEFAULT 0,
  
  -- Payment and discount
  default_payment_method text REFERENCES payment_methods(id) ON DELETE SET NULL,
  discount_id text, -- Stripe discount/coupon reference
  discount_end timestamptz,
  
  -- Usage tracking
  usage_based_billing boolean DEFAULT false,
  current_usage jsonb DEFAULT '{}', -- Track current period usage
  usage_alerts jsonb DEFAULT '{}', -- Usage alert thresholds
  
  -- Business metrics
  mrr_amount integer, -- Monthly recurring revenue in cents
  arr_amount integer, -- Annual recurring revenue in cents
  ltv_amount integer, -- Lifetime value estimate in cents
  
  -- Account management
  sales_rep_id uuid REFERENCES users(id) ON DELETE SET NULL,
  account_manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata and audit
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_invoice_at timestamptz,
  next_billing_at timestamptz,
  
  -- Constraints
  CONSTRAINT valid_period CHECK (current_period_end > current_period_start),
  CONSTRAINT free_plan_constraints CHECK (
    (stripe_subscription_id IS NULL) OR 
    (stripe_subscription_id IS NOT NULL AND stripe_customer_id IS NOT NULL)
  )
);

-- Subscription add-ons (many-to-many relationship)
CREATE TABLE subscription_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  add_on_id uuid NOT NULL REFERENCES product_add_ons(id) ON DELETE CASCADE,
  stripe_subscription_item_id text, -- For Stripe tracking
  
  -- Add-on configuration
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  unit_amount integer, -- Override price if needed
  
  -- Billing periods (may differ from main subscription)
  added_at timestamptz DEFAULT now() NOT NULL,
  removed_at timestamptz,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'pending')),
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  UNIQUE(subscription_id, add_on_id, added_at)
);

-- Subscription lifecycle events (audit trail)
CREATE TABLE subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Event details
  event_type subscription_lifecycle_event NOT NULL,
  event_description text,
  initiated_by uuid REFERENCES users(id) ON DELETE SET NULL, -- Who triggered the event
  
  -- Before/after state
  previous_state jsonb,
  new_state jsonb,
  
  -- Financial impact
  revenue_impact integer, -- Change in MRR/ARR (in cents)
  proration_amount integer, -- Proration amount (in cents)
  
  -- Related objects
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 5. USAGE TRACKING AND METERING
-- ============================================================================

-- Usage metrics definitions
CREATE TABLE usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text NOT NULL REFERENCES stripe_products(stripe_product_id) ON DELETE CASCADE,
  
  -- Metric definition
  metric_key text NOT NULL, -- Technical identifier (e.g., 'api_calls', 'storage_gb')
  metric_name text NOT NULL, -- Display name
  metric_description text,
  
  -- Metric configuration
  unit text NOT NULL, -- 'calls', 'gb', 'users', 'minutes'
  unit_label text, -- Display label for the unit
  aggregation_method text DEFAULT 'sum' CHECK (aggregation_method IN ('sum', 'max', 'last_during_period', 'max_during_period')),
  
  -- Billing configuration
  is_billable boolean DEFAULT true,
  overage_pricing jsonb, -- Pricing for usage above limits
  
  -- Thresholds and alerts
  soft_limit integer, -- Warning threshold
  hard_limit integer, -- Blocking threshold
  alert_thresholds integer[], -- Alert at these usage levels
  
  -- Display
  display_order integer DEFAULT 0,
  is_visible_to_user boolean DEFAULT true,
  chart_type text DEFAULT 'line' CHECK (chart_type IN ('line', 'bar', 'gauge', 'counter')),
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(stripe_product_id, metric_key)
);

-- User usage tracking (current period)
CREATE TABLE user_usage_current (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES usage_metrics(id) ON DELETE CASCADE,
  
  -- Usage data
  usage_amount numeric(15,4) NOT NULL DEFAULT 0,
  last_reported_at timestamptz DEFAULT now(),
  
  -- Billing period tracking
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  -- Usage breakdown (optional)
  usage_breakdown jsonb DEFAULT '{}', -- Detailed usage by feature/endpoint/etc.
  
  -- Overage tracking
  included_amount numeric(15,4) DEFAULT 0, -- Amount included in plan
  overage_amount numeric(15,4) DEFAULT 0, -- Amount over limit
  overage_cost integer DEFAULT 0, -- Cost of overage in cents
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, metric_id, period_start)
);

-- Historical usage data (for analytics and billing)
CREATE TABLE user_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES usage_metrics(id) ON DELETE CASCADE,
  
  -- Usage data
  usage_amount numeric(15,4) NOT NULL,
  included_amount numeric(15,4) DEFAULT 0,
  overage_amount numeric(15,4) DEFAULT 0,
  overage_cost integer DEFAULT 0,
  
  -- Time period
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  period_type text DEFAULT 'month' CHECK (period_type IN ('day', 'week', 'month', 'year')),
  
  -- Billing information
  billed_at timestamptz,
  stripe_invoice_id text,
  stripe_invoice_item_id text,
  
  -- Metadata
  usage_breakdown jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Real-time usage events (for detailed tracking)
CREATE TABLE usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES usage_metrics(id) ON DELETE CASCADE,
  
  -- Event details
  usage_amount numeric(15,4) NOT NULL DEFAULT 1,
  event_timestamp timestamptz DEFAULT now() NOT NULL,
  
  -- Context
  source text, -- API endpoint, feature, etc.
  source_id text, -- Specific ID for the source
  session_id text, -- User session ID
  request_id text, -- Unique request identifier
  
  -- Geographic and technical context
  ip_address inet,
  user_agent text,
  country_code text,
  
  -- Business context
  feature_used text,
  plan_tier text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  -- Partitioning helper
  created_date date GENERATED ALWAYS AS (date(event_timestamp)) STORED
);

-- Partition usage_events by date for performance
-- This would typically be done in a separate migration
-- CREATE TABLE usage_events_y2024m01 PARTITION OF usage_events FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================================================
-- 6. INVOICE AND PAYMENT MANAGEMENT
-- ============================================================================

-- Enhanced invoice tracking
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number text,
  status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  
  -- Amounts (in cents)
  amount_due integer NOT NULL,
  amount_paid integer DEFAULT 0,
  amount_remaining integer NOT NULL,
  subtotal integer NOT NULL,
  tax integer DEFAULT 0,
  total integer NOT NULL,
  
  -- Discount information
  discount_amount integer DEFAULT 0,
  discount_description text,
  
  -- Billing details
  currency text NOT NULL CHECK (length(currency) = 3),
  collection_method text CHECK (collection_method IN ('charge_automatically', 'send_invoice')),
  
  -- Important dates
  created_at timestamptz NOT NULL,
  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  
  -- Payment information
  payment_intent_id text,
  payment_method_id text REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_attempt_count integer DEFAULT 0,
  next_payment_attempt timestamptz,
  
  -- Invoice content
  description text,
  footer text,
  custom_fields jsonb DEFAULT '{}',
  
  -- Delivery
  hosted_invoice_url text,
  invoice_pdf_url text,
  receipt_number text,
  
  -- Metadata
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Invoice line items
CREATE TABLE invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_invoice_item_id text,
  
  -- Line item details
  description text NOT NULL,
  amount integer NOT NULL, -- In cents
  currency text NOT NULL CHECK (length(currency) = 3),
  quantity integer DEFAULT 1,
  unit_amount integer,
  
  -- Product/price references
  stripe_price_id text REFERENCES stripe_prices(stripe_price_id) ON DELETE SET NULL,
  stripe_product_id text REFERENCES stripe_products(stripe_product_id) ON DELETE SET NULL,
  
  -- Usage-based billing
  usage_start timestamptz,
  usage_end timestamptz,
  usage_amount numeric(15,4),
  
  -- Proration
  proration boolean DEFAULT false,
  proration_details jsonb,
  
  -- Discounts
  discount_amount integer DEFAULT 0,
  
  -- Tax
  tax_amount integer DEFAULT 0,
  tax_rate numeric(5,4), -- e.g., 0.0825 for 8.25%
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Payment tracking
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Payment details
  amount integer NOT NULL, -- In cents
  amount_received integer DEFAULT 0,
  currency text NOT NULL CHECK (length(currency) = 3),
  status text NOT NULL CHECK (status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled')),
  
  -- Payment method
  payment_method_id text REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_method_type text,
  
  -- Processing details
  created_at timestamptz NOT NULL,
  processed_at timestamptz,
  failed_at timestamptz,
  canceled_at timestamptz,
  
  -- Failure information
  failure_code text,
  failure_message text,
  
  -- Fees and costs
  application_fee_amount integer DEFAULT 0,
  processing_fee integer DEFAULT 0,
  
  -- Receipt and confirmation
  receipt_email text,
  receipt_number text,
  receipt_url text,
  confirmation_number text,
  
  -- Refund tracking
  refunded_amount integer DEFAULT 0,
  refunds_count integer DEFAULT 0,
  
  -- Metadata
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Refund tracking
CREATE TABLE refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_refund_id text UNIQUE NOT NULL,
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Refund details
  amount integer NOT NULL, -- In cents
  currency text NOT NULL CHECK (length(currency) = 3),
  reason text CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'expired_uncaptured_charge')),
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  
  -- Processing details
  created_at timestamptz NOT NULL,
  processed_at timestamptz,
  
  -- Failure information
  failure_reason text,
  failure_balance_transaction text,
  
  -- Receipt information
  receipt_number text,
  
  -- Internal tracking
  initiated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  admin_notes text,
  
  -- Metadata
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 7. TRIAL AND ONBOARDING MANAGEMENT
-- ============================================================================

-- Enhanced trial management
CREATE TABLE subscription_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Trial configuration
  trial_type text DEFAULT 'time_based' CHECK (trial_type IN ('time_based', 'usage_based', 'feature_based')),
  trial_length_days integer,
  trial_start timestamptz NOT NULL,
  trial_end timestamptz NOT NULL,
  
  -- Trial limits (for usage-based trials)
  usage_limits jsonb DEFAULT '{}',
  feature_limits jsonb DEFAULT '{}',
  
  -- Trial status tracking
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted', 'canceled')),
  conversion_date timestamptz,
  cancellation_date timestamptz,
  cancellation_reason text,
  
  -- Engagement tracking
  onboarding_completed boolean DEFAULT false,
  key_actions_completed text[] DEFAULT ARRAY[]::text[],
  engagement_score integer DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  
  -- Conversion tracking
  days_to_convert integer,
  conversion_touchpoint text, -- What convinced them to convert
  conversion_value integer, -- Value of converted subscription
  
  -- Communication
  reminder_emails_sent integer DEFAULT 0,
  last_reminder_sent timestamptz,
  trial_extended_days integer DEFAULT 0,
  extension_reason text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Onboarding progress tracking
CREATE TABLE user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Onboarding flow
  onboarding_flow text DEFAULT 'standard' CHECK (onboarding_flow IN ('standard', 'enterprise', 'self_serve', 'assisted')),
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  
  -- Progress tracking
  current_step text,
  completed_steps text[] DEFAULT ARRAY[]::text[],
  skipped_steps text[] DEFAULT ARRAY[]::text[],
  total_steps integer DEFAULT 5,
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- User data collection
  company_info_completed boolean DEFAULT false,
  payment_method_added boolean DEFAULT false,
  first_project_created boolean DEFAULT false,
  team_invited boolean DEFAULT false,
  integrations_configured boolean DEFAULT false,
  
  -- Assistance and support
  help_requests_count integer DEFAULT 0,
  last_help_request timestamptz,
  assigned_success_manager uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Conversion tracking
  time_to_complete_minutes integer,
  drop_off_step text,
  conversion_rate numeric(5,4), -- For cohort analysis
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 8. PLAN CHANGES AND PRORATION
-- ============================================================================

-- Plan change requests and history
CREATE TABLE subscription_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Change details
  change_type text NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'addon_add', 'addon_remove', 'quantity_change', 'billing_change')),
  
  -- Before state
  old_stripe_price_id text REFERENCES stripe_prices(stripe_price_id) ON DELETE SET NULL,
  old_quantity integer,
  old_billing_interval text,
  
  -- After state
  new_stripe_price_id text NOT NULL REFERENCES stripe_prices(stripe_price_id) ON DELETE RESTRICT,
  new_quantity integer NOT NULL DEFAULT 1,
  new_billing_interval text,
  
  -- Timing
  requested_at timestamptz DEFAULT now() NOT NULL,
  effective_at timestamptz,
  processed_at timestamptz,
  
  -- Processing details
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
  initiated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Financial impact
  proration_amount integer, -- In cents
  immediate_charge integer DEFAULT 0,
  next_invoice_amount integer DEFAULT 0,
  mrr_change integer, -- Change in MRR (cents)
  
  -- Proration configuration
  proration_behavior text DEFAULT 'create_prorations' CHECK (proration_behavior IN ('none', 'create_prorations', 'always_invoice')),
  proration_date timestamptz,
  
  -- Related Stripe objects
  stripe_subscription_schedule_id text,
  stripe_invoice_id text,
  
  -- Failure handling
  failure_reason text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Scheduled plan changes (for future changes)
CREATE TABLE subscription_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_subscription_schedule_id text UNIQUE,
  
  -- Schedule configuration
  schedule_name text,
  schedule_type text CHECK (schedule_type IN ('one_time', 'recurring', 'trial_end', 'billing_cycle')),
  
  -- Timing
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  phases jsonb NOT NULL, -- Stripe subscription schedule phases
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('not_started', 'active', 'completed', 'released', 'canceled')),
  completed_at timestamptz,
  canceled_at timestamptz,
  released_at timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 9. DISCOUNTS, COUPONS, AND PROMOTIONS
-- ============================================================================

-- Discount and coupon tracking
CREATE TABLE subscription_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_coupon_id text NOT NULL,
  stripe_discount_id text UNIQUE,
  
  -- Discount details
  coupon_name text,
  coupon_code text,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount')),
  
  -- Discount values
  percent_off numeric(5,2), -- e.g., 25.00 for 25%
  amount_off integer, -- In cents
  currency text CHECK (length(currency) = 3),
  
  -- Duration and limits
  duration text CHECK (duration IN ('once', 'repeating', 'forever')),
  duration_in_months integer,
  max_redemptions integer,
  times_redeemed integer DEFAULT 0,
  
  -- Validity period
  valid_from timestamptz,
  valid_until timestamptz,
  
  -- Application details
  applied_at timestamptz DEFAULT now() NOT NULL,
  removed_at timestamptz,
  
  -- Savings tracking
  total_savings integer DEFAULT 0, -- Total amount saved in cents
  savings_this_period integer DEFAULT 0,
  
  -- Campaign tracking
  campaign_id text,
  referral_source text,
  applied_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  stripe_metadata jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Promotion campaigns
CREATE TABLE promotion_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campaign details
  name text NOT NULL,
  description text,
  campaign_code text UNIQUE,
  
  -- Campaign type and targeting
  campaign_type text CHECK (campaign_type IN ('acquisition', 'retention', 'winback', 'expansion')),
  target_audience jsonb DEFAULT '{}', -- Targeting criteria
  
  -- Discount configuration
  stripe_coupon_id text NOT NULL,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial')),
  discount_value integer, -- Percentage or amount in cents
  
  -- Campaign timing
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  
  -- Usage limits
  max_redemptions integer,
  redemptions_count integer DEFAULT 0,
  max_per_customer integer DEFAULT 1,
  
  -- Campaign status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'canceled')),
  
  -- Performance tracking
  impressions_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  revenue_generated integer DEFAULT 0,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 10. WEBHOOK AND EVENT MANAGEMENT
-- ============================================================================

-- Enhanced webhook event processing
CREATE TABLE webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  
  -- Event details
  event_type text NOT NULL,
  api_version text,
  livemode boolean DEFAULT false,
  
  -- Processing status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'skipped')),
  processed_at timestamptz,
  
  -- Error handling
  error_message text,
  error_code text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  
  -- Event payload
  event_data jsonb NOT NULL,
  event_object_id text, -- ID of the main object (subscription, invoice, etc.)
  
  -- Performance tracking
  processing_time_ms integer,
  webhook_received_at timestamptz DEFAULT now(),
  
  -- Related entities (for faster lookups)
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Webhook processing logs (for debugging)
CREATE TABLE webhook_processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id uuid NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  
  -- Processing step
  processing_step text NOT NULL,
  step_status text CHECK (step_status IN ('started', 'completed', 'failed', 'skipped')),
  
  -- Timing
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  duration_ms integer,
  
  -- Results
  result_data jsonb,
  error_details jsonb,
  
  -- Context
  processor_version text,
  environment text DEFAULT 'production',
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 11. ANALYTICS AND REPORTING VIEWS
-- ============================================================================

-- Comprehensive subscription analytics view
CREATE VIEW subscription_analytics AS
SELECT 
  s.id AS subscription_id,
  s.user_id,
  u.email,
  u.company_name,
  u.company_size,
  u.industry,
  
  -- Subscription details
  s.status,
  s.stripe_subscription_id,
  p.name AS product_name,
  pr.unit_amount,
  pr.currency,
  pr.recurring_interval,
  s.quantity,
  
  -- Financial metrics
  s.mrr_amount,
  s.arr_amount,
  s.ltv_amount,
  
  -- Lifecycle
  s.created_at AS subscription_created_at,
  s.current_period_start,
  s.current_period_end,
  s.trial_start,
  s.trial_end,
  s.canceled_at,
  s.ended_at,
  
  -- Computed metrics
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
  
  -- Age calculations
  EXTRACT(days FROM (now() - s.created_at)) AS subscription_age_days,
  EXTRACT(days FROM (COALESCE(s.ended_at, now()) - s.created_at)) AS total_subscription_days,
  
  -- Trial metrics
  CASE 
    WHEN s.trial_start IS NOT NULL THEN 
      EXTRACT(days FROM (COALESCE(s.trial_end, now()) - s.trial_start))
    ELSE NULL
  END AS trial_length_days,
  
  -- Payment status
  CASE 
    WHEN s.status = 'past_due' THEN true
    ELSE false
  END AS has_payment_issues,
  
  -- Metadata
  s.metadata AS subscription_metadata,
  s.updated_at AS last_updated

FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN stripe_prices pr ON s.stripe_price_id = pr.stripe_price_id
JOIN stripe_products p ON pr.stripe_product_id = p.stripe_product_id;

-- Usage analytics view
CREATE VIEW usage_analytics AS
SELECT 
  uc.user_id,
  uc.subscription_id,
  um.metric_key,
  um.metric_name,
  um.unit,
  
  -- Current period usage
  uc.usage_amount AS current_usage,
  uc.included_amount,
  uc.overage_amount,
  uc.overage_cost,
  
  -- Period information
  uc.period_start,
  uc.period_end,
  uc.last_reported_at,
  
  -- Utilization metrics
  CASE 
    WHEN uc.included_amount > 0 THEN 
      ROUND((uc.usage_amount / uc.included_amount) * 100, 2)
    ELSE NULL
  END AS utilization_percentage,
  
  CASE 
    WHEN uc.usage_amount > uc.included_amount THEN true
    ELSE false
  END AS has_overage,
  
  -- Trend data (30-day comparison)
  -- This would require a more complex query with window functions
  
  -- Metadata
  uc.usage_breakdown,
  uc.updated_at AS last_updated

FROM user_usage_current uc
JOIN usage_metrics um ON uc.metric_id = um.id
JOIN subscriptions s ON uc.subscription_id = s.id
WHERE s.status IN ('active', 'trialing');

-- Revenue analytics view
CREATE VIEW revenue_analytics AS
SELECT 
  DATE_TRUNC('month', i.created_at) AS month,
  COUNT(DISTINCT i.user_id) AS paying_customers,
  COUNT(i.id) AS total_invoices,
  SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) AS total_revenue,
  SUM(CASE WHEN i.status = 'paid' THEN i.subtotal ELSE 0 END) AS total_subtotal,
  SUM(CASE WHEN i.status = 'paid' THEN i.tax ELSE 0 END) AS total_tax,
  SUM(CASE WHEN i.status = 'paid' THEN i.discount_amount ELSE 0 END) AS total_discounts,
  
  -- MRR calculation (approximate)
  SUM(CASE 
    WHEN i.status = 'paid' AND pr.recurring_interval = 'month' THEN i.subtotal
    WHEN i.status = 'paid' AND pr.recurring_interval = 'year' THEN i.subtotal / 12
    ELSE 0
  END) AS mrr,
  
  -- ARR calculation
  SUM(CASE 
    WHEN i.status = 'paid' AND pr.recurring_interval = 'month' THEN i.subtotal * 12
    WHEN i.status = 'paid' AND pr.recurring_interval = 'year' THEN i.subtotal
    ELSE 0
  END) AS arr,
  
  -- Average metrics
  AVG(CASE WHEN i.status = 'paid' THEN i.total ELSE NULL END) AS avg_invoice_amount,
  
  -- Currency breakdown
  i.currency

FROM invoices i
JOIN subscriptions s ON i.subscription_id = s.id
JOIN stripe_prices pr ON s.stripe_price_id = pr.stripe_price_id
GROUP BY DATE_TRUNC('month', i.created_at), i.currency
ORDER BY month DESC;

-- ============================================================================
-- 12. INDEXES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_company_size ON users(company_size) WHERE company_size IS NOT NULL;
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_seen ON users(last_seen_at) WHERE last_seen_at IS NOT NULL;

-- Stripe customers indexes
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_stripe_customers_email ON stripe_customers(email);

-- Payment methods indexes
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_customer ON payment_methods(stripe_customer_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_payment_methods_type ON payment_methods(type);

-- Products and pricing indexes
CREATE INDEX idx_stripe_products_active ON stripe_products(active) WHERE active = true;
CREATE INDEX idx_stripe_products_tier ON stripe_products(tier);
CREATE INDEX idx_stripe_products_category ON stripe_products(category_id) WHERE category_id IS NOT NULL;

CREATE INDEX idx_stripe_prices_product ON stripe_prices(stripe_product_id);
CREATE INDEX idx_stripe_prices_active ON stripe_prices(active) WHERE active = true;
CREATE INDEX idx_stripe_prices_amount ON stripe_prices(unit_amount) WHERE unit_amount IS NOT NULL;
CREATE INDEX idx_stripe_prices_interval ON stripe_prices(recurring_interval) WHERE recurring_interval IS NOT NULL;

-- Feature indexes
CREATE INDEX idx_product_features_product ON product_features(stripe_product_id);
CREATE INDEX idx_product_features_key ON product_features(feature_key);
CREATE INDEX idx_product_features_type ON product_features(feature_type);

-- Subscription indexes (most critical for performance)
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_customer ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_subscriptions_price ON subscriptions(stripe_price_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, status) WHERE status IN ('active', 'trialing');
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_trial_end ON subscriptions(trial_end) WHERE trial_end IS NOT NULL;
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at);
CREATE INDEX idx_subscriptions_mrr ON subscriptions(mrr_amount) WHERE mrr_amount IS NOT NULL;

-- Subscription events indexes
CREATE INDEX idx_subscription_events_subscription ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created ON subscription_events(created_at);

-- Usage tracking indexes
CREATE INDEX idx_usage_metrics_product ON usage_metrics(stripe_product_id);
CREATE INDEX idx_usage_metrics_key ON usage_metrics(metric_key);
CREATE INDEX idx_usage_metrics_billable ON usage_metrics(is_billable) WHERE is_billable = true;

CREATE INDEX idx_user_usage_current_user ON user_usage_current(user_id);
CREATE INDEX idx_user_usage_current_subscription ON user_usage_current(subscription_id);
CREATE INDEX idx_user_usage_current_metric ON user_usage_current(metric_id);
CREATE INDEX idx_user_usage_current_period ON user_usage_current(user_id, period_start, period_end);

CREATE INDEX idx_user_usage_history_user ON user_usage_history(user_id);
CREATE INDEX idx_user_usage_history_period ON user_usage_history(period_start, period_end);
CREATE INDEX idx_user_usage_history_billed ON user_usage_history(billed_at) WHERE billed_at IS NOT NULL;

-- Usage events indexes (with partitioning in mind)
CREATE INDEX idx_usage_events_user_time ON usage_events(user_id, event_timestamp);
CREATE INDEX idx_usage_events_metric_time ON usage_events(metric_id, event_timestamp);
CREATE INDEX idx_usage_events_source ON usage_events(source) WHERE source IS NOT NULL;
CREATE INDEX idx_usage_events_date ON usage_events(created_date); -- For partitioning

-- Invoice and payment indexes
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_amount ON invoices(total);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Webhook indexes
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_unprocessed ON webhook_events(created_at, status) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_webhook_events_retry ON webhook_events(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX idx_webhook_events_user ON webhook_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_webhook_events_subscription ON webhook_events(subscription_id) WHERE subscription_id IS NOT NULL;

-- ============================================================================
-- 13. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- User policies (users can only access their own data)
CREATE POLICY "users_own_data" ON users FOR ALL USING (auth.uid() = id);

CREATE POLICY "stripe_customers_own_data" ON stripe_customers FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "payment_methods_own_data" ON payment_methods FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_own_data" ON subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "subscription_add_ons_own_data" ON subscription_add_ons 
  FOR ALL USING (auth.uid() = (SELECT user_id FROM subscriptions WHERE id = subscription_id));

CREATE POLICY "subscription_events_own_data" ON subscription_events 
  FOR ALL USING (auth.uid() = (SELECT user_id FROM subscriptions WHERE id = subscription_id));

CREATE POLICY "subscription_trials_own_data" ON subscription_trials FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_onboarding_own_data" ON user_onboarding FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "subscription_changes_own_data" ON subscription_changes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "subscription_discounts_own_data" ON subscription_discounts 
  FOR ALL USING (auth.uid() = (SELECT user_id FROM subscriptions WHERE id = subscription_id));

CREATE POLICY "user_usage_current_own_data" ON user_usage_current FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_usage_history_own_data" ON user_usage_history FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "usage_events_own_data" ON usage_events FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "invoices_own_data" ON invoices FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "payments_own_data" ON payments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "refunds_own_data" ON refunds FOR ALL USING (auth.uid() = user_id);

-- Service role policies (full access for webhooks and background jobs)
CREATE POLICY "service_role_full_access_users" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_stripe_customers" ON stripe_customers FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_payment_methods" ON payment_methods FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_subscriptions" ON subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_subscription_add_ons" ON subscription_add_ons FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_subscription_events" ON subscription_events FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_subscription_trials" ON subscription_trials FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_user_onboarding" ON user_onboarding FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_subscription_changes" ON subscription_changes FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_subscription_discounts" ON subscription_discounts FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_user_usage_current" ON user_usage_current FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_user_usage_history" ON user_usage_history FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_usage_events" ON usage_events FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_invoices" ON invoices FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_payments" ON payments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_refunds" ON refunds FOR ALL TO service_role USING (true);

-- Public read access for product catalog
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_public_read" ON product_categories FOR SELECT USING (true);
CREATE POLICY "stripe_products_public_read" ON stripe_products FOR SELECT USING (active = true);
CREATE POLICY "stripe_prices_public_read" ON stripe_prices FOR SELECT USING (active = true);
CREATE POLICY "product_add_ons_public_read" ON product_add_ons FOR SELECT USING (true);
CREATE POLICY "product_features_public_read" ON product_features FOR SELECT USING (true);
CREATE POLICY "usage_metrics_public_read" ON usage_metrics FOR SELECT USING (is_visible_to_user = true);

-- Service role access for catalog management
CREATE POLICY "service_role_catalog_access_categories" ON product_categories FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_catalog_access_products" ON stripe_products FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_catalog_access_prices" ON stripe_prices FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_catalog_access_add_ons" ON product_add_ons FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_catalog_access_features" ON product_features FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_catalog_access_metrics" ON usage_metrics FOR ALL TO service_role USING (true);

-- Webhook events (service role only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_processing_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_events_service_only" ON webhook_events FOR ALL TO service_role USING (true);
CREATE POLICY "webhook_processing_logs_service_only" ON webhook_processing_logs FOR ALL TO service_role USING (true);

-- ============================================================================
-- 14. TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_products_updated_at BEFORE UPDATE ON stripe_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_prices_updated_at BEFORE UPDATE ON stripe_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_trials_updated_at BEFORE UPDATE ON subscription_trials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON user_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_changes_updated_at BEFORE UPDATE ON subscription_changes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_schedules_updated_at BEFORE UPDATE ON subscription_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotion_campaigns_updated_at BEFORE UPDATE ON promotion_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON webhook_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Usage tracking update trigger
CREATE TRIGGER update_user_usage_current_updated_at BEFORE UPDATE ON user_usage_current
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MRR/ARR calculation trigger
CREATE OR REPLACE FUNCTION calculate_subscription_revenue()
RETURNS TRIGGER AS $$
DECLARE
  price_amount integer;
  interval_text text;
BEGIN
  -- Get price details
  SELECT unit_amount, recurring_interval 
  INTO price_amount, interval_text
  FROM stripe_prices 
  WHERE stripe_price_id = NEW.stripe_price_id;
  
  -- Calculate MRR and ARR based on billing interval
  IF price_amount IS NOT NULL THEN
    CASE interval_text
      WHEN 'month' THEN
        NEW.mrr_amount := price_amount * NEW.quantity;
        NEW.arr_amount := price_amount * NEW.quantity * 12;
      WHEN 'year' THEN
        NEW.mrr_amount := (price_amount * NEW.quantity) / 12;
        NEW.arr_amount := price_amount * NEW.quantity;
      WHEN 'week' THEN
        NEW.mrr_amount := (price_amount * NEW.quantity * 52) / 12;
        NEW.arr_amount := price_amount * NEW.quantity * 52;
      WHEN 'day' THEN
        NEW.mrr_amount := (price_amount * NEW.quantity * 365) / 12;
        NEW.arr_amount := price_amount * NEW.quantity * 365;
      ELSE
        NEW.mrr_amount := 0;
        NEW.arr_amount := 0;
    END CASE;
  ELSE
    NEW.mrr_amount := 0;
    NEW.arr_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_subscription_revenue_trigger 
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION calculate_subscription_revenue();

-- Subscription event logging trigger
CREATE OR REPLACE FUNCTION log_subscription_events()
RETURNS TRIGGER AS $$
DECLARE
  event_type_val subscription_lifecycle_event;
  revenue_change integer := 0;
BEGIN
  -- Determine event type based on changes
  IF TG_OP = 'INSERT' THEN
    event_type_val := 'created';
    revenue_change := NEW.mrr_amount;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      CASE NEW.status
        WHEN 'active' THEN event_type_val := 'activated';
        WHEN 'trialing' THEN event_type_val := 'trialing';
        WHEN 'canceled' THEN event_type_val := 'canceled';
        WHEN 'past_due' THEN event_type_val := 'failed_payment';
        ELSE event_type_val := 'activated'; -- default
      END CASE;
    ELSIF OLD.stripe_price_id != NEW.stripe_price_id THEN
      IF NEW.mrr_amount > OLD.mrr_amount THEN
        event_type_val := 'upgraded';
      ELSE
        event_type_val := 'downgraded';
      END IF;
    ELSE
      event_type_val := 'renewed'; -- default for other updates
    END IF;
    revenue_change := NEW.mrr_amount - OLD.mrr_amount;
  ELSE
    RETURN NULL; -- DELETE not handled
  END IF;
  
  -- Insert event record
  INSERT INTO subscription_events (
    subscription_id,
    event_type,
    event_description,
    previous_state,
    new_state,
    revenue_impact
  ) VALUES (
    NEW.id,
    event_type_val,
    'Automated event from subscription change',
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    revenue_change
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_subscription_events_trigger 
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_subscription_events();

-- ============================================================================
-- 15. HELPER FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Get user's active subscription with full details
CREATE OR REPLACE FUNCTION get_user_subscription_details(p_user_id uuid)
RETURNS TABLE (
  subscription_id uuid,
  stripe_subscription_id text,
  status subscription_status,
  product_name text,
  price_amount integer,
  currency text,
  billing_interval text,
  current_period_end timestamptz,
  trial_end timestamptz,
  is_trialing boolean,
  features jsonb,
  usage_limits jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    s.id,
    s.stripe_subscription_id,
    s.status,
    p.name,
    pr.unit_amount,
    pr.currency,
    pr.recurring_interval,
    s.current_period_end,
    s.trial_end,
    CASE WHEN s.trial_end > now() THEN true ELSE false END,
    p.features,
    p.limits
  FROM subscriptions s
  JOIN stripe_prices pr ON s.stripe_price_id = pr.stripe_price_id
  JOIN stripe_products p ON pr.stripe_product_id = p.stripe_product_id
  WHERE s.user_id = p_user_id 
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

-- Check if user has access to a specific feature
CREATE OR REPLACE FUNCTION user_has_feature_access(
  p_user_id uuid,
  p_feature_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access boolean := false;
  subscription_record RECORD;
BEGIN
  -- Get user's active subscription
  SELECT s.*, p.features, p.limits
  INTO subscription_record
  FROM subscriptions s
  JOIN stripe_prices pr ON s.stripe_price_id = pr.stripe_price_id
  JOIN stripe_products p ON pr.stripe_product_id = p.stripe_product_id
  WHERE s.user_id = p_user_id 
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Check if subscription exists and feature is enabled
  IF subscription_record.id IS NOT NULL THEN
    has_access := COALESCE(
      (subscription_record.features->p_feature_key->'enabled')::boolean,
      false
    );
  END IF;
  
  RETURN has_access;
END;
$$;

-- Get user's current usage for a metric
CREATE OR REPLACE FUNCTION get_user_current_usage(
  p_user_id uuid,
  p_metric_key text
)
RETURNS TABLE (
  usage_amount numeric,
  included_amount numeric,
  overage_amount numeric,
  utilization_percentage numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    uc.usage_amount,
    uc.included_amount,
    uc.overage_amount,
    CASE 
      WHEN uc.included_amount > 0 THEN 
        ROUND((uc.usage_amount / uc.included_amount) * 100, 2)
      ELSE NULL
    END
  FROM user_usage_current uc
  JOIN usage_metrics um ON uc.metric_id = um.id
  WHERE uc.user_id = p_user_id 
    AND um.metric_key = p_metric_key
    AND uc.period_start <= now() 
    AND uc.period_end > now()
  LIMIT 1;
$$;

-- Record usage event
CREATE OR REPLACE FUNCTION record_usage_event(
  p_user_id uuid,
  p_metric_key text,
  p_usage_amount numeric DEFAULT 1,
  p_source text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metric_id uuid;
  v_event_id uuid;
BEGIN
  -- Get metric ID
  SELECT id INTO v_metric_id
  FROM usage_metrics
  WHERE metric_key = p_metric_key;
  
  IF v_metric_id IS NULL THEN
    RAISE EXCEPTION 'Usage metric % not found', p_metric_key;
  END IF;
  
  -- Insert usage event
  INSERT INTO usage_events (
    user_id,
    metric_id,
    usage_amount,
    source,
    metadata
  ) VALUES (
    p_user_id,
    v_metric_id,
    p_usage_amount,
    p_source,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  -- Update current usage (this could be done via a background job for better performance)
  INSERT INTO user_usage_current (
    user_id,
    subscription_id,
    metric_id,
    usage_amount,
    period_start,
    period_end
  )
  SELECT 
    p_user_id,
    s.id,
    v_metric_id,
    p_usage_amount,
    s.current_period_start,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id 
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1
  ON CONFLICT (user_id, metric_id, period_start)
  DO UPDATE SET
    usage_amount = user_usage_current.usage_amount + EXCLUDED.usage_amount,
    last_reported_at = now(),
    updated_at = now();
  
  RETURN v_event_id;
END;
$$;

-- Create or update subscription (webhook helper)
CREATE OR REPLACE FUNCTION upsert_subscription(
  p_user_id uuid,
  p_stripe_subscription_id text,
  p_stripe_customer_id text,
  p_stripe_price_id text,
  p_status subscription_status,
  p_quantity integer DEFAULT 1,
  p_current_period_start timestamptz DEFAULT now(),
  p_current_period_end timestamptz DEFAULT (now() + INTERVAL '1 month'),
  p_cancel_at_period_end boolean DEFAULT false,
  p_cancel_at timestamptz DEFAULT NULL,
  p_canceled_at timestamptz DEFAULT NULL,
  p_ended_at timestamptz DEFAULT NULL,
  p_trial_start timestamptz DEFAULT NULL,
  p_trial_end timestamptz DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_subscription_details(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION user_has_feature_access(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_current_usage(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_usage_event(uuid, text, numeric, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_subscription(uuid, text, text, text, subscription_status, integer, timestamptz, timestamptz, boolean, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, jsonb) TO service_role;

-- Grant access to views
GRANT SELECT ON subscription_analytics TO authenticated, service_role;
GRANT SELECT ON usage_analytics TO authenticated, service_role;
GRANT SELECT ON revenue_analytics TO service_role; -- Revenue data is sensitive

-- ============================================================================
-- SCHEMA DOCUMENTATION AND VALIDATION
-- ============================================================================

-- This comprehensive schema provides:
-- ✅ Complete SaaS subscription management
-- ✅ Full Stripe integration with proper data modeling
-- ✅ Multi-tier product/plan structure with feature gates
-- ✅ Advanced usage tracking and metering
-- ✅ Trial period management with detailed tracking
-- ✅ Plan changes with proration handling
-- ✅ Invoice and payment management
-- ✅ Payment method storage and management
-- ✅ Comprehensive subscription lifecycle tracking
-- ✅ Discount and promotion management
-- ✅ Webhook event processing with retry logic
-- ✅ Usage-based billing support
-- ✅ Enterprise features (custom contracts, multiple currencies)
-- ✅ Advanced analytics and reporting
-- ✅ Optimized indexes for performance
-- ✅ Row-level security for data protection
-- ✅ Automated triggers for data consistency
-- ✅ Helper functions for common operations
-- ✅ Future-proof design to minimize migrations

-- Key Features Supported:
-- 🎯 Standard SaaS subscription tiers (Free, Starter, Pro, Enterprise)
-- 💳 Multiple payment methods and currencies
-- 📊 Usage-based billing and overage charges
-- 🔄 Plan upgrades/downgrades with prorations
-- 🎁 Trials, discounts, and promotional campaigns
-- 📈 Comprehensive analytics and business metrics
-- 🔒 Enterprise-grade security and compliance
-- 🚀 High-performance queries and indexes
-- 🔧 Extensible architecture for future requirements

-- Integration Points:
-- 🔗 Seamless integration with existing LawnQuote system
-- 🔗 Full Stripe webhook support
-- 🔗 Analytics and reporting systems
-- 🔗 Customer support and admin systems
-- 🔗 Marketing and growth tools
-- 🔗 Business intelligence platforms

-- ============================================================================
-- END OF COMPREHENSIVE SAAS SUBSCRIPTION SCHEMA
-- ============================================================================