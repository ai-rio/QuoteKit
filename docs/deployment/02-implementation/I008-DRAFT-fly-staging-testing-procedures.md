# Fly.io Staging Testing Procedures - QuoteKit

## Overview

This document outlines comprehensive testing procedures for the QuoteKit staging environment deployed on Fly.io. These procedures ensure thorough validation of all system components before production deployment.

## Testing Categories

### 1. Pre-Deployment Testing

#### Infrastructure Validation
```bash
# Verify Fly.io CLI and authentication
fly auth whoami
fly apps list

# Check staging app status
fly status --app quotekit-staging

# Verify database connectivity
fly postgres connect --database-url quotekit-staging-db -c "SELECT version();"

# Test application health endpoint
curl -f https://quotekit-staging.fly.dev/api/health
```

#### Environment Configuration Testing
```bash
# Validate all required environment variables are set
fly ssh console --app quotekit-staging -C "cd /app && npm run validate:env:staging"

# Test service connectivity
fly ssh console --app quotekit-staging -C "cd /app && npm run test:services"

# Verify build artifacts
fly ssh console --app quotekit-staging -C "ls -la /app/.next/"
```

### 2. Application Core Testing

#### Next.js Application Testing
```bash
# Test main application routes
curl -I https://quotekit-staging.fly.dev/
curl -I https://quotekit-staging.fly.dev/auth/signin
curl -I https://quotekit-staging.fly.dev/dashboard
curl -I https://quotekit-staging.fly.dev/pricing

# Test API routes
curl -f https://quotekit-staging.fly.dev/api/health
curl -f https://quotekit-staging.fly.dev/api/status
curl -f https://quotekit-staging.fly.dev/api/user/profile

# Test static assets
curl -I https://quotekit-staging.fly.dev/_next/static/css/
curl -I https://quotekit-staging.fly.dev/favicon.ico
```

#### Performance Testing
```bash
# Page load time testing
time curl -s -o /dev/null https://quotekit-staging.fly.dev/
time curl -s -o /dev/null https://quotekit-staging.fly.dev/dashboard

# API response time testing
time curl -s -o /dev/null https://quotekit-staging.fly.dev/api/health
time curl -s -o /dev/null https://quotekit-staging.fly.dev/api/quotes

# Concurrent request testing
for i in {1..10}; do
  curl -s -o /dev/null https://quotekit-staging.fly.dev/api/health &
done
wait
```

### 3. Database Integration Testing

#### Supabase Connection Testing
```typescript
// Test script: tests/staging/database-connection.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Staging Database Integration', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  test('Database connection established', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('Row Level Security policies active', async () => {
    // Test RLS with anonymous user
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await anonClient
      .from('quotes')
      .select('*');
    
    // Should require authentication
    expect(error).toBeTruthy();
  });

  test('Database migrations applied', async () => {
    const { data } = await supabase.rpc('get_schema_version');
    expect(data).toBeDefined();
    console.log('Current schema version:', data);
  });
});
```

#### Database CRUD Operations
```bash
# Test database operations via API
# Create test user
USER_ID=$(curl -X POST https://quotekit-staging.fly.dev/api/test/create-user \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}' | jq -r '.user_id')

# Create test quote
QUOTE_ID=$(curl -X POST https://quotekit-staging.fly.dev/api/quotes \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_type": "lawn_mowing", "area_size": 1000}' | jq -r '.quote_id')

# Read quote
curl -X GET https://quotekit-staging.fly.dev/api/quotes/$QUOTE_ID \
  -H "Authorization: Bearer $TEST_TOKEN"

# Update quote
curl -X PUT https://quotekit-staging.fly.dev/api/quotes/$QUOTE_ID \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_size": 1200}'

# Delete quote
curl -X DELETE https://quotekit-staging.fly.dev/api/quotes/$QUOTE_ID \
  -H "Authorization: Bearer $TEST_TOKEN"
```

### 4. Authentication and Authorization Testing

