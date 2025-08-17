/**
 * Quote Complexity Detection Algorithm
 * Comprehensive analysis engine for QuoteKit quotes
 */

import { Quote, QuoteLineItem } from '@/features/quotes/types';

import { DEFAULT_COMPLEXITY_CONFIG, getComplexityConfig } from './config';
import {
  ComplexityAnalysis,
  ComplexityConfig,
  ComplexityFactors,
  ComplexityInput,
  ComplexityInsight,
  ComplexityLevel,
  ComplexityPerformanceMetrics,
} from './types';

/**
 * Main complexity detection class
 */
export class QuoteComplexityDetector {
  private config: ComplexityConfig;
  private startTime: number = 0;

  constructor(config?: Partial<ComplexityConfig>) {
    this.config = config ? { ...DEFAULT_COMPLEXITY_CONFIG, ...config } : DEFAULT_COMPLEXITY_CONFIG;
  }

  /**
   * Analyze quote complexity
   */
  public analyzeComplexity(input: ComplexityInput): ComplexityAnalysis {
    this.startTime = performance.now();

    const factors = this.calculateFactors(input);
    const score = this.calculateComplexityScore(factors);
    const level = this.determineComplexityLevel(score);
    const insights = this.generateInsights(factors, level);
    const confidence = this.calculateConfidence(factors, score);
    const reasoning = this.generateReasoning(factors, level, score);

    return {
      level,
      score,
      factors,
      insights,
      confidence,
      reasoning,
    };
  }

  /**
   * Calculate all complexity factors
   */
  private calculateFactors(input: ComplexityInput): ComplexityFactors {
    const { quote, lineItems } = input;
    const config = input.config ? { ...this.config, ...input.config } : this.config;

    // Calculate item count factor
    const itemCount = lineItems.length;
    const itemCountFactor = {
      value: itemCount,
      weight: config.factors.itemCount.weight,
      threshold: {
        simple: config.factors.itemCount.simple,
        medium: config.factors.itemCount.medium,
        complex: config.factors.itemCount.complex,
      },
    };

    // Calculate total value factor
    const totalValue = quote.total || 0;
    const totalValueFactor = {
      value: totalValue,
      weight: config.factors.totalValue.weight,
      threshold: {
        simple: config.factors.totalValue.simple,
        medium: config.factors.totalValue.medium,
        complex: config.factors.totalValue.complex,
      },
    };

    // Calculate unique item types
    const uniqueTypes = this.calculateUniqueItemTypes(lineItems);
    const uniqueItemTypesFactor = {
      value: uniqueTypes,
      weight: config.factors.uniqueItemTypes.weight,
      threshold: {
        simple: config.factors.uniqueItemTypes.simple,
        medium: config.factors.uniqueItemTypes.medium,
        complex: config.factors.uniqueItemTypes.complex,
      },
    };

    // Calculate custom items percentage
    const customItemsPercentage = this.calculateCustomItemsPercentage(lineItems, input.availableItems);
    const customItemsFactor = {
      value: customItemsPercentage,
      weight: config.factors.customItems.weight,
      threshold: {
        simple: config.factors.customItems.simple,
        medium: config.factors.customItems.medium,
        complex: config.factors.customItems.complex,
      },
    };

    // Calculate quantity variance
    const quantityVariance = this.calculateQuantityVariance(lineItems);
    const quantityVarianceFactor = {
      value: quantityVariance,
      weight: config.factors.quantityVariance.weight,
      threshold: {
        simple: config.factors.quantityVariance.simple,
        medium: config.factors.quantityVariance.medium,
        complex: config.factors.quantityVariance.complex,
      },
    };

    // Calculate price range
    const priceRange = this.calculatePriceRange(lineItems);
    const priceRangeFactor = {
      value: priceRange,
      weight: config.factors.priceRange.weight,
      threshold: {
        simple: config.factors.priceRange.simple,
        medium: config.factors.priceRange.medium,
        complex: config.factors.priceRange.complex,
      },
    };

    // Calculate boolean factors
    const hasTax = (quote.tax_rate || 0) > 0;
    const hasMarkup = (quote.markup_rate || 0) > 0;
    const highTaxRate = (quote.tax_rate || 0) > 10;
    const highMarkupRate = (quote.markup_rate || 0) > 30;
    const isTemplate = quote.is_template || false;
    const hasNotes = !!(quote.notes && quote.notes.trim().length > 0);

    return {
      itemCount: itemCountFactor,
      totalValue: totalValueFactor,
      uniqueItemTypes: uniqueItemTypesFactor,
      customItems: customItemsFactor,
      quantityVariance: quantityVarianceFactor,
      priceRange: priceRangeFactor,
      hasTax: { value: hasTax, weight: config.factors.booleanFactors.hasTax },
      hasMarkup: { value: hasMarkup, weight: config.factors.booleanFactors.hasMarkup },
      highTaxRate: { value: highTaxRate, weight: config.factors.booleanFactors.highTaxRate },
      highMarkupRate: { value: highMarkupRate, weight: config.factors.booleanFactors.highMarkupRate },
      isTemplate: { value: isTemplate, weight: config.factors.booleanFactors.isTemplate },
      hasNotes: { value: hasNotes, weight: config.factors.booleanFactors.hasNotes },
    };
  }

