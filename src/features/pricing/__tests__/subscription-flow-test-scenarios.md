# Comprehensive Subscription Flow Test Scenarios

## Overview
This document outlines comprehensive test scenarios for the subscription management system, covering all user states and edge cases for subscription assignment logic.

## Database Schema Context
Based on the clean subscription schema migration:
- **subscriptions table**: Uses `internal_id` as primary key, `id` for Stripe subscription ID
- **Free plans**: `stripe_subscription_id` is NULL, `stripe_price_id` is NULL
- **Paid plans**: Both fields populated with Stripe IDs
- **User constraints**: One active subscription per user (enforced by business logic)

## Test Categories

### 1. New User - Free Plan Selection

#### Test Scenario 1.1: First-time user selects free plan
```typescript
describe('New User Free Plan Selection', () => {
  it('should create free subscription for first-time user', async () => {
    // Setup: New authenticated user, no existing subscriptions
    const mockUser = { id: 'user-123', email: 'new@example.com' };
    
    // Action: Call handleFreePlanSelection()
    const result = await handleFreePlanSelection();
    
    // Assertions:
    // - Should create subscription with status 'active'
    // - stripe_subscription_id should be NULL
    // - stripe_price_id should be NULL
    // - current_period_end should be 1 year from now
    // - metadata should include plan_type: 'free'
    expect(result.success).toBe(true);
    expect(result.subscriptionId).toBeDefined();
  });
});
```

#### Test Scenario 1.2: Database constraint validation
```typescript
it('should handle database constraints properly', async () => {
  // Test unique constraints, foreign key relationships
  // Verify RLS policies work correctly
  // Test auto-generated internal_id
});
```

### 2. Existing Free User - Free Plan Selection

#### Test Scenario 2.1: Free user selects free plan again (idempotent)
```typescript
describe('Existing Free User', () => {
  it('should return existing subscription when free user selects free again', async () => {
    // Setup: User with existing active free subscription
    const existingSubscription = {
      internal_id: 'sub-456',
      user_id: 'user-123',
      status: 'active',
      stripe_subscription_id: null,
      stripe_price_id: null
    };
    
    // Action: Call handleFreePlanSelection() again
    const result = await handleFreePlanSelection();
    
    // Assertions:
    // - Should return existing subscription ID
    // - Should NOT create duplicate subscription
    // - Should log appropriate message
    expect(result.subscriptionId).toBe(existingSubscription.internal_id);
  });
});
```

#### Test Scenario 2.2: Free user with canceled subscription
```typescript
it('should create new subscription for user with canceled free plan', async () => {
  // Setup: User with canceled free subscription
  // Action: Select free plan again
  // Expected: New active subscription created
});
```

### 3. Paid User - Free Plan Selection (Downgrade)

#### Test Scenario 3.1: Paid user downgrades to free
```typescript
describe('Paid User Downgrade', () => {
  it('should handle paid to free downgrade via checkout', async () => {
    // Setup: User with active paid subscription
    const paidSubscription = {
      user_id: 'user-123',
      stripe_subscription_id: 'sub_stripe123',
      stripe_price_id: 'price_paid456',
      status: 'active'
    };
    
    // Action: Call changePlan() with free plan behavior
    // Note: This actually creates checkout session for cancellation
    
    // Assertions:
    // - Should cancel existing paid subscription
    // - Should redirect to checkout for cancellation confirmation
    // - After webhook: should create new free subscription
  });
});
```

#### Test Scenario 3.2: Subscription status transition validation
```typescript
it('should properly transition subscription statuses', async () => {
  // Test status transitions: active -> canceled -> active (free)
  // Verify timestamps are properly set
  // Check metadata preservation
});
```

### 4. Free to Paid Upgrade

#### Test Scenario 4.1: Free user upgrades to paid plan
```typescript
describe('Free to Paid Upgrade', () => {
  it('should upgrade free user to paid subscription', async () => {
    // Setup: User with free subscription
    // Action: Call changePlan() with paid price ID
    
    // Assertions:
    // - Should cancel existing free subscription
    // - Should create Stripe checkout session
    // - Should redirect to Stripe checkout
    // - After webhook: should create paid subscription
    expect(checkoutSession.url).toContain('checkout.stripe.com');
  });
});
```

#### Test Scenario 4.2: Customer creation during upgrade
```typescript
it('should create or retrieve Stripe customer during upgrade', async () => {
  // Test getOrCreateCustomer functionality
  // Verify customer record creation in stripe_customers table
  // Test idempotent customer creation
});
```

### 5. Edge Cases and Error Scenarios

