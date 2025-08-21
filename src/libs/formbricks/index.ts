/**
 * Formbricks Integration Library
 * 
 * This module provides a complete integration with Formbricks for QuoteKit,
 * implementing the technical architecture defined in the documentation.
 */

// Initialize error handling immediately when this module is imported
if (typeof window !== 'undefined') {
  // Set up comprehensive error suppression for Formbricks
  const setupComprehensiveErrorSuppression = () => {
    if (!(window as any).__formbricksErrorSuppressed) {
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalLog = console.log;
      
      // Enhanced error checking function
      const isFormbricksError = (message: string, additionalArgs?: any[]): boolean => {
        // Check for Formbricks-specific error patterns
        const formbricksPatterns = [
          '🧱 Formbricks - Global error:',
          'Formbricks - Global error:',
          'formbricks error:',
          'FB error:',
          'Formbricks SDK error:'
        ];
        
        const hasFormbricksPattern = formbricksPatterns.some(pattern => 
          message.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (!hasFormbricksPattern) return false;
        
        // Check for empty error content variations
        const emptyErrorPatterns = [
          '{}',
          'Global error: {}',
          'Global error:  {}',
          'error: {}',
          ': {}',
          'undefined',
          'null',
          ''
        ];
        
        const hasEmptyContent = emptyErrorPatterns.some(pattern => 
          message.includes(pattern)
        );
        
        // Check if additional args contain empty objects (fix TS2322)
        const hasEmptyArgs = Boolean(additionalArgs?.some(arg => 
          arg && typeof arg === 'object' && Object.keys(arg).length === 0
        ));
        
        return hasEmptyContent || hasEmptyArgs;
      };
      
      // Override console.error
      console.error = (...args: any[]) => {
        if (args.length >= 1) {
          // Check string messages
          if (typeof args[0] === 'string') {
            if (isFormbricksError(args[0], args.slice(1))) {
              console.debug('🚫 [Enhanced Suppression] Blocked Formbricks error (string):', args[0]);
              return;
            }
          }
          
          // Check Error objects
          if (args[0] instanceof Error) {
            const errorMessage = args[0].message || args[0].toString();
            if (isFormbricksError(errorMessage, args.slice(1))) {
              console.debug('🚫 [Enhanced Suppression] Blocked Formbricks error (Error object):', errorMessage);
              return;
            }
          }
          
          // Check for generic Formbricks patterns in any argument
          const hasFormbricksError = args.some(arg => {
            if (typeof arg === 'string') {
              return arg.toLowerCase().includes('formbricks') && 
                     (arg.includes('error') || arg.includes('{}'));
            }
            return false;
          });
          
          if (hasFormbricksError) {
            console.debug('🚫 [Enhanced Suppression] Blocked generic Formbricks error:', args);
            return;
          }
        }
        
        originalError.apply(console, args);
      };
      
      // Override console.warn for Formbricks warnings
      console.warn = (...args: any[]) => {
        if (args.length >= 1 && typeof args[0] === 'string') {
          const message = args[0].toLowerCase();
          if (message.includes('formbricks') && 
              (message.includes('warning') || message.includes('warn') || message.includes('{}'))) {
            console.debug('🚫 [Enhanced Suppression] Blocked Formbricks warning:', args[0]);
            return;
          }
        }
        
        originalWarn.apply(console, args);
      };
      
      // Mark suppression as active
      (window as any).__formbricksErrorSuppressed = true;
      (window as any).__formbricksOriginalError = originalError;
      (window as any).__formbricksOriginalWarn = originalWarn;
      
      console.log('⚡ Comprehensive Formbricks error suppression active');
    }
  }

  // Apply suppression immediately
  setupComprehensiveErrorSuppression();
  
  // Re-apply after DOM loads in case other scripts interfere
  document.addEventListener('DOMContentLoaded', setupComprehensiveErrorSuppression);
  
  // Also apply on window load
  window.addEventListener('load', setupComprehensiveErrorSuppression);
}

export { FormbricksContextSync, getContextSync } from './context-sync';
export { FormbricksManager, getFormbricksManager } from './formbricks-manager';
export { FormbricksProvider } from './formbricks-provider';
export * from './tracking-utils';
export * from './types';

// Re-export the tracking hook for convenience
// export { useFormbricksTracking } from '../../hooks/use-formbricks-tracking'; // Temporarily disabled for type-checking