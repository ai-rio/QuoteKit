import { PropertyAssessmentWithDetails } from '../../types';

export interface AssessmentReportProps {
  assessment: PropertyAssessmentWithDetails;
  showActions?: boolean;
}

export interface AssessmentReportData {
  assessment: PropertyAssessmentWithDetails;
  generatedAt: Date;
  reportId: string;
}

export interface ReportHeaderProps {
  assessment: PropertyAssessmentWithDetails;
  reportId: string;
  generatedAt: Date;
}

export interface ConditionSummaryProps {
  assessment: PropertyAssessmentWithDetails;
}

export interface MediaGalleryProps {
  assessment: PropertyAssessmentWithDetails;
  media?: Array<{
    id: string;
    type: string;
    url: string;
    description?: string;
    caption?: string;
  }>;
}
