# Testing Strategy - Edge Functions Cost Optimization

## CRITICAL ANALYSIS: Testing Gaps Identified

**⚠️ This comprehensive testing strategy addresses significant gaps found in the current edge functions implementation plan.**

### Key Findings from Documentation Review:

1. **Missing Baseline Measurements**: No current performance baselines established for comparison
2. **Incomplete Test Coverage**: Testing mentions are scattered without systematic approach
3. **Unmeasured Success Metrics**: Cost reduction claims (45-60%) lack validation framework
4. **No QuoteKit Integration Testing**: Missing tests for complex auth and feature enforcement
5. **Insufficient Load Testing**: No comprehensive performance testing under realistic conditions

---

## Executive Summary

This testing strategy provides a comprehensive framework to validate the claimed benefits of Edge Functions implementation:

- **45-60% Cost Reduction** → Measurable cost tracking and validation
- **50% API Call Reduction** → Request counting and optimization verification  
- **30% Response Time Improvement** → Performance benchmarking with baselines
- **Authentication Integration** → Testing with existing QuoteKit auth patterns
- **Database RPC Compatibility** → Validation of existing function calls

---

## Phase 1: Baseline Performance Measurement

### 1.1 Current State Performance Benchmarking

**Timeline**: Week 0 (Pre-implementation)  
**Objective**: Establish measurable baselines for all success metrics

#### Critical Baseline Metrics to Capture:

```typescript
// Baseline Performance Measurement Framework
interface BaselineMetrics {
  // API Performance Baselines
  subscriptionOperations: {
    averageApiCalls: number      // Target: 5-7 calls currently
    averageResponseTime: number  // Target: ~800ms currently  
    p95ResponseTime: number      // Target: ~1200ms currently
    errorRate: number           // Target: <0.1% currently
  }
  
  // Quote Processing Baselines
  quoteGeneration: {
    averageApiCalls: number      // Target: 8-12 calls currently
    averageProcessingTime: number // Target: ~2500ms currently
    p95ProcessingTime: number    // Target: ~4000ms currently
    pdfGenerationTime: number    // Target: ~800ms currently
    emailDeliveryTime: number    // Target: ~300ms currently
  }
  
  // Admin Dashboard Baselines
  adminAnalytics: {
    dashboardLoadTime: number    // Target: ~1500ms currently
    dbQueryCount: number         // Target: 15-20 queries currently
    dataTransferSize: number     // Target: ~500KB currently
    cacheHitRate: number        // Target: ~30% currently
  }
  
  // Cost Baselines (Monthly)
  costMetrics: {
    vercelHosting: number        // Target: $50-100 currently
    bandwidthCosts: number       // Target: $15-25 currently
    databaseCosts: number        // Target: $25 currently
    monitoringCosts: number      // Target: $10-15 currently
    totalMonthlyCost: number     // Target: $100-165 currently
  }
}
```

#### Baseline Collection Implementation:

```bash
# Pre-Implementation Baseline Collection Script
#!/bin/bash

echo "🔍 Collecting QuoteKit Performance Baselines..."

# 1. API Response Time Collection
echo "📊 Measuring Current API Performance..."
curl -w "@curl-format.txt" -s -o /dev/null \
  -H "Authorization: Bearer $TEST_JWT" \
  https://quotekit.app/api/subscription/status

# 2. Database Query Performance
echo "🗄️ Measuring Database Performance..."
psql $DATABASE_URL -c "
  EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
  SELECT * FROM subscriptions 
  JOIN stripe_prices ON subscriptions.stripe_price_id = stripe_prices.id 
  WHERE user_id = '$TEST_USER_ID';
" > baseline_db_performance.json

# 3. Current Cost Tracking
echo "💰 Collecting Current Cost Data..."
node scripts/collect-cost-baseline.js

# 4. Load Testing Current System
echo "⚡ Running Load Tests on Current System..."
k6 run --out json=baseline_load_test.json baseline-load-test.js
```

### 1.2 Authentication Integration Baseline Testing

**Objective**: Validate Edge Functions work with QuoteKit's complex auth patterns

