# Subscription Database Fixes

## Overview

This document describes the comprehensive fixes applied to resolve critical Supabase database issues preventing users from signing up and upgrading subscription plans.

## Issues Addressed

### 1. Schema Constraint Problems
**Problem**: The original constraint was too restrictive:
```sql
-- PROBLEMATIC CONSTRAINT (removed)
CHECK (
  (stripe_subscription_id IS NULL AND stripe_customer_id IS NULL AND id IS NULL) OR 
  (stripe_subscription_id IS NOT NULL AND stripe_customer_id IS NOT NULL AND id IS NOT NULL)
)
```

This prevented free plan users from having Stripe customer records, blocking upgrade paths.

**Solution**: Implemented a more flexible constraint:
```sql
-- NEW FLEXIBLE CONSTRAINT
CHECK (
  -- Free plan: no stripe_subscription_id but can have stripe_customer_id for upgrades
  (stripe_subscription_id IS NULL AND id IS NULL) OR 
  -- Paid plan: must have both stripe_subscription_id and id (they should be the same)
  (stripe_subscription_id IS NOT NULL AND id IS NOT NULL AND stripe_subscription_id = id)
)
```

### 2. Primary Key Structure
**Problem**: Using nullable `id` field as primary key caused issues with free plans.

**Solution**: 
- Added `internal_id` UUID as the new primary key
- Made `id` nullable for free plans
- Updated all foreign key references to use `internal_id`

**Schema Changes**:
```sql
-- subscriptions table now has:
internal_id uuid PRIMARY KEY DEFAULT gen_random_uuid()
id text NULL  -- Stripe subscription ID for paid plans only
stripe_subscription_id text NULL  -- Duplicate of id for paid plans
stripe_customer_id text NULL  -- Can exist for free plans (upgrade path)
```

### 3. RLS Policy Issues
**Problem**: Policies were too restrictive and didn't properly handle webhooks or admin operations.

**Solution**: Comprehensive RLS policies:
```sql
-- Users can view their own subscriptions
"Users can view own subscriptions" FOR SELECT USING (auth.uid() = user_id)

-- Service role (webhooks) can manage all subscriptions  
"Service role can manage all subscriptions" FOR ALL USING (auth.role() = 'service_role')

-- Admin users can manage all subscriptions
"Admin users can manage all subscriptions" FOR ALL USING (is_admin())

-- Users can insert/update their own subscriptions
"Users can insert own subscriptions" FOR INSERT WITH CHECK (auth.uid() = user_id)
"Users can update own subscriptions" FOR UPDATE USING (auth.uid() = user_id)
```

### 4. Customer Creation Flow
**Problem**: Customer creation logic didn't properly handle the transition from free to paid plans.

**Solution**:
- Enhanced customer creation functions
- Support for creating customer records for free users (enables upgrades)
- Better error handling and race condition management

### 5. Subscription Management
**Problem**: Cleanup logic used wrong identifiers and didn't handle mixed free/paid scenarios.

**Solution**:
- Fixed cleanup functions to use `internal_id` instead of `id`
- Added database functions for proper subscription lifecycle management
- Created helper functions for common operations

## New Database Functions

### `create_free_plan_subscription()`
Creates a free plan subscription for a user:
```sql
SELECT create_free_plan_subscription(
  p_user_id := 'user-uuid',
  p_price_id := 'price_free_plan',  -- optional
  p_stripe_customer_id := 'cus_123'  -- optional for upgrade path
);
```

### `upgrade_subscription_to_paid()`
Upgrades a user from free to paid subscription:
```sql
SELECT upgrade_subscription_to_paid(
  p_user_id := 'user-uuid',
  p_stripe_subscription_id := 'sub_123',
  p_stripe_customer_id := 'cus_123',
  p_price_id := 'price_pro_monthly'
);
```

## New Views and Diagnostics

### `subscription_details` View
Unified view for both free and paid subscriptions:
```sql
SELECT * FROM subscription_details WHERE user_id = 'user-uuid';
```

