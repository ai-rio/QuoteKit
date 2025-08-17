/**
 * Type definitions for Formbricks integration
 */

export interface FormbricksConfig {
  environmentId: string;
  appUrl?: string;
}

export interface FormbricksEvent {
  name: string;
  properties?: Record<string, any>;
  context?: {
    page: string;
    section: string;
    userTier: string;
    sessionId: string;
  };
}

/**
 * Core events that QuoteKit will track
 */
export const FORMBRICKS_EVENTS = {
  // Dashboard Events
  DASHBOARD_VISIT: 'dashboard_visit',
  DASHBOARD_SATISFACTION_SURVEY_TRIGGERED: 'dashboard_satisfaction_survey_triggered',
  DASHBOARD_INTERACTION: 'dashboard_interaction',
  USAGE_LIMIT_REACHED: 'usage_limit_reached',
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  QUICK_ACTION_CLICKED: 'quick_action_clicked',
  
  // Quote Events - Core Lifecycle
  QUOTE_CREATED: 'quote_created',
  QUOTE_SAVED_DRAFT: 'quote_saved_draft',
  QUOTE_SENT: 'quote_sent',
  QUOTE_ACCEPTED: 'quote_accepted',
  QUOTE_REJECTED: 'quote_rejected',
  QUOTE_DUPLICATED: 'quote_duplicated',
  QUOTE_DELETED: 'quote_deleted',
  QUOTE_BULK_ACTION: 'quote_bulk_action',

  // Quote Creation Workflow - Step Tracking
  QUOTE_WORKFLOW_STARTED: 'quote_workflow_started',
  QUOTE_WORKFLOW_CLIENT_SELECTED: 'quote_workflow_client_selected',
  QUOTE_WORKFLOW_FIRST_ITEM_ADDED: 'quote_workflow_first_item_added',
  QUOTE_WORKFLOW_ITEMS_CONFIGURED: 'quote_workflow_items_configured',
  QUOTE_WORKFLOW_PRICING_CONFIGURED: 'quote_workflow_pricing_configured',
  QUOTE_WORKFLOW_PREVIEW_VIEWED: 'quote_workflow_preview_viewed',
  QUOTE_WORKFLOW_FINALIZED: 'quote_workflow_finalized',
  QUOTE_WORKFLOW_ABANDONED: 'quote_workflow_abandoned',

  // Quote Creation Workflow - Timing Events
  QUOTE_WORKFLOW_STEP_DURATION: 'quote_workflow_step_duration',
  QUOTE_WORKFLOW_TOTAL_DURATION: 'quote_workflow_total_duration',
  QUOTE_WORKFLOW_SESSION_TIME: 'quote_workflow_session_time',

  // Quote Creation Workflow - Interaction Events
  QUOTE_WORKFLOW_ITEM_SEARCH: 'quote_workflow_item_search',
  QUOTE_WORKFLOW_ITEM_QUANTITY_CHANGED: 'quote_workflow_item_quantity_changed',
  QUOTE_WORKFLOW_TEMPLATE_USED: 'quote_workflow_template_used',
  QUOTE_WORKFLOW_AUTOSAVE_TRIGGERED: 'quote_workflow_autosave_triggered',
  QUOTE_WORKFLOW_MANUAL_SAVE: 'quote_workflow_manual_save',
  QUOTE_WORKFLOW_ERROR_ENCOUNTERED: 'quote_workflow_error_encountered',

  // Quote Creation Workflow - Abandonment Points
  QUOTE_WORKFLOW_CLIENT_ABANDONMENT: 'quote_workflow_client_abandonment',
  QUOTE_WORKFLOW_ITEMS_ABANDONMENT: 'quote_workflow_items_abandonment',
  QUOTE_WORKFLOW_PRICING_ABANDONMENT: 'quote_workflow_pricing_abandonment',
  QUOTE_WORKFLOW_EXIT_INTENT: 'quote_workflow_exit_intent',

  // Quote Creation Workflow - Conversion Events
  QUOTE_WORKFLOW_CONVERSION_SUCCESS: 'quote_workflow_conversion_success',
  QUOTE_WORKFLOW_CONVERSION_FAILURE: 'quote_workflow_conversion_failure',
  QUOTE_WORKFLOW_PDF_GENERATION_START: 'quote_workflow_pdf_generation_start',
  QUOTE_WORKFLOW_PDF_GENERATION_SUCCESS: 'quote_workflow_pdf_generation_success',
  QUOTE_WORKFLOW_PDF_GENERATION_FAILURE: 'quote_workflow_pdf_generation_failure',
  
  // Quote Events - Complexity & Value
  COMPLEX_QUOTE_CREATED: 'complex_quote_created',
  HIGH_VALUE_QUOTE_CREATED: 'high_value_quote_created',
  QUOTE_TEMPLATE_USED: 'quote_template_used',
  QUOTE_TEMPLATE_CREATED: 'quote_template_created',
  
  // User Journey Events
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_QUOTE_CREATED: 'first_quote_created',
  POWER_USER_MILESTONE: 'power_user_milestone',
  DAILY_ACTIVE_USER: 'daily_active_user',
  
  // Feature Discovery & Usage
  FEATURE_DISCOVERED: 'feature_discovered',
  FEATURE_USED: 'feature_used',
  HELP_REQUESTED: 'help_requested',
  TUTORIAL_STARTED: 'tutorial_started',
  TUTORIAL_COMPLETED: 'tutorial_completed',
  
  // Item Management
  ITEM_CREATED: 'item_created',
  ITEM_FAVORITED: 'item_favorited',
  GLOBAL_ITEM_COPIED: 'global_item_copied',
  ITEM_LIBRARY_VISITED: 'item_library_visited',
  
  // Settings & Configuration
  COMPANY_SETTINGS_UPDATED: 'company_settings_updated',
  PROFILE_UPDATED: 'profile_updated',
  BRANDING_CUSTOMIZED: 'branding_customized',
  
  // Navigation & Engagement
  PAGE_VIEW: 'page_view',
  ROUTE_CHANGE: 'route_change',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  
  // Conversion & Monetization
  UPGRADE_INITIATED: 'upgrade_initiated',
  UPGRADE_COMPLETED: 'upgrade_completed',
  UPGRADE_ABANDONED: 'upgrade_abandoned',
  BILLING_PAGE_VISITED: 'billing_page_visited',
  PRICING_PAGE_VISITED: 'pricing_page_visited',
  
  // Errors & Issues
  ERROR_ENCOUNTERED: 'error_encountered',
  FEATURE_LIMIT_HIT: 'feature_limit_hit',
  PDF_GENERATION_FAILED: 'pdf_generation_failed',
  EMAIL_SEND_FAILED: 'email_send_failed',
  
  // Analytics & Insights
  ANALYTICS_VIEWED: 'analytics_viewed',
  EXPORT_GENERATED: 'export_generated',
  REPORT_DOWNLOADED: 'report_downloaded',
  
  // Feedback Widget Events
  FEEDBACK_WIDGET_SHOWN: 'feedback_widget_shown',
  FEEDBACK_WIDGET_CLICKED: 'feedback_widget_clicked',
  FEEDBACK_GENERAL: 'feedback_general',
  FEEDBACK_FEATURE_REQUEST: 'feedback_feature_request',
  FEEDBACK_BUG_REPORT: 'feedback_bug_report',
  FEEDBACK_APPRECIATION: 'feedback_appreciation',
  
  // Post-Quote Creation Survey Events (FB-010)
  POST_QUOTE_CREATION_SURVEY: 'post_quote_creation_survey',
  HIGH_VALUE_QUOTE_FEEDBACK: 'high_value_quote_feedback',
  COMPLEX_QUOTE_FEEDBACK: 'complex_quote_feedback',
  NEW_CLIENT_QUOTE_EXPERIENCE: 'new_client_quote_experience',
  QUOTE_CREATION_SATISFACTION: 'quote_creation_satisfaction',
} as const;