```typescript
// Authentication Baseline Test Suite
describe('QuoteKit Authentication Integration', () => {
  test('Current JWT validation patterns', async () => {
    const token = await generateTestJWT('user-123', ['subscription:manage'])
    const response = await fetch('/api/subscription/status', {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(response.status).toBe(200)
    
    // Record baseline performance
    recordMetric('auth_validation_time', response.timing)
  })
  
  test('Feature access control patterns', async () => {
    const userToken = await generateTestJWT('user-123', ['basic:access'])
    const adminToken = await generateTestJWT('admin-456', ['admin:full'])
    
    // Test current feature enforcement
    const userResponse = await testFeatureAccess(userToken, 'admin:analytics')
    const adminResponse = await testFeatureAccess(adminToken, 'admin:analytics')
    
    expect(userResponse.hasAccess).toBe(false)
    expect(adminResponse.hasAccess).toBe(true)
  })
  
  test('Database RPC function calls', async () => {
    const startTime = performance.now()
    
    // Test existing functions that Edge Functions must call
    const quoteNumber = await supabase.rpc('generate_quote_number', { 
      user_uuid: 'user-123' 
    })
    const usage = await supabase.rpc('increment_usage', { 
      p_user_id: 'user-123', 
      p_usage_type: 'quotes_created', 
      p_amount: 1 
    })
    
    const endTime = performance.now()
    
    recordMetric('rpc_function_time', endTime - startTime)
    expect(quoteNumber.data).toBeTruthy()
    expect(usage.error).toBeNull()
  })
})
```

---

## Phase 2: Unit Testing Framework

### 2.1 Edge Function Unit Tests

**Target Coverage**: 95% unit test coverage for all Edge Functions  
**Timeline**: Developed parallel with each sprint

```typescript
// Comprehensive Unit Test Framework
import { assertEquals, assertExists } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { MockDatabase, MockStripe, createMockRequest } from '../tests/setup.ts'

// Subscription Manager Unit Tests
Deno.test('Subscription Manager - Get Status', async () => {
  const mockDb = new MockDatabase()
  mockDb.setMockData('subscriptions', [{
    id: 'sub_123',
    user_id: 'user-123',
    status: 'active',
    stripe_price_id: 'price_123'
  }])
  
  const request = createMockRequest('POST', {
    action: 'get-subscription',
    userId: 'user-123'
  })
  
  const startTime = performance.now()
  const response = await subscriptionManager(request)
  const endTime = performance.now()
  
  assertEquals(response.status, 200)
  const data = await response.json()
  assertExists(data.subscription)
  
  // Performance assertion
  const responseTime = endTime - startTime
  assert(responseTime < 400, `Response time ${responseTime}ms exceeds 400ms target`)
  
  // Cost tracking
  recordTestCost('subscription_manager', responseTime)
})

// Quote Processor Unit Tests
Deno.test('Quote Processor - PDF Generation', async () => {
  const input = {
    clientData: { name: 'Test Client', email: 'test@example.com' },
    lineItems: [{ description: 'Test Item', quantity: 1, unitPrice: 100 }],
    settings: { includesTax: false }
  }
  
  const request = createMockRequest('POST', input)
  
  const startTime = performance.now()
  const response = await quoteProcessor(request)
  const endTime = performance.now()
  
  assertEquals(response.status, 200)
  const result = await response.json()
  
  assertExists(result.quote)
  assertExists(result.pdfBuffer)
  
  // Performance assertions
  const processingTime = endTime - startTime
  assert(processingTime < 1200, `Processing time ${processingTime}ms exceeds 1.2s target`)
  
  // PDF validation
  assert(result.pdfBuffer.length > 1000, 'PDF buffer too small')
})

// Admin Analytics Unit Tests
Deno.test('Admin Analytics - Cache Performance', async () => {
  const query = {
    metrics: ['user_count', 'revenue'],
    dateRange: { start: '2025-01-01', end: '2025-01-31' }
  }
  
  const request = createMockRequest('POST', query)
  
  // First call (cache miss)
  const startTime1 = performance.now()
  const response1 = await adminAnalytics(request)
  const endTime1 = performance.now()
  
  // Second call (cache hit)
  const startTime2 = performance.now()
  const response2 = await adminAnalytics(request)
  const endTime2 = performance.now()
  
  assertEquals(response1.status, 200)
  assertEquals(response2.status, 200)
  
  const cacheMissTime = endTime1 - startTime1
  const cacheHitTime = endTime2 - startTime2
  
  // Cache performance validation
  assert(cacheHitTime < cacheMissTime * 0.2, 'Cache not providing expected speedup')
  assert(cacheHitTime < 100, 'Cache hit time too slow')
})
```

