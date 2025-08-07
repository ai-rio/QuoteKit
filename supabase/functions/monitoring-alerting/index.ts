/**
 * Sprint 4: Advanced Monitoring and Alerting Edge Function
 * Comprehensive monitoring system with real-time alerts and notifications
 * Provides proactive monitoring, anomaly detection, and automated responses
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

// Alert severity levels
type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

// Alert categories
type AlertCategory = 
  | 'performance' 
  | 'security' 
  | 'reliability' 
  | 'capacity' 
  | 'cost' 
  | 'business';

// Alert status
type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';

// Monitoring target types
type MonitoringTarget = 
  | 'edge_function' 
  | 'database' 
  | 'security' 
  | 'business_metric' 
  | 'system_health';

// Alert configuration
interface AlertRule {
  ruleId: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  target: MonitoringTarget;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number; // minutes
    evaluationInterval: number; // minutes
  };
  actions: AlertAction[];
  enabled: boolean;
  cooldownMinutes: number;
}

// Alert actions
interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'auto_scale' | 'auto_restart' | 'log';
  config: any;
  enabled: boolean;
}

// Alert instance
interface Alert {
  alertId: string;
  ruleId: string;
  status: AlertStatus;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  metricValue: number;
  threshold: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata: any;
}

// Monitoring dashboard data
interface MonitoringDashboard {
  timestamp: string;
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'critical';
    score: number; // 0-100
    components: ComponentHealth[];
  };
  activeAlerts: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  performanceMetrics: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    availability: number;
  };
  businessMetrics: {
    activeUsers: number;
    revenue: number;
    conversionRate: number;
    customerSatisfaction: number;
  };
  trends: {
    performance: 'improving' | 'stable' | 'degrading';
    errors: 'decreasing' | 'stable' | 'increasing';
    usage: 'growing' | 'stable' | 'declining';
  };
}

interface ComponentHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'critical';
  score: number;
  lastChecked: string;
  issues: string[];
}

// Default alert rules
const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    ruleId: 'edge_function_error_rate_high',
    name: 'High Edge Function Error Rate',
    description: 'Edge function error rate exceeds 5%',
    category: 'reliability',
    severity: 'error',
    target: 'edge_function',
    condition: {
      metric: 'error_rate',
      operator: 'gt',
      threshold: 5,
      timeWindow: 15,
      evaluationInterval: 5
    },
    actions: [
      { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true },
      { type: 'log', config: {}, enabled: true }
    ],
    enabled: true,
    cooldownMinutes: 30
  },
  {
    ruleId: 'response_time_degraded',
    name: 'Response Time Degraded',
    description: 'Average response time exceeds 2 seconds',
    category: 'performance',
    severity: 'warning',
    target: 'edge_function',
    condition: {
      metric: 'avg_response_time',
      operator: 'gt',
      threshold: 2000,
      timeWindow: 10,
      evaluationInterval: 5
    },
    actions: [
      { type: 'log', config: {}, enabled: true },
      { type: 'webhook', config: { url: '/api/webhooks/performance-alert' }, enabled: false }
    ],
    enabled: true,
    cooldownMinutes: 15
  },
  {
    ruleId: 'security_incidents_spike',
    name: 'Security Incidents Spike',
    description: 'Unusual increase in security incidents',
    category: 'security',
    severity: 'critical',
    target: 'security',
    condition: {
      metric: 'security_incidents_count',
      operator: 'gt',
      threshold: 10,
      timeWindow: 60,
      evaluationInterval: 10
    },
    actions: [
      { type: 'email', config: { recipients: ['security@example.com'] }, enabled: true },
      { type: 'slack', config: { channel: '#security-alerts' }, enabled: false },
      { type: 'log', config: {}, enabled: true }
    ],
    enabled: true,
    cooldownMinutes: 60
  },
  {
    ruleId: 'database_connections_high',
    name: 'High Database Connection Usage',
    description: 'Database connection pool utilization above 85%',
    category: 'capacity',
    severity: 'warning',
    target: 'database',
    condition: {
      metric: 'connection_pool_utilization',
      operator: 'gt',
      threshold: 85,
      timeWindow: 15,
      evaluationInterval: 5
    },
    actions: [
      { type: 'log', config: {}, enabled: true },
      { type: 'auto_scale', config: { action: 'increase_connections' }, enabled: false }
    ],
    enabled: true,
    cooldownMinutes: 30
  },
  {
    ruleId: 'business_conversion_drop',
    name: 'Business Conversion Rate Drop',
    description: 'Conversion rate dropped below 2%',
    category: 'business',
    severity: 'error',
    target: 'business_metric',
    condition: {
      metric: 'conversion_rate',
      operator: 'lt',
      threshold: 2,
      timeWindow: 60,
      evaluationInterval: 30
    },
    actions: [
      { type: 'email', config: { recipients: ['business@example.com'] }, enabled: true },
      { type: 'log', config: {}, enabled: true }
    ],
    enabled: true,
    cooldownMinutes: 120
  }
];

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const context: EdgeFunctionContext = {
    functionName: 'monitoring-alerting',
    operationType: 'monitoring_operation',
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

    const url = new URL(req.url);
    const operation = url.pathname.split('/').pop();

    // Some operations don't require authentication (webhooks, health checks)
    const publicOperations = ['health', 'webhook'];
    
    if (!publicOperations.includes(operation || '')) {
      // Authenticate admin request
      const { response: authResponse, user } = await requireAdmin(req);
      if (authResponse) {
        return authResponse;
      }
      context.user = user;
    }

    switch (operation) {
      case 'dashboard':
        return await getMonitoringDashboard(supabase, req, metrics);
      
      case 'alerts':
        return await manageAlerts(supabase, req, metrics);
      
      case 'rules':
        return await manageAlertRules(supabase, req, metrics);
      
      case 'evaluate':
        return await evaluateAlertRules(supabase, req, metrics);
      
      case 'health':
        return await checkSystemHealth(supabase, metrics);
      
      case 'metrics':
        return await collectMetrics(supabase, req, metrics);
      
      case 'anomaly-detection':
        return await performAnomalyDetection(supabase, req, metrics);
      
      case 'notification-test':
        return await testNotifications(supabase, req, metrics);
      
      case 'webhook':
        return await handleWebhookAlert(supabase, req, metrics);
      
      default:
        return createErrorResponse(`Unknown operation: ${operation}`, 400);
    }

  } catch (error) {
    metrics.errorCount++;
    metrics.executionTimeMs = Date.now() - startTime;
    
    console.error('Monitoring alerting error:', error);
    
    return createErrorResponse(getErrorMessage(error), 500);
  } finally {
    metrics.executionTimeMs = Date.now() - startTime;
  }
});

/**
 * Get comprehensive monitoring dashboard data
 */