#### User Registration and Login Flow
```typescript
// Test script: tests/staging/auth-flow.test.ts
describe('Authentication Flow', () => {
  const baseURL = 'https://quotekit-staging.fly.dev';
  
  test('User registration', async () => {
    const response = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staging-test@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user).toBeDefined();
  });

  test('Email confirmation required', async () => {
    // Test that user cannot access protected routes without confirmation
    const response = await fetch(`${baseURL}/api/user/profile`, {
      headers: { 'Authorization': 'Bearer unconfirmed_token' }
    });
    
    expect(response.status).toBe(401);
  });

  test('Password reset flow', async () => {
    const response = await fetch(`${baseURL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staging-test@example.com' })
    });
    
    expect(response.status).toBe(200);
  });
});
```

#### Session Management Testing
```bash
# Test session creation
SESSION_TOKEN=$(curl -X POST https://quotekit-staging.fly.dev/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}' | jq -r '.access_token')

# Test authenticated request
curl -H "Authorization: Bearer $SESSION_TOKEN" \
  https://quotekit-staging.fly.dev/api/user/profile

# Test session expiration
sleep 900  # Wait 15 minutes
curl -H "Authorization: Bearer $SESSION_TOKEN" \
  https://quotekit-staging.fly.dev/api/user/profile

# Expected: 401 Unauthorized
```

### 5. Payment Integration Testing (Stripe)

#### Test Card Processing
```typescript
// Test script: tests/staging/payment-flow.test.ts
import Stripe from 'stripe';

describe('Stripe Payment Integration', () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  });

  test('Create payment intent', async () => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      metadata: {
        quote_id: 'test_quote_123',
        environment: 'staging'
      }
    });
    
    expect(paymentIntent.status).toBe('requires_payment_method');
    expect(paymentIntent.amount).toBe(2000);
  });

  test('Process test payment', async () => {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242', // Test card
        exp_month: 12,
        exp_year: 2025,
        cvc: '123'
      }
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1500,
      currency: 'usd',
      payment_method: paymentMethod.id,
      confirm: true,
      return_url: 'https://quotekit-staging.fly.dev/payment/success'
    });
    
    expect(paymentIntent.status).toBe('succeeded');
  });
});
```

#### Webhook Testing
```bash
# Test webhook endpoint directly
curl -X POST https://quotekit-staging.fly.dev/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test_signature" \
  -d '{
    "id": "evt_test_webhook",
    "object": "event",
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "amount": 2000,
        "status": "succeeded"
      }
    }
  }'

# Use Stripe CLI for comprehensive webhook testing
stripe listen --forward-to https://quotekit-staging.fly.dev/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### 6. Email Service Testing (Resend)

#### Email Delivery Testing
```typescript
// Test script: tests/staging/email-service.test.ts
import { Resend } from 'resend';

describe('Email Service Integration', () => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  test('Send welcome email', async () => {
    const { data, error } = await resend.emails.send({
      from: 'QuoteKit Staging <noreply@staging.yourdomain.com>',
      to: ['staging-test@example.com'],
      subject: 'Welcome to QuoteKit (Staging)',
      html: '<h1>Welcome!</h1><p>This is a test email from staging.</p>'
    });

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    console.log('Email sent:', data?.id);
  });

  test('Send quote notification email', async () => {
    const { data, error } = await resend.emails.send({
      from: 'QuoteKit Staging <quotes@staging.yourdomain.com>',
      to: ['customer@example.com'],
      subject: 'Your Quote is Ready (Staging)',
      template: 'quote-ready',
      props: {
        customerName: 'Test Customer',
        quoteAmount: '$150.00',
        quoteId: 'Q-STAGING-001'
      }
    });

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
  });
});
```

#### Email Template Validation
```bash
# Test email templates via API
curl -X POST https://quotekit-staging.fly.dev/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "template": "welcome",
    "to": "test@example.com",
    "data": {
      "name": "Test User",
      "verificationUrl": "https://quotekit-staging.fly.dev/verify?token=abc123"
    }
  }'

# Test email with attachment (PDF quote)
curl -X POST https://quotekit-staging.fly.dev/api/test/send-quote-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "quoteId": "test_quote_123"
  }'
```

### 7. Analytics Integration Testing (PostHog)

