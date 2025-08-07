/**
 * Sprint 4: Migration Controller Edge Function
 * Zero-downtime migration management with blue-green deployment patterns
 * Controls traffic routing, monitors health, and manages rollbacks
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { requireAdmin } from '../_shared/auth.ts';
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

// Migration states
type MigrationState = 
  | 'preparation' 
  | 'traffic_5_percent' 
  | 'traffic_25_percent' 
  | 'traffic_50_percent' 
  | 'traffic_100_percent' 
  | 'completed' 
  | 'rolled_back' 
  | 'failed';

// Migration configuration
interface MigrationConfig {
  currentState: MigrationState;
  targetTrafficPercent: number;
  actualTrafficPercent: number;
  healthCheckInterval: number;
  rollbackThresholds: {
    errorRate: number;
    responseTimeMultiplier: number;
    failureCount: number;
  };
  enabledFunctions: string[];
  featureFlags: Record<string, boolean>;
}

// Health check results
interface HealthCheckResult {
  functionName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTimeMs: number;
  errorRate: number;
  lastChecked: string;
  details: any;
}

// Migration metrics
interface MigrationMetrics {
  migrationId: string;
  currentPhase: MigrationState;
  startTime: string;
  progressPercent: number;
  healthScore: number;
  trafficSplitPercent: number;
  performanceImprovement: number;
  errorRate: number;
  rollbacksTriggered: number;
  activeAlerts: string[];
}

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const context: EdgeFunctionContext = {
    functionName: 'migration-controller',
    operationType: 'migration_management',
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
        return await getMigrationStatus(supabase, metrics);
      
      case 'start':
        return await startMigration(supabase, req, metrics);
      
      case 'advance':
        return await advanceMigration(supabase, req, metrics);
      
      case 'rollback':
        return await rollbackMigration(supabase, req, metrics);
      
      case 'health-check':
        return await performHealthCheck(supabase, metrics);
      
      case 'traffic-split':
        return await adjustTrafficSplit(supabase, req, metrics);
      
      case 'feature-flags':
        return await manageFeatureFlags(supabase, req, metrics);
      
      default:
        return createErrorResponse(`Unknown operation: ${operation}`, 400);
    }

  } catch (error) {
    metrics.errorCount++;
    metrics.executionTimeMs = Date.now() - startTime;
    
    console.error('Migration controller error:', error);
    
    return createErrorResponse(getErrorMessage(error), 500);
  } finally {
    metrics.executionTimeMs = Date.now() - startTime;
  }
});

/**
 * Get current migration status and metrics
 */