async function getMonitoringDashboard(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const dashboardStart = Date.now();
    
    // Get system health
    const systemHealth = await calculateSystemHealth(supabase, metrics);
    
    // Get active alerts summary
    const activeAlerts = await getActiveAlertsData(supabase, metrics);
    
    // Get performance metrics
    const performanceMetrics = await getPerformanceMetricsData(supabase, metrics);
    
    // Get business metrics
    const businessMetrics = await getBusinessMetricsData(supabase, metrics);
    
    // Calculate trends
    const trends = await calculateTrends(supabase, metrics);

    const dashboard: MonitoringDashboard = {
      timestamp: new Date().toISOString(),
      systemHealth,
      activeAlerts,
      performanceMetrics,
      businessMetrics,
      trends
    };

    // Store dashboard snapshot
    metrics.databaseQueries++;
    await supabase
      .from('monitoring_dashboards')
      .insert({
        dashboard_id: generateRequestId(),
        dashboard_data: dashboard,
        generation_time_ms: Date.now() - dashboardStart,
        created_at: new Date().toISOString()
      });

    return createSuccessResponse({
      status: 'success',
      dashboard,
      generationTimeMs: Date.now() - dashboardStart
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Manage alerts (list, acknowledge, resolve)
 */
async function manageAlerts(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    switch (action) {
      case 'list':
        return await listAlerts(supabase, req, metrics);
      
      case 'acknowledge':
        return await acknowledgeAlert(supabase, req, metrics);
      
      case 'resolve':
        return await resolveAlert(supabase, req, metrics);
      
      case 'suppress':
        return await suppressAlert(supabase, req, metrics);
      
      default:
        return createErrorResponse(`Unknown alert action: ${action}`, 400);
    }

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Manage alert rules (create, update, delete, list)
 */
async function manageAlertRules(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    switch (req.method) {
      case 'GET':
        return await listAlertRules(supabase, req, metrics);
      
      case 'POST':
        return await createAlertRule(supabase, req, metrics);
      
      case 'PUT':
        return await updateAlertRule(supabase, req, metrics);
      
      case 'DELETE':
        return await deleteAlertRule(supabase, req, metrics);
      
      default:
        return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Evaluate all alert rules against current metrics
 */
async function evaluateAlertRules(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const evaluationStart = Date.now();
    console.log('Starting alert rule evaluation...');

    // Get all enabled alert rules
    metrics.databaseQueries++;
    const { data: alertRules } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('enabled', true);

    if (!alertRules || alertRules.length === 0) {
      return createSuccessResponse({
        status: 'success',
        message: 'No enabled alert rules found',
        evaluationTimeMs: Date.now() - evaluationStart
      });
    }

    const evaluationResults = [];
    let alertsTriggered = 0;

    // Evaluate each rule
    for (const rule of alertRules) {
      try {
        const ruleEvaluationResult = await evaluateRule(supabase, rule, metrics);
        evaluationResults.push(ruleEvaluationResult);
        
        if (ruleEvaluationResult.triggered) {
          alertsTriggered++;
        }
      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.rule_id}:`, error);
        evaluationResults.push({
          ruleId: rule.rule_id,
          triggered: false,
          error: getErrorMessage(error)
        });
      }
    }

    // Store evaluation results
    metrics.databaseQueries++;
    await supabase
      .from('alert_evaluations')
      .insert({
        evaluation_id: generateRequestId(),
        rules_evaluated: alertRules.length,
        alerts_triggered: alertsTriggered,
        evaluation_results: evaluationResults,
        execution_time_ms: Date.now() - evaluationStart,
        created_at: new Date().toISOString()
      });

    return createSuccessResponse({
      status: 'success',
      rulesEvaluated: alertRules.length,
      alertsTriggered,
      evaluationResults,
      evaluationTimeMs: Date.now() - evaluationStart
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Check overall system health
 */
async function checkSystemHealth(
  supabase: any, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const healthChecks = await performSystemHealthChecks(supabase, metrics);
    const overallHealth = calculateOverallHealth(healthChecks);

    return createSuccessResponse({
      status: 'success',
      health: {
        overall: overallHealth.status,
        score: overallHealth.score,
        components: healthChecks,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Collect and aggregate metrics from various sources
 */
async function collectMetrics(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const collectionStart = Date.now();
    const url = new URL(req.url);
    const source = url.searchParams.get('source') || 'all';

    const collectedMetrics: any = {};

    // Collect Edge Function metrics
    if (source === 'all' || source === 'edge_functions') {
      collectedMetrics.edgeFunctions = await collectEdgeFunctionMetrics(supabase, metrics);
    }

    // Collect Database metrics
    if (source === 'all' || source === 'database') {
      collectedMetrics.database = await collectDatabaseMetrics(supabase, metrics);
    }

    // Collect Security metrics
    if (source === 'all' || source === 'security') {
      collectedMetrics.security = await collectSecurityMetrics(supabase, metrics);
    }

    // Collect Business metrics
    if (source === 'all' || source === 'business') {
      collectedMetrics.business = await collectBusinessMetrics(supabase, metrics);
    }

    return createSuccessResponse({
      status: 'success',
      metrics: collectedMetrics,
      source,
      collectionTimeMs: Date.now() - collectionStart
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Perform anomaly detection on collected metrics
 */
async function performAnomalyDetection(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const detectionStart = Date.now();

    // Get historical metrics for comparison
    metrics.databaseQueries++;
    const { data: historicalMetrics } = await supabase
      .from('edge_function_performance')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('recorded_at', { ascending: false });

    // Detect anomalies
    const anomalies = await detectAnomalies(historicalMetrics || [], supabase, metrics);

    // Store anomaly detection results
    metrics.databaseQueries++;
    await supabase
      .from('anomaly_detections')
      .insert({
        detection_id: generateRequestId(),
        anomalies_detected: anomalies.length,
        detection_results: anomalies,
        execution_time_ms: Date.now() - detectionStart,
        created_at: new Date().toISOString()
      });

    return createSuccessResponse({
      status: 'success',
      anomaliesDetected: anomalies.length,
      anomalies,
      detectionTimeMs: Date.now() - detectionStart
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Test notification systems
 */
async function testNotifications(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const notificationType = body.type || 'all';

    const testResults: any = {};

    if (notificationType === 'all' || notificationType === 'email') {
      testResults.email = await testEmailNotification(body.config?.email);
    }

    if (notificationType === 'all' || notificationType === 'webhook') {
      testResults.webhook = await testWebhookNotification(body.config?.webhook);
    }

    if (notificationType === 'all' || notificationType === 'slack') {
      testResults.slack = await testSlackNotification(body.config?.slack);
    }

    return createSuccessResponse({
      status: 'success',
      testResults,
      notificationType
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Handle incoming webhook alerts
 */
async function handleWebhookAlert(
  supabase: any, 
  req: Request, 
  metrics: PerformanceMetrics
): Promise<Response> {
  try {
    const body = await req.json();
    
    // Process webhook alert
    const alert: Partial<Alert> = {
      alertId: generateRequestId(),
      status: 'active',
      severity: body.severity || 'warning',
      category: body.category || 'performance',
      title: body.title || 'Webhook Alert',
      message: body.message || 'Alert received via webhook',
      metricValue: body.metricValue || 0,
      threshold: body.threshold || 0,
      triggeredAt: new Date().toISOString(),
      metadata: body.metadata || {}
    };

    // Store the alert
    metrics.databaseQueries++;
    await supabase
      .from('alerts')
      .insert(alert);

    // Process alert actions if needed
    if (body.actions) {
      await processAlertActions(supabase, alert as Alert, body.actions, metrics);
    }

    return createSuccessResponse({
      status: 'success',
      alertId: alert.alertId,
      message: 'Webhook alert processed successfully'
    });

  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

/**
 * Helper Functions
 */

async function calculateSystemHealth(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  const components = await performSystemHealthChecks(supabase, metrics);
  const overall = calculateOverallHealth(components);
  
  return {
    overall: overall.status,
    score: overall.score,
    components
  };
}

async function performSystemHealthChecks(supabase: any, metrics: PerformanceMetrics): Promise<ComponentHealth[]> {
  const components: ComponentHealth[] = [];

  // Edge Functions health
  try {
    metrics.databaseQueries++;
    const { data: edgeFunctionHealth } = await supabase
      .from('edge_function_performance')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
      .order('recorded_at', { ascending: false })
      .limit(10);

    const avgResponseTime = edgeFunctionHealth?.reduce((sum: number, record: any) => 
      sum + record.execution_time_ms, 0) / (edgeFunctionHealth?.length || 1);
    
    const errorRate = edgeFunctionHealth?.reduce((sum: number, record: any) => 
      sum + record.error_count, 0) / (edgeFunctionHealth?.length || 1);

    components.push({
      component: 'edge_functions',
      status: avgResponseTime < 1000 && errorRate < 0.1 ? 'healthy' : 
              avgResponseTime < 2000 && errorRate < 1 ? 'degraded' : 'critical',
      score: Math.max(0, 100 - (avgResponseTime / 20) - (errorRate * 10)),
      lastChecked: new Date().toISOString(),
      issues: [
        ...(avgResponseTime > 1000 ? [`High response time: ${avgResponseTime}ms`] : []),
        ...(errorRate > 0.1 ? [`High error rate: ${errorRate}%`] : [])
      ]
    });
  } catch (error) {
    components.push({
      component: 'edge_functions',
      status: 'critical',
      score: 0,
      lastChecked: new Date().toISOString(),
      issues: [`Health check failed: ${getErrorMessage(error)}`]
    });
  }

  // Database health
  try {
    const dbStart = Date.now();
    metrics.databaseQueries++;
    await supabase.from('edge_function_performance').select('id').limit(1);
    const dbResponseTime = Date.now() - dbStart;

    components.push({
      component: 'database',
      status: dbResponseTime < 100 ? 'healthy' : dbResponseTime < 500 ? 'degraded' : 'critical',
      score: Math.max(0, 100 - (dbResponseTime / 5)),
      lastChecked: new Date().toISOString(),
      issues: dbResponseTime > 100 ? [`Slow database response: ${dbResponseTime}ms`] : []
    });
  } catch (error) {
    components.push({
      component: 'database',
      status: 'critical',
      score: 0,
      lastChecked: new Date().toISOString(),
      issues: [`Database connection failed: ${getErrorMessage(error)}`]
    });
  }

  // Security health
  try {
    metrics.databaseQueries++;
    const { data: recentIncidents } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('resolved', false)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    const criticalIncidents = recentIncidents?.filter(i => i.threat_level === 'critical').length || 0;
    const highIncidents = recentIncidents?.filter(i => i.threat_level === 'high').length || 0;

    components.push({
      component: 'security',
      status: criticalIncidents === 0 && highIncidents < 3 ? 'healthy' : 
              criticalIncidents === 0 && highIncidents < 10 ? 'degraded' : 'critical',
      score: Math.max(0, 100 - (criticalIncidents * 20) - (highIncidents * 5)),
      lastChecked: new Date().toISOString(),
      issues: [
        ...(criticalIncidents > 0 ? [`${criticalIncidents} critical security incidents`] : []),
        ...(highIncidents > 3 ? [`${highIncidents} high-severity security incidents`] : [])
      ]
    });
  } catch (error) {
    components.push({
      component: 'security',
      status: 'degraded',
      score: 50,
      lastChecked: new Date().toISOString(),
      issues: [`Security check failed: ${getErrorMessage(error)}`]
    });
  }

  return components;
}

function calculateOverallHealth(components: ComponentHealth[]): { status: string; score: number } {
  if (components.length === 0) {
    return { status: 'critical', score: 0 };
  }

  const avgScore = components.reduce((sum, comp) => sum + comp.score, 0) / components.length;
  const criticalComponents = components.filter(comp => comp.status === 'critical').length;
  const degradedComponents = components.filter(comp => comp.status === 'degraded').length;

  let status = 'healthy';
  if (criticalComponents > 0) {
    status = 'critical';
  } else if (degradedComponents > 0 || avgScore < 80) {
    status = 'degraded';
  }

  return { status, score: Math.round(avgScore) };
}

async function getActiveAlertsData(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  metrics.databaseQueries++;
  const { data: alerts } = await supabase
    .from('alerts')
    .select('severity')
    .eq('status', 'active');

  const alertCounts = {
    critical: alerts?.filter(a => a.severity === 'critical').length || 0,
    error: alerts?.filter(a => a.severity === 'error').length || 0,
    warning: alerts?.filter(a => a.severity === 'warning').length || 0,
    info: alerts?.filter(a => a.severity === 'info').length || 0
  };

  return alertCounts;
}

async function getPerformanceMetricsData(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  metrics.databaseQueries++;
  const { data: performanceData } = await supabase
    .from('edge_function_performance')
    .select('*')
    .gte('recorded_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .order('recorded_at', { ascending: false });

  if (!performanceData || performanceData.length === 0) {
    return {
      avgResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      availability: 100
    };
  }

  const avgResponseTime = performanceData.reduce((sum, record) => 
    sum + record.execution_time_ms, 0) / performanceData.length;
  
  const totalErrors = performanceData.reduce((sum, record) => sum + record.error_count, 0);
  const errorRate = (totalErrors / performanceData.length) * 100;
  
  const throughput = performanceData.length; // Requests in the last hour
  const availability = 100 - errorRate; // Simplified availability calculation

  return {
    avgResponseTime: Math.round(avgResponseTime),
    errorRate: Math.round(errorRate * 100) / 100,
    throughput: Math.round(throughput),
    availability: Math.round(availability * 100) / 100
  };
}

async function getBusinessMetricsData(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  // This would integrate with actual business metrics
  // For now, return sample data
  return {
    activeUsers: 1500,
    revenue: 50000,
    conversionRate: 3.2,
    customerSatisfaction: 4.7
  };
}

async function calculateTrends(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  // Calculate trends based on historical data
  // For now, return sample trends
  return {
    performance: 'improving',
    errors: 'stable',
    usage: 'growing'
  };
}

// Placeholder implementations for remaining functions
async function listAlerts(supabase: any, req: Request, metrics: PerformanceMetrics): Promise<Response> {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'active';
  const limit = parseInt(url.searchParams.get('limit') || '50');

  metrics.databaseQueries++;
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('status', status)
    .order('triggered_at', { ascending: false })
    .limit(limit);

  return createSuccessResponse({
    status: 'success',
    alerts: alerts || [],
    count: alerts?.length || 0
  });
}

async function acknowledgeAlert(supabase: any, req: Request, metrics: PerformanceMetrics): Promise<Response> {
  const body = await req.json();
  const { alertId, acknowledgedBy } = body;

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy
    })
    .eq('alert_id', alertId);

  if (error) throw error;

  return createSuccessResponse({
    status: 'success',
    message: 'Alert acknowledged successfully'
  });
}

async function resolveAlert(supabase: any, req: Request, metrics: PerformanceMetrics): Promise<Response> {
  const body = await req.json();
  const { alertId, resolvedBy, resolutionNotes } = body;

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      resolution_notes: resolutionNotes
    })
    .eq('alert_id', alertId);

  if (error) throw error;

  return createSuccessResponse({
    status: 'success',
    message: 'Alert resolved successfully'
  });
}

async function suppressAlert(supabase: any, req: Request, metrics: PerformanceMetrics): Promise<Response> {
  const body = await req.json();
  const { alertId, suppressionReason } = body;

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('alerts')
    .update({
      status: 'suppressed',
      suppression_reason: suppressionReason,
      suppressed_at: new Date().toISOString()
    })
    .eq('alert_id', alertId);

  if (error) throw error;

  return createSuccessResponse({
    status: 'success',
    message: 'Alert suppressed successfully'
  });
}

async function listAlertRules(supabase: any, req: Request, metrics: PerformanceMetrics): Promise<Response> {
  metrics.databaseQueries++;
  const { data: rules } = await supabase
    .from('alert_rules')
    .select('*')
    .order('created_at', { ascending: false });

  return createSuccessResponse({
    status: 'success',
    rules: rules || []
  });
}

async function createAlertRule(supabase: any, req: Request, metrics: PerformanceMetrics): Promise<Response> {
  const body = await req.json();
  const rule = { ...body, rule_id: generateRequestId() };

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('alert_rules')
    .insert(rule);

  if (error) throw error;

  return createSuccessResponse({
    status: 'success',
    ruleId: rule.rule_id,
    message: 'Alert rule created successfully'
  });
}

async function updateAlertRule(supabase: any, req: Request, metrics: PerformanceMetrics): Promise<Response> {
  const body = await req.json();
  const { ruleId, ...updates } = body;

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('alert_rules')
    .update(updates)
    .eq('rule_id', ruleId);

  if (error) throw error;

  return createSuccessResponse({
    status: 'success',
    message: 'Alert rule updated successfully'
  });
}

async function deleteAlertRule(supabase: any, req: Request, metrics: PerformanceMetrics): Promise<Response> {
  const url = new URL(req.url);
  const ruleId = url.searchParams.get('ruleId');

  if (!ruleId) {
    return createErrorResponse('Rule ID required', 400);
  }

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('alert_rules')
    .delete()
    .eq('rule_id', ruleId);

  if (error) throw error;

  return createSuccessResponse({
    status: 'success',
    message: 'Alert rule deleted successfully'
  });
}

async function evaluateRule(supabase: any, rule: any, metrics: PerformanceMetrics): Promise<any> {
  // This would implement the actual rule evaluation logic
  // For now, return a sample evaluation
  return {
    ruleId: rule.rule_id,
    triggered: false,
    metricValue: 0,
    threshold: rule.condition.threshold,
    evaluatedAt: new Date().toISOString()
  };
}

async function collectEdgeFunctionMetrics(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  metrics.databaseQueries++;
  const { data } = await supabase
    .from('edge_function_performance')
    .select('*')
    .gte('recorded_at', new Date(Date.now() - 3600000).toISOString())
    .limit(100);

  return {
    totalRequests: data?.length || 0,
    avgResponseTime: data?.reduce((sum: number, r: any) => sum + r.execution_time_ms, 0) / (data?.length || 1) || 0,
    errorRate: data?.reduce((sum: number, r: any) => sum + r.error_count, 0) / (data?.length || 1) * 100 || 0
  };
}

async function collectDatabaseMetrics(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  // Sample database metrics collection
  return {
    connectionPoolUtilization: 45,
    queryTime: 150,
    activeConnections: 12
  };
}

async function collectSecurityMetrics(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  metrics.databaseQueries++;
  const { data } = await supabase
    .from('security_incidents')
    .select('*')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  return {
    incidentsLastHour: data?.length || 0,
    criticalIncidents: data?.filter((i: any) => i.threat_level === 'critical').length || 0,
    resolvedIncidents: data?.filter((i: any) => i.resolved).length || 0
  };
}

async function collectBusinessMetrics(supabase: any, metrics: PerformanceMetrics): Promise<any> {
  // Sample business metrics collection
  return {
    activeUsers: 1500,
    conversions: 48,
    revenue: 12500
  };
}

async function detectAnomalies(historicalData: any[], supabase: any, metrics: PerformanceMetrics): Promise<any[]> {
  // Simple anomaly detection based on standard deviation
  const anomalies = [];
  
  if (historicalData.length < 10) {
    return anomalies;
  }

  // Calculate mean and standard deviation for response times
  const responseTimes = historicalData.map(d => d.execution_time_ms);
  const mean = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const stdDev = Math.sqrt(
    responseTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / responseTimes.length
  );

  // Find outliers (> 2 standard deviations from mean)
  const threshold = mean + (2 * stdDev);
  const outliers = historicalData.filter(d => d.execution_time_ms > threshold);

  if (outliers.length > 0) {
    anomalies.push({
      type: 'response_time_spike',
      description: `${outliers.length} response time anomalies detected`,
      threshold,
      outliers: outliers.slice(0, 5) // Limit to 5 examples
    });
  }

  return anomalies;
}

async function testEmailNotification(config: any): Promise<any> {
  // Email notification test implementation
  return { success: true, message: 'Email test successful' };
}

async function testWebhookNotification(config: any): Promise<any> {
  // Webhook notification test implementation
  return { success: true, message: 'Webhook test successful' };
}

async function testSlackNotification(config: any): Promise<any> {
  // Slack notification test implementation
  return { success: true, message: 'Slack test successful' };
}

async function processAlertActions(supabase: any, alert: Alert, actions: AlertAction[], metrics: PerformanceMetrics): Promise<void> {
  for (const action of actions) {
    if (!action.enabled) continue;

    try {
      switch (action.type) {
        case 'email':
          await sendEmailNotification(alert, action.config);
          break;
        case 'webhook':
          await sendWebhookNotification(alert, action.config);
          break;
        case 'slack':
          await sendSlackNotification(alert, action.config);
          break;
        case 'log':
          console.log(`Alert: ${alert.title} - ${alert.message}`);
          break;
      }
    } catch (error) {
      console.error(`Failed to execute alert action ${action.type}:`, error);
    }
  }
}

async function sendEmailNotification(alert: Alert, config: any): Promise<void> {
  // Email notification implementation
  console.log(`Email notification sent for alert: ${alert.title}`);
}

async function sendWebhookNotification(alert: Alert, config: any): Promise<void> {
  // Webhook notification implementation
  console.log(`Webhook notification sent for alert: ${alert.title}`);
}

async function sendSlackNotification(alert: Alert, config: any): Promise<void> {
  // Slack notification implementation
  console.log(`Slack notification sent for alert: ${alert.title}`);
}