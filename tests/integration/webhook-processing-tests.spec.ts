/**
 * Integration tests for Webhook Event Processing
 * Tests the complete webhook flow from Stripe event to database synchronization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { POST as webhookHandler } from '@/app/api/webhooks/stripe/route';
import { createMockRequest, createMockStripeEvent, createMockSubscription } from '../helpers/test-utils';
import { createMockSupabaseClient } from '../helpers/supabase-mocks';

describe('Webhook Processing Integration Tests', () => {
  let mockSupabase: any;
  let mockStripe: any;
  let mockWebhookEvent: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockStripe = {
      webhooks: {
        constructEvent: jest.fn()
      },
      subscriptions: {
        retrieve: jest.fn()
      },
      checkout: {
        sessions: {
          retrieve: jest.fn()
        }
      }
    };

    // Mock Stripe configuration
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admin_settings') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              value: {
                webhook_secret: 'whsec_test123',
                secret_key: 'sk_test_123',
                mode: 'test'
              }
            }
          })
        };
      }
      if (table === 'stripe_webhook_events') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null // No existing event
          }),
          upsert: jest.fn().mockResolvedValue({ data: {} }),
          update: jest.fn().mockReturnThis()
        };
      }
      if (table === 'stripe_customers') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'user_test123' }
          })
        };
      }
      if (table === 'subscriptions') {
        return {
          upsert: jest.fn().mockResolvedValue({ data: {} }),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis()
        };
      }
      return mockSupabase.mockTable;
    });

    // Mock global modules
    jest.doMock('@/libs/supabase/supabase-admin', () => ({
      supabaseAdminClient: mockSupabase
    }));

    jest.doMock('@/libs/stripe/stripe-admin', () => ({
      createStripeAdminClient: jest.fn(() => mockStripe),
      stripeAdmin: mockStripe
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Webhook Event Validation', () => {
    it('should validate webhook signature correctly', async () => {
      const eventData = createMockStripeEvent('customer.subscription.created');
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        JSON.stringify(eventData),
        'valid_signature',
        'whsec_test123'
      );
    });

    it('should reject webhook with invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = createMockRequest(
        JSON.stringify({}),
        'POST',
        undefined,
        { 'stripe-signature': 'invalid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error).toBe('Invalid signature');
    });

    it('should reject webhook without signature', async () => {
      const request = createMockRequest(JSON.stringify({}), 'POST');

      const response = await webhookHandler(request);
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error).toBe('Missing signature');
    });
  });

  describe('Webhook Event Idempotency', () => {
    it('should handle duplicate webhook events', async () => {
      const eventData = createMockStripeEvent('customer.subscription.created', 'evt_duplicate');
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);

      // Mock existing processed event
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'stripe_webhook_events') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                processed: true,
                processed_at: new Date().toISOString()
              }
            }),
            upsert: jest.fn().mockResolvedValue({ data: {} }),
            update: jest.fn().mockReturnThis()
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.message).toBe('Event already processed');
    });

    it('should store webhook event for idempotency tracking', async () => {
      const eventData = createMockStripeEvent('customer.subscription.created', 'evt_new');
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      await webhookHandler(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('stripe_webhook_events');
      
      // Verify upsert was called with correct data structure
      const upsertCall = mockSupabase.from('stripe_webhook_events').upsert;
      expect(upsertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          stripe_event_id: eventData.id,
          event_type: eventData.type,
          processed: false,
          data: eventData.data
        }),
        expect.objectContaining({
          onConflict: 'stripe_event_id'
        })
      );
    });
  });

  describe('Subscription Event Processing', () => {
    it('should process subscription.created event', async () => {
      const subscriptionData = createMockSubscription();
      const eventData = createMockStripeEvent('customer.subscription.created', 'evt_sub_created');
      eventData.data.object = subscriptionData;

      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscriptionData);

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);

      // Verify subscription upsert was called
      expect(mockSupabase.from('subscriptions').upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: subscriptionData.id,
            user_id: 'user_test123',
            status: subscriptionData.status,
            stripe_price_id: subscriptionData.items.data[0].price.id
          })
        ])
      );
    });

    it('should process subscription.updated event', async () => {
      const subscriptionData = createMockSubscription({
        status: 'past_due'
      });
      const eventData = createMockStripeEvent('customer.subscription.updated', 'evt_sub_updated');
      eventData.data.object = subscriptionData;

      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscriptionData);

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);

      // Verify subscription update with new status
      expect(mockSupabase.from('subscriptions').upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'past_due'
          })
        ])
      );
    });

    it('should process subscription.deleted event', async () => {
      const subscriptionData = createMockSubscription();
      const eventData = createMockStripeEvent('customer.subscription.deleted', 'evt_sub_deleted');
      eventData.data.object = subscriptionData;

      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);

      // Verify subscription marked as canceled
      expect(mockSupabase.from('subscriptions').update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'canceled',
          ended_at: expect.any(String),
          canceled_at: expect.any(String)
        })
      );
    });
  });

  describe('Checkout Session Processing', () => {
    it('should process checkout.session.completed event', async () => {
      const checkoutSession = {
        id: 'cs_test123',
        customer: 'cus_test123',
        customer_details: { email: 'test@example.com' },
        subscription: 'sub_test123',
        payment_status: 'paid',
        mode: 'subscription'
      };

      const subscriptionData = createMockSubscription({
        id: 'sub_test123',
        customer: 'cus_test123'
      });

      const eventData = createMockStripeEvent('checkout.session.completed', 'evt_checkout');
      eventData.data.object = checkoutSession;

      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        ...checkoutSession,
        subscription: subscriptionData,
        customer: { id: 'cus_test123' }
      });
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscriptionData);

      // Mock user lookup by email
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'user_test123' }
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);

      // Verify customer mapping was created
      expect(mockSupabase.from('stripe_customers').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user_test123',
          stripe_customer_id: 'cus_test123',
          email: 'test@example.com'
        })
      );
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry failed webhook processing', async () => {
      const eventData = createMockStripeEvent('customer.subscription.created');
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);

      // Mock processing failure on first two attempts, success on third
      let attemptCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            upsert: jest.fn().mockImplementation(() => {
              attemptCount++;
              if (attemptCount < 3) {
                throw new Error('Database connection failed');
              }
              return Promise.resolve({ data: {} });
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);
      expect(attemptCount).toBe(3);
    });

    it('should handle permanent processing failures', async () => {
      const eventData = createMockStripeEvent('customer.subscription.created');
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);

      // Mock permanent failure
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            upsert: jest.fn().mockRejectedValue(new Error('Permanent database error'))
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(500);

      // Verify event marked with error
      expect(mockSupabase.from('stripe_webhook_events').update).toHaveBeenCalledWith(
        expect.objectContaining({
          processed: false,
          error_message: expect.stringContaining('Failed after 3 attempts')
        })
      );
    });

    it('should handle missing customer mapping gracefully', async () => {
      const checkoutSession = {
        id: 'cs_test123',
        customer: 'cus_nonexistent',
        customer_details: { email: 'nonexistent@example.com' }
      };

      const eventData = createMockStripeEvent('checkout.session.completed');
      eventData.data.object = checkoutSession;

      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(checkoutSession);

      // Mock user not found
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' }
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Performance Tests', () => {
    it('should process webhooks within acceptable time limits', async () => {
      const eventData = createMockStripeEvent('customer.subscription.created');
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData);

      const request = createMockRequest(
        JSON.stringify(eventData),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const startTime = Date.now();
      const response = await webhookHandler(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent webhook events', async () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        createMockStripeEvent('customer.subscription.updated', `evt_${i}`)
      );

      mockStripe.webhooks.constructEvent.mockImplementation((body) => {
        const parsedBody = JSON.parse(body);
        return events.find(e => e.id === parsedBody.id) || events[0];
      });

      const promises = events.map(event => {
        const request = createMockRequest(
          JSON.stringify(event),
          'POST',
          undefined,
          { 'stripe-signature': 'valid_signature' }
        );
        return webhookHandler(request);
      });

      const responses = await Promise.all(promises);
      
      // All webhooks should process successfully
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Webhook Event Types Coverage', () => {
    it('should handle product events', async () => {
      const productEvent = createMockStripeEvent('product.created');
      productEvent.data.object = {
        id: 'prod_test123',
        name: 'Test Product',
        description: 'Test Description',
        active: true
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(productEvent);

      const request = createMockRequest(
        JSON.stringify(productEvent),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);
    });

    it('should handle price events', async () => {
      const priceEvent = createMockStripeEvent('price.created');
      priceEvent.data.object = {
        id: 'price_test123',
        product: 'prod_test123',
        unit_amount: 2900,
        currency: 'usd',
        recurring: { interval: 'month' },
        active: true
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(priceEvent);

      const request = createMockRequest(
        JSON.stringify(priceEvent),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);
    });

    it('should handle invoice events', async () => {
      const invoiceEvent = createMockStripeEvent('invoice.payment_succeeded');
      invoiceEvent.data.object = {
        id: 'in_test123',
        customer: 'cus_test123',
        amount_paid: 2900,
        status: 'paid'
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(invoiceEvent);

      const request = createMockRequest(
        JSON.stringify(invoiceEvent),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);
    });

    it('should log unhandled event types without failing', async () => {
      const unknownEvent = createMockStripeEvent('unknown.event.type');
      mockStripe.webhooks.constructEvent.mockReturnValue(unknownEvent);

      const request = createMockRequest(
        JSON.stringify(unknownEvent),
        'POST',
        undefined,
        { 'stripe-signature': 'valid_signature' }
      );

      const response = await webhookHandler(request);
      expect(response.status).toBe(200);
    });
  });
});