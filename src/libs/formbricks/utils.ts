/**
 * Utility functions for Formbricks integration
 */

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

import { FormbricksManager } from './formbricks-manager';

/**
 * Performance monitoring for SDK operations
 */
export class FormbricksPerformanceMonitor {
  private static trackLoadTime() {
    const startTime = performance.now();
    
    return {
      end: () => {
        const loadTime = performance.now() - startTime;
        this.reportMetric('formbricks_sdk_load_time', loadTime);
      }
    };
  }

  private static reportMetric(name: string, value: number, tags?: Record<string, string>) {
    // Report to analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        value: Math.round(value),
        ...tags
      });
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Formbricks metric: ${name}=${Math.round(value)}ms`, tags);
    }
  }
}

/**
 * Error handler for Formbricks operations with graceful degradation
 */
export class FormbricksErrorHandler {
  static handleError(error: Error, context: string): void {
    console.error(`Formbricks error in ${context}:`, error);
    
    // In production, report to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with your error tracking service
      this.reportError(error, context);
    }
    
    // Enable fallback mode
    this.enableFallbackMode();
  }

  private static reportError(error: Error, context: string): void {
    // Implementation would depend on your error tracking service
    // e.g., Sentry, LogRocket, etc.
    console.warn('Error reporting not implemented yet:', { error: error.message, context });
  }

  private static enableFallbackMode(): void {
    // Mark Formbricks as disabled globally
    if (typeof window !== 'undefined') {
      (window as any).formbricksDisabled = true;
    }
    
    // Reset manager state
    const manager = FormbricksManager.getInstance();
    manager.reset();
  }
}

/**
 * Check if Formbricks should be enabled based on environment and configuration
 */
export function shouldEnableFormbricks(): boolean {
  // Don't enable in server-side rendering
  if (typeof window === 'undefined') {
    return false;
  }

  // Don't enable if explicitly disabled
  if ((window as any).formbricksDisabled) {
    return false;
  }

  // Require environment ID to be configured
  const environmentId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
  if (!environmentId) {
    return false;
  }

  return true;
}

/**
 * Safely execute Formbricks operations with error handling
 */
export async function safeFormbricksOperation<T>(
  operation: () => Promise<T> | T,
  context: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    FormbricksErrorHandler.handleError(error as Error, context);
    return fallbackValue;
  }
}