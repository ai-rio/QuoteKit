/**
 * Sprint 4: Connection Pool Manager Edge Function
 * Manages database connection pooling optimization and monitoring
 * Provides real-time pool statistics and optimization recommendations
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { requireAdmin } from '../_shared/auth.ts';
// Import connection pool functionality
import {
  ConnectionPoolMonitor,
  DatabaseConnectionPool,
  getConnectionPool,
  getPoolStats,
  PooledSupabaseClient} from '../_shared/connection-pool.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { PerformanceMonitor,recordPerformance } from '../_shared/performance.ts';
import {
  ApiResponse,
  EdgeFunctionContext,
  PerformanceMetrics} from '../_shared/types.ts';
// Import shared utilities
import { 
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
  getErrorMessage} from '../_shared/utils.ts';

// Connection pool configurations for different environments
const POOL_CONFIGS = {
  development: {
    maxConnections: 5,
    minConnections: 1,
    idleTimeout: 300000, // 5 minutes
    connectionTimeout: 10000, // 10 seconds
    healthCheckInterval: 30000, // 30 seconds
    acquireTimeout: 5000 // 5 seconds
  },
  staging: {
    maxConnections: 10,
    minConnections: 2,
    idleTimeout: 300000, // 5 minutes
    connectionTimeout: 15000, // 15 seconds
    healthCheckInterval: 60000, // 1 minute
    acquireTimeout: 8000 // 8 seconds
  },
  production: {
    maxConnections: 25,
    minConnections: 5,
    idleTimeout: 600000, // 10 minutes
    connectionTimeout: 30000, // 30 seconds
    healthCheckInterval: 60000, // 1 minute
    acquireTimeout: 10000 // 10 seconds
  }
};

// Global pool monitor instance
let poolMonitor: ConnectionPoolMonitor | null = null;

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const context: EdgeFunctionContext = {
    functionName: 'connection-pool-manager',
    operationType: 'pool_management',
    requestId,
    isAdmin: true
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let metrics: PerformanceMetrics = {
    executionTimeMs: 0,
    databaseQueries: 0,
    apiCalls: 0,
    memoryUsageMb: 0,
    errorCount: 0
  };

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Authenticate admin request
    const { response: authResponse, user } = await requireAdmin(req);
    if (authResponse) {
      return authResponse;
    }

    context.user = user;
    const url = new URL(req.url);
    const operation = url.pathname.split('/').pop();

    switch (operation) {
      case 'status':
        return await getPoolStatus(supabase, metrics);
      
      case 'optimize':
        return await optimizePool(supabase, req, metrics);
      
      case 'configure':
        return await configurePool(supabase, req, metrics);
      
      case 'metrics':
        return await getPoolMetrics(supabase, req, metrics);
      
      case 'health':
        return await checkPoolHealth(supabase, metrics);
      
      case 'recommendations':
        return await getOptimizationRecommendations(supabase, metrics);
      
      case 'benchmark':
        return await runPerformanceBenchmark(supabase, req, metrics);
      
      case 'monitoring':
        return await manageMonitoring(supabase, req, metrics);
      
      default:
        return createErrorResponse(`Unknown operation: ${operation}`, 400);
    }

  } catch (error) {
    metrics.errorCount++;
    metrics.executionTimeMs = Date.now() - startTime;
    
    console.error('Connection pool manager error:', error);
    
    return createErrorResponse(getErrorMessage(error), 500);
  } finally {
    metrics.executionTimeMs = Date.now() - startTime;
  }
});

/**
 * Get current pool status and statistics
 */
