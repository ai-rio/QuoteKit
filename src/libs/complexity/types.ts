/**
 * Quote Complexity Detection System Types
 * Provides comprehensive complexity analysis for QuoteKit quotes
 */

import { Quote, QuoteLineItem } from '@/features/quotes/types';

/**
 * Complexity levels for quotes
 */
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

/**
 * Individual complexity factors and their weights
 */
export interface ComplexityFactors {
  // Line Item Complexity
  itemCount: {
    value: number;
    weight: number;
    threshold: { simple: number; medium: number; complex: number };
  };
  
  // Financial Complexity
  totalValue: {
    value: number;
    weight: number;
    threshold: { simple: number; medium: number; complex: number };
  };
  
  // Item Diversity
  uniqueItemTypes: {
    value: number;
    weight: number;
    threshold: { simple: number; medium: number; complex: number };
  };
  
  // Customization Level
  customItems: {
    value: number; // percentage of custom vs. library items
    weight: number;
    threshold: { simple: number; medium: number; complex: number };
  };
  
  // Quantity Variance
  quantityVariance: {
    value: number; // standard deviation of quantities
    weight: number;
    threshold: { simple: number; medium: number; complex: number };
  };
  
  // Pricing Complexity
  priceRange: {
    value: number; // ratio of max to min item price
    weight: number;
    threshold: { simple: number; medium: number; complex: number };
  };
  
  // Business Configuration
  hasTax: {
    value: boolean;
    weight: number;
  };
  
  hasMarkup: {
    value: boolean;
    weight: number;
  };
  
  highTaxRate: {
    value: boolean; // > 10%
    weight: number;
  };
  
  highMarkupRate: {
    value: boolean; // > 30%
    weight: number;
  };
  
  // Template/Pattern Complexity
  isTemplate: {
    value: boolean;
    weight: number;
  };
  
  hasNotes: {
    value: boolean;
    weight: number;
  };
}

/**
 * Complexity analysis result
 */
export interface ComplexityAnalysis {
  level: ComplexityLevel;
  score: number; // 0-100 complexity score
  factors: ComplexityFactors;
  insights: ComplexityInsight[];
  confidence: number; // 0-1 confidence in classification
  reasoning: string[];
}

/**
 * Insights about complexity factors
 */
export interface ComplexityInsight {
  factor: keyof ComplexityFactors;
  impact: 'low' | 'medium' | 'high';
  description: string;
  recommendation?: string;
}

/**
 * Configuration for complexity thresholds
 */
export interface ComplexityConfig {
  // Score thresholds for each level
  thresholds: {
    simple: { min: number; max: number };
    medium: { min: number; max: number };
    complex: { min: number; max: number };
  };
  
  // Factor-specific configurations
  factors: {
    itemCount: { simple: number; medium: number; complex: number; weight: number };
    totalValue: { simple: number; medium: number; complex: number; weight: number };
    uniqueItemTypes: { simple: number; medium: number; complex: number; weight: number };
    customItems: { simple: number; medium: number; complex: number; weight: number };
    quantityVariance: { simple: number; medium: number; complex: number; weight: number };
    priceRange: { simple: number; medium: number; complex: number; weight: number };
    booleanFactors: {
      hasTax: number;
      hasMarkup: number;
      highTaxRate: number;
      highMarkupRate: number;
      isTemplate: number;
      hasNotes: number;
    };
  };
  
  // Survey selection rules
  surveySelection: {
    simple: {
      surveyId: string;
      triggerConditions: string[];
    };
    medium: {
      surveyId: string;
      triggerConditions: string[];
    };
    complex: {
      surveyId: string;
      triggerConditions: string[];
    };
  };
}

/**
 * Cache entry for complexity analysis
 */
export interface ComplexityCache {
  quoteId: string;
  analysis: ComplexityAnalysis;
  timestamp: number;
  version: string; // for cache invalidation
}

/**
 * Performance metrics for complexity detection
 */
export interface ComplexityPerformanceMetrics {
  calculationTime: number;
  cacheHit: boolean;
  factorsAnalyzed: number;
  insightsGenerated: number;
}

/**
 * Input data for complexity analysis
 */
export interface ComplexityInput {
  quote: Quote;
  lineItems: QuoteLineItem[];
  availableItems?: any[]; // from user's item library
  config?: Partial<ComplexityConfig>;
}

/**
 * Survey trigger context based on complexity
 */
export interface ComplexitySurveyContext {
  complexity: ComplexityAnalysis;
  quote: Quote;
  userContext: {
    userId: string;
    subscriptionTier?: string;
    quotesCreated?: number;
    timeSpentOnQuote?: number;
    isFirstTimeUser?: boolean;
  };
  triggerConditions: string[];
  recommendedSurvey: {
    surveyId: string;
    priority: 'low' | 'medium' | 'high';
    delay?: number; // delay in seconds before showing
  };
}