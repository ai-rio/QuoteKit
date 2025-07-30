/**
 * Integration tests for Manual Subscription Sync Functionality
 * Tests the complete sync flow between Stripe and local database
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { POST as manualSyncHandler } from '@/app/api/sync-my-subscription/route';
import { POST as debugSyncHandler } from '@/app/api/debug/subscription-sync/route';
import { createMockRequest, createMockStripeSubscription, createMockUser } from '../helpers/test-utils';
import { createMockSupabaseClient } from '../helpers/supabase-mocks';
import { createMockStripeClient } from '../helpers/stripe-mocks';

describe('Manual Subscription Sync Integration Tests', () => {
  let mockSupabase: any;
  let mockStripe: any;
  let mockUser: any;

  beforeEach(() => {
    mockUser = createMockUser();
    mockSupabase = createMockSupabaseClient();
    mockStripe = createMockStripeClient();

    // Mock authentication
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    // Mock Stripe configuration
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admin_settings') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              value: {
                secret_key: 'sk_test_123',
                mode: 'test'
              }
            }
          })
        };
      }
      if (table === 'stripe_customers') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { stripe_customer_id: 'cus_test123' }
          })
        };
      }
      if (table === 'subscriptions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis()
        };
      }
      return mockSupabase.mockTable;
    });

    // Mock Stripe modules
    jest.doMock('@/libs/stripe/stripe-admin', () => ({
      createStripeAdminClient: jest.fn(() => mockStripe),
      stripeAdmin: mockStripe
    }));

    jest.doMock('@/libs/supabase/supabase-admin', () => ({
      supabaseAdminClient: mockSupabase
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Manual Sync API Endpoint', () => {
    it('should sync user subscription from Stripe successfully', async () => {
      // Mock Stripe subscription data
      const stripeSubscription = createMockStripeSubscription({
        id: 'sub_stripe123',
        customer: 'cus_test123',
        status: 'active'
      });

      mockStripe.subscriptions.list.mockResolvedValue({
        data: [stripeSubscription],
        has_more: false
      });

      // Mock no existing subscription in local DB
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            ...mockSupabase.mockTable,
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            }),
            upsert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toContain('synchronized');

      // Verify Stripe API was called
      expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        status: 'all',
        limit: 100
      });

      // Verify subscription was upserted
      expect(mockSupabase.from('subscriptions').upsert).toHaveBeenCalled();
    });

    it('should handle user without Stripe customer', async () => {
      // Mock no customer mapping
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'stripe_customers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toContain('No Stripe customer');
    });

    it('should handle Stripe API errors gracefully', async () => {
      mockStripe.subscriptions.list.mockRejectedValue(
        new Error('Stripe API Error: Customer not found')
      );

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Stripe API Error');
    });

    it('should sync multiple subscriptions for a customer', async () => {
      // Mock multiple Stripe subscriptions
      const subscriptions = [
        createMockStripeSubscription({
          id: 'sub_active',
          status: 'active'
        }),
        createMockStripeSubscription({
          id: 'sub_canceled',
          status: 'canceled'
        }),
        createMockStripeSubscription({
          id: 'sub_past_due',
          status: 'past_due'
        })
      ];

      mockStripe.subscriptions.list.mockResolvedValue({
        data: subscriptions,
        has_more: false
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(3);

      // Verify all subscriptions were processed
      expect(mockSupabase.from('subscriptions').upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('Debug Sync Endpoint', () => {
    it('should provide detailed sync information', async () => {
      const stripeSubscription = createMockStripeSubscription();
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [stripeSubscription],
        has_more: false
      });

      // Mock existing local subscription
      const localSubscription = {
        id: stripeSubscription.id,
        user_id: mockUser.id,
        status: 'active',
        last_synced: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            ...mockSupabase.mockTable,
            single: jest.fn().mockResolvedValue({
              data: localSubscription,
              error: null
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await debugSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.debug).toBeDefined();
      expect(result.debug.stripeData).toHaveLength(1);
      expect(result.debug.localData).toBeDefined();
      expect(result.debug.discrepancies).toBeDefined();
    });

    it('should identify data discrepancies', async () => {
      const stripeSubscription = createMockStripeSubscription({
        status: 'past_due'
      });

      mockStripe.subscriptions.list.mockResolvedValue({
        data: [stripeSubscription],
        has_more: false
      });

      // Mock local subscription with different status
      const localSubscription = {
        id: stripeSubscription.id,
        user_id: mockUser.id,
        status: 'active', // Different from Stripe
        stripe_price_id: 'price_different' // Different price
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            ...mockSupabase.mockTable,
            single: jest.fn().mockResolvedValue({
              data: localSubscription,
              error: null
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await debugSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.debug.discrepancies).toHaveLength(2); // Status and price differences
      expect(result.debug.discrepancies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'status',
            stripe: 'past_due',
            local: 'active'
          }),
          expect.objectContaining({
            field: 'stripe_price_id'
          })
        ])
      );
    });
  });

  describe('Sync Data Consistency', () => {
    it('should maintain referential integrity during sync', async () => {
      const stripeSubscription = createMockStripeSubscription();
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [stripeSubscription],
        has_more: false
      });

      // Mock price lookup
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'stripe_prices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                stripe_price_id: stripeSubscription.items.data[0].price.id,
                active: true
              },
              error: null
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Verify price was validated
      expect(mockSupabase.from('stripe_prices').select).toHaveBeenCalled();
    });

    it('should handle missing price references', async () => {
      const stripeSubscription = createMockStripeSubscription();
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [stripeSubscription],
        has_more: false
      });

      // Mock missing price
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'stripe_prices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Price not found in local database');
    });
  });

  describe('Sync Performance', () => {
    it('should handle large numbers of subscriptions efficiently', async () => {
      // Create 100 mock subscriptions
      const subscriptions = Array.from({ length: 100 }, (_, i) =>
        createMockStripeSubscription({
          id: `sub_${i.toString().padStart(3, '0')}`
        })
      );

      mockStripe.subscriptions.list.mockResolvedValue({
        data: subscriptions,
        has_more: false
      });

      const startTime = Date.now();
      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const endTime = Date.now();

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle pagination for large result sets', async () => {
      // Mock paginated response
      const firstPage = Array.from({ length: 100 }, (_, i) =>
        createMockStripeSubscription({ id: `sub_page1_${i}` })
      );
      const secondPage = Array.from({ length: 50 }, (_, i) =>
        createMockStripeSubscription({ id: `sub_page2_${i}` })
      );

      mockStripe.subscriptions.list
        .mockResolvedValueOnce({
          data: firstPage,
          has_more: true
        })
        .mockResolvedValueOnce({
          data: secondPage,
          has_more: false
        });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(150);
      expect(mockStripe.subscriptions.list).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    it('should continue sync after partial failures', async () => {
      const subscriptions = [
        createMockStripeSubscription({ id: 'sub_success1' }),
        createMockStripeSubscription({ id: 'sub_fail' }),
        createMockStripeSubscription({ id: 'sub_success2' })
      ];

      mockStripe.subscriptions.list.mockResolvedValue({
        data: subscriptions,
        has_more: false
      });

      // Mock failure for middle subscription
      let upsertCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            ...mockSupabase.mockTable,
            upsert: jest.fn().mockImplementation(() => {
              upsertCallCount++;
              if (upsertCallCount === 2) {
                return Promise.resolve({
                  data: null,
                  error: { message: 'Database constraint violation' }
                });
              }
              return Promise.resolve({ data: {}, error: null });
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('sub_fail');
    });

    it('should provide detailed error information', async () => {
      mockStripe.subscriptions.list.mockRejectedValue({
        type: 'StripeInvalidRequestError',
        code: 'customer_not_found',
        message: 'No such customer: cus_invalid'
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain('customer_not_found');
      expect(result.errorDetails).toBeDefined();
      expect(result.errorDetails.type).toBe('StripeInvalidRequestError');
    });
  });

  describe('Sync Audit Trail', () => {
    it('should log sync operations for audit purposes', async () => {
      const stripeSubscription = createMockStripeSubscription();
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [stripeSubscription],
        has_more: false
      });

      // Mock sync log table
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'sync_audit_log') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Verify audit log entry was created
      expect(mockSupabase.from('sync_audit_log').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          sync_type: 'manual',
          records_processed: 1,
          records_synced: 1,
          sync_status: 'completed'
        })
      );
    });

    it('should track sync frequency to prevent abuse', async () => {
      // Mock recent sync log entries
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'sync_audit_log') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            count: jest.fn().mockResolvedValue({
              data: [{ count: 5 }], // 5 syncs in recent period
              error: null
            }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await manualSyncHandler(request);
      const result = await response.json();

      expect(response.status).toBe(429); // Rate limited
      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });
  });
});