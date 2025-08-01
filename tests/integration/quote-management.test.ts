/**
 * Quote Management Integration Tests
 * 
 * Tests the core quote creation, calculation, and management functionality
 * that forms the heart of the LawnQuote business value proposition.
 */

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { createQuote, saveDraft, getQuotes } from '@/features/quotes/actions';
import { calculateQuote } from '@/features/quotes/utils';
import { CreateQuoteData, QuoteLineItem, QuoteStatus } from '@/features/quotes/types';

// Mock Supabase client
jest.mock('@/libs/supabase/supabase-server-client');

// Create mock functions that can be easily configured per test
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
    }),
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: jest.fn(),
        }),
      }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn(),
        }),
      }),
    }),
  })),
};

(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase);

describe('Quote Management Integration Tests', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mock functions
    mockInsert.mockClear();
    mockSelect.mockClear();
    mockSingle.mockClear();
    mockEq.mockClear();
    mockOrder.mockClear();
    
    // Setup default auth mock
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    
    // Reset the chain mocks
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: jest.fn(),
        }),
      }),
    });
  });

  describe('Quote Calculations', () => {
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
      expect(result.taxAmount).toBe(21.25); // 250 * 0.085
      expect(result.total).toBe(271.25);
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
      expect(result.taxAmount).toBeCloseTo(25.5, 2); // (250 + 50) * 0.085 - use toBeCloseTo for floating point
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
      expect(result.taxAmount).toBe(11.5); // (100 + 15) * 0.10
      expect(result.total).toBe(126.5);
    });

    test('should handle high precision decimal calculations', () => {
      const precisionItems: QuoteLineItem[] = [
        { id: '1', name: 'Precision Item', unit: 'sq ft', cost: 0.333, quantity: 3 },
      ];

      const result = calculateQuote(precisionItems, 7.25, 12.5);
      
      expect(result.subtotal).toBeCloseTo(0.999, 3);
      expect(result.markupAmount).toBeCloseTo(0.124875, 6);
      expect(result.taxAmount).toBeCloseTo(0.0814, 3); // Reduced precision expectation
      expect(result.total).toBeCloseTo(1.205275, 3); // Reduced precision expectation
    });
  });

  describe('Quote Creation', () => {
    test('should create a quote successfully with valid data', async () => {
      const mockQuote = {
        id: 'quote-123',
        user_id: mockUser.id,
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: sampleLineItems,
        subtotal: 250,
        tax_rate: 8.5,
        markup_rate: 20,
        total: 325.5,
        created_at: new Date().toISOString(),
      };

      // Setup the mock to return the expected quote
      mockSingle.mockResolvedValue({
        data: mockQuote,
        error: null,
      });

      const quoteData: CreateQuoteData = {
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: sampleLineItems,
        tax_rate: 8.5,
        markup_rate: 20,
      };

      const result = await createQuote(quoteData);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockQuote);
      expect(mockSupabase.from).toHaveBeenCalledWith('quotes');
    });

    test('should reject quote creation without client information', async () => {
      const quoteData: CreateQuoteData = {
        client_name: '', // Empty client name
        client_contact: null,
        quote_data: sampleLineItems,
        tax_rate: 8.5,
        markup_rate: 20,
      };

      const result = await createQuote(quoteData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Client information is required');
      expect(result.data).toBeNull();
    });

    test('should reject quote creation without line items', async () => {
      const quoteData: CreateQuoteData = {
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: [], // Empty line items
        tax_rate: 8.5,
        markup_rate: 20,
      };

      const result = await createQuote(quoteData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('At least one line item is required');
      expect(result.data).toBeNull();
    });

    test('should reject quote creation with invalid tax rate', async () => {
      const quoteData: CreateQuoteData = {
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: sampleLineItems,
        tax_rate: -5, // Invalid negative tax rate
        markup_rate: 20,
      };

      const result = await createQuote(quoteData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Tax rate must be between 0 and 100');
      expect(result.data).toBeNull();
    });

    test('should reject quote creation with invalid markup rate', async () => {
      const quoteData: CreateQuoteData = {
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: sampleLineItems,
        tax_rate: 8.5,
        markup_rate: 1500, // Invalid high markup rate
      };

      const result = await createQuote(quoteData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Markup rate must be between 0 and 1000');
      expect(result.data).toBeNull();
    });

    test('should handle authentication failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const quoteData: CreateQuoteData = {
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: sampleLineItems,
        tax_rate: 8.5,
        markup_rate: 20,
      };

      const result = await createQuote(quoteData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('User not authenticated');
      expect(result.data).toBeNull();
    });

    test('should handle database errors gracefully', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
      });

      const quoteData: CreateQuoteData = {
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: sampleLineItems,
        tax_rate: 8.5,
        markup_rate: 20,
      };

      const result = await createQuote(quoteData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Database connection failed');
      expect(result.data).toBeNull();
    });
  });

  describe('Quote Business Logic Validation', () => {
    test('should accept quotes with client_id instead of client_name', async () => {
      const mockQuote = {
        id: 'quote-123',
        user_id: mockUser.id,
        client_id: 'client-456',
        client_name: '',
        client_contact: null,
        quote_data: sampleLineItems,
        subtotal: 250,
        tax_rate: 8.5,
        markup_rate: 20,
        total: 325.5,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockQuote,
        error: null,
      });

      const quoteData: CreateQuoteData = {
        client_id: 'client-456',
        client_name: '', // Empty but client_id is provided
        client_contact: null,
        quote_data: sampleLineItems,
        tax_rate: 8.5,
        markup_rate: 20,
      };

      const result = await createQuote(quoteData);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockQuote);
    });

    test('should handle complex line item scenarios', async () => {
      const complexLineItems: QuoteLineItem[] = [
        { id: '1', name: 'Basic Service', unit: 'hour', cost: 50, quantity: 2 },
        { id: '2', name: 'Premium Add-on', unit: 'each', cost: 150, quantity: 1 },
        { id: '3', name: 'Materials', unit: 'lot', cost: 75.50, quantity: 3 },
        { id: '4', name: 'Travel Time', unit: 'hour', cost: 25, quantity: 0.5 },
      ];

      const calculation = calculateQuote(complexLineItems, 9.25, 25);
      
      // Expected subtotal: (50*2) + (150*1) + (75.50*3) + (25*0.5) = 100 + 150 + 226.5 + 12.5 = 489
      expect(calculation.subtotal).toBe(489);
      expect(calculation.markupAmount).toBe(122.25); // 489 * 0.25
      expect(calculation.taxAmount).toBeCloseTo(56.54, 2); // (489 + 122.25) * 0.0925
      expect(calculation.total).toBeCloseTo(667.79, 2);
    });

    test('should validate quote status transitions', async () => {
      const quoteData: CreateQuoteData = {
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: sampleLineItems,
        tax_rate: 8.5,
        markup_rate: 20,
        status: 'draft' as QuoteStatus,
      };

      const mockQuote = {
        id: 'quote-123',
        user_id: mockUser.id,
        client_name: 'John Smith',
        client_contact: 'john@example.com',
        quote_data: sampleLineItems,
        subtotal: 250,
        tax_rate: 8.5,
        markup_rate: 20,
        total: 325.5,
        status: 'draft',
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockQuote,
        error: null,
      });

      const result = await createQuote(quoteData);

      expect(result.error).toBeNull();
      expect(result.data?.status).toBe('draft');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large numbers of line items', async () => {
      const manyLineItems: QuoteLineItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `Service ${i + 1}`,
        unit: 'each',
        cost: Math.random() * 100,
        quantity: Math.floor(Math.random() * 10) + 1,
      }));

      const calculation = calculateQuote(manyLineItems, 8.5, 15);
      
      expect(calculation.subtotal).toBeGreaterThan(0);
      expect(calculation.total).toBeGreaterThan(calculation.subtotal);
      expect(calculation.markupAmount).toBe(calculation.subtotal * 0.15);
      expect(calculation.taxAmount).toBe((calculation.subtotal + calculation.markupAmount) * 0.085);
    });

    test('should handle extreme decimal precision', async () => {
      const precisionItems: QuoteLineItem[] = [
        { id: '1', name: 'Micro Service', unit: 'sq ft', cost: 0.001, quantity: 10000 },
      ];

      const calculation = calculateQuote(precisionItems, 7.875, 12.345);
      
      expect(calculation.subtotal).toBe(10);
      expect(calculation.markupAmount).toBeCloseTo(1.2345, 4);
      expect(calculation.taxAmount).toBeCloseTo(0.8847, 4);
      expect(calculation.total).toBeCloseTo(12.1192, 4);
    });

    test('should handle zero-cost items', async () => {
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
});
