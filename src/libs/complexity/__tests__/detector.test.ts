/**
 * Quote Complexity Detection System Tests
 * Comprehensive test suite for complexity analysis algorithm
 */

import { Quote, QuoteLineItem } from '@/features/quotes/types';

import { DEFAULT_COMPLEXITY_CONFIG } from '../config';
import { detectQuoteComplexity, getQuoteComplexityLevel,QuoteComplexityDetector } from '../detector';
import { ComplexityConfig, ComplexityLevel } from '../types';

describe('QuoteComplexityDetector', () => {
  let detector: QuoteComplexityDetector;

  beforeEach(() => {
    detector = new QuoteComplexityDetector();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultDetector = new QuoteComplexityDetector();
      expect(defaultDetector).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<ComplexityConfig> = {
        factors: {
          ...DEFAULT_COMPLEXITY_CONFIG.factors,
          itemCount: {
            ...DEFAULT_COMPLEXITY_CONFIG.factors.itemCount,
            weight: 30,
          },
        },
      };
      
      const customDetector = new QuoteComplexityDetector(customConfig);
      expect(customDetector).toBeDefined();
    });
  });

  describe('Simple Quote Analysis', () => {
    const createSimpleQuote = (): { quote: Quote; lineItems: QuoteLineItem[] } => ({
      quote: {
        id: 'simple-001',
        user_id: 'user-1',
        client_name: 'John Doe',
        client_contact: 'john@example.com',
        total: 350,
        tax_rate: 8.5,
        markup_rate: 20,
        subtotal: 300,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      },
      lineItems: [
        { id: '1', name: 'Lawn Mowing', unit: 'hour', cost: 50, quantity: 2 },
        { id: '2', name: 'Edge Trimming', unit: 'hour', cost: 30, quantity: 1 },
        { id: '3', name: 'Leaf Cleanup', unit: 'hour', cost: 40, quantity: 1.5 },
      ],
    });

    it('should classify simple quotes correctly', () => {
      const { quote, lineItems } = createSimpleQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      expect(analysis.level).toBe('simple');
      expect(analysis.score).toBeLessThanOrEqual(30);
      expect(analysis.confidence).toBeGreaterThan(0.5);
    });

    it('should identify simple quote factors', () => {
      const { quote, lineItems } = createSimpleQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      expect(analysis.factors.itemCount.value).toBe(3);
      expect(analysis.factors.totalValue.value).toBe(350);
      expect(analysis.factors.hasTax.value).toBe(true);
      expect(analysis.factors.hasMarkup.value).toBe(true);
    });

    it('should generate appropriate insights for simple quotes', () => {
      const { quote, lineItems } = createSimpleQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      expect(analysis.insights).toBeDefined();
      expect(analysis.reasoning).toContain('simple');
      expect(analysis.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Medium Quote Analysis', () => {
    const createMediumQuote = (): { quote: Quote; lineItems: QuoteLineItem[] } => ({
      quote: {
        id: 'medium-001',
        user_id: 'user-1',
        client_name: 'ABC Company',
        client_contact: 'contact@abc.com',
        total: 1850,
        tax_rate: 9.25,
        markup_rate: 25,
        subtotal: 1500,
        created_at: '2024-01-01T00:00:00Z',
        notes: 'Special requirements for commercial property',
        quote_data: [],
      },
      lineItems: [
        { id: '1', name: 'Lawn Mowing', unit: 'sqft', cost: 0.05, quantity: 5000 },
        { id: '2', name: 'Fertilizer Application', unit: 'bag', cost: 45, quantity: 8 },
        { id: '3', name: 'Weed Control Treatment', unit: 'application', cost: 150, quantity: 2 },
        { id: '4', name: 'Bush Trimming', unit: 'hour', cost: 60, quantity: 4 },
        { id: '5', name: 'Mulch Installation', unit: 'yard', cost: 35, quantity: 12 },
        { id: '6', name: 'Irrigation Check', unit: 'zone', cost: 25, quantity: 8 },
      ],
    });

    it('should classify medium quotes correctly', () => {
      const { quote, lineItems } = createMediumQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      expect(analysis.level).toBe('medium');
      expect(analysis.score).toBeGreaterThan(30);
      expect(analysis.score).toBeLessThanOrEqual(65);
    });

    it('should identify medium complexity factors', () => {
      const { quote, lineItems } = createMediumQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      expect(analysis.factors.itemCount.value).toBe(6);
      expect(analysis.factors.totalValue.value).toBe(1850);
      expect(analysis.factors.hasNotes.value).toBe(true);
      expect(analysis.factors.uniqueItemTypes.value).toBeGreaterThan(2);
    });

    it('should generate relevant insights for medium quotes', () => {
      const { quote, lineItems } = createMediumQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      const mediumInsights = analysis.insights.filter(i => i.impact === 'medium');
      expect(mediumInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Quote Analysis', () => {
    const createComplexQuote = (): { quote: Quote; lineItems: QuoteLineItem[] } => ({
      quote: {
        id: 'complex-001',
        user_id: 'user-1',
        client_name: 'Enterprise Corp',
        client_contact: 'facilities@enterprise.com',
        total: 15750,
        tax_rate: 11.5,
        markup_rate: 40,
        subtotal: 12000,
        created_at: '2024-01-01T00:00:00Z',
        notes: 'Multi-phase commercial landscaping project with specialized requirements',
        is_template: false,
        quote_data: [],
      },
      lineItems: [
        { id: '1', name: 'Site Preparation', unit: 'sqft', cost: 0.15, quantity: 20000 },
        { id: '2', name: 'Premium Sod Installation', unit: 'sqft', cost: 0.85, quantity: 8000 },
        { id: '3', name: 'Hardscape Paving', unit: 'sqft', cost: 12, quantity: 500 },
        { id: '4', name: 'Irrigation System Design', unit: 'zone', cost: 250, quantity: 15 },
        { id: '5', name: 'Custom Tree Planting', unit: 'tree', cost: 450, quantity: 25 },
        { id: '6', name: 'Specialty Lighting', unit: 'fixture', cost: 180, quantity: 30 },
        { id: '7', name: 'Drainage Solutions', unit: 'linear ft', cost: 25, quantity: 800 },
        { id: '8', name: 'Retaining Wall', unit: 'sqft', cost: 35, quantity: 300 },
        { id: '9', name: 'Decorative Stonework', unit: 'sqft', cost: 55, quantity: 150 },
        { id: '10', name: 'Maintenance Contract Setup', unit: 'flat', cost: 500, quantity: 1 },
        { id: '11', name: 'Permits and Inspections', unit: 'permit', cost: 150, quantity: 8 },
        { id: '12', name: 'Project Management', unit: 'month', cost: 800, quantity: 3 },
      ],
    });

    it('should classify complex quotes correctly', () => {
      const { quote, lineItems } = createComplexQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      expect(analysis.level).toBe('complex');
      expect(analysis.score).toBeGreaterThan(65);
    });

    it('should identify complex quote factors', () => {
      const { quote, lineItems } = createComplexQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      expect(analysis.factors.itemCount.value).toBe(12);
      expect(analysis.factors.totalValue.value).toBe(15750);
      expect(analysis.factors.highMarkupRate.value).toBe(true);
      expect(analysis.factors.uniqueItemTypes.value).toBeGreaterThan(5);
    });

    it('should generate high-impact insights for complex quotes', () => {
      const { quote, lineItems } = createComplexQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      const highImpactInsights = analysis.insights.filter(i => i.impact === 'high');
      expect(highImpactInsights.length).toBeGreaterThan(0);
      
      const insightsWithRecommendations = analysis.insights.filter(i => i.recommendation);
      expect(insightsWithRecommendations.length).toBeGreaterThan(0);
    });

    it('should have high confidence for clear complex quotes', () => {
      const { quote, lineItems } = createComplexQuote();
      const analysis = detector.analyzeComplexity({ quote, lineItems });

      expect(analysis.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty quotes gracefully', () => {
      const emptyQuote: Quote = {
        id: 'empty-001',
        user_id: 'user-1',
        client_name: 'Test Client',
        client_contact: null,
        total: 0,
        tax_rate: 0,
        markup_rate: 0,
        subtotal: 0,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      };

      const analysis = detector.analyzeComplexity({ quote: emptyQuote, lineItems: [] });
      
      expect(analysis.level).toBe('simple');
      expect(analysis.score).toBeDefined();
      expect(analysis.factors).toBeDefined();
    });

    it('should handle single item quotes', () => {
      const singleItemQuote: Quote = {
        id: 'single-001',
        user_id: 'user-1',
        client_name: 'Test Client',
        client_contact: null,
        total: 100,
        tax_rate: 0,
        markup_rate: 0,
        subtotal: 100,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Basic Service', unit: 'hour', cost: 100, quantity: 1 },
      ];

      const analysis = detector.analyzeComplexity({ quote: singleItemQuote, lineItems });
      
      expect(analysis.level).toBe('simple');
      expect(analysis.factors.itemCount.value).toBe(1);
    });

    it('should handle quotes with zero-cost items', () => {
      const quote: Quote = {
        id: 'zero-cost-001',
        user_id: 'user-1',
        client_name: 'Test Client',
        client_contact: null,
        total: 100,
        tax_rate: 0,
        markup_rate: 0,
        subtotal: 100,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Free Consultation', unit: 'hour', cost: 0, quantity: 1 },
        { id: '2', name: 'Paid Service', unit: 'hour', cost: 100, quantity: 1 },
      ];

      const analysis = detector.analyzeComplexity({ quote, lineItems });
      
      expect(analysis.factors.priceRange.value).toBeGreaterThanOrEqual(1);
      expect(analysis.score).toBeDefined();
    });

    it('should handle very large quantities', () => {
      const quote: Quote = {
        id: 'large-qty-001',
        user_id: 'user-1',
        client_name: 'Test Client',
        client_contact: null,
        total: 100000,
        tax_rate: 0,
        markup_rate: 0,
        subtotal: 100000,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Bulk Material', unit: 'unit', cost: 1, quantity: 100000 },
      ];

      const analysis = detector.analyzeComplexity({ quote, lineItems });
      
      expect(analysis.factors.quantityVariance.value).toBeDefined();
      expect(analysis.factors.totalValue.value).toBe(100000);
    });
  });

  describe('Custom Items Analysis', () => {
    it('should correctly calculate custom items percentage', () => {
      const quote: Quote = {
        id: 'custom-001',
        user_id: 'user-1',
        client_name: 'Test Client',
        client_contact: null,
        total: 500,
        tax_rate: 0,
        markup_rate: 0,
        subtotal: 500,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Standard Mowing', unit: 'hour', cost: 50, quantity: 2 },
        { id: '2', name: 'Custom Landscape Design', unit: 'hour', cost: 100, quantity: 3 },
      ];

      const availableItems = [
        { id: '1', name: 'Standard Mowing', unit: 'hour', cost: 50 },
      ];

      const analysis = detector.analyzeComplexity({ quote, lineItems, availableItems });
      
      expect(analysis.factors.customItems.value).toBe(50); // 1 out of 2 items is custom
    });

    it('should handle missing available items gracefully', () => {
      const quote: Quote = {
        id: 'no-library-001',
        user_id: 'user-1',
        client_name: 'Test Client',
        client_contact: null,
        total: 500,
        tax_rate: 0,
        markup_rate: 0,
        subtotal: 500,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Some Service', unit: 'hour', cost: 50, quantity: 2 },
      ];

      const analysis = detector.analyzeComplexity({ quote, lineItems });
      
      expect(analysis.factors.customItems.value).toBe(50); // Default assumption
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', () => {
      const { quote, lineItems } = createSimpleQuote();
      
      const startTime = performance.now();
      detector.analyzeComplexity({ quote, lineItems });
      const endTime = performance.now();
      
      const metrics = detector.getPerformanceMetrics();
      
      expect(metrics.calculationTime).toBeGreaterThan(0);
      expect(metrics.calculationTime).toBeLessThan(endTime - startTime + 10); // Allow some margin
      expect(metrics.factorsAnalyzed).toBe(12);
    });
  });

  describe('Convenience Functions', () => {
    it('should work with detectQuoteComplexity function', () => {
      const quote: Quote = {
        id: 'convenience-001',
        user_id: 'user-1',
        client_name: 'Test Client',
        client_contact: null,
        total: 200,
        tax_rate: 0,
        markup_rate: 0,
        subtotal: 200,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Simple Service', unit: 'hour', cost: 100, quantity: 2 },
      ];

      const analysis = detectQuoteComplexity(quote, lineItems);
      
      expect(analysis).toBeDefined();
      expect(analysis.level).toBeDefined();
      expect(analysis.score).toBeDefined();
    });

    it('should work with getQuoteComplexityLevel function', () => {
      const quote: Quote = {
        id: 'level-001',
        user_id: 'user-1',
        client_name: 'Test Client',
        client_contact: null,
        total: 200,
        tax_rate: 0,
        markup_rate: 0,
        subtotal: 200,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Simple Service', unit: 'hour', cost: 100, quantity: 2 },
      ];

      const level = getQuoteComplexityLevel(quote, lineItems);
      
      expect(['simple', 'medium', 'complex']).toContain(level);
    });
  });

  // Helper function for creating simple quotes
  function createSimpleQuote(): { quote: Quote; lineItems: QuoteLineItem[] } {
    return {
      quote: {
        id: 'simple-001',
        user_id: 'user-1',
        client_name: 'John Doe',
        client_contact: 'john@example.com',
        total: 350,
        tax_rate: 8.5,
        markup_rate: 20,
        subtotal: 300,
        created_at: '2024-01-01T00:00:00Z',
        quote_data: [],
      },
      lineItems: [
        { id: '1', name: 'Lawn Mowing', unit: 'hour', cost: 50, quantity: 2 },
        { id: '2', name: 'Edge Trimming', unit: 'hour', cost: 30, quantity: 1 },
        { id: '3', name: 'Leaf Cleanup', unit: 'hour', cost: 40, quantity: 1.5 },
      ],
    };
  }
});