/**
 * Sprint 3: Webhook Monitoring Dashboard API
 * Provides real-time webhook performance metrics and monitoring data
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { authenticateUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { recordPerformance } from '../_shared/performance.ts';
import {
  ApiResponse,
  EdgeFunctionContext,
  PerformanceMetrics} from '../_shared/types.ts';
// Import shared utilities
import { 
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
  getErrorMessage,
  getRequestParams
} from '../_shared/utils.ts';

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const url = new URL(req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return createErrorResponse('Method not allowed', 405);
  }

  let metrics: PerformanceMetrics = {
    executionTimeMs: 0,
    databaseQueries: 0,
    apiCalls: 0,
    memoryUsageMb: 0,
    errorCount: 0
  };

  let supabase: any = null;
  let user: any = null;

  try {
    // Initialize Supabase client
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Authenticate user (admin required for webhook monitoring)
    metrics.databaseQueries++;
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication required', 401);
    }
    user = authResult.user;

    // Check if user is admin
    metrics.databaseQueries++;
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      metrics.errorCount++;
      return createErrorResponse('Admin access required', 403);
    }

    const context: EdgeFunctionContext = {
      functionName: 'webhook-monitor',
      operationType: 'dashboard_data',
      requestId,
      user,
      isAdmin: true
    };

    // Get query parameters
    const params = getRequestParams(url);
    const endpoint = url.pathname.split('/').pop() || 'overview';
    const daysBack = parseInt(params.days_back || '7');
    const eventType = params.event_type || null;

    // Route to appropriate dashboard endpoint
    let responseData: any = {};

    switch (endpoint) {
      case 'overview':
        responseData = await getWebhookOverview(supabase, daysBack, metrics);
        break;
      case 'performance':
        responseData = await getPerformanceMetrics(supabase, eventType, daysBack, metrics);
        break;
      case 'dead-letter-queue':
        responseData = await getDeadLetterQueue(supabase, metrics);
        break;
      case 'audit-trail':
        responseData = await getAuditTrail(supabase, daysBack, params.limit ? parseInt(params.limit) : 100, metrics);
        break;
      case 'batch-jobs':
        responseData = await getBatchJobsStatus(supabase, user.id, daysBack, metrics);
        break;
      case 'alerts':
        responseData = await getWebhookAlerts(supabase, daysBack, metrics);
        break;
      default:
        metrics.errorCount++;
        return createErrorResponse(`Unknown endpoint: ${endpoint}`, 404);
    }

    // Calculate final execution time
    metrics.executionTimeMs = Date.now() - startTime;

    // Record performance metrics
    await recordPerformance(supabase, context, metrics);

    return createSuccessResponse(responseData, 'Monitoring data retrieved successfully');

  } catch (error) {
    metrics.errorCount++;
    metrics.executionTimeMs = Date.now() - startTime;

    console.error('Webhook monitor error:', error);

    // Record performance metrics for failed requests
    if (supabase && user) {
      const context: EdgeFunctionContext = {
        functionName: 'webhook-monitor',
        operationType: 'dashboard_error',
        requestId,
        user,
        isAdmin: true
      };
      await recordPerformance(supabase, context, metrics);
    }

    return createErrorResponse(getErrorMessage(error), 500);
  }
});

/**
 * Get webhook processing overview
 */
