/**
 * Quote Complexity Detection System
 * Comprehensive complexity analysis and adaptive survey triggering for QuoteKit
 */

// Core exports
export { cacheManager,ComplexityCacheManager, getCachedComplexityAnalysis } from './cache';
export { DEFAULT_COMPLEXITY_CONFIG, getComplexityConfig, INDUSTRY_CONFIGS } from './config';
export { detectQuoteComplexity, getQuoteComplexityLevel,QuoteComplexityDetector } from './detector';
export { ComplexityAdaptiveSurveyManager, surveyManager,triggerComplexityBasedSurvey } from './surveys';

// Type exports
export type {
  ComplexityAnalysis,
  ComplexityCache,
  ComplexityConfig,
  ComplexityFactors,
  ComplexityInput,
  ComplexityInsight,
  ComplexityLevel,
  ComplexityPerformanceMetrics,
  ComplexitySurveyContext,
} from './types';

// Main integration class that combines all functionality
import { Quote, QuoteLineItem } from '@/features/quotes/types';

import { cacheManager, getCachedComplexityAnalysis } from './cache';
import { DEFAULT_COMPLEXITY_CONFIG } from './config';
import { QuoteComplexityDetector } from './detector';
import { triggerComplexityBasedSurvey } from './surveys';
import { ComplexityAnalysis, ComplexityConfig, ComplexityInput } from './types';

/**
 * Main complexity system integration class
 */
export class QuoteComplexitySystem {
  private detector: QuoteComplexityDetector;
  private config: ComplexityConfig;

  constructor(config?: Partial<ComplexityConfig>) {
    this.config = config ? { ...DEFAULT_COMPLEXITY_CONFIG, ...config } : DEFAULT_COMPLEXITY_CONFIG;
    this.detector = new QuoteComplexityDetector(this.config);
  }

  /**
   * Analyze quote complexity with caching
   */
  public analyzeQuote(
    quote: Quote,
    lineItems: QuoteLineItem[],
    availableItems?: any[]
  ): ComplexityAnalysis {
    const input: ComplexityInput = {
      quote,
      lineItems,
      availableItems,
      config: this.config,
    };

    // Use cached analysis if available
    const { analysis, fromCache } = getCachedComplexityAnalysis(
      quote.id,
      { quote, lineItems },
      () => this.detector.analyzeComplexity(input)
    );

    // Log performance metrics
    if (!fromCache) {
      const metrics = this.detector.getPerformanceMetrics();
      console.log('Complexity analysis metrics:', metrics);
    }

    return analysis;
  }

  /**
   * Analyze and trigger appropriate survey
   */
  public async analyzeAndSurvey(
    quote: Quote,
    lineItems: QuoteLineItem[],
    userContext: {
      userId: string;
      subscriptionTier?: string;
      quotesCreated?: number;
      timeSpentOnQuote?: number;
      isFirstTimeUser?: boolean;
    },
    availableItems?: any[]
  ): Promise<{ analysis: ComplexityAnalysis; surveyTriggered: boolean }> {
    const analysis = this.analyzeQuote(quote, lineItems, availableItems);
    
    const surveyTriggered = await triggerComplexityBasedSurvey(
      analysis,
      quote,
      userContext
    );

    return { analysis, surveyTriggered };
  }

  /**
   * Get complexity level quickly without full analysis
   */
  public getQuickComplexityLevel(
    quote: Quote,
    lineItems: QuoteLineItem[]
  ): 'simple' | 'medium' | 'complex' {
    // Quick heuristic for immediate classification
    const itemCount = lineItems.length;
    const totalValue = quote.total || 0;

    if (itemCount <= 3 && totalValue <= 500) return 'simple';
    if (itemCount <= 8 && totalValue <= 2500) return 'medium';
    return 'complex';
  }

  /**
   * Invalidate cache for specific quote
   */
  public invalidateQuoteCache(quoteId: string): void {
    cacheManager.invalidateQuote(quoteId);
  }

  /**
   * Get system statistics
   */
  public getSystemStats(): {
    cache: any;
    surveys: any;
    config: any;
  } {
    return {
      cache: cacheManager.getStats(),
      surveys: {}, // Would get from survey manager
      config: {
        version: '1.0.0',
        factorCount: Object.keys(this.config.factors).length,
        thresholds: this.config.thresholds,
      },
    };
  }
}

/**
 * Global complexity system instance
 */
const globalComplexitySystem = new QuoteComplexitySystem();

/**
 * Convenience functions for easy integration
 */

/**
 * Quick complexity analysis
 */
export function analyzeQuoteComplexity(
  quote: Quote,
  lineItems: QuoteLineItem[],
  availableItems?: any[]
): ComplexityAnalysis {
  return globalComplexitySystem.analyzeQuote(quote, lineItems, availableItems);
}

/**
 * Analyze complexity and trigger survey
 */
export async function analyzeQuoteAndTriggerSurvey(
  quote: Quote,
  lineItems: QuoteLineItem[],
  userContext: {
    userId: string;
    subscriptionTier?: string;
    quotesCreated?: number;
    timeSpentOnQuote?: number;
    isFirstTimeUser?: boolean;
  },
  availableItems?: any[]
): Promise<{ analysis: ComplexityAnalysis; surveyTriggered: boolean }> {
  return globalComplexitySystem.analyzeAndSurvey(quote, lineItems, userContext, availableItems);
}

/**
 * Get quick complexity level
 */
export function getQuickComplexityLevel(
  quote: Quote,
  lineItems: QuoteLineItem[]
): 'simple' | 'medium' | 'complex' {
  return globalComplexitySystem.getQuickComplexityLevel(quote, lineItems);
}

/**
 * Export global system for direct access
 */
export { globalComplexitySystem as complexitySystem };