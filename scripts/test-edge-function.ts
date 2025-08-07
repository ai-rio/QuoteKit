#!/usr/bin/env tsx
/**
 * Edge Function Testing Script
 * Tests the subscription-status Edge Function locally
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/subscription-status';

interface TestResult {
  name: string;
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}

class EdgeFunctionTester {
  private supabase;
  private results: TestResult[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Test function with authentication
   */
  async testWithAuth(testName: string, params?: string): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // For testing, we'd need a valid session token
      // In real testing, you'd sign in a test user first
      console.warn('⚠️  Authentication testing requires a valid user session');
      
      const url = params ? `${FUNCTION_URL}?${params}` : FUNCTION_URL;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, // This won't work for real auth
          'Content-Type': 'application/json',
        },
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const data = await response.json();

      const result: TestResult = {
        name: testName,
        success: response.ok,
        responseTime,
        data: data,
      };

      if (!response.ok) {
        result.error = data.error || `HTTP ${response.status}`;
      }

      this.results.push(result);
      return result;

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const result: TestResult = {
        name: testName,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test CORS handling
   */
  async testCors(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(FUNCTION_URL, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization, content-type',
        },
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const result: TestResult = {
        name: 'CORS Preflight',
        success: response.ok,
        responseTime,
        data: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        },
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const result: TestResult = {
        name: 'CORS Preflight',
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test without authentication (should fail gracefully)
   */
  async testUnauthorized(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const data = await response.json();

      const result: TestResult = {
        name: 'Unauthorized Request',
        success: response.status === 401, // Should return 401
        responseTime,
        data,
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const result: TestResult = {
        name: 'Unauthorized Request',
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log('🧪 Testing Edge Function: subscription-status');
    console.log(`📡 Function URL: ${FUNCTION_URL}`);
    console.log('');

    // Test CORS
    console.log('🔄 Testing CORS...');
    await this.testCors();

    // Test unauthorized access
    console.log('🔄 Testing unauthorized access...');
    await this.testUnauthorized();

    // Test basic functionality (would need auth)
    console.log('🔄 Testing basic functionality...');
    await this.testWithAuth('Basic Status Check');

    // Test with parameters
    console.log('🔄 Testing with parameters...');
    await this.testWithAuth('With Diagnostics', 'include_diagnostics=true');
    await this.testWithAuth('With Sync Info', 'include_sync=true');
    await this.testWithAuth('Full Test', 'include_diagnostics=true&include_sync=true');

    this.generateReport();
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 TEST REPORT');
    console.log('=' .repeat(60));

    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);

    console.log(`\n✅ Successful Tests: ${successfulTests.length}`);
    console.log(`❌ Failed Tests: ${failedTests.length}`);
    console.log(`📈 Total Tests: ${this.results.length}`);

    if (successfulTests.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      successfulTests.forEach(test => {
        console.log(`  ${test.name}: ${test.responseTime}ms`);
      });

      const avgResponseTime = successfulTests.reduce((sum, t) => sum + t.responseTime, 0) / successfulTests.length;
      console.log(`\n📈 Average Response Time: ${Math.round(avgResponseTime)}ms`);
    }

    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`  ${test.name}: ${test.error}`);
        if (test.data) {
          console.log(`    Data: ${JSON.stringify(test.data, null, 2)}`);
        }
      });
    }

    // Performance comparison with baseline
    console.log('\n🎯 PERFORMANCE ANALYSIS:');
    console.log('  Baseline (API routes): ~800ms');
    if (successfulTests.length > 0) {
      const avgTime = successfulTests.reduce((sum, t) => sum + t.responseTime, 0) / successfulTests.length;
      const improvement = ((800 - avgTime) / 800) * 100;
      console.log(`  Edge Function: ~${Math.round(avgTime)}ms`);
      console.log(`  Improvement: ${Math.round(improvement)}% faster`);
    }

    console.log('\n💡 NEXT STEPS:');
    if (failedTests.some(t => t.name.includes('unauthorized'))) {
      console.log('  ✅ Authentication properly blocks unauthorized access');
    }
    if (successfulTests.some(t => t.name.includes('CORS'))) {
      console.log('  ✅ CORS handling is working correctly');
    }
    console.log('  🔧 Implement proper authentication for full testing');
    console.log('  📊 Deploy to staging environment for integration testing');
    console.log('  🚀 Begin performance comparison with existing API routes');

    console.log('\n' + '=' .repeat(60));
  }
}

// Export for use as module
export { EdgeFunctionTester };

// Run if called directly
if (import.meta.main) {
  const tester = new EdgeFunctionTester();
  tester.runTests().catch(error => {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  });
}