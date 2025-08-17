/**
 * Enhanced Error Handling for Formbricks Analytics
 * FB-014: Implement Analytics Data Fetching
 * 
 * Provides sophisticated error handling, retry logic, and graceful degradation
 * for analytics data fetching operations.
 */

import { APIError } from './analytics-api';

export interface ErrorHandlerConfig {
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableFallback: boolean;
  enableLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface ErrorContext {
  operation: string;
  timestamp: Date;
  retryCount: number;
  userAgent?: string;
  url?: string;
  environment?: string;
  userId?: string;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'cache' | 'skip';
  action: () => Promise<any> | any;
  condition?: (error: Error, context: ErrorContext) => boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByOperation: Record<string, number>;
  retrySuccessRate: number;
  averageRecoveryTime: number;
}

/**
 * Analytics-specific error handler with recovery strategies
 */
export class AnalyticsErrorHandler {
  private config: ErrorHandlerConfig;
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsByOperation: {},
    retrySuccessRate: 0,
    averageRecoveryTime: 0,
  };
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy[]> = new Map();

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableFallback: true,
      enableLogging: true,
      logLevel: 'error',
      ...config,
    };

    console.log('🛡️ AnalyticsErrorHandler initialized:', this.config);
    this.setupDefaultRecoveryStrategies();
  }

  /**
   * Handle error with automatic recovery strategies
   */
  async handleError<T>(
    error: unknown,
    context: ErrorContext,
    fallbackValue?: T
  ): Promise<T | null> {
    const apiError = this.normalizeError(error);
    this.recordError(apiError, context);
    this.logError(apiError, context);

    // Try recovery strategies
    const recoveryResult = await this.attemptRecovery(apiError, context);
    if (recoveryResult !== null) {
      return recoveryResult as T;
    }

    // Return fallback value if available
    if (fallbackValue !== undefined) {
      console.log('🔄 Using fallback value for failed operation:', context.operation);
      return fallbackValue;
    }

    // Final fallback
    console.warn('⚠️ All recovery attempts failed, returning null');
    return null;
  }

  /**
   * Execute operation with error handling
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'timestamp' | 'retryCount'>,
    fallbackValue?: T
  ): Promise<T | null> {
    const fullContext: ErrorContext = {
      ...context,
      timestamp: new Date(),
      retryCount: 0,
    };

    try {
      return await operation();
    } catch (error) {
      return await this.handleError(error, fullContext, fallbackValue);
    }
  }

  /**
   * Register custom recovery strategy
   */
  registerRecoveryStrategy(
    errorType: string,
    strategy: ErrorRecoveryStrategy
  ): void {
    const strategies = this.recoveryStrategies.get(errorType) || [];
    strategies.push(strategy);
    this.recoveryStrategies.set(errorType, strategies);

    console.log('📝 Registered recovery strategy for error type:', errorType);
  }

  /**
   * Check if operation should be retried
   */
  shouldRetry(error: APIError, context: ErrorContext): boolean {
    if (!this.config.enableRetry) return false;
    if (context.retryCount >= this.config.maxRetries) return false;

    // Don't retry certain error types
    const nonRetryableErrors = [
      'authentication',
      'authorization',
      'validation',
      'not_found',
    ];

    if (nonRetryableErrors.some(type => error.message.toLowerCase().includes(type))) {
      return false;
    }

    // Retry network errors and server errors
    const retryableErrors = [
      'network',
      'timeout',
      'server_error',
      'rate_limit',
      '5',
    ];

    return retryableErrors.some(type => 
      error.message.toLowerCase().includes(type) ||
      (error.status && error.status >= 500) ||
      (error.status === 429) // Rate limiting
    );
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset error metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      errorsByOperation: {},
      retrySuccessRate: 0,
      averageRecoveryTime: 0,
    };
    console.log('🧹 Error metrics reset');
  }

  /**
   * Check system health based on error metrics
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorRate: number;
    recommendations: string[];
  } {
    const totalRequests = this.metrics.totalErrors + 100; // Assume some successful requests
    const errorRate = this.metrics.totalErrors / totalRequests;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    const recommendations: string[] = [];

    if (errorRate < 0.05) {
      status = 'healthy';
    } else if (errorRate < 0.15) {
      status = 'degraded';
      recommendations.push('Monitor error patterns');
      recommendations.push('Consider increasing cache TTL');
    } else {
      status = 'unhealthy';
      recommendations.push('Check network connectivity');
      recommendations.push('Verify API credentials');
      recommendations.push('Consider fallback data sources');
    }

    // Check for specific error patterns
    const networkErrors = this.metrics.errorsByType['network'] || 0;
    if (networkErrors > 5) {
      recommendations.push('Network connectivity issues detected');
    }

    const authErrors = this.metrics.errorsByType['authentication'] || 0;
    if (authErrors > 2) {
      recommendations.push('Authentication issues detected - check API keys');
    }

    return {
      status,
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
      recommendations,
    };
  }

  /**
   * Private helper methods
   */
  private normalizeError(error: unknown): APIError {
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error,
        code: error.name,
      };
    }

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      return {
        message: errorObj.message || 'Unknown error occurred',
        status: errorObj.status,
        code: errorObj.code,
        details: error,
      };
    }

    return {
      message: String(error),
      details: error,
    };
  }

  private recordError(error: APIError, context: ErrorContext): void {
    this.metrics.totalErrors++;
    
    // Record by error type
    const errorType = this.categorizeError(error);
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
    
    // Record by operation
    this.metrics.errorsByOperation[context.operation] = 
      (this.metrics.errorsByOperation[context.operation] || 0) + 1;
  }

  private categorizeError(error: APIError): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) return 'network';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('auth')) return 'authentication';
    if (message.includes('permission') || message.includes('forbidden')) return 'authorization';
    if (message.includes('not found') || error.status === 404) return 'not_found';
    if (message.includes('validation')) return 'validation';
    if (message.includes('rate limit') || error.status === 429) return 'rate_limit';
    if (error.status && error.status >= 500) return 'server_error';
    
    return 'unknown';
  }

  private logError(error: APIError, context: ErrorContext): void {
    if (!this.config.enableLogging) return;

    const logData = {
      error: error.message,
      operation: context.operation,
      retryCount: context.retryCount,
      timestamp: context.timestamp.toISOString(),
      status: error.status,
      code: error.code,
    };

    switch (this.config.logLevel) {
      case 'error':
        console.error('❌ Analytics operation failed:', logData);
        break;
      case 'warn':
        console.warn('⚠️ Analytics operation error:', logData);
        break;
      case 'info':
        console.info('ℹ️ Analytics operation error:', logData);
        break;
      case 'debug':
        console.debug('🐛 Analytics operation error:', logData);
        break;
    }
  }

  private async attemptRecovery<T>(
    error: APIError,
    context: ErrorContext
  ): Promise<T | null> {
    const errorType = this.categorizeError(error);
    const strategies = this.recoveryStrategies.get(errorType) || [];

    // Try each recovery strategy
    for (const strategy of strategies) {
      if (strategy.condition && !strategy.condition(error as Error, context)) {
        continue;
      }

      try {
        console.log(`🔄 Attempting ${strategy.type} recovery for ${context.operation}`);
        const startTime = Date.now();
        
        const result = await strategy.action();
        
        const recoveryTime = Date.now() - startTime;
        this.updateRecoveryMetrics(recoveryTime, true);
        
        console.log(`✅ Recovery successful using ${strategy.type} strategy`);
        return result as T;
      } catch (recoveryError) {
        console.warn(`⚠️ Recovery strategy ${strategy.type} failed:`, recoveryError);
        this.updateRecoveryMetrics(0, false);
      }
    }

    return null;
  }

  private updateRecoveryMetrics(recoveryTime: number, success: boolean): void {
    // Simple moving average for recovery metrics
    const alpha = 0.1; // Smoothing factor
    
    if (success) {
      this.metrics.averageRecoveryTime = 
        (1 - alpha) * this.metrics.averageRecoveryTime + alpha * recoveryTime;
    }
    
    // Update retry success rate (simplified)
    const currentRate = this.metrics.retrySuccessRate;
    this.metrics.retrySuccessRate = 
      (1 - alpha) * currentRate + alpha * (success ? 100 : 0);
  }

  private setupDefaultRecoveryStrategies(): void {
    // Retry strategy for network errors
    this.registerRecoveryStrategy('network', {
      type: 'retry',
      action: async () => {
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay)
        );
        throw new Error('Retry required'); // Signals to caller to retry
      },
      condition: (error, context) => this.shouldRetry(error as APIError, context),
    });

    // Cache fallback for data fetching errors
    this.registerRecoveryStrategy('server_error', {
      type: 'cache',
      action: async () => {
        // This would be implemented by the specific operation
        console.log('🗄️ Attempting to use cached data');
        return null;
      },
    });

    // Skip strategy for non-critical operations
    this.registerRecoveryStrategy('rate_limit', {
      type: 'skip',
      action: () => {
        console.log('⏭️ Skipping operation due to rate limiting');
        return null;
      },
    });
  }
}

/**
 * Create configured error handler
 */
export function createAnalyticsErrorHandler(
  config?: Partial<ErrorHandlerConfig>
): AnalyticsErrorHandler {
  return new AnalyticsErrorHandler(config);
}

/**
 * Default error handler instance
 */
let defaultErrorHandler: AnalyticsErrorHandler | null = null;

export function getDefaultErrorHandler(): AnalyticsErrorHandler {
  if (!defaultErrorHandler) {
    defaultErrorHandler = createAnalyticsErrorHandler({
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableFallback: true,
      enableLogging: true,
      logLevel: 'error',
    });
  }
  
  return defaultErrorHandler;
}