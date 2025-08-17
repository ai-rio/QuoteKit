/**
 * Strategic Survey Trigger System for QuoteKit
 * 
 * This module handles intelligent survey triggering based on user journey
 * milestones and behavior patterns, ensuring surveys are shown at optimal
 * moments without overwhelming users.
 */

import { FormbricksManager } from './formbricks-manager';
import { FORMBRICKS_EVENTS } from './types';

/**
 * Survey trigger event names that correspond to Formbricks action classes
 */
export const SURVEY_TRIGGER_EVENTS = {
  FIRST_QUOTE_COMPLETED: 'first_quote_completed',
  WEEK_ONE_MILESTONE: 'week_one_milestone',
  QUOTE_ABANDONED_24H: 'quote_abandoned_24h',
  PREMIUM_30_DAY_MILESTONE: 'premium_30_day_milestone',
  MONTHLY_ACTIVE_CHECK: 'monthly_active_check'
} as const;

/**
 * User milestone tracking for survey triggers
 */
interface UserMilestone {
  userId: string;
  milestone: string;
  achievedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Survey trigger conditions and logic
 */
export class SurveyTriggerManager {
  private static instance: SurveyTriggerManager;
  private formbricks: FormbricksManager;
  private milestones: Map<string, UserMilestone[]> = new Map();

  private constructor() {
    this.formbricks = FormbricksManager.getInstance();
  }

  public static getInstance(): SurveyTriggerManager {
    if (!SurveyTriggerManager.instance) {
      SurveyTriggerManager.instance = new SurveyTriggerManager();
    }
    return SurveyTriggerManager.instance;
  }

  /**
   * Track when user completes their first quote
   */
  public async trackFirstQuoteCompletion(quoteData: {
    quoteId: string;
    userId: string;
    totalValue: number;
    itemCount: number;
    timeToComplete: number;
    isFirstQuote: boolean;
  }) {
    if (!quoteData.isFirstQuote) {
      return;
    }

    console.log('🎯 First quote completed - checking survey trigger');

    // Track the milestone
    this.recordMilestone(quoteData.userId, 'first_quote_completed', {
      quoteId: quoteData.quoteId,
      totalValue: quoteData.totalValue,
      itemCount: quoteData.itemCount,
      timeToComplete: quoteData.timeToComplete
    });

    // Set user attributes for survey targeting
    await this.formbricks.setAttributes({
      hasCompletedFirstQuote: true,
      firstQuoteValue: quoteData.totalValue,
      firstQuoteItemCount: quoteData.itemCount,
      firstQuoteCompletionTime: quoteData.timeToComplete,
      firstQuoteDate: new Date().toISOString()
    });

    // Trigger the survey with a small delay to ensure quote completion UI is done
    setTimeout(() => {
      this.formbricks.track(SURVEY_TRIGGER_EVENTS.FIRST_QUOTE_COMPLETED, {
        quoteId: quoteData.quoteId,
        quoteValue: quoteData.totalValue,
        itemCount: quoteData.itemCount,
        completionTime: quoteData.timeToComplete,
        triggerReason: 'first_quote_milestone',
        timestamp: new Date().toISOString()
      });
    }, 3000); // 3 second delay
  }

