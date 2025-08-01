/**
 * Integration test for billing history API
 * Tests the /api/billing-history endpoint
 */

import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/billing-history/route';

// Mock Supabase client
jest.mock('@/libs/supabase/supabase-server-client', () => ({
  createSupabaseServerClient: jest.fn(),
}));

// Mock Stripe admin
jest.mock('@/libs/stripe/stripe-admin', () => ({
  stripeAdmin: {
    invoices: {
      list: jest.fn(),
    },
  },
}));

// Mock get-or-create-customer
jest.mock('@/features/account/controllers/get-or-create-customer', () => ({
  getOrCreateCustomerForUser: jest.fn(),
  userNeedsStripeCustomer: jest.fn(),
}));

const mockSupabaseClient = require('@/libs/supabase/supabase-server-client').createSupabaseServerClient;
const mockStripeAdmin = require('@/libs/stripe/stripe-admin').stripeAdmin;
const mockGetOrCreateCustomer = require('@/features/account/controllers/get-or-create-customer').getOrCreateCustomerForUser;
const mockUserNeedsStripeCustomer = require('@/features/account/controllers/get-or-create-customer').userNeedsStripeCustomer;

// Mock invoice data
const mockStripeInvoices = {
  data: [
    {
      id: 'in_test123',
      created: 1640995200, // 2022-01-01
      amount_paid: 2999,
      status: 'paid',
      hosted_invoice_url: 'https://invoice.stripe.com/in_test123',
      description: 'Pro Plan Subscription',
      lines: {
        data: [
          {
            description: 'Pro Plan Subscription',
          },
        ],
      },
    },
    {
      id: 'in_test456',
      created: 1638316800, // 2021-12-01
      amount_paid: 2999,
      status: 'paid',
      hosted_invoice_url: 'https://invoice.stripe.com/in_test456',
      description: null,
      lines: {
        data: [
          {
            description: 'Monthly Subscription',
          },
        ],
      },
    },
  ],
};

describe('/api/billing-history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns billing history for authenticated user with paid subscription', async () => {
      // Mock authenticated user
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user123', email: 'test@example.com' } },
            error: null,
          }),
        },
      };
      mockSupabaseClient.mockResolvedValue(mockSupabase);

      // Mock user needs Stripe customer
      mockUserNeedsStripeCustomer.mockResolvedValue(true);

      // Mock customer exists
      mockGetOrCreateCustomer.mockResolvedValue('cus_test123');

      // Mock Stripe invoices
      mockStripeAdmin.invoices.list.mockResolvedValue(mockStripeInvoices);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/billing-history',
      });

      await GET(req);

      const response = await res._getJSONData();
      
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toMatchObject({
        id: 'in_test123',
        amount: 2999,
        status: 'paid',
        description: 'Pro Plan Subscription',
      });
      expect(response.pagination).toMatchObject({
        total: 2,
        limit: 50,
        offset: 0,
        hasMore: false,
      });
    });

    it('returns empty array for free plan users', async () => {
      // Mock authenticated user
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user123', email: 'test@example.com' } },
            error: null,
          }),
        },
      };
      mockSupabaseClient.mockResolvedValue(mockSupabase);

      // Mock user doesn't need Stripe customer (free plan)
      mockUserNeedsStripeCustomer.mockResolvedValue(false);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/billing-history',
      });

      await GET(req);

      const response = await res._getJSONData();
      
      expect(response.data).toEqual([]);
      expect(response.message).toBe('No billing history available for free plan users');
    });

    it('handles query parameters correctly', async () => {
      // Mock authenticated user
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user123', email: 'test@example.com' } },
            error: null,
          }),
        },
      };
      mockSupabaseClient.mockResolvedValue(mockSupabase);

      mockUserNeedsStripeCustomer.mockResolvedValue(true);
      mockGetOrCreateCustomer.mockResolvedValue('cus_test123');
      mockStripeAdmin.invoices.list.mockResolvedValue(mockStripeInvoices);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/billing-history?limit=10&offset=5&status=paid',
      });

      await GET(req);

      // Verify Stripe was called with correct parameters
      expect(mockStripeAdmin.invoices.list).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          limit: 11, // limit + 1 to check hasMore
          status: 'paid',
        })
      );
    });

    it('returns 401 for unauthenticated users', async () => {
      // Mock unauthenticated user
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };
      mockSupabaseClient.mockResolvedValue(mockSupabase);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/billing-history',
      });

      await GET(req);

      expect(res._getStatusCode()).toBe(401);
      const response = await res._getJSONData();
      expect(response.error).toBe('Authentication required');
    });

    it('handles Stripe API errors gracefully', async () => {
      // Mock authenticated user
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user123', email: 'test@example.com' } },
            error: null,
          }),
        },
      };
      mockSupabaseClient.mockResolvedValue(mockSupabase);

      mockUserNeedsStripeCustomer.mockResolvedValue(true);
      mockGetOrCreateCustomer.mockResolvedValue('cus_test123');

      // Mock Stripe error
      mockStripeAdmin.invoices.list.mockRejectedValue(new Error('Stripe API error'));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/billing-history',
      });

      await GET(req);

      expect(res._getStatusCode()).toBe(500);
      const response = await res._getJSONData();
      expect(response.error).toBe('Failed to retrieve billing history from Stripe');
    });

    it('handles customer creation errors', async () => {
      // Mock authenticated user
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user123', email: 'test@example.com' } },
            error: null,
          }),
        },
      };
      mockSupabaseClient.mockResolvedValue(mockSupabase);

      mockUserNeedsStripeCustomer.mockResolvedValue(true);
      mockGetOrCreateCustomer.mockRejectedValue(new Error('Customer creation failed'));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/billing-history',
      });

      await GET(req);

      expect(res._getStatusCode()).toBe(500);
      const response = await res._getJSONData();
      expect(response.error).toBe('Failed to retrieve customer information');
    });
  });

  describe('POST', () => {
    it('handles refresh request successfully', async () => {
      // Mock authenticated user
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user123', email: 'test@example.com' } },
            error: null,
          }),
        },
      };
      mockSupabaseClient.mockResolvedValue(mockSupabase);

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/billing-history',
      });

      await POST(req);

      const response = await res._getJSONData();
      expect(response.success).toBe(true);
      expect(response.message).toBe('Billing history cache refreshed');
    });

    it('returns 401 for unauthenticated refresh request', async () => {
      // Mock unauthenticated user
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };
      mockSupabaseClient.mockResolvedValue(mockSupabase);

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/billing-history',
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(401);
      const response = await res._getJSONData();
      expect(response.error).toBe('Authentication required');
    });
  });
});
