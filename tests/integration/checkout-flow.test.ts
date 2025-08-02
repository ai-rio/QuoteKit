import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Test utilities
import { createTestUser, cleanupTestUser, createTestStripeCustomer } from '../utils/test-helpers';
import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { changePlan } from '@/features/account/actions/subscription-actions';

// Mock Stripe for controlled testing
jest.mock('stripe');
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe('Checkout Flow Integration Tests', () => {
  let supabase: any;
  let mockStripe: jest.Mocked<Stripe>;
  let testUser: any;
  let testEmail: string;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize test Supabase client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Setup mock Stripe
    mockStripe = {
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        list: jest.fn(),
        del: jest.fn(),
      },
      paymentMethods: {
        create: jest.fn(),
        retrieve: jest.fn(),
        attach: jest.fn(),
        detach: jest.fn(),
        list: jest.fn(),
      },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
        list: jest.fn(),
      },
      setupIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        confirm: jest.fn(),
      },
      invoices: {
        retrieveUpcoming: jest.fn(),
      },
    } as any;

    MockedStripe.mockImplementation(() => mockStripe);
  });

  beforeEach(async () => {
    // Create fresh test user for each test
    testUser = await createTestUser();
    testEmail = testUser.email;
    testUserId = testUser.id;

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup test user and associated data
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  describe('Customer Management', () => {
    it('should create a new customer when none exists', async () => {
      // Mock Stripe responses
      mockStripe.customers.list.mockResolvedValue({
        data: [],
        has_more: false,
        object: 'list',
        url: '/v1/customers'
      });

      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_test_new',
        email: testEmail,
        created: Math.floor(Date.now() / 1000),
        metadata: { user_id: testUserId },
        object: 'customer'
      } as any);

      // Test customer creation
      const customerId = await getOrCreateCustomer({
        userId: testUserId,
        email: testEmail
      });

      expect(customerId).toBe('cus_test_new');
      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: testEmail,
        limit: 10
      });
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: testEmail,
        metadata: {
          user_id: testUserId,
          created_by: 'quotekit_app',
          created_at: expect.any(String)
        }
      });

      // Verify database record was created
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', testUserId)
        .single();

      expect(customerRecord?.stripe_customer_id).toBe('cus_test_new');
    });

    it('should return existing customer without creating duplicates', async () => {
      const existingCustomerId = 'cus_test_existing';

      // Setup existing customer in database
      await supabase
        .from('customers')
        .insert({
          id: testUserId,
          stripe_customer_id: existingCustomerId,
          email: testEmail
        });

      // Mock Stripe to return existing customer
      mockStripe.customers.retrieve.mockResolvedValue({
        id: existingCustomerId,
        email: testEmail,
        deleted: false,
        object: 'customer'
      } as any);

      // Test customer lookup
      const customerId = await getOrCreateCustomer({
        userId: testUserId,
        email: testEmail
      });

      expect(customerId).toBe(existingCustomerId);
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith(existingCustomerId);
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should handle Stripe customer lookup by email for existing customers', async () => {
      const existingCustomerId = 'cus_test_by_email';

      // Mock Stripe to return existing customer by email
      mockStripe.customers.list.mockResolvedValue({
        data: [{
          id: existingCustomerId,
          email: testEmail,
          deleted: false,
          created: Math.floor(Date.now() / 1000),
          object: 'customer'
        }],
        has_more: false,
        object: 'list',
        url: '/v1/customers'
      } as any);

      // Test customer lookup
      const customerId = await getOrCreateCustomer({
        userId: testUserId,
        email: testEmail
      });

      expect(customerId).toBe(existingCustomerId);
      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: testEmail,
        limit: 10
      });
      expect(mockStripe.customers.create).not.toHaveBeenCalled();

      // Verify database was updated
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', testUserId)
        .single();

      expect(customerRecord?.stripe_customer_id).toBe(existingCustomerId);
    });

    it('should recreate customer if Stripe customer was deleted', async () => {
      const deletedCustomerId = 'cus_test_deleted';
      const newCustomerId = 'cus_test_recreated';

      // Setup existing customer in database
      await supabase
        .from('customers')
        .insert({
          id: testUserId,
          stripe_customer_id: deletedCustomerId,
          email: testEmail
        });

      // Mock Stripe to return deleted customer, then create new one
      mockStripe.customers.retrieve.mockResolvedValue({
        id: deletedCustomerId,
        email: testEmail,
        deleted: true,
        object: 'customer'
      } as any);

      mockStripe.customers.list.mockResolvedValue({
        data: [],
        has_more: false,
        object: 'list',
        url: '/v1/customers'
      });

      mockStripe.customers.create.mockResolvedValue({
        id: newCustomerId,
        email: testEmail,
        created: Math.floor(Date.now() / 1000),
        metadata: { user_id: testUserId },
        object: 'customer'
      } as any);

      // Test customer recreation
      const customerId = await getOrCreateCustomer({
        userId: testUserId,
        email: testEmail
      });

      expect(customerId).toBe(newCustomerId);
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith(deletedCustomerId);
      expect(mockStripe.customers.create).toHaveBeenCalled();
    });
  });

  describe('Payment Method Management', () => {
    let customerId: string;

    beforeEach(async () => {
      customerId = 'cus_test_payment_methods';
      
      // Setup customer
      await supabase
        .from('customers')
        .insert({
          id: testUserId,
          stripe_customer_id: customerId,
          email: testEmail
        });

      mockStripe.customers.retrieve.mockResolvedValue({
        id: customerId,
        email: testEmail,
        deleted: false,
        object: 'customer'
      } as any);
    });

    it('should create setup intent for adding payment method', async () => {
      const setupIntentId = 'seti_test_123';
      const clientSecret = 'seti_test_123_secret_abc';

      mockStripe.setupIntents.create.mockResolvedValue({
        id: setupIntentId,
        client_secret: clientSecret,
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        object: 'setup_intent'
      } as any);

      // Test setup intent creation (simulating API call)
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_name: 'Test User',
          set_as_default: true
        })
      });

      // Note: This would need to be tested with actual API integration
      // For now, we test the Stripe mock directly
      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          user_id: testUserId,
          billing_name: 'Test User',
          set_as_default: 'true'
        }
      });
    });

    it('should list payment methods for customer', async () => {
      const paymentMethodId = 'pm_test_card';

      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [{
          id: paymentMethodId,
          type: 'card',
          customer: customerId,
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025,
            country: 'US',
            funding: 'credit'
          },
          created: Math.floor(Date.now() / 1000),
          object: 'payment_method'
        }],
        has_more: false,
        object: 'list',
        url: '/v1/payment_methods'
      } as any);

      mockStripe.customers.retrieve.mockResolvedValue({
        id: customerId,
        email: testEmail,
        invoice_settings: {
          default_payment_method: paymentMethodId
        },
        object: 'customer'
      } as any);

      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: customerId,
        type: 'card'
      });
    });

    it('should set default payment method', async () => {
      const paymentMethodId = 'pm_test_default';

      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        type: 'card',
        customer: customerId,
        object: 'payment_method'
      } as any);

      mockStripe.customers.update.mockResolvedValue({
        id: customerId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        },
        object: 'customer'
      } as any);

      mockStripe.subscriptions.list.mockResolvedValue({
        data: [],
        has_more: false,
        object: 'list',
        url: '/v1/subscriptions'
      });

      // Test setting default payment method
      expect(mockStripe.customers.update).toHaveBeenCalledWith(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    });
  });

  describe('Subscription Creation Flow', () => {
    let customerId: string;
    let paymentMethodId: string;
    let priceId: string;

    beforeEach(async () => {
      customerId = 'cus_test_subscription';
      paymentMethodId = 'pm_test_subscription';
      priceId = 'price_test_pro_monthly';

      // Setup customer
      await supabase
        .from('customers')
        .insert({
          id: testUserId,
          stripe_customer_id: customerId,
          email: testEmail
        });

      // Setup test price in database
      await supabase
        .from('stripe_prices')
        .insert({
          id: priceId,
          stripe_price_id: priceId,
          stripe_product_id: 'prod_test',
          unit_amount: 2900,
          currency: 'usd',
          recurring_interval: 'month',
          active: true
        });

      await supabase
        .from('stripe_products')
        .insert({
          id: 'prod_test',
          stripe_product_id: 'prod_test',
          name: 'Pro Plan',
          active: true
        });

      // Mock Stripe responses
      mockStripe.customers.retrieve.mockResolvedValue({
        id: customerId,
        email: testEmail,
        deleted: false,
        object: 'customer'
      } as any);

      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        type: 'card',
        customer: null, // Not attached yet
        object: 'payment_method'
      } as any);

      mockStripe.paymentMethods.attach.mockResolvedValue({
        id: paymentMethodId,
        type: 'card',
        customer: customerId,
        object: 'payment_method'
      } as any);

      mockStripe.customers.update.mockResolvedValue({
        id: customerId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        },
        object: 'customer'
      } as any);
    });

    it('should create new subscription with payment method', async () => {
      const subscriptionId = 'sub_test_new';

      mockStripe.subscriptions.create.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: {
          data: [{
            price: { id: priceId }
          }]
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        created: Math.floor(Date.now() / 1000),
        cancel_at_period_end: false,
        trial_start: null,
        trial_end: null,
        object: 'subscription'
      } as any);

      // Test subscription creation
      const result = await changePlan(priceId, true, paymentMethodId);

      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith(paymentMethodId, {
        customer: customerId
      });
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
        default_payment_method: paymentMethodId,
        payment_behavior: 'default_incomplete'
      });

      // Verify subscription was saved to database
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      expect(subscription).toBeDefined();
      expect(subscription.user_id).toBe(testUserId);
      expect(subscription.stripe_price_id).toBe(priceId);
    });

    it('should handle incomplete subscription requiring payment confirmation', async () => {
      const subscriptionId = 'sub_test_incomplete';
      const paymentIntentId = 'pi_test_requires_action';
      const clientSecret = 'pi_test_requires_action_secret_abc';

      mockStripe.subscriptions.create.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'incomplete',
        items: {
          data: [{
            price: { id: priceId }
          }]
        },
        latest_invoice: {
          id: 'in_test_123',
          payment_intent: {
            id: paymentIntentId,
            client_secret: clientSecret,
            status: 'requires_action'
          }
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        created: Math.floor(Date.now() / 1000),
        cancel_at_period_end: false,
        object: 'subscription'
      } as any);

      // Test incomplete subscription creation
      const result = await changePlan(priceId, true, paymentMethodId);

      expect(result.success).toBe(true);
      expect(result.requiresPaymentConfirmation).toBe(true);
      expect(result.paymentIntent).toBeDefined();
      expect(result.paymentIntent?.client_secret).toBe(clientSecret);
      expect(result.paymentIntent?.status).toBe('requires_action');
    });

    it('should handle payment method validation errors', async () => {
      // Mock payment method that belongs to different customer
      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        type: 'card',
        customer: 'cus_different_customer',
        object: 'payment_method'
      } as any);

      // Test should fail with proper error
      await expect(changePlan(priceId, true, paymentMethodId))
        .rejects
        .toThrow('This payment method belongs to a different account');
    });
  });

  describe('Plan Change Flow', () => {
    let customerId: string;
    let subscriptionId: string;
    let oldPriceId: string;
    let newPriceId: string;

    beforeEach(async () => {
      customerId = 'cus_test_plan_change';
      subscriptionId = 'sub_test_existing';
      oldPriceId = 'price_test_basic_monthly';
      newPriceId = 'price_test_pro_monthly';

      // Setup customer and existing subscription
      await supabase
        .from('customers')
        .insert({
          id: testUserId,
          stripe_customer_id: customerId,
          email: testEmail
        });

      await supabase
        .from('subscriptions')
        .insert({
          id: subscriptionId,
          user_id: testUserId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: oldPriceId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString()
        });

      // Setup prices
      await supabase
        .from('stripe_prices')
        .insert([
          {
            id: oldPriceId,
            stripe_price_id: oldPriceId,
            stripe_product_id: 'prod_basic',
            unit_amount: 1900,
            currency: 'usd',
            recurring_interval: 'month',
            active: true
          },
          {
            id: newPriceId,
            stripe_price_id: newPriceId,
            stripe_product_id: 'prod_pro',
            unit_amount: 2900,
            currency: 'usd',
            recurring_interval: 'month',
            active: true
          }
        ]);

      await supabase
        .from('stripe_products')
        .insert([
          {
            id: 'prod_basic',
            stripe_product_id: 'prod_basic',
            name: 'Basic Plan',
            active: true
          },
          {
            id: 'prod_pro',
            stripe_product_id: 'prod_pro',
            name: 'Pro Plan',
            active: true
          }
        ]);
    });

    it('should upgrade subscription plan successfully', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: {
          data: [{
            id: 'si_test_123',
            price: { id: newPriceId }
          }]
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        object: 'subscription'
      } as any);

      // Mock invoice preview for proration
      mockStripe.invoices.retrieveUpcoming.mockResolvedValue({
        amount_due: 1000, // $10.00 proration
        lines: {
          data: [
            { amount: 2900, description: 'Pro Plan' },
            { amount: -1900, description: 'Unused time credit' }
          ]
        },
        object: 'invoice'
      } as any);

      // Test plan upgrade
      const result = await changePlan(newPriceId, true);

      expect(result.success).toBe(true);
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        subscriptionId,
        expect.objectContaining({
          items: [{
            id: expect.any(String),
            price: newPriceId
          }],
          proration_behavior: 'create_prorations'
        })
      );

      // Verify database was updated
      const { data: updatedSubscription } = await supabase
        .from('subscriptions')
        .select('stripe_price_id')
        .eq('id', subscriptionId)
        .single();

      expect(updatedSubscription?.stripe_price_id).toBe(newPriceId);
    });

    it('should handle downgrade with proper proration', async () => {
      const downgradePriceId = 'price_test_starter_monthly';

      await supabase
        .from('stripe_prices')
        .insert({
          id: downgradePriceId,
          stripe_price_id: downgradePriceId,
          stripe_product_id: 'prod_starter',
          unit_amount: 900,
          currency: 'usd',
          recurring_interval: 'month',
          active: true
        });

      mockStripe.subscriptions.update.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: {
          data: [{
            id: 'si_test_456',
            price: { id: downgradePriceId }
          }]
        },
        object: 'subscription'
      } as any);

      // Test plan downgrade
      const result = await changePlan(downgradePriceId, false);

      expect(result.success).toBe(true);
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        subscriptionId,
        expect.objectContaining({
          items: [{
            id: expect.any(String),
            price: downgradePriceId
          }],
          proration_behavior: 'create_prorations'
        })
      );
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle Stripe API errors gracefully', async () => {
      mockStripe.customers.create.mockRejectedValue(
        new Error('Your card was declined.')
      );

      await expect(getOrCreateCustomer({
        userId: testUserId,
        email: testEmail
      })).rejects.toThrow('Failed to get or create customer');
    });

    it('should handle network timeouts', async () => {
      mockStripe.customers.create.mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(getOrCreateCustomer({
        userId: testUserId,
        email: testEmail
      })).rejects.toThrow('Failed to get or create customer');
    });

    it('should handle invalid price IDs', async () => {
      const invalidPriceId = 'price_invalid_123';

      await expect(changePlan(invalidPriceId, true))
        .rejects
        .toThrow(`Invalid or inactive price: ${invalidPriceId}`);
    });

    it('should handle missing payment method for upgrades', async () => {
      const priceId = 'price_test_pro';

      await supabase
        .from('stripe_prices')
        .insert({
          id: priceId,
          stripe_price_id: priceId,
          stripe_product_id: 'prod_test',
          unit_amount: 2900,
          currency: 'usd',
          active: true
        });

      await expect(changePlan(priceId, true))
        .rejects
        .toThrow('Payment method is required for plan upgrades');
    });
  });

  describe('Database Consistency', () => {
    it('should maintain data consistency between Stripe and database', async () => {
      const customerId = 'cus_test_consistency';
      const subscriptionId = 'sub_test_consistency';
      const priceId = 'price_test_consistency';

      // Setup test data
      await supabase
        .from('stripe_prices')
        .insert({
          id: priceId,
          stripe_price_id: priceId,
          stripe_product_id: 'prod_test',
          unit_amount: 2900,
          currency: 'usd',
          active: true
        });

      // Mock Stripe responses
      mockStripe.customers.list.mockResolvedValue({
        data: [],
        has_more: false,
        object: 'list',
        url: '/v1/customers'
      });

      mockStripe.customers.create.mockResolvedValue({
        id: customerId,
        email: testEmail,
        object: 'customer'
      } as any);

      mockStripe.subscriptions.create.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: { data: [{ price: { id: priceId } }] },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        created: Math.floor(Date.now() / 1000),
        object: 'subscription'
      } as any);

      // Create subscription
      const result = await changePlan(priceId, true);

      expect(result.success).toBe(true);

      // Verify database consistency
      const { data: customer } = await supabase
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', testUserId)
        .single();

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(customer?.stripe_customer_id).toBe(customerId);
      expect(subscription?.stripe_subscription_id).toBe(subscriptionId);
      expect(subscription?.stripe_price_id).toBe(priceId);
      expect(subscription?.status).toBe('active');
    });
  });
});
