/**
 * Feedback Components
 * 
 * A comprehensive feedback system that integrates with Formbricks SDK
 * to collect user feedback through various interactive components.
 */

export { FeedbackShowcase } from './feedback-showcase';
export { 
  FeedbackFAB, 
  FeedbackTrigger, 
  InlineFeedbackButton, 
  MinimalFeedbackTrigger 
} from './feedback-trigger';
export { FeedbackWidget, useFeedbackWidget } from './feedback-widget';
export { QuoteSurveyManager } from './quote-survey-manager';
export { SurveyModal } from './survey-modal';
export type { QuoteContext, SurveyTriggerConfig } from './survey-trigger';
export { SURVEY_CONFIGS,SurveyTrigger } from './survey-trigger';

// FB-019: Segment-specific survey components
export { SegmentSurveyManager } from './segment-specific-survey-manager';
export { 
  FORMBRICKS_SURVEY_IDS,
  getConfigForSurvey,
  getEnabledSegmentConfigs,
  getFormbricksSurveyId,
  getSegmentConfigs,
  getSegmentConfigsByPriority,
  getSegmentSurveyIds,
  hasEnabledSurveys,
  SEGMENT_SURVEY_CONFIGS} from './segment-survey-configs';
export { SurveySelector } from './survey-selector';

// FB-020: Upgrade flow feedback components
export { ExitIntentDetector } from './exit-intent-detector';
export { FeatureValueSurvey } from './feature-value-survey';
export { UpgradeAbandonmentSurvey } from './upgrade-abandonment-survey';
export { UpgradeFlowTracker } from './upgrade-flow-tracker';

// Re-export types that might be useful for consumers
export type { 
  FeedbackType,
  PopoverPosition,
  SegmentSurveyConfig,
  SizeOption,
  Survey,
  SurveyContext,
  SurveyFrequency,
  SurveyQuestion,
  SurveyQuestionType,
  SurveyResponse,
  SurveyStep,
  ThemeOption,
  TriggerCondition,
  TriggerVariant,
  UserActivity,
  // FB-019: Segment-specific survey types
  UserSegment,
  UserTierData,  WidgetPosition,
  WidgetState} from './types';

// FB-020: Upgrade flow feedback types
export type {
  FeatureValueResponses
} from './feature-value-survey';
export type {
  UpgradeAbandonmentResponses
} from './upgrade-abandonment-survey';