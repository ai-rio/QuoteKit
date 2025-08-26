import { PropertyAssessmentWithDetails } from '../../types';

export interface GenerateAssessmentReportData {
  assessmentId: string;
  format: 'pdf' | 'html' | 'json';
  includeMedia?: boolean;
  includePricing?: boolean;
  template?: 'standard' | 'detailed' | 'summary';
}

export interface AssessmentReportData {
  assessment: PropertyAssessmentWithDetails;
  reportId: string;
  format: 'pdf' | 'html' | 'json';
  generatedAt: Date;
  templateUsed: string;
  fileSize?: number;
  downloadUrl?: string;
}

export interface AssessmentReportResult {
  reportData: AssessmentReportData;
  content?: string; // HTML content for HTML format
  buffer?: Buffer;   // PDF buffer for PDF format
  downloadUrl?: string;
}