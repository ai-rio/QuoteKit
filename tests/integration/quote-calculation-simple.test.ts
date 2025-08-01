/**
 * Simple Quote Calculation Tests - Working Example
 * 
 * This demonstrates the core business logic testing without complex mocks.
 * These tests focus on the pure calculation functions that are the heart of LawnQuote.
 */

import { calculateQuote } from '@/features/quotes/utils';
import { QuoteLineItem } from '@/features/quotes/types';

describe('Quote Calculation Tests (Working)', () => {
  const sampleLineItems: QuoteLineItem[] = [
    {
      id: '1',
      name: 'Lawn Mowing',
      unit: 'sq ft',
      cost: 0.05,
      quantity: 1000,
    },
    {
      id: '2', 
      name: 'Hedge Trimming',
      unit: 'linear ft',
      cost: 2.50,
      quantity: 50,
    },
    {
      id: '3',
      name: 'Fertilizer Application',
      unit: 'application',
      cost: 75.00,
      quantity: 1,
    },
  ];

  describe('Core Business Logic - Quote Calculations', () => {
    test('should calculate quote totals correctly with no tax or markup', () => {
      const result = calculateQuote(sampleLineItems, 0, 0);
      
      // Expected: (0.05 * 1000) + (2.50 * 50) + (75.00 * 1) = 50 + 125 + 75 = 250
      expect(result.subtotal).toBe(250);
      expect(result.markupAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(250);
    });

    test('should calculate quote totals correctly with tax only', () => {
      const result = calculateQuote(sampleLineItems, 8.5, 0);
      
      expect(result.subtotal).toBe(250);
      expect(result.markupAmount).toBe(0);
      expect(result.taxAmount).toBeCloseTo(21.25, 2); // 250 * 0.085
      expect(result.total).toBeCloseTo(271.25, 2);
    });

    test('should calculate quote totals correctly with markup only', () => {
      const result = calculateQuote(sampleLineItems, 0, 20);
      
      expect(result.subtotal).toBe(250);
      expect(result.markupAmount).toBe(50); // 250 * 0.20
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(300);
    });

    test('should calculate quote totals correctly with both tax and markup', () => {
      const result = calculateQuote(sampleLineItems, 8.5, 20);
      
      expect(result.subtotal).toBe(250);
      expect(result.markupAmount).toBe(50); // 250 * 0.20
      expect(result.taxAmount).toBeCloseTo(25.5, 2); // (250 + 50) * 0.085
      expect(result.total).toBeCloseTo(325.5, 2);
    });

    test('should handle edge case with zero quantity items', () => {
      const zeroQuantityItems: QuoteLineItem[] = [
        { id: '1', name: 'Test Item', unit: 'each', cost: 100, quantity: 0 },
        { id: '2', name: 'Valid Item', unit: 'each', cost: 50, quantity: 2 },
      ];

      const result = calculateQuote(zeroQuantityItems, 10, 15);
      
      expect(result.subtotal).toBe(100); // Only the valid item
      expect(result.markupAmount).toBe(15); // 100 * 0.15
      expect(result.taxAmount).toBeCloseTo(11.5, 2); // (100 + 15) * 0.10
      expect(result.total).toBeCloseTo(126.5, 2);
    });

    test('should handle high precision decimal calculations', () => {
      const precisionItems: QuoteLineItem[] = [
        { id: '1', name: 'Precision Item', unit: 'sq ft', cost: 0.333, quantity: 3 },
      ];

      const result = calculateQuote(precisionItems, 7.25, 12.5);
      
      expect(result.subtotal).toBeCloseTo(0.999, 3);
      expect(result.markupAmount).toBeCloseTo(0.124875, 6);
      expect(result.taxAmount).toBeCloseTo(0.0814, 3);
      expect(result.total).toBeCloseTo(1.205275, 3);
    });

    test('should handle large numbers of line items', () => {
      const manyLineItems: QuoteLineItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `Service ${i + 1}`,
        unit: 'each',
        cost: Math.round((Math.random() * 100 + 10) * 100) / 100,
        quantity: Math.floor(Math.random() * 10) + 1,
      }));

      const calculation = calculateQuote(manyLineItems, 8.5, 15);
      
      expect(calculation.subtotal).toBeGreaterThan(0);
      expect(calculation.total).toBeGreaterThan(calculation.subtotal);
      expect(calculation.markupAmount).toBeCloseTo(calculation.subtotal * 0.15, 2);
      expect(calculation.taxAmount).toBeCloseTo((calculation.subtotal + calculation.markupAmount) * 0.085, 2);
    });

    test('should handle zero-cost items', () => {
      const freeItems: QuoteLineItem[] = [
        { id: '1', name: 'Free Consultation', unit: 'hour', cost: 0, quantity: 1 },
        { id: '2', name: 'Paid Service', unit: 'hour', cost: 100, quantity: 2 },
      ];

      const calculation = calculateQuote(freeItems, 10, 20);
      
      expect(calculation.subtotal).toBe(200);
      expect(calculation.markupAmount).toBe(40);
      expect(calculation.taxAmount).toBe(24);
      expect(calculation.total).toBe(264);
    });
  });

  describe('Real-World Business Scenarios', () => {
    test('should handle typical lawn care quote', () => {
      const lawnCareQuote: QuoteLineItem[] = [
        { id: '1', name: 'Weekly Mowing', unit: 'visit', cost: 45, quantity: 4 }, // Monthly
        { id: '2', name: 'Edge Trimming', unit: 'visit', cost: 15, quantity: 4 },
        { id: '3', name: 'Leaf Blowing', unit: 'visit', cost: 10, quantity: 4 },
        { id: '4', name: 'Fertilizer', unit: 'application', cost: 85, quantity: 1 },
      ];

      const result = calculateQuote(lawnCareQuote, 8.25, 25); // 8.25% tax, 25% markup
      
      // Expected subtotal: (45*4) + (15*4) + (10*4) + (85*1) = 180 + 60 + 40 + 85 = 365
      expect(result.subtotal).toBe(365);
      expect(result.markupAmount).toBe(91.25); // 365 * 0.25
      expect(result.taxAmount).toBeCloseTo(37.64, 2); // (365 + 91.25) * 0.0825
      expect(result.total).toBeCloseTo(493.89, 2);
    });

    test('should handle commercial landscaping quote', () => {
      const commercialQuote: QuoteLineItem[] = [
        { id: '1', name: 'Large Area Mowing', unit: 'sq ft', cost: 0.02, quantity: 50000 },
        { id: '2', name: 'Tree Trimming', unit: 'tree', cost: 150, quantity: 12 },
        { id: '3', name: 'Mulch Installation', unit: 'cubic yard', cost: 45, quantity: 25 },
        { id: '4', name: 'Irrigation Check', unit: 'zone', cost: 25, quantity: 8 },
      ];

      const result = calculateQuote(commercialQuote, 9.5, 30); // Higher rates for commercial
      
      // Expected subtotal: (0.02*50000) + (150*12) + (45*25) + (25*8) = 1000 + 1800 + 1125 + 200 = 4125
      expect(result.subtotal).toBe(4125);
      expect(result.markupAmount).toBe(1237.5); // 4125 * 0.30
      expect(result.taxAmount).toBeCloseTo(509.44, 2); // (4125 + 1237.5) * 0.095
      expect(result.total).toBeCloseTo(5871.94, 2);
    });

    test('should handle seasonal cleanup quote', () => {
      const seasonalQuote: QuoteLineItem[] = [
        { id: '1', name: 'Leaf Removal', unit: 'hour', cost: 55, quantity: 6 },
        { id: '2', name: 'Gutter Cleaning', unit: 'linear ft', cost: 3.50, quantity: 200 },
        { id: '3', name: 'Debris Hauling', unit: 'load', cost: 125, quantity: 2 },
        { id: '4', name: 'Winter Prep', unit: 'flat rate', cost: 200, quantity: 1 },
      ];

      const result = calculateQuote(seasonalQuote, 7.5, 20);
      
      // Expected subtotal: (55*6) + (3.50*200) + (125*2) + (200*1) = 330 + 700 + 250 + 200 = 1480
      expect(result.subtotal).toBe(1480);
      expect(result.markupAmount).toBe(296); // 1480 * 0.20
      expect(result.taxAmount).toBeCloseTo(133.2, 2); // (1480 + 296) * 0.075
      expect(result.total).toBeCloseTo(1909.2, 2);
    });
  });

  describe('Edge Cases and Error Prevention', () => {
    test('should handle empty line items array', () => {
      const result = calculateQuote([], 8.5, 20);
      
      expect(result.subtotal).toBe(0);
      expect(result.markupAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(0);
    });

    test('should handle negative quantities (should not happen in UI but test for safety)', () => {
      const negativeItems: QuoteLineItem[] = [
        { id: '1', name: 'Normal Item', unit: 'each', cost: 50, quantity: 2 },
        { id: '2', name: 'Negative Item', unit: 'each', cost: 30, quantity: -1 },
      ];

      const result = calculateQuote(negativeItems, 10, 15);
      
      // Should handle negative quantities in calculation
      expect(result.subtotal).toBe(70); // (50*2) + (30*-1) = 100 - 30 = 70
      expect(result.markupAmount).toBe(10.5); // 70 * 0.15
      expect(result.taxAmount).toBeCloseTo(8.05, 2); // (70 + 10.5) * 0.10
      expect(result.total).toBeCloseTo(88.55, 2);
    });

    test('should handle very small costs', () => {
      const microCosts: QuoteLineItem[] = [
        { id: '1', name: 'Micro Service', unit: 'sq ft', cost: 0.001, quantity: 10000 },
      ];

      const result = calculateQuote(microCosts, 8.5, 12.5);
      
      expect(result.subtotal).toBe(10);
      expect(result.markupAmount).toBe(1.25);
      expect(result.taxAmount).toBeCloseTo(0.95625, 5);
      expect(result.total).toBeCloseTo(12.20625, 5);
    });
  });
});

// Export for use in other tests
export { sampleLineItems };
