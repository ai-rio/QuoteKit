/**
 * Performance monitoring utilities for Edge Functions
 * Tracks execution metrics and improvements
 */

import { getSupabaseAdmin } from './auth.ts';

interface PerformanceMetrics {
  functionName: string;
  operationType: string;
  executionTimeMs: number;
  databaseQueries?: number;
  apiCallsMade?: number;
  memoryUsageMb?: number;
  errorCount?: number;
  userId?: string;
  metadata?: Record<string, any>;
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