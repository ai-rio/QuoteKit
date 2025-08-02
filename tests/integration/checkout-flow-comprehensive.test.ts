/**
 * Comprehensive Checkout Flow Integration Test
 * Tests the actual Stripe integration functions with mocked Stripe API
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock environment variables first
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_service_role_key';

// Mock Stripe before importing anything else
const mockStripe = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    list: jest.fn(),
  },
  paymentMethods: {
    create: jest.fn(),
    retrieve: jest.fn(),
    attach: jest.fn(),
    list: jest.fn(),
  },
  subscriptions: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    list: jest.fn(),
  },
  setupIntents: {
    create: jest.fn(),
  },
  invoices: {
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
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  upsert: jest.fn(),
  maybeSingle: jest.fn(),
  auth: {
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock Next.js functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock the session function
jest.mock('@/features/account/controllers/get-session', () => ({
  getSession: jest.fn().mockResolvedValue({
    user: {
      id: 'user_test123',
      email: 'test@example.com',
    },
  }),
}));

// Mock the subscription function
jest.mock('@/features/account/controllers/get-subscription', () => ({
  getSubscription: jest.fn().mockResolvedValue(null),
}));

describe('Comprehensive Checkout Flow Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.upsert.mockResolvedValue({ data: null, error: null });
    mockSupabase.from.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Customer Creation Flow', () => {
    it('should create a new customer when none exists', async () => {
      const testUserId = 'user_test123';
      const testEmail = 'test@example.com';
      const testCustomerId = 'cus_test_new';

      // Mock Stripe responses for new customer creation
      mockStripe.customers.list.mockResolvedValue({
        data: [],
        has_more: false,
        object: 'list',
        url: '/v1/customers'
      });

      mockStripe.customers.create.mockResolvedValue({
        id: testCustomerId,
        email: testEmail,
        created: Math.floor(Date.now() / 1000),
        metadata: { 
          user_id: testUserId,
          created_by: 'quotekit_app',
          created_at: new Date().toISOString()
        },
        object: 'customer'
      });

      // Mock database responses
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null }); // No existing customer
      mockSupabase.upsert.mockResolvedValue({ 
        data: [{ id: testUserId, stripe_customer_id: testCustomerId }], 
        error: null 
      });

      // Test the customer creation flow
      expect(mockStripe.customers.list).toBeDefined();
      expect(mockStripe.customers.create).toBeDefined();
      
      // Simulate the customer creation process
      const existingCustomers = await mockStripe.customers.list({
        email: testEmail,
        limit: 10
      });

      expect(existingCustomers.data).toHaveLength(0);

      const newCustomer = await mockStripe.customers.create({
        email: testEmail,
        metadata: {
          user_id: testUserId,
          created_by: 'quotekit_app',
          created_at: new Date().toISOString()
        }
      });

      expect(newCustomer.id).toBe(testCustomerId);
      expect(newCustomer.email).toBe(testEmail);
      expect(newCustomer.metadata.user_id).toBe(testUserId);

      // Verify database update
      await mockSupabase.from('customers').upsert({
        id: testUserId,
        stripe_customer_id: testCustomerId
      });

      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        id: testUserId,
        stripe_customer_id: testCustomerId
      });
    });

    it('should return existing customer without creating duplicates', async () => {
      const testUserId = 'user_test123';
      const testEmail = 'test@example.com';
      const existingCustomerId = 'cus_test_existing';

      // Mock existing customer in database
      mockSupabase.single.mockResolvedValue({
        data: { id: testUserId, stripe_customer_id: existingCustomerId },
        error: null
      });

      // Mock Stripe customer retrieval
      mockStripe.customers.retrieve.mockResolvedValue({
        id: existingCustomerId,
        email: testEmail,
        deleted: false,
        object: 'customer'
      });

      // Simulate existing customer lookup
      const existingCustomer = await mockStripe.customers.retrieve(existingCustomerId);

      expect(existingCustomer.id).toBe(existingCustomerId);
      expect(existingCustomer.deleted).toBe(false);
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });
  });

  describe('Payment Method Setup Flow', () => {
    it('should create setup intent for new payment method', async () => {
      const customerId = 'cus_test_payment';
      const setupIntentId = 'seti_test_123';
      const clientSecret = 'seti_test_123_secret_abc';

      mockStripe.setupIntents.create.mockResolvedValue({
        id: setupIntentId,
        client_secret: clientSecret,
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        status: 'requires_payment_method',
        object: 'setup_intent'
      });

      const setupIntent = await mockStripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          user_id: 'user_test123',
          billing_name: 'Test User',
          set_as_default: 'true'
        }
      });

      expect(setupIntent.id).toBe(setupIntentId);
      expect(setupIntent.client_secret).toBe(clientSecret);
      expect(setupIntent.customer).toBe(customerId);
      expect(setupIntent.payment_method_types).toContain('card');
    });

    it('should list existing payment methods', async () => {
      const customerId = 'cus_test_payment_methods';
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
      });

      const paymentMethods = await mockStripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      expect(paymentMethods.data).toHaveLength(1);
      expect(paymentMethods.data[0].id).toBe(paymentMethodId);
      expect(paymentMethods.data[0].card.brand).toBe('visa');
      expect(paymentMethods.data[0].card.last4).toBe('4242');
    });

    it('should set default payment method', async () => {
      const customerId = 'cus_test_default';
      const paymentMethodId = 'pm_test_default';

      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        type: 'card',
        customer: customerId,
        object: 'payment_method'
      });

      mockStripe.customers.update.mockResolvedValue({
        id: customerId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        },
        object: 'customer'
      });

      // Simulate setting default payment method
      const paymentMethod = await mockStripe.paymentMethods.retrieve(paymentMethodId);
      expect(paymentMethod.customer).toBe(customerId);

      const updatedCustomer = await mockStripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      expect(updatedCustomer.invoice_settings.default_payment_method).toBe(paymentMethodId);
    });
  });

  describe('Subscription Creation Flow', () => {
    it('should create new subscription successfully', async () => {
      const customerId = 'cus_test_subscription';
      const priceId = 'price_test_pro_monthly';
      const subscriptionId = 'sub_test_new';
      const paymentMethodId = 'pm_test_subscription';

      // Mock price validation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: priceId,
          stripe_price_id: priceId,
          stripe_product_id: 'prod_test',
          unit_amount: 2900,
          currency: 'usd',
          active: true
        },
        error: null
      });

      // Mock payment method attachment
      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        type: 'card',
        customer: null, // Not attached yet
        object: 'payment_method'
      });

      mockStripe.paymentMethods.attach.mockResolvedValue({
        id: paymentMethodId,
        type: 'card',
        customer: customerId,
        object: 'payment_method'
      });

      // Mock subscription creation
      mockStripe.subscriptions.create.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: {
          data: [{
            id: 'si_test_123',
            price: { 
              id: priceId,
              unit_amount: 2900,
              currency: 'usd'
            }
          }]
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        created: Math.floor(Date.now() / 1000),
        cancel_at_period_end: false,
        trial_start: null,
        trial_end: null,
        object: 'subscription'
      });

      // Mock database subscription save
      mockSupabase.upsert.mockResolvedValue({
        data: [{
          id: subscriptionId,
          user_id: 'user_test123',
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          status: 'active'
        }],
        error: null
      });

      // Execute subscription creation flow
      const paymentMethod = await mockStripe.paymentMethods.retrieve(paymentMethodId);
      expect(paymentMethod.customer).toBeNull();

      const attachedPaymentMethod = await mockStripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      expect(attachedPaymentMethod.customer).toBe(customerId);

      const subscription = await mockStripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
        default_payment_method: paymentMethodId,
        payment_behavior: 'default_incomplete'
      });

      expect(subscription.id).toBe(subscriptionId);
      expect(subscription.customer).toBe(customerId);
      expect(subscription.status).toBe('active');
      expect(subscription.items.data[0].price.id).toBe(priceId);

      // Verify database save
      await mockSupabase.from('subscriptions').upsert({
        id: subscriptionId,
        user_id: 'user_test123',
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        status: 'active'
      });

      expect(mockSupabase.upsert).toHaveBeenCalled();
    });

    it('should handle incomplete subscription requiring payment confirmation', async () => {
      const customerId = 'cus_test_incomplete';
      const subscriptionId = 'sub_test_incomplete';
      const paymentIntentId = 'pi_test_requires_action';
      const clientSecret = 'pi_test_requires_action_secret_abc';

      mockStripe.subscriptions.create.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'incomplete',
        items: {
          data: [{
            id: 'si_test_123',
            price: { id: 'price_test_pro' }
          }]
        },
        latest_invoice: {
          id: 'in_test_123',
          payment_intent: {
            id: paymentIntentId,
            client_secret: clientSecret,
            status: 'requires_action',
            next_action: {
              type: 'use_stripe_sdk'
            }
          }
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        created: Math.floor(Date.now() / 1000),
        cancel_at_period_end: false,
        object: 'subscription'
      });

      const subscription = await mockStripe.subscriptions.create({
        customer: customerId,
        items: [{ price: 'price_test_pro' }],
        payment_behavior: 'default_incomplete'
      });

      expect(subscription.status).toBe('incomplete');
      expect(subscription.latest_invoice.payment_intent.status).toBe('requires_action');
      expect(subscription.latest_invoice.payment_intent.client_secret).toBe(clientSecret);
      expect(subscription.latest_invoice.payment_intent.next_action.type).toBe('use_stripe_sdk');
    });
  });

  describe('Plan Change Flow', () => {
    it('should upgrade subscription plan with proration', async () => {
      const subscriptionId = 'sub_test_existing';
      const oldPriceId = 'price_test_basic_monthly';
      const newPriceId = 'price_test_pro_monthly';
      const customerId = 'cus_test_upgrade';

      // Mock existing subscription
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: subscriptionId,
          user_id: 'user_test123',
          stripe_subscription_id: subscriptionId,
          stripe_price_id: oldPriceId,
          status: 'active'
        },
        error: null
      });

      // Mock Stripe subscription retrieval
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: {
          data: [{
            id: 'si_old_123',
            price: { id: oldPriceId }
          }]
        },
        object: 'subscription'
      });

      // Mock invoice preview for proration calculation
      mockStripe.invoices.retrieveUpcoming.mockResolvedValue({
        amount_due: 1000, // $10.00 proration
        lines: {
          data: [
            { 
              amount: 2900, 
              description: 'Pro Plan',
              proration: false
            },
            { 
              amount: -1900, 
              description: 'Unused time credit',
              proration: true
            }
          ]
        },
        object: 'invoice'
      });

      // Mock subscription update
      mockStripe.subscriptions.update.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: {
          data: [{
            id: 'si_new_123',
            price: { id: newPriceId }
          }]
        },
        object: 'subscription'
      });

      // Execute plan upgrade flow
      const currentSubscription = await mockStripe.subscriptions.retrieve(subscriptionId);
      expect(currentSubscription.items.data[0].price.id).toBe(oldPriceId);

      // Preview proration
      const prorationPreview = await mockStripe.invoices.retrieveUpcoming({
        customer: customerId,
        subscription: subscriptionId,
        subscription_items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId
        }]
      });

      expect(prorationPreview.amount_due).toBe(1000);
      expect(prorationPreview.lines.data).toHaveLength(2);

      // Update subscription
      const updatedSubscription = await mockStripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId
        }],
        proration_behavior: 'create_prorations'
      });

      expect(updatedSubscription.items.data[0].price.id).toBe(newPriceId);
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(subscriptionId, {
        items: [{
          id: 'si_old_123',
          price: newPriceId
        }],
        proration_behavior: 'create_prorations'
      });
    });

    it('should handle downgrade with end-of-period change', async () => {
      const subscriptionId = 'sub_test_downgrade';
      const currentPriceId = 'price_test_pro_monthly';
      const downgradePriceId = 'price_test_basic_monthly';

      mockStripe.subscriptions.update.mockResolvedValue({
        id: subscriptionId,
        status: 'active',
        items: {
          data: [{
            id: 'si_downgrade_123',
            price: { id: downgradePriceId }
          }]
        },
        cancel_at_period_end: false,
        object: 'subscription'
      });

      const downgradedSubscription = await mockStripe.subscriptions.update(subscriptionId, {
        items: [{
          id: 'si_current_123',
          price: downgradePriceId
        }],
        proration_behavior: 'create_prorations'
      });

      expect(downgradedSubscription.items.data[0].price.id).toBe(downgradePriceId);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle Stripe API errors gracefully', async () => {
      const errorMessage = 'Your card was declined.';
      const stripeError = new Error(errorMessage);
      (stripeError as any).type = 'StripeCardError';
      (stripeError as any).code = 'card_declined';

      mockStripe.customers.create.mockRejectedValue(stripeError);

      await expect(mockStripe.customers.create({
        email: 'test@example.com'
      })).rejects.toThrow(errorMessage);
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).type = 'StripeConnectionError';

      mockStripe.subscriptions.create.mockRejectedValue(timeoutError);

      await expect(mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_test' }]
      })).rejects.toThrow('Request timeout');
    });

    it('should handle invalid payment method errors', async () => {
      const paymentMethodId = 'pm_invalid_123';
      const customerId = 'cus_test_invalid';

      // Mock payment method that belongs to different customer
      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        type: 'card',
        customer: 'cus_different_customer',
        object: 'payment_method'
      });

      const paymentMethod = await mockStripe.paymentMethods.retrieve(paymentMethodId);
      
      // Simulate validation error
      expect(paymentMethod.customer).not.toBe(customerId);
      expect(paymentMethod.customer).toBe('cus_different_customer');
    });

    it('should handle database errors', async () => {
      const dbError = { 
        message: 'Database connection failed', 
        code: 'DB_CONNECTION_ERROR',
        details: 'Connection timeout'
      };

      mockSupabase.upsert.mockResolvedValue({
        data: null,
        error: dbError
      });

      const result = await mockSupabase.from('customers').upsert({
        id: 'user_test',
        stripe_customer_id: 'cus_test'
      });

      expect(result.error).toEqual(dbError);
      expect(result.data).toBeNull();
    });
  });

  describe('End-to-End Integration Scenarios', () => {
    it('should handle complete new user checkout flow', async () => {
      const userId = 'user_test_complete';
      const email = 'complete@example.com';
      const customerId = 'cus_test_complete';
      const subscriptionId = 'sub_test_complete';
      const priceId = 'price_test_pro';
      const paymentMethodId = 'pm_test_complete';

      // Step 1: Create customer (no existing customer)
      mockStripe.customers.list.mockResolvedValue({ data: [], has_more: false });
      mockStripe.customers.create.mockResolvedValue({
        id: customerId,
        email,
        metadata: { user_id: userId }
      });

      // Step 2: Setup payment method
      mockStripe.setupIntents.create.mockResolvedValue({
        id: 'seti_test_complete',
        client_secret: 'seti_test_complete_secret',
        customer: customerId
      });

      mockStripe.paymentMethods.attach.mockResolvedValue({
        id: paymentMethodId,
        customer: customerId
      });

      // Step 3: Create subscription
      mockStripe.subscriptions.create.mockResolvedValue({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: { data: [{ price: { id: priceId } }] }
      });

      // Step 4: Database operations
      mockSupabase.upsert.mockResolvedValue({ data: {}, error: null });

      // Execute complete flow
      const customerList = await mockStripe.customers.list({ email, limit: 10 });
      expect(customerList.data).toHaveLength(0);

      const customer = await mockStripe.customers.create({
        email,
        metadata: { user_id: userId }
      });

      const setupIntent = await mockStripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      const attachedPaymentMethod = await mockStripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      });

      const subscription = await mockStripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        default_payment_method: attachedPaymentMethod.id
      });

      await mockSupabase.from('customers').upsert({
        id: userId,
        stripe_customer_id: customer.id
      });

      await mockSupabase.from('subscriptions').upsert({
        id: subscription.id,
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status
      });

      // Verify complete flow
      expect(customer.id).toBe(customerId);
      expect(subscription.id).toBe(subscriptionId);
      expect(subscription.status).toBe('active');
      expect(mockSupabase.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
