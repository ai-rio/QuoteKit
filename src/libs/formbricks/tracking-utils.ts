/**
 * Utility functions for common Formbricks tracking patterns
 */
import { FormbricksManager } from './formbricks-manager';
import { FORMBRICKS_EVENTS, FormbricksEventName } from './types';

/**
 * Track page views with automatic route detection
 */
export function trackPageView(customProps?: Record<string, any>) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  
  manager.track(FORMBRICKS_EVENTS.PAGE_VIEW, {
    page: currentPath,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    timestamp: new Date().toISOString(),
    ...customProps,
  });
}

/**
 * Track user interactions with dashboard elements
 */
export function trackDashboardInteraction(
  element: 'quick_action' | 'stats_card' | 'recent_quotes' | 'welcome_message',
  action: string,
  additionalProps?: Record<string, any>
) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  const eventMap = {
    quick_action: FORMBRICKS_EVENTS.QUICK_ACTION_CLICKED,
    stats_card: FORMBRICKS_EVENTS.FEATURE_USED,
    recent_quotes: FORMBRICKS_EVENTS.FEATURE_USED,
    welcome_message: FORMBRICKS_EVENTS.FEATURE_DISCOVERED,
  };

  manager.track(eventMap[element], {
    element,
    action,
    section: 'dashboard',
    ...additionalProps,
  });
}

/**
 * Track quote complexity and value insights
 */
export function analyzeQuoteComplexity(quoteData: {
  itemCount: number;
  totalValue: number;
  hasCustomItems: boolean;
  hasDiscounts: boolean;
  hasTax: boolean;
}): 'simple' | 'complex' {
  const complexityFactors = [
    quoteData.itemCount > 10,
    quoteData.totalValue > 5000,
    quoteData.hasCustomItems,
    quoteData.hasDiscounts,
    quoteData.hasTax,
  ];

  const complexityScore = complexityFactors.filter(Boolean).length;
  return complexityScore >= 2 ? 'complex' : 'simple';
}

/**
 * Track user engagement milestones
 */
export function checkAndTrackMilestones(userStats: {
  quotesCreated: number;
  totalRevenue: number;
  daysActive: number;
  featuresUsed: string[];
}) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  // Power user milestone (10+ quotes, 5+ features)
  if (userStats.quotesCreated >= 10 && userStats.featuresUsed.length >= 5) {
    manager.track(FORMBRICKS_EVENTS.POWER_USER_MILESTONE, {
      quotesCreated: userStats.quotesCreated,
      featuresUsed: userStats.featuresUsed.length,
      totalRevenue: userStats.totalRevenue,
    });
  }

  // Daily active user tracking
  manager.track(FORMBRICKS_EVENTS.DAILY_ACTIVE_USER, {
    daysActive: userStats.daysActive,
    quotesCreated: userStats.quotesCreated,
  });
}

/**
 * Track feature limits and upgrade prompts
 */
export function trackFeatureLimit(
  feature: string,
  currentUsage: number,
  limit: number,
  userTier: string
) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  const usagePercentage = (currentUsage / limit) * 100;

  // Track when user hits 80% of limit
  if (usagePercentage >= 80 && usagePercentage < 100) {
    manager.track(FORMBRICKS_EVENTS.USAGE_LIMIT_REACHED, {
      feature,
      currentUsage,
      limit,
      usagePercentage: Math.round(usagePercentage),
      userTier,
      severity: 'warning',
    });
  }

  // Track when user hits the actual limit
  if (currentUsage >= limit) {
    manager.track(FORMBRICKS_EVENTS.FEATURE_LIMIT_HIT, {
      feature,
      currentUsage,
      limit,
      userTier,
      severity: 'blocked',
    });
  }
}

/**
 * Track upgrade prompt displays
 */
export function trackUpgradePrompt(
  trigger: 'limit_reached' | 'feature_discovery' | 'manual' | 'scheduled',
  context: {
    feature?: string;
    currentTier: string;
    suggestedTier: string;
    location: string;
  }
) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  manager.track(FORMBRICKS_EVENTS.UPGRADE_PROMPT_SHOWN, {
    trigger,
    feature: context.feature,
    currentTier: context.currentTier,
    suggestedTier: context.suggestedTier,
    location: context.location,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track error recovery patterns
 */
export function trackErrorRecovery(
  errorType: string,
  recoveryAction: 'retry' | 'skip' | 'contact_support' | 'abandon',
  success: boolean,
  additionalContext?: Record<string, any>
) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  manager.track(FORMBRICKS_EVENTS.ERROR_ENCOUNTERED, {
    errorType,
    recoveryAction,
    recoverySuccess: success,
    ...additionalContext,
  });
}

/**
 * Track search and filter usage patterns
 */
export function trackSearchUsage(
  searchContext: 'quotes' | 'items' | 'global_search',
  query: string,
  resultsCount: number,
  filterUsed?: string[]
) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  manager.track(FORMBRICKS_EVENTS.FEATURE_USED, {
    feature: 'search',
    searchContext,
    queryLength: query.length,
    resultsCount,
    filtersUsed: filterUsed?.length || 0,
    hasResults: resultsCount > 0,
  });
}

/**
 * Batch track multiple related events
 */
export function batchTrackEvents(events: Array<{
  eventName: FormbricksEventName | string;
  properties?: Record<string, any>;
}>) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  events.forEach(({ eventName, properties }) => {
    manager.track(eventName, properties);
  });
}

/**
 * Track user onboarding progress
 */
export function trackOnboardingStep(
  step: string,
  stepNumber: number,
  totalSteps: number,
  completed: boolean,
  timeSpent?: number
) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  manager.track(FORMBRICKS_EVENTS.TUTORIAL_STARTED, {
    step,
    stepNumber,
    totalSteps,
    progress: Math.round((stepNumber / totalSteps) * 100),
    timeSpent,
    completed,
  });

  if (completed && stepNumber === totalSteps) {
    manager.track(FORMBRICKS_EVENTS.ONBOARDING_COMPLETED, {
      totalSteps,
      timeSpent,
    });
  }
}