async function getPoolStatus(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const pool = getConnectionPool();
    const stats = pool.getStats();
    const connectionDetails = pool.getConnectionDetails();
    
    // Get historical pool performance
    metrics.databaseQueries++;
    const { data: historicalData } = await supabase
      .from('connection_pool_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(24); // Last 24 records (assuming hourly collection)

    // Calculate performance trends
    const performanceTrends = calculatePerformanceTrends(historicalData || []);

    return createSuccessResponse({
      status: 'success',
      pool: {
        currentStats: stats,
        connectionDetails,
        performanceTrends,
        environment: getEnvironment(),
        configuration: getCurrentConfiguration()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Optimize pool configuration based on current usage patterns
 */
async function optimizePool(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const autoApply = body.autoApply || false;

    const pool = getConnectionPool();
    const currentStats = pool.getStats();
    
    // Analyze usage patterns
    metrics.databaseQueries++;
    const { data: usageData } = await supabase
      .from('connection_pool_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false });

    const analysis = analyzeUsagePatterns(usageData || []);
    const optimizations = generateOptimizations(currentStats, analysis);

    if (autoApply && optimizations.length > 0) {
      await applyOptimizations(supabase, optimizations, metrics);
    }

    // Store optimization results
    metrics.databaseQueries++;
    await supabase
      .from('connection_pool_optimizations')
      .insert({
        optimization_id: generateRequestId(),
        current_stats: currentStats,
        usage_analysis: analysis,
        optimizations: optimizations,
        auto_applied: autoApply,
        created_at: new Date().toISOString()
      });

    return createSuccessResponse({
      status: 'success',
      currentStats,
      usageAnalysis: analysis,
      optimizations,
      autoApplied: autoApply,
      recommendations: generateRecommendations(analysis, optimizations)
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Configure pool settings
 */
async function configurePool(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json();
    const { configuration } = body;

    if (!configuration) {
      return createErrorResponse('Configuration object required', 400);
    }

    // Validate configuration
    const validationResult = validatePoolConfiguration(configuration);
    if (!validationResult.valid) {
      return createErrorResponse(
        `Invalid configuration: ${validationResult.errors.join(', ')}`, 
        400
      );
    }

    // Store new configuration
    metrics.databaseQueries++;
    await supabase
      .from('connection_pool_config')
      .upsert({
        environment: getEnvironment(),
        config_data: configuration,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'environment'
      });

    return createSuccessResponse({
      status: 'success',
      message: 'Pool configuration updated successfully',
      configuration,
      appliedAt: new Date().toISOString()
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Get detailed pool metrics over time
 */
async function getPoolMetrics(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const granularity = url.searchParams.get('granularity') || 'hour';

    const timeRangeMs = parseTimeRange(timeRange);
    const startTime = new Date(Date.now() - timeRangeMs);

    metrics.databaseQueries++;
    const { data: poolMetrics } = await supabase
      .from('connection_pool_metrics')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: true });

    // Aggregate metrics based on granularity
    const aggregatedMetrics = aggregateMetricsByTime(poolMetrics || [], granularity);

    // Calculate statistical insights
    const insights = calculateMetricsInsights(aggregatedMetrics);

    return createSuccessResponse({
      status: 'success',
      metrics: aggregatedMetrics,
      insights,
      timeRange,
      granularity,
      dataPoints: aggregatedMetrics.length
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Check pool health and identify issues
 */
async function checkPoolHealth(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const pool = getConnectionPool();
    const stats = pool.getStats();
    const connectionDetails = pool.getConnectionDetails();

    // Perform health checks
    const healthChecks = await performHealthChecks(pool, supabase, metrics);
    
    // Calculate overall health score
    const healthScore = calculateHealthScore(stats, connectionDetails, healthChecks);
    
    // Identify issues
    const issues = identifyHealthIssues(stats, connectionDetails, healthChecks);

    return createSuccessResponse({
      status: 'success',
      health: {
        score: healthScore,
        status: getHealthStatus(healthScore),
        checks: healthChecks,
        issues,
        recommendations: generateHealthRecommendations(issues)
      },
      poolStats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Get optimization recommendations based on current performance
 */
async function getOptimizationRecommendations(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    // Initialize pool monitor if not exists
    if (!poolMonitor) {
      const pool = getConnectionPool();
      poolMonitor = new ConnectionPoolMonitor(pool);
      poolMonitor.startMonitoring();
    }

    const insights = poolMonitor.getInsights();
    const currentStats = getPoolStats();

    // Get historical performance data
    metrics.databaseQueries++;
    const { data: performanceHistory } = await supabase
      .from('connection_pool_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false });

    const recommendations = generateComprehensiveRecommendations(
      currentStats, 
      insights, 
      performanceHistory || []
    );

    return createSuccessResponse({
      status: 'success',
      currentStats,
      insights,
      recommendations,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Run performance benchmark tests
 */
async function runPerformanceBenchmark(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const testConfig = {
      concurrentConnections: body.concurrentConnections || 10,
      queriesPerConnection: body.queriesPerConnection || 100,
      testDuration: body.testDuration || 60000, // 1 minute
      queryType: body.queryType || 'simple'
    };

    const benchmarkStart = Date.now();
    console.log('Starting connection pool performance benchmark...');

    const results = await runBenchmarkTest(supabase, testConfig, metrics);

    // Store benchmark results
    metrics.databaseQueries++;
    await supabase
      .from('connection_pool_benchmarks')
      .insert({
        benchmark_id: generateRequestId(),
        test_config: testConfig,
        results: results,
        execution_time_ms: Date.now() - benchmarkStart,
        created_at: new Date().toISOString()
      });

    return createSuccessResponse({
      status: 'success',
      benchmark: {
        config: testConfig,
        results,
        executionTimeMs: Date.now() - benchmarkStart
      }
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Manage connection pool monitoring
 */
async function manageMonitoring(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status'; // start, stop, status, configure

    switch (action) {
      case 'start':
        if (!poolMonitor) {
          const pool = getConnectionPool();
          poolMonitor = new ConnectionPoolMonitor(pool);
          poolMonitor.startMonitoring(body.intervalMs || 30000);
        }
        break;
      
      case 'stop':
        poolMonitor = null;
        break;
      
      case 'status':
        // Status is returned at the end
        break;
      
      case 'configure':
        // Configuration would be handled here
        break;
    }

    return createSuccessResponse({
      status: 'success',
      monitoring: {
        active: poolMonitor !== null,
        action: action,
        insights: poolMonitor ? poolMonitor.getInsights() : null
      }
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Helper functions
 */

function getEnvironment(): string {
  const env = Deno.env.get('ENVIRONMENT') || 'development';
  return env;
}

function getCurrentConfiguration() {
  const env = getEnvironment();
  return POOL_CONFIGS[env as keyof typeof POOL_CONFIGS] || POOL_CONFIGS.development;
}

function calculatePerformanceTrends(historicalData: any[]): any {
  if (historicalData.length < 2) {
    return { trend: 'insufficient_data' };
  }

  const recent = historicalData.slice(0, 12); // Last 12 hours
  const older = historicalData.slice(12, 24); // Previous 12 hours

  if (recent.length === 0 || older.length === 0) {
    return { trend: 'insufficient_data' };
  }

  const recentAvgUtil = recent.reduce((sum, d) => sum + (d.pool_utilization || 0), 0) / recent.length;
  const olderAvgUtil = older.reduce((sum, d) => sum + (d.pool_utilization || 0), 0) / older.length;

  const utilizationTrend = recentAvgUtil - olderAvgUtil;

  return {
    utilizationTrend: utilizationTrend.toFixed(2),
    recentAverage: recentAvgUtil.toFixed(2),
    previousAverage: olderAvgUtil.toFixed(2),
    trend: utilizationTrend > 5 ? 'increasing' : utilizationTrend < -5 ? 'decreasing' : 'stable'
  };
}

function analyzeUsagePatterns(usageData: any[]): any {
  if (usageData.length === 0) {
    return { pattern: 'no_data' };
  }

  // Analyze peak usage times, average utilization, error patterns, etc.
  const avgUtilization = usageData.reduce((sum, d) => sum + (d.pool_utilization || 0), 0) / usageData.length;
  const maxUtilization = Math.max(...usageData.map(d => d.pool_utilization || 0));
  const avgAcquisitionTime = usageData.reduce((sum, d) => sum + (d.connection_acquisition_time || 0), 0) / usageData.length;

  // Identify usage patterns by hour
  const hourlyUsage: { [key: number]: number[] } = {};
  usageData.forEach(d => {
    const hour = new Date(d.created_at).getHours();
    if (!hourlyUsage[hour]) hourlyUsage[hour] = [];
    hourlyUsage[hour].push(d.pool_utilization || 0);
  });

  const peakHours = Object.entries(hourlyUsage)
    .map(([hour, utilizations]) => ({
      hour: parseInt(hour),
      avgUtilization: utilizations.reduce((sum, u) => sum + u, 0) / utilizations.length
    }))
    .sort((a, b) => b.avgUtilization - a.avgUtilization)
    .slice(0, 3)
    .map(h => h.hour);

  return {
    avgUtilization: avgUtilization.toFixed(2),
    maxUtilization: maxUtilization.toFixed(2),
    avgAcquisitionTime: avgAcquisitionTime.toFixed(2),
    peakHours,
    dataPoints: usageData.length,
    timeSpan: `${Math.round((Date.now() - new Date(usageData[usageData.length - 1]?.created_at).getTime()) / (1000 * 60 * 60))} hours`
  };
}

function generateOptimizations(currentStats: any, analysis: any): any[] {
  const optimizations = [];

  // Check if pool size needs adjustment
  if (parseFloat(analysis.maxUtilization) > 90) {
    optimizations.push({
      type: 'increase_max_connections',
      current: currentStats.totalConnections,
      recommended: Math.ceil(currentStats.totalConnections * 1.3),
      reason: 'High maximum utilization detected',
      impact: 'high'
    });
  }

  // Check acquisition time
  if (parseFloat(analysis.avgAcquisitionTime) > 500) {
    optimizations.push({
      type: 'increase_pool_size',
      current: currentStats.totalConnections,
      recommended: currentStats.totalConnections + 2,
      reason: 'High connection acquisition time',
      impact: 'medium'
    });
  }

  // Check idle connections
  if (currentStats.idleConnections > currentStats.totalConnections * 0.7) {
    optimizations.push({
      type: 'reduce_idle_timeout',
      current: '10 minutes',
      recommended: '5 minutes',
      reason: 'Many idle connections detected',
      impact: 'low'
    });
  }

  return optimizations;
}

async function applyOptimizations(supabase: any, optimizations: any[], metrics: PerformanceMetrics): Promise<void> {
  for (const optimization of optimizations) {
    try {
      // Apply the optimization based on type
      switch (optimization.type) {
        case 'increase_max_connections':
        case 'increase_pool_size':
          // Store configuration change
          metrics.databaseQueries++;
          await supabase
            .from('connection_pool_config_changes')
            .insert({
              change_type: optimization.type,
              old_value: optimization.current,
              new_value: optimization.recommended,
              reason: optimization.reason,
              applied_at: new Date().toISOString()
            });
          break;
      }
    } catch (error) {
      console.error(`Failed to apply optimization ${optimization.type}:`, error);
    }
  }
}

function generateRecommendations(analysis: any, optimizations: any[]): string[] {
  const recommendations = [];

  if (optimizations.length === 0) {
    recommendations.push('Pool configuration appears optimal for current usage patterns');
  } else {
    recommendations.push(`${optimizations.length} optimization opportunities identified`);
    
    if (optimizations.some(o => o.impact === 'high')) {
      recommendations.push('High-impact optimizations available - consider immediate implementation');
    }
  }

  if (parseFloat(analysis.maxUtilization) > 85) {
    recommendations.push('Consider implementing connection pooling alerts for high utilization');
  }

  if (analysis.peakHours?.length > 0) {
    recommendations.push(`Peak usage detected at hours: ${analysis.peakHours.join(', ')}`);
  }

  return recommendations;
}

function validatePoolConfiguration(config: any): { valid: boolean; errors: string[] } {
  const errors = [];

  if (!config.maxConnections || config.maxConnections < 1) {
    errors.push('maxConnections must be at least 1');
  }

  if (!config.minConnections || config.minConnections < 0) {
    errors.push('minConnections must be at least 0');
  }

  if (config.minConnections > config.maxConnections) {
    errors.push('minConnections cannot exceed maxConnections');
  }

  if (!config.idleTimeout || config.idleTimeout < 1000) {
    errors.push('idleTimeout must be at least 1000ms');
  }

  if (!config.connectionTimeout || config.connectionTimeout < 1000) {
    errors.push('connectionTimeout must be at least 1000ms');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function parseTimeRange(timeRange: string): number {
  const timeRanges: { [key: string]: number } = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  return timeRanges[timeRange] || timeRanges['24h'];
}

function aggregateMetricsByTime(metrics: any[], granularity: string): any[] {
  // This would implement time-based aggregation logic
  // For now, return the raw metrics
  return metrics;
}

function calculateMetricsInsights(metrics: any[]): any {
  if (metrics.length === 0) return {};

  const avgUtilization = metrics.reduce((sum, m) => sum + (m.pool_utilization || 0), 0) / metrics.length;
  const maxUtilization = Math.max(...metrics.map(m => m.pool_utilization || 0));
  const avgConnections = metrics.reduce((sum, m) => sum + (m.total_connections || 0), 0) / metrics.length;

  return {
    averageUtilization: Math.round(avgUtilization),
    peakUtilization: Math.round(maxUtilization),
    averageConnections: Math.round(avgConnections),
    dataQuality: metrics.length > 10 ? 'good' : 'limited'
  };
}

async function performHealthChecks(pool: any, supabase: any, metrics: PerformanceMetrics): Promise<any[]> {
  const checks = [];

  // Connection availability check
  try {
    const startTime = Date.now();
    await pool.query(async (client: any) => {
      await client.from('edge_function_performance').select('id').limit(1);
    });
    checks.push({
      name: 'connection_availability',
      status: 'pass',
      responseTime: Date.now() - startTime,
      message: 'Connections are available and responsive'
    });
  } catch (error) {
    checks.push({
      name: 'connection_availability',
      status: 'fail',
      error: getErrorMessage(error),
      message: 'Failed to acquire or use connection'
    });
  }

  // Pool utilization check
  const stats = pool.getStats();
  checks.push({
    name: 'pool_utilization',
    status: stats.poolUtilization > 90 ? 'warning' : 'pass',
    utilization: stats.poolUtilization,
    message: stats.poolUtilization > 90 ? 'High pool utilization' : 'Pool utilization normal'
  });

  return checks;
}

function calculateHealthScore(stats: any, connectionDetails: any[], healthChecks: any[]): number {
  let score = 100;

  // Deduct points for high utilization
  if (stats.poolUtilization > 90) score -= 20;
  else if (stats.poolUtilization > 75) score -= 10;

  // Deduct points for failed health checks
  const failedChecks = healthChecks.filter(check => check.status === 'fail').length;
  score -= failedChecks * 15;

  // Deduct points for warnings
  const warningChecks = healthChecks.filter(check => check.status === 'warning').length;
  score -= warningChecks * 5;

  // Deduct points for high error rate
  if (stats.errorRate > 5) score -= 15;
  else if (stats.errorRate > 1) score -= 5;

  return Math.max(0, score);
}

function identifyHealthIssues(stats: any, connectionDetails: any[], healthChecks: any[]): any[] {
  const issues = [];

  if (stats.poolUtilization > 90) {
    issues.push({
      type: 'high_utilization',
      severity: 'high',
      message: `Pool utilization is ${stats.poolUtilization.toFixed(1)}%`,
      recommendation: 'Consider increasing maxConnections'
    });
  }

  const failedChecks = healthChecks.filter(check => check.status === 'fail');
  if (failedChecks.length > 0) {
    issues.push({
      type: 'failed_health_checks',
      severity: 'critical',
      message: `${failedChecks.length} health check(s) failed`,
      recommendation: 'Investigate database connectivity and configuration'
    });
  }

  if (stats.errorRate > 5) {
    issues.push({
      type: 'high_error_rate',
      severity: 'high',
      message: `Error rate is ${stats.errorRate.toFixed(2)}%`,
      recommendation: 'Review query patterns and database performance'
    });
  }

  return issues;
}

function generateHealthRecommendations(issues: any[]): string[] {
  if (issues.length === 0) {
    return ['Pool health is good - no immediate action required'];
  }

  return issues.map(issue => issue.recommendation);
}

function getHealthStatus(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
}

function generateComprehensiveRecommendations(currentStats: any, insights: any, performanceHistory: any[]): any[] {
  const recommendations = [];

  // Based on current utilization
  if (insights.averageUtilization > 70) {
    recommendations.push({
      category: 'capacity',
      priority: 'high',
      title: 'Increase Pool Size',
      description: `Average utilization is ${insights.averageUtilization}%`,
      action: 'Increase maxConnections by 25-50%',
      expectedImpact: 'Reduced connection acquisition time and improved performance'
    });
  }

  // Based on acquisition time
  if (insights.averageAcquisitionTime > 100) {
    recommendations.push({
      category: 'performance',
      priority: 'medium',
      title: 'Optimize Connection Acquisition',
      description: `Average acquisition time is ${insights.averageAcquisitionTime}ms`,
      action: 'Increase minimum connections or review query efficiency',
      expectedImpact: 'Faster response times for database operations'
    });
  }

  // Based on error rate
  if (insights.errorRate > 1) {
    recommendations.push({
      category: 'reliability',
      priority: 'high',
      title: 'Address Connection Errors',
      description: `Error rate is ${insights.errorRate}%`,
      action: 'Review connection timeouts and database health',
      expectedImpact: 'Improved system reliability and user experience'
    });
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'optimization',
      priority: 'low',
      title: 'Pool Performance Optimal',
      description: 'Current configuration appears well-tuned',
      action: 'Continue monitoring and maintain current settings',
      expectedImpact: 'Sustained good performance'
    });
  }

  return recommendations;
}

async function runBenchmarkTest(supabase: any, config: any, metrics: PerformanceMetrics): Promise<any> {
  const results = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageResponseTime: 0,
    minResponseTime: Number.MAX_SAFE_INTEGER,
    maxResponseTime: 0,
    queriesPerSecond: 0,
    connectionAcquisitionTime: 0
  };

  const startTime = Date.now();
  const pool = getConnectionPool();
  
  // Run concurrent connection tests
  const promises = [];
  for (let i = 0; i < config.concurrentConnections; i++) {
    promises.push(runConnectionTest(pool, config.queriesPerConnection));
  }

  const connectionResults = await Promise.allSettled(promises);
  
  // Aggregate results
  connectionResults.forEach(result => {
    if (result.status === 'fulfilled') {
      const connectionResult = result.value;
      results.totalQueries += connectionResult.totalQueries;
      results.successfulQueries += connectionResult.successfulQueries;
      results.failedQueries += connectionResult.failedQueries;
      results.averageResponseTime += connectionResult.averageResponseTime;
      results.minResponseTime = Math.min(results.minResponseTime, connectionResult.minResponseTime);
      results.maxResponseTime = Math.max(results.maxResponseTime, connectionResult.maxResponseTime);
    }
  });

  // Calculate final metrics
  const totalTime = Date.now() - startTime;
  results.averageResponseTime = results.averageResponseTime / config.concurrentConnections;
  results.queriesPerSecond = (results.totalQueries / totalTime) * 1000;

  return results;
}

async function runConnectionTest(pool: any, queryCount: number): Promise<any> {
  const results = {
    totalQueries: queryCount,
    successfulQueries: 0,
    failedQueries: 0,
    averageResponseTime: 0,
    minResponseTime: Number.MAX_SAFE_INTEGER,
    maxResponseTime: 0
  };

  let totalResponseTime = 0;

  for (let i = 0; i < queryCount; i++) {
    try {
      const startTime = Date.now();
      
      await pool.query(async (client: any) => {
        // Simple test query
        await client.from('edge_function_performance').select('id').limit(1);
      });
      
      const responseTime = Date.now() - startTime;
      totalResponseTime += responseTime;
      results.successfulQueries++;
      results.minResponseTime = Math.min(results.minResponseTime, responseTime);
      results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);
      
    } catch (error) {
      results.failedQueries++;
    }
  }

  results.averageResponseTime = totalResponseTime / queryCount;
  return results;
}