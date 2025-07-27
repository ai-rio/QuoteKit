# Stripe Checkout Mode Issue - Context Handoff

## Problem Summary

There is a persistent Stripe checkout error occurring specifically with the **Free Plan** subscription:

```
Error: You specified `payment` mode but passed a recurring price. Either switch to `subscription` mode or use only one-time prices.
```

## Current Status

### ✅ What's Working
- **Monthly Plan** (`price_1RVyAQGgBK1ooXYF0LokEHtQ`): Works correctly - uses `subscription` mode
- **Yearly Plan** (`price_1RoUo5GgBK1ooXYF4nMSQooR`): Works correctly - uses `subscription` mode
- Price transformation logic is working (verified via debug logs)
- Database contains correct real Stripe IDs

### ❌ What's Broken
- **Free Plan** (`price_1RVyAPGgBK1ooXYFwt6viuQs`): Still produces the checkout mode error

## Root Cause Analysis

### Technical Investigation Completed

1. **Database Schema**: ✅ All migrations applied, foreign keys correct
2. **Price Transformation**: ✅ Working correctly in `get-products.ts`
3. **Type Definitions**: ✅ Properly defined in `src/features/pricing/types.ts`
4. **Checkout Logic**: ✅ Using `recurring_interval` field directly to avoid serialization issues

### Key Discovery
The issue occurs because React server actions serialize/deserialize objects, causing computed fields (`type`, `interval`) to be lost. The solution was to use the direct database field `recurring_interval` in the checkout action:

```typescript
// Fixed logic in create-checkout-action.ts
const checkoutMode = price.recurring_interval ? 'subscription' : 'payment';
```

### Current Database State
```sql
-- Current state verified
SELECT stripe_price_id, unit_amount, recurring_interval, active 
FROM stripe_prices;

-- Results:
price_1RoUo5GgBK1ooXYF4nMSQooR | 19900 | year  | true  ✅ Works
price_1RVyAQGgBK1ooXYF0LokEHtQ | 1999  | month | true  ✅ Works  
price_1RVyAPGgBK1ooXYFwt6viuQs | 0     | month | true  ❌ Still fails
```

### Stripe CLI Verification
The Stripe API confirms the free plan is correctly configured as recurring:
```json
{
  "id": "price_1RVyAPGgBK1ooXYFwt6viuQs",
  "type": "recurring",
  "recurring": {
    "interval": "month",
    "trial_period_days": 7
  },
  "unit_amount": 800  // Note: Different from database (0)
}
```

## Critical Files & Components

### Primary Files to Investigate
- `src/features/pricing/actions/create-checkout-action.ts` - Checkout session creation
- `src/features/pricing/components/price-card.tsx` - Button click handler  
- `src/features/pricing/controllers/get-products.ts` - Price data transformation
- `src/features/pricing/types.ts` - Type definitions

### Database Tables
- `stripe_products` - Product information
- `stripe_prices` - Price information with `recurring_interval` field
- `subscriptions` - User subscription records

### Environment Configuration
- `.env.local` - Contains real Stripe test keys (verified working)
- Stripe webhook secret configured and working

## Debugging Tools Added

### Debug Logs Implemented
```typescript
// In get-products.ts - Shows price transformations
console.log('🔍 DEBUG: Price transformation:', {
  original_recurring_interval: price.recurring_interval,
  transformed_type: transformedPrice.type,
  stripe_price_id: price.stripe_price_id
});

// In create-checkout-action.ts - Shows checkout mode determination  
console.error(`🔍 DEBUG: Checkout mode determined: ${checkoutMode} (recurring_interval: ${price.recurring_interval})`);
```

### Debug API Route
- `GET /api/debug-prices` - Returns raw and transformed price data
- Useful for verifying data transformation pipeline

## Recommended Investigation Approach

### 1. Use Specialized Agents
**Primary Agent**: `subscription-payment-engineer`
- Has access to Stripe CLI for real-time API verification
- Specializes in subscription payment flow debugging
- Can cross-reference database vs. Stripe API states

**Secondary Agent**: `general-purpose` (if needed)
- For complex multi-step debugging across multiple files
- File system searches and code analysis

### 2. Verification Steps

#### Step 1: Confirm Stripe Configuration
```bash
stripe prices retrieve price_1RVyAPGgBK1ooXYFwt6viuQs
stripe products retrieve prod_QuDTkvDcpwjpNO
```

#### Step 2: Debug the Exact Checkout Flow
- Add more granular logging in `create-checkout-action.ts`
- Verify the exact parameters being sent to `stripe.checkout.sessions.create()`
- Check if there's a data mismatch between database and Stripe

#### Step 3: Test Free Plan Isolation
- Create a minimal test case for just the free plan
- Compare successful monthly plan vs. failing free plan requests

### 3. Potential Solutions to Explore

#### Theory 1: Database-Stripe Mismatch
The Stripe API shows `unit_amount: 800` but database has `0`. This could indicate:
- Outdated sync between Stripe and database
- Different price configurations in test vs. database

**Action**: Verify and potentially re-sync the free plan price data

#### Theory 2: Special Free Plan Handling
Free plans might require different checkout parameters:
- Different `mode` for $0 subscriptions
- Special handling for trial periods
- Different line item configuration

**Action**: Research Stripe documentation for free subscription handling

#### Theory 3: Price ID Mapping Issue
The free plan might be using a different price ID in different contexts.

**Action**: Trace the exact price ID being passed through the entire flow

## Required Context from Previous Work

### Successful Implementations
- Real Stripe IDs successfully integrated (see migration `20250726220000_update_real_stripe_ids.sql`)
- Foreign key relationships fixed (see migration `20250726221000_fix_subscription_price_fkey.sql`)
- Password authentication for test users working
- Checkout flow working for paid plans

### Architecture Notes
- Using Supabase for database with local Docker setup
- Next.js 15 with App Router and Server Actions
- Stripe integration with webhook handling
- TypeScript strict mode enabled

### Test Credentials
```
test@example.com / password123 (regular user)
admin@quotekit.dev / admin123 (admin user)  
carlos@ai.rio.br / admin123 (admin user)
```

## Expected Outcome

Fix the free plan checkout to work like the paid plans:
1. User clicks "Get Started" on Free Plan
2. Checkout session created with `mode: 'subscription'`
3. User redirected to Stripe checkout
4. Successful subscription creation for $0/month plan
5. User redirected back to account page

## Reference Documentation

- **Epic Context**: `/docs/account-stripe-integration/README.md` - Overall project context and P2 completion status
- **Stripe CLI Setup**: Already installed and logged in
- **Local Development**: Uses Docker for Supabase local instance

## Success Criteria

- [ ] Free plan checkout works without mode error
- [ ] All three plans (Free, Monthly, Yearly) work consistently  
- [ ] No regression in working paid plan functionality
- [ ] Debug logs show correct mode determination for all plans
- [ ] User can successfully subscribe to free plan and access account features

---

**Handoff Date**: 2025-07-27  
**Priority**: High - Blocking free tier user acquisition  
**Estimated Effort**: 1-2 hours (specific issue, existing debugging infrastructure)  
**Next Context Window Should**: Focus on subscription-payment-engineer agent to debug the free plan checkout flow specifically