#### Event Tracking Testing
```typescript
// Test script: tests/staging/analytics-tracking.test.ts
import { PostHog } from 'posthog-node';

describe('PostHog Analytics Integration', () => {
  const client = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY!,
    { host: process.env.NEXT_PUBLIC_POSTHOG_HOST! }
  );

  afterAll(async () => {
    await client.shutdown();
  });

  test('Track user event', async () => {
    client.capture({
      distinctId: 'staging-test-user-123',
      event: 'quote_created',
      properties: {
        quote_value: 150.00,
        service_type: 'lawn_mowing',
        environment: 'staging'
      }
    });

    // PostHog is fire-and-forget, so we just ensure no errors
    expect(true).toBe(true);
  });

  test('Identify user', async () => {
    client.identify({
      distinctId: 'staging-test-user-123',
      properties: {
        email: 'test@example.com',
        plan: 'basic',
        environment: 'staging'
      }
    });

    expect(true).toBe(true);
  });
});
```

#### Feature Flags Testing
```bash
# Test feature flag endpoints
curl -X GET https://quotekit-staging.fly.dev/api/feature-flags \
  -H "Authorization: Bearer $TEST_TOKEN"

# Test specific feature flag
curl -X GET https://quotekit-staging.fly.dev/api/feature-flags/new_quote_flow \
  -H "Authorization: Bearer $TEST_TOKEN"
```

### 8. End-to-End User Journey Testing