#### Test Scenario 5.1: Duplicate subscription prevention
```typescript
describe('Duplicate Prevention', () => {
  it('should prevent multiple active subscriptions', async () => {
    // Setup: Create race condition simulation
    // Action: Attempt to create multiple subscriptions simultaneously
    // Expected: Only one should succeed, others should return existing
  });
  
  it('should cleanup duplicate subscriptions', async () => {
    // Test cleanupDuplicateSubscriptions function
    // Verify most recent subscription is kept
    // Verify older subscriptions are canceled
  });
});
```

#### Test Scenario 5.2: Database constraint violations
```typescript
describe('Database Integrity', () => {
  it('should handle foreign key constraint violations', async () => {
    // Test invalid price_id references
    // Test invalid user_id references
    // Verify proper error handling
  });
  
  it('should validate subscription consistency constraints', async () => {
    // Test stripe_subscription_id consistency constraint
    // Ensure id and stripe_subscription_id match when both present
  });
});
```

#### Test Scenario 5.3: Stripe API failures
```typescript
describe('External Service Failures', () => {
  it('should handle Stripe API timeouts gracefully', async () => {
    // Mock Stripe API timeout
    // Verify proper error messages
    // Test retry logic if implemented
  });
  
  it('should handle invalid Stripe configuration', async () => {
    // Test missing/invalid Stripe keys
    // Verify fallback to environment variables
    // Test configuration validation
  });
});
```

### 6. Integration Test Scenarios

#### Test Scenario 6.1: Full subscription lifecycle
```typescript
describe('Subscription Lifecycle Integration', () => {
  it('should handle complete user journey', async () => {
    // 1. New user -> Free plan
    // 2. Free -> Paid upgrade
    // 3. Paid -> Different paid plan
    // 4. Paid -> Cancellation
    // 5. Reactivation
    // Verify each step and data integrity
  });
});
```

#### Test Scenario 6.2: Webhook event processing
```typescript
describe('Webhook Integration', () => {
  it('should process Stripe webhooks correctly', async () => {
    // Test subscription.created webhook
    // Test subscription.updated webhook  
    // Test subscription.deleted webhook
    // Verify database synchronization
  });
});
```

### 7. Performance and Concurrency Tests

#### Test Scenario 7.1: Concurrent subscription operations
```typescript
describe('Concurrency Tests', () => {
  it('should handle concurrent subscription requests', async () => {
    // Simulate multiple users subscribing simultaneously
    // Test database lock handling
    // Verify no race conditions in subscription creation
  });
});
```

#### Test Scenario 7.2: Large dataset performance
```typescript
describe('Performance Tests', () => {
  it('should perform well with large subscription datasets', async () => {
    // Test with thousands of subscriptions
    // Verify index usage
    // Check query performance
  });
});
```

## Test Data Setup

### Mock Data Factories
```typescript
// User factory
const createMockUser = (overrides = {}) => ({
  id: uuid(),
  email: 'test@example.com',
  ...overrides
});

// Subscription factory
const createMockSubscription = (type = 'free', overrides = {}) => ({
  internal_id: uuid(),
  user_id: uuid(),
  status: 'active',
  stripe_subscription_id: type === 'paid' ? 'sub_' + uuid() : null,
  stripe_price_id: type === 'paid' ? 'price_' + uuid() : null,
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides
});

// Stripe customer factory
const createMockStripeCustomer = (overrides = {}) => ({
  user_id: uuid(),
  stripe_customer_id: 'cus_' + uuid(),
  email: 'customer@example.com',
  ...overrides
});
```

## Test Environment Setup

### Database Test Setup
```typescript
beforeEach(async () => {
  // Clean database state
  await supabaseAdminClient.from('subscriptions').delete().neq('id', '');
  await supabaseAdminClient.from('stripe_customers').delete().neq('user_id', '');
  
  // Set up test data
  await seedTestData();
});
```

### Stripe Mock Setup
```typescript
// Mock Stripe responses
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      })
    }
  },
  subscriptions: {
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn()
  }
};
```

## Validation Criteria

### Success Criteria
- All subscription state transitions work correctly
- No duplicate subscriptions can be created
- Database integrity constraints are respected
- Error cases are handled gracefully
- Performance meets requirements (< 500ms for subscription operations)

### Coverage Requirements
- Unit tests: >90% code coverage
- Integration tests: Cover all user flows
- Error scenarios: All error paths tested
- Edge cases: All identified edge cases covered

## Security Test Scenarios

### Authorization Tests
```typescript
describe('Authorization', () => {
  it('should enforce RLS policies correctly', async () => {
    // Test users can only access their own subscriptions
    // Test service role has full access
    // Test anonymous users have no access
  });
});
```

### Data Validation Tests
```typescript
describe('Input Validation', () => {
  it('should validate subscription data integrity', async () => {
    // Test SQL injection prevention
    // Test invalid data type handling
    // Test required field validation
  });
});
```

This comprehensive test suite ensures robust subscription flow testing covering all scenarios, edge cases, and potential failure modes in the QuoteKit subscription system.