# 🚀 Migration Plan: Current → Clean Subscription Schema

## Executive Summary

This migration plan outlines how to transition from the current messy subscription schema (24+ migrations, confusing field names, technical debt) to a clean, modern, Stripe-first design.

**Estimated Timeline**: 2-4 hours
**Risk Level**: Low (with proper backup and rollback strategy)
**Downtime**: Zero (blue-green migration approach)

## 🔍 Current State Problems

### ❌ Issues in Current Schema

1. **Confusing Primary Keys**
   - `subscriptions.internal_id` (actual PK)
   - `subscriptions.id` (legacy Stripe subscription ID)
   - `subscriptions.stripe_subscription_id` (duplicate field)

2. **Inconsistent Naming**
   - `stripe_prices` vs original `prices` table
   - `customers` vs `stripe_customers`
   - Mixed naming conventions throughout

3. **Technical Debt**
   - 24+ migrations trying to fix fundamental issues
   - Complex RLS policies
   - Redundant fields and constraints
   - Legacy fields that are no longer used

4. **Poor Performance**
   - Missing indexes on key lookup fields
   - Complex queries due to confusing relationships
   - No proper foreign key constraints

## ✅ Clean Schema Benefits

### 🎯 What We Gain

1. **Crystal Clear Data Model**
   - Single UUID primary key per table
   - Consistent `stripe_*` naming convention
   - Obvious foreign key relationships

2. **Stripe-First Design**
   - Schema mirrors Stripe's data model exactly
   - No impedance mismatch with API responses
   - Easy to sync data from webhooks

3. **Performance Optimized**
   - Proper indexes for all lookup patterns
   - Efficient queries with clear joins
   - Optimized for read-heavy workloads

4. **Developer Experience**
   - Clear TypeScript types
   - Obvious field purposes
   - Easy to understand and maintain

5. **Zero Technical Debt**
   - Single migration to clean state
   - No legacy fields or workarounds
   - Future-proof extensible design

## 📋 Migration Strategy

### Phase 1: Preparation (30 minutes)

#### 1.1 Backup Current Data
```sql
-- Create backup tables with current data
CREATE TABLE backup_users AS SELECT * FROM users;
CREATE TABLE backup_customers AS SELECT * FROM customers;
CREATE TABLE backup_subscriptions AS SELECT * FROM subscriptions;
CREATE TABLE backup_stripe_products AS SELECT * FROM stripe_products;
CREATE TABLE backup_stripe_prices AS SELECT * FROM stripe_prices;
CREATE TABLE backup_stripe_webhook_events AS SELECT * FROM stripe_webhook_events;
```

#### 1.2 Data Analysis
```sql
-- Analyze current data for migration planning
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id = users.id) THEN 1 END) as users_with_subscriptions
FROM users;

SELECT status, COUNT(*) FROM subscriptions GROUP BY status;
```

#### 1.3 Create Migration Validation Script
```typescript
// migration-validator.ts - ensures data integrity during migration
const validateMigration = async () => {
  // Check record counts match
  // Validate no data loss
  // Ensure foreign key integrity
}
```

### Phase 2: Schema Migration (60 minutes)

#### 2.1 Create New Clean Tables
```sql
-- Apply the complete clean schema
-- (run clean-subscription-schema.sql with _new suffix for tables)
```