### `subscription_diagnostics` View
Diagnostic view for troubleshooting:
```sql
SELECT * FROM subscription_diagnostics WHERE data_validity = 'invalid_data_state';
```

## TypeScript Integration

### New Helper Functions
Created `subscription-helpers.ts` with:
- `createFreePlanSubscription()` - Create free plan subscriptions
- `upgradeSubscriptionToPaid()` - Handle upgrades
- `ensureUserHasSubscription()` - Onboarding helper
- `getSubscriptionDiagnostics()` - Troubleshooting
- `validateUserSubscriptionIntegrity()` - Data validation

### Updated Existing Functions
Fixed `get-subscription.ts`:
- Updated cleanup logic to use `internal_id`
- Better handling of mixed subscription scenarios
- Improved error handling and logging

## Performance Improvements

### New Indexes
```sql
-- Performance indexes for common queries
idx_subscriptions_user_type_status ON subscriptions(user_id, stripe_subscription_id, status)
idx_subscriptions_stripe_customer_id_active ON subscriptions(stripe_customer_id) 
idx_customers_stripe_customer_id ON customers(stripe_customer_id)
```

### Query Optimization
- Optimized subscription lookup queries
- Better filtering for active subscriptions
- Efficient handling of free vs paid plan queries

## Migration Files

### Primary Migration
`20250728000000_fix_subscription_database_issues.sql`
- Comprehensive fix for all identified issues
- Safe migration that preserves existing data
- Includes rollback-safe operations

### Test Script  
`scripts/test-subscription-fixes.sql`
- Validates all fixes work correctly
- Tests constraint validations
- Performance testing queries

## Deployment Instructions

1. **Apply the migration**:
   ```bash
   supabase db push
   ```

2. **Run validation tests**:
   ```sql
   \i scripts/test-subscription-fixes.sql
   ```

3. **Verify RLS policies** (requires application testing):
   - Test user signup and subscription creation
   - Test subscription upgrades
   - Test webhook operations
   - Test admin operations

4. **Monitor performance**:
   - Check query execution plans
   - Monitor subscription lookup times
   - Validate index usage

## Usage Patterns

### New User Onboarding
```typescript
import { ensureUserHasSubscription } from './subscription-helpers';

// In your signup flow
await ensureUserHasSubscription(user.id, user.email);
```

### Subscription Upgrades
```typescript
import { upgradeSubscriptionToPaid } from './subscription-helpers';

// In your upgrade flow
await upgradeSubscriptionToPaid({
  userId: user.id,
  stripeSubscriptionId: subscription.id,
  stripeCustomerId: customer.id,
  priceId: selectedPrice.id
});
```

### Troubleshooting
```typescript
import { getSubscriptionDiagnostics, validateUserSubscriptionIntegrity } from './subscription-helpers';

// Check specific user
const diagnostics = await getSubscriptionDiagnostics(userId);
const validation = await validateUserSubscriptionIntegrity(userId);
```

## Testing Checklist

- [ ] New users can sign up and get free plan subscriptions
- [ ] Free plan users can upgrade to paid plans  
- [ ] Paid subscription webhooks work correctly
- [ ] Duplicate subscriptions are handled properly
- [ ] Admin users can manage all subscriptions
- [ ] Database constraints prevent invalid data
- [ ] Performance is acceptable for large user bases
- [ ] RLS policies prevent unauthorized access

## Monitoring

### Key Metrics to Monitor
- Subscription creation success rate
- Upgrade conversion rate  
- Webhook processing errors
- Database query performance
- RLS policy violations

### Common Issues to Watch For
- PGRST116 errors (should be eliminated)
- Constraint violations (indicates data issues)
- Slow subscription queries (index problems)
- Webhook failures (RLS policy issues)

## Support

For issues related to these fixes:
1. Check the diagnostic views first
2. Run the validation test script
3. Review the application logs for detailed error information
4. Use the helper functions for common operations

The fixes provide comprehensive logging to help diagnose any remaining issues.