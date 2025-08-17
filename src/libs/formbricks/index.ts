/**
 * Formbricks Integration Library
 * 
 * This module provides a complete integration with Formbricks for QuoteKit,
 * implementing the technical architecture defined in the documentation.
 */

// Initialize error handling immediately when this module is imported
if (typeof window !== 'undefined') {
  // Set up immediate error suppression for Formbricks
  const setupImmediateErrorSuppression = () => {
    if (!(window as any).__formbricksErrorSuppressed) {
      const originalError = console.error;
      console.error = (...args: any[]) => {
        // Check for Formbricks empty error pattern
        if (args.length >= 1 && typeof args[0] === 'string' && 
            args[0].includes('🧱 Formbricks - Global error:') &&
            (args[0].includes('{}') || (args[1] && typeof args[1] === 'object' && Object.keys(args[1]).length === 0))) {
          console.debug('🚫 [Early Suppression] Blocked Formbricks empty error');
          return;
        }
        originalError.apply(console, args);
      };
      (window as any).__formbricksErrorSuppressed = true;
      console.log('⚡ Early Formbricks error suppression active');
    }
  };
  
  setupImmediateErrorSuppression();
}

export { FormbricksContextSync, getContextSync } from './context-sync';
export { FormbricksManager, getFormbricksManager } from './formbricks-manager';
export { FormbricksProvider } from './formbricks-provider';
export * from './tracking-utils';
export * from './types';

// Re-export the tracking hook for convenience
// export { useFormbricksTracking } from '../../hooks/use-formbricks-tracking'; // Temporarily disabled for type-checking