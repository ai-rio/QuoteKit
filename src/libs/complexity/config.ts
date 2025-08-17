/**
 * Default configuration for quote complexity detection
 * Based on analysis of typical QuoteKit usage patterns
 */

import { ComplexityConfig } from './types';

/**
 * Default complexity detection configuration
 * These thresholds are based on landscaping industry analysis and QuoteKit user data
 */
export const DEFAULT_COMPLEXITY_CONFIG: ComplexityConfig = {
  // Score thresholds for classification
  thresholds: {
    simple: { min: 0, max: 30 },
    medium: { min: 31, max: 65 },
    complex: { min: 66, max: 100 },
  },
  
  // Factor-specific thresholds and weights
  factors: {
    // Item count thresholds (landscaping industry typical patterns)
    itemCount: {
      simple: 3,    // 1-3 items: basic lawn service, single task
      medium: 8,    // 4-8 items: moderate project with multiple services
      complex: 15,  // 8+ items: complex commercial or multi-area project
      weight: 20,   // High impact factor
    },
    
    // Total value thresholds (USD, landscaping industry)
    totalValue: {
      simple: 500,    // Under $500: small residential jobs
      medium: 2500,   // $500-$2,500: medium residential/small commercial
      complex: 10000, // $2,500+: large projects, commercial work
      weight: 15,     // Significant impact on complexity
    },
    
    // Unique item types (service/material diversity)
    uniqueItemTypes: {
      simple: 2,    // 1-2 types: e.g., only mowing, only fertilizer
      medium: 5,    // 3-5 types: mixed services (mowing + fertilizer + trimming)
      complex: 8,   // 5+ types: comprehensive landscaping project
      weight: 12,   // Moderate impact
    },
    
    // Custom items percentage (non-library items)
    customItems: {
      simple: 20,   // 0-20% custom: mostly using library items
      medium: 50,   // 20-50% custom: some specialized items
      complex: 80,  // 50%+ custom: highly customized quote
      weight: 10,   // Lower impact, but still relevant
    },
    
    // Quantity variance (standard deviation)
    quantityVariance: {
      simple: 1.0,  // Low variance: similar quantities
      medium: 3.0,  // Medium variance: some quantity differences
      complex: 5.0, // High variance: very different quantities
      weight: 8,    // Lower impact factor
    },
    
    // Price range ratio (max price / min price)
    priceRange: {
      simple: 3.0,   // Max 3x difference between items
      medium: 10.0,  // Up to 10x difference
      complex: 25.0, // Large price variations
      weight: 10,    // Moderate impact
    },
    
    // Boolean factors (additional complexity indicators)
    booleanFactors: {
      hasTax: 3,          // Basic business practice
      hasMarkup: 3,       // Standard profit calculation
      highTaxRate: 5,     // >10% tax indicates complex jurisdiction
      highMarkupRate: 7,  // >30% markup indicates specialized work
      isTemplate: -2,     // Templates reduce complexity
      hasNotes: 4,        // Notes indicate special requirements
    },
  },
  
  // Survey selection based on complexity
  surveySelection: {
    simple: {
      surveyId: 'simple_quote_feedback',
      triggerConditions: [
        'quote_created',
        'quote_sent',
        'first_time_simple_user',
      ],
    },
    medium: {
      surveyId: 'medium_quote_feedback',
      triggerConditions: [
        'quote_created',
        'quote_sent',
        'medium_complexity_milestone',
      ],
    },
    complex: {
      surveyId: 'complex_quote_feedback',
      triggerConditions: [
        'quote_created',
        'quote_sent',
        'complex_quote_power_user',
      ],
    },
  },
};

/**
 * Industry-specific configurations
 */
export const INDUSTRY_CONFIGS: Record<string, Partial<ComplexityConfig>> = {
  landscaping: DEFAULT_COMPLEXITY_CONFIG,
  
  construction: {
    factors: {
      itemCount: {
        simple: 5,
        medium: 15,
        complex: 30,
        weight: 25,
      },
      totalValue: {
        simple: 2000,
        medium: 15000,
        complex: 50000,
        weight: 20,
      },
      uniqueItemTypes: {
        simple: 3,
        medium: 8,
        complex: 15,
        weight: 12,
      },
      customItems: {
        simple: 30,
        medium: 60,
        complex: 85,
        weight: 10,
      },
      quantityVariance: {
        simple: 2.0,
        medium: 5.0,
        complex: 8.0,
        weight: 8,
      },
      priceRange: {
        simple: 5.0,
        medium: 20.0,
        complex: 50.0,
        weight: 10,
      },
      booleanFactors: {
        hasTax: 3,
        hasMarkup: 3,
        highTaxRate: 5,
        highMarkupRate: 7,
        isTemplate: -2,
        hasNotes: 6,
      },
    },
  },
  
  consulting: {
    factors: {
      itemCount: {
        simple: 2,
        medium: 5,
        complex: 10,
        weight: 15,
      },
      totalValue: {
        simple: 1000,
        medium: 5000,
        complex: 25000,
        weight: 25,
      },
      uniqueItemTypes: {
        simple: 1,
        medium: 3,
        complex: 6,
        weight: 12,
      },
      customItems: {
        simple: 50,
        medium: 75,
        complex: 90,
        weight: 15,
      },
      quantityVariance: {
        simple: 1.0,
        medium: 2.0,
        complex: 4.0,
        weight: 8,
      },
      priceRange: {
        simple: 2.0,
        medium: 10.0,
        complex: 30.0,
        weight: 10,
      },
      booleanFactors: {
        hasTax: 3,
        hasMarkup: 3,
        highTaxRate: 5,
        highMarkupRate: 7,
        isTemplate: -2,
        hasNotes: 8,
      },
    },
  },
};

/**
 * Get configuration for specific industry or use default
 */
export function getComplexityConfig(industry?: string): ComplexityConfig {
  if (industry && INDUSTRY_CONFIGS[industry]) {
    return {
      ...DEFAULT_COMPLEXITY_CONFIG,
      ...INDUSTRY_CONFIGS[industry],
      factors: {
        ...DEFAULT_COMPLEXITY_CONFIG.factors,
        ...INDUSTRY_CONFIGS[industry].factors,
      },
    };
  }
  return DEFAULT_COMPLEXITY_CONFIG;
}