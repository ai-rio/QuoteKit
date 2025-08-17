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

/**
 * Quote Creation Workflow Tracking Utilities
 */

/**
 * Quote workflow session manager for tracking complete user journeys
 */
export class QuoteWorkflowTracker {
  private static instances = new Map<string, QuoteWorkflowTracker>();
  private sessionId: string;
  private startTime: number;
  private currentStep: string;
  private stepStartTime: number;
  private steps: Array<{
    step: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    completed: boolean;
    abandoned?: boolean;
    errorOccurred?: boolean;
    metadata?: Record<string, any>;
  }> = [];
  private hasBeenAbandoned = false;
  private exitIntentDetected = false;

  private constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.currentStep = 'workflow_start';
    this.stepStartTime = this.startTime;
    
    // Setup exit intent detection
    this.setupExitIntentDetection();
    
    // Track workflow start
    this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_STARTED, {
      sessionId: this.sessionId,
      startTime: this.startTime,
    });
  }

  public static getInstance(sessionId: string): QuoteWorkflowTracker {
    if (!QuoteWorkflowTracker.instances.has(sessionId)) {
      QuoteWorkflowTracker.instances.set(sessionId, new QuoteWorkflowTracker(sessionId));
    }
    return QuoteWorkflowTracker.instances.get(sessionId)!;
  }

  public static generateSessionId(): string {
    return `qw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupExitIntentDetection(): void {
    if (typeof window === 'undefined') return;

    const handleExitIntent = (e: MouseEvent) => {
      if (e.clientY <= 0 && !this.exitIntentDetected && !this.hasBeenAbandoned) {
        this.exitIntentDetected = true;
        this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_EXIT_INTENT, {
          sessionId: this.sessionId,
          currentStep: this.currentStep,
          timeSpentInWorkflow: Date.now() - this.startTime,
          stepsCompleted: this.steps.filter(s => s.completed).length,
        });
      }
    };

    document.addEventListener('mouseleave', handleExitIntent);
  }

  public startStep(
    step: 'client_selection' | 'item_addition' | 'item_configuration' | 'pricing_setup' | 'preview' | 'finalization',
    metadata?: Record<string, any>
  ): void {
    // Complete previous step if any
    if (this.currentStep !== 'workflow_start') {
      this.completeCurrentStep();
    }

    this.currentStep = step;
    this.stepStartTime = Date.now();

    // Track step start
    const eventMap = {
      client_selection: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_CLIENT_SELECTED,
      item_addition: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_FIRST_ITEM_ADDED,
      item_configuration: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_ITEMS_CONFIGURED,
      pricing_setup: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PRICING_CONFIGURED,
      preview: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PREVIEW_VIEWED,
      finalization: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_FINALIZED,
    };

    if (eventMap[step]) {
      this.trackEvent(eventMap[step], {
        sessionId: this.sessionId,
        step,
        stepStartTime: this.stepStartTime,
        totalWorkflowTime: this.stepStartTime - this.startTime,
        ...metadata,
      });
    }
  }

  public completeCurrentStep(metadata?: Record<string, any>): void {
    if (this.currentStep === 'workflow_start') return;

    const endTime = Date.now();
    const duration = endTime - this.stepStartTime;

    const stepData = {
      step: this.currentStep,
      startTime: this.stepStartTime,
      endTime,
      duration,
      completed: true,
      metadata,
    };

    this.steps.push(stepData);

    // Track step duration
    this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_STEP_DURATION, {
      sessionId: this.sessionId,
      step: this.currentStep,
      duration,
      stepNumber: this.steps.length,
      ...metadata,
    });
  }

  public abandonWorkflow(reason?: string, errorDetails?: any): void {
    if (this.hasBeenAbandoned) return;

    this.hasBeenAbandoned = true;
    const abandonmentTime = Date.now();
    const totalDuration = abandonmentTime - this.startTime;

    // Mark current step as abandoned
    if (this.currentStep !== 'workflow_start') {
      const stepDuration = abandonmentTime - this.stepStartTime;
      this.steps.push({
        step: this.currentStep,
        startTime: this.stepStartTime,
        endTime: abandonmentTime,
        duration: stepDuration,
        completed: false,
        abandoned: true,
        errorOccurred: !!errorDetails,
        metadata: { reason, errorDetails },
      });
    }

    // Track abandonment with specific step
    const abandonmentEventMap = {
      client_selection: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_CLIENT_ABANDONMENT,
      item_addition: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_ITEMS_ABANDONMENT,
      item_configuration: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_ITEMS_ABANDONMENT,
      pricing_setup: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PRICING_ABANDONMENT,
      preview: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PRICING_ABANDONMENT,
      finalization: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PRICING_ABANDONMENT,
    };

    this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_ABANDONED, {
      sessionId: this.sessionId,
      abandonmentPoint: this.currentStep,
      totalDuration,
      stepsCompleted: this.steps.filter(s => s.completed).length,
      reason,
      errorDetails,
    });

    // Track specific abandonment point
    const specificEvent = abandonmentEventMap[this.currentStep as keyof typeof abandonmentEventMap];
    if (specificEvent) {
      this.trackEvent(specificEvent, {
        sessionId: this.sessionId,
        stepDuration: abandonmentTime - this.stepStartTime,
        reason,
        errorDetails,
      });
    }

    // Clean up instance
    QuoteWorkflowTracker.instances.delete(this.sessionId);
  }

  public completeWorkflow(quoteId: string, success: boolean, metadata?: Record<string, any>): void {
    // Complete current step
    this.completeCurrentStep(metadata);

    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    // Track workflow completion
    this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_TOTAL_DURATION, {
      sessionId: this.sessionId,
      totalDuration,
      stepsCompleted: this.steps.filter(s => s.completed).length,
      quoteId,
      success,
      ...metadata,
    });

    if (success) {
      this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_CONVERSION_SUCCESS, {
        sessionId: this.sessionId,
        quoteId,
        totalDuration,
        stepDurations: this.steps.reduce((acc, step) => {
          acc[step.step] = step.duration || 0;
          return acc;
        }, {} as Record<string, number>),
        ...metadata,
      });
    } else {
      this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_CONVERSION_FAILURE, {
        sessionId: this.sessionId,
        totalDuration,
        failurePoint: this.currentStep,
        ...metadata,
      });
    }

    // Clean up instance
    QuoteWorkflowTracker.instances.delete(this.sessionId);
  }

  public trackInteraction(
    interactionType: 'item_search' | 'quantity_change' | 'template_use' | 'autosave' | 'manual_save' | 'error',
    data?: Record<string, any>
  ): void {
    const eventMap = {
      item_search: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_ITEM_SEARCH,
      quantity_change: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_ITEM_QUANTITY_CHANGED,
      template_use: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_TEMPLATE_USED,
      autosave: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_AUTOSAVE_TRIGGERED,
      manual_save: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_MANUAL_SAVE,
      error: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_ERROR_ENCOUNTERED,
    };

    this.trackEvent(eventMap[interactionType], {
      sessionId: this.sessionId,
      currentStep: this.currentStep,
      timeInCurrentStep: Date.now() - this.stepStartTime,
      totalWorkflowTime: Date.now() - this.startTime,
      ...data,
    });
  }

  public trackPDFGeneration(startTime: number, endTime?: number, success?: boolean, error?: string): void {
    if (!endTime) {
      // PDF generation started
      this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PDF_GENERATION_START, {
        sessionId: this.sessionId,
        startTime,
      });
    } else if (success) {
      // PDF generation succeeded
      const duration = endTime - startTime;
      this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PDF_GENERATION_SUCCESS, {
        sessionId: this.sessionId,
        duration,
        endTime,
      });
    } else {
      // PDF generation failed
      const duration = endTime - startTime;
      this.trackEvent(FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PDF_GENERATION_FAILURE, {
        sessionId: this.sessionId,
        duration,
        error,
        endTime,
      });
    }
  }

  public getSessionData() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      currentStep: this.currentStep,
      steps: this.steps,
      totalDuration: Date.now() - this.startTime,
      hasBeenAbandoned: this.hasBeenAbandoned,
    };
  }

  private trackEvent(eventName: string, properties: Record<string, any>): void {
    const manager = FormbricksManager.getInstance();
    if (!manager.isInitialized()) return;

    manager.track(eventName, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }
}

/**
 * Track quote workflow funnel analytics
 */
export function trackQuoteWorkflowFunnel(
  step: 'start' | 'client_selected' | 'items_added' | 'pricing_set' | 'preview_viewed' | 'finalized',
  sessionData: {
    sessionId: string;
    userId: string;
    stepDuration?: number;
    totalDuration?: number;
    metadata?: Record<string, any>;
  }
) {
  const manager = FormbricksManager.getInstance();
  
  if (!manager.isInitialized()) {
    return;
  }

  const funnelStepMap = {
    start: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_STARTED,
    client_selected: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_CLIENT_SELECTED,
    items_added: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_ITEMS_CONFIGURED,
    pricing_set: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PRICING_CONFIGURED,
    preview_viewed: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_PREVIEW_VIEWED,
    finalized: FORMBRICKS_EVENTS.QUOTE_WORKFLOW_FINALIZED,
  };

  manager.track(funnelStepMap[step], {
    funnelStep: step,
    sessionId: sessionData.sessionId,
    userId: sessionData.userId,
    stepDuration: sessionData.stepDuration,
    totalDuration: sessionData.totalDuration,
    timestamp: new Date().toISOString(),
    ...sessionData.metadata,
  });
}

/**
 * Track quote workflow completion rates and analytics
 */
export function analyzeQuoteWorkflowPerformance(sessions: Array<{
  sessionId: string;
  completed: boolean;
  abandoned: boolean;
  duration: number;
  steps: Array<{ step: string; duration: number; completed: boolean }>;
}>): {
  conversionRate: number;
  averageDuration: number;
  stepDropoffRates: Record<string, number>;
  commonAbandonmentPoints: string[];
} {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.completed).length;
  const conversionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  
  const averageDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions;

  // Calculate step dropoff rates
  const stepCounts: Record<string, { entered: number; completed: number }> = {};
  
  sessions.forEach(session => {
    session.steps.forEach(step => {
      if (!stepCounts[step.step]) {
        stepCounts[step.step] = { entered: 0, completed: 0 };
      }
      stepCounts[step.step].entered++;
      if (step.completed) {
        stepCounts[step.step].completed++;
      }
    });
  });

  const stepDropoffRates: Record<string, number> = {};
  Object.entries(stepCounts).forEach(([step, counts]) => {
    stepDropoffRates[step] = counts.entered > 0 ? 
      ((counts.entered - counts.completed) / counts.entered) * 100 : 0;
  });

  // Find common abandonment points
  const abandonmentCounts: Record<string, number> = {};
  sessions.filter(s => s.abandoned).forEach(session => {
    const lastStep = session.steps[session.steps.length - 1]?.step;
    if (lastStep) {
      abandonmentCounts[lastStep] = (abandonmentCounts[lastStep] || 0) + 1;
    }
  });

  const commonAbandonmentPoints = Object.entries(abandonmentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([step]) => step);

  return {
    conversionRate,
    averageDuration,
    stepDropoffRates,
    commonAbandonmentPoints,
  };
}