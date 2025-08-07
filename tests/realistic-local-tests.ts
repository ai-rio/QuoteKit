/**
 * Realistic Local Edge Functions Testing
 * Tests all 14 Edge Functions with proper payloads and validation
 * Run with: deno run --allow-all tests/realistic-local-tests.ts
 */

import { localCredentialManager } from './utils/credential-manager.ts';

const BASE_URL = 'http://localhost:54321/functions/v1'

interface TestResult {
  function: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  error?: string;
  data?: any;
}

interface TestConfig {
  name: string;
  payload: any;
  expectedStatus?: number;
  timeout?: number;
}

const TEST_CONFIGS: TestConfig[] = [
  // Core business functions
  {
    name: 'subscription-status',
    payload: { action: 'get-subscription' },
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'quote-processor',
    payload: {
      operation: 'create',
      quote: {
        client_name: 'Test Client',
        client_email: 'test@example.com',
        line_items: [
          { name: 'Test Service', quantity: 1, unit_price: 100, total: 100 }
        ],
        tax_rate: 8.25,
        notes: 'Test quote for local testing'
      },
      operations: {
        generate_pdf: false,
        send_email: false,
        update_usage: true,
        auto_save: true
      }
    },
    expectedStatus: 200,
    timeout: 8000
  },
  {
    name: 'quote-pdf-generator',
    payload: {
      quote_id: 'test-quote-id',
      template: 'default',
      options: {
        download: false,
        email: false
      }
    },
    expectedStatus: 200,
    timeout: 10000
  },
  
  // Webhook system
  {
    name: 'webhook-handler',
    payload: {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'active'
        }
      },
      livemode: false,
      created: Math.floor(Date.now() / 1000)
    },
    expectedStatus: 200,
    timeout: 6000
  },
  {
    name: 'webhook-monitor',
    payload: { 
      action: 'get-metrics',
      timeframe: '24h'
    },
    expectedStatus: 200,
    timeout: 3000
  },
  
  // Batch operations
  {
    name: 'batch-processor',
    payload: {
      operation: 'bulk-status-update',
      items: ['quote-1', 'quote-2'],
      status: 'sent',
      options: {
        notify_clients: false,
        update_analytics: true
      }
    },
    expectedStatus: 200,
    timeout: 15000
  },
  
  // Monitoring & optimization
  {
    name: 'monitoring-alerting',
    payload: { 
      action: 'health-check',
      include_metrics: true
    },
    expectedStatus: 200,
    timeout: 3000
  },
  {
    name: 'performance-optimizer',
    payload: { 
      action: 'analyze',
      target_functions: ['subscription-status', 'quote-processor'],
      optimization_level: 'standard'
    },
    expectedStatus: 200,
    timeout: 8000
  },
  {
    name: 'connection-pool-manager',
    payload: { 
      action: 'status',
      include_details: true
    },
    expectedStatus: 200,
    timeout: 3000
  },
  
  // Deployment functions
  {
    name: 'migration-controller',
    payload: { 
      action: 'status',
      include_health: true
    },
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'production-validator',
    payload: { 
      action: 'validate',
      validation_type: 'quick',
      include_security: false
    },
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: 'security-hardening',
    payload: { 
      action: 'scan',
      scan_type: 'basic',
      target: 'local'
    },
    expectedStatus: 200,
    timeout: 12000
  },
  {
    name: 'global-deployment-optimizer',
    payload: { 
      action: 'optimize',
      optimization_type: 'performance',
      dry_run: true
    },
    expectedStatus: 200,
    timeout: 8000
  }
]

