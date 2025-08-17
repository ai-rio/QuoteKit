/**
 * Advanced Quote Complexity Tracking Hook
 * Integrates the new complexity detection system with Formbricks tracking
 */

'use client';

import { useCallback, useEffect } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { useUser } from '@/hooks/use-user';
import { analyzeQuoteAndTriggerSurvey, analyzeQuoteComplexity } from '@/libs/complexity';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';

import { Quote, QuoteLineItem } from '../types';

interface UseAdvancedComplexityTrackingOptions {
  enableAutoSurvey?: boolean;
  trackPerformanceMetrics?: boolean;
  cacheResults?: boolean;
}

export function useAdvancedComplexityTracking(
  options: UseAdvancedComplexityTrackingOptions = {}
) {
  const { data: user } = useUser();
  const { trackEvent, trackQuoteAction, setUserAttributes } = useFormbricksTracking();

  const {
    enableAutoSurvey = true,
    trackPerformanceMetrics = true,
    cacheResults = true,
  } = options;

  /**
   * Track quote creation with advanced complexity analysis
   */
  const trackQuoteCreationWithComplexity = useCallback(async (
    quote: Quote,
    lineItems: QuoteLineItem[],
    availableItems?: any[],
    additionalContext?: {
      timeSpentCreating?: number;
      templatesUsed?: number;
      errorsEncountered?: number;
    }
  ) => {
    const startTime = performance.now();

    try {
      // Build user context
      const userContext = {
        userId: user?.id || 'anonymous',
        subscriptionTier: user?.user_metadata?.subscriptionTier || 'free',
        quotesCreated: user?.user_metadata?.quotesCreated || 0,
        timeSpentOnQuote: additionalContext?.timeSpentCreating,
        isFirstTimeUser: (user?.user_metadata?.quotesCreated || 0) === 1,
      };

      let analysis;
      let surveyTriggered = false;

      if (enableAutoSurvey) {
        // Analyze complexity and potentially trigger survey
        const result = await analyzeQuoteAndTriggerSurvey(
          quote,
          lineItems,
          userContext,
          availableItems
        );
        analysis = result.analysis;
        surveyTriggered = result.surveyTriggered;
      } else {
        // Just analyze complexity
        analysis = analyzeQuoteComplexity(quote, lineItems, availableItems);
      }

      // Update user attributes with complexity insights
      setUserAttributes({
        last_quote_complexity: analysis.level,
        last_quote_score: analysis.score.toFixed(1),
        average_complexity_score: analysis.score, // This could be computed over time
        complexity_confidence: analysis.confidence.toFixed(2),
        uses_advanced_features: analysis.factors.hasMarkup.value || analysis.factors.highTaxRate.value,
      });

      // Track the quote creation with enhanced data
      trackQuoteAction('created', {
        quoteId: quote.id,
        quoteValue: quote.total,
        itemCount: lineItems.length,
        complexity: analysis.level,
        complexityScore: analysis.score,
        confidenceLevel: analysis.confidence,
        topComplexityFactors: analysis.insights
          .filter(insight => insight.impact === 'high')
          .map(insight => insight.factor)
          .slice(0, 3),
        hasCustomItems: analysis.factors.customItems.value > 0,
        uniqueItemTypes: analysis.factors.uniqueItemTypes.value,
        priceVariance: analysis.factors.priceRange.value,
        timeSpentCreating: additionalContext?.timeSpentCreating,
        templatesUsed: additionalContext?.templatesUsed,
        surveyTriggered,
      } as any);

      // Track complexity-specific events
      if (analysis.level === 'complex') {
        trackEvent(FORMBRICKS_EVENTS.COMPLEX_QUOTE_CREATED, {
          quoteId: quote.id,
          complexityScore: analysis.score,
          primaryFactors: analysis.insights
            .filter(insight => insight.impact === 'high')
            .map(insight => insight.factor),
          recommendations: analysis.insights
            .filter(insight => insight.recommendation)
            .map(insight => insight.recommendation),
        });
      }

      // Track high-value quotes
      if (quote.total > 10000) {
        trackEvent(FORMBRICKS_EVENTS.HIGH_VALUE_QUOTE_CREATED, {
          quoteId: quote.id,
          quoteValue: quote.total,
          complexity: analysis.level,
          threshold: 10000,
        });
      }

      // Track performance metrics if enabled
      if (trackPerformanceMetrics) {
        const analysisTime = performance.now() - startTime;
        trackEvent('complexity_analysis_performance', {
          quoteId: quote.id,
          analysisTime,
          complexity: analysis.level,
          cacheUsed: cacheResults,
          factorsAnalyzed: Object.keys(analysis.factors).length,
          insightsGenerated: analysis.insights.length,
        });
      }

      return {
        analysis,
        surveyTriggered,
        processingTime: performance.now() - startTime,
      };

    } catch (error) {
      console.error('Error in complexity tracking:', error);
      
      // Track the error
      trackEvent(FORMBRICKS_EVENTS.ERROR_ENCOUNTERED, {
        errorType: 'complexity_analysis_failed',
        quoteId: quote.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        context: 'quote_creation_tracking',
      });

      // Return basic tracking as fallback
      trackQuoteAction('created', {
        quoteId: quote.id,
        quoteValue: quote.total,
        itemCount: lineItems.length,
        complexity: 'simple', // fallback
      } as any);

      return {
        analysis: null,
        surveyTriggered: false,
        processingTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [user, trackEvent, trackQuoteAction, setUserAttributes, enableAutoSurvey, trackPerformanceMetrics, cacheResults]);

  /**
   * Track quote editing with complexity change detection
   */
  const trackQuoteEditingWithComplexity = useCallback(async (
    originalQuote: Quote,
    updatedQuote: Quote,
    originalLineItems: QuoteLineItem[],
    updatedLineItems: QuoteLineItem[],
    availableItems?: any[]
  ) => {
    const originalAnalysis = analyzeQuoteComplexity(originalQuote, originalLineItems, availableItems);
    const updatedAnalysis = analyzeQuoteComplexity(updatedQuote, updatedLineItems, availableItems);

    // Check if complexity level changed
    const complexityChanged = originalAnalysis.level !== updatedAnalysis.level;
    const significantScoreChange = Math.abs(originalAnalysis.score - updatedAnalysis.score) > 10;

    if (complexityChanged || significantScoreChange) {
      trackEvent('quote_complexity_changed', {
        quoteId: updatedQuote.id,
        originalComplexity: originalAnalysis.level,
        newComplexity: updatedAnalysis.level,
        originalScore: originalAnalysis.score,
        newScore: updatedAnalysis.score,
        scoreChange: updatedAnalysis.score - originalAnalysis.score,
        itemCountChange: updatedLineItems.length - originalLineItems.length,
        valueChange: (updatedQuote.total || 0) - (originalQuote.total || 0),
      });
    }

    return {
      originalAnalysis,
      updatedAnalysis,
      complexityChanged,
      significantScoreChange,
    };
  }, [trackEvent]);

  /**
   * Track quote workflow milestone based on complexity
   */
  const trackComplexityMilestone = useCallback((
    milestone: 'first_complex_quote' | 'power_user_complex' | 'enterprise_level_quotes',
    additionalData?: Record<string, any>
  ) => {
    trackEvent('complexity_milestone_reached', {
      milestone,
      userId: user?.id,
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
  }, [trackEvent, user]);

  /**
   * Get user's complexity statistics
   */
  const getUserComplexityStats = useCallback(() => {
    // This would ideally come from a backend service
    // For now, return placeholder data
    return {
      totalQuotes: user?.user_metadata?.quotesCreated || 0,
      complexityDistribution: {
        simple: 0.6,
        medium: 0.3,
        complex: 0.1,
      },
      averageComplexityScore: 35,
      mostComplexQuoteScore: 85,
      preferredComplexityLevel: 'medium' as const,
    };
  }, [user]);

  return {
    trackQuoteCreationWithComplexity,
    trackQuoteEditingWithComplexity,
    trackComplexityMilestone,
    getUserComplexityStats,
  };
}