export type FormbricksEventName = typeof FORMBRICKS_EVENTS[keyof typeof FORMBRICKS_EVENTS];

/**
 * User attributes that will be sent to Formbricks
 */
export interface FormbricksUserAttributes {
  email?: string;
  subscriptionTier?: string;
  quotesCreated?: number;
  revenue?: number;
  industry?: string;
  companySize?: string;
  signupDate?: string;
  lastActive?: string;
}

/**
 * Formbricks manager status
 */
export interface FormbricksStatus {
  initialized: boolean;
  available: boolean;
}

/**
 * Quote workflow tracking interfaces
 */
export interface QuoteWorkflowStep {
  step: 'client_selection' | 'item_addition' | 'item_configuration' | 'pricing_setup' | 'preview' | 'finalization';
  startTime: number;
  endTime?: number;
  completed: boolean;
  abandoned?: boolean;
  errorOccurred?: boolean;
  metadata?: Record<string, any>;
}

export interface QuoteWorkflowSession {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  currentStep: QuoteWorkflowStep['step'];
  steps: QuoteWorkflowStep[];
  totalDuration?: number;
  completed: boolean;
  abandoned: boolean;
  abandonnmentPoint?: QuoteWorkflowStep['step'];
  conversionSuccess?: boolean;
  quoteId?: string;
  templateUsed?: string;
  clientSource?: 'new' | 'existing' | 'imported';
  itemCount?: number;
  estimatedValue?: number;
  complexityScore?: number;
}

export interface QuoteWorkflowAnalytics {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  conversionRate: number;
  averageDuration: number;
  stepCompletionRates: Record<QuoteWorkflowStep['step'], number>;
  averageStepDurations: Record<QuoteWorkflowStep['step'], number>;
  abandonmentPoints: Record<QuoteWorkflowStep['step'], number>;
  errorRates: Record<QuoteWorkflowStep['step'], number>;
}

export interface QuoteWorkflowEventData {
  sessionId: string;
  step?: QuoteWorkflowStep['step'];
  stepDuration?: number;
  totalDuration?: number;
  metadata?: Record<string, any>;
  errorDetails?: {
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
  };
}