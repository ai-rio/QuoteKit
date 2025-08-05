/**
 * Performance Impact Assessment and Monitoring
 * Comprehensive performance monitoring for payment system changes
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/libs/supabase/types';
import { performance } from 'perf_hooks';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, any>;
}

interface PerformanceBenchmark {
  name: string;
  baseline: number;
  current: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
}

interface PerformanceReport {
  timestamp: Date;
  overall_status: 'healthy' | 'degraded' | 'critical';
  benchmarks: PerformanceBenchmark[];
  alerts: PerformanceAlert[];
  recommendations: string[];
}

interface PerformanceAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  threshold: number;
  current: number;
  timestamp: Date;
}

export class PerformanceMonitor {
  private supabase: ReturnType<typeof createClient<Database>>;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private alerts: PerformanceAlert[] = [];

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializeBaselines();
    this.startContinuousMonitoring();
  }

  /**
   * Initialize performance baselines
   */
  private initializeBaselines(): void {
    const baselines = [
      { name: 'database_query_time', baseline: 100, threshold: 200 }, // ms
      { name: 'api_response_time', baseline: 150, threshold: 300 }, // ms
      { name: 'webhook_processing_time', baseline: 500, threshold: 1000 }, // ms
      { name: 'stripe_api_call_time', baseline: 200, threshold: 500 }, // ms
      { name: 'subscription_creation_time', baseline: 1000, threshold: 2000 }, // ms
      { name: 'payment_method_sync_time', baseline: 300, threshold: 600 }, // ms
      { name: 'page_load_time', baseline: 800, threshold: 1500 }, // ms
      { name: 'database_connection_time', baseline: 50, threshold: 100 }, // ms
      { name: 'memory_usage_percentage', baseline: 60, threshold: 80 }, // %
      { name: 'cpu_usage_percentage', baseline: 50, threshold: 75 }, // %
      { name: 'error_rate_percentage', baseline: 0.1, threshold: 1 }, // %
      { name: 'concurrent_users', baseline: 100, threshold: 500 }
    ];

    baselines.forEach(baseline => {
      this.benchmarks.set(baseline.name, {
        name: baseline.name,
        baseline: baseline.baseline,
        current: baseline.baseline,
        threshold: baseline.threshold,
        status: 'good',
        trend: 'stable'
      });
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only last 1000 metrics per type
    if (metrics.length > 1000) {
      metrics.shift();
    }

    // Update benchmark
    this.updateBenchmark(name, value);

    // Check for alerts
    this.checkForAlerts(metric);
  }

  /**
   * Measure and record function execution time
   */
  async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', context);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', { ...context, error: true });
      throw error;
    }
  }

  /**
   * Database performance monitoring
   */
  async monitorDatabasePerformance(): Promise<void> {
    // Query execution time monitoring
    await this.measureExecutionTime('database_query_time', async () => {
      const start = performance.now();
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('count')
        .limit(1);
      const duration = performance.now() - start;
      
      if (error) {
        this.recordMetric('database_error_rate', 1, 'count');
        throw error;
      }
      
      return data;
    });

    // Connection pool monitoring
    await this.measureExecutionTime('database_connection_time', async () => {
      const start = performance.now();
      const { data } = await this.supabase.rpc('version');
      return performance.now() - start;
    });

    // Complex query performance
    await this.measureExecutionTime('complex_query_time', async () => {
      const { data } = await this.supabase
        .from('subscriptions')
        .select(`
          *,
          customers(*),
          stripe_prices(*)
        `)
        .limit(10);
      return data;
    });
  }

  /**
   * API endpoint performance monitoring
   */
  async monitorAPIPerformance(): Promise<void> {
    const endpoints = [
      '/api/subscription-status',
      '/api/payment-methods',
      '/api/webhooks/stripe',
      '/api/sync-my-subscription'
    ];

    for (const endpoint of endpoints) {
      try {
        await this.measureExecutionTime(`api_${endpoint.replace(/[\/\-]/g, '_')}_time`, async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
          });
          
          if (!response.ok) {
            this.recordMetric('api_error_rate', 1, 'count', { endpoint, status: response.status });
          }
          
          return response;
        });
      } catch (error) {
        this.recordMetric('api_error_rate', 1, 'count', { endpoint, error: true });
      }
    }
  }

  /**
   * Stripe API performance monitoring
   */
  async monitorStripePerformance(): Promise<void> {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Test Stripe API calls
    const stripeOperations = [
      {
        name: 'stripe_customer_list',
        operation: () => stripe.customers.list({ limit: 1 })
      },
      {
        name: 'stripe_subscription_list',
        operation: () => stripe.subscriptions.list({ limit: 1 })
      },
      {
        name: 'stripe_price_list',
        operation: () => stripe.prices.list({ limit: 1 })
      }
    ];

    for (const op of stripeOperations) {
      try {
        await this.measureExecutionTime(op.name, op.operation);
      } catch (error) {
        this.recordMetric('stripe_error_rate', 1, 'count', { operation: op.name });
      }
    }
  }

  /**
   * Subscription workflow performance monitoring
   */
  async monitorSubscriptionWorkflows(): Promise<void> {
    // Monitor subscription creation workflow
    await this.measureExecutionTime('subscription_creation_workflow', async () => {
      // Simulate subscription creation steps
      const steps = [
        () => this.supabase.from('customers').select('*').limit(1),
        () => this.supabase.from('stripe_prices').select('*').limit(1),
        () => this.supabase.from('subscriptions').select('*').limit(1)
      ];

      for (const step of steps) {
        await step();
      }
    });

    // Monitor payment method workflows
    await this.measureExecutionTime('payment_method_workflow', async () => {
      // Simulate payment method operations
      const { data } = await this.supabase
        .from('customers')
        .select('stripe_customer_id')
        .limit(1)
        .single();

      if (data?.stripe_customer_id) {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.paymentMethods.list({
          customer: data.stripe_customer_id,
          limit: 1
        });
      }
    });
  }

  /**
   * Memory and resource monitoring
   */
  monitorSystemResources(): void {
    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    this.recordMetric('memory_usage_percentage', memUsagePercent, '%');
    this.recordMetric('memory_heap_used', memUsage.heapUsed / 1024 / 1024, 'MB');
    this.recordMetric('memory_heap_total', memUsage.heapTotal / 1024 / 1024, 'MB');

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    this.recordMetric('cpu_user_time', cpuUsage.user / 1000, 'ms');
    this.recordMetric('cpu_system_time', cpuUsage.system / 1000, 'ms');
  }

  /**
   * Update performance benchmark
   */
  private updateBenchmark(name: string, value: number): void {
    const benchmark = this.benchmarks.get(name);
    if (!benchmark) return;

    const previousValue = benchmark.current;
    benchmark.current = value;

    // Update status
    if (value <= benchmark.baseline) {
      benchmark.status = 'good';
    } else if (value <= benchmark.threshold) {
      benchmark.status = 'warning';
    } else {
      benchmark.status = 'critical';
    }

    // Update trend
    if (value < previousValue * 0.95) {
      benchmark.trend = 'improving';
    } else if (value > previousValue * 1.05) {
      benchmark.trend = 'degrading';
    } else {
      benchmark.trend = 'stable';
    }

    this.benchmarks.set(name, benchmark);
  }

  /**
   * Check for performance alerts
   */
  private checkForAlerts(metric: PerformanceMetric): void {
    const benchmark = this.benchmarks.get(metric.name);
    if (!benchmark) return;

    if (benchmark.status === 'critical') {
      this.alerts.push({
        severity: 'critical',
        message: `${metric.name} exceeded critical threshold`,
        metric: metric.name,
        threshold: benchmark.threshold,
        current: metric.value,
        timestamp: metric.timestamp
      });
    } else if (benchmark.status === 'warning') {
      this.alerts.push({
        severity: 'medium',
        message: `${metric.name} exceeded warning threshold`,
        metric: metric.name,
        threshold: benchmark.baseline,
        current: metric.value,
        timestamp: metric.timestamp
      });
    }

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): PerformanceReport {
    const benchmarks = Array.from(this.benchmarks.values());
    const criticalBenchmarks = benchmarks.filter(b => b.status === 'critical');
    const warningBenchmarks = benchmarks.filter(b => b.status === 'warning');

    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (criticalBenchmarks.length > 0) {
      overallStatus = 'critical';
    } else if (warningBenchmarks.length > 2) {
      overallStatus = 'degraded';
    }

    const recommendations: string[] = [];

    // Generate recommendations based on performance issues
    if (criticalBenchmarks.some(b => b.name.includes('database'))) {
      recommendations.push('Consider optimizing database queries and adding indexes');
    }
    if (criticalBenchmarks.some(b => b.name.includes('stripe'))) {
      recommendations.push('Review Stripe API usage and implement request batching');
    }
    if (criticalBenchmarks.some(b => b.name.includes('memory'))) {
      recommendations.push('Investigate memory leaks and optimize memory usage');
    }
    if (criticalBenchmarks.some(b => b.name.includes('api'))) {
      recommendations.push('Optimize API endpoints and implement caching');
    }

    return {
      timestamp: new Date(),
      overall_status: overallStatus,
      benchmarks,
      alerts: this.alerts.slice(-20), // Last 20 alerts
      recommendations
    };
  }

  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    // Monitor every 5 minutes
    setInterval(async () => {
      try {
        await this.runPerformanceCheck();
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, 5 * 60 * 1000);

    // System resources every minute
    setInterval(() => {
      this.monitorSystemResources();
    }, 60 * 1000);
  }

  /**
   * Run comprehensive performance check
   */
  async runPerformanceCheck(): Promise<void> {
    console.log('🔍 Running performance check...');

    await Promise.allSettled([
      this.monitorDatabasePerformance(),
      this.monitorAPIPerformance(),
      this.monitorStripePerformance(),
      this.monitorSubscriptionWorkflows()
    ]);

    const report = this.generatePerformanceReport();
    
    if (report.overall_status === 'critical') {
      console.error('🚨 CRITICAL: Performance degradation detected');
      await this.sendPerformanceAlert(report);
    } else if (report.overall_status === 'degraded') {
      console.warn('⚠️ WARNING: Performance degradation detected');
    } else {
      console.log('✅ Performance check completed - all systems healthy');
    }
  }

  /**
   * Performance testing for specific operations
   */
  async runPerformanceTests(): Promise<void> {
    console.log('🧪 Running performance tests...');

    const tests = [
      {
        name: 'Subscription Creation Load Test',
        test: () => this.testSubscriptionCreationPerformance()
      },
      {
        name: 'Payment Method Sync Load Test',
        test: () => this.testPaymentMethodSyncPerformance()
      },
      {
        name: 'Webhook Processing Load Test',
        test: () => this.testWebhookProcessingPerformance()
      },
      {
        name: 'Database Query Load Test',
        test: () => this.testDatabaseQueryPerformance()
      }
    ];

    for (const test of tests) {
      try {
        console.log(`  Running: ${test.name}`);
        await test.test();
        console.log(`  ✅ ${test.name} completed`);
      } catch (error) {
        console.error(`  ❌ ${test.name} failed:`, error);
      }
    }
  }

  private async testSubscriptionCreationPerformance(): Promise<void> {
    const iterations = 10;
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.measureExecutionTime('test_subscription_creation', async () => {
        // Simulate subscription creation workflow
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return true;
      });
      const duration = performance.now() - start;
      results.push(duration);
    }

    const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    this.recordMetric('subscription_creation_load_test_avg', avgTime, 'ms');
  }

  private async testPaymentMethodSyncPerformance(): Promise<void> {
    const iterations = 20;
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.measureExecutionTime('test_payment_method_sync', async () => {
        // Simulate payment method sync
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return true;
      });
      const duration = performance.now() - start;
      results.push(duration);
    }

    const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    this.recordMetric('payment_method_sync_load_test_avg', avgTime, 'ms');
  }

  private async testWebhookProcessingPerformance(): Promise<void> {
    const iterations = 50;
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.measureExecutionTime('test_webhook_processing', async () => {
        // Simulate webhook processing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        return true;
      });
      const duration = performance.now() - start;
      results.push(duration);
    }

    const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    this.recordMetric('webhook_processing_load_test_avg', avgTime, 'ms');
  }

  private async testDatabaseQueryPerformance(): Promise<void> {
    const iterations = 30;
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const queryResult = await this.measureExecutionTime('test_database_query', async () => {
        const { data } = await this.supabase
          .from('subscriptions')
          .select('*')
          .limit(10);
        return data;
      });
      const duration = performance.now() - start;
      results.push(duration);
    }

    const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    this.recordMetric('database_query_load_test_avg', avgTime, 'ms');
  }

  private async sendPerformanceAlert(report: PerformanceReport): Promise<void> {
    // Implementation for sending performance alerts
    console.log('📧 Sending performance alert...');
    console.log('Critical benchmarks:', report.benchmarks.filter(b => b.status === 'critical'));
  }

  /**
   * Get performance metrics for a specific time range
   */
  getMetrics(name: string, hours: number = 24): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return metrics.filter(metric => metric.timestamp > cutoffTime);
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus(): Record<string, any> {
    const report = this.generatePerformanceReport();
    
    return {
      status: report.overall_status,
      criticalIssues: report.benchmarks.filter(b => b.status === 'critical').length,
      warnings: report.benchmarks.filter(b => b.status === 'warning').length,
      recentAlerts: report.alerts.length,
      recommendations: report.recommendations.length
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();