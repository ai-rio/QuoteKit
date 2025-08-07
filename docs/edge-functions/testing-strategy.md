# Edge Functions Testing Strategy - Local Development & Launch Ready

## 🚀 **LAUNCH-FOCUSED TESTING STRATEGY**

**Context**: Local development environment, need to move fast to production launch  
**Goal**: Validate Edge Functions work correctly with minimal testing overhead  
**Timeline**: Days, not weeks  

---

## Phase 1: Essential Local Development Tests

### 1.1 Quick Local Setup & Smoke Tests

```bash
# Quick setup script - 2 minutes max
#!/bin/bash
echo "🚀 Quick Edge Functions Setup..."

# Start local Supabase
supabase start

# Deploy functions locally
supabase functions deploy subscription-status --local
supabase functions deploy quote-processor --local
supabase functions deploy admin-analytics --local

# Quick smoke test
curl -X POST http://localhost:54321/functions/v1/subscription-status \
  -H "Content-Type: application/json" \
  -d '{"action": "health-check"}'

echo "✅ Local functions ready!"
```

### 1.2 Core Function Tests (5 minutes total)

```typescript
// File: tests/quick-local-tests.ts
// Run with: deno run --allow-all tests/quick-local-tests.ts

const BASE_URL = 'http://localhost:54321/functions/v1'
const TEST_JWT = 'your-test-jwt-here' // Get from Supabase Studio

async function runQuickTests() {
  console.log('🧪 Running essential local tests...')
  
  // Test 1: Subscription Status (30 seconds)
  await testSubscriptionStatus()
  
  // Test 2: Quote Processing (30 seconds)  
  await testQuoteProcessing()
  
  // Test 3: Admin Analytics (30 seconds)
  await testAdminAnalytics()
  
  console.log('✅ All essential tests passed!')
}

async function testSubscriptionStatus() {
  const response = await fetch(`${BASE_URL}/subscription-status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_JWT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'get-subscription', userId: 'test-user' })
  })
  
  if (response.status !== 200) {
    throw new Error(`Subscription status failed: ${response.status}`)
  }
  
  console.log('✅ Subscription status working')
}

async function testQuoteProcessing() {
  const response = await fetch(`${BASE_URL}/quote-processor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_JWT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientData: { name: 'Test Client', email: 'test@example.com' },
      lineItems: [{ name: 'Test Service', quantity: 1, unitPrice: 100 }]
    })
  })
  
  if (response.status !== 200) {
    throw new Error(`Quote processing failed: ${response.status}`)
  }
  
  console.log('✅ Quote processing working')
}

async function testAdminAnalytics() {
  const response = await fetch(`${BASE_URL}/admin-analytics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_JWT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'get-dashboard-data' })
  })
  
  if (response.status !== 200) {
    throw new Error(`Admin analytics failed: ${response.status}`)
  }
  
  console.log('✅ Admin analytics working')
}

// Run tests
if (import.meta.main) {
  await runQuickTests()
}
```

---

## Phase 2: Frontend Integration Tests (10 minutes)

### 2.1 Test Edge Functions from Next.js App

```typescript
// File: src/app/test-edge-functions/page.tsx
// Quick manual testing page

'use client'

import { useState } from 'react'
import { createClient } from '@/libs/supabase/client'

export default function TestEdgeFunctions() {
  const [results, setResults] = useState<any>({})
  const supabase = createClient()

  const testSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-status', {
        body: { action: 'get-subscription' }
      })
      
      setResults(prev => ({ ...prev, subscription: { success: !error, data, error } }))
    } catch (err) {
      setResults(prev => ({ ...prev, subscription: { success: false, error: err.message } }))
    }
  }

  const testQuoteProcessor = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('quote-processor', {
        body: {
          clientData: { name: 'Test Client', email: 'test@example.com' },
          lineItems: [{ name: 'Test Service', quantity: 1, unitPrice: 100 }]
        }
      })
      
      setResults(prev => ({ ...prev, quote: { success: !error, data, error } }))
    } catch (err) {
      setResults(prev => ({ ...prev, quote: { success: false, error: err.message } }))
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edge Functions Test Page</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testSubscriptionStatus}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Subscription Status
        </button>
        
        <button 
          onClick={testQuoteProcessor}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Quote Processor
        </button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Results:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  )
}
```

### 2.2 Quick Manual Testing Checklist

**Visit: http://localhost:3000/test-edge-functions**

- [ ] **Subscription Status**: Click button, see success response
- [ ] **Quote Processor**: Click button, see quote generated
- [ ] **Check Network Tab**: Verify calls go to Edge Functions
- [ ] **Check Response Times**: Should be under 1 second
- [ ] **Check for Errors**: No console errors

---

## Phase 3: Production Deployment Tests (5 minutes)

### 3.1 Pre-Deployment Checklist

```bash
# Before deploying to production
echo "🔍 Pre-deployment checks..."

