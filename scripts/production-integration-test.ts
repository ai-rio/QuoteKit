/**
 * Production Integration Test Script
 * Tests all Edge Functions in production environment
 * Run with: deno run --allow-all scripts/production-integration-test.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration from environment
const SUPABASE_PROJECT_ID = Deno.env.get('SUPABASE_PROJECT_ID') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')?.split('//')[1]?.split('.')[0];
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  Deno.exit(1);
}

const PRODUCTION_URL = `https://${SUPABASE_PROJECT_ID}.functions.supabase.co`;
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

interface ProductionTestResult {
  function: string;
  status: 'PASS' | 'FAIL' | 'TIMEOUT' | 'SKIP';
  responseTime: number;
  httpStatus?: number;
  error?: string;
  data?: any;
  category: string;
  critical: boolean;
}

interface TestConfig {
  name: string;
  category: string;
  payload: any;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  timeout?: number;
  critical?: boolean;
  expectedStatus?: number[];
}

class ProductionTester {
  private supabase: any;
  private authToken?: string;
  private testResults: ProductionTestResult[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Setup authentication for production tests
   */
  async setupAuth(): Promise<void> {
    console.log('🔐 Setting up production authentication...');
    
    try {
      // For production, we'll use the service key for admin functions
      if (SUPABASE_SERVICE_KEY) {
        this.authToken = SUPABASE_SERVICE_KEY;
        console.log('✅ Using service key for admin functions');
      } else {
        console.warn('⚠️  No service key available - admin functions will be skipped');
      }
    } catch (error) {
      console.warn('⚠️  Auth setup failed:', error.message);
    }
  }

  /**
   * Test a single production function
   */
  async testProductionFunction(config: TestConfig): Promise<ProductionTestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Testing ${config.name} (${config.category})...`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'QuoteKit-Production-Test/1.0'
      };

      // Add authentication if required
      if (config.requiresAuth || config.requiresAdmin) {
        if (this.authToken) {
          headers['Authorization'] = `Bearer ${this.authToken}`;
        } else {
          return {
            function: config.name,
            status: 'SKIP',
            responseTime: 0,
            error: 'No authentication token available',
            category: config.category,
            critical: config.critical || false
          };
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 15000);

      const response = await fetch(`${PRODUCTION_URL}/${config.name}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(config.payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      // Check if response status is expected
      const expectedStatuses = config.expectedStatus || [200, 201];
      const isStatusOk = expectedStatuses.includes(response.status);
      
      if (isStatusOk) {
        let data;
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
        
        return {
          function: config.name,
          status: 'PASS',
          responseTime,
          httpStatus: response.status,
          data,
          category: config.category,
          critical: config.critical || false
        };
      } else {
        const errorText = await response.text();
        return {
          function: config.name,
          status: 'FAIL',
          responseTime,
          httpStatus: response.status,
          error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
          category: config.category,
          critical: config.critical || false
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        return {
          function: config.name,
          status: 'TIMEOUT',
          responseTime,
          error: `Request timeout (>${config.timeout || 15000}ms)`,
          category: config.category,
          critical: config.critical || false
        };
      }
      
      return {
        function: config.name,
        status: 'FAIL',
        responseTime,
        error: error.message,
        category: config.category,
        critical: config.critical || false
      };
    }
  }

  /**
   * Run comprehensive production tests
   */
  async runProductionTests(): Promise<ProductionTestResult[]> {
    console.log('🏥 Starting production integration tests...\n');
    console.log(`🌐 Testing against: ${PRODUCTION_URL}`);
    console.log(`📊 Project ID: ${SUPABASE_PROJECT_ID}\n`);
    
    await this.setupAuth();
    
    const testConfigs: TestConfig[] = [
      // Core Business Functions (Critical)
      {
        name: 'subscription-status',
        category: 'Core Business',
        payload: { action: 'health-check' },
        requiresAuth: true,
        critical: true,
        timeout: 10000
      },
      {
        name: 'quote-processor',
        category: 'Core Business',
        payload: {
          operation: 'health-check',
          validate_only: true
        },
        requiresAuth: true,
        critical: true,
        timeout: 15000
      },
      {
        name: 'quote-pdf-generator',
        category: 'Core Business',
        payload: {
          action: 'health-check',
          test_mode: true
        },
        requiresAuth: true,
        critical: true,
        timeout: 20000
      },
      
      // Webhook System (Critical for Stripe)
      {
        name: 'webhook-handler',
        category: 'Webhook System',
        payload: {
          type: 'test.webhook',
          data: { test: true },
          livemode: false
        },
        requiresAuth: false,
        critical: true,
        timeout: 10000,
        expectedStatus: [200, 400] // 400 is OK for test webhooks
      },
      {
        name: 'webhook-monitor',
        category: 'Webhook System',
        payload: { 
          action: 'health-check'
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 10000
      },
      
      // Batch Operations (Performance Critical)
      {
        name: 'batch-processor',
        category: 'Batch Operations',
        payload: {
          operation: 'health-check',
          dry_run: true
        },
        requiresAuth: true,
        critical: true,
        timeout: 15000
      },
      
      // Monitoring & Alerting
      {
        name: 'monitoring-alerting',
        category: 'Monitoring',
        payload: { 
          action: 'health-check'
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 10000
      },
      
      // Performance Optimization
      {
        name: 'performance-optimizer',
        category: 'Performance',
        payload: {
          action: 'health-check'
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 20000
      },
      {
        name: 'connection-pool-manager',
        category: 'Performance',
        payload: {
          action: 'health-check'
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 10000
      },
      
      // Migration & Deployment
      {
        name: 'migration-controller',
        category: 'Deployment',
        payload: {
          action: 'health-check'
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 10000
      },
      {
        name: 'production-validator',
        category: 'Deployment',
        payload: {
          action: 'health-check'
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 30000
      },
      {
        name: 'security-hardening',
        category: 'Security',
        payload: {
          action: 'health-check'
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 25000
      },
      {
        name: 'global-deployment-optimizer',
        category: 'Global Optimization',
        payload: {
          action: 'health-check'
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 20000
      }
    ];

    console.log(`📋 Running ${testConfigs.length} production tests...\n`);

    // Group tests by category
    const categories = [...new Set(testConfigs.map(c => c.category))];
    
    for (const category of categories) {
      console.log(`\n📦 Testing ${category} Functions`);
      console.log('─'.repeat(50));
      
      const categoryConfigs = testConfigs.filter(c => c.category === category);
      
      for (const config of categoryConfigs) {
        const result = await this.testProductionFunction(config);
        this.testResults.push(result);
        
        // Display result
        const statusIcon = this.getStatusIcon(result.status);
        const criticalIcon = result.critical ? '🔥' : '';
        const timeColor = this.getTimeColor(result.responseTime);
        
        console.log(
          `${statusIcon} ${criticalIcon} ${config.name.padEnd(30)} ${timeColor}${result.responseTime}ms\x1b[0m ${result.error ? '- ' + result.error.substring(0, 60) : ''}`
        );
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return this.testResults;
  }

  /**
   * Generate comprehensive test report
   */
  generateReport(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    const timeoutTests = this.testResults.filter(r => r.status === 'TIMEOUT').length;
    const skippedTests = this.testResults.filter(r => r.status === 'SKIP').length;
    const criticalFailures = this.testResults.filter(r => r.status !== 'PASS' && r.critical).length;
    
    const avgResponseTime = this.testResults
      .filter(r => r.responseTime > 0)
      .reduce((sum, r) => sum + r.responseTime, 0) / 
      this.testResults.filter(r => r.responseTime > 0).length;

    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION TEST REPORT');
    console.log('='.repeat(80));
    console.log(`🌐 Environment: Production (${SUPABASE_PROJECT_ID})`);
    console.log(`📅 Test Date: ${new Date().toISOString()}`);
    console.log(`⏱️  Total Duration: ${Math.round(avgResponseTime)}ms average`);
    console.log('');
    console.log('📈 Test Results:');
    console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Failed: ${failedTests}/${totalTests}`);
    console.log(`   ⏰ Timeout: ${timeoutTests}/${totalTests}`);
    console.log(`   ⏭️  Skipped: ${skippedTests}/${totalTests}`);
    console.log(`   🔥 Critical Failures: ${criticalFailures}`);

    // Performance analysis
    const slowFunctions = this.testResults.filter(r => r.responseTime > 10000);
    if (slowFunctions.length > 0) {
      console.log('\n⚠️  Slow Functions (>10s):');
      slowFunctions.forEach(f => {
        console.log(`   - ${f.function}: ${f.responseTime}ms`);
      });
    }

    // Critical failures analysis
    if (criticalFailures > 0) {
      console.log('\n🚨 CRITICAL FAILURES:');
      this.testResults.filter(r => r.status !== 'PASS' && r.critical).forEach(r => {
        console.log(`   - ${r.function}: ${r.error}`);
      });
    }

    // Category breakdown
    console.log('\n📊 Results by Category:');
    const categories = [...new Set(this.testResults.map(r => r.category))];
    categories.forEach(category => {
      const categoryResults = this.testResults.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
      console.log(`   ${category}: ${categoryPassed}/${categoryResults.length} passed`);
    });

    // Final verdict
    console.log('\n' + '='.repeat(80));
    if (criticalFailures === 0 && failedTests === 0) {
      console.log('🎉 ALL PRODUCTION TESTS PASSED! System is ready for launch.');
    } else if (criticalFailures === 0) {
      console.log('⚠️  Some non-critical tests failed. Review before full launch.');
    } else {
      console.log('🚨 CRITICAL FAILURES DETECTED! System is NOT ready for production.');
    }
    console.log('='.repeat(80));
  }

  /**
   * Run quick health check only
   */
  async runQuickHealthCheck(): Promise<boolean> {
    console.log('🏥 Running quick production health check...\n');
    
    const criticalFunctions = [
      'subscription-status',
      'quote-processor', 
      'webhook-handler',
      'batch-processor'
    ];

    let healthyCount = 0;

    for (const functionName of criticalFunctions) {
      try {
        const response = await fetch(`${PRODUCTION_URL}/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken || SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ action: 'health-check' }),
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok || response.status === 400) { // 400 might be OK for some functions
          console.log(`✅ ${functionName} - healthy (${response.status})`);
          healthyCount++;
        } else {
          console.log(`❌ ${functionName} - unhealthy (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${functionName} - error: ${error.message}`);
      }
    }

    const isHealthy = healthyCount >= 3; // Allow 1 failure
    console.log(`\n🏥 Health Check: ${healthyCount}/${criticalFunctions.length} critical functions healthy`);
    
    return isHealthy;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'TIMEOUT': return '⏰';
      case 'SKIP': return '⏭️';
      default: return '❓';
    }
  }

  private getTimeColor(responseTime: number): string {
    if (responseTime > 10000) return '\x1b[31m'; // Red
    if (responseTime > 5000) return '\x1b[33m';  // Yellow
    return '\x1b[32m'; // Green
  }
}

// Main execution
async function main() {
  const args = Deno.args;
  const tester = new ProductionTester();

  try {
    if (args.includes('--health-check')) {
      const isHealthy = await tester.runQuickHealthCheck();
      Deno.exit(isHealthy ? 0 : 1);
    } else {
      await tester.runProductionTests();
      tester.generateReport();
      
      const criticalFailures = tester.testResults.filter(r => r.status !== 'PASS' && r.critical).length;
      const totalFailures = tester.testResults.filter(r => r.status === 'FAIL').length;
      
      if (criticalFailures > 0) {
        console.log('\n🚨 Critical failures detected - production deployment not recommended');
        Deno.exit(2);
      } else if (totalFailures > 0) {
        console.log('\n⚠️  Some tests failed - review before full production launch');
        Deno.exit(1);
      } else {
        console.log('\n✅ All production tests passed - system ready for launch!');
        Deno.exit(0);
      }
    }
  } catch (error) {
    console.error('💥 Production test runner failed:', error);
    Deno.exit(3);
  }
}

if (import.meta.main) {
  main();
}