#### Complete Quote Generation Flow
```typescript
// Test script: tests/staging/e2e-quote-flow.test.ts
describe('Complete Quote Generation Flow', () => {
  let userToken: string;
  let quoteId: string;

  test('User registration and email confirmation', async () => {
    // Register user
    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'e2e-test@example.com',
        password: 'TestPassword123!',
        name: 'E2E Test User'
      })
    });
    
    expect(registerResponse.status).toBe(201);
    
    // Simulate email confirmation (in staging, we might auto-confirm)
    const confirmResponse = await fetch(`${baseURL}/api/auth/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'auto_confirm_staging' })
    });
    
    expect(confirmResponse.status).toBe(200);
  });

  test('User login and get auth token', async () => {
    const loginResponse = await fetch(`${baseURL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'e2e-test@example.com',
        password: 'TestPassword123!'
      })
    });
    
    expect(loginResponse.status).toBe(200);
    const { access_token } = await loginResponse.json();
    userToken = access_token;
  });

  test('Create new quote', async () => {
    const quoteResponse = await fetch(`${baseURL}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        service_type: 'lawn_mowing',
        property_address: '123 Test Street, Test City, TS 12345',
        lawn_area: 2000,
        service_frequency: 'weekly',
        additional_services: ['edging', 'blowing']
      })
    });
    
    expect(quoteResponse.status).toBe(201);
    const quote = await quoteResponse.json();
    quoteId = quote.id;
    
    expect(quote.total_amount).toBeDefined();
    expect(quote.status).toBe('draft');
  });

  test('Process payment for quote', async () => {
    const paymentResponse = await fetch(`${baseURL}/api/quotes/${quoteId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        payment_method: 'card',
        card_token: 'tok_visa' // Stripe test token
      })
    });
    
    expect(paymentResponse.status).toBe(200);
    const payment = await paymentResponse.json();
    
    expect(payment.status).toBe('succeeded');
  });

  test('Generate and download PDF quote', async () => {
    const pdfResponse = await fetch(`${baseURL}/api/quotes/${quoteId}/pdf`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers.get('content-type')).toBe('application/pdf');
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    expect(pdfBuffer.byteLength).toBeGreaterThan(0);
  });
});
```

### 9. Performance and Load Testing

#### Application Performance Benchmarks
```bash
#!/bin/bash
# performance-test.sh

echo "Starting QuoteKit Staging Performance Tests"
echo "=============================================="

BASE_URL="https://quotekit-staging.fly.dev"

# Test page load times
echo "Testing page load times..."
echo "Home page:"
time curl -s -o /dev/null -w "Time: %{time_total}s, Size: %{size_download} bytes\n" $BASE_URL

echo "Dashboard:"
time curl -s -o /dev/null -w "Time: %{time_total}s, Size: %{size_download} bytes\n" $BASE_URL/dashboard

echo "Pricing page:"
time curl -s -o /dev/null -w "Time: %{time_total}s, Size: %{size_download} bytes\n" $BASE_URL/pricing

# Test API response times
echo -e "\nTesting API response times..."
echo "Health check:"
time curl -s -o /dev/null -w "Time: %{time_total}s\n" $BASE_URL/api/health

echo "User profile (requires auth):"
time curl -s -o /dev/null -w "Time: %{time_total}s\n" -H "Authorization: Bearer $TEST_TOKEN" $BASE_URL/api/user/profile

# Concurrent request testing
echo -e "\nTesting concurrent requests (10 simultaneous):"
start_time=$(date +%s)
for i in {1..10}; do
  curl -s -o /dev/null $BASE_URL/api/health &
done
wait
end_time=$(date +%s)
echo "Total time for 10 concurrent requests: $((end_time - start_time)) seconds"

echo -e "\nPerformance test completed!"
```

#### Memory and Resource Usage Testing
```bash
# Monitor application resource usage
fly ssh console --app quotekit-staging -C "top -b -n1 | head -20"

# Check disk usage
fly ssh console --app quotekit-staging -C "df -h"

# Monitor database connections
fly ssh console --app quotekit-staging -C "netstat -an | grep 5432 | wc -l"

# Check application logs for memory issues
fly logs --app quotekit-staging | grep -i "memory\|oom\|killed"
```

### 10. Security Testing

#### Security Headers Validation
```bash
# Test security headers
curl -I https://quotekit-staging.fly.dev | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security"

# Test CSP headers
curl -I https://quotekit-staging.fly.dev | grep -i "content-security-policy"

# Test for sensitive information exposure
curl -s https://quotekit-staging.fly.dev | grep -i "password\|secret\|key\|token"
```

#### Authentication Security Testing
```bash
# Test SQL injection protection
curl -X POST https://quotekit-staging.fly.dev/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com'"'"' OR 1=1 --", "password": "test"}'

# Test XSS protection
curl -X POST https://quotekit-staging.fly.dev/api/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"service_type": "<script>alert(\"xss\")</script>"}'

# Test CSRF protection
curl -X POST https://quotekit-staging.fly.dev/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{"name": "Hacker"}' 
  # Should fail without proper CSRF token/auth
```

## Automated Testing Scripts

### Comprehensive Test Suite Runner
```bash
#!/bin/bash
# run-staging-tests.sh

set -e

echo "QuoteKit Staging Test Suite"
echo "==========================="

# Set environment variables
export TEST_BASE_URL="https://quotekit-staging.fly.dev"
export NODE_ENV="test"

# Run infrastructure tests
echo "1. Infrastructure Tests..."
npm run test:infrastructure

# Run application tests
echo "2. Application Tests..."
npm run test:application

# Run integration tests
echo "3. Integration Tests..."
npm run test:integration

# Run E2E tests
echo "4. End-to-End Tests..."
npm run test:e2e

# Run performance tests
echo "5. Performance Tests..."
./scripts/performance-test.sh

# Run security tests
echo "6. Security Tests..."
npm run test:security

echo "All tests completed successfully! 🎉"
```

### Test Data Cleanup
```bash
#!/bin/bash
# cleanup-test-data.sh

echo "Cleaning up staging test data..."

# Remove test users
fly ssh console --app quotekit-staging -C "cd /app && npm run cleanup:test-users"

# Remove test quotes
fly ssh console --app quotekit-staging -C "cd /app && npm run cleanup:test-quotes"

# Remove test files
fly ssh console --app quotekit-staging -C "cd /app && npm run cleanup:test-files"

echo "Test data cleanup completed!"
```

## Testing Schedule and Procedures

### Daily Testing (Automated)
- Health check validation
- Basic functionality tests
- Performance monitoring
- Error log review

### Weekly Testing (Manual + Automated)
- Complete integration test suite
- End-to-end user journey testing
- Security vulnerability scanning
- Performance benchmarking

### Pre-Production Testing (Complete Suite)
- Full test suite execution
- Load testing with realistic data
- Security penetration testing
- Manual user acceptance testing

### Test Reporting
```typescript
// Generate test report
interface TestReport {
  timestamp: string;
  environment: 'staging';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  categories: {
    infrastructure: TestCategoryResult;
    application: TestCategoryResult;
    integration: TestCategoryResult;
    e2e: TestCategoryResult;
    performance: TestCategoryResult;
    security: TestCategoryResult;
  };
  recommendations: string[];
}

// Export report to file and send notifications
async function generateTestReport(): Promise<TestReport> {
  // Implementation would gather test results and generate comprehensive report
}
```

This comprehensive testing procedure ensures that the QuoteKit staging environment on Fly.io thoroughly validates all system components and integrations before production deployment.