  /**
   * Check and trigger week one milestone survey
   */
  public async checkWeekOneMilestone(userData: {
    userId: string;
    signupDate: Date;
    quotesCreated: number;
    lastActiveDate: Date;
  }) {
    const daysSinceSignup = Math.floor(
      (Date.now() - userData.signupDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Trigger conditions: 7+ days since signup, 2+ quotes created, active in last 3 days
    const daysSinceActive = Math.floor(
      (Date.now() - userData.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSignup >= 7 && userData.quotesCreated >= 2 && daysSinceActive <= 3) {
      // Check if we've already triggered this milestone
      if (this.hasMilestone(userData.userId, 'week_one_milestone')) {
        return;
      }

      console.log('🎯 Week one milestone reached - triggering feature discovery survey');

      this.recordMilestone(userData.userId, 'week_one_milestone', {
        daysSinceSignup,
        quotesCreated: userData.quotesCreated,
        daysSinceActive
      });

      await this.formbricks.setAttributes({
        weekOneMilestoneReached: true,
        quotesAtWeekOne: userData.quotesCreated,
        daysSinceSignup
      });

      this.formbricks.track(SURVEY_TRIGGER_EVENTS.WEEK_ONE_MILESTONE, {
        daysSinceSignup,
        quotesCreated: userData.quotesCreated,
        daysSinceActive,
        triggerReason: 'week_one_engagement',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Track quote abandonment and trigger recovery survey
   */
  public async trackQuoteAbandonment(abandonmentData: {
    quoteId: string;
    userId: string;
    startedAt: Date;
    lastModifiedAt: Date;
    currentStep: string;
    itemsAdded: number;
    estimatedValue: number;
  }) {
    const hoursAbandoned = Math.floor(
      (Date.now() - abandonmentData.lastModifiedAt.getTime()) / (1000 * 60 * 60)
    );

    // Trigger after 24 hours of abandonment
    if (hoursAbandoned >= 24) {
      // Check if we've already triggered for this quote
      const milestoneKey = `quote_abandoned_${abandonmentData.quoteId}`;
      if (this.hasMilestone(abandonmentData.userId, milestoneKey)) {
        return;
      }

      console.log('🎯 Quote abandoned for 24+ hours - triggering recovery survey');

      this.recordMilestone(abandonmentData.userId, milestoneKey, {
        quoteId: abandonmentData.quoteId,
        hoursAbandoned,
        currentStep: abandonmentData.currentStep,
        itemsAdded: abandonmentData.itemsAdded,
        estimatedValue: abandonmentData.estimatedValue
      });

      await this.formbricks.setAttributes({
        hasAbandonedQuote: true,
        lastAbandonedQuoteStep: abandonmentData.currentStep,
        abandonedQuoteValue: abandonmentData.estimatedValue
      });

      this.formbricks.track(SURVEY_TRIGGER_EVENTS.QUOTE_ABANDONED_24H, {
        quoteId: abandonmentData.quoteId,
        hoursAbandoned,
        abandonedAtStep: abandonmentData.currentStep,
        itemsAdded: abandonmentData.itemsAdded,
        estimatedValue: abandonmentData.estimatedValue,
        triggerReason: 'quote_abandonment_recovery',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Track premium subscription milestone
   */
  public async trackPremiumMilestone(subscriptionData: {
    userId: string;
    subscriptionId: string;
    upgradeDate: Date;
    planType: string;
    monthlyValue: number;
  }) {
    const daysSinceUpgrade = Math.floor(
      (Date.now() - subscriptionData.upgradeDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Trigger after 30 days of premium subscription
    if (daysSinceUpgrade >= 30) {
      const milestoneKey = `premium_30_day_${subscriptionData.subscriptionId}`;
      if (this.hasMilestone(subscriptionData.userId, milestoneKey)) {
        return;
      }

      console.log('🎯 Premium 30-day milestone reached - triggering value assessment survey');

      this.recordMilestone(subscriptionData.userId, milestoneKey, {
        subscriptionId: subscriptionData.subscriptionId,
        daysSinceUpgrade,
        planType: subscriptionData.planType,
        monthlyValue: subscriptionData.monthlyValue
      });

      await this.formbricks.setAttributes({
        premiumMilestone30Days: true,
        premiumPlanType: subscriptionData.planType,
        premiumMonthlyValue: subscriptionData.monthlyValue,
        daysSincePremiumUpgrade: daysSinceUpgrade
      });

      this.formbricks.track(SURVEY_TRIGGER_EVENTS.PREMIUM_30_DAY_MILESTONE, {
        subscriptionId: subscriptionData.subscriptionId,
        daysSinceUpgrade,
        planType: subscriptionData.planType,
        monthlyValue: subscriptionData.monthlyValue,
        triggerReason: 'premium_value_assessment',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check monthly satisfaction survey eligibility
   */
  public async checkMonthlySatisfactionEligibility(userData: {
    userId: string;
    lastSurveyDate?: Date;
    quotesThisMonth: number;
    lastActiveDate: Date;
    subscriptionType: 'free' | 'premium';
  }) {
    // Check if user is eligible for monthly survey
    const daysSinceLastSurvey = userData.lastSurveyDate 
      ? Math.floor((Date.now() - userData.lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999; // If no previous survey, treat as eligible

    const daysSinceActive = Math.floor(
      (Date.now() - userData.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Trigger conditions: 30+ days since last survey, 1+ quote this month, active in last 7 days
    if (daysSinceLastSurvey >= 30 && userData.quotesThisMonth >= 1 && daysSinceActive <= 7) {
      console.log('🎯 Monthly satisfaction survey eligible - triggering pulse survey');

      const milestoneKey = `monthly_satisfaction_${new Date().getMonth()}_${new Date().getFullYear()}`;
      if (this.hasMilestone(userData.userId, milestoneKey)) {
        return;
      }

      this.recordMilestone(userData.userId, milestoneKey, {
        quotesThisMonth: userData.quotesThisMonth,
        subscriptionType: userData.subscriptionType,
        daysSinceLastSurvey
      });

      await this.formbricks.setAttributes({
        monthlyQuotesCount: userData.quotesThisMonth,
        subscriptionType: userData.subscriptionType,
        daysSinceLastSatisfactionSurvey: daysSinceLastSurvey
      });

      this.formbricks.track(SURVEY_TRIGGER_EVENTS.MONTHLY_ACTIVE_CHECK, {
        quotesThisMonth: userData.quotesThisMonth,
        subscriptionType: userData.subscriptionType,
        daysSinceLastSurvey,
        daysSinceActive,
        triggerReason: 'monthly_satisfaction_pulse',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Helper method to record user milestones
   */
  private recordMilestone(userId: string, milestone: string, metadata?: Record<string, any>) {
    if (!this.milestones.has(userId)) {
      this.milestones.set(userId, []);
    }

    const userMilestones = this.milestones.get(userId)!;
    userMilestones.push({
      userId,
      milestone,
      achievedAt: new Date(),
      metadata
    });

    console.log(`📊 Milestone recorded: ${milestone} for user ${userId}`);
  }

  /**
   * Check if user has achieved a specific milestone
   */
  private hasMilestone(userId: string, milestone: string): boolean {
    const userMilestones = this.milestones.get(userId) || [];
    return userMilestones.some(m => m.milestone === milestone);
  }

  /**
   * Get user's milestone history
   */
  public getUserMilestones(userId: string): UserMilestone[] {
    return this.milestones.get(userId) || [];
  }

  /**
   * Clear milestone history (useful for testing)
   */
  public clearMilestones(userId?: string) {
    if (userId) {
      this.milestones.delete(userId);
    } else {
      this.milestones.clear();
    }
  }
}

/**
 * Convenience functions for easy integration
 */

/**
 * Track first quote completion with survey trigger
 */
export async function trackFirstQuoteCompletion(quoteData: {
  quoteId: string;
  userId: string;
  totalValue: number;
  itemCount: number;
  timeToComplete: number;
  isFirstQuote: boolean;
}) {
  const triggerManager = SurveyTriggerManager.getInstance();
  await triggerManager.trackFirstQuoteCompletion(quoteData);
}

/**
 * Check week one milestone for feature discovery survey
 */
export async function checkWeekOneMilestone(userData: {
  userId: string;
  signupDate: Date;
  quotesCreated: number;
  lastActiveDate: Date;
}) {
  const triggerManager = SurveyTriggerManager.getInstance();
  await triggerManager.checkWeekOneMilestone(userData);
}

/**
 * Track quote abandonment for recovery survey
 */
export async function trackQuoteAbandonment(abandonmentData: {
  quoteId: string;
  userId: string;
  startedAt: Date;
  lastModifiedAt: Date;
  currentStep: string;
  itemsAdded: number;
  estimatedValue: number;
}) {
  const triggerManager = SurveyTriggerManager.getInstance();
  await triggerManager.trackQuoteAbandonment(abandonmentData);
}

/**
 * Track premium subscription milestone
 */
export async function trackPremiumMilestone(subscriptionData: {
  userId: string;
  subscriptionId: string;
  upgradeDate: Date;
  planType: string;
  monthlyValue: number;
}) {
  const triggerManager = SurveyTriggerManager.getInstance();
  await triggerManager.trackPremiumMilestone(subscriptionData);
}

/**
 * Check monthly satisfaction survey eligibility
 */
export async function checkMonthlySatisfactionEligibility(userData: {
  userId: string;
  lastSurveyDate?: Date;
  quotesThisMonth: number;
  lastActiveDate: Date;
  subscriptionType: 'free' | 'premium';
}) {
  const triggerManager = SurveyTriggerManager.getInstance();
  await triggerManager.checkMonthlySatisfactionEligibility(userData);
}

/**
 * Survey frequency management to prevent overwhelming users
 */
export class SurveyFrequencyManager {
  private static readonly MAX_SURVEYS_PER_WEEK = 1;
  private static readonly MIN_TIME_BETWEEN_SURVEYS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly MAX_SURVEYS_PER_MONTH = 3;

  private static surveyHistory: Map<string, Date[]> = new Map();

  /**
   * Check if user can receive a survey based on frequency rules
   */
  public static canShowSurvey(userId: string): boolean {
    const userHistory = this.surveyHistory.get(userId) || [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count surveys in the last week
    const surveysThisWeek = userHistory.filter(date => date > oneWeekAgo).length;
    if (surveysThisWeek >= this.MAX_SURVEYS_PER_WEEK) {
      console.log(`🚫 Survey frequency limit: User ${userId} has reached weekly limit`);
      return false;
    }

    // Count surveys in the last month
    const surveysThisMonth = userHistory.filter(date => date > oneMonthAgo).length;
    if (surveysThisMonth >= this.MAX_SURVEYS_PER_MONTH) {
      console.log(`🚫 Survey frequency limit: User ${userId} has reached monthly limit`);
      return false;
    }

    // Check minimum time between surveys
    const lastSurvey = userHistory[userHistory.length - 1];
    if (lastSurvey && (now.getTime() - lastSurvey.getTime()) < this.MIN_TIME_BETWEEN_SURVEYS) {
      console.log(`🚫 Survey frequency limit: User ${userId} needs more time between surveys`);
      return false;
    }

    return true;
  }

  /**
   * Record that a survey was shown to a user
   */
  public static recordSurveyShown(userId: string) {
    if (!this.surveyHistory.has(userId)) {
      this.surveyHistory.set(userId, []);
    }
    
    const userHistory = this.surveyHistory.get(userId)!;
    userHistory.push(new Date());
    
    // Keep only last 10 survey records per user
    if (userHistory.length > 10) {
      userHistory.splice(0, userHistory.length - 10);
    }

    console.log(`📊 Survey shown recorded for user ${userId}`);
  }

  /**
   * Clear survey history (useful for testing)
   */
  public static clearHistory(userId?: string) {
    if (userId) {
      this.surveyHistory.delete(userId);
    } else {
      this.surveyHistory.clear();
    }
  }
}

/**
 * Enhanced survey trigger with frequency management
 */
export async function triggerSurveyWithFrequencyCheck(
  userId: string,
  triggerFunction: () => void,
  surveyType: string
) {
  if (!SurveyFrequencyManager.canShowSurvey(userId)) {
    console.log(`🚫 Survey ${surveyType} blocked by frequency management for user ${userId}`);
    return false;
  }

  console.log(`✅ Survey ${surveyType} approved for user ${userId}`);
  triggerFunction();
  SurveyFrequencyManager.recordSurveyShown(userId);
  return true;
}