async function getWebhookOverview(
  supabase: any,
  daysBack: number,
  metrics: PerformanceMetrics
): Promise<any> {
  // Get overall webhook statistics
  metrics.databaseQueries++;
  const { data: overallStats, error: statsError } = await supabase
    .from('stripe_webhook_events')
    .select('event_type, processed, created_at')
    .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

  if (statsError) throw statsError;

  // Calculate summary statistics
  const totalEvents = overallStats.length;
  const processedEvents = overallStats.filter((e: any) => e.processed).length;
  const failedEvents = totalEvents - processedEvents;
  const successRate = totalEvents > 0 ? (processedEvents / totalEvents) * 100 : 0;

  // Get event type breakdown
  const eventTypeBreakdown = overallStats.reduce((acc: any, event: any) => {
    if (!acc[event.event_type]) {
      acc[event.event_type] = { total: 0, processed: 0, failed: 0 };
    }
    acc[event.event_type].total++;
    if (event.processed) {
      acc[event.event_type].processed++;
    } else {
      acc[event.event_type].failed++;
    }
    return acc;
  }, {});

  // Get recent performance metrics
  metrics.databaseQueries++;
  const { data: recentPerformance, error: perfError } = await supabase
    .rpc('get_webhook_performance_summary', {
      p_days_back: daysBack
    });

  if (perfError) throw perfError;

  // Get dead letter queue count
  metrics.databaseQueries++;
  const { data: dlqCount, error: dlqError } = await supabase
    .from('webhook_dead_letter_queue')
    .select('id', { count: 'exact' })
    .eq('resolved', false);

  if (dlqError) throw dlqError;

  // Get current processing targets vs actuals
  const targetAchievement = recentPerformance.map((perf: any) => ({
    event_type: perf.event_type,
    current_avg_time: perf.avg_processing_time_ms,
    target_time: 200, // Sprint 3 target
    improvement_percentage: perf.improvement_vs_baseline,
    target_achieved: perf.avg_processing_time_ms <= 200
  }));

  return {
    summary: {
      total_events: totalEvents,
      processed_events: processedEvents,
      failed_events: failedEvents,
      success_rate: Math.round(successRate * 100) / 100,
      dead_letter_queue_count: dlqCount.count,
      period_days: daysBack
    },
    event_type_breakdown: eventTypeBreakdown,
    performance_summary: recentPerformance,
    target_achievement: targetAchievement,
    sprint3_goals: {
      target_processing_time_ms: 200,
      baseline_processing_time_ms: 500,
      target_improvement_percentage: 60,
      events_meeting_target: targetAchievement.filter((t: any) => t.target_achieved).length,
      total_event_types: targetAchievement.length
    }
  };
}

/**
 * Get detailed performance metrics
 */
async function getPerformanceMetrics(
  supabase: any,
  eventType: string | null,
  daysBack: number,
  metrics: PerformanceMetrics
): Promise<any> {
  // Get performance summary
  metrics.databaseQueries++;
  const { data: performanceSummary, error: perfError } = await supabase
    .rpc('get_webhook_performance_summary', {
      p_event_type: eventType,
      p_days_back: daysBack
    });

  if (perfError) throw perfError;

  // Get hourly performance trends
  metrics.databaseQueries++;
  const { data: hourlyTrends, error: trendsError } = await supabase
    .from('webhook_processing_logs')
    .select(`
      created_at,
      execution_time_ms,
      event_type,
      status
    `)
    .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .not('execution_time_ms', 'is', null)
    .order('created_at', { ascending: true });

  if (trendsError) throw trendsError;

  // Group hourly trends
  const hourlyData = hourlyTrends.reduce((acc: any, log: any) => {
    const hour = new Date(log.created_at).toISOString().slice(0, 13) + ':00:00.000Z';
    if (!acc[hour]) {
      acc[hour] = {
        hour,
        total_events: 0,
        avg_time: 0,
        success_count: 0,
        failure_count: 0,
        total_time: 0
      };
    }
    
    acc[hour].total_events++;
    acc[hour].total_time += log.execution_time_ms;
    
    if (log.status === 'completed') {
      acc[hour].success_count++;
    } else {
      acc[hour].failure_count++;
    }
    
    return acc;
  }, {});

  // Calculate averages
  Object.values(hourlyData).forEach((hour: any) => {
    hour.avg_time = Math.round(hour.total_time / hour.total_events);
    delete hour.total_time;
  });

  // Get performance benchmarks
  metrics.databaseQueries++;
  const { data: benchmarks, error: benchmarkError } = await supabase
    .from('webhook_performance_benchmarks')
    .select('*')
    .order('improvement_percentage', { ascending: false, nullsLast: true });

  if (benchmarkError) throw benchmarkError;

  return {
    performance_summary: performanceSummary,
    hourly_trends: Object.values(hourlyData).sort((a: any, b: any) => 
      new Date(a.hour).getTime() - new Date(b.hour).getTime()
    ),
    benchmarks: benchmarks,
    filter: {
      event_type: eventType,
      days_back: daysBack
    }
  };
}

