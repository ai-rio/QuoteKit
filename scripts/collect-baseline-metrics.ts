#!/usr/bin/env tsx
/**
 * Baseline Metrics Collection Script
 * Collects current performance metrics from existing API endpoints
 * to establish baseline measurements for Edge Functions improvements
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface MetricResult {
  endpoint: string;
  operation: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  apiCalls?: number;
  dbQueries?: number;
}

class BaselineMetricsCollector {
  private supabase;
  private results: MetricResult[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Measure API endpoint performance
   */
  async measureEndpoint(
    endpoint: string, 
    operation: string, 
    options: RequestInit = {}
  ): Promise<MetricResult> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const result: MetricResult = {
        endpoint,
        operation,
        responseTime,
        statusCode: response.status,
        success: response.ok,
      };

      if (!response.ok) {
        const errorText = await response.text();
        result.error = errorText;
      }

      this.results.push(result);
      return result;

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const result: MetricResult = {
        endpoint,
        operation,
        responseTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test subscription-related endpoints
   */
  async testSubscriptionEndpoints() {
    console.log('🔄 Testing subscription endpoints...');

    // Note: These would require authentication in real scenario
    const endpoints = [
      { path: '/api/subscription-status', operation: 'subscription_status' },
      { path: '/api/debug-subscription', operation: 'subscription_debug' },
      { path: '/api/features/usage', operation: 'feature_usage' },
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.path}...`);
      await this.measureEndpoint(endpoint.path, endpoint.operation);
      
      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Test quote-related endpoints
   */
  async testQuoteEndpoints() {
    console.log('🔄 Testing quote endpoints...');

    const endpoints = [
      { path: '/api/quotes', operation: 'quote_list', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.path}...`);
      await this.measureEndpoint(endpoint.path, endpoint.operation, {
        method: endpoint.method || 'GET',
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Test admin endpoints
   */
  async testAdminEndpoints() {
    console.log('🔄 Testing admin endpoints...');

    // Note: These require admin authentication
    const endpoints = [
      { path: '/api/admin/metrics', operation: 'admin_metrics' },
      { path: '/api/admin/analytics/subscriptions', operation: 'admin_analytics' },
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.path}...`);
      await this.measureEndpoint(endpoint.path, endpoint.operation);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Store baseline metrics in database
   */
  async storeBaselines() {
    console.log('💾 Storing baseline metrics...');

    for (const result of this.results) {
      if (result.success) {
        try {
          await this.supabase.rpc('record_edge_function_performance', {
            p_function_name: `baseline_${result.operation}`,
            p_operation_type: 'baseline_measurement',
            p_execution_time_ms: result.responseTime,
            p_database_queries: result.dbQueries || 0,
            p_api_calls_made: result.apiCalls || 1,
            p_metadata: {
              endpoint: result.endpoint,
              timestamp: new Date().toISOString(),
              baseline: true,
            },
          });
        } catch (error) {
          console.warn(`  ⚠️  Failed to store metric for ${result.endpoint}:`, error);
        }
      }
    }
  }

  /**
   * Generate baseline report
   */
  generateReport() {
    console.log('\n📊 BASELINE METRICS REPORT');
    console.log('=' .repeat(50));

    const successfulResults = this.results.filter(r => r.success);
    const failedResults = this.results.filter(r => !r.success);

    if (successfulResults.length > 0) {
      console.log('\n✅ Successful Measurements:');
      successfulResults.forEach(result => {
        console.log(`  ${result.endpoint}: ${result.responseTime}ms`);
      });

      const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
      console.log(`\n📈 Average Response Time: ${Math.round(avgResponseTime)}ms`);
    }

    if (failedResults.length > 0) {
      console.log('\n❌ Failed Measurements:');
      failedResults.forEach(result => {
        console.log(`  ${result.endpoint}: ${result.error}`);
      });
    }

    // Expected improvements
    console.log('\n🎯 TARGET IMPROVEMENTS:');
    console.log('  Subscription Operations: 800ms → 400ms (50% improvement)');
    console.log('  Quote Generation: 2500ms → 1200ms (52% improvement)');
    console.log('  Admin Analytics: 1500ms → 600ms (60% improvement)');
    console.log('  API Call Reduction: 70% fewer requests');
    console.log('  Cost Reduction: 60-75% monthly savings');

    console.log('\n' + '=' .repeat(50));
  }

  /**
   * Run full baseline collection
   */
  async run() {
    console.log('🚀 Starting baseline metrics collection...');
    console.log(`📡 Base URL: ${BASE_URL}\n`);

    try {
      // Test different endpoint categories
      // Note: In a real scenario, you'd need proper authentication
      await this.testSubscriptionEndpoints();
      await this.testQuoteEndpoints();
      await this.testAdminEndpoints();

      // Store results in database
      await this.storeBaselines();

      // Generate report
      this.generateReport();

      console.log('\n✅ Baseline metrics collection completed!');
      console.log('💡 Next steps:');
      console.log('  1. Set up Edge Functions development environment');
      console.log('  2. Implement subscription status Edge Function');
      console.log('  3. Compare performance improvements');

    } catch (error) {
      console.error('❌ Error during metrics collection:', error);
      process.exit(1);
    }
  }
}

// Export for use as module
export { BaselineMetricsCollector };

// Run if called directly
if (import.meta.main) {
  const collector = new BaselineMetricsCollector();
  collector.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}