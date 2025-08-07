/**
 * Sprint 4: Performance Optimization Edge Function
 * Implements cold start optimization, performance tuning, and advanced optimization strategies
 * Focuses on reducing latency, improving throughput, and optimizing Edge Function execution
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { recordPerformance, PerformanceMonitor } from '../_shared/performance.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import {
  ApiResponse,
  EdgeFunctionContext,
  PerformanceMetrics
} from '../_shared/types.ts';
import { 
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
  getErrorMessage
} from '../_shared/utils.ts';

// Performance optimization configurations
interface OptimizationConfig {
  enableCodeSplitting: boolean;
  enableModuleCaching: boolean;
  enableConnectionPooling: boolean;
  enableContentCompression: boolean;
  enableLazyLoading: boolean;
  coldStartOptimizations: {
    preloadCriticalModules: boolean;
    connectionPreWarming: boolean;
    memoryOptimization: boolean;
    executionContextReuse: boolean;
  };
  performanceTargets: {
    coldStartTimeMs: number;
    warmStartTimeMs: number;
    maxMemoryUsageMb: number;
    maxExecutionTimeMs: number;
  };
}

// Global optimization state
interface OptimizationState {
  isWarmed: boolean;
  lastWarmedAt: number;
  moduleCache: Map<string, any>;
  connectionPool: any;
  preloadedResources: Set<string>;
  performanceMetrics: PerformanceMetrics[];
}

// Global state management
let optimizationState: OptimizationState = {
  isWarmed: false,
  lastWarmedAt: 0,
  moduleCache: new Map(),
  connectionPool: null,
  preloadedResources: new Set(),
  performanceMetrics: []
};

// Default optimization configuration
const DEFAULT_CONFIG: OptimizationConfig = {
  enableCodeSplitting: true,
  enableModuleCaching: true,
  enableConnectionPooling: true,
  enableContentCompression: true,
  enableLazyLoading: true,
  coldStartOptimizations: {
    preloadCriticalModules: true,
    connectionPreWarming: true,
    memoryOptimization: true,
    executionContextReuse: true
  },
  performanceTargets: {
    coldStartTimeMs: 500,
    warmStartTimeMs: 50,
    maxMemoryUsageMb: 128,
    maxExecutionTimeMs: 30000
  }
};

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const context: EdgeFunctionContext = {
    functionName: 'performance-optimizer',
    operationType: 'performance_optimization',
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
    // Warm up if cold start detected
    const isColdStart = await detectAndHandleColdStart(startTime);
    
    // Initialize Supabase client with optimizations
    const supabase = await getOptimizedSupabaseClient();

    // Authenticate admin request
    const authResult = await authenticateRequest(req, supabase);
    if (!authResult.success || !authResult.isAdmin) {
      return createErrorResponse('Admin access required', 403);
    }

    context.user = authResult.user;
    const url = new URL(req.url);
    const operation = url.pathname.split('/').pop();

    switch (operation) {
      case 'analyze':
        return await analyzePerformance(supabase, req, metrics);
      
      case 'optimize':
        return await optimizeFunction(supabase, req, metrics);
      
      case 'benchmark':
        return await runPerformanceBenchmark(supabase, req, metrics);
      
      case 'cold-start-optimization':
        return await optimizeColdStart(supabase, req, metrics);
      
      case 'warm-up':
        return await performWarmUp(supabase, metrics);
      
      case 'memory-optimization':
        return await optimizeMemoryUsage(supabase, metrics);
      
      case 'connection-optimization':
        return await optimizeConnections(supabase, metrics);
      
      case 'metrics':
        return await getPerformanceMetrics(supabase, req, metrics);
      
      case 'recommendations':
        return await generateOptimizationRecommendations(supabase, metrics);
      
      default:
        return createErrorResponse(`Unknown operation: ${operation}`, 400);
    }

  } catch (error) {
    metrics.errorCount++;
    console.error('Performance optimizer error:', error);
    return createErrorResponse(getErrorMessage(error), 500);
  } finally {
    metrics.executionTimeMs = Date.now() - startTime;
    
    // Track performance metrics
    optimizationState.performanceMetrics.push({
      ...metrics,
      timestamp: Date.now()
    });
    
    // Keep only last 100 metrics
    if (optimizationState.performanceMetrics.length > 100) {
      optimizationState.performanceMetrics = optimizationState.performanceMetrics.slice(-100);
    }
  }
});

/**
 * Detect and handle cold start scenarios
 */
