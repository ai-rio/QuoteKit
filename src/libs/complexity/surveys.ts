/**
 * Adaptive Survey Logic for Quote Complexity
 * Integrates complexity detection with Formbricks survey system
 */

import { Quote } from '@/features/quotes/types';
import { FormbricksManager } from '@/libs/formbricks';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';

import { ComplexityAnalysis, ComplexitySurveyContext } from './types';

/**
 * Survey configuration for different complexity levels
 */
export interface ComplexitySurveyConfig {
  simple: {
    surveys: Array<{
      id: string;
      name: string;
      priority: number;
      triggerConditions: string[];
      delay?: number;
    }>;
  };
  medium: {
    surveys: Array<{
      id: string;
      name: string;
      priority: number;
      triggerConditions: string[];
      delay?: number;
    }>;
  };
  complex: {
    surveys: Array<{
      id: string;
      name: string;
      priority: number;
      triggerConditions: string[];
      delay?: number;
    }>;
  };
}

/**
 * Default survey configuration based on complexity
 */
export const DEFAULT_COMPLEXITY_SURVEY_CONFIG: ComplexitySurveyConfig = {
  simple: {
    surveys: [
      {
        id: 'simple_quote_satisfaction',
        name: 'Simple Quote Feedback',
        priority: 1,
        triggerConditions: ['quote_created', 'first_simple_quote'],
        delay: 5, // 5 seconds delay
      },
      {
        id: 'simple_user_onboarding',
        name: 'New User Experience',
        priority: 2,
        triggerConditions: ['first_quote_ever', 'new_user'],
        delay: 10,
      },
    ],
  },
  medium: {
    surveys: [
      {
        id: 'medium_quote_workflow',
        name: 'Medium Quote Workflow',
        priority: 1,
        triggerConditions: ['quote_created', 'medium_complexity_reached'],
        delay: 8,
      },
      {
        id: 'feature_discovery_medium',
        name: 'Feature Discovery for Growing Users',
        priority: 2,
        triggerConditions: ['multiple_medium_quotes', 'power_user_potential'],
        delay: 15,
      },
    ],
  },
  complex: {
    surveys: [
      {
        id: 'complex_quote_experience',
        name: 'Complex Quote Experience',
        priority: 1,
        triggerConditions: ['quote_created', 'complex_quote_created'],
        delay: 12,
      },
      {
        id: 'advanced_features_feedback',
        name: 'Advanced Features Feedback',
        priority: 2,
        triggerConditions: ['power_user', 'multiple_complex_quotes'],
        delay: 20,
      },
      {
        id: 'enterprise_needs_assessment',
        name: 'Enterprise Needs Assessment',
        priority: 3,
        triggerConditions: ['high_value_complex_quotes', 'enterprise_potential'],
        delay: 30,
      },
    ],
  },
};

/**
 * Adaptive survey manager
 */
export class ComplexityAdaptiveSurveyManager {
  private config: ComplexitySurveyConfig;
  private formbricks: FormbricksManager;
  private userSurveyHistory = new Map<string, Set<string>>(); // userId -> set of survey IDs shown

  constructor(config?: Partial<ComplexitySurveyConfig>) {
    this.config = config ? this.mergeConfigs(DEFAULT_COMPLEXITY_SURVEY_CONFIG, config) : DEFAULT_COMPLEXITY_SURVEY_CONFIG;
    this.formbricks = FormbricksManager.getInstance();
  }

  /**
   * Determine appropriate survey based on complexity and context
   */
  public determineSurvey(
    complexity: ComplexityAnalysis,
    quote: Quote,
    userContext: {
      userId: string;
      subscriptionTier?: string;
      quotesCreated?: number;
      timeSpentOnQuote?: number;
      isFirstTimeUser?: boolean;
      recentQuoteComplexities?: string[];
    }
  ): ComplexitySurveyContext | null {
    const { level } = complexity;
    const surveys = this.config[level].surveys;

    // Get user's survey history
    const userHistory = this.userSurveyHistory.get(userContext.userId) || new Set();

    // Determine trigger conditions
    const triggerConditions = this.evaluateTriggerConditions(complexity, quote, userContext);

    // Find best matching survey
    const candidateSurveys = surveys.filter(survey => {
      // Check if user hasn't seen this survey recently
      if (userHistory.has(survey.id)) return false;

      // Check if trigger conditions match
      return survey.triggerConditions.some(condition => 
        triggerConditions.includes(condition)
      );
    });

    if (candidateSurveys.length === 0) return null;

    // Select highest priority survey
    const selectedSurvey = candidateSurveys.sort((a, b) => a.priority - b.priority)[0];

    return {
      complexity,
      quote,
      userContext,
      triggerConditions,
      recommendedSurvey: {
        surveyId: selectedSurvey.id,
        priority: this.determineSurveyPriority(complexity, userContext),
        delay: selectedSurvey.delay,
      },
    };
  }

