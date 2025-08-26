// Assessment Report Actions - Refactored to use modular components
// This file provides backward compatibility while utilizing modular components

// Re-export all report operations for backward compatibility
export {
  generateAssessmentReport,
  getAssessmentReports
} from './reports/generation';
export {
  generateReportHTML
} from './reports/templates';

// Re-export types for backward compatibility
export type {
  AssessmentReportData,
  AssessmentReportResult,
  GenerateAssessmentReportData} from './reports/types';