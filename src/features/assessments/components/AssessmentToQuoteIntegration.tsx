// Refactored Assessment to Quote Integration
// This file now serves as a compatibility layer and re-exports modular components

// Re-export the refactored components
export { AssessmentIntegration } from './assessment-integration/AssessmentIntegration';
export { AssessmentToQuoteIntegration } from './quote-integration/AssessmentToQuoteIntegration';

// Re-export types for backward compatibility
export type { 
  AssessmentIntegrationProps,
  AssessmentMetrics,
  AssessmentQuotePreview,
  AssessmentToQuoteIntegrationProps,
  QuotePreview,
  SuggestedLineItem} from './quote-integration/types';

// Default export for backward compatibility
export { AssessmentIntegration as default } from './assessment-integration/AssessmentIntegration';