### 2.2 QuoteKit Integration Unit Tests

```typescript
// QuoteKit-Specific Integration Tests
Deno.test('Feature Access Integration', async () => {
  const mockAuth = createMockAuthContext('user-123', 'premium')
  
  // Test feature enforcement integration
  const featureCheck = await checkFeatureAccess(mockAuth, 'unlimited_quotes')
  assertEquals(featureCheck.hasAccess, true)
  
  // Test usage increment
  const usageResult = await incrementUsage(mockAuth.userId, 'quotes_created', 1)
  assertEquals(usageResult.success, true)
})

Deno.test('Admin Role Integration', async () => {
  const adminAuth = createMockAuthContext('admin-456', 'admin')
  
  // Test admin detection via admin_users table
  const isAdmin = await checkAdminStatus(adminAuth.userId)
  assertEquals(isAdmin, true)
  
  // Test admin analytics access
  const analyticsAccess = await checkAnalyticsAccess(adminAuth)
  assertEquals(analyticsAccess.hasAccess, true)
})

Deno.test('Global Items Tier Integration', async () => {
  const userAuth = createMockAuthContext('user-123', 'basic')
  
  // Test global items tier restrictions
  const tierAccess = await checkGlobalItemsAccess(userAuth)
  assertEquals(tierAccess.tier, 'basic')
  assertEquals(tierAccess.maxItems, 50)
})
```

---

## Phase 3: Integration Testing Strategy

### 3.1 End-to-End Integration Tests

**Objective**: Validate complete workflows through Edge Functions

```typescript
// End-to-End Test Suite
describe('Complete User Journey Integration', () => {
  test('Full Subscription Workflow', async () => {
    const testUser = await createTestUser()
    const authToken = await generateJWT(testUser.id)
    
    // Test complete subscription journey
    const workflow = new WorkflowTest([
      'authenticate_user',
      'check_current_subscription', 
      'create_checkout_session',
      'process_webhook_payment',
      'validate_subscription_active',
      'check_feature_access'
    ])
    
    const startTime = performance.now()
    const results = await workflow.execute(authToken)
    const endTime = performance.now()
    
    // Validate each step succeeded
    results.forEach(result => {
      expect(result.success).toBe(true)
      expect(result.responseTime).toBeLessThan(result.targetTime)
    })
    
    // Overall performance validation
    const totalTime = endTime - startTime
    expect(totalTime).toBeLessThan(2000) // 2 second max for full workflow
    
    // Cost tracking
    const totalCost = results.reduce((sum, result) => sum + result.cost, 0)
    recordMetric('full_subscription_workflow_cost', totalCost)
  })
  
  test('Complete Quote Generation Workflow', async () => {
    const testUser = await createTestUser('premium')
    const authToken = await generateJWT(testUser.id)
    
    const quoteData = generateTestQuoteData()
    
    // Single API call to generate complete quote
    const response = await fetch('/functions/v1/quote-processor', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quoteData)
    })
    
    expect(response.status).toBe(200)
    
    const result = await response.json()
    expect(result.success).toBe(true)
    expect(result.data.quote).toBeTruthy()
    expect(result.data.pdfUrl).toBeTruthy()
    
    // Validate PDF was created and stored
    const pdfResponse = await fetch(result.data.pdfUrl)
    expect(pdfResponse.status).toBe(200)
    expect(pdfResponse.headers.get('content-type')).toBe('application/pdf')
    
    // Validate email was sent
    const emailLogs = await checkEmailDeliveryLogs(testUser.email)
    expect(emailLogs.length).toBe(1)
    expect(emailLogs[0].subject).toContain('Quote')
  })
})
```