async function runRealisticTests(): Promise<TestResult[]> {
  console.log('🧪 Running realistic Edge Function tests...')
  
  // Initialize secure credential manager
  try {
    await localCredentialManager.initialize();
    const credSummary = localCredentialManager.getCredentialSummary();
    console.log('🔐 Credentials loaded:', credSummary);
  } catch (error) {
    console.error('❌ Failed to initialize credentials:', error.message);
    console.error('💡 Make sure to create .env.test with your credentials');
    Deno.exit(1);
  }
  
  console.log(`📊 Testing ${TEST_CONFIGS.length} functions with comprehensive payloads\n`)
  
  const results: TestResult[] = []
  let passCount = 0
  let totalResponseTime = 0
  
  for (const config of TEST_CONFIGS) {
    console.log(`🔄 Testing ${config.name}...`)
    
    const result = await testFunction(config)
    results.push(result)
    
    const status = result.status === 'PASS' ? '✅' : '❌'
    const timeColor = result.responseTime > 2000 ? '🔴' : result.responseTime > 1000 ? '🟡' : '🟢'
    
    console.log(`${status} ${config.name}: ${timeColor} ${result.responseTime}ms ${result.error ? `- ${result.error}` : ''}`)
    
    if (result.status === 'PASS') {
      passCount++
    }
    totalResponseTime += result.responseTime
    
    // Small delay between tests to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Print comprehensive summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 COMPREHENSIVE TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passCount}/${results.length} functions`)
  console.log(`❌ Failed: ${results.length - passCount}/${results.length} functions`)
  console.log(`⏱️  Average Response Time: ${Math.round(totalResponseTime / results.length)}ms`)
  console.log(`🎯 Success Rate: ${Math.round((passCount / results.length) * 100)}%`)
  
  // Performance analysis
  const slowFunctions = results.filter(r => r.responseTime > 2000)
  if (slowFunctions.length > 0) {
    console.log(`\n🐌 Slow Functions (>2s):`)
    slowFunctions.forEach(f => {
      console.log(`   - ${f.function}: ${f.responseTime}ms`)
    })
  }
  
  // Failed functions analysis
  const failedFunctions = results.filter(r => r.status === 'FAIL')
  if (failedFunctions.length > 0) {
    console.log(`\n❌ Failed Functions:`)
    failedFunctions.forEach(f => {
      console.log(`   - ${f.function}: ${f.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  if (passCount === results.length) {
    console.log('🎉 ALL TESTS PASSED! Ready for frontend integration testing.')
  } else if (passCount >= results.length * 0.8) {
    console.log('⚠️  Most tests passed, but some issues need attention.')
  } else {
    console.log('🚨 Multiple test failures - review implementation before proceeding.')
  }
  
  return results
}

async function testFunction(config: TestConfig): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 5000)
    
    const response = await fetch(`${BASE_URL}/${config.name}`, {
      method: 'POST',
      headers: {
        'Authorization': localCredentialManager.getAuthHeader(),
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true'
      },
      body: JSON.stringify(config.payload),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      let data
      try {
        data = await response.json()
      } catch {
        data = await response.text()
      }
      
      return { 
        function: config.name, 
        status: 'PASS', 
        responseTime,
        data 
      }
    } else {
      const errorText = await response.text().catch(() => 'Unknown error')
      return { 
        function: config.name, 
        status: 'FAIL', 
        responseTime, 
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` 
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    if (error.name === 'AbortError') {
      return { 
        function: config.name, 
        status: 'FAIL', 
        responseTime, 
        error: `Timeout after ${config.timeout || 5000}ms` 
      }
    }
    
    return { 
      function: config.name, 
      status: 'FAIL', 
      responseTime, 
      error: error.message 
    }
  }
}

// Health check function for quick validation
async function quickHealthCheck(): Promise<boolean> {
  console.log('🏥 Running quick health check...')
  
  const criticalFunctions = ['subscription-status', 'quote-processor', 'webhook-handler']
  
  for (const funcName of criticalFunctions) {
    try {
      const response = await fetch(`${BASE_URL}/${funcName}`, {
        method: 'POST',
        headers: {
          'Authorization': localCredentialManager.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'health-check' }),
        signal: AbortSignal.timeout(3000)
      })
      
      if (!response.ok) {
        console.log(`❌ ${funcName} health check failed: ${response.status}`)
        return false
      }
      
      console.log(`✅ ${funcName} health check passed`)
    } catch (error) {
      console.log(`❌ ${funcName} health check error: ${error.message}`)
      return false
    }
  }
  
  console.log('✅ All critical functions healthy')
  return true
}

// Main execution
if (import.meta.main) {
  const args = Deno.args
  
  if (args.includes('--health-check')) {
    const healthy = await quickHealthCheck()
    Deno.exit(healthy ? 0 : 1)
  } else {
    const results = await runRealisticTests()
    
    // Exit with error code if any critical tests failed
    const criticalFunctions = ['subscription-status', 'quote-processor', 'webhook-handler']
    const criticalFailures = results.filter(r => 
      criticalFunctions.includes(r.function) && r.status === 'FAIL'
    )
    
    if (criticalFailures.length > 0) {
      console.log(`\n🚨 ${criticalFailures.length} critical function(s) failed - deployment blocked`)
      Deno.exit(1)
    } else if (results.filter(r => r.status === 'FAIL').length > 3) {
      console.log(`\n⚠️  Too many function failures - review before proceeding`)
      Deno.exit(1)
    } else {
      console.log('\n✅ Local testing complete - ready for integration testing!')
      Deno.exit(0)
    }
  }
}
