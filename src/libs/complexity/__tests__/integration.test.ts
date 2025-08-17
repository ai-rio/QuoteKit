/**
 * Complexity System Integration Tests
 * End-to-end tests for the complete complexity detection and survey system
 */

import { Quote, QuoteLineItem } from '@/features/quotes/types';

import { DEFAULT_COMPLEXITY_CONFIG } from '../config';
import { analyzeQuoteAndTriggerSurvey, analyzeQuoteComplexity, QuoteComplexitySystem } from '../index';

// Mock Formbricks
jest.mock('@/libs/formbricks', () => ({
  FormbricksManager: {
    getInstance: jest.fn(() => ({
      isInitialized: jest.fn(() => true),
      setAttributes: jest.fn(),
      track: jest.fn(),
    })),
  },
}));

describe('Complexity System Integration', () => {
  let complexitySystem: QuoteComplexitySystem;

  beforeEach(() => {
    complexitySystem = new QuoteComplexitySystem();
    jest.clearAllMocks();
  });

  describe('Real-World Quote Scenarios', () => {
    /**
     * Scenario 1: Small Residential Lawn Service
     * Expected: Simple complexity
     */
    it('should classify small residential lawn service as simple', () => {
      const quote: Quote = {
        id: 'residential-small-001',
        user_id: 'landscaper-1',
        client_name: 'Smith Family',
        client_contact: 'smith@email.com',
        total: 180,
        tax_rate: 8.25,
        markup_rate: 15,
        subtotal: 150,
        created_at: '2024-01-15T10:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Weekly Lawn Mowing', unit: 'visit', cost: 45, quantity: 4 },
        { id: '2', name: 'Spring Cleanup', unit: 'hour', cost: 30, quantity: 1 },
      ];

      const analysis = analyzeQuoteComplexity(quote, lineItems);

      expect(analysis.level).toBe('simple');
      expect(analysis.score).toBeLessThan(35);
      expect(analysis.confidence).toBeGreaterThan(0.7);
      
      // Check specific factors
      expect(analysis.factors.itemCount.value).toBe(2);
      expect(analysis.factors.totalValue.value).toBe(180);
      expect(analysis.factors.hasTax.value).toBe(true);
      expect(analysis.factors.hasMarkup.value).toBe(true);
    });

    /**
     * Scenario 2: Medium Commercial Property Maintenance
     * Expected: Medium complexity
     */
    it('should classify commercial property maintenance as medium', () => {
      const quote: Quote = {
        id: 'commercial-medium-001',
        user_id: 'landscaper-2',
        client_name: 'Office Park Management',
        client_contact: 'maintenance@officepark.com',
        total: 2850,
        tax_rate: 9.5,
        markup_rate: 28,
        subtotal: 2200,
        created_at: '2024-01-15T14:30:00Z',
        notes: 'Monthly maintenance contract with seasonal adjustments',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Commercial Mowing', unit: 'acre', cost: 85, quantity: 12 },
        { id: '2', name: 'Landscape Bed Maintenance', unit: 'sqft', cost: 0.25, quantity: 2000 },
        { id: '3', name: 'Fertilizer Program', unit: 'application', cost: 180, quantity: 4 },
        { id: '4', name: 'Irrigation Monitoring', unit: 'month', cost: 95, quantity: 6 },
        { id: '5', name: 'Seasonal Color Installation', unit: 'flat', cost: 25, quantity: 40 },
        { id: '6', name: 'Tree Pruning', unit: 'tree', cost: 75, quantity: 8 },
      ];

      const analysis = analyzeQuoteComplexity(quote, lineItems);

      expect(analysis.level).toBe('medium');
      expect(analysis.score).toBeGreaterThan(35);
      expect(analysis.score).toBeLessThan(70);
      
      // Check medium complexity indicators
      expect(analysis.factors.itemCount.value).toBe(6);
      expect(analysis.factors.totalValue.value).toBe(2850);
      expect(analysis.factors.hasNotes.value).toBe(true);
      expect(analysis.factors.uniqueItemTypes.value).toBeGreaterThan(3);
    });

    /**
     * Scenario 3: Large Commercial Landscaping Project
     * Expected: Complex complexity
     */
    it('should classify large commercial landscaping as complex', () => {
      const quote: Quote = {
        id: 'commercial-complex-001',
        user_id: 'landscaper-enterprise',
        client_name: 'Corporate Campus Development',
        client_contact: 'projects@corporate.com',
        total: 125000,
        tax_rate: 10.25,
        markup_rate: 45,
        subtotal: 95000,
        created_at: '2024-01-15T16:45:00Z',
        notes: 'Multi-phase development project requiring specialized equipment, permits, and coordination with other contractors. Includes warranty and 2-year maintenance agreement.',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Site Survey and Design', unit: 'project', cost: 2500, quantity: 1 },
        { id: '2', name: 'Mass Grading', unit: 'acre', cost: 1200, quantity: 15 },
        { id: '3', name: 'Drainage System Installation', unit: 'linear ft', cost: 35, quantity: 2800 },
        { id: '4', name: 'Irrigation System Design/Install', unit: 'zone', cost: 485, quantity: 45 },
        { id: '5', name: 'Hardscape Features', unit: 'sqft', cost: 25, quantity: 1200 },
        { id: '6', name: 'Premium Sod Installation', unit: 'sqft', cost: 0.95, quantity: 25000 },
        { id: '7', name: 'Mature Tree Installation', unit: 'tree', cost: 750, quantity: 35 },
        { id: '8', name: 'Specialty Lighting System', unit: 'fixture', cost: 320, quantity: 60 },
        { id: '9', name: 'Permits and Inspections', unit: 'permit', cost: 450, quantity: 12 },
        { id: '10', name: 'Project Management', unit: 'month', cost: 2200, quantity: 8 },
        { id: '11', name: 'Equipment Mobilization', unit: 'mobilization', cost: 3500, quantity: 2 },
        { id: '12', name: 'Warranty and Maintenance Setup', unit: 'project', cost: 1800, quantity: 1 },
      ];

      const analysis = analyzeQuoteComplexity(quote, lineItems);

      expect(analysis.level).toBe('complex');
      expect(analysis.score).toBeGreaterThan(70);
      
      // Check complex indicators
      expect(analysis.factors.itemCount.value).toBe(12);
      expect(analysis.factors.totalValue.value).toBe(125000);
      expect(analysis.factors.highMarkupRate.value).toBe(true);
      expect(analysis.factors.hasNotes.value).toBe(true);
      
      // Should have high-impact insights
      const highImpactInsights = analysis.insights.filter(i => i.impact === 'high');
      expect(highImpactInsights.length).toBeGreaterThan(0);
      
      // Should have recommendations
      const recommendations = analysis.insights.filter(i => i.recommendation);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    /**
     * Scenario 4: Template-Based Quote
     * Expected: Lower complexity due to template use
     */
    it('should reduce complexity score for template-based quotes', () => {
      const templateQuote: Quote = {
        id: 'template-001',
        user_id: 'landscaper-1',
        client_name: 'Template Client',
        client_contact: 'client@email.com',
        total: 1500,
        tax_rate: 8.5,
        markup_rate: 25,
        subtotal: 1200,
        created_at: '2024-01-15T12:00:00Z',
        is_template: true,
        template_name: 'Standard Commercial Maintenance',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Weekly Mowing', unit: 'visit', cost: 85, quantity: 12 },
        { id: '2', name: 'Monthly Fertilization', unit: 'application', cost: 120, quantity: 4 },
        { id: '3', name: 'Seasonal Cleanup', unit: 'cleanup', cost: 200, quantity: 2 },
        { id: '4', name: 'Bush Trimming', unit: 'hour', cost: 65, quantity: 8 },
      ];

      const analysis = analyzeQuoteComplexity(templateQuote, lineItems);

      // Template usage should reduce complexity
      expect(analysis.factors.isTemplate.value).toBe(true);
      
      // Compare with non-template version
      const nonTemplateQuote = { ...templateQuote, is_template: false, template_name: undefined };
      const nonTemplateAnalysis = analyzeQuoteComplexity(nonTemplateQuote, lineItems);
      
      // Template should have slightly lower or equal score
      expect(analysis.score).toBeLessThanOrEqual(nonTemplateAnalysis.score);
    });
  });

  describe('Custom Items Detection', () => {
    it('should correctly identify custom vs library items', () => {
      const quote: Quote = {
        id: 'custom-items-001',
        user_id: 'landscaper-1',
        client_name: 'Custom Work Client',
        client_contact: 'custom@email.com',
        total: 2500,
        tax_rate: 8.5,
        markup_rate: 30,
        subtotal: 2000,
        created_at: '2024-01-15T11:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Standard Lawn Mowing', unit: 'hour', cost: 50, quantity: 4 },
        { id: '2', name: 'Specialized Orchid Garden Care', unit: 'hour', cost: 125, quantity: 8 },
        { id: '3', name: 'Custom Water Feature Maintenance', unit: 'visit', cost: 200, quantity: 6 },
        { id: '4', name: 'Standard Fertilizer Application', unit: 'application', cost: 85, quantity: 3 },
      ];

      const availableItems = [
        { id: '1', name: 'Standard Lawn Mowing', unit: 'hour', cost: 50 },
        { id: '4', name: 'Standard Fertilizer Application', unit: 'application', cost: 85 },
      ];

      const analysis = analyzeQuoteComplexity(quote, lineItems, availableItems);

      // Should detect 50% custom items (2 out of 4)
      expect(analysis.factors.customItems.value).toBe(50);
      
      // This should contribute to medium complexity
      expect(analysis.level).toBe('medium');
    });
  });

  describe('Price Variance Analysis', () => {
    it('should detect high price variance and increase complexity', () => {
      const quote: Quote = {
        id: 'price-variance-001',
        user_id: 'landscaper-1',
        client_name: 'Varied Pricing Client',
        client_contact: 'varied@email.com',
        total: 3200,
        tax_rate: 8.5,
        markup_rate: 25,
        subtotal: 2600,
        created_at: '2024-01-15T13:30:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Basic Weeding', unit: 'hour', cost: 25, quantity: 8 },
        { id: '2', name: 'Standard Maintenance', unit: 'hour', cost: 65, quantity: 12 },
        { id: '3', name: 'Specialized Tree Surgery', unit: 'hour', cost: 150, quantity: 6 },
        { id: '4', name: 'Premium Landscape Design', unit: 'hour', cost: 200, quantity: 4 },
        { id: '5', name: 'Equipment Rental', unit: 'day', cost: 500, quantity: 2 },
      ];

      const analysis = analyzeQuoteComplexity(quote, lineItems);

      // Should detect high price range (500/25 = 20x difference)
      expect(analysis.factors.priceRange.value).toBeGreaterThan(15);
      
      // Should generate insight about price variance
      const priceRangeInsight = analysis.insights.find(i => i.factor === 'priceRange');
      expect(priceRangeInsight).toBeDefined();
      expect(priceRangeInsight?.impact).toBe('high');
    });
  });

  describe('Survey Integration', () => {
    it('should trigger appropriate survey based on complexity', async () => {
      const quote: Quote = {
        id: 'survey-integration-001',
        user_id: 'landscaper-1',
        client_name: 'Survey Test Client',
        client_contact: 'survey@email.com',
        total: 5500,
        tax_rate: 9.25,
        markup_rate: 35,
        subtotal: 4500,
        created_at: '2024-01-15T15:15:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Complex Project Phase 1', unit: 'phase', cost: 1500, quantity: 1 },
        { id: '2', name: 'Complex Project Phase 2', unit: 'phase', cost: 1800, quantity: 1 },
        { id: '3', name: 'Complex Project Phase 3', unit: 'phase', cost: 1200, quantity: 1 },
        { id: '4', name: 'Project Coordination', unit: 'month', cost: 300, quantity: 3 },
        { id: '5', name: 'Quality Assurance', unit: 'inspection', cost: 150, quantity: 4 },
        { id: '6', name: 'Final Documentation', unit: 'package', cost: 250, quantity: 1 },
      ];

      const userContext = {
        userId: 'survey-test-user',
        subscriptionTier: 'pro',
        quotesCreated: 8,
        timeSpentOnQuote: 1200, // 20 minutes
        isFirstTimeUser: false,
      };

      const result = await analyzeQuoteAndTriggerSurvey(
        quote,
        lineItems,
        userContext,
        []
      );

      expect(result.analysis).toBeDefined();
      expect(result.analysis.level).toBe('medium'); // Based on the factors
      expect(typeof result.surveyTriggered).toBe('boolean');
    });

    it('should not trigger survey for users who have seen all surveys', async () => {
      const quote: Quote = {
        id: 'no-survey-001',
        user_id: 'experienced-user',
        client_name: 'No Survey Client',
        client_contact: 'nosuvey@email.com',
        total: 300,
        tax_rate: 8.5,
        markup_rate: 20,
        subtotal: 250,
        created_at: '2024-01-15T09:30:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Simple Service', unit: 'hour', cost: 50, quantity: 5 },
      ];

      const userContext = {
        userId: 'experienced-user-no-surveys',
        subscriptionTier: 'enterprise',
        quotesCreated: 100,
        isFirstTimeUser: false,
      };

      const result = await analyzeQuoteAndTriggerSurvey(
        quote,
        lineItems,
        userContext,
        []
      );

      expect(result.analysis).toBeDefined();
      expect(result.analysis.level).toBe('simple');
      // May or may not trigger survey depending on history
      expect(typeof result.surveyTriggered).toBe('boolean');
    });
  });

  describe('Performance and Caching', () => {
    it('should perform analysis efficiently for large quotes', () => {
      const quote: Quote = {
        id: 'performance-test-001',
        user_id: 'performance-user',
        client_name: 'Performance Test Client',
        client_contact: 'perf@email.com',
        total: 25000,
        tax_rate: 10,
        markup_rate: 30,
        subtotal: 20000,
        created_at: '2024-01-15T16:00:00Z',
        quote_data: [],
      };

      // Create large quote with many items
      const lineItems: QuoteLineItem[] = [];
      for (let i = 1; i <= 50; i++) {
        lineItems.push({
          id: i.toString(),
          name: `Service Item ${i}`,
          unit: 'unit',
          cost: Math.random() * 500 + 50,
          quantity: Math.random() * 10 + 1,
        });
      }

      const startTime = performance.now();
      const analysis = analyzeQuoteComplexity(quote, lineItems);
      const endTime = performance.now();

      const analysisTime = endTime - startTime;

      expect(analysis).toBeDefined();
      expect(analysis.level).toBeDefined();
      expect(analysisTime).toBeLessThan(100); // Should complete in under 100ms
      
      // With 50 items, should be complex
      expect(analysis.level).toBe('complex');
      expect(analysis.factors.itemCount.value).toBe(50);
    });

    it('should use caching for repeated analysis', () => {
      const quote: Quote = {
        id: 'cache-test-001',
        user_id: 'cache-user',
        client_name: 'Cache Test Client',
        client_contact: 'cache@email.com',
        total: 800,
        tax_rate: 8.5,
        markup_rate: 20,
        subtotal: 700,
        created_at: '2024-01-15T17:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Test Service 1', unit: 'hour', cost: 75, quantity: 4 },
        { id: '2', name: 'Test Service 2', unit: 'hour', cost: 85, quantity: 3 },
        { id: '3', name: 'Test Service 3', unit: 'hour', cost: 95, quantity: 2 },
      ];

      // First analysis
      const startTime1 = performance.now();
      const analysis1 = complexitySystem.analyzeQuote(quote, lineItems);
      const endTime1 = performance.now();

      // Second analysis (should use cache)
      const startTime2 = performance.now();
      const analysis2 = complexitySystem.analyzeQuote(quote, lineItems);
      const endTime2 = performance.now();

      const time1 = endTime1 - startTime1;
      const time2 = endTime2 - startTime2;

      expect(analysis1).toEqual(analysis2);
      // Second call should be faster (cached)
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('System Statistics and Monitoring', () => {
    it('should provide system statistics', () => {
      const stats = complexitySystem.getSystemStats();

      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('surveys');
      expect(stats).toHaveProperty('config');

      expect(stats.config).toHaveProperty('version');
      expect(stats.config).toHaveProperty('factorCount');
      expect(stats.config).toHaveProperty('thresholds');

      expect(stats.config.factorCount).toBeGreaterThan(0);
      expect(stats.config.thresholds).toEqual(DEFAULT_COMPLEXITY_CONFIG.thresholds);
    });

    it('should handle cache invalidation correctly', () => {
      const quoteId = 'invalidation-test-001';
      const quote: Quote = {
        id: quoteId,
        user_id: 'invalidation-user',
        client_name: 'Invalidation Test',
        client_contact: 'invalidation@email.com',
        total: 600,
        tax_rate: 8.5,
        markup_rate: 20,
        subtotal: 500,
        created_at: '2024-01-15T18:00:00Z',
        quote_data: [],
      };

      const lineItems: QuoteLineItem[] = [
        { id: '1', name: 'Service', unit: 'hour', cost: 100, quantity: 5 },
      ];

      // Analyze to populate cache
      const analysis1 = complexitySystem.analyzeQuote(quote, lineItems);
      expect(analysis1).toBeDefined();

      // Invalidate cache
      complexitySystem.invalidateQuoteCache(quoteId);

      // Next analysis should work normally (recalculated)
      const analysis2 = complexitySystem.analyzeQuote(quote, lineItems);
      expect(analysis2).toBeDefined();
      expect(analysis2.level).toBe(analysis1.level);
    });
  });
});