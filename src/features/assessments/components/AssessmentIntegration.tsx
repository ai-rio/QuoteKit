// Legacy Assessment Integration - Now Redirects to Modular Implementation
// This file provides backward compatibility while utilizing the new modular components

export { AssessmentIntegration } from './assessment-integration/AssessmentIntegration';
export { AssessmentIntegration as default } from './assessment-integration/AssessmentIntegration';

// Re-export types for backward compatibility
export type { 
  AssessmentIntegrationProps,
  AssessmentMetrics,
  QuotePreview,
  SuggestedLineItem
} from './assessment-integration/types';