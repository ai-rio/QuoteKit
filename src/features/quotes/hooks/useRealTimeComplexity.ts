/**
 * Real-time Quote Complexity Analysis Hook
 * Provides live complexity analysis during quote creation and editing
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { analyzeQuoteComplexity, getQuickComplexityLevel } from '@/libs/complexity';
import { ComplexityAnalysis } from '@/libs/complexity/types';

import { Quote, QuoteLineItem } from '../types';

interface UseRealTimeComplexityOptions {
  /**
   * Debounce delay in milliseconds to avoid excessive calculations
   */
  debounceMs?: number;
  
  /**
   * Whether to use quick analysis for real-time updates
   */
  useQuickAnalysis?: boolean;
  
  /**
   * Whether to cache results for performance
   */
  enableCaching?: boolean;
  
  /**
   * Callback when complexity level changes
   */
  onComplexityChange?: (analysis: ComplexityAnalysis) => void;
}

interface ComplexityState {
  analysis: ComplexityAnalysis | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  quickLevel: 'simple' | 'medium' | 'complex' | null;
}

export function useRealTimeComplexity(
  quote: Quote | null,
  lineItems: QuoteLineItem[],
  availableItems?: any[],
  options: UseRealTimeComplexityOptions = {}
) {
  const {
    debounceMs = 500,
    useQuickAnalysis = false,
    enableCaching = true,
    onComplexityChange,
  } = options;

  const [state, setState] = useState<ComplexityState>({
    analysis: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    quickLevel: null,
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Perform complexity analysis
   */
  const performAnalysis = useCallback(async (
    currentQuote: Quote,
    currentLineItems: QuoteLineItem[]
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      let analysis: ComplexityAnalysis;
      let quickLevel: 'simple' | 'medium' | 'complex';

      if (useQuickAnalysis) {
        // Use quick analysis for real-time performance
        quickLevel = getQuickComplexityLevel(currentQuote, currentLineItems);
        
        // Create minimal analysis for quick mode
        analysis = {
          level: quickLevel,
          score: quickLevel === 'simple' ? 20 : quickLevel === 'medium' ? 50 : 80,
          factors: {} as any, // Simplified for quick mode
          insights: [],
          confidence: 0.8,
          reasoning: [`Quick analysis: ${quickLevel} complexity based on item count and value`],
        };
      } else {
        // Use full analysis
        analysis = analyzeQuoteComplexity(currentQuote, currentLineItems, availableItems);
        quickLevel = analysis.level;
      }

      setState(prev => ({
        ...prev,
        analysis,
        quickLevel,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      // Call onChange callback if complexity level changed
      if (onComplexityChange && state.analysis?.level !== analysis.level) {
        onComplexityChange(analysis);
      }

    } catch (error) {
      console.error('Complexity analysis error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      }));
    }
  }, [useQuickAnalysis, availableItems, onComplexityChange, state.analysis?.level]);

  /**
   * Debounced analysis trigger
   */
  const triggerAnalysis = useCallback((
    currentQuote: Quote,
    currentLineItems: QuoteLineItem[]
  ) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      performAnalysis(currentQuote, currentLineItems);
    }, debounceMs);

    setDebounceTimer(timer);
  }, [debounceMs, performAnalysis, debounceTimer]);

  /**
   * Force immediate analysis (bypasses debouncing)
   */
  const forceAnalysis = useCallback(() => {
    if (!quote) return;

    // Clear any pending debounced analysis
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    performAnalysis(quote, lineItems);
  }, [quote, lineItems, performAnalysis, debounceTimer]);

  /**
   * Get quick complexity level without full analysis
   */
  const getQuickLevel = useCallback((): 'simple' | 'medium' | 'complex' | null => {
    if (!quote) return null;
    return getQuickComplexityLevel(quote, lineItems);
  }, [quote, lineItems]);

  /**
   * Check if quote data has changed significantly
   */
  const hasSignificantChange = useCallback((
    newQuote: Quote,
    newLineItems: QuoteLineItem[]
  ): boolean => {
    if (!quote || !state.analysis) return true;

    // Check if key factors have changed
    const itemCountChanged = newLineItems.length !== lineItems.length;
    const valueChanged = Math.abs((newQuote.total || 0) - (quote.total || 0)) > 100;
    const taxChanged = newQuote.tax_rate !== quote.tax_rate;
    const markupChanged = newQuote.markup_rate !== quote.markup_rate;

    return itemCountChanged || valueChanged || taxChanged || markupChanged;
  }, [quote, lineItems, state.analysis]);

  /**
   * Effect to trigger analysis when inputs change
   */
  useEffect(() => {
    if (!quote || lineItems.length === 0) {
      setState({
        analysis: null,
        isLoading: false,
        error: null,
        lastUpdated: null,
        quickLevel: null,
      });
      return;
    }

    // Only trigger analysis if there's a significant change
    if (hasSignificantChange(quote, lineItems)) {
      triggerAnalysis(quote, lineItems);
    }

    // Cleanup timer on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [quote, lineItems, triggerAnalysis, hasSignificantChange, debounceTimer]);

  /**
   * Get complexity insights for UI display
   */
  const getComplexityInsights = useCallback(() => {
    if (!state.analysis) return [];

    return state.analysis.insights.filter(insight => 
      insight.impact === 'high' || insight.recommendation
    );
  }, [state.analysis]);

  /**
   * Get complexity recommendations
   */
  const getRecommendations = useCallback(() => {
    if (!state.analysis) return [];

    return state.analysis.insights
      .filter(insight => insight.recommendation)
      .map(insight => insight.recommendation!)
      .slice(0, 3); // Limit to 3 recommendations
  }, [state.analysis]);

  /**
   * Check if quote is above certain complexity threshold
   */
  const isAboveThreshold = useCallback((threshold: 'simple' | 'medium' | 'complex') => {
    if (!state.analysis) return false;

    const levels = { simple: 1, medium: 2, complex: 3 };
    const currentLevel = levels[state.analysis.level];
    const thresholdLevel = levels[threshold];

    return currentLevel >= thresholdLevel;
  }, [state.analysis]);

  return {
    // State
    analysis: state.analysis,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    quickLevel: state.quickLevel,

    // Actions
    forceAnalysis,
    getQuickLevel,

    // Helpers
    getComplexityInsights,
    getRecommendations,
    isAboveThreshold,

    // Computed values
    complexityLevel: state.analysis?.level || null,
    complexityScore: state.analysis?.score || null,
    confidence: state.analysis?.confidence || null,
    hasHighImpactFactors: (state.analysis?.insights.filter(i => i.impact === 'high').length || 0) > 0,
    needsAttention: state.analysis?.level === 'complex' && (state.analysis?.confidence || 0) > 0.8,
  };
}