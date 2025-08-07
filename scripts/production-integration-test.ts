/**
 * Production Integration Testing Script
 * Comprehensive testing of all Edge Functions in production environment
 * Run with: deno run --allow-all scripts/production-integration-test.ts
 */

import { productionCredentialManager } from '../tests/utils/credential-manager.ts';

interface ProductionTestResult {
  function: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  error?: string;
  httpStatus?: number;
  category: string;
  critical: boolean;
}

interface TestConfig {
  name: string;
  category: string;
  critical: boolean;
  payload: any;
  timeout: number;
  expectedStatus?: number;
}

// Get environment variables
const SUPABASE_PROJECT_ID = Deno.env.get('SUPABASE_PROJECT_ID') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')?.split('//')[1]?.split('.')[0]
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Validate environment (will be replaced by credential manager)
if (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('💡 Create .env.test file with your production credentials')
  Deno.exit(1)
}

const PRODUCTION_URL = `https://${SUPABASE_PROJECT_ID}.functions.supabase.co`

const TEST_CONFIGS: TestConfig[] = [
  // Core Business Functions (Critical)
  {
    name: 'subscription-status',
    category: 'Core Business',
    critical: true,
    timeout: 5000,
    payload: { action: 'get-subscription' }
  },
  {
    name: 'quote-processor',
    category: 'Core Business',
    critical: true,
    timeout: 8000,
    payload: {
      operation: 'create',
      quote: {
        client_name: 'Production Test Client',
        client_email: 'test@production.com',
        line_items: [
          { name: 'Production Test Service', quantity: 1, unit_price: 100, total: 100 }
        ],
        tax_rate: 8.25,
        notes: 'Production integration test quote'
      },
      operations: {
        generate_pdf: false,
        send_email: false,
        update_usage: false,
        auto_save: false
      }
    }
  },
  {
    name: 'quote-pdf-generator',
    category: 'Core Business',
    critical: true,
    timeout: 12000,
    payload: {
      quote_id: 'prod-test-quote',
      template: 'default',
      options: { download: false, email: false }
    }
  },
  
  // Webhook System (Critical)
  {
    name: 'webhook-handler',
    category: 'Webhook System',
    critical: true,
    timeout: 6000,
    payload: {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_prod_test',
          customer: 'cus_prod_test',
          status: 'active'
        }
      },
      livemode: false,
      created: Math.floor(Date.now() / 1000)
    }
  },
  {
    name: 'webhook-monitor',
    category: 'Webhook System',
    critical: false,
    timeout: 4000,
    payload: { action: 'get-metrics', timeframe: '1h' }
  },
  
  // Batch Operations
  {
    name: 'batch-processor',
    category: 'Batch Operations',
    critical: false,
    timeout: 15000,
    payload: {
      operation: 'bulk-status-update',
      items: ['prod-quote-1', 'prod-quote-2'],
      status: 'sent',
      options: { notify_clients: false, update_analytics: false }
    }
  },
  
  // Monitoring & Optimization
  {
    name: 'monitoring-alerting',
    category: 'Monitoring',
    critical: false,
    timeout: 4000,
    payload: { action: 'health-check', include_metrics: true }
  },
  {
    name: 'performance-optimizer',
    category: 'Optimization',
    critical: false,
    timeout: 8000,
    payload: {
      action: 'analyze',
      target_functions: ['subscription-status'],
      optimization_level: 'basic'
    }
  },
  {
    name: 'connection-pool-manager',
    category: 'Optimization',
    critical: false,
    timeout: 4000,
    payload: { action: 'status', include_details: false }
  },
  
  // Deployment Functions
  {
    name: 'migration-controller',
    category: 'Deployment',
    critical: false,
    timeout: 6000,
    payload: { action: 'status', include_health: false }
  },
  {
    name: 'production-validator',
    category: 'Deployment',
    critical: false,
    timeout: 10000,
    payload: {
      action: 'validate',
      validation_type: 'quick',
      include_security: false
    }
  },
  {
    name: 'security-hardening',
    category: 'Security',
    critical: false,
    timeout: 12000,
    payload: {
      action: 'scan',
      scan_type: 'basic',
      target: 'production'
    }
  },
  {
    name: 'global-deployment-optimizer',
    category: 'Optimization',
    critical: false,
    timeout: 8000,
    payload: {
      action: 'optimize',
      optimization_type: 'performance',
      dry_run: true
    }
  }
]

async function runProductionTests(): Promise<ProductionTestResult[]> {
  console.log('🏥 Production Integration Testing')
  console.log('================================')
  
  // Initialize secure credential manager
  try {
    await productionCredentialManager.initialize();
    const credSummary = productionCredentialManager.getCredentialSummary();
    console.log('🔐 Production credentials loaded:', credSummary);
  } catch (error) {
    console.error('❌ Failed to initialize production credentials:', error.message);
    console.error('💡 Make sure to set production environment variables or create .env.test');
    Deno.exit(1);
  }
  
  const baseUrl = productionCredentialManager.getBaseUrl();
  console.log(`Target: ${baseUrl}`)
  console.log(`Functions: ${TEST_CONFIGS.length}`)
  console.log(`Critical Functions: ${TEST_CONFIGS.filter(c => c.critical).length}`)
  console.log('================================\n')
  
  const results: ProductionTestResult[] = []
  let passCount = 0
  let criticalPassCount = 0
  let totalResponseTime = 0
  
  // Test critical functions first
  const criticalConfigs = TEST_CONFIGS.filter(config => config.critical)
  const nonCriticalConfigs = TEST_CONFIGS.filter(config => !config.critical)
  
  console.log('🚨 Testing Critical Functions First...\n')
  
  for (const config of criticalConfigs) {
    console.log(`🔄 Testing ${config.name} (${config.category})...`)
    
    const result = await testProductionFunction(config)
    results.push(result)
    
    const status = result.status === 'PASS' ? '✅' : '❌'
    const timeColor = result.responseTime > 3000 ? '🔴' : result.responseTime > 1500 ? '🟡' : '🟢'
    
    console.log(`${status} ${config.name}: ${timeColor} ${result.responseTime}ms ${result.error ? `- ${result.error}` : ''}`)
    
    if (result.status === 'PASS') {
      passCount++
      criticalPassCount++
    }
    totalResponseTime += result.responseTime
    
    // Delay between critical tests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log(`\n📊 Critical Functions: ${criticalPassCount}/${criticalConfigs.length} passing\n`)
  
  // If critical functions are failing, ask whether to continue
  if (criticalPassCount < criticalConfigs.length) {
    console.log('⚠️  Some critical functions failed. Continuing with non-critical tests...\n')
  }
  
  console.log('🔧 Testing Non-Critical Functions...\n')
  
  for (const config of nonCriticalConfigs) {
    console.log(`🔄 Testing ${config.name} (${config.category})...`)
    
    const result = await testProductionFunction(config)
    results.push(result)
    
    const status = result.status === 'PASS' ? '✅' : '❌'
    const timeColor = result.responseTime > 3000 ? '🔴' : result.responseTime > 1500 ? '🟡' : '🟢'
    
    console.log(`${status} ${config.name}: ${timeColor} ${result.responseTime}ms ${result.error ? `- ${result.error}` : ''}`)
    
    if (result.status === 'PASS') {
      passCount++
    }
    totalResponseTime += result.responseTime
    
    // Shorter delay between non-critical tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Comprehensive results analysis
  console.log('\n' + '='.repeat(60))
  console.log('📊 PRODUCTION TEST RESULTS')
  console.log('='.repeat(60))
  
  const failedResults = results.filter(r => r.status === 'FAIL')
  const slowResults = results.filter(r => r.responseTime > 3000)
  const avgResponseTime = Math.round(totalResponseTime / results.length)
  
  console.log(`✅ Passed: ${passCount}/${results.length} functions`)
  console.log(`❌ Failed: ${results.length - passCount}/${results.length} functions`)
  console.log(`🚨 Critical Passed: ${criticalPassCount}/${criticalConfigs.length} functions`)
  console.log(`⏱️  Average Response Time: ${avgResponseTime}ms`)
  console.log(`🎯 Success Rate: ${Math.round((passCount / results.length) * 100)}%`)
  
  // Category breakdown
  const categories = [...new Set(TEST_CONFIGS.map(c => c.category))]
  console.log('\n📋 Results by Category:')
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category)
    const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length
    console.log(`   ${category}: ${categoryPassed}/${categoryResults.length} passing`)
  })
  
  // Performance analysis
  if (slowResults.length > 0) {
    console.log(`\n🐌 Slow Functions (>3s):`)
    slowResults.forEach(r => {
      console.log(`   - ${r.function}: ${r.responseTime}ms`)
    })
  }
  
  // Failed functions analysis
  if (failedResults.length > 0) {
    console.log(`\n❌ Failed Functions:`)
    failedResults.forEach(r => {
      console.log(`   - ${r.function}: ${r.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Final assessment
  if (criticalPassCount < criticalConfigs.length) {
    console.log('🚨 PRODUCTION DEPLOYMENT BLOCKED: Critical functions failing')
    console.log('   Fix critical functions before deploying to production')
  } else if (passCount === results.length) {
    console.log('🎉 ALL PRODUCTION TESTS PASSED!')
    console.log('   System is ready for production launch')
  } else if (passCount >= results.length * 0.85) {
    console.log('✅ Production tests mostly passed')
    console.log('   Minor issues detected but system is functional')
  } else {
    console.log('⚠️  Multiple production test failures')
    console.log('   Review failed functions before launch')
  }
  
  return results
}

async function testProductionFunction(config: TestConfig): Promise<ProductionTestResult> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)
    
    const response = await fetch(`${productionCredentialManager.getBaseUrl()}/${config.name}`, {
      method: 'POST',
      headers: {
        'Authorization': productionCredentialManager.getAuthHeader(),
        'Content-Type': 'application/json',
        'X-Test-Mode': 'production'
      },
      body: JSON.stringify(config.payload),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return { 
        function: config.name, 
        status: 'PASS', 
        responseTime,
        httpStatus: response.status,
        category: config.category,
        critical: config.critical
      }
    } else {
      const errorText = await response.text().catch(() => 'Unknown error')
      return { 
        function: config.name, 
        status: 'FAIL', 
        responseTime, 
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
        httpStatus: response.status,
        category: config.category,
        critical: config.critical
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    if (error.name === 'AbortError') {
      return { 
        function: config.name, 
        status: 'FAIL', 
        responseTime, 
        error: `Timeout after ${config.timeout}ms`,
        category: config.category,
        critical: config.critical
      }
    }
    
    return { 
      function: config.name, 
      status: 'FAIL', 
      responseTime, 
      error: error.message,
      category: config.category,
      critical: config.critical
    }
  }
}

// Quick health check function
async function quickHealthCheck(): Promise<boolean> {
  console.log('🏥 Quick Production Health Check...\n')
  
  const criticalFunctions = ['subscription-status', 'quote-processor', 'webhook-handler']
  let allHealthy = true
  
  for (const funcName of criticalFunctions) {
    try {
      const response = await fetch(`${PRODUCTION_URL}/${funcName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'health-check' }),
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        console.log(`✅ ${funcName} - Healthy`)
      } else {
        console.log(`❌ ${funcName} - Unhealthy (${response.status})`)
        allHealthy = false
      }
    } catch (error) {
      console.log(`❌ ${funcName} - Error: ${error.message}`)
      allHealthy = false
    }
  }
  
  console.log(`\n🎯 Health Check: ${allHealthy ? 'PASSED' : 'FAILED'}`)
  return allHealthy
}

// Main execution
if (import.meta.main) {
  const args = Deno.args
  
  if (args.includes('--health-check')) {
    const healthy = await quickHealthCheck()
    Deno.exit(healthy ? 0 : 1)
  } else {
    const results = await runProductionTests()
    
    // Determine exit code based on results
    const criticalConfigs = TEST_CONFIGS.filter(c => c.critical)
    const criticalFailures = results.filter(r => r.critical && r.status === 'FAIL')
    const totalFailures = results.filter(r => r.status === 'FAIL')
    
    if (criticalFailures.length > 0) {
      console.log(`\n🚨 ${criticalFailures.length} critical function(s) failed - production deployment blocked`)
      Deno.exit(1)
    } else if (totalFailures.length > Math.floor(results.length * 0.3)) {
      console.log(`\n⚠️  Too many function failures (${totalFailures.length}/${results.length}) - review before launch`)
      Deno.exit(1)
    } else {
      console.log('\n✅ Production integration tests completed successfully!')
      Deno.exit(0)
    }
  }
}
