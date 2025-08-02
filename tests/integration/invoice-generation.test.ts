/**
 * Invoice Generation Integration Test
 * Tests the invoice generation functionality and billing history integration
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
  invoiceItems: {
    create: jest.fn(),
  },
  subscriptions: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
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

// Import the functions we're testing
import {
  configureAutomaticInvoices,
  generateManualInvoice,
  generateSubscriptionInvoice,
  getUpcomingInvoicePreview,
  syncInvoiceToDatabase,
  configureSubscriptionInvoicing,
} from '@/features/billing/controllers/invoice-generation';

import { getBillingHistory } from '@/features/billing/api/billing-history';

describe('Invoice Generation Integration Tests', () => {
  const mockUserId = 'user_test_123';
  const mockCustomerId = 'cus_test_123';
  const mockSubscriptionId = 'sub_test_123';
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('configureAutomaticInvoices', () => {
    it('should configure automatic invoice generation for a customer', async () => {
      // Setup
      mockStripe.customers.update.mockResolvedValue({
        id: mockCustomerId,
        invoice_settings: {
          default_payment_method: null,
          custom_fields: [],
          rendering_options: {
            amount_tax_display: 'include_inclusive_tax'
          }
        },
        tax_exempt: 'none',
      });

      // Execute
      await configureAutomaticInvoices(mockCustomerId);

      // Verify
      expect(mockStripe.customers.update).toHaveBeenCalledWith(mockCustomerId, {
        invoice_settings: {
          default_payment_method: undefined,
          custom_fields: [],
          rendering_options: {
            amount_tax_display: 'include_inclusive_tax'
          }
        },
        tax_exempt: 'none',
      });
    });

    it('should handle errors when configuring automatic invoices', async () => {
      // Setup
      const error = new Error('Stripe API error');
      mockStripe.customers.update.mockRejectedValue(error);

      // Execute & Verify
      await expect(configureAutomaticInvoices(mockCustomerId)).rejects.toThrow('Stripe API error');
    });
  });

  describe('generateManualInvoice', () => {
    it('should create a manual invoice with price items', async () => {
      // Setup
      const mockInvoiceItem = {
        id: 'ii_test_123',
        customer: mockCustomerId,
        price: 'price_test_123',
        quantity: 1,
      };

      const mockInvoice = {
        id: mockInvoiceId,
        number: 'INV-001',
        status: 'open',
        amount_due: 1200,
        amount_paid: 0,
        currency: 'usd',
        created: 1640995200,
        due_date: null,
        hosted_invoice_url: 'https://invoice.stripe.com/test',
        invoice_pdf: 'https://invoice.stripe.com/test.pdf',
        description: 'Test invoice',
        customer: mockCustomerId,
        subscription: null,
      };

      const mockFinalizedInvoice = {
        ...mockInvoice,
        status: 'paid',
        amount_paid: 1200,
      };

      mockStripe.invoiceItems.create.mockResolvedValue(mockInvoiceItem);
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoices.finalizeInvoice.mockResolvedValue(mockFinalizedInvoice);

      const items = [
        {
          price: 'price_test_123',
          quantity: 1,
          description: 'Test service',
        }
      ];

      // Execute
      const result = await generateManualInvoice(mockCustomerId, items, {
        description: 'Test invoice',
        autoAdvance: true,
      });

      // Verify
      expect(mockStripe.invoiceItems.create).toHaveBeenCalledWith({
        customer: mockCustomerId,
        price: 'price_test_123',
        quantity: 1,
        description: 'Test service',
      });

      expect(mockStripe.invoices.create).toHaveBeenCalledWith({
        customer: mockCustomerId,
        description: 'Test invoice',
        metadata: {},
        auto_advance: true,
        collection_method: 'charge_automatically',
        days_until_due: undefined,
      });

      expect(mockStripe.invoices.finalizeInvoice).toHaveBeenCalledWith(mockInvoiceId);

      expect(result).toEqual({
        id: mockInvoiceId,
        number: 'INV-001',
        status: 'paid',
        amount_due: 1200,
        amount_paid: 1200,
        currency: 'usd',
        created: 1640995200,
        due_date: null,
        hosted_invoice_url: 'https://invoice.stripe.com/test',
        invoice_pdf: 'https://invoice.stripe.com/test.pdf',
        description: 'Test invoice',
        customer: mockCustomerId,
        subscription: null,
      });
    });

    it('should create a manual invoice with custom amount items', async () => {
      // Setup
      const mockInvoiceItem = {
        id: 'ii_test_123',
        customer: mockCustomerId,
        amount: 2500,
        currency: 'usd',
      };

      const mockInvoice = {
        id: mockInvoiceId,
        number: 'INV-002',
        status: 'paid',
        amount_due: 2500,
        amount_paid: 2500,
        currency: 'usd',
        created: 1640995200,
        due_date: null,
        hosted_invoice_url: 'https://invoice.stripe.com/test',
        invoice_pdf: 'https://invoice.stripe.com/test.pdf',
        description: 'Custom charge invoice',
        customer: mockCustomerId,
        subscription: null,
      };

      mockStripe.invoiceItems.create.mockResolvedValue(mockInvoiceItem);
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoices.finalizeInvoice.mockResolvedValue(mockInvoice);

      const items = [
        {
          amount: 2500,
          currency: 'usd',
          description: 'Custom service charge',
        }
      ];

      // Execute
      const result = await generateManualInvoice(mockCustomerId, items, {
        description: 'Custom charge invoice',
      });

      // Verify
      expect(mockStripe.invoiceItems.create).toHaveBeenCalledWith({
        customer: mockCustomerId,
        amount: 2500,
        currency: 'usd',
        description: 'Custom service charge',
      });

      expect(result.amount_due).toBe(2500);
      expect(result.description).toBe('Custom charge invoice');
    });
  });

  describe('generateSubscriptionInvoice', () => {
    it('should create an invoice for a subscription', async () => {
      // Setup
      const mockSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
      };

      const mockInvoice = {
        id: mockInvoiceId,
        number: 'INV-003',
        status: 'paid',
        amount_due: 1200,
        amount_paid: 1200,
        currency: 'usd',
        created: 1640995200,
        due_date: null,
        hosted_invoice_url: 'https://invoice.stripe.com/test',
        invoice_pdf: 'https://invoice.stripe.com/test.pdf',
        description: `Invoice for subscription ${mockSubscriptionId}`,
        customer: mockCustomerId,
        subscription: mockSubscriptionId,
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoices.finalizeInvoice.mockResolvedValue(mockInvoice);

      // Execute
      const result = await generateSubscriptionInvoice(mockSubscriptionId);

      // Verify
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith(mockSubscriptionId);

      expect(mockStripe.invoices.create).toHaveBeenCalledWith({
        customer: mockCustomerId,
        subscription: mockSubscriptionId,
        description: `Invoice for subscription ${mockSubscriptionId}`,
        metadata: {
          subscription_id: mockSubscriptionId,
        },
        auto_advance: true,
        collection_method: 'charge_automatically',
      });

      expect(result.subscription).toBe(mockSubscriptionId);
      expect(result.customer).toBe(mockCustomerId);
    });

    it('should handle subscription not found error', async () => {
      // Setup
      mockStripe.subscriptions.retrieve.mockResolvedValue(null);

      // Execute & Verify
      await expect(generateSubscriptionInvoice(mockSubscriptionId))
        .rejects.toThrow(`Subscription ${mockSubscriptionId} not found`);
    });
  });

  describe('getUpcomingInvoicePreview', () => {
    it('should retrieve upcoming invoice preview', async () => {
      // Setup
      const mockUpcomingInvoice = {
        id: 'in_upcoming_123',
        number: null,
        status: null,
        amount_due: 1200,
        amount_paid: 0,
        currency: 'usd',
        created: 1640995200,
        due_date: null,
        hosted_invoice_url: null,
        invoice_pdf: null,
        description: 'Upcoming invoice',
        customer: mockCustomerId,
        subscription: mockSubscriptionId,
        period_start: 1640995200,
        period_end: 1643673600,
      };

      mockStripe.invoices.retrieveUpcoming.mockResolvedValue(mockUpcomingInvoice);

      // Execute
      const result = await getUpcomingInvoicePreview(mockCustomerId, mockSubscriptionId);

      // Verify
      expect(mockStripe.invoices.retrieveUpcoming).toHaveBeenCalledWith({
        customer: mockCustomerId,
        subscription: mockSubscriptionId,
      });

      expect(result).toEqual({
        id: 'in_upcoming_123',
        number: null,
        status: 'draft',
        amount_due: 1200,
        amount_paid: 0,
        currency: 'usd',
        created: 1640995200,
        due_date: null,
        hosted_invoice_url: null,
        invoice_pdf: null,
        description: 'Upcoming invoice',
        customer: mockCustomerId,
        subscription: mockSubscriptionId,
      });
    });
  });

  describe('syncInvoiceToDatabase', () => {
    it('should sync invoice data to database', async () => {
      // Setup
      const mockInvoice = {
        id: mockInvoiceId,
        number: 'INV-004',
        status: 'paid',
        amount_paid: 1200,
        amount_due: 1200,
        currency: 'usd',
        created: 1640995200,
        description: 'Synced invoice',
        hosted_invoice_url: 'https://invoice.stripe.com/test',
        subscription: mockSubscriptionId,
      };

      mockStripe.invoices.retrieve.mockResolvedValue(mockInvoice);

      // Execute
      await syncInvoiceToDatabase(mockInvoiceId, mockUserId);

      // Verify
      expect(mockStripe.invoices.retrieve).toHaveBeenCalledWith(mockInvoiceId);

      expect(mockSupabase.from).toHaveBeenCalledWith('billing_history');
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        id: mockInvoiceId,
        user_id: mockUserId,
        subscription_id: mockSubscriptionId,
        amount: 1200,
        currency: 'usd',
        status: 'paid',
        description: 'Synced invoice',
        invoice_url: 'https://invoice.stripe.com/test',
        stripe_invoice_id: mockInvoiceId,
        created_at: new Date(1640995200 * 1000).toISOString(),
        updated_at: expect.any(String),
      }, {
        onConflict: 'id'
      });
    });

    it('should handle database sync errors', async () => {
      // Setup
      const mockInvoice = {
        id: mockInvoiceId,
        status: 'paid',
        amount_paid: 1200,
        currency: 'usd',
        created: 1640995200,
      };

      mockStripe.invoices.retrieve.mockResolvedValue(mockInvoice);
      mockSupabase.upsert.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      // Execute & Verify
      await expect(syncInvoiceToDatabase(mockInvoiceId, mockUserId))
        .rejects.toThrow('Failed to sync invoice to database: Database error');
    });
  });

  describe('configureSubscriptionInvoicing', () => {
    it('should configure subscription invoicing settings', async () => {
      // Setup
      const settings = {
        description: 'Monthly subscription',
        metadata: { plan: 'pro' },
        automaticTax: true,
      };

      mockStripe.subscriptions.update.mockResolvedValue({
        id: mockSubscriptionId,
        description: settings.description,
        metadata: settings.metadata,
      });

      // Execute
      await configureSubscriptionInvoicing(mockSubscriptionId, settings);

      // Verify
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(mockSubscriptionId, {
        description: 'Monthly subscription',
        metadata: { plan: 'pro' },
        automatic_tax: {
          enabled: true
        },
        collection_method: 'charge_automatically',
      });
    });
  });

  describe('getBillingHistory Integration', () => {
    beforeEach(() => {
      // Mock the get-or-create-customer function
      jest.doMock('@/features/account/controllers/get-or-create-customer', () => ({
        getOrCreateCustomerForUser: jest.fn().mockResolvedValue(mockCustomerId),
      }));
    });

    it('should prioritize Stripe invoices in billing history', async () => {
      // Setup
      const mockStripeInvoices = [
        {
          id: 'in_stripe_1',
          created: 1640995200,
          amount_paid: 1200,
          status: 'paid',
          hosted_invoice_url: 'https://invoice.stripe.com/1',
          description: 'Stripe Invoice 1',
        },
        {
          id: 'in_stripe_2',
          created: 1640908800,
          amount_paid: 1200,
          status: 'paid',
          hosted_invoice_url: 'https://invoice.stripe.com/2',
          description: 'Stripe Invoice 2',
        }
      ];

      mockStripe.invoices.list.mockResolvedValue({
        data: mockStripeInvoices,
        has_more: false,
      });

      // Execute
      const result = await getBillingHistory(mockUserId, { limit: 10 });

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('in_stripe_1');
      expect(result.data[0].type).toBe('stripe_invoice');
      expect(result.metadata.hasStripeInvoices).toBe(true);
      expect(result.metadata.stripeCustomerId).toBe(mockCustomerId);
    });

    it('should fall back to subscription history when no Stripe invoices exist', async () => {
      // Setup - No Stripe customer
      jest.doMock('@/features/account/controllers/get-or-create-customer', () => ({
        getOrCreateCustomerForUser: jest.fn().mockResolvedValue(null),
      }));

      // Mock subscription data
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

      mockSupabase.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockSubscriptions,
              error: null
            })
          })
        })
      });

      // Execute
      const result = await getBillingHistory(mockUserId, { limit: 10 });

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('sub_sub_1');
      expect(result.data[0].type).toBe('subscription_change');
      expect(result.data[0].description).toBe('Subscription to Pro Plan');
      expect(result.metadata.hasSubscriptionHistory).toBe(true);
    });

    it('should handle billing history API errors gracefully', async () => {
      // Setup
      jest.doMock('@/features/account/controllers/get-or-create-customer', () => ({
        getOrCreateCustomerForUser: jest.fn().mockRejectedValue(new Error('Customer error')),
      }));

      // Execute & Verify
      await expect(getBillingHistory(mockUserId)).rejects.toThrow('Customer error');
    });
  });

  describe('End-to-End Invoice Generation Flow', () => {
    it('should complete full invoice generation and sync workflow', async () => {
      // Setup
      const mockSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
      };

      const mockInvoice = {
        id: mockInvoiceId,
        number: 'INV-E2E',
        status: 'paid',
        amount_due: 1200,
        amount_paid: 1200,
        currency: 'usd',
        created: 1640995200,
        due_date: null,
        hosted_invoice_url: 'https://invoice.stripe.com/e2e',
        invoice_pdf: 'https://invoice.stripe.com/e2e.pdf',
        description: 'End-to-end test invoice',
        customer: mockCustomerId,
        subscription: mockSubscriptionId,
      };

      mockStripe.customers.update.mockResolvedValue({ id: mockCustomerId });
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      mockStripe.subscriptions.update.mockResolvedValue(mockSubscription);
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoices.finalizeInvoice.mockResolvedValue(mockInvoice);
      mockStripe.invoices.retrieve.mockResolvedValue(mockInvoice);

      // Execute full workflow
      // 1. Configure automatic invoices
      await configureAutomaticInvoices(mockCustomerId);

      // 2. Configure subscription invoicing
      await configureSubscriptionInvoicing(mockSubscriptionId, {
        description: 'Pro Plan Subscription',
        metadata: { plan: 'pro', user_id: mockUserId },
      });

      // 3. Generate subscription invoice
      const generatedInvoice = await generateSubscriptionInvoice(mockSubscriptionId);

      // 4. Sync invoice to database
      await syncInvoiceToDatabase(generatedInvoice.id, mockUserId);

      // Verify all steps completed successfully
      expect(mockStripe.customers.update).toHaveBeenCalled();
      expect(mockStripe.subscriptions.update).toHaveBeenCalled();
      expect(mockStripe.invoices.create).toHaveBeenCalled();
      expect(mockStripe.invoices.finalizeInvoice).toHaveBeenCalled();
      expect(mockSupabase.upsert).toHaveBeenCalled();

      expect(generatedInvoice.id).toBe(mockInvoiceId);
      expect(generatedInvoice.status).toBe('paid');
      expect(generatedInvoice.amount_paid).toBe(1200);
    });
  });
});
