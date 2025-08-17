/**
 * FB-018: Survey Targeting Engine
 * Implements segment-based survey targeting logic
 */

import { SEGMENT_SURVEY_CONFIGS } from '@/components/feedback/segment-survey-configs';
import { SegmentSurveyConfig, SurveyContext, UserActivity,UserSegment } from '@/components/feedback/types';

export interface SurveyTarget {
  surveyId: string;
  segment: UserSegment;
  priority: number;
  eligibilityScore: number;
  reason: string;
}

export interface TargetingResult {
  shouldShow: boolean;
  selectedSurvey?: SurveyTarget;
  reason: string;
  alternativeSurveys?: SurveyTarget[];
}

export class TargetingEngine {
  /**
   * Determine which surveys to show for a specific user segment
   */
  static getSurveyTargetsForUser(
    userSegment: UserSegment,
    context: SurveyContext,
    userActivity: UserActivity
  ): SurveyTarget[] {
    const segmentConfigs = SEGMENT_SURVEY_CONFIGS[userSegment] || [];
    const targets: SurveyTarget[] = [];

    for (const config of segmentConfigs) {
      const eligibilityScore = this.calculateEligibilityScore(config, context, userActivity);
      
      if (eligibilityScore > 0) {
        // Add all survey IDs from this config as potential targets
        config.surveyIds.forEach(surveyId => {
          targets.push({
            surveyId,
            segment: userSegment,
            priority: config.priority,
            eligibilityScore,
            reason: this.generateTargetingReason(config, context, userActivity)
          });
        });
      }
    }

    // Sort by eligibility score and priority
    return targets.sort((a, b) => {
      if (a.eligibilityScore !== b.eligibilityScore) {
        return b.eligibilityScore - a.eligibilityScore;
      }
      return b.priority - a.priority;
    });
  }

  /**
   * Determine if a specific survey should be shown to a user
   */
  static shouldShowSurvey(
    surveyId: string,
    userSegment: UserSegment,
    context: SurveyContext,
    userActivity: UserActivity
  ): TargetingResult {
    const targets = this.getSurveyTargetsForUser(userSegment, context, userActivity);
    const surveyTarget = targets.find(t => t.surveyId === surveyId);

    if (!surveyTarget) {
      return {
        shouldShow: false,
        reason: `Survey ${surveyId} not targeted for segment ${userSegment}`,
        alternativeSurveys: targets.slice(0, 3) // Top 3 alternatives
      };
    }

    // Check frequency limits
    const frequencyCheck = this.checkFrequencyLimits(surveyId, userSegment);
    if (!frequencyCheck.allowed) {
      return {
        shouldShow: false,
        reason: frequencyCheck.reason,
        alternativeSurveys: targets.filter(t => t.surveyId !== surveyId).slice(0, 3)
      };
    }

    return {
      shouldShow: true,
      selectedSurvey: surveyTarget,
      reason: `Survey targeted for ${userSegment}: ${surveyTarget.reason}`
    };
  }

  /**
   * Calculate eligibility score for a survey configuration
   */
  private static calculateEligibilityScore(
    config: SegmentSurveyConfig,
    context: SurveyContext,
    userActivity: UserActivity
  ): number {
    let score = 0;

    // Base score from priority
    score += config.priority * 0.3;

    // Evaluate trigger conditions
    const conditionsMet = config.triggerConditions.every(condition => {
      switch (condition.type) {
        case 'page_context':
          return condition.value === 'any' || context.currentPage.includes(String(condition.value));
        case 'user_activity':
          if (condition.operator === 'gte') {
            return userActivity.quotesCreated >= Number(condition.value);
          } else if (condition.operator === 'lt') {
            return userActivity.quotesCreated < Number(condition.value);
          }
          return true;
        case 'time_based':
          return context.timeOnPage! >= Number(condition.value);
        default:
          return true;
      }
    });

    if (!conditionsMet) return 0;

    // Bonus for context relevance
    if (context.currentPage.includes('dashboard')) score += 0.2;
    if (context.currentPage.includes('quotes')) score += 0.3;
    if (context.currentPage.includes('pricing')) score += 0.4;
    if (context.currentPage.includes('upgrade')) score += 0.5;

    // Bonus for user activity level
    if (userActivity.quotesCreated > 10) score += 0.2;
    if (userActivity.averageQuoteValue > 10000) score += 0.3;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Generate human-readable targeting reason
   */
  private static generateTargetingReason(
    config: SegmentSurveyConfig,
    context: SurveyContext,
    userActivity: UserActivity
  ): string {
    const reasons: string[] = [];

    if (context.currentPage.includes('pricing')) {
      reasons.push('user on pricing page');
    }
    if (context.timeOnPage && context.timeOnPage > 30000) {
      reasons.push('extended engagement');
    }
    if (userActivity.quotesCreated > 10) {
      reasons.push('experienced user');
    }
    if (userActivity.averageQuoteValue > 10000) {
      reasons.push('high-value customer');
    }

    return reasons.join(', ') || 'general targeting criteria met';
  }

  /**
   * Check frequency limits for survey display
   */
  private static checkFrequencyLimits(
    surveyId: string,
    userSegment: UserSegment
  ): { allowed: boolean; reason: string } {
    const key = `survey_frequency_${surveyId}_${userSegment}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return { allowed: true, reason: 'No previous displays' };
    }

    try {
      const data = JSON.parse(stored);
      const now = Date.now();
      const lastShown = new Date(data.lastShown).getTime();
      
      // Check 24-hour cooldown
      const hoursSinceLastShown = (now - lastShown) / (1000 * 60 * 60);
      if (hoursSinceLastShown < 24) {
        return { 
          allowed: false, 
          reason: `Cooldown active: ${Math.ceil(24 - hoursSinceLastShown)} hours remaining` 
        };
      }

      // Check daily limits (max 2 per day for most surveys)
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayDisplays = (data.showHistory || []).filter(
        (timestamp: number) => timestamp >= todayStart
      ).length;

      if (todayDisplays >= 2) {
        return { 
          allowed: false, 
          reason: 'Daily limit reached (2/day max)' 
        };
      }

      return { allowed: true, reason: 'Frequency limits satisfied' };
    } catch (error) {
      console.error('[TargetingEngine] Error checking frequency limits:', error);
      return { allowed: true, reason: 'Error checking limits, allowing display' };
    }
  }

  /**
   * Track survey display for frequency limiting
   */
  static trackSurveyDisplay(surveyId: string, userSegment: UserSegment): void {
    const key = `survey_frequency_${surveyId}_${userSegment}`;
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(key);
      const data = stored ? JSON.parse(stored) : { showHistory: [], lastShown: 0 };
      
      data.showHistory.push(now);
      data.lastShown = now;
      
      // Keep only last 30 days
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      data.showHistory = data.showHistory.filter(
        (timestamp: number) => timestamp >= thirtyDaysAgo
      );
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('[TargetingEngine] Error tracking survey display:', error);
    }
  }
}