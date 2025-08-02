/**
 * Enhanced Billing History Integration Test
 * Tests the production-ready billing history functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Stripe before importing anything else
const mockStripe = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    list: jest.fn(),
  },
  invoices: {
    create: jest.fn(),
    retrieve: jest.fn(),
    list: jest.fn(),
    finalizeInvoice: jest.fn(),
    retrieveUpcoming: jest.fn(),
  },
};

// Mock Stripe constructor
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

// Mock Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@/libs/supabase/supabase-server-client', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue(mockSupabase),
}));

// Mock the stripe admin client
jest.mock('@/libs/stripe/stripe-admin', () => ({
  stripeAdmin: mockStripe,
}));

// Mock the get-or-create-customer function
jest.mock('@/features/account/controllers/get-or-create-customer', () => ({
  getOrCreateCustomerForUser: jest.fn(),
}));

// Import the functions we're testing
import {
  getEnhancedBillingHistory,
  hasRealBillingActivity,
  getProductionBillingSummary,
} from '@/features/billing/api/enhanced-billing-history';

import { getOrCreateCustomerForUser } from '@/features/account/controllers/get-or-create-customer';

describe('Enhanced Billing History Integration Tests', () => {
  const mockUserId = 'user_test_123';
  const mockCustomerId = 'cus_test_123';
  const mockInvoiceId = 'in_test_123';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock responses
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId, email: 'test@example.com' } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.upsert.mockResolvedValue({ data: null, error: null });
    
    // Mock range to return resolved value
    mockSupabase.range.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEnhancedBillingHistory', () => {
    it('should prioritize Stripe invoices in production mode', async () => {
      // Setup
      const mockStripeInvoices = [
        {
          id: 'in_stripe_1',
          created: 1640995200,
          amount_paid: 1200,
          amount_due: 1200,
          status: 'paid',
          hosted_invoice_url: 'https://invoice.stripe.com/1',
          description: 'Stripe Invoice 1',
          subscription: 'sub_123',
          payment_intent: 'pi_123',
          lines: { data: [] }
        },
        {
          id: 'in_stripe_2',
          created: 1640908800,
          amount_paid: 1200,
          amount_due: 1200,
          status: 'paid',
          hosted_invoice_url: 'https://invoice.stripe.com/2',
          description: 'Stripe Invoice 2',
          subscription: 'sub_124',
          payment_intent: 'pi_124',
          lines: { data: [] }
        }
      ];

      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(mockCustomerId);
      mockStripe.invoices.list.mockResolvedValue({
        data: mockStripeInvoices,
        has_more: false,
      });

      // Execute
      const result = await getEnhancedBillingHistory(mockUserId, { 
        limit: 10,
        productionMode: true
      });

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('in_stripe_1');
      expect(result.data[0].type).toBe('stripe_invoice');
      expect(result.metadata.hasStripeInvoices).toBe(true);
      expect(result.metadata.hasSubscriptionHistory).toBe(false);
      expect(result.metadata.isProductionMode).toBe(true);
      expect(result.metadata.message).toContain('real Stripe invoices');
    });

    it('should fall back to billing records when no Stripe invoices exist', async () => {
      // Setup - No Stripe customer
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(null);

      // Mock billing records
      const mockBillingRecords = [
        {
          id: 'bill_1',
          created_at: '2024-01-01T00:00:00Z',
          amount: 1200,
          status: 'paid',
          description: 'Billing Record 1',
          invoice_url: 'https://example.com/invoice1',
          stripe_invoice_id: null,
          subscription_id: 'sub_1'
        }
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockBillingRecords,
        error: null
      });

      // Execute
      const result = await getEnhancedBillingHistory(mockUserId, { 
        limit: 10,
        productionMode: true
      });

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('bill_1');
      expect(result.data[0].type).toBe('billing_record');
      expect(result.metadata.hasStripeInvoices).toBe(false);
      expect(result.metadata.hasBillingRecords).toBe(true);
      expect(result.metadata.message).toContain('billing records');
    });

    it('should show subscription history only in development mode', async () => {
      // Setup - No Stripe customer, no billing records
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(null);

      // First call to billing_history returns empty
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Second call to subscriptions returns data
      const mockSubscriptions = [
        {
          id: 'sub_1',
          created: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          status: 'active',
          stripe_price_id: 'price_test',
          prices: {
            unit_amount: 1200,
            interval: 'month',
            products: { name: 'Pro Plan' }
          }
        }
      ];

      mockSupabase.range.mockResolvedValueOnce({
        data: mockSubscriptions,
        error: null
      });

      // Execute in development mode
      const result = await getEnhancedBillingHistory(mockUserId, { 
        limit: 10,
        productionMode: false,
        includeSubscriptionHistory: true
      });

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('sub_sub_1');
      expect(result.data[0].type).toBe('subscription_change');
      expect(result.metadata.hasSubscriptionHistory).toBe(true);
      expect(result.metadata.isProductionMode).toBe(false);
      expect(result.metadata.message).toContain('Development mode');
    });

    it('should not show subscription history in production mode', async () => {
      // Setup - No Stripe customer, no billing records
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(null);

      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null
      });

      // Execute in production mode
      const result = await getEnhancedBillingHistory(mockUserId, { 
        limit: 10,
        productionMode: true,
        includeSubscriptionHistory: true // Should be ignored in production
      });

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.metadata.hasStripeInvoices).toBe(false);
      expect(result.metadata.hasSubscriptionHistory).toBe(false);
      expect(result.metadata.hasBillingRecords).toBe(false);
      expect(result.metadata.isProductionMode).toBe(true);
      expect(result.metadata.message).toContain('No billing history available');
    });

    it('should handle Stripe API errors gracefully', async () => {
      // Setup
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(mockCustomerId);
      mockStripe.invoices.list.mockRejectedValue(new Error('Stripe API error'));

      // Mock empty billing records as fallback
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null
      });

      // Execute
      const result = await getEnhancedBillingHistory(mockUserId, { 
        limit: 10,
        productionMode: true
      });

      // Verify - should fall back gracefully
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.metadata.hasStripeInvoices).toBe(false);
    });

    it('should apply status filters correctly', async () => {
      // Setup
      const mockStripeInvoices = [
        {
          id: 'in_paid',
          created: 1640995200,
          amount_paid: 1200,
          amount_due: 1200,
          status: 'paid',
          hosted_invoice_url: 'https://invoice.stripe.com/paid',
          description: 'Paid Invoice',
          lines: { data: [] }
        }
      ];

      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(mockCustomerId);
      mockStripe.invoices.list.mockResolvedValue({
        data: mockStripeInvoices,
        has_more: false,
      });

      // Execute with status filter
      const result = await getEnhancedBillingHistory(mockUserId, { 
        limit: 10,
        statusFilter: 'paid',
        productionMode: true
      });

      // Verify
      expect(mockStripe.invoices.list).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: mockCustomerId,
          status: 'paid'
        })
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('paid');
    });

    it('should apply date filters correctly', async () => {
      // Setup
      const fromDate = '2024-01-01T00:00:00Z';
      const toDate = '2024-12-31T23:59:59Z';

      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(mockCustomerId);
      mockStripe.invoices.list.mockResolvedValue({
        data: [],
        has_more: false,
      });

      // Execute with date filters
      await getEnhancedBillingHistory(mockUserId, { 
        limit: 10,
        fromDate,
        toDate,
        productionMode: true
      });

      // Verify
      expect(mockStripe.invoices.list).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: mockCustomerId,
          created: {
            gte: Math.floor(new Date(fromDate).getTime() / 1000),
            lte: Math.floor(new Date(toDate).getTime() / 1000)
          }
        })
      );
    });
  });

  describe('hasRealBillingActivity', () => {
    it('should return true when user has Stripe invoices', async () => {
      // Setup
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(mockCustomerId);
      mockStripe.invoices.list.mockResolvedValue({
        data: [{ id: 'in_test', status: 'paid' }],
        has_more: false,
      });

      // Execute
      const result = await hasRealBillingActivity(mockUserId);

      // Verify
      expect(result).toBe(true);
    });

    it('should return true when user has billing records', async () => {
      // Setup
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(null);
      mockSupabase.range.mockResolvedValue({
        data: [{ id: 'bill_1', status: 'paid' }],
        error: null
      });

      // Execute
      const result = await hasRealBillingActivity(mockUserId);

      // Verify
      expect(result).toBe(true);
    });

    it('should return false when user has no real billing activity', async () => {
      // Setup
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(null);
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null
      });

      // Execute
      const result = await hasRealBillingActivity(mockUserId);

      // Verify
      expect(result).toBe(false);
    });
  });

  describe('getProductionBillingSummary', () => {
    it('should calculate billing summary from real data only', async () => {
      // Setup
      const mockStripeInvoices = [
        {
          id: 'in_paid_1',
          created: 1640995200,
          amount_paid: 1200,
          amount_due: 1200,
          status: 'paid',
          hosted_invoice_url: 'https://invoice.stripe.com/1',
          description: 'Paid Invoice 1',
          lines: { data: [] }
        },
        {
          id: 'in_pending_1',
          created: 1640908800,
          amount_paid: 0,
          amount_due: 800,
          status: 'open',
          hosted_invoice_url: 'https://invoice.stripe.com/2',
          description: 'Pending Invoice 1',
          lines: { data: [] }
        }
      ];

      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(mockCustomerId);
      mockStripe.invoices.list.mockResolvedValue({
        data: mockStripeInvoices,
        has_more: false,
      });

      // Execute
      const result = await getProductionBillingSummary(mockUserId);

      // Verify
      expect(result.hasRealData).toBe(true);
      expect(result.totalInvoices).toBe(2);
      expect(result.totalPaid).toBe(1200);
      expect(result.totalPending).toBe(800);
      expect(result.lastInvoiceDate).toBeDefined();
    });

    it('should return empty summary when no real data exists', async () => {
      // Setup
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(null);
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null
      });

      // Execute
      const result = await getProductionBillingSummary(mockUserId);

      // Verify
      expect(result.hasRealData).toBe(false);
      expect(result.totalInvoices).toBe(0);
      expect(result.totalPaid).toBe(0);
      expect(result.totalPending).toBe(0);
    });
  });

  describe('Enhanced Metadata', () => {
    it('should provide comprehensive metadata about billing data sources', async () => {
      // Setup
      (getOrCreateCustomerForUser as jest.Mock).mockResolvedValue(mockCustomerId);
      mockStripe.invoices.list.mockResolvedValue({
        data: [{ 
          id: 'in_test', 
          status: 'paid',
          created: 1640995200,
          amount_paid: 1200,
          lines: { data: [] }
        }],
        has_more: false,
      });

      // Execute
      const result = await getEnhancedBillingHistory(mockUserId, { 
        productionMode: true 
      });

      // Verify metadata
      expect(result.metadata).toEqual(
        expect.objectContaining({
          stripeCustomerId: mockCustomerId,
          hasStripeInvoices: true,
          hasSubscriptionHistory: false,
          hasBillingRecords: false,
          isProductionMode: true,
          timestamp: expect.any(String),
          message: expect.stringContaining('real Stripe invoices')
        })
      );
    });
  });
});