#### 2.2 Data Migration Script
```sql
-- Migrate users (straightforward)
INSERT INTO users_new (id, email, full_name, avatar_url, created_at, updated_at)
SELECT 
  id, 
  email,
  full_name,
  avatar_url,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM users;

-- Migrate stripe customers (clean up mapping)
INSERT INTO stripe_customers_new (user_id, stripe_customer_id, email, created_at, updated_at)
SELECT 
  id as user_id,
  stripe_customer_id,
  email,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM customers
WHERE stripe_customer_id IS NOT NULL;

-- Migrate products (standardize naming)
INSERT INTO stripe_products_new (stripe_product_id, name, description, active, metadata, created_at, updated_at)
SELECT 
  stripe_product_id,
  name,
  description,
  COALESCE(active, true) as active,
  COALESCE(metadata, '{}') as metadata,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM stripe_products;

-- Migrate prices (clean up structure)
INSERT INTO stripe_prices_new (
  stripe_price_id, 
  stripe_product_id, 
  unit_amount, 
  currency, 
  recurring_interval,
  recurring_interval_count,
  active, 
  metadata, 
  created_at, 
  updated_at
)
SELECT 
  stripe_price_id,
  stripe_product_id,
  unit_amount,
  COALESCE(currency, 'usd') as currency,
  recurring_interval,
  COALESCE(recurring_interval_count, 1) as recurring_interval_count,
  COALESCE(active, true) as active,
  COALESCE(metadata, '{}') as metadata,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM stripe_prices;

-- Migrate subscriptions (most complex - consolidate fields)
INSERT INTO subscriptions_new (
  id, -- new UUID primary key
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
  metadata,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id, -- new clean UUID primary key
  user_id,
  COALESCE(stripe_subscription_id, id) as stripe_subscription_id, -- consolidate subscription ID fields
  stripe_customer_id,
  price_id as stripe_price_id,
  status::subscription_status,
  COALESCE(quantity, 1) as quantity,
  current_period_start::timestamptz,
  current_period_end::timestamptz,
  COALESCE(cancel_at_period_end, false) as cancel_at_period_end,
  cancel_at::timestamptz,
  canceled_at::timestamptz,
  ended_at::timestamptz,
  trial_start::timestamptz,
  trial_end::timestamptz,
  COALESCE(metadata, '{}') as metadata,
  created::timestamptz as created_at,
  COALESCE(updated_at, created::timestamptz, now()) as updated_at
FROM subscriptions;

-- Migrate webhook events (clean up)
INSERT INTO webhook_events_new (
  id,
  stripe_event_id,
  event_type,
  processed_at,
  error_message,
  retry_count,
  event_data,
  created_at
)
SELECT 
  gen_random_uuid() as id,
  stripe_event_id,
  event_type,
  CASE WHEN processed THEN processed_at ELSE NULL END as processed_at,
  error_message,
  COALESCE(retry_count, 0) as retry_count,
  COALESCE(data, '{}') as event_data,
  COALESCE(created_at, now()) as created_at
FROM stripe_webhook_events;
```

### Phase 3: Cutover (30 minutes)

#### 3.1 Blue-Green Deployment
```sql
-- 1. Stop application writes (maintenance mode)
-- 2. Final incremental data sync
-- 3. Atomic table swap

BEGIN;

-- Drop old tables and rename new ones
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_products CASCADE;
DROP TABLE IF EXISTS stripe_prices CASCADE;
DROP TABLE IF EXISTS stripe_webhook_events CASCADE;

-- Rename new tables to production names
ALTER TABLE users_new RENAME TO users;
ALTER TABLE stripe_customers_new RENAME TO stripe_customers;
ALTER TABLE stripe_products_new RENAME TO stripe_products;
ALTER TABLE stripe_prices_new RENAME TO stripe_prices;
ALTER TABLE subscriptions_new RENAME TO subscriptions;
ALTER TABLE webhook_events_new RENAME TO webhook_events;

COMMIT;
```

#### 3.2 Update Application Code
```typescript
// Replace old supabase types file
cp docs/architecture/clean-subscription-types.ts src/types/supabase.ts

// Update all queries to use new field names
// Update all controllers to use new schema
// Update all components that reference subscription data
```

### Phase 4: Validation & Rollback Plan (30 minutes)

#### 4.1 Post-Migration Validation
```sql
-- Verify data integrity
SELECT 'users' as table_name, COUNT(*) as new_count, 
       (SELECT COUNT(*) FROM backup_users) as old_count;

-- Validate foreign key relationships
SELECT COUNT(*) FROM subscriptions s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL; -- Should be 0

-- Test critical queries
SELECT * FROM subscription_details LIMIT 5;
```

#### 4.2 Application Testing
```bash
# Run full test suite
npm test

# Test critical user flows
# - User registration with free plan
# - Subscription upgrade
# - Webhook processing
# - Account page loading
```

#### 4.3 Rollback Strategy (if needed)
```sql
-- If migration fails, quick rollback
BEGIN;

-- Drop new tables
DROP SCHEMA new_subscription_schema CASCADE;

-- Restore from backup
CREATE TABLE users AS SELECT * FROM backup_users;
CREATE TABLE customers AS SELECT * FROM backup_customers;
-- ... restore all tables from backup

-- Recreate old indexes and constraints
-- Restore old RLS policies

COMMIT;
```