  /**
   * Calculate complexity score (0-100)
   */
  private calculateComplexityScore(factors: ComplexityFactors): number {
    let score = 0;
    let totalWeight = 0;

    // Score numeric factors
    const numericFactors = ['itemCount', 'totalValue', 'uniqueItemTypes', 'customItems', 'quantityVariance', 'priceRange'] as const;
    
    numericFactors.forEach(factorName => {
      const factor = factors[factorName];
      const factorScore = this.scoreNumericFactor(factor.value, factor.threshold);
      score += factorScore * factor.weight;
      totalWeight += factor.weight;
    });

    // Score boolean factors
    const booleanFactors = ['hasTax', 'hasMarkup', 'highTaxRate', 'highMarkupRate', 'isTemplate', 'hasNotes'] as const;
    
    booleanFactors.forEach(factorName => {
      const factor = factors[factorName];
      const factorScore = factor.value ? (factor.weight > 0 ? 100 : 0) : 0;
      score += Math.abs(factor.weight); // Add absolute weight to total
      totalWeight += Math.abs(factor.weight);
    });

    // Normalize score to 0-100 range
    const normalizedScore = totalWeight > 0 ? (score / totalWeight) : 0;
    return Math.max(0, Math.min(100, normalizedScore));
  }

  /**
   * Score a numeric factor based on thresholds
   */
  private scoreNumericFactor(value: number, threshold: { simple: number; medium: number; complex: number }): number {
    if (value <= threshold.simple) return 10; // Simple range
    if (value <= threshold.medium) {
      // Linear interpolation between simple and medium
      const progress = (value - threshold.simple) / (threshold.medium - threshold.simple);
      return 10 + (progress * 40); // 10-50 range
    }
    if (value <= threshold.complex) {
      // Linear interpolation between medium and complex
      const progress = (value - threshold.medium) / (threshold.complex - threshold.medium);
      return 50 + (progress * 40); // 50-90 range
    }
    return 90 + Math.min(10, (value - threshold.complex) / threshold.complex * 10); // 90-100 range
  }

  /**
   * Determine complexity level from score
   */
  private determineComplexityLevel(score: number): ComplexityLevel {
    if (score <= this.config.thresholds.simple.max) return 'simple';
    if (score <= this.config.thresholds.medium.max) return 'medium';
    return 'complex';
  }

  /**
   * Generate insights about complexity factors
   */
  private generateInsights(factors: ComplexityFactors, level: ComplexityLevel): ComplexityInsight[] {
    const insights: ComplexityInsight[] = [];

    // Analyze item count
    if (factors.itemCount.value > factors.itemCount.threshold.complex) {
      insights.push({
        factor: 'itemCount',
        impact: 'high',
        description: `High item count (${factors.itemCount.value} items) indicates a comprehensive project`,
        recommendation: 'Consider grouping related items or creating sub-quotes for better organization',
      });
    } else if (factors.itemCount.value > factors.itemCount.threshold.medium) {
      insights.push({
        factor: 'itemCount',
        impact: 'medium',
        description: `Moderate item count (${factors.itemCount.value} items) suggests multi-service project`,
      });
    }

    // Analyze total value
    if (factors.totalValue.value > factors.totalValue.threshold.complex) {
      insights.push({
        factor: 'totalValue',
        impact: 'high',
        description: `High-value quote ($${factors.totalValue.value.toLocaleString()}) requires careful attention`,
        recommendation: 'Consider detailed breakdown and milestone payments for large projects',
      });
    }

    // Analyze custom items
    if (factors.customItems.value > factors.customItems.threshold.medium) {
      insights.push({
        factor: 'customItems',
        impact: 'medium',
        description: `High percentage of custom items (${factors.customItems.value.toFixed(1)}%) indicates specialized work`,
        recommendation: 'Ensure accurate pricing for custom items and consider adding to your library',
      });
    }

    // Analyze price variance
    if (factors.priceRange.value > factors.priceRange.threshold.complex) {
      insights.push({
        factor: 'priceRange',
        impact: 'high',
        description: `Wide price range (${factors.priceRange.value.toFixed(1)}x difference) between items`,
        recommendation: 'Double-check pricing accuracy for both high and low-cost items',
      });
    }

    // Analyze business factors
    if (factors.highMarkupRate.value) {
      insights.push({
        factor: 'highMarkupRate',
        impact: 'medium',
        description: 'High markup rate indicates specialized or premium services',
      });
    }

    if (factors.hasNotes.value) {
      insights.push({
        factor: 'hasNotes',
        impact: 'low',
        description: 'Quote includes special notes or requirements',
      });
    }

    return insights;
  }