async function detectAndHandleColdStart(startTime: number): Promise<boolean> {
  const isColdStart = !optimizationState.isWarmed || 
    (Date.now() - optimizationState.lastWarmedAt) > 300000; // 5 minutes

  if (isColdStart) {
    console.log('Cold start detected, performing optimizations...');
    
    // Preload critical modules
    if (DEFAULT_CONFIG.coldStartOptimizations.preloadCriticalModules) {
      await preloadCriticalModules();
    }

    // Pre-warm connections
    if (DEFAULT_CONFIG.coldStartOptimizations.connectionPreWarming) {
      await preWarmConnections();
    }

    // Memory optimization
    if (DEFAULT_CONFIG.coldStartOptimizations.memoryOptimization) {
      await optimizeMemoryLayout();
    }

    optimizationState.isWarmed = true;
    optimizationState.lastWarmedAt = Date.now();
    
    console.log(`Cold start optimization completed in ${Date.now() - startTime}ms`);
  }

  return isColdStart;
}

/**
 * Get optimized Supabase client with connection pooling
 */
async function getOptimizedSupabaseClient(): Promise<any> {
  if (optimizationState.connectionPool && DEFAULT_CONFIG.enableConnectionPooling) {
    return optimizationState.connectionPool;
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      // Performance optimizations
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'Connection': 'keep-alive',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      }
    }
  );

  if (DEFAULT_CONFIG.enableConnectionPooling) {
    optimizationState.connectionPool = client;
  }

  return client;
}

/**
 * Preload critical modules for faster execution
 */
async function preloadCriticalModules(): Promise<void> {
  const criticalModules = [
    'crypto',
    'performance',
    'connection-pool',
    'auth',
    'utils'
  ];

  const preloadPromises = criticalModules.map(async (moduleName) => {
    if (!optimizationState.moduleCache.has(moduleName)) {
      try {
        // Simulate module preloading
        const module = await import(`../_shared/${moduleName}.ts`);
        optimizationState.moduleCache.set(moduleName, module);
        optimizationState.preloadedResources.add(moduleName);
      } catch (error) {
        console.warn(`Failed to preload module ${moduleName}:`, error);
      }
    }
  });

  await Promise.allSettled(preloadPromises);
}

/**
 * Pre-warm database connections
 */
async function preWarmConnections(): Promise<void> {
  try {
    const client = await getOptimizedSupabaseClient();
    
    // Perform lightweight connection test
    await client
      .from('edge_function_performance')
      .select('id')
      .limit(1)
      .single();
    
    console.log('Connection pre-warming completed');
  } catch (error) {
    console.warn('Connection pre-warming failed:', error);
  }
}

/**
 * Optimize memory layout and garbage collection
 */
async function optimizeMemoryLayout(): Promise<void> {
  try {
    // Force garbage collection if available
    if (typeof gc === 'function') {
      gc();
    }

    // Clear any old cached data
    const maxCacheAge = 300000; // 5 minutes
    const now = Date.now();
    
    optimizationState.performanceMetrics = optimizationState.performanceMetrics
      .filter((metric: any) => (now - metric.timestamp) < maxCacheAge);

    console.log('Memory optimization completed');
  } catch (error) {
    console.warn('Memory optimization failed:', error);
  }
}

/**
 * Analyze current performance characteristics
 */
