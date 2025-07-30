# QuoteKit Integration Test Suite

## Overview

This comprehensive integration test suite covers the complete subscription management flow from payment initiation to account page display. The tests ensure robust functionality across all critical paths, error scenarios, and performance requirements.

## Test Structure

```
tests/
├── integration/
│   ├── subscription-flow-integration-tests.md      # Comprehensive test plan
│   ├── payment-method-integration-tests.spec.ts    # Payment method tests
│   ├── webhook-processing-tests.spec.ts            # Webhook event tests
│   ├── account-page-integration-tests.spec.ts      # UI integration tests
│   └── manual-sync-tests.spec.ts                   # Sync functionality tests
├── helpers/
│   ├── test-utils.ts                                # Test utilities and factories
│   ├── supabase-mocks.ts                           # Supabase mock helpers
│   └── stripe-mocks.ts                             # Stripe mock helpers
└── README.md                                        # This file
```

## Test Categories

### 1. Payment Method Integration Tests
**File**: `payment-method-integration-tests.spec.ts`

Tests the complete payment method lifecycle:
- Payment method addition flow
- Default payment method management
- Payment method deletion
- UI integration with PaymentMethodsManager
- Error handling and validation

### 2. Webhook Processing Tests
**File**: `webhook-processing-tests.spec.ts`

Tests webhook event processing:
- Webhook signature validation
- Event idempotency handling
- Subscription lifecycle webhooks
- Checkout session processing
- Error handling and retry logic
- Performance under load

### 3. Account Page Integration Tests
**File**: `account-page-integration-tests.spec.ts`

Tests account page functionality:
- Authentication and authorization
- Subscription display logic
- Billing history display
- Payment methods display
- Real-time updates
- Mobile responsiveness

### 4. Manual Sync Tests
**File**: `manual-sync-tests.spec.ts`

Tests manual synchronization functionality:
- Sync API endpoints
- Data consistency validation
- Error recovery mechanisms
- Performance with large datasets
- Audit trail logging

## Test Utilities

### Test Factories
Located in `helpers/test-utils.ts`:
- `createMockUser()` - Generate mock user data
- `createMockSubscription()` - Generate mock subscription data
- `createMockProduct()` - Generate mock product data
- `createMockPrice()` - Generate mock price data
- `createMockRequest()` - Generate mock Next.js requests

### Mock Clients
Located in `helpers/supabase-mocks.ts` and `helpers/stripe-mocks.ts`:
- Complete Supabase client mocking
- Complete Stripe API mocking
- Helper functions for common scenarios
- Error simulation utilities

## Running Tests

### Prerequisites
```bash
npm install
npm install --save-dev @jest/globals @testing-library/react @testing-library/user-event
```

### Individual Test Suites
```bash
# Payment method tests
npm test payment-method-integration-tests

# Webhook processing tests
npm test webhook-processing-tests

# Account page tests
npm test account-page-integration-tests

# Manual sync tests
npm test manual-sync-tests
```

### All Integration Tests
```bash
npm test integration/
```

### Test Coverage
```bash
npm run test:coverage
```

## Test Configuration

### Jest Configuration
Add to `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  moduleNameMapping: {
    '@/(.*)': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Setup
Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { setupTestEnvironment } from './helpers/test-utils';

beforeAll(() => {
  setupTestEnvironment();
});

afterAll(() => {
  cleanupTestEnvironment();
});
```

## Test Data Management

### Database Setup
For integration tests with real database:
```typescript
beforeEach(async () => {
  await truncateTable('subscriptions');
  await truncateTable('stripe_customers');
  await truncateTable('stripe_webhook_events');
  await seedTestData();
});
```

### Mock Data Consistency
All mock factories ensure consistent data relationships:
- User IDs reference valid users
- Subscription IDs match Stripe format
- Price IDs reference existing products
- Customer IDs are properly mapped

## Error Testing Scenarios

### Stripe API Errors
```typescript
// Test Stripe API failures
mockStripeError(mockStripe, 'subscriptions.retrieve', StripeErrors.RESOURCE_NOT_FOUND);
mockStripeTimeout(mockStripe, 'customers.list', 5000);
```

### Database Errors
```typescript
// Test database constraint violations
mockDatabaseError(mockSupabase, 'subscriptions', 'insert', {
  code: '23505',
  message: 'duplicate key value violates unique constraint'
});
```

### Network Errors
```typescript
// Test network timeouts
mockSupabase.from('subscriptions').select.mockImplementation(() =>
  simulateError('Network timeout', 10000)
);
```

## Performance Testing

### Load Testing
```typescript
describe('Performance Tests', () => {
  it('should handle 1000 concurrent webhook events', async () => {
    const events = Array.from({ length: 1000 }, createMockStripeEvent);
    const promises = events.map(event => processWebhookEvent(event));
    
    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(30000); // Complete within 30 seconds
  });
});
```

### Memory Testing
```typescript
it('should not leak memory during large operations', () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Perform memory-intensive operation
  processLargeDataset();
  
  global.gc(); // Force garbage collection
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
});
```

## Continuous Integration

### GitHub Actions
Add to `.github/workflows/test.yml`:
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}
          
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Verbose Output
```bash
npm test -- --verbose --detectOpenHandles
```

### Debug Specific Test
```bash
npm test -- --testNamePattern="should process subscription webhook"
```

### Test with Debugger
```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## Best Practices

### Test Isolation
- Each test should be completely independent
- Use beforeEach/afterEach for setup/cleanup
- Mock all external dependencies
- Avoid shared state between tests

### Descriptive Test Names
```typescript
// Good
it('should update subscription display after successful plan change', () => {});

// Bad
it('should work', () => {});
```

### Comprehensive Assertions
```typescript
// Test all aspects of the result
expect(result.success).toBe(true);
expect(result.subscription).toBeDefined();
expect(result.subscription.status).toBe('active');
expect(result.subscription.stripe_price_id).toBe('price_new');
```

### Error Message Testing
```typescript
// Verify error messages are user-friendly
expect(result.error).toBe('No payment methods found. Please add a payment method.');
expect(result.error).not.toContain('PGRST116'); // Don't expose internal codes
```

## Monitoring and Alerts

### Test Metrics
Track key metrics:
- Test execution time
- Test failure rates
- Coverage percentages
- Flaky test detection

### Alerts
Set up alerts for:
- Test suite failure
- Coverage drop below threshold
- Performance regression
- High flaky test rate

## Contributing

### Adding New Tests
1. Follow existing patterns in test structure
2. Use provided mock factories
3. Include both happy path and error scenarios
4. Add performance considerations
5. Update this README if adding new test categories

### Test Review Checklist
- [ ] Tests are independent and isolated
- [ ] All code paths are covered
- [ ] Error scenarios are tested
- [ ] Performance implications considered
- [ ] Mock data is realistic
- [ ] Test names are descriptive
- [ ] Documentation is updated

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase Jest timeout: `jest.setTimeout(30000)`
- Check for unresolved promises
- Verify all mocks are properly configured

**Mock not working:**
- Ensure mocks are imported before the modules they mock
- Check mock reset/clear in beforeEach/afterEach
- Verify mock function signatures match real implementations

**Database connection errors:**
- Ensure test database is running
- Check environment variables
- Verify database permissions

**Memory leaks:**
- Use `--detectOpenHandles` flag
- Ensure all async operations complete
- Clean up timers, intervals, and event listeners

For additional help, see the test-specific documentation in each spec file or contact the development team.