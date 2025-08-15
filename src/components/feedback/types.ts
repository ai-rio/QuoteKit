/**
 * Types for Feedback Components
 */

/**
 * Survey question types that align with Formbricks
 */
export type SurveyQuestionType = 
  | 'rating' 
  | 'multiple_choice' 
  | 'single_choice' 
  | 'open_text' 
  | 'email'
  | 'nps'
  | 'cta';

/**
 * Survey question structure
 */
export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  question: string;
  description?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  buttonText?: string;
  minRating?: number;
  maxRating?: number;
  lowLabel?: string;
  highLabel?: string;
}

/**
 * Survey response structure
 */
export interface SurveyResponse {
  questionId: string;
  type: SurveyQuestionType;
  value: string | number | string[];
  timestamp: number;
}

/**
 * Survey configuration
 */
export interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  welcomeCard?: {
    headline: string;
    description: string;
    buttonText?: string;
  };
  thankYouCard?: {
    headline: string;
    description: string;
    buttonText?: string;
  };
}

/**
 * Widget state type
 */
export type WidgetState = 'minimized' | 'expanded' | 'hidden';

/**
 * Survey step type
 */
export type SurveyStep = 'welcome' | 'question' | 'thank-you';

/**
 * Feedback trigger variants
 */
export type TriggerVariant = 'button' | 'fab' | 'inline' | 'minimal';

/**
 * Feedback types
 */
export type FeedbackType = 'survey' | 'feature-request' | 'bug-report' | 'general';

/**
 * Position options for widgets
 */
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/**
 * Theme options
 */
export type ThemeOption = 'light' | 'dark' | 'auto';

/**
 * Size options
 */
export type SizeOption = 'sm' | 'md' | 'lg';

/**
 * Position options for popovers
 */
export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';