### 3.2 Database Integration Testing

```typescript
// Database Integration Test Suite  
describe('Database Integration', () => {
  test('RPC Function Compatibility', async () => {
    // Test all existing RPC functions still work
    const rpcTests = [
      { name: 'generate_quote_number', params: { user_uuid: 'user-123' } },
      { name: 'increment_usage', params: { p_user_id: 'user-123', p_usage_type: 'quotes_created', p_amount: 1 } },
      { name: 'get_current_usage', params: { p_user_id: 'user-123' } },
      { name: 'get_analytics_data', params: { start_date: '2025-01-01', end_date: '2025-01-31' } }
    ]
    
    for (const test of rpcTests) {
      const startTime = performance.now()
      const result = await supabase.rpc(test.name, test.params)
      const endTime = performance.now()
      
      expect(result.error).toBeNull()
      expect(result.data).toBeTruthy()
      
      const responseTime = endTime - startTime
      recordMetric(`rpc_${test.name}_time`, responseTime)
    }
  })
  
  test('Connection Pool Performance', async () => {
    // Test concurrent database connections
    const concurrentQueries = Array(50).fill().map((_, i) => 
      supabase.from('subscriptions').select('*').eq('user_id', `user-${i}`)
    )
    
    const startTime = performance.now()
    const results = await Promise.all(concurrentQueries)
    const endTime = performance.now()
    
    // Validate all queries succeeded
    results.forEach(result => {
      expect(result.error).toBeNull()
    })
    
    const totalTime = endTime - startTime
    const avgTimePerQuery = totalTime / concurrentQueries.length
    
    expect(avgTimePerQuery).toBeLessThan(100) // Less than 100ms per query
    recordMetric('concurrent_db_query_performance', avgTimePerQuery)
  })
})
```

---

## Phase 4: Performance Testing & Benchmarking

### 4.1 Load Testing Strategy

**Tool**: K6 for load testing  
**Objective**: Validate performance under realistic load

