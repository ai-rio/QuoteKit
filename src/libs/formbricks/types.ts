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