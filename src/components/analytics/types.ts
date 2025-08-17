/**
 * Analytics Dashboard Component Types
 * FB-013: Design Analytics Dashboard UI
 */

import type { FormbricksAnalyticsData, FormbricksAnalyticsFilters, FormbricksSurvey, FormbricksSurveyResponse } from '@/libs/formbricks/types';

// Re-export core types for easier usage
export type {
  FormbricksAnalyticsData,
  FormbricksAnalyticsFilters,
  FormbricksSurvey,
  FormbricksSurveyResponse
} from '@/libs/formbricks/types';

// Dashboard-specific types
export interface AnalyticsDashboardProps {
  initialData?: FormbricksAnalyticsData;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface MetricsCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  loading?: boolean;
  error?: string;
}

export interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
  };
  surveyIds: string[];
  completed?: boolean;
  limit: number;
  offset: number;
}

export interface ChartDataPoint {
  date: string;
  count: number;
  label?: string;
}

export interface CompletionRateData {
  surveyId: string;
  surveyName: string;
  completionRate: number;
  totalResponses: number;
  completedResponses: number;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  includeResponses: boolean;
  includeMetrics: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  surveyIds?: string[];
}

export interface AnalyticsLoadingProps {
  message?: string;
  variant?: 'cards' | 'list' | 'chart' | 'full';
}

export interface AnalyticsErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'card' | 'banner' | 'inline';
}

export interface ResponseListFilters {
  searchTerm?: string;
  surveyId?: string;
  completed?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'date' | 'survey' | 'completion';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}