  /**
   * Trigger survey based on context
   */
  public async triggerSurvey(context: ComplexitySurveyContext): Promise<boolean> {
    if (!this.formbricks.isInitialized()) {
      console.warn('Formbricks not initialized, cannot trigger survey');
      return false;
    }

    const { recommendedSurvey, userContext, complexity, quote } = context;

    // Record that we're showing this survey to this user
    const userHistory = this.userSurveyHistory.get(userContext.userId) || new Set();
    userHistory.add(recommendedSurvey.surveyId);
    this.userSurveyHistory.set(userContext.userId, userHistory);

    // Set user attributes for survey context
    this.formbricks.setAttributes({
      quote_complexity: complexity.level,
      quote_score: complexity.score.toFixed(1),
      quote_value: quote.total,
      quote_item_count: quote.quote_data?.length || 0,
      user_tier: userContext.subscriptionTier || 'free',
      quotes_created: userContext.quotesCreated || 0,
      time_spent_on_quote: userContext.timeSpentOnQuote || 0,
      is_first_time_user: userContext.isFirstTimeUser || false,
    });

    // Track survey trigger event
    this.formbricks.track(FORMBRICKS_EVENTS.DASHBOARD_SATISFACTION_SURVEY_TRIGGERED, {
      survey_id: recommendedSurvey.surveyId,
      complexity_level: complexity.level,
      complexity_score: complexity.score,
      quote_id: quote.id,
      quote_value: quote.total,
      trigger_conditions: context.triggerConditions.join(','),
      delay: recommendedSurvey.delay || 0,
    });

    // Trigger the survey with delay if specified
    if (recommendedSurvey.delay && recommendedSurvey.delay > 0) {
      setTimeout(() => {
        this.showSurvey(recommendedSurvey.surveyId, context);
      }, recommendedSurvey.delay * 1000);
    } else {
      this.showSurvey(recommendedSurvey.surveyId, context);
    }

    return true;
  }

  /**
   * Show survey (this would be implemented based on your Formbricks setup)
   */
  private showSurvey(surveyId: string, context: ComplexitySurveyContext): void {
    // This would trigger the specific survey in Formbricks
    // The implementation depends on how you've set up your surveys
    
    console.log(`Showing survey ${surveyId} for ${context.complexity.level} complexity quote`);
    
    // For now, we'll track the survey shown event
    this.formbricks.track('survey_shown', {
      survey_id: surveyId,
      complexity_level: context.complexity.level,
      quote_id: context.quote.id,
    });
  }

  /**
   * Evaluate trigger conditions based on quote and user context
   */
  private evaluateTriggerConditions(
    complexity: ComplexityAnalysis,
    quote: Quote,
    userContext: any
  ): string[] {
    const conditions: string[] = [];

    // Basic conditions
    conditions.push('quote_created');
    
    // Complexity-based conditions
    conditions.push(`${complexity.level}_quote_created`);
    
    if (complexity.level === 'complex') {
      conditions.push('complex_quote_created');
    }

    // User experience conditions
    if (userContext.isFirstTimeUser) {
      conditions.push('new_user', 'first_quote_ever');
    }

    if (userContext.quotesCreated === 1) {
      conditions.push(`first_${complexity.level}_quote`);
    }

    // Power user conditions
    if (userContext.quotesCreated >= 10) {
      conditions.push('power_user');
    }

    if (userContext.quotesCreated >= 5 && complexity.level === 'complex') {
      conditions.push('multiple_complex_quotes');
    }

    // Value-based conditions
    if (quote.total > 10000) {
      conditions.push('high_value_quote');
      
      if (complexity.level === 'complex') {
        conditions.push('high_value_complex_quotes');
      }
    }

    // Enterprise potential
    if (quote.total > 25000 || (userContext.quotesCreated >= 20 && complexity.level === 'complex')) {
      conditions.push('enterprise_potential');
    }

    // Milestone conditions
    if (userContext.quotesCreated % 5 === 0 && userContext.quotesCreated > 0) {
      conditions.push('milestone_reached');
    }

    return conditions;
  }

  /**
   * Determine survey priority based on context
   */
  private determineSurveyPriority(
    complexity: ComplexityAnalysis,
    userContext: any
  ): 'low' | 'medium' | 'high' {
    // High priority for complex quotes or new users
    if (complexity.level === 'complex' || userContext.isFirstTimeUser) {
      return 'high';
    }

    // Medium priority for medium complexity or power users
    if (complexity.level === 'medium' || userContext.quotesCreated >= 10) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Merge partial config with default config
   */
  private mergeConfigs(
    defaultConfig: ComplexitySurveyConfig,
    partialConfig: Partial<ComplexitySurveyConfig>
  ): ComplexitySurveyConfig {
    return {
      simple: { ...defaultConfig.simple, ...partialConfig.simple },
      medium: { ...defaultConfig.medium, ...partialConfig.medium },
      complex: { ...defaultConfig.complex, ...partialConfig.complex },
    };
  }

  /**
   * Reset user survey history (for testing or privacy)
   */
  public resetUserHistory(userId: string): void {
    this.userSurveyHistory.delete(userId);
  }

  /**
   * Get survey statistics
   */
  public getStats(): {
    totalSurveysConfigured: number;
    userHistoryCount: number;
    averageSurveysPerUser: number;
  } {
    const totalSurveys = this.config.simple.surveys.length + 
                        this.config.medium.surveys.length + 
                        this.config.complex.surveys.length;

    const userCount = this.userSurveyHistory.size;
    const totalShown = Array.from(this.userSurveyHistory.values())
      .reduce((sum, set) => sum + set.size, 0);

    return {
      totalSurveysConfigured: totalSurveys,
      userHistoryCount: userCount,
      averageSurveysPerUser: userCount > 0 ? totalShown / userCount : 0,
    };
  }
}

/**
 * Global survey manager instance
 */
const globalSurveyManager = new ComplexityAdaptiveSurveyManager();

/**
 * Convenience function to trigger complexity-based survey
 */
export async function triggerComplexityBasedSurvey(
  complexity: ComplexityAnalysis,
  quote: Quote,
  userContext: any
): Promise<boolean> {
  const surveyContext = globalSurveyManager.determineSurvey(complexity, quote, userContext);
  
  if (!surveyContext) {
    return false;
  }

  return await globalSurveyManager.triggerSurvey(surveyContext);
}

/**
 * Export global manager for direct access
 */
export { globalSurveyManager as surveyManager };