```javascript
// K6 Load Testing Script
import http from 'k6/http'
import { check } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

// Custom metrics
const edgeFunctionCalls = new Counter('edge_function_calls')
const edgeFunctionFailures = new Rate('edge_function_failures')
const edgeFunctionDuration = new Trend('edge_function_duration')

export let options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 100 },  // Normal load
    { duration: '2m', target: 200 },  // Peak load
    { duration: '3m', target: 100 },  // Scale down
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% of requests under 400ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    edge_function_duration: ['p(95)<500'], // Edge functions under 500ms
  }
}

export default function() {
  // Test subscription manager
  let subscriptionResponse = http.post('https://project.functions.supabase.co/subscription-manager', 
    JSON.stringify({ action: 'get-subscription', userId: 'test-user' }), 
    { headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_JWT}`
    }}
  )
  
  check(subscriptionResponse, {
    'subscription status is 200': (r) => r.status === 200,
    'subscription response time < 400ms': (r) => r.timings.duration < 400,
  })
  
  edgeFunctionCalls.add(1)
  edgeFunctionDuration.add(subscriptionResponse.timings.duration)
  
  if (subscriptionResponse.status !== 200) {
    edgeFunctionFailures.add(1)
  }
  
  // Test quote processor
  let quoteResponse = http.post('https://project.functions.supabase.co/quote-processor',
    JSON.stringify({
      clientData: { name: 'Load Test Client', email: 'test@example.com' },
      lineItems: [{ description: 'Test Item', quantity: 1, unitPrice: 100 }],
      settings: { includesTax: false }
    }),
    { headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_JWT}`
    }}
  )
  
  check(quoteResponse, {
    'quote processor status is 200': (r) => r.status === 200,
    'quote processing time < 1200ms': (r) => r.timings.duration < 1200,
  })
  
  edgeFunctionCalls.add(1)
  edgeFunctionDuration.add(quoteResponse.timings.duration)
}
```

### 4.2 Performance Benchmark Validation

```typescript
// Performance Benchmark Validation Framework
class PerformanceBenchmarkValidator {
  private baselines: BaselineMetrics
  private currentMetrics: CurrentMetrics
  
  constructor(baselines: BaselineMetrics) {
    this.baselines = baselines
    this.currentMetrics = new CurrentMetrics()
  }
  
  async validateCostReduction(): Promise<ValidationResult> {
    const currentMonthlyCost = await this.calculateCurrentMonthlyCost()
    const baselineMonthlyCost = this.baselines.costMetrics.totalMonthlyCost
    
    const costReduction = (baselineMonthlyCost - currentMonthlyCost) / baselineMonthlyCost
    const percentageReduction = costReduction * 100
    
    return {
      metric: 'cost_reduction',
      target: 45, // 45-60% reduction target
      achieved: percentageReduction,
      passed: percentageReduction >= 45,
      baseline: baselineMonthlyCost,
      current: currentMonthlyCost,
      improvement: `${percentageReduction.toFixed(1)}% cost reduction`
    }
  }
  
  async validateApiCallReduction(): Promise<ValidationResult> {
    const subscriptionCallReduction = this.calculateApiCallReduction('subscription')
    const quoteCallReduction = this.calculateApiCallReduction('quote')
    
    const overallReduction = (subscriptionCallReduction + quoteCallReduction) / 2
    
    return {
      metric: 'api_call_reduction', 
      target: 50, // 50% API call reduction
      achieved: overallReduction,
      passed: overallReduction >= 50,
      details: {
        subscription: `${this.baselines.subscriptionOperations.averageApiCalls} → 1 call`,
        quote: `${this.baselines.quoteGeneration.averageApiCalls} → 1 call`
      }
    }
  }
  
  async validateResponseTimeImprovement(): Promise<ValidationResult> {
    const subscriptionImprovement = this.calculateResponseTimeImprovement('subscription')
    const quoteImprovement = this.calculateResponseTimeImprovement('quote')
    const analyticsImprovement = this.calculateResponseTimeImprovement('analytics')
    
    const overallImprovement = (subscriptionImprovement + quoteImprovement + analyticsImprovement) / 3
    
    return {
      metric: 'response_time_improvement',
      target: 30, // 30% response time improvement  
      achieved: overallImprovement,
      passed: overallImprovement >= 30,
      details: {
        subscription: `${this.baselines.subscriptionOperations.averageResponseTime}ms → ${this.currentMetrics.subscriptionResponseTime}ms`,
        quote: `${this.baselines.quoteGeneration.averageProcessingTime}ms → ${this.currentMetrics.quoteProcessingTime}ms`,
        analytics: `${this.baselines.adminAnalytics.dashboardLoadTime}ms → ${this.currentMetrics.analyticsLoadTime}ms`
      }
    }
  }
}
```

---

## Phase 5: Production Monitoring & Validation

### 5.1 Real-time Performance Monitoring

```typescript
// Production Performance Monitor
class ProductionPerformanceMonitor {
  private metrics: Map<string, MetricSeries> = new Map()
  
  async trackEdgeFunctionPerformance(
    functionName: string,
    executionTime: number,
    success: boolean,
    region: string
  ): Promise<void> {
    const metric = {
      timestamp: new Date(),
      functionName,
      executionTime,
      success,
      region,
      cost: this.calculateFunctionCost(executionTime)
    }
    
    // Send to PostHog
    await this.sendToPostHog('edge_function_performance', metric)
    
    // Update internal metrics
    this.updateInternalMetrics(functionName, metric)
    
    // Check performance thresholds
    await this.checkPerformanceThresholds(functionName, metric)
  }
  
  async generateDailyPerformanceReport(): Promise<PerformanceReport> {
    const report = {
      date: new Date().toISOString().split('T')[0],
      functions: {},
      costs: {},
      performance: {},
      alerts: []
    }
    
    for (const [functionName, metrics] of this.metrics) {
      const dailyMetrics = this.getDailyMetrics(metrics)
      
      report.functions[functionName] = {
        totalCalls: dailyMetrics.totalCalls,
        averageResponseTime: dailyMetrics.averageResponseTime,
        errorRate: dailyMetrics.errorRate,
        totalCost: dailyMetrics.totalCost
      }
      
      // Check against targets
      if (dailyMetrics.averageResponseTime > this.getTargetResponseTime(functionName)) {
        report.alerts.push({
          type: 'PERFORMANCE_DEGRADATION',
          function: functionName,
          actual: dailyMetrics.averageResponseTime,
          target: this.getTargetResponseTime(functionName)
        })
      }
      
      if (dailyMetrics.totalCost > this.getDailyCostBudget(functionName)) {
        report.alerts.push({
          type: 'COST_OVERRUN',
          function: functionName,
          actual: dailyMetrics.totalCost,
          budget: this.getDailyCostBudget(functionName)
        })
      }
    }
    
    return report
  }
}
```

### 5.2 Cost Monitoring & Alerts

```typescript
// Cost Monitoring System
class CostMonitor {
  private dailyBudgets = {
    subscription_manager: 2.00, // $2/day budget
    quote_processor: 5.00,      // $5/day budget  
    admin_analytics: 1.00,      // $1/day budget
    webhook_handler: 0.50,      // $0.50/day budget
    batch_processor: 1.00       // $1/day budget
  }
  
  async trackDailyCosts(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    
    for (const [functionName, budget] of Object.entries(this.dailyBudgets)) {
      const dailyCost = await this.getDailyCost(functionName, today)
      const utilizationPercent = (dailyCost / budget) * 100
      
      if (utilizationPercent > 80) {
        await this.sendCostAlert({
          function: functionName,
          dailyCost,
          budget,
          utilizationPercent,
          severity: utilizationPercent > 100 ? 'HIGH' : 'MEDIUM'
        })
      }
      
      // Record for reporting
      await this.recordCostMetric(functionName, dailyCost, budget)
    }
  }
  
  async generateMonthlyCostValidation(): Promise<CostValidationReport> {
    const monthlyActualCost = await this.getMonthlyActualCost()
    const baselineMonthlyCost = 125 // Average baseline cost
    const targetMonthlyCost = 65   // Target cost (45% reduction)
    
    const actualReduction = ((baselineMonthlyCost - monthlyActualCost) / baselineMonthlyCost) * 100
    
    return {
      baselineCost: baselineMonthlyCost,
      actualCost: monthlyActualCost,
      targetCost: targetMonthlyCost,
      actualReduction: actualReduction,
      targetReduction: 45,
      validationPassed: actualReduction >= 45,
      savings: baselineMonthlyCost - monthlyActualCost,
      recommendation: actualReduction < 45 
        ? 'Cost reduction target not met. Review function usage patterns and optimization opportunities.'
        : 'Cost reduction target achieved. Continue monitoring for consistency.'
    }
  }
}
```

---

## Phase 6: Continuous Integration Testing

### 6.1 Automated Test Pipeline

```yaml
# .github/workflows/edge-functions-testing.yml
name: Edge Functions Comprehensive Testing

on:
  push:
    branches: [main, develop]
    paths: ['supabase/functions/**']
  pull_request:
    paths: ['supabase/functions/**']

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.38.x
      
      - name: Run Unit Tests
        run: |
          cd supabase/functions
          deno test --allow-all --coverage=coverage tests/unit/
      
      - name: Generate Coverage Report
        run: |
          cd supabase/functions  
          deno coverage coverage --html
          deno coverage coverage --lcov > coverage.lcov
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: supabase/functions/coverage.lcov
          fail_ci_if_error: true
          
      - name: Coverage Threshold Check
        run: |
          cd supabase/functions
          COVERAGE=$(deno coverage coverage | grep -o '[0-9]*\.[0-9]*%' | head -1 | sed 's/%//')
          if (( $(echo "$COVERAGE < 95" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 95% threshold"
            exit 1
          fi

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
      - uses: supabase/setup-cli@v1
      
      - name: Start Supabase Local
        run: supabase start
      
      - name: Run Integration Tests
        run: |
          cd supabase/functions
          deno test --allow-all tests/integration/
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          
      - name: QuoteKit Auth Integration Tests
        run: |
          cd supabase/functions
          deno test --allow-all tests/quotekit-integration/
          
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6-action@v1
      
      - name: Deploy Functions to Staging
        run: |
          supabase functions deploy --project-ref ${{ secrets.STAGING_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Run Performance Tests
        run: k6 run --out json=performance-results.json tests/performance/load-test.js
        env:
          STAGING_URL: https://${{ secrets.STAGING_PROJECT_ID }}.functions.supabase.co
          TEST_JWT: ${{ secrets.TEST_JWT }}
          
      - name: Validate Performance Targets
        run: node tests/performance/validate-targets.js performance-results.json
        
      - name: Performance Regression Check
        run: |
          # Compare with baseline performance
          node tests/performance/regression-check.js \
            performance-results.json \
            baseline-performance.json

  cost-validation:
    name: Cost Validation Tests  
    runs-on: ubuntu-latest
    needs: performance-tests
    steps:
      - uses: actions/checkout@v4
      
      - name: Simulate Cost Under Load
        run: node tests/cost/simulate-monthly-cost.js
        env:
          ESTIMATED_MONTHLY_CALLS: 500000
          
      - name: Validate Cost Targets
        run: |
          ESTIMATED_COST=$(cat cost-simulation-results.json | jq '.estimatedMonthlyCost')
          TARGET_COST=65
          
          if (( $(echo "$ESTIMATED_COST > $TARGET_COST" | bc -l) )); then
            echo "Estimated cost $ESTIMATED_COST exceeds target $TARGET_COST"
            exit 1
          fi
          
          echo "✅ Cost target validation passed: $ESTIMATED_COST <= $TARGET_COST"
```

### 6.2 Deployment Validation Tests

```typescript
// Post-Deployment Validation Suite
class DeploymentValidator {
  async validateDeployment(): Promise<ValidationReport> {
    const results = await Promise.all([
      this.validateFunctionHealth(),
      this.validatePerformanceTargets(), 
      this.validateCostTargets(),
      this.validateAuthenticationIntegration(),
      this.validateDatabaseIntegration()
    ])
    
    return {
      timestamp: new Date(),
      overallStatus: results.every(r => r.passed) ? 'PASSED' : 'FAILED',
      results,
      recommendations: this.generateRecommendations(results)
    }
  }
  
  private async validateFunctionHealth(): Promise<ValidationResult> {
    const functions = ['subscription-manager', 'quote-processor', 'admin-analytics']
    const healthChecks = await Promise.all(
      functions.map(func => this.checkFunctionHealth(func))
    )
    
    return {
      test: 'function_health',
      passed: healthChecks.every(check => check.healthy),
      details: healthChecks
    }
  }
  
  private async validatePerformanceTargets(): Promise<ValidationResult> {
    const performanceTests = [
      { function: 'subscription-manager', target: 400, actual: await this.getAverageResponseTime('subscription-manager') },
      { function: 'quote-processor', target: 1200, actual: await this.getAverageResponseTime('quote-processor') },  
      { function: 'admin-analytics', target: 600, actual: await this.getAverageResponseTime('admin-analytics') }
    ]
    
    return {
      test: 'performance_targets',
      passed: performanceTests.every(test => test.actual <= test.target),
      details: performanceTests
    }
  }
  
  private async validateCostTargets(): Promise<ValidationResult> {
    const estimatedMonthlyCost = await this.estimateMonthlyCost()
    const targetMonthlyCost = 65
    
    return {
      test: 'cost_targets',
      passed: estimatedMonthlyCost <= targetMonthlyCost,
      details: {
        estimated: estimatedMonthlyCost,
        target: targetMonthlyCost,
        reduction: ((125 - estimatedMonthlyCost) / 125 * 100).toFixed(1) + '%'
      }
    }
  }
}
```

---

## Testing Timeline Integration

### Sprint-by-Sprint Testing Approach:

#### Sprint 1 (Weeks 1-2): Foundation Testing
- **Week 0**: Collect baseline performance metrics
- **Week 1**: Unit tests for subscription-manager function  
- **Week 2**: Integration tests with QuoteKit auth system
- **Success Criteria**: 95% unit test coverage, auth integration validated

#### Sprint 2 (Weeks 3-4): Core Function Testing  
- **Week 3**: Unit tests for quote-processor and admin-analytics
- **Week 4**: End-to-end integration testing
- **Success Criteria**: All core functions pass performance targets

#### Sprint 3 (Weeks 5-6): Advanced Feature Testing
- **Week 5**: Webhook handler and batch processor testing
- **Week 6**: Load testing and performance validation
- **Success Criteria**: System handles peak loads within targets

#### Sprint 4 (Weeks 7-8): Performance Optimization Testing
- **Week 7**: Comprehensive load testing and benchmarking
- **Week 8**: Cost validation and monitoring implementation  
- **Success Criteria**: All performance and cost targets validated

#### Sprint 5 (Weeks 9-10): Production Testing
- **Week 9**: Production deployment validation
- **Week 10**: Final cost and performance validation
- **Success Criteria**: 45-60% cost reduction achieved and sustained

#### Sprint 6 (Weeks 11-12): Monitoring & Documentation
- **Week 11**: Monitoring system validation and alerting tests
- **Week 12**: Final testing report and documentation
- **Success Criteria**: Complete testing documentation and monitoring operational

---

## Success Validation Framework

### Primary Success Metrics with Measurable Targets:

1. **Cost Reduction Target: 45-60%**
   - Baseline: $100-165/month → Target: $40-90/month
   - Validation: Monthly cost tracking with automated alerts
   - Test: Simulate full month usage and validate projected costs

2. **API Call Reduction Target: 50%+**  
   - Subscription: 5-7 calls → 1 call (85% reduction)
   - Quotes: 8-12 calls → 1 call (90% reduction)
   - Validation: Request counting and comparison with baseline

3. **Response Time Improvement Target: 30%+**
   - Subscriptions: 800ms → 400ms (50% improvement)  
   - Quotes: 2500ms → 1200ms (52% improvement)
   - Analytics: 1500ms → 600ms (60% improvement)
   - Validation: Performance monitoring with P95 tracking

4. **Function Reliability Target: 99.9%**
   - Error rate < 0.1%
   - Uptime > 99.9%
   - Validation: Continuous monitoring and alerting

5. **Authentication Integration: 100%**
   - All existing auth patterns supported
   - Feature access control maintained
   - Admin role system functional
   - Validation: Comprehensive integration test suite

---

## Risk Mitigation Through Testing

### High-Risk Areas with Testing Coverage:

1. **Cold Start Performance**
   - Risk: Initial latency impact
   - Testing: Cold start simulation and warming validation
   - Mitigation: Function warming strategies tested

2. **Database Connection Pooling**
   - Risk: Connection exhaustion under load
   - Testing: Concurrent connection load testing
   - Mitigation: Pool configuration optimization

3. **Cost Overruns**
   - Risk: Unexpected function invocation costs
   - Testing: Cost simulation under various load scenarios
   - Mitigation: Budget alerts and automatic scaling limits

4. **QuoteKit Integration Compatibility**
   - Risk: Breaking existing functionality
   - Testing: Comprehensive integration test suite
   - Mitigation: Parallel deployment and gradual migration

---

## Documentation and Reporting

### Testing Deliverables:

1. **Daily Test Reports**: Automated test results and performance metrics
2. **Weekly Performance Reviews**: Progress against targets and trends
3. **Monthly Cost Validation Reports**: Actual vs. projected costs
4. **Sprint Retrospectives**: Testing effectiveness and improvements
5. **Final Validation Report**: Complete success criteria validation

### Test Artifacts:

- Baseline performance measurements
- Test automation scripts and configurations  
- Load testing scenarios and results
- Cost simulation models and projections
- Integration test coverage reports
- Production monitoring dashboards
- Performance regression test suite

---

**Document Version**: 1.0  
**Created**: 2025-01-25  
**Owner**: QA Lead / Technical Lead  
**Review Cycle**: Weekly during implementation  
**Dependencies**: All edge functions documentation and implementation  

---

This comprehensive testing strategy ensures that the Edge Functions implementation will deliver the promised benefits with measurable validation at each stage of the 12-week implementation timeline.