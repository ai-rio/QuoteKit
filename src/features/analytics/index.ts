/**
 * Analytics Feature Exports
 * 
 * Central export file for all analytics-related components, hooks, and utilities.
 */

// Components
export { AnalyticsErrorBoundary, AnalyticsErrorFallback } from './components/analytics-error-boundary';
export { AnalyticsMetricsCards } from './components/analytics-metrics-cards';
export { SurveyResponsesTable } from './components/survey-responses-table';

// Hooks - Direct service access (for server components)
export {
  useAnalyticsData,
  useAnalyticsResponses,
  useDataExport,
  useRealTimeUpdates,
  useResponseSearch} from './hooks/use-formbricks-analytics';

// Hooks - API access (for client components with proper admin auth)
export {
  useApiAnalyticsData,
  useApiAnalyticsResponses,
  useApiDataExport,
  useApiRealTimeUpdates,
  useApiResponseSearch,
  useApiSurveys} from './hooks/use-formbricks-api';

// Re-export types for convenience
export type {
  FormbricksAnalyticsData,
  FormbricksAnalyticsFilters,
  FormbricksAnalyticsQueryParams,
  FormbricksAnalyticsSortOptions,
  FormbricksSurvey,
  FormbricksSurveyResponse} from '@/libs/formbricks/types';