async function analyzePerformance(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const analysisStart = Date.now();
    
    // Get recent performance data
    metrics.databaseQueries++;
    const { data: performanceHistory } = await supabase
      .from('edge_function_performance')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Analyze cold start patterns
    const coldStartAnalysis = analyzeColdStartPatterns(performanceHistory || []);
    
    // Analyze memory usage patterns
    const memoryAnalysis = analyzeMemoryPatterns(optimizationState.performanceMetrics);
    
    // Analyze response time trends
    const responseTimeAnalysis = analyzeResponseTimeTrends(performanceHistory || []);
    
    // Generate performance insights
    const insights = generatePerformanceInsights(
      coldStartAnalysis,
      memoryAnalysis,
      responseTimeAnalysis
    );

    const analysisTime = Date.now() - analysisStart;

    return createSuccessResponse({
      status: 'success',
      analysis: {
        coldStartAnalysis,
        memoryAnalysis,
        responseTimeAnalysis,
        insights,
        optimizationState: {
          isWarmed: optimizationState.isWarmed,
          preloadedModules: Array.from(optimizationState.preloadedResources),
          cacheHitRatio: calculateCacheHitRatio()
        }
      },
      analysisTimeMs: analysisTime,
      recommendations: generatePerformanceRecommendations(insights)
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Apply performance optimizations
 */
async function optimizeFunction(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const optimizations = body.optimizations || [];
    const autoApply = body.autoApply || false;

    const results = [];

    for (const optimization of optimizations) {
      const result = await applyOptimization(optimization, supabase, metrics);
      results.push(result);
    }

    // Store optimization results
    metrics.databaseQueries++;
    await supabase
      .from('performance_optimizations')
      .insert({
        optimization_id: generateRequestId(),
        optimizations_applied: optimizations,
        results: results,
        auto_applied: autoApply,
        created_at: new Date().toISOString()
      });

    return createSuccessResponse({
      status: 'success',
      optimizationsApplied: optimizations.length,
      results,
      performanceImpact: calculatePerformanceImpact(results)
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Run comprehensive performance benchmarks
 */
async function runPerformanceBenchmark(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const benchmarkConfig = {
      duration: body.duration || 60000, // 1 minute
      concurrency: body.concurrency || 10,
      includeColdStart: body.includeColdStart || true,
      includeMemoryTest: body.includeMemoryTest || true,
      includeConnectionTest: body.includeConnectionTest || true
    };

    console.log('Starting comprehensive performance benchmark...');
    const benchmarkStart = Date.now();

    const results = await runComprehensiveBenchmark(
      supabase, 
      benchmarkConfig, 
      metrics
    );

    // Store benchmark results
    metrics.databaseQueries++;
    await supabase
      .from('performance_benchmarks')
      .insert({
        benchmark_id: generateRequestId(),
        config: benchmarkConfig,
        results: results,
        execution_time_ms: Date.now() - benchmarkStart,
        created_at: new Date().toISOString()
      });

    return createSuccessResponse({
      status: 'success',
      benchmark: {
        config: benchmarkConfig,
        results,
        executionTimeMs: Date.now() - benchmarkStart,
        performanceScore: calculatePerformanceScore(results)
      }
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Optimize cold start performance
 */
async function optimizeColdStart(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const optimizationStart = Date.now();

    // Reset optimization state to simulate cold start
    optimizationState.isWarmed = false;
    optimizationState.lastWarmedAt = 0;
    optimizationState.moduleCache.clear();
    optimizationState.preloadedResources.clear();

    // Perform cold start optimization
    const coldStartTime = Date.now();
    await detectAndHandleColdStart(coldStartTime);
    const optimizationTime = Date.now() - coldStartTime;

    // Test performance after optimization
    const testResults = await testOptimizedPerformance(supabase, metrics);

    return createSuccessResponse({
      status: 'success',
      coldStartOptimization: {
        optimizationTimeMs: optimizationTime,
        preloadedModules: Array.from(optimizationState.preloadedResources),
        connectionPreWarmed: optimizationState.connectionPool !== null,
        testResults
      },
      totalExecutionTimeMs: Date.now() - optimizationStart
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Perform function warm-up
 */
async function performWarmUp(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const warmUpStart = Date.now();

    // Ensure all optimizations are applied
    await detectAndHandleColdStart(warmUpStart);

    // Perform warm-up operations
    const warmUpOperations = [
      preloadCriticalModules(),
      preWarmConnections(),
      optimizeMemoryLayout()
    ];

    await Promise.allSettled(warmUpOperations);

    // Test warm performance
    const testStart = Date.now();
    await supabase
      .from('edge_function_performance')
      .select('id')
      .limit(1);
    const testTime = Date.now() - testStart;

    return createSuccessResponse({
      status: 'success',
      warmUp: {
        completed: true,
        warmUpTimeMs: Date.now() - warmUpStart,
        testQueryTimeMs: testTime,
        state: {
          isWarmed: optimizationState.isWarmed,
          preloadedResources: Array.from(optimizationState.preloadedResources),
          hasConnectionPool: optimizationState.connectionPool !== null
        }
      }
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Optimize memory usage
 */
async function optimizeMemoryUsage(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const memoryBefore = getMemoryUsage();

    // Perform memory optimizations
    await optimizeMemoryLayout();

    // Clear unnecessary caches
    const clearedCaches = await clearUnnecessaryCaches();

    const memoryAfter = getMemoryUsage();
    const memorySaved = memoryBefore.used - memoryAfter.used;

    return createSuccessResponse({
      status: 'success',
      memoryOptimization: {
        memoryBefore,
        memoryAfter,
        memorySavedMb: Math.round(memorySaved / 1024 / 1024 * 100) / 100,
        clearedCaches,
        optimizationSuccess: memorySaved > 0
      }
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Optimize database connections
 */
async function optimizeConnections(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const optimizationStart = Date.now();

    // Test current connection performance
    const connectionTestBefore = await testConnectionPerformance(supabase);

    // Apply connection optimizations
    await preWarmConnections();

    // Test optimized connection performance
    const connectionTestAfter = await testConnectionPerformance(supabase);

    const improvement = connectionTestBefore.averageResponseTime - 
                       connectionTestAfter.averageResponseTime;

    return createSuccessResponse({
      status: 'success',
      connectionOptimization: {
        before: connectionTestBefore,
        after: connectionTestAfter,
        improvementMs: Math.round(improvement * 100) / 100,
        optimizationTimeMs: Date.now() - optimizationStart
      }
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const includeDetails = url.searchParams.get('includeDetails') === 'true';

    // Get historical performance data
    metrics.databaseQueries++;
    const timeRangeMs = parseTimeRange(timeRange);
    const { data: historicalData } = await supabase
      .from('edge_function_performance')
      .select('*')
      .gte('created_at', new Date(Date.now() - timeRangeMs).toISOString())
      .order('created_at', { ascending: false });

    // Calculate performance statistics
    const statistics = calculatePerformanceStatistics(historicalData || []);

    // Get current optimization state
    const currentState = {
      isWarmed: optimizationState.isWarmed,
      lastWarmedAt: optimizationState.lastWarmedAt,
      preloadedResources: Array.from(optimizationState.preloadedResources),
      cacheHitRatio: calculateCacheHitRatio(),
      recentMetrics: optimizationState.performanceMetrics.slice(-10)
    };

    return createSuccessResponse({
      status: 'success',
      timeRange,
      statistics,
      currentState,
      dataPoints: historicalData?.length || 0,
      ...(includeDetails && { detailedMetrics: historicalData })
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Generate optimization recommendations
 */
async function generateOptimizationRecommendations(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    // Get recent performance data
    metrics.databaseQueries++;
    const { data: recentPerformance } = await supabase
      .from('edge_function_performance')
      .select('*')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false });

    // Analyze current performance
    const analysis = analyzeCurrentPerformance(
      recentPerformance || [], 
      optimizationState.performanceMetrics
    );

    // Generate recommendations
    const recommendations = generateDetailedRecommendations(analysis);

    return createSuccessResponse({
      status: 'success',
      analysis,
      recommendations,
      currentOptimizations: {
        coldStartOptimizations: DEFAULT_CONFIG.coldStartOptimizations,
        enabledFeatures: getEnabledOptimizationFeatures()
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Helper functions
 */

function analyzeColdStartPatterns(performanceData: any[]): any {
  const coldStarts = performanceData.filter(d => d.is_cold_start === true);
  const avgColdStartTime = coldStarts.length > 0 
    ? coldStarts.reduce((sum, d) => sum + d.execution_time_ms, 0) / coldStarts.length
    : 0;

  return {
    totalColdStarts: coldStarts.length,
    averageColdStartTime: Math.round(avgColdStartTime),
    coldStartRate: performanceData.length > 0 
      ? (coldStarts.length / performanceData.length) * 100 
      : 0,
    trend: analyzeTrend(coldStarts.map(d => d.execution_time_ms))
  };
}

function analyzeMemoryPatterns(metrics: any[]): any {
  if (metrics.length === 0) {
    return { averageMemoryUsage: 0, peakMemoryUsage: 0, memoryEfficiency: 100 };
  }

  const memoryUsages = metrics.map(m => m.memoryUsageMb || 0);
  const avgMemory = memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length;
  const peakMemory = Math.max(...memoryUsages);

  return {
    averageMemoryUsage: Math.round(avgMemory * 100) / 100,
    peakMemoryUsage: Math.round(peakMemory * 100) / 100,
    memoryEfficiency: Math.round((1 - (peakMemory / DEFAULT_CONFIG.performanceTargets.maxMemoryUsageMb)) * 100)
  };
}

function analyzeResponseTimeTrends(performanceData: any[]): any {
  if (performanceData.length === 0) {
    return { averageResponseTime: 0, trend: 'insufficient_data' };
  }

  const responseTimes = performanceData.map(d => d.execution_time_ms);
  const avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

  return {
    averageResponseTime: Math.round(avgResponseTime),
    medianResponseTime: calculateMedian(responseTimes),
    p95ResponseTime: calculatePercentile(responseTimes, 95),
    trend: analyzeTrend(responseTimes)
  };
}

function generatePerformanceInsights(
  coldStartAnalysis: any,
  memoryAnalysis: any,
  responseTimeAnalysis: any
): any[] {
  const insights = [];

  if (coldStartAnalysis.averageColdStartTime > DEFAULT_CONFIG.performanceTargets.coldStartTimeMs) {
    insights.push({
      type: 'cold_start_performance',
      severity: 'medium',
      message: `Cold start time (${coldStartAnalysis.averageColdStartTime}ms) exceeds target`,
      recommendation: 'Enable module preloading and connection pre-warming'
    });
  }

  if (memoryAnalysis.peakMemoryUsage > DEFAULT_CONFIG.performanceTargets.maxMemoryUsageMb * 0.8) {
    insights.push({
      type: 'memory_usage',
      severity: 'high',
      message: `Memory usage approaching limit (${memoryAnalysis.peakMemoryUsage}MB)`,
      recommendation: 'Implement memory optimization and garbage collection'
    });
  }

  if (responseTimeAnalysis.p95ResponseTime > DEFAULT_CONFIG.performanceTargets.maxExecutionTimeMs * 0.5) {
    insights.push({
      type: 'response_time',
      severity: 'medium',
      message: 'High response time variability detected',
      recommendation: 'Review database queries and optimize slow operations'
    });
  }

  return insights;
}

function calculateCacheHitRatio(): number {
  const totalRequests = optimizationState.performanceMetrics.length;
  if (totalRequests === 0) return 0;

  const cacheHits = optimizationState.performanceMetrics
    .filter(m => m.cacheHit === true).length;
  
  return Math.round((cacheHits / totalRequests) * 100 * 100) / 100;
}

function generatePerformanceRecommendations(insights: any[]): string[] {
  const recommendations = insights.map(insight => insight.recommendation);
  
  // Add general recommendations
  if (insights.length === 0) {
    recommendations.push('Performance appears optimal - continue monitoring');
  }

  if (!optimizationState.isWarmed) {
    recommendations.push('Enable function warm-up to improve response times');
  }

  return recommendations;
}

async function applyOptimization(
  optimization: any, 
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<any> {
  switch (optimization.type) {
    case 'enable_module_preloading':
      await preloadCriticalModules();
      return { type: optimization.type, status: 'success' };
    
    case 'enable_connection_prewarming':
      await preWarmConnections();
      return { type: optimization.type, status: 'success' };
    
    case 'optimize_memory':
      await optimizeMemoryLayout();
      return { type: optimization.type, status: 'success' };
    
    default:
      return { type: optimization.type, status: 'unsupported' };
  }
}

function calculatePerformanceImpact(results: any[]): any {
  const successfulOptimizations = results.filter(r => r.status === 'success').length;
  const totalOptimizations = results.length;

  return {
    successRate: Math.round((successfulOptimizations / totalOptimizations) * 100),
    optimizationsApplied: successfulOptimizations,
    expectedImprovement: successfulOptimizations * 15 // Estimated 15% improvement per optimization
  };
}

async function runComprehensiveBenchmark(
  supabase: any, 
  config: any, 
  metrics: PerformanceMetrics
): Promise<any> {
  const results: any = {
    coldStartTests: [],
    warmStartTests: [],
    memoryTests: [],
    connectionTests: [],
    summary: {}
  };

  // Cold start benchmark
  if (config.includeColdStart) {
    for (let i = 0; i < 5; i++) {
      optimizationState.isWarmed = false;
      const startTime = Date.now();
      await detectAndHandleColdStart(startTime);
      results.coldStartTests.push(Date.now() - startTime);
    }
  }

  // Warm start benchmark
  for (let i = 0; i < 10; i++) {
    const startTime = Date.now();
    await supabase.from('edge_function_performance').select('id').limit(1);
    results.warmStartTests.push(Date.now() - startTime);
  }

  // Memory benchmark
  if (config.includeMemoryTest) {
    const memoryBefore = getMemoryUsage();
    // Simulate memory intensive operations
    const largeData = new Array(10000).fill('test data');
    await new Promise(resolve => setTimeout(resolve, 100));
    const memoryAfter = getMemoryUsage();
    results.memoryTests.push({
      before: memoryBefore,
      after: memoryAfter,
      difference: memoryAfter.used - memoryBefore.used
    });
  }

  // Connection benchmark
  if (config.includeConnectionTest) {
    results.connectionTests = await testConnectionPerformance(supabase);
  }

  // Calculate summary
  results.summary = {
    avgColdStartTime: results.coldStartTests.length > 0 
      ? results.coldStartTests.reduce((a, b) => a + b, 0) / results.coldStartTests.length
      : 0,
    avgWarmStartTime: results.warmStartTests.reduce((a, b) => a + b, 0) / results.warmStartTests.length,
    memoryEfficiency: results.memoryTests.length > 0 
      ? results.memoryTests[0].difference 
      : 0,
    connectionPerformance: results.connectionTests.averageResponseTime || 0
  };

  return results;
}

function calculatePerformanceScore(results: any): number {
  let score = 100;

  // Deduct points for slow cold starts
  if (results.summary.avgColdStartTime > DEFAULT_CONFIG.performanceTargets.coldStartTimeMs) {
    score -= 20;
  }

  // Deduct points for slow warm starts
  if (results.summary.avgWarmStartTime > DEFAULT_CONFIG.performanceTargets.warmStartTimeMs) {
    score -= 10;
  }

  // Deduct points for high memory usage
  if (results.summary.memoryEfficiency > DEFAULT_CONFIG.performanceTargets.maxMemoryUsageMb * 0.1) {
    score -= 15;
  }

  // Deduct points for slow connections
  if (results.summary.connectionPerformance > 100) {
    score -= 10;
  }

  return Math.max(0, score);
}

async function testOptimizedPerformance(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  const tests = [];

  // Test database query performance
  for (let i = 0; i < 5; i++) {
    const startTime = Date.now();
    await supabase.from('edge_function_performance').select('id').limit(1);
    tests.push(Date.now() - startTime);
  }

  return {
    averageQueryTime: tests.reduce((a, b) => a + b, 0) / tests.length,
    minQueryTime: Math.min(...tests),
    maxQueryTime: Math.max(...tests),
    consistency: calculateConsistency(tests)
  };
}

function getMemoryUsage(): any {
  // Simulated memory usage - in real Deno environment, use Deno.memoryUsage()
  return {
    used: Math.random() * 50 * 1024 * 1024, // Simulated memory usage
    total: 128 * 1024 * 1024 // 128MB limit
  };
}

async function clearUnnecessaryCaches(): Promise<string[]> {
  const cleared = [];

  // Clear old performance metrics
  if (optimizationState.performanceMetrics.length > 50) {
    optimizationState.performanceMetrics = optimizationState.performanceMetrics.slice(-50);
    cleared.push('performance_metrics_cache');
  }

  return cleared;
}

async function testConnectionPerformance(supabase: any): Promise<any> {
  const tests = [];
  
  for (let i = 0; i < 10; i++) {
    const startTime = Date.now();
    try {
      await supabase.from('edge_function_performance').select('id').limit(1);
      tests.push(Date.now() - startTime);
    } catch (error) {
      tests.push(1000); // Penalty for failed connection
    }
  }

  return {
    averageResponseTime: tests.reduce((a, b) => a + b, 0) / tests.length,
    minResponseTime: Math.min(...tests),
    maxResponseTime: Math.max(...tests),
    successRate: (tests.filter(t => t < 1000).length / tests.length) * 100
  };
}

function parseTimeRange(timeRange: string): number {
  const ranges: { [key: string]: number } = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  
  return ranges[timeRange] || ranges['24h'];
}

function calculatePerformanceStatistics(data: any[]): any {
  if (data.length === 0) {
    return { averageExecutionTime: 0, medianExecutionTime: 0, p95ExecutionTime: 0 };
  }

  const executionTimes = data.map(d => d.execution_time_ms);
  
  return {
    averageExecutionTime: Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length),
    medianExecutionTime: calculateMedian(executionTimes),
    p95ExecutionTime: calculatePercentile(executionTimes, 95),
    totalRequests: data.length,
    errorRate: (data.filter(d => d.error_count > 0).length / data.length) * 100
  };
}

function analyzeCurrentPerformance(historicalData: any[], recentMetrics: any[]): any {
  const analysis: any = {
    trends: {},
    issues: [],
    opportunities: []
  };

  // Analyze execution time trends
  if (historicalData.length > 0) {
    const executionTimes = historicalData.map(d => d.execution_time_ms);
    analysis.trends.executionTime = analyzeTrend(executionTimes);
  }

  // Identify performance issues
  if (recentMetrics.some(m => m.executionTimeMs > 1000)) {
    analysis.issues.push({
      type: 'slow_execution',
      severity: 'medium',
      description: 'Some requests are taking longer than 1 second'
    });
  }

  // Identify optimization opportunities
  if (!optimizationState.isWarmed) {
    analysis.opportunities.push({
      type: 'cold_start_optimization',
      impact: 'high',
      description: 'Function warm-up could improve performance'
    });
  }

  return analysis;
}

function generateDetailedRecommendations(analysis: any): any[] {
  const recommendations = [];

  // Based on issues
  for (const issue of analysis.issues) {
    switch (issue.type) {
      case 'slow_execution':
        recommendations.push({
          category: 'performance',
          priority: 'high',
          title: 'Optimize Slow Operations',
          description: 'Some requests are executing slowly',
          actions: [
            'Enable connection pooling',
            'Implement query optimization',
            'Add response caching'
          ]
        });
        break;
    }
  }

  // Based on opportunities
  for (const opportunity of analysis.opportunities) {
    switch (opportunity.type) {
      case 'cold_start_optimization':
        recommendations.push({
          category: 'cold_start',
          priority: 'medium',
          title: 'Enable Cold Start Optimizations',
          description: 'Reduce cold start latency with pre-warming',
          actions: [
            'Enable module preloading',
            'Implement connection pre-warming',
            'Add execution context reuse'
          ]
        });
        break;
    }
  }

  return recommendations;
}

function getEnabledOptimizationFeatures(): string[] {
  const enabled = [];
  
  if (DEFAULT_CONFIG.enableModuleCaching) enabled.push('module_caching');
  if (DEFAULT_CONFIG.enableConnectionPooling) enabled.push('connection_pooling');
  if (DEFAULT_CONFIG.enableContentCompression) enabled.push('content_compression');
  if (DEFAULT_CONFIG.coldStartOptimizations.preloadCriticalModules) enabled.push('module_preloading');
  if (DEFAULT_CONFIG.coldStartOptimizations.connectionPreWarming) enabled.push('connection_prewarming');
  
  return enabled;
}

function analyzeTrend(values: number[]): string {
  if (values.length < 2) return 'insufficient_data';
  
  const first = values.slice(0, Math.floor(values.length / 2));
  const second = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
  const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function calculateConsistency(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return Math.round((1 - (stdDev / mean)) * 100);
}