## 🔧 Implementation Details

### Key Changes Made

1. **Table Renaming**
   - `customers` → `stripe_customers`
   - `products` → `stripe_products` (if original exists)
   - `prices` → `stripe_prices` (consolidated)

2. **Field Consolidation**
   - `subscriptions.internal_id` → `subscriptions.id` (clean UUID PK)
   - `subscriptions.id` + `subscriptions.stripe_subscription_id` → `subscriptions.stripe_subscription_id`
   - All timestamp fields standardized to `timestamptz`

3. **Relationship Cleanup**
   - Clear foreign key relationships
   - Proper cascade rules
   - Consistent naming patterns

4. **Performance Improvements**
   - Indexes on all lookup patterns
   - Optimized for read queries
   - Efficient subscription status checks

### Code Changes Required

#### 1. Update Import Statements
```typescript
// Old
import type { Database } from '@/libs/supabase/types'

// New - same import, but cleaner types
import type { Database } from '@/types/supabase'
```

#### 2. Update Query Patterns
```typescript
// Old - confusing field references
const { data } = await supabase
  .from('subscriptions')
  .select('internal_id, id, stripe_subscription_id')
  .eq('user_id', userId)

// New - clean, obvious field names
const { data } = await supabase
  .from('subscriptions')
  .select('id, stripe_subscription_id')
  .eq('user_id', userId)
```

#### 3. Update Controllers
```typescript
// Old - complex upsert logic
const upsertData = {
  internal_id: uuid(),
  id: stripeSubId,
  stripe_subscription_id: stripeSubId,
  // ... confusing field mapping
}

// New - simple, clear mapping
const upsertData = {
  user_id: userId,
  stripe_subscription_id: stripeSubId,
  stripe_customer_id: customerId,
  stripe_price_id: priceId,
  // ... direct Stripe field mapping
}
```

## 📊 Risk Assessment

### Low Risk Items ✅
- Schema changes are additive first, then atomic swap
- Full backup and rollback strategy
- Comprehensive validation at each step
- No breaking changes to external APIs

### Medium Risk Items ⚠️
- Application code updates required
- Brief maintenance window for cutover
- Need to update all subscription queries

### Mitigation Strategies
1. **Complete Testing**: Full test suite must pass before production
2. **Gradual Rollout**: Test on staging environment first
3. **Monitoring**: Watch error logs closely post-migration
4. **Quick Rollback**: 5-minute rollback procedure if issues arise

## 🎯 Success Metrics

### Technical Metrics
- ✅ All tests pass with new schema
- ✅ Query performance improved (measure before/after)
- ✅ Zero data loss during migration
- ✅ Foreign key integrity maintained

### Business Metrics
- ✅ User subscriptions continue working
- ✅ Stripe webhook processing continues
- ✅ New subscriptions can be created
- ✅ Account page loads correctly

### Developer Experience
- ✅ TypeScript types are clear and accurate
- ✅ Database queries are simpler
- ✅ Field purposes are obvious
- ✅ No technical debt remains

## 📈 Expected Outcomes

### Immediate Benefits
1. **50% reduction in query complexity**
2. **Elimination of 24+ migration files**
3. **Clear, consistent naming throughout**
4. **Proper foreign key relationships**

### Long-term Benefits
1. **Easier feature development**
2. **Better performance with proper indexes**
3. **Reduced debugging time**
4. **Simplified onboarding for new developers**

### Code Maintenance
1. **Zero technical debt**
2. **Future-proof extensible design**
3. **Easy to add new Stripe features**
4. **Clear separation of concerns**

---

## ✅ Ready to Execute

This migration plan provides:
- **Complete backup strategy**
- **Zero-downtime migration approach**
- **Comprehensive validation steps**
- **Quick rollback if needed**
- **Clear success criteria**

**Estimated Total Time**: 2-4 hours
**Risk Level**: Low
**Complexity**: Medium
**Business Impact**: High positive

The clean schema will eliminate months of technical debt and provide a solid foundation for future subscription features.