/**
 * Get dead letter queue status
 */
async function getDeadLetterQueue(
  supabase: any,
  metrics: PerformanceMetrics
): Promise<any> {
  // Get unresolved DLQ entries
  metrics.databaseQueries++;
  const { data: unresolvedEntries, error: dlqError } = await supabase
    .from('webhook_dead_letter_queue')
    .select(`
      id,
      stripe_event_id,
      event_type,
      failure_reason,
      failure_count,
      first_failed_at,
      last_failed_at,
      last_error_message,
      requires_manual_review
    `)
    .eq('resolved', false)
    .order('last_failed_at', { ascending: false });

  if (dlqError) throw dlqError;

  // Get failure reason breakdown
  const failureReasons = unresolvedEntries.reduce((acc: any, entry: any) => {
    if (!acc[entry.failure_reason]) {
      acc[entry.failure_reason] = 0;
    }
    acc[entry.failure_reason]++;
    return acc;
  }, {});

  // Get high-priority items (manual review required or high failure count)
  const highPriorityItems = unresolvedEntries.filter((entry: any) => 
    entry.requires_manual_review || entry.failure_count >= 5
  );

  return {
    unresolved_count: unresolvedEntries.length,
    high_priority_count: highPriorityItems.length,
    failure_reasons: failureReasons,
    unresolved_entries: unresolvedEntries.slice(0, 50), // Limit to 50 most recent
    high_priority_items: highPriorityItems
  };
}

/**
 * Get audit trail data
 */
async function getAuditTrail(
  supabase: any,
  daysBack: number,
  limit: number,
  metrics: PerformanceMetrics
): Promise<any> {
  metrics.databaseQueries++;
  const { data: auditEntries, error: auditError } = await supabase
    .from('webhook_audit_trail')
    .select(`
      id,
      stripe_event_id,
      event_type,
      signature_validated,
      idempotency_checked,
      handler_matched,
      processing_started_at,
      processing_completed_at,
      total_processing_time_ms,
      response_status,
      user_id,
      ip_address
    `)
    .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('processing_started_at', { ascending: false })
    .limit(limit);

  if (auditError) throw auditError;

  // Get validation statistics
  const validationStats = auditEntries.reduce((acc: any, entry: any) => {
    acc.total++;
    if (entry.signature_validated) acc.signature_validated++;
    if (entry.idempotency_checked) acc.idempotency_checked++;
    if (entry.handler_matched) acc.handler_matched++;
    if (entry.response_status === 200) acc.successful++;
    return acc;
  }, {
    total: 0,
    signature_validated: 0,
    idempotency_checked: 0,
    handler_matched: 0,
    successful: 0
  });

  return {
    audit_entries: auditEntries,
    validation_stats: validationStats,
    filter: {
      days_back: daysBack,
      limit: limit
    }
  };
}

/**
 * Get batch jobs status
 */