  /**
   * Calculate confidence in complexity classification
   */
  private calculateConfidence(factors: ComplexityFactors, score: number): number {
    // Base confidence on how clearly the score falls within a category
    const thresholds = this.config.thresholds;
    let confidence = 0.5; // baseline

    // Check distance from boundaries
    if (score <= thresholds.simple.max) {
      // Simple category
      const distanceFromBoundary = thresholds.simple.max - score;
      confidence = 0.7 + (distanceFromBoundary / thresholds.simple.max) * 0.3;
    } else if (score <= thresholds.medium.max) {
      // Medium category
      const categoryWidth = thresholds.medium.max - thresholds.medium.min;
      const distanceFromBoundaries = Math.min(
        score - thresholds.medium.min,
        thresholds.medium.max - score
      );
      confidence = 0.6 + (distanceFromBoundaries / categoryWidth) * 0.4;
    } else {
      // Complex category
      const distanceFromBoundary = score - thresholds.complex.min;
      const categoryWidth = 100 - thresholds.complex.min;
      confidence = 0.7 + (distanceFromBoundary / categoryWidth) * 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(factors: ComplexityFactors, level: ComplexityLevel, score: number): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Overall complexity score: ${score.toFixed(1)}/100 (${level})`);

    // Key contributing factors
    const significantFactors = [];
    
    if (factors.itemCount.value > factors.itemCount.threshold.medium) {
      significantFactors.push(`${factors.itemCount.value} line items`);
    }
    
    if (factors.totalValue.value > factors.totalValue.threshold.medium) {
      significantFactors.push(`$${factors.totalValue.value.toLocaleString()} total value`);
    }
    
    if (factors.uniqueItemTypes.value > factors.uniqueItemTypes.threshold.medium) {
      significantFactors.push(`${factors.uniqueItemTypes.value} different item types`);
    }

    if (significantFactors.length > 0) {
      reasoning.push(`Key factors: ${significantFactors.join(', ')}`);
    }

    // Business complexity factors
    const businessFactors = [];
    if (factors.highTaxRate.value) businessFactors.push('high tax rate');
    if (factors.highMarkupRate.value) businessFactors.push('high markup rate');
    if (factors.hasNotes.value) businessFactors.push('special requirements');

    if (businessFactors.length > 0) {
      reasoning.push(`Additional complexity: ${businessFactors.join(', ')}`);
    }

    return reasoning;
  }

  /**
   * Helper methods for factor calculations
   */
  private calculateUniqueItemTypes(lineItems: QuoteLineItem[]): number {
    // Simple heuristic: count unique first words of item names
    const types = new Set(
      lineItems.map(item => item.name.split(' ')[0].toLowerCase())
    );
    return types.size;
  }

  private calculateCustomItemsPercentage(lineItems: QuoteLineItem[], availableItems?: any[]): number {
    if (!availableItems || availableItems.length === 0) return 50; // assume 50% if no library data

    const libraryItemNames = new Set(availableItems.map(item => item.name.toLowerCase()));
    const customItemCount = lineItems.filter(item => 
      !libraryItemNames.has(item.name.toLowerCase())
    ).length;

    return lineItems.length > 0 ? (customItemCount / lineItems.length) * 100 : 0;
  }

  private calculateQuantityVariance(lineItems: QuoteLineItem[]): number {
    if (lineItems.length <= 1) return 0;

    const quantities = lineItems.map(item => item.quantity);
    const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length;
    
    return Math.sqrt(variance);
  }

  private calculatePriceRange(lineItems: QuoteLineItem[]): number {
    if (lineItems.length === 0) return 1;

    const prices = lineItems.map(item => item.cost);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices.filter(p => p > 0)); // exclude zero prices

    return minPrice > 0 ? maxPrice / minPrice : 1;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): ComplexityPerformanceMetrics {
    return {
      calculationTime: performance.now() - this.startTime,
      cacheHit: false, // Will be updated by cache manager
      factorsAnalyzed: 12, // Total number of factors we analyze
      insightsGenerated: 0, // Will be updated after analysis
    };
  }
}

/**
 * Convenience function for simple complexity detection
 */
export function detectQuoteComplexity(
  quote: Quote,
  lineItems: QuoteLineItem[],
  config?: Partial<ComplexityConfig>
): ComplexityAnalysis {
  const detector = new QuoteComplexityDetector(config);
  return detector.analyzeComplexity({ quote, lineItems });
}

/**
 * Quick complexity check (returns only the level)
 */
export function getQuoteComplexityLevel(
  quote: Quote,
  lineItems: QuoteLineItem[]
): ComplexityLevel {
  const analysis = detectQuoteComplexity(quote, lineItems);
  return analysis.level;
}