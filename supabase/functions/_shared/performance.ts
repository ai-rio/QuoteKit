/**
 * Performance monitoring utilities for Edge Functions
 * Tracks execution metrics and improvements
 * Enhanced for Sprint 3 webhook monitoring and batch processing
 */

import { getSupabaseAdmin } from './auth.ts';
import { EdgeFunctionContext,PerformanceMetrics } from './types.ts';

// Webhook-specific performance tracking
interface WebhookPerformanceStage {
  stage: string;
  startTime: number;
  endTime?: number;
  executionTimeMs?: number;
  databaseQueries: number;
  apiCalls: number;
  errorMessage?: string;
}

/**
 * Record performance metrics using the existing system
 */
export async function recordPerformance(
  supabase: any,
  context: EdgeFunctionContext,
  metrics: PerformanceMetrics
): Promise<void> {
  try {
    await supabase.rpc('record_edge_function_performance', {
      p_function_name: context.functionName,
      p_operation_type: context.operationType,
      p_execution_time_ms: metrics.executionTimeMs,
      p_database_queries: metrics.databaseQueries,
      p_api_calls_made: metrics.apiCalls,
      p_memory_usage_mb: metrics.memoryUsageMb || 0,
      p_error_count: metrics.errorCount,
      p_user_id: context.user?.id || null,
      p_metadata: {
        request_id: context.requestId,
        is_admin: context.isAdmin,
        ...metrics
      }
    });
  } catch (error) {
    console.warn('Failed to record performance metrics:', error);
  }
}

/**
 * Record webhook processing stage for detailed monitoring
 */
export async function recordWebhookStage(
  supabase: any,
  eventId: string,
  eventType: string,
  stage: string,
  status: 'started' | 'completed' | 'failed' | 'timeout' | 'retrying',
  options: {
    handlerName?: string;
    executionTimeMs?: number;
    databaseQueries?: number;
    apiCalls?: number;
    errorMessage?: string;
    retryAttempt?: number;
    metadata?: any;
  } = {}
): Promise<void> {
  try {
    await supabase.rpc('record_webhook_stage', {
      p_stripe_event_id: eventId,
      p_event_type: eventType,
      p_stage: stage,
      p_status: status,
      p_handler_name: options.handlerName || null,
      p_execution_time_ms: options.executionTimeMs || null,
      p_database_queries: options.databaseQueries || 0,
      p_api_calls: options.apiCalls || 0,
      p_error_message: options.errorMessage || null,
      p_retry_attempt: options.retryAttempt || 0,
      p_metadata: options.metadata || {}
    });
  } catch (error) {
    console.warn('Failed to record webhook stage:', error);
  }
}

/**
 * Performance monitoring class for Edge Functions
 */
export class PerformanceMonitor {
  private startTime: number;
  private functionName: string;
  private operationType: string;
  private dbQueries = 0;
  private apiCalls = 0;
  private errors = 0;
  private userId?: string;
  private metadata: Record<string, any> = {};

  constructor(functionName: string, operationType: string, userId?: string) {
    this.startTime = performance.now();
    this.functionName = functionName;
    this.operationType = operationType;
    this.userId = userId;
  }

  /**
   * Increment database query count
   */
  incrementDbQueries(count = 1) {
    this.dbQueries += count;
  }

  /**
   * Increment API call count
   */
  incrementApiCalls(count = 1) {
    this.apiCalls += count;
  }

  /**
   * Increment error count
   */
  incrementErrors(count = 1) {
    this.errors += count;
  }

  /**
   * Add metadata
   */
  addMetadata(key: string, value: any) {
    this.metadata[key] = value;
  }

  /**
   * Get current execution time
   */
  getExecutionTime(): number {
    return Math.round(performance.now() - this.startTime);
  }

  /**
   * Record final metrics to database
   */
  async recordMetrics(): Promise<void> {
    try {
      const executionTime = this.getExecutionTime();
      const supabase = getSupabaseAdmin();

      await supabase.rpc('record_edge_function_performance', {
        p_function_name: this.functionName,
        p_operation_type: this.operationType,
        p_execution_time_ms: executionTime,
        p_database_queries: this.dbQueries,
        p_api_calls_made: this.apiCalls,
        p_memory_usage_mb: 0, // TODO: Implement memory tracking
        p_error_count: this.errors,
        p_user_id: this.userId || null,
        p_metadata: this.metadata,
      });

      console.log(`📊 Recorded metrics for ${this.functionName}:${this.operationType} - ${executionTime}ms`);
    } catch (error) {
      console.warn('Failed to record performance metrics:', error);
    }
  }

  /**
   * Create a performance-aware response
   */
  createResponse(data: any, status = 200): Response {
    // Add performance headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Execution-Time-Ms': this.getExecutionTime().toString(),
      'X-Database-Queries': this.dbQueries.toString(),
      'X-API-Calls': this.apiCalls.toString(),
    };

    return new Response(JSON.stringify(data), { status, headers });
  }
}

/**
 * Wrapper function to automatically track performance
 */
export async function withPerformanceTracking<T>(
  functionName: string,
  operationType: string,
  userId: string | undefined,
  handler: (monitor: PerformanceMonitor) => Promise<T>
): Promise<T> {
  const monitor = new PerformanceMonitor(functionName, operationType, userId);
  
  try {
    const result = await handler(monitor);
    await monitor.recordMetrics();
    return result;
  } catch (error) {
    monitor.incrementErrors();
    await monitor.recordMetrics();
    throw error;
  }
}

/**
 * Database query wrapper that tracks performance
 */
export async function trackedQuery<T>(
  monitor: PerformanceMonitor,
  queryFn: () => Promise<T>,
  queryName?: string
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    monitor.incrementDbQueries();
    
    if (queryName) {
      const queryTime = Math.round(performance.now() - startTime);
      monitor.addMetadata(`${queryName}_time_ms`, queryTime);
    }
    
    return result;
  } catch (error) {
    monitor.incrementDbQueries();
    monitor.incrementErrors();
    throw error;
  }
}

/**
 * API call wrapper that tracks performance
 */
export async function trackedApiCall<T>(
  monitor: PerformanceMonitor,
  apiCallFn: () => Promise<T>,
  apiName?: string
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await apiCallFn();
    monitor.incrementApiCalls();
    
    if (apiName) {
      const callTime = Math.round(performance.now() - startTime);
      monitor.addMetadata(`${apiName}_time_ms`, callTime);
    }
    
    return result;
  } catch (error) {
    monitor.incrementApiCalls();
    monitor.incrementErrors();
    throw error;
  }
}