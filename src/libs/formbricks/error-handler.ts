/**
 * Enhanced error handling for Formbricks SDK
 * 
 * This module provides robust error handling to address issues with Formbricks SDK v4.1.0
 * where empty error objects are logged to console causing confusion.
 */

export interface FormbricksError {
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
  context?: string;
}

/**
 * Enhanced error handler for Formbricks operations
 */
export class FormbricksErrorHandler {
  private static instance: FormbricksErrorHandler;
  private originalConsoleError: typeof console.error;
  private errorCount = 0;
  private suppressedErrors = 0;

  private constructor() {
    this.originalConsoleError = console.error;
    this.setupGlobalErrorInterception();
  }

  static getInstance(): FormbricksErrorHandler {
    if (!FormbricksErrorHandler.instance) {
      FormbricksErrorHandler.instance = new FormbricksErrorHandler();
    }
    return FormbricksErrorHandler.instance;
  }

  /**
   * Setup global error interception to catch problematic Formbricks errors
   */
  private setupGlobalErrorInterception(): void {
    if (typeof window === 'undefined') return;

    console.error = (...args: any[]) => {
      this.errorCount++;

      // Very specific check for the exact Formbricks empty error pattern
      const isExactEmptyError = (
        args.length >= 2 &&
        typeof args[0] === 'string' &&
        args[0].includes('Formbricks - Global error:') &&
        args[1] !== null &&
        args[1] !== undefined &&
        typeof args[1] === 'object' &&
        Object.keys(args[1]).length === 0
      );

      if (isExactEmptyError) {
        this.suppressedErrors++;
        console.warn(`🔧 [FormbricksErrorHandler] Suppressed Formbricks empty error #${this.suppressedErrors}`);
        
        // Only show detailed message on first suppression
        if (this.suppressedErrors === 1) {
          console.warn('📋 This is a known issue with Formbricks SDK v4.1.0 - empty error objects are now suppressed');
        }
        
        return; // Completely suppress the error
      }

      // For all other errors (including other Formbricks errors), use original console.error
      this.originalConsoleError.apply(console, args);
    };

    console.log('🛡️ Formbricks error handler initialized - targeting empty error objects');
  }

  /**
   * Check if this is the problematic Formbricks empty error
   */
  private isFormbricksEmptyError(args: any[]): boolean {
    return (
      args.length >= 2 &&
      typeof args[0] === 'string' &&
      args[0].includes('Formbricks - Global error:') &&
      args[1] !== null &&
      args[1] !== undefined &&
      typeof args[1] === 'object' &&
      Object.keys(args[1]).length === 0
    );
  }

  /**
   * Check if this is a Formbricks-related error that needs special handling
   */
  private isFormbricksRelatedError(args: any[]): boolean {
    // Don't handle empty errors here - they should be caught by isFormbricksEmptyError first
    if (this.isFormbricksEmptyError(args)) {
      return false;
    }
    
    return args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('Formbricks') || arg.includes('formbricks'))
    );
  }

  /**
   * Handle the empty error object from Formbricks SDK
   */
  private handleFormbricksEmptyError(args: any[]): void {
    console.warn('🔧 [FormbricksErrorHandler] Intercepted empty error object');
    console.warn('📋 This is a known issue with Formbricks SDK v4.1.0');
    console.warn('🎯 Error suppressed to prevent console spam');
    
    // Debug: Log the actual arguments for troubleshooting
    console.warn('🔍 Debug - Intercepted args:', {
      length: args.length,
      arg0: args[0],
      arg1: args[1],
      arg1Keys: args[1] ? Object.keys(args[1]) : 'N/A'
    });
    
    if (this.suppressedErrors === 1) {
      console.warn('💡 To debug Formbricks issues, check the detailed initialization logs');
      console.warn('🔍 You can also enable debug mode by adding ?formbricksDebug=true to your URL');
    }

    // Log summary every 10 suppressed errors
    if (this.suppressedErrors % 10 === 0) {
      console.warn(`📊 Suppressed ${this.suppressedErrors} Formbricks empty errors so far`);
    }
  }

  /**
   * Handle other Formbricks-related errors with enhanced context
   */
  private handleFormbricksError(args: any[]): void {
    console.group('🧱 [FormbricksErrorHandler] Enhanced Error Context');
    
    // Log the original error with context
    this.originalConsoleError('Original Formbricks error:', ...args);
    
    // Add helpful context
    console.warn('🔍 Formbricks Error Context:');
    console.warn('- SDK Version: v4.1.0');
    console.warn('- Environment:', process.env.NODE_ENV);
    console.warn('- Timestamp:', new Date().toISOString());
    console.warn('- URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    
    // Check if Formbricks is properly initialized
    if (typeof window !== 'undefined' && (window as any).formbricks) {
      console.warn('- SDK Status: Loaded');
      console.warn('- Available methods:', Object.keys((window as any).formbricks));
    } else {
      console.warn('- SDK Status: Not loaded or not available');
    }
    
    console.groupEnd();
  }

  /**
   * Safely execute a Formbricks operation with error handling
   */
  async safeExecute<T>(
    operation: () => T | Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      console.log(`🔄 [FormbricksErrorHandler] Executing: ${context}`);
      const result = await Promise.resolve(operation());
      console.log(`✅ [FormbricksErrorHandler] Success: ${context}`);
      return result;
    } catch (error) {
      console.error(`❌ [FormbricksErrorHandler] Failed: ${context}`, error);
      
      // Create a structured error object
      const structuredError: FormbricksError = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error ? error.name : 'UnknownError',
        details: {
          context,
          originalError: error,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        context,
      };

      // Log structured error for debugging
      console.error('🔍 Structured error details:', structuredError);

      return fallback;
    }
  }

  /**
   * Get error statistics
   */
  getStats(): { totalErrors: number; suppressedErrors: number } {
    return {
      totalErrors: this.errorCount,
      suppressedErrors: this.suppressedErrors,
    };
  }

  /**
   * Reset error counts (useful for testing)
   */
  resetStats(): void {
    this.errorCount = 0;
    this.suppressedErrors = 0;
  }

  /**
   * Restore original console.error (cleanup)
   */
  restore(): void {
    console.error = this.originalConsoleError;
    console.log('🔄 [FormbricksErrorHandler] Original console.error restored');
  }
}

/**
 * Convenience function to get the error handler instance
 */
export const getFormbricksErrorHandler = () => FormbricksErrorHandler.getInstance();

/**
 * Convenience function for safe Formbricks operations
 */
export const safeFormbricksOperation = <T>(
  operation: () => T | Promise<T>,
  context: string,
  fallback?: T
) => {
  return getFormbricksErrorHandler().safeExecute(operation, context, fallback);
};
