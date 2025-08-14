/**
 * Formbricks Integration Library
 * 
 * This module provides a complete integration with Formbricks for QuoteKit,
 * implementing the technical architecture defined in the documentation.
 */

export { FormbricksManager, getFormbricksManager } from './formbricks-manager';
export { FormbricksProvider } from './formbricks-provider';
export * from './tracking-utils';
export * from './types';

// Re-export the tracking hook for convenience
export { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';