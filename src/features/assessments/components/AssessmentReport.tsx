// Assessment Report - Refactored to use modular components
// This file provides backward compatibility while utilizing modular components

// Re-export the refactored report components
export { AssessmentReport } from './reports/AssessmentReport';
export { ConditionSummary } from './reports/ConditionSummary';
export { MediaGallery } from './reports/MediaGallery';
export { ReportHeader } from './reports/ReportHeader';

// Re-export types for backward compatibility
export type { 
  AssessmentReportData,
  AssessmentReportProps} from './reports/types';

// Default export for backward compatibility
export { AssessmentReport as default } from './reports/AssessmentReport';