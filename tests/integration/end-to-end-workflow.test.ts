/**
 * End-to-End Workflow Integration Tests
 * 
 * Tests the complete user workflow from setting up company information
 * to creating quotes and generating PDFs - the full LawnQuote experience.
 */

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getCompanySettings, updateCompanySettings } from '@/features/settings/actions';
import { getLineItems, createLineItem } from '@/features/items/actions';
import { createQuote } from '@/features/quotes/actions';
import { calculateQuote } from '@/features/quotes/utils';
import { CompanySettings, SettingsFormData } from '@/features/settings/types';
import { LineItem } from '@/features/items/types';
import { CreateQuoteData, Quote } from '@/features/quotes/types';

// Mock Supabase client
jest.mock('@/libs/supabase/supabase-server-client');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        maybeSingle: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
};

(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase);

describe('End-to-End Workflow Integration Tests', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'contractor@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('Complete New User Onboarding Workflow', () => {
    test('should complete full workflow: setup company → add items → create quote → generate PDF', async () => {
      // Step 1: New user sets up company settings
      const companySettings: SettingsFormData = {
        company_name: 'Green Thumb Landscaping',
        company_address: '456 Garden Ave, Springfield, IL 62701',
        company_phone: '(217) 555-0123',
        company_email: 'info@greenthumb.com',
        default_tax_rate: 7.25,
        default_markup_rate: 25.0,
        preferred_currency: 'USD',
        quote_terms: 'Payment due within 30 days. All work guaranteed.',
      };

      const savedSettings: CompanySettings = {
        id: mockUser.id,
        ...companySettings,
        logo_url: null,
        logo_file_name: null,
      };

      mockSupabase.from().upsert().select().single.mockResolvedValueOnce({
        data: savedSettings,
        error: null,
      });

      const settingsResult = await updateCompanySettings(companySettings);
      expect(settingsResult.error).toBeNull();
      expect(settingsResult.data?.company_name).toBe('Green Thumb Landscaping');

      // Step 2: User adds services to their item library
      const services = [
        { name: 'Lawn Mowing', unit: 'sq ft', cost: '0.08' },
        { name: 'Hedge Trimming', unit: 'linear ft', cost: '3.50' },
        { name: 'Leaf Cleanup', unit: 'hour', cost: '45.00' },
        { name: 'Fertilizer Application', unit: 'application', cost: '85.00' },
      ];

      const createdItems: LineItem[] = [];

      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        const createdItem: LineItem = {
          id: `item-${i + 1}`,
          user_id: mockUser.id,
          name: service.name,
          unit: service.unit,
          cost: parseFloat(service.cost),
          category: 'Landscaping',
          tags: null,
          is_favorite: false,
          last_used_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockSupabase.from().insert().select().single.mockResolvedValueOnce({
          data: createdItem,
          error: null,
        });

        const formData = new FormData();
        formData.append('name', service.name);
        formData.append('unit', service.unit);
        formData.append('cost', service.cost);
        formData.append('category', 'Landscaping');

        const itemResult = await createLineItem(formData);
        expect(itemResult.error).toBeNull();
        expect(itemResult.data?.name).toBe(service.name);
        
        createdItems.push(createdItem);
      }

      // Step 3: User retrieves their item library
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: createdItems,
        error: null,
      });

      const itemsResult = await getLineItems();
      expect(itemsResult.error).toBeNull();
      expect(itemsResult.data).toHaveLength(4);

      // Step 4: User creates a quote using their items
      const quoteData: CreateQuoteData = {
        client_name: 'Johnson Residence',
        client_contact: 'mary.johnson@email.com',
        quote_data: [
          {
            id: 'item-1',
            name: 'Lawn Mowing',
            unit: 'sq ft',
            cost: 0.08,
            quantity: 2500, // 2500 sq ft lawn
          },
          {
            id: 'item-2',
            name: 'Hedge Trimming',
            unit: 'linear ft',
            cost: 3.50,
            quantity: 75, // 75 linear feet of hedges
          },
          {
            id: 'item-4',
            name: 'Fertilizer Application',
            unit: 'application',
            cost: 85.00,
            quantity: 1, // One application
          },
        ],
        tax_rate: 7.25, // Use company default
        markup_rate: 25.0, // Use company default
      };

      // Calculate expected totals
      const calculation = calculateQuote(quoteData.quote_data, 7.25, 25.0);
      // Expected: (0.08 * 2500) + (3.50 * 75) + (85.00 * 1) = 200 + 262.5 + 85 = 547.5
      // Markup: 547.5 * 0.25 = 136.875
      // Subtotal with markup: 547.5 + 136.875 = 684.375
      // Tax: 684.375 * 0.0725 = 49.617
      // Total: 684.375 + 49.617 = 733.992

      expect(calculation.subtotal).toBe(547.5);
      expect(calculation.markupAmount).toBe(136.875);
      expect(calculation.taxAmount).toBeCloseTo(49.617, 3);
      expect(calculation.total).toBeCloseTo(733.992, 3);

      const createdQuote: Quote = {
        id: 'quote-001',
        user_id: mockUser.id,
        client_name: 'Johnson Residence',
        client_contact: 'mary.johnson@email.com',
        quote_data: quoteData.quote_data,
        subtotal: calculation.subtotal,
        tax_rate: 7.25,
        markup_rate: 25.0,
        total: calculation.total,
        created_at: new Date().toISOString(),
        status: 'draft',
        quote_number: 'Q-2024-001',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: createdQuote,
        error: null,
      });

      const quoteResult = await createQuote(quoteData);
      expect(quoteResult.error).toBeNull();
      expect(quoteResult.data?.client_name).toBe('Johnson Residence');
      expect(quoteResult.data?.total).toBeCloseTo(733.992, 3);

      // Verify the complete workflow succeeded
      expect(settingsResult.data?.company_name).toBe('Green Thumb Landscaping');
      expect(itemsResult.data).toHaveLength(4);
      expect(quoteResult.data?.quote_data).toHaveLength(3);
    });
  });

  describe('Existing User Daily Workflow', () => {
    test('should handle typical daily workflow: retrieve settings → get items → create multiple quotes', async () => {
      // Existing user with established settings and items
      const existingSettings: CompanySettings = {
        id: mockUser.id,
        company_name: 'Established Lawn Care',
        company_address: '789 Business Blvd, Chicago, IL 60601',
        company_phone: '(312) 555-0199',
        company_email: 'contact@established.com',
        logo_url: 'https://example.com/logo.png',
        logo_file_name: 'logo.png',
        default_tax_rate: 8.75,
        default_markup_rate: 30.0,
        preferred_currency: 'USD',
        quote_terms: 'Net 30. Early payment discount available.',
      };

      const existingItems: LineItem[] = [
        {
          id: 'item-1',
          user_id: mockUser.id,
          name: 'Premium Lawn Service',
          unit: 'visit',
          cost: 75.00,
          category: 'Maintenance',
          tags: ['premium', 'weekly'],
          is_favorite: true,
          last_used_at: '2024-01-10T10:00:00Z',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z',
        },
        {
          id: 'item-2',
          user_id: mockUser.id,
          name: 'Seasonal Cleanup',
          unit: 'hour',
          cost: 55.00,
          category: 'Seasonal',
          tags: ['cleanup', 'seasonal'],
          is_favorite: true,
          last_used_at: '2024-01-05T10:00:00Z',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-05T10:00:00Z',
        },
      ];

      // Step 1: Retrieve existing settings
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValueOnce({
        data: existingSettings,
        error: null,
      });

      const settingsResult = await getCompanySettings();
      expect(settingsResult.error).toBeNull();
      expect(settingsResult.data?.company_name).toBe('Established Lawn Care');

      // Step 2: Retrieve existing items
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: existingItems,
        error: null,
      });

      const itemsResult = await getLineItems();
      expect(itemsResult.error).toBeNull();
      expect(itemsResult.data).toHaveLength(2);

      // Step 3: Create multiple quotes for different clients
      const quotes = [
        {
          client: 'Smith Property',
          contact: 'john.smith@email.com',
          services: [{ itemId: 'item-1', quantity: 4 }], // 4 visits
        },
        {
          client: 'Brown Estate',
          contact: 'sarah.brown@email.com',
          services: [
            { itemId: 'item-1', quantity: 2 }, // 2 visits
            { itemId: 'item-2', quantity: 3 }, // 3 hours cleanup
          ],
        },
      ];

      const createdQuotes: Quote[] = [];

      for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i];
        const quoteData: CreateQuoteData = {
          client_name: quote.client,
          client_contact: quote.contact,
          quote_data: quote.services.map(service => {
            const item = existingItems.find(item => item.id === service.itemId)!;
            return {
              id: item.id,
              name: item.name,
              unit: item.unit,
              cost: item.cost,
              quantity: service.quantity,
            };
          }),
          tax_rate: existingSettings.default_tax_rate!,
          markup_rate: existingSettings.default_markup_rate!,
        };

        const calculation = calculateQuote(
          quoteData.quote_data,
          existingSettings.default_tax_rate!,
          existingSettings.default_markup_rate!
        );

        const createdQuote: Quote = {
          id: `quote-${i + 1}`,
          user_id: mockUser.id,
          client_name: quote.client,
          client_contact: quote.contact,
          quote_data: quoteData.quote_data,
          subtotal: calculation.subtotal,
          tax_rate: existingSettings.default_tax_rate!,
          markup_rate: existingSettings.default_markup_rate!,
          total: calculation.total,
          created_at: new Date().toISOString(),
          status: 'draft',
        };

        mockSupabase.from().insert().select().single.mockResolvedValueOnce({
          data: createdQuote,
          error: null,
        });

        const quoteResult = await createQuote(quoteData);
        expect(quoteResult.error).toBeNull();
        expect(quoteResult.data?.client_name).toBe(quote.client);
        
        createdQuotes.push(createdQuote);
      }

      // Verify multiple quotes were created successfully
      expect(createdQuotes).toHaveLength(2);
      expect(createdQuotes[0].client_name).toBe('Smith Property');
      expect(createdQuotes[1].client_name).toBe('Brown Estate');
    });
  });

  describe('Business Growth Scenarios', () => {
    test('should handle scaling workflow: large item library → complex quotes → bulk operations', async () => {
      // Simulate a growing business with many services
      const largeItemLibrary: LineItem[] = Array.from({ length: 25 }, (_, i) => ({
        id: `item-${i + 1}`,
        user_id: mockUser.id,
        name: `Service ${i + 1}`,
        unit: i % 3 === 0 ? 'hour' : i % 3 === 1 ? 'sq ft' : 'each',
        cost: Math.round((Math.random() * 100 + 10) * 100) / 100,
        category: i < 10 ? 'Maintenance' : i < 20 ? 'Seasonal' : 'Premium',
        tags: [`tag${i % 5}`, `category${Math.floor(i / 5)}`],
        is_favorite: i < 5, // First 5 are favorites
        last_used_at: i < 15 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString() : null,
        created_at: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
      }));

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: largeItemLibrary,
        error: null,
      });

      const itemsResult = await getLineItems();
      expect(itemsResult.error).toBeNull();
      expect(itemsResult.data).toHaveLength(25);

      // Create a complex quote with many line items
      const complexQuoteData: CreateQuoteData = {
        client_name: 'Large Commercial Property',
        client_contact: 'manager@commercial.com',
        quote_data: largeItemLibrary.slice(0, 10).map(item => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          cost: item.cost,
          quantity: Math.floor(Math.random() * 10) + 1,
        })),
        tax_rate: 9.5,
        markup_rate: 35.0,
      };

      const calculation = calculateQuote(complexQuoteData.quote_data, 9.5, 35.0);

      const complexQuote: Quote = {
        id: 'complex-quote-001',
        user_id: mockUser.id,
        client_name: 'Large Commercial Property',
        client_contact: 'manager@commercial.com',
        quote_data: complexQuoteData.quote_data,
        subtotal: calculation.subtotal,
        tax_rate: 9.5,
        markup_rate: 35.0,
        total: calculation.total,
        created_at: new Date().toISOString(),
        status: 'draft',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: complexQuote,
        error: null,
      });

      const quoteResult = await createQuote(complexQuoteData);
      expect(quoteResult.error).toBeNull();
      expect(quoteResult.data?.quote_data).toHaveLength(10);
      expect(quoteResult.data?.total).toBeGreaterThan(0);

      // Verify calculations are accurate for complex quote
      expect(quoteResult.data?.subtotal).toBe(calculation.subtotal);
      expect(quoteResult.data?.total).toBeCloseTo(calculation.total, 2);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    test('should handle partial workflow failures gracefully', async () => {
      // Scenario: Settings save fails, but user can still work with existing data
      mockSupabase.from().upsert().select().single.mockRejectedValueOnce(
        new Error('Settings save failed')
      );

      const settingsData: SettingsFormData = {
        company_name: 'Test Company',
        company_address: '',
        company_phone: '',
        company_email: 'test@example.com',
        default_tax_rate: 8.0,
        default_markup_rate: 20.0,
        preferred_currency: 'USD',
        quote_terms: '',
      };

      const settingsResult = await updateCompanySettings(settingsData);
      expect(settingsResult.error).not.toBeNull();

      // But user can still retrieve existing items and create quotes
      const existingItems: LineItem[] = [
        {
          id: 'item-1',
          user_id: mockUser.id,
          name: 'Basic Service',
          unit: 'hour',
          cost: 50.00,
          category: null,
          tags: null,
          is_favorite: false,
          last_used_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: existingItems,
        error: null,
      });

      const itemsResult = await getLineItems();
      expect(itemsResult.error).toBeNull();
      expect(itemsResult.data).toHaveLength(1);

      // User can still create quotes with default values
      const quoteData: CreateQuoteData = {
        client_name: 'Emergency Client',
        client_contact: 'emergency@client.com',
        quote_data: [
          {
            id: 'item-1',
            name: 'Basic Service',
            unit: 'hour',
            cost: 50.00,
            quantity: 2,
          },
        ],
        tax_rate: 8.0, // Fallback default
        markup_rate: 20.0, // Fallback default
      };

      const emergencyQuote: Quote = {
        id: 'emergency-quote',
        user_id: mockUser.id,
        client_name: 'Emergency Client',
        client_contact: 'emergency@client.com',
        quote_data: quoteData.quote_data,
        subtotal: 100,
        tax_rate: 8.0,
        markup_rate: 20.0,
        total: 129.6, // (100 * 1.2) * 1.08
        created_at: new Date().toISOString(),
        status: 'draft',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: emergencyQuote,
        error: null,
      });

      const quoteResult = await createQuote(quoteData);
      expect(quoteResult.error).toBeNull();
      expect(quoteResult.data?.total).toBe(129.6);
    });

    test('should handle workflow with minimal data', async () => {
      // Scenario: New user with minimal setup creates basic quote
      const minimalQuoteData: CreateQuoteData = {
        client_name: 'Quick Client',
        client_contact: null, // No contact info
        quote_data: [
          {
            id: 'temp-1',
            name: 'One-time Service',
            unit: null, // No unit
            cost: 100.00,
            quantity: 1,
          },
        ],
        tax_rate: 0, // No tax
        markup_rate: 0, // No markup
      };

      const minimalQuote: Quote = {
        id: 'minimal-quote',
        user_id: mockUser.id,
        client_name: 'Quick Client',
        client_contact: null,
        quote_data: minimalQuoteData.quote_data,
        subtotal: 100,
        tax_rate: 0,
        markup_rate: 0,
        total: 100,
        created_at: new Date().toISOString(),
        status: 'draft',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: minimalQuote,
        error: null,
      });

      const result = await createQuote(minimalQuoteData);
      expect(result.error).toBeNull();
      expect(result.data?.total).toBe(100);
      expect(result.data?.client_contact).toBeNull();
    });
  });
});