# 1. Functions deploy without errors
supabase functions deploy subscription-status --project-ref YOUR_PROJECT_ID
supabase functions deploy quote-processor --project-ref YOUR_PROJECT_ID
supabase functions deploy admin-analytics --project-ref YOUR_PROJECT_ID

# 2. Quick production smoke test
curl -X POST https://YOUR_PROJECT_ID.functions.supabase.co/subscription-status \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "health-check"}'

echo "✅ Production deployment ready!"
```

### 3.2 Post-Deployment Validation (2 minutes)

```typescript
// File: scripts/production-health-check.ts
// Run after production deployment

const PRODUCTION_URL = 'https://YOUR_PROJECT_ID.functions.supabase.co'
const ANON_KEY = 'YOUR_ANON_KEY'

async function productionHealthCheck() {
  console.log('🏥 Production health check...')
  
  const functions = ['subscription-status', 'quote-processor', 'admin-analytics']
  
  for (const func of functions) {
    try {
      const response = await fetch(`${PRODUCTION_URL}/${func}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'health-check' })
      })
      
      if (response.ok) {
        console.log(`✅ ${func} - OK`)
      } else {
        console.log(`❌ ${func} - FAILED (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ ${func} - ERROR: ${error.message}`)
    }
  }
}

await productionHealthCheck()
```

---

## Phase 4: Performance Reality Check (Optional - 5 minutes)

### 4.1 Quick Performance Test

```bash
# Simple load test with curl
echo "⚡ Quick performance test..."

# Test response time (should be under 1 second)
time curl -X POST https://YOUR_PROJECT_ID.functions.supabase.co/subscription-status \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "get-subscription", "userId": "test-user"}'

# Test 10 concurrent requests
for i in {1..10}; do
  curl -X POST https://YOUR_PROJECT_ID.functions.supabase.co/subscription-status \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"action": "health-check"}' &
done
wait

echo "✅ Performance test complete"
```

---

## Launch-Ready Testing Workflow

### Daily Development (5 minutes)
```bash
# 1. Start local environment
supabase start

# 2. Deploy functions locally  
supabase functions deploy --local

# 3. Run quick tests
deno run --allow-all tests/quick-local-tests.ts

# 4. Manual test in browser
# Visit: http://localhost:3000/test-edge-functions
```

### Pre-Production Deploy (10 minutes)
```bash
# 1. Run local tests
npm run test:quick

# 2. Deploy to production
supabase functions deploy --project-ref YOUR_PROJECT_ID

# 3. Production health check
deno run --allow-all scripts/production-health-check.ts

# 4. Quick performance check
bash scripts/quick-performance-test.sh
```

### Post-Launch Monitoring (Ongoing)
- **Monitor Supabase Dashboard**: Check function invocations and errors
- **Check Application Logs**: Look for any Edge Function errors
- **User Feedback**: Monitor for any functionality issues
- **Cost Tracking**: Keep an eye on Supabase billing

---

## Package.json Scripts

```json
{
  "scripts": {
    "test:quick": "deno run --allow-all tests/quick-local-tests.ts",
    "test:local": "supabase functions deploy --local && npm run test:quick",
    "test:production": "deno run --allow-all scripts/production-health-check.ts",
    "deploy:functions": "supabase functions deploy --project-ref $SUPABASE_PROJECT_ID",
    "deploy:test": "npm run deploy:functions && npm run test:production"
  }
}
```

---

## 🎯 **LAUNCH CRITERIA**

**Ready to launch when:**
- [ ] All local tests pass (`npm run test:quick`)
- [ ] Functions deploy to production without errors
- [ ] Production health check passes
- [ ] Manual testing page works in browser
- [ ] No console errors in frontend
- [ ] Response times under 2 seconds

**Total testing time: ~20 minutes maximum**

---

**This is a PRACTICAL, LAUNCH-FOCUSED testing strategy that gets you to production quickly while ensuring basic functionality works correctly.**
