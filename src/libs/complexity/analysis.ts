/**
 * Complexity Analysis Module
 * Provides utilities for analyzing quote complexity and triggering appropriate surveys
 */

export interface ComplexityAnalysis {
  score: number;
  factors: string[];
  category: 'simple' | 'moderate' | 'complex';
  level: 'simple' | 'moderate' | 'complex'; // Alternative naming used in components
  recommendations: string[];
}

export interface QuoteComplexityData {
  itemCount: number;
  totalValue: number;
  hasCustomItems: boolean;
  hasMultipleCategories: boolean;
  hasDiscounts: boolean;
  hasTaxes: boolean;
  hasTax?: boolean; // Alternative naming used in some places
  estimatedDuration: number;
}

/**
 * Analyzes quote complexity based on various factors
 */
export function analyzeQuoteComplexity(data: QuoteComplexityData): ComplexityAnalysis {
  let score = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];

  // Item count factor
  if (data.itemCount > 10) {
    score += 3;
    factors.push('High item count');
  } else if (data.itemCount > 5) {
    score += 2;
    factors.push('Moderate item count');
  } else {
    score += 1;
    factors.push('Low item count');
  }

  // Value factor
  if (data.totalValue > 10000) {
    score += 3;
    factors.push('High value quote');
  } else if (data.totalValue > 5000) {
    score += 2;
    factors.push('Moderate value quote');
  } else {
    score += 1;
    factors.push('Low value quote');
  }

  // Custom items
  if (data.hasCustomItems) {
    score += 2;
    factors.push('Contains custom items');
    recommendations.push('Consider follow-up survey for custom item satisfaction');
  }

  // Multiple categories
  if (data.hasMultipleCategories) {
    score += 1;
    factors.push('Multiple service categories');
  }

  // Discounts and taxes
  if (data.hasDiscounts) {
    score += 1;
    factors.push('Has discounts applied');
  }

  if (data.hasTaxes) {
    score += 1;
    factors.push('Has tax calculations');
  }

  // Duration factor
  if (data.estimatedDuration > 30) {
    score += 2;
    factors.push('Long project duration');
    recommendations.push('Consider milestone-based feedback surveys');
  }

  // Determine category
  let category: ComplexityAnalysis['category'];
  if (score <= 4) {
    category = 'simple';
    recommendations.push('Standard post-quote survey appropriate');
  } else if (score <= 8) {
    category = 'moderate';
    recommendations.push('Enhanced survey with complexity-specific questions');
  } else {
    category = 'complex';
    recommendations.push('Comprehensive survey with detailed feedback collection');
    recommendations.push('Consider scheduling follow-up consultation');
  }

  return {
    score,
    factors,
    category,
    level: category, // Set level to match category for compatibility
    recommendations
  };
}

/**
 * Determines if a complexity-based survey should be triggered
 */
export function shouldTriggerComplexitySurvey(analysis: ComplexityAnalysis): boolean {
  // Always trigger for complex quotes
  if (analysis.category === 'complex') {
    return true;
  }

  // Trigger for moderate quotes with specific factors
  if (analysis.category === 'moderate') {
    return analysis.factors.includes('Contains custom items') || 
           analysis.factors.includes('High value quote');
  }

  // Simple quotes - trigger based on value
  return analysis.score >= 3;
}

/**
 * Gets the appropriate survey type based on complexity
 */
export function getSurveyTypeForComplexity(analysis: ComplexityAnalysis): string {
  switch (analysis.category) {
    case 'simple':
      return 'post-quote-simple';
    case 'moderate':
      return 'post-quote-moderate';
    case 'complex':
      return 'post-quote-complex';
    default:
      return 'post-quote-simple';
  }
}
