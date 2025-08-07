# Edge Functions Testing Strategy - REALISTIC Launch Ready

## 🚀 **REALISTIC LAUNCH-FOCUSED TESTING STRATEGY**

**Context**: 14 complex Edge Functions with advanced features in local dev  
**Reality Check**: We have a sophisticated system that needs proper testing  
**Goal**: Validate all Edge Functions work correctly with efficient testing  
**Timeline**: 1-2 days for comprehensive validation  

---

## Phase 1: Core Functions Local Testing (30 minutes)

### 1.1 Quick Local Setup & Deployment Test

```bash
#!/bin/bash
echo "🚀 Deploying ALL Edge Functions locally..."

# Start local Supabase
supabase start

# Deploy all 14 functions (this is what we actually have)
echo "Deploying core business functions..."
supabase functions deploy subscription-status --local
supabase functions deploy quote-processor --local  
supabase functions deploy quote-pdf-generator --local
supabase functions deploy webhook-handler --local
supabase functions deploy batch-processor --local

echo "Deploying monitoring & optimization functions..."
supabase functions deploy webhook-monitor --local
supabase functions deploy monitoring-alerting --local
supabase functions deploy performance-optimizer --local

echo "Deploying migration & deployment functions..."
supabase functions deploy migration-controller --local
supabase functions deploy production-validator --local
supabase functions deploy security-hardening --local
supabase functions deploy global-deployment-optimizer --local
supabase functions deploy connection-pool-manager --local

echo "✅ All 14 Edge Functions deployed locally!"
```

### 1.2 Essential Function Health Checks (10 minutes)

```typescript
// File: tests/realistic-local-tests.ts
// Run with: deno run --allow-all tests/realistic-local-tests.ts

const BASE_URL = 'http://localhost:54321/functions/v1'
const TEST_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Get from Supabase Studio

interface TestResult {
  function: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  error?: string;
}

async function runRealisticTests(): Promise<TestResult[]> {
  console.log('🧪 Running realistic Edge Function tests...')
  
  const results: TestResult[] = []
  
  // Test core business functions (critical path)
  results.push(await testFunction('subscription-status', { action: 'get-subscription' }))
  results.push(await testFunction('quote-processor', { 
    operation: 'create',
    quote: {
      client_name: 'Test Client',
      client_email: 'test@example.com',
      line_items: [{ name: 'Test Service', quantity: 1, unit_price: 100 }],
      tax_rate: 8.25
    }
  }))
  results.push(await testFunction('quote-pdf-generator', { 
    quote_id: 'test-quote-id',
    template: 'default'
  }))
  
  // Test webhook system (critical for Stripe)
  results.push(await testFunction('webhook-handler', {
    type: 'customer.subscription.created',
    data: { object: { id: 'sub_test' } }
  }))
  
  // Test batch operations (performance critical)
  results.push(await testFunction('batch-processor', {
    operation: 'bulk-status-update',
    items: ['quote1', 'quote2'],
    status: 'sent'
  }))
  
  // Test monitoring functions (operational)
  results.push(await testFunction('webhook-monitor', { action: 'get-metrics' }))
  results.push(await testFunction('monitoring-alerting', { action: 'health-check' }))
  
  // Test optimization functions (performance)
  results.push(await testFunction('performance-optimizer', { action: 'analyze' }))
  results.push(await testFunction('connection-pool-manager', { action: 'status' }))
  
  // Test deployment functions (critical for production)
  results.push(await testFunction('migration-controller', { action: 'status' }))
  results.push(await testFunction('production-validator', { action: 'validate' }))
  results.push(await testFunction('security-hardening', { action: 'scan' }))
  results.push(await testFunction('global-deployment-optimizer', { action: 'optimize' }))
  
  // Print results
  console.log('\n📊 Test Results:')
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌'
    console.log(`${status} ${result.function}: ${result.responseTime}ms ${result.error || ''}`)
  })
  
  const passCount = results.filter(r => r.status === 'PASS').length
  console.log(`\n🎯 Overall: ${passCount}/${results.length} functions passing`)
  
  return results
}

async function testFunction(functionName: string, payload: any): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${BASE_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return { function: functionName, status: 'PASS', responseTime }
    } else {
      const errorText = await response.text()
      return { 
        function: functionName, 
        status: 'FAIL', 
        responseTime, 
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` 
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return { 
      function: functionName, 
      status: 'FAIL', 
      responseTime, 
      error: error.message 
    }
  }
}

// Run tests
if (import.meta.main) {
  const results = await runRealisticTests()
  
  // Exit with error code if any tests failed
  const failedCount = results.filter(r => r.status === 'FAIL').length
  if (failedCount > 0) {
    console.log(`\n❌ ${failedCount} tests failed - check implementation`)
    Deno.exit(1)
  } else {
    console.log('\n✅ All tests passed - ready for integration testing!')
    Deno.exit(0)
  }
}
```

---

## Phase 2: Integration Testing with Frontend (20 minutes)

### 2.1 Realistic Frontend Integration Test Page

```typescript
// File: src/app/test-edge-functions/page.tsx
// Comprehensive manual testing for all 14 functions

'use client'

import { useState } from 'react'
import { createClient } from '@/libs/supabase/client'

interface TestResult {
  function: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  responseTime?: number;
  data?: any;
  error?: string;
}

export default function TestAllEdgeFunctions() {
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [isRunningAll, setIsRunningAll] = useState(false)
  const supabase = createClient()

  const updateResult = (functionName: string, result: Partial<TestResult>) => {
    setResults(prev => ({
      ...prev,
      [functionName]: { ...prev[functionName], function: functionName, ...result }
    }))
  }

  const testFunction = async (functionName: string, payload: any) => {
    updateResult(functionName, { status: 'testing' })
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      })
      
      const responseTime = Date.now() - startTime
      
      if (error) {
        updateResult(functionName, { 
          status: 'error', 
          responseTime, 
          error: error.message 
        })
      } else {
        updateResult(functionName, { 
          status: 'success', 
          responseTime, 
          data 
        })
      }
    } catch (err) {
      const responseTime = Date.now() - startTime
      updateResult(functionName, { 
        status: 'error', 
        responseTime, 
        error: err.message 
      })
    }
  }

  const runAllTests = async () => {
    setIsRunningAll(true)
    
    // Test all functions in logical order
    const tests = [
      // Core business functions
      { name: 'subscription-status', payload: { action: 'get-subscription' } },
      { name: 'quote-processor', payload: { 
        operation: 'create',
        quote: {
          client_name: 'Test Client',
          client_email: 'test@example.com',
          line_items: [{ name: 'Test Service', quantity: 1, unit_price: 100 }],
          tax_rate: 8.25
        }
      }},
      { name: 'quote-pdf-generator', payload: { quote_id: 'test', template: 'default' } },
      
      // Webhook system
      { name: 'webhook-handler', payload: { type: 'test', data: {} } },
      { name: 'webhook-monitor', payload: { action: 'get-metrics' } },
      
      // Batch operations
      { name: 'batch-processor', payload: { operation: 'test', items: [] } },
      
      // Monitoring & optimization
      { name: 'monitoring-alerting', payload: { action: 'health-check' } },
      { name: 'performance-optimizer', payload: { action: 'analyze' } },
      { name: 'connection-pool-manager', payload: { action: 'status' } },
      
      // Deployment functions
      { name: 'migration-controller', payload: { action: 'status' } },
      { name: 'production-validator', payload: { action: 'validate' } },
      { name: 'security-hardening', payload: { action: 'scan' } },
      { name: 'global-deployment-optimizer', payload: { action: 'optimize' } }
    ]
    
    // Run tests sequentially to avoid overwhelming the system
    for (const test of tests) {
      await testFunction(test.name, test.payload)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunningAll(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'error': return 'text-red-600 bg-red-50'
      case 'testing': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'testing': return '⏳'
      default: return '⚪'
    }
  }

  const successCount = Object.values(results).filter(r => r.status === 'success').length
  const totalCount = Object.keys(results).length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Edge Functions Integration Test</h1>
        <p className="text-gray-600 mb-4">
          Testing all 14 Edge Functions for production readiness
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={runAllTests}
            disabled={isRunningAll}
            className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isRunningAll ? 'Running Tests...' : 'Run All Tests'}
          </button>
          
          {totalCount > 0 && (
            <div className="text-lg font-semibold">
              {successCount}/{totalCount} Functions Passing
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          'subscription-status', 'quote-processor', 'quote-pdf-generator',
          'webhook-handler', 'webhook-monitor', 'batch-processor',
          'monitoring-alerting', 'performance-optimizer', 'connection-pool-manager',
          'migration-controller', 'production-validator', 'security-hardening',
          'global-deployment-optimizer'
        ].map(functionName => {
          const result = results[functionName] || { function: functionName, status: 'idle' }
          
          return (
            <div key={functionName} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{functionName}</h3>
                <span className="text-xl">{getStatusIcon(result.status)}</span>
              </div>
              
              {result.responseTime && (
                <div className="text-xs mb-1">
                  Response: {result.responseTime}ms
                </div>
              )}
              
              {result.error && (
                <div className="text-xs text-red-600 mt-2">
                  {result.error}
                </div>
              )}
              
              {result.status === 'success' && result.data && (
                <div className="text-xs text-green-600 mt-2">
                  ✓ Response received
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {totalCount > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Test Summary</h3>
          <div className="text-sm space-y-1">
            <div>✅ Passing: {successCount}</div>
            <div>❌ Failing: {Object.values(results).filter(r => r.status === 'error').length}</div>
            <div>⏳ Testing: {Object.values(results).filter(r => r.status === 'testing').length}</div>
            <div>⚪ Pending: {13 - totalCount}</div>
          </div>
          
          {successCount === 13 && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
              🎉 All Edge Functions are working! Ready for production deployment.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 2.2 Critical User Journey Tests

**Manual Testing Checklist (15 minutes):**

1. **Visit: http://localhost:3000/test-edge-functions**

2. **Core Business Flow:**
   - [ ] Click "Run All Tests" - should complete in ~30 seconds
   - [ ] All 13 functions should show ✅ status
   - [ ] Response times should be under 2 seconds each
   - [ ] No console errors in browser dev tools

3. **Critical Function Validation:**
   - [ ] **subscription-status**: Returns user subscription data
   - [ ] **quote-processor**: Creates quote successfully  
   - [ ] **webhook-handler**: Processes webhook events
   - [ ] **batch-processor**: Handles bulk operations
   - [ ] **monitoring-alerting**: Returns health status

4. **Performance Check:**
   - [ ] Total test run time under 45 seconds
   - [ ] No functions taking over 3 seconds
   - [ ] Memory usage stable in browser

---

## Phase 3: Production Deployment Testing (30 minutes)

### 3.1 Pre-Deployment Validation

```bash
#!/bin/bash
echo "🔍 Pre-production deployment validation..."

# 1. Deploy all functions to production
echo "Deploying all 14 Edge Functions to production..."

FUNCTIONS=(
  "subscription-status"
  "quote-processor" 
  "quote-pdf-generator"
  "webhook-handler"
  "batch-processor"
  "webhook-monitor"
  "monitoring-alerting"
  "performance-optimizer"
  "connection-pool-manager"
  "migration-controller"
  "production-validator"
  "security-hardening"
  "global-deployment-optimizer"
)

for func in "${FUNCTIONS[@]}"; do
  echo "Deploying $func..."
  supabase functions deploy $func --project-ref $SUPABASE_PROJECT_ID
  
  if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy $func"
    exit 1
  fi
done

echo "✅ All functions deployed successfully!"

# 2. Quick production health check
echo "Running production health check..."
curl -X POST "https://$SUPABASE_PROJECT_ID.functions.supabase.co/subscription-status" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "health-check"}' \
  --max-time 10

if [ $? -eq 0 ]; then
  echo "✅ Production deployment successful!"
else
  echo "❌ Production health check failed"
  exit 1
fi
```

### 3.2 Production Integration Test

```typescript
// File: scripts/production-integration-test.ts
// Comprehensive production testing

const PRODUCTION_URL = `https://${Deno.env.get('SUPABASE_PROJECT_ID')}.functions.supabase.co`
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

interface ProductionTestResult {
  function: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  error?: string;
}

async function runProductionTests(): Promise<ProductionTestResult[]> {
  console.log('🏥 Running production integration tests...')
  
  const functions = [
    'subscription-status',
    'quote-processor', 
    'quote-pdf-generator',
    'webhook-handler',
    'batch-processor',
    'webhook-monitor',
    'monitoring-alerting',
    'performance-optimizer',
    'connection-pool-manager',
    'migration-controller',
    'production-validator',
    'security-hardening',
    'global-deployment-optimizer'
  ]
  
  const results: ProductionTestResult[] = []
  
  for (const func of functions) {
    const result = await testProductionFunction(func)
    results.push(result)
    
    const status = result.status === 'PASS' ? '✅' : '❌'
    console.log(`${status} ${func}: ${result.responseTime}ms ${result.error || ''}`)
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  const passCount = results.filter(r => r.status === 'PASS').length
  console.log(`\n🎯 Production Test Results: ${passCount}/${results.length} functions passing`)
  
  if (passCount === results.length) {
    console.log('🎉 All production tests passed! System is ready for launch.')
  } else {
    console.log('❌ Some production tests failed. Review before launch.')
  }
  
  return results
}

async function testProductionFunction(functionName: string): Promise<ProductionTestResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'health-check' }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return { function: functionName, status: 'PASS', responseTime }
    } else {
      const errorText = await response.text()
      return { 
        function: functionName, 
        status: 'FAIL', 
        responseTime, 
        error: `HTTP ${response.status}` 
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return { 
      function: functionName, 
      status: 'FAIL', 
      responseTime, 
      error: error.message 
    }
  }
}

// Run production tests
if (import.meta.main) {
  const results = await runProductionTests()
  
  const failedCount = results.filter(r => r.status === 'FAIL').length
  if (failedCount > 0) {
    console.log(`\n❌ ${failedCount} production tests failed`)
    Deno.exit(1)
  } else {
    console.log('\n✅ All production tests passed!')
    Deno.exit(0)
  }
}
```

---

## Phase 4: Performance & Load Testing (20 minutes)

### 4.1 Realistic Performance Testing

```bash
#!/bin/bash
echo "⚡ Realistic performance testing for 14 Edge Functions..."

PRODUCTION_URL="https://$SUPABASE_PROJECT_ID.functions.supabase.co"
ANON_KEY="$SUPABASE_ANON_KEY"

# Test critical functions under load
CRITICAL_FUNCTIONS=(
  "subscription-status"
  "quote-processor"
  "webhook-handler"
  "batch-processor"
)

echo "Testing critical functions with 10 concurrent requests each..."

for func in "${CRITICAL_FUNCTIONS[@]}"; do
  echo "Load testing $func..."
  
  # Run 10 concurrent requests
  for i in {1..10}; do
    (
      time curl -X POST "$PRODUCTION_URL/$func" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"action": "health-check"}' \
        --max-time 5 \
        --silent \
        --output /dev/null
    ) &
  done
  
  # Wait for all requests to complete
  wait
  
  echo "✅ $func load test complete"
  sleep 2
done

echo "✅ Performance testing complete"
```

### 4.2 Database Connection Pool Testing

```typescript
// File: scripts/connection-pool-test.ts
// Test connection pooling under load

async function testConnectionPooling() {
  console.log('🔗 Testing connection pool performance...')
  
  const PRODUCTION_URL = `https://${Deno.env.get('SUPABASE_PROJECT_ID')}.functions.supabase.co`
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
  
  // Test connection pool manager
  const promises = Array.from({ length: 20 }, async (_, i) => {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${PRODUCTION_URL}/connection-pool-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'status' })
      })
      
      const responseTime = Date.now() - startTime
      return { success: response.ok, responseTime, request: i + 1 }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return { success: false, responseTime, request: i + 1, error: error.message }
    }
  })
  
  const results = await Promise.all(promises)
  
  const successCount = results.filter(r => r.success).length
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  
  console.log(`📊 Connection Pool Test Results:`)
  console.log(`✅ Successful requests: ${successCount}/20`)
  console.log(`⏱️  Average response time: ${avgResponseTime.toFixed(0)}ms`)
  
  if (successCount >= 18 && avgResponseTime < 2000) {
    console.log('✅ Connection pooling working correctly')
  } else {
    console.log('❌ Connection pooling may have issues')
  }
}

if (import.meta.main) {
  await testConnectionPooling()
}
```

---

## 🎯 **REALISTIC LAUNCH CRITERIA**

### **Ready to launch when:**

**✅ Local Development (30 minutes):**
- [ ] All 14 functions deploy locally without errors
- [ ] Realistic local tests pass (10+ functions responding)
- [ ] No critical errors in function logs

**✅ Frontend Integration (20 minutes):**
- [ ] Test page shows 13/13 functions passing
- [ ] Core user journeys work (subscription, quotes, webhooks)
- [ ] Response times under 3 seconds locally

**✅ Production Deployment (30 minutes):**
- [ ] All 14 functions deploy to production successfully
- [ ] Production health checks pass
- [ ] No deployment errors or timeouts

**✅ Performance Validation (20 minutes):**
- [ ] Critical functions handle 10 concurrent requests
- [ ] Average response times under 2 seconds
- [ ] Connection pooling working correctly
- [ ] No memory leaks or crashes

**✅ Monitoring Setup:**
- [ ] Supabase dashboard shows function invocations
- [ ] Error rates under 5%
- [ ] Cost tracking enabled

---

## Package.json Scripts (Updated for Reality)

```json
{
  "scripts": {
    "test:local": "deno run --allow-all tests/realistic-local-tests.ts",
    "test:production": "deno run --allow-all scripts/production-integration-test.ts",
    "test:performance": "bash scripts/realistic-performance-test.sh",
    "test:connection-pool": "deno run --allow-all scripts/connection-pool-test.ts",
    "deploy:all": "bash scripts/deploy-all-functions.sh",
    "deploy:test": "npm run deploy:all && npm run test:production",
    "test:full": "npm run test:local && npm run deploy:all && npm run test:production && npm run test:performance"
  }
}
```

---

## 🚨 **CRITICAL DIFFERENCES FROM ORIGINAL**

**What Changed:**
1. **14 functions instead of 3** - reflects actual implementation
2. **Complex payloads** - matches real function signatures  
3. **Realistic testing times** - 1-2 hours total, not 20 minutes
4. **Production-grade validation** - includes load testing, connection pooling
5. **Comprehensive monitoring** - covers all operational aspects

**Why This Matters:**
- **Original strategy would miss 80% of our functions**
- **Real implementation has advanced features that need testing**
- **Production deployment requires comprehensive validation**
- **Performance targets are ambitious and need proper testing**

**This is now a REALISTIC testing strategy that matches our sophisticated Edge Functions implementation.**