async function getBatchJobsStatus(
  supabase: any,
  userId: string,
  daysBack: number,
  metrics: PerformanceMetrics
): Promise<any> {
  // Get recent batch jobs
  metrics.databaseQueries++;
  const { data: batchJobs, error: batchError } = await supabase
    .from('batch_jobs')
    .select(`
      id,
      operation_type,
      total_items,
      processed_items,
      failed_items,
      progress_percent,
      status,
      execution_time_ms,
      created_at,
      completed_at
    `)
    .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  if (batchError) throw batchError;

  // Calculate statistics
  const stats = batchJobs.reduce((acc: any, job: any) => {
    acc.total++;
    acc.by_status[job.status] = (acc.by_status[job.status] || 0) + 1;
    acc.by_operation[job.operation_type] = (acc.by_operation[job.operation_type] || 0) + 1;
    
    if (job.status === 'completed') {
      acc.total_items_processed += job.processed_items;
      acc.total_items_failed += job.failed_items;
    }
    
    if (job.execution_time_ms) {
      acc.total_execution_time += job.execution_time_ms;
      acc.jobs_with_timing++;
    }
    
    return acc;
  }, {
    total: 0,
    by_status: {},
    by_operation: {},
    total_items_processed: 0,
    total_items_failed: 0,
    total_execution_time: 0,
    jobs_with_timing: 0
  });

  const averageExecutionTime = stats.jobs_with_timing > 0 
    ? Math.round(stats.total_execution_time / stats.jobs_with_timing)
    : 0;

  return {
    recent_jobs: batchJobs,
    statistics: {
      ...stats,
      average_execution_time_ms: averageExecutionTime
    },
    filter: {
      days_back: daysBack,
      user_id: userId
    }
  };
}

/**
 * Get webhook alerts and issues
 */
async function getWebhookAlerts(
  supabase: any,
  daysBack: number,
  metrics: PerformanceMetrics
): Promise<any> {
  const alerts: any[] = [];

  // Check for high failure rate events
  metrics.databaseQueries++;
  const { data: failureRates, error: failureError } = await supabase
    .rpc('get_webhook_performance_summary', {
      p_days_back: daysBack
    });

  if (!failureError) {
    failureRates.forEach((perf: any) => {
      if (perf.success_rate < 95) {
        alerts.push({
          type: 'high_failure_rate',
          severity: perf.success_rate < 90 ? 'critical' : 'warning',
          event_type: perf.event_type,
          message: `High failure rate: ${Math.round((100 - perf.success_rate) * 100) / 100}%`,
          value: perf.success_rate,
          threshold: 95
        });
      }
    });
  }

  // Check for slow processing times
  if (!failureError) {
    failureRates.forEach((perf: any) => {
      if (perf.avg_processing_time_ms > 200) {
        alerts.push({
          type: 'slow_processing',
          severity: perf.avg_processing_time_ms > 500 ? 'critical' : 'warning',
          event_type: perf.event_type,
          message: `Processing time above target: ${perf.avg_processing_time_ms}ms > 200ms`,
          value: perf.avg_processing_time_ms,
          threshold: 200
        });
      }
    });
  }

  // Check for dead letter queue buildup
  metrics.databaseQueries++;
  const { data: dlqCount, error: dlqError } = await supabase
    .from('webhook_dead_letter_queue')
    .select('id', { count: 'exact' })
    .eq('resolved', false);

  if (!dlqError && dlqCount.count > 10) {
    alerts.push({
      type: 'dlq_buildup',
      severity: dlqCount.count > 50 ? 'critical' : 'warning',
      message: `Dead letter queue buildup: ${dlqCount.count} unresolved items`,
      value: dlqCount.count,
      threshold: 10
    });
  }

  // Check for stale webhooks (not processed recently)
  metrics.databaseQueries++;
  const { data: staleWebhooks, error: staleError } = await supabase
    .from('stripe_webhook_events')
    .select('id', { count: 'exact' })
    .eq('processed', false)
    .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // 1 hour old

  if (!staleError && staleWebhooks.count > 0) {
    alerts.push({
      type: 'stale_webhooks',
      severity: staleWebhooks.count > 10 ? 'critical' : 'warning',
      message: `Stale unprocessed webhooks: ${staleWebhooks.count} events`,
      value: staleWebhooks.count,
      threshold: 0
    });
  }

  // Sort alerts by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    alerts: alerts,
    alert_counts: {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      total: alerts.length
    },
    checked_at: new Date().toISOString()
  };
}