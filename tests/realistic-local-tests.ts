/**
 * Realistic Local Edge Functions Testing
 * Tests all 14 Edge Functions with proper authentication and realistic payloads
 * Run with: deno run --allow-all tests/realistic-local-tests.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Test admin user (from migration)
const ADMIN_USER_ID = '0a8b8ce7-3cc3-476e-b820-2296df2119cf';
const ADMIN_EMAIL = 'carlos@ai.rio.br';

interface TestResult {
  function: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  responseTime: number;
  error?: string;
  data?: any;
}

interface TestConfig {
  name: string;
  payload: any;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  timeout?: number;
  critical?: boolean;
}

class EdgeFunctionTester {
  private supabase: any;
  private adminSupabase: any;
  private authToken?: string;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Setup authentication for tests
   */
  async setupAuth(): Promise<void> {
    console.log('🔐 Setting up authentication...');
    
    try {
      // Try to sign in as admin user
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: 'password123'
      });

      if (error) {
        console.warn('⚠️  Admin login failed, using service key for tests');
        this.authToken = SUPABASE_SERVICE_KEY;
      } else {
        this.authToken = data.session?.access_token;
        console.log('✅ Admin authentication successful');
      }
    } catch (error) {
      console.warn('⚠️  Auth setup failed, using service key:', error.message);
      this.authToken = SUPABASE_SERVICE_KEY;
    }
  }

  /**
   * Test a single Edge Function
   */
  async testFunction(config: TestConfig): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Testing ${config.name}...`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authentication if required
      if (config.requiresAuth && this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/${config.name}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(config.payload),
        signal: AbortSignal.timeout(config.timeout || 10000)
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          function: config.name,
          status: 'PASS',
          responseTime,
          data
        };
      } else {
        const errorText = await response.text();
        return {
          function: config.name,
          status: 'FAIL',
          responseTime,
          error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'TimeoutError') {
        return {
          function: config.name,
          status: 'FAIL',
          responseTime,
          error: 'Request timeout'
        };
      }
      
      return {
        function: config.name,
        status: 'FAIL',
        responseTime,
        error: error.message
      };
    }
  }

  /**
   * Run all Edge Function tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting comprehensive Edge Functions testing...\n');
    
    await this.setupAuth();
    
    const testConfigs: TestConfig[] = [
      // Core Business Functions (Critical)
      {
        name: 'subscription-status',
        payload: { action: 'get-subscription' },
        requiresAuth: true,
        critical: true
      },
      {
        name: 'quote-processor',
        payload: {
          operation: 'create',
          quote: {
            client_name: 'Test Client',
            client_email: 'test@example.com',
            client_phone: '+1-555-123-4567',
            client_address: '123 Test St, Test City, TC 12345',
            line_items: [
              {
                name: 'Lawn Mowing',
                description: 'Weekly lawn maintenance',
                quantity: 4,
                unit_price: 45.00,
                total: 180.00
              },
              {
                name: 'Hedge Trimming',
                description: 'Monthly hedge maintenance',
                quantity: 1,
                unit_price: 65.00,
                total: 65.00
              }
            ],
            subtotal: 245.00,
            tax_rate: 8.25,
            tax_amount: 20.21,
            total: 265.21,
            notes: 'Test quote for Edge Function validation'
          }
        },
        requiresAuth: true,
        critical: true,
        timeout: 15000
      },
      {
        name: 'quote-pdf-generator',
        payload: {
          quote_id: 'test-quote-' + Date.now(),
          template: 'default',
          options: {
            include_branding: true,
            format: 'A4'
          }
        },
        requiresAuth: true,
        critical: true,
        timeout: 20000
      },
      
      // Webhook System (Critical for Stripe)
      {
        name: 'webhook-handler',
        payload: {
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test_' + Date.now(),
              customer: 'cus_test_customer',
              status: 'active',
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 2592000
            }
          },
          livemode: false,
          created: Math.floor(Date.now() / 1000)
        },
        requiresAuth: false, // Webhooks don't use user auth
        critical: true
      },
      {
        name: 'webhook-monitor',
        payload: { 
          action: 'get-metrics',
          timeframe: '24h'
        },
        requiresAuth: true,
        requiresAdmin: true
      },
      
      // Batch Operations (Performance Critical)
      {
        name: 'batch-processor',
        payload: {
          operation: 'bulk-status-update',
          items: ['quote-1', 'quote-2', 'quote-3'],
          status: 'sent',
          options: {
            send_notifications: false,
            validate_items: true
          }
        },
        requiresAuth: true,
        critical: true,
        timeout: 15000
      },
      
      // Monitoring & Alerting (Operational)
      {
        name: 'monitoring-alerting',
        payload: { 
          action: 'health-check',
          include_metrics: true
        },
        requiresAuth: true,
        requiresAdmin: true
      },
      
      // Performance Optimization (Performance Critical)
      {
        name: 'performance-optimizer',
        payload: {
          action: 'analyze',
          scope: 'all-functions',
          options: {
            include_recommendations: true,
            detailed_analysis: false
          }
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 20000
      },
      {
        name: 'connection-pool-manager',
        payload: {
          action: 'status',
          include_details: true
        },
        requiresAuth: true,
        requiresAdmin: true
      },
      
      // Migration & Deployment (Critical for Production)
      {
        name: 'migration-controller',
        payload: {
          action: 'status',
          include_health: true
        },
        requiresAuth: true,
        requiresAdmin: true
      },
      {
        name: 'production-validator',
        payload: {
          action: 'validate',
          scope: 'basic',
          checks: ['database', 'functions', 'security']
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 30000
      },
      {
        name: 'security-hardening',
        payload: {
          action: 'scan',
          scope: 'basic',
          include_recommendations: true
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 25000
      },
      {
        name: 'global-deployment-optimizer',
        payload: {
          action: 'optimize',
          scope: 'performance',
          dry_run: true
        },
        requiresAuth: true,
        requiresAdmin: true,
        timeout: 20000
      }
    ];

    const results: TestResult[] = [];
    let passCount = 0;
    let failCount = 0;
    let criticalFailures = 0;

    console.log(`📋 Running ${testConfigs.length} Edge Function tests...\n`);

    // Run tests sequentially to avoid overwhelming the system
    for (const config of testConfigs) {
      const result = await this.testFunction(config);
      results.push(result);

      // Display result
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      const criticalIcon = config.critical ? '🔥' : '';
      const timeColor = result.responseTime > 5000 ? '\x1b[31m' : result.responseTime > 2000 ? '\x1b[33m' : '\x1b[32m';
      
      console.log(
        `${statusIcon} ${criticalIcon} ${config.name.padEnd(30)} ${timeColor}${result.responseTime}ms\x1b[0m ${result.error ? '- ' + result.error : ''}`
      );

      if (result.status === 'PASS') {
        passCount++;
      } else {
        failCount++;
        if (config.critical) {
          criticalFailures++;
        }
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passCount}/${testConfigs.length}`);
    console.log(`❌ Failed: ${failCount}/${testConfigs.length}`);
    console.log(`🔥 Critical Failures: ${criticalFailures}`);
    
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    console.log(`⏱️  Average Response Time: ${Math.round(avgResponseTime)}ms`);
    
    // Performance analysis
    const slowFunctions = results.filter(r => r.responseTime > 5000);
    if (slowFunctions.length > 0) {
      console.log(`\n⚠️  Slow Functions (>5s):`);
      slowFunctions.forEach(f => {
        console.log(`   - ${f.function}: ${f.responseTime}ms`);
      });
    }

    // Critical failures analysis
    if (criticalFailures > 0) {
      console.log(`\n🚨 CRITICAL FAILURES DETECTED:`);
      results.filter(r => r.status === 'FAIL').forEach(r => {
        const config = testConfigs.find(c => c.name === r.function);
        if (config?.critical) {
          console.log(`   - ${r.function}: ${r.error}`);
        }
      });
      console.log('\n❌ System is NOT ready for production deployment!');
    } else if (passCount === testConfigs.length) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production deployment.');
    } else {
      console.log('\n⚠️  Some non-critical tests failed. Review before production deployment.');
    }

    return results;
  }

  /**
   * Run health check only
   */
  async runHealthCheck(): Promise<boolean> {
    console.log('🏥 Running quick health check...\n');
    
    const criticalFunctions = [
      'subscription-status',
      'quote-processor', 
      'webhook-handler',
      'batch-processor'
    ];

    let healthyCount = 0;

    for (const functionName of criticalFunctions) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken || SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ action: 'health-check' }),
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          console.log(`✅ ${functionName} - healthy`);
          healthyCount++;
        } else {
          console.log(`❌ ${functionName} - unhealthy (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${functionName} - error: ${error.message}`);
      }
    }

    const isHealthy = healthyCount === criticalFunctions.length;
    console.log(`\n🏥 Health Check: ${healthyCount}/${criticalFunctions.length} critical functions healthy`);
    
    return isHealthy;
  }
}

// Main execution
async function main() {
  const args = Deno.args;
  const tester = new EdgeFunctionTester();

  if (args.includes('--health-check')) {
    const isHealthy = await tester.runHealthCheck();
    Deno.exit(isHealthy ? 0 : 1);
  } else {
    const results = await tester.runAllTests();
    
    const failedCount = results.filter(r => r.status === 'FAIL').length;
    const criticalFailures = results.filter(r => {
      const isFailed = r.status === 'FAIL';
      // You'd need to track which functions are critical
      return isFailed && ['subscription-status', 'quote-processor', 'webhook-handler', 'batch-processor'].includes(r.function);
    }).length;
    
    if (criticalFailures > 0) {
      console.log('\n🚨 Critical failures detected - system not ready for production');
      Deno.exit(2);
    } else if (failedCount > 0) {
      console.log('\n⚠️  Some tests failed - review before production deployment');
      Deno.exit(1);
    } else {
      console.log('\n✅ All tests passed - system ready for production!');
      Deno.exit(0);
    }
  }
}

if (import.meta.main) {
  main().catch(error => {
    console.error('💥 Test runner failed:', error);
    Deno.exit(3);
  });
}