async function getMigrationStatus(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    metrics.databaseQueries++;
    const { data: config, error: configError } = await supabase
      .from('migration_config')
      .select('*')
      .single();

    if (configError) {
      console.error('Failed to get migration config:', configError);
    }

    // Get current migration metrics
    metrics.databaseQueries++;
    const { data: migrationMetrics } = await supabase
      .from('migration_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get health check results
    metrics.databaseQueries++;
    const { data: healthChecks } = await supabase
      .from('edge_function_health')
      .select('*')
      .gte('last_checked', new Date(Date.now() - 300000).toISOString()); // Last 5 minutes

    // Calculate current metrics
    const currentMetrics: MigrationMetrics = {
      migrationId: migrationMetrics?.migration_id || 'none',
      currentPhase: config?.current_state || 'preparation',
      startTime: migrationMetrics?.start_time || new Date().toISOString(),
      progressPercent: calculateProgressPercent(config?.current_state || 'preparation'),
      healthScore: calculateHealthScore(healthChecks || []),
      trafficSplitPercent: config?.target_traffic_percent || 0,
      performanceImprovement: calculatePerformanceImprovement(healthChecks || []),
      errorRate: calculateErrorRate(healthChecks || []),
      rollbacksTriggered: migrationMetrics?.rollbacks_triggered || 0,
      activeAlerts: getActiveAlerts(config, healthChecks || [])
    };

    return createSuccessResponse({
      status: 'success',
      migration: currentMetrics,
      config: config || getDefaultConfig(),
      healthChecks: healthChecks || []
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Start migration process
 */
async function startMigration(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json();
    const migrationId = generateRequestId();

    // Initialize migration configuration
    const config: MigrationConfig = {
      currentState: 'preparation',
      targetTrafficPercent: 0,
      actualTrafficPercent: 0,
      healthCheckInterval: 30000, // 30 seconds
      rollbackThresholds: {
        errorRate: 0.01, // 1%
        responseTimeMultiplier: 1.5,
        failureCount: 5
      },
      enabledFunctions: body.enabledFunctions || [],
      featureFlags: body.featureFlags || {}
    };

    // Store migration configuration
    metrics.databaseQueries++;
    const { error: configError } = await supabase
      .from('migration_config')
      .upsert({
        id: migrationId,
        ...config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (configError) throw configError;

    // Create initial migration metrics record
    metrics.databaseQueries++;
    const { error: metricsError } = await supabase
      .from('migration_metrics')
      .insert({
        migration_id: migrationId,
        current_phase: 'preparation',
        start_time: new Date().toISOString(),
        progress_percent: 0,
        health_score: 100,
        traffic_split_percent: 0,
        performance_improvement: 0,
        error_rate: 0,
        rollbacks_triggered: 0,
        active_alerts: []
      });

    if (metricsError) throw metricsError;

    // Perform initial health check
    await performInitialHealthCheck(supabase, config.enabledFunctions, metrics);

    return createSuccessResponse({
      status: 'success',
      message: 'Migration started successfully',
      migrationId,
      config
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Advance migration to next phase
 */
async function advanceMigration(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    // Get current configuration
    metrics.databaseQueries++;
    const { data: config, error: configError } = await supabase
      .from('migration_config')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('No active migration found');
    }

    // Determine next phase
    const nextPhase = getNextMigrationPhase(config.current_state);
    if (!nextPhase) {
      throw new Error('Migration already completed or failed');
    }

    // Perform health check before advancing
    const healthCheckResult = await performHealthCheck(supabase, metrics);
    const healthData = await healthCheckResult.json();

    if (healthData.data.overallHealth !== 'healthy') {
      throw new Error('Health check failed, cannot advance migration');
    }

    // Calculate new traffic percentage
    const newTrafficPercent = getTrafficPercentForPhase(nextPhase);

    // Update configuration
    metrics.databaseQueries++;
    const { error: updateError } = await supabase
      .from('migration_config')
      .update({
        current_state: nextPhase,
        target_traffic_percent: newTrafficPercent,
        updated_at: new Date().toISOString()
      })
      .eq('id', config.id);

    if (updateError) throw updateError;

    // Update metrics
    metrics.databaseQueries++;
    await supabase
      .from('migration_metrics')
      .update({
        current_phase: nextPhase,
        progress_percent: calculateProgressPercent(nextPhase),
        traffic_split_percent: newTrafficPercent,
        updated_at: new Date().toISOString()
      })
      .eq('migration_id', config.id);

    return createSuccessResponse({
      status: 'success',
      message: `Migration advanced to ${nextPhase}`,
      currentPhase: nextPhase,
      trafficPercent: newTrafficPercent
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Rollback migration to previous safe state
 */
async function rollbackMigration(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json();
    const reason = body.reason || 'Manual rollback requested';

    // Get current configuration
    metrics.databaseQueries++;
    const { data: config, error: configError } = await supabase
      .from('migration_config')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('No active migration found');
    }

    // Update configuration to rolled back state
    metrics.databaseQueries++;
    const { error: updateError } = await supabase
      .from('migration_config')
      .update({
        current_state: 'rolled_back',
        target_traffic_percent: 0,
        actual_traffic_percent: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', config.id);

    if (updateError) throw updateError;

    // Record rollback event
    metrics.databaseQueries++;
    await supabase
      .from('migration_rollbacks')
      .insert({
        migration_id: config.id,
        rollback_reason: reason,
        rolled_back_from: config.current_state,
        rollback_time: new Date().toISOString(),
        traffic_at_rollback: config.actual_traffic_percent
      });

    // Update metrics
    metrics.databaseQueries++;
    await supabase
      .from('migration_metrics')
      .update({
        current_phase: 'rolled_back',
        rollbacks_triggered: supabase.raw('rollbacks_triggered + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('migration_id', config.id);

    return createSuccessResponse({
      status: 'success',
      message: 'Migration rolled back successfully',
      reason,
      previousPhase: config.current_state
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    // Get current configuration
    metrics.databaseQueries++;
    const { data: config } = await supabase
      .from('migration_config')
      .select('*')
      .single();

    const functionsToCheck = config?.enabled_functions || [
      'subscription-status',
      'quote-processor', 
      'quote-pdf-generator',
      'webhook-handler',
      'batch-processor'
    ];

    const healthResults: HealthCheckResult[] = [];

    // Check each Edge Function
    for (const functionName of functionsToCheck) {
      const result = await checkFunctionHealth(functionName, metrics);
      healthResults.push(result);
    }

    // Store health check results
    for (const result of healthResults) {
      metrics.databaseQueries++;
      await supabase
        .from('edge_function_health')
        .upsert({
          function_name: result.functionName,
          status: result.status,
          response_time_ms: result.responseTimeMs,
          error_rate: result.errorRate,
          last_checked: result.lastChecked,
          details: result.details
        }, {
          onConflict: 'function_name'
        });
    }

    // Calculate overall health
    const overallHealth = calculateOverallHealth(healthResults);
    const healthScore = calculateHealthScore(healthResults);

    return createSuccessResponse({
      status: 'success',
      overallHealth,
      healthScore,
      functionHealth: healthResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Adjust traffic splitting
 */
async function adjustTrafficSplit(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json();
    const { targetPercent } = body;

    if (targetPercent < 0 || targetPercent > 100) {
      throw new Error('Traffic percent must be between 0 and 100');
    }

    // Update configuration
    metrics.databaseQueries++;
    const { error } = await supabase
      .from('migration_config')
      .update({
        target_traffic_percent: targetPercent,
        updated_at: new Date().toISOString()
      })
      .single();

    if (error) throw error;

    return createSuccessResponse({
      status: 'success',
      message: `Traffic split adjusted to ${targetPercent}%`,
      targetPercent
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Manage feature flags
 */
async function manageFeatureFlags(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json();
    const { flags } = body;

    // Update feature flags
    metrics.databaseQueries++;
    const { error } = await supabase
      .from('migration_config')
      .update({
        feature_flags: flags,
        updated_at: new Date().toISOString()
      })
      .single();

    if (error) throw error;

    return createSuccessResponse({
      status: 'success',
      message: 'Feature flags updated successfully',
      flags
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Helper Functions
 */

function getDefaultConfig(): MigrationConfig {
  return {
    currentState: 'preparation',
    targetTrafficPercent: 0,
    actualTrafficPercent: 0,
    healthCheckInterval: 30000,
    rollbackThresholds: {
      errorRate: 0.01,
      responseTimeMultiplier: 1.5,
      failureCount: 5
    },
    enabledFunctions: [
      'subscription-status',
      'quote-processor', 
      'quote-pdf-generator',
      'webhook-handler',
      'batch-processor'
    ],
    featureFlags: {}
  };
}

function getNextMigrationPhase(currentPhase: MigrationState): MigrationState | null {
  const phaseOrder: MigrationState[] = [
    'preparation',
    'traffic_5_percent',
    'traffic_25_percent',
    'traffic_50_percent',
    'traffic_100_percent',
    'completed'
  ];

  const currentIndex = phaseOrder.indexOf(currentPhase);
  return currentIndex >= 0 && currentIndex < phaseOrder.length - 1 
    ? phaseOrder[currentIndex + 1] 
    : null;
}

function getTrafficPercentForPhase(phase: MigrationState): number {
  switch (phase) {
    case 'traffic_5_percent': return 5;
    case 'traffic_25_percent': return 25;
    case 'traffic_50_percent': return 50;
    case 'traffic_100_percent': return 100;
    default: return 0;
  }
}

function calculateProgressPercent(phase: MigrationState): number {
  switch (phase) {
    case 'preparation': return 10;
    case 'traffic_5_percent': return 25;
    case 'traffic_25_percent': return 50;
    case 'traffic_50_percent': return 75;
    case 'traffic_100_percent': return 95;
    case 'completed': return 100;
    default: return 0;
  }
}

async function checkFunctionHealth(
  functionName: string, 
  metrics: PerformanceMetrics
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Health check endpoint for each function
    const healthUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}/health`;
    
    metrics.apiCalls++;
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    const responseTime = Date.now() - startTime;
    const isHealthy = response.ok && responseTime < 1000;

    return {
      functionName,
      status: isHealthy ? 'healthy' : 'degraded',
      responseTimeMs: responseTime,
      errorRate: isHealthy ? 0 : 1,
      lastChecked: new Date().toISOString(),
      details: {
        statusCode: response.status,
        responseTime
      }
    };

  } catch (error) {
    return {
      functionName,
      status: 'unhealthy',
      responseTimeMs: Date.now() - startTime,
      errorRate: 1,
      lastChecked: new Date().toISOString(),
      details: {
        error: getErrorMessage(error)
      }
    };
  }
}

function calculateOverallHealth(results: HealthCheckResult[]): string {
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const totalCount = results.length;
  const healthRatio = healthyCount / totalCount;

  if (healthRatio >= 0.9) return 'healthy';
  if (healthRatio >= 0.7) return 'degraded';
  return 'unhealthy';
}

function calculateHealthScore(results: HealthCheckResult[]): number {
  if (results.length === 0) return 100;
  
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  return Math.round((healthyCount / results.length) * 100);
}

function calculatePerformanceImprovement(results: HealthCheckResult[]): number {
  // Calculate based on response times vs baseline (500ms from Sprint 3)
  const baseline = 500;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTimeMs, 0) / results.length;
  return Math.round(((baseline - avgResponseTime) / baseline) * 100);
}

function calculateErrorRate(results: HealthCheckResult[]): number {
  if (results.length === 0) return 0;
  
  const errorCount = results.filter(r => r.status !== 'healthy').length;
  return (errorCount / results.length) * 100;
}

function getActiveAlerts(config: any, healthChecks: HealthCheckResult[]): string[] {
  const alerts: string[] = [];
  
  if (!config) return alerts;

  // Check error rate threshold
  const errorRate = calculateErrorRate(healthChecks);
  if (errorRate > config.rollback_thresholds?.error_rate * 100) {
    alerts.push(`High error rate: ${errorRate.toFixed(2)}%`);
  }

  // Check response time threshold
  const avgResponseTime = healthChecks.reduce((sum, r) => sum + r.responseTimeMs, 0) / healthChecks.length;
  const baselineResponseTime = 500; // From Sprint 3
  if (avgResponseTime > baselineResponseTime * (config.rollback_thresholds?.response_time_multiplier || 1.5)) {
    alerts.push(`Response time degraded: ${avgResponseTime}ms`);
  }

  // Check unhealthy functions
  const unhealthyFunctions = healthChecks.filter(r => r.status === 'unhealthy');
  if (unhealthyFunctions.length > 0) {
    alerts.push(`Unhealthy functions: ${unhealthyFunctions.map(f => f.functionName).join(', ')}`);
  }

  return alerts;
}

async function performInitialHealthCheck(
  supabase: any, 
  functions: string[], 
  metrics: PerformanceMetrics
): Promise<void> {
  for (const functionName of functions) {
    const result = await checkFunctionHealth(functionName, metrics);
    
    metrics.databaseQueries++;
    await supabase
      .from('edge_function_health')
      .upsert({
        function_name: result.functionName,
        status: result.status,
        response_time_ms: result.responseTimeMs,
        error_rate: result.errorRate,
        last_checked: result.lastChecked,
        details: result.details
      }, {
        onConflict: 'function_name'
      });
  }
}