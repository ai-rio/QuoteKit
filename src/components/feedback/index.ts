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

// Re-export types that might be useful for consumers
export type { 
  FeedbackType,
  PopoverPosition,
  SizeOption,
  Survey,
  SurveyQuestion,
  SurveyQuestionType,
  SurveyResponse,
  SurveyStep,
  ThemeOption,
  TriggerVariant,
  WidgetPosition,
  WidgetState} from './types';