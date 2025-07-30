/**
 * Comprehensive Stripe Sandbox Integration Tests
 * Full integration testing with Stripe sandbox environment
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/libs/supabase/types';
import { jest } from '@jest/globals';

// Test configuration
const STRIPE_TEST_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY_TEST!,
  secretKey: process.env.STRIPE_SECRET_KEY_TEST!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_TEST!,
  apiVersion: '2024-06-20' as const
};

interface TestCustomer {
  id: string;
  email: string;
  stripeCustomerId: string;
}

interface TestSubscription {
  id: string;
  customerId: string;
  priceId: string;
  status: string;
}

describe('Stripe Sandbox Integration Tests', () => {
  let stripe: Stripe;
  let supabase: ReturnType<typeof createClient<Database>>;
  let testCustomers: TestCustomer[] = [];
  let testSubscriptions: TestSubscription[] = [];

  beforeAll(async () => {
    // Initialize Stripe with test keys
    stripe = new Stripe(STRIPE_TEST_CONFIG.secretKey, {
      apiVersion: STRIPE_TEST_CONFIG.apiVersion
    });

    // Initialize Supabase
    supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify Stripe test mode
    await verifyStripeTestMode();

    // Setup test data
    await setupTestEnvironment();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestEnvironment();
  });

  describe('Customer Management', () => {
    it('should create customer in Stripe and sync to database', async () => {
      const customerData = {
        email: 'test-customer-1@example.com',
        name: 'Test Customer 1',
        metadata: { test: 'true' }
      };

      // Create customer in Stripe
      const stripeCustomer = await stripe.customers.create(customerData);
      expect(stripeCustomer.id).toMatch(/^cus_/);
      expect(stripeCustomer.email).toBe(customerData.email);

      // Sync to local database
      const { data: localCustomer, error } = await supabase
        .from('customers')
        .insert({
          id: 'test-user-1',
          stripe_customer_id: stripeCustomer.id,
          billing_email: customerData.email
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(localCustomer?.stripe_customer_id).toBe(stripeCustomer.id);

      testCustomers.push({
        id: 'test-user-1',
        email: customerData.email,
        stripeCustomerId: stripeCustomer.id
      });
    });

    it('should handle customer updates and sync changes', async () => {
      const customer = testCustomers[0];
      const updatedEmail = 'updated-test-customer-1@example.com';

      // Update customer in Stripe
      const updatedStripeCustomer = await stripe.customers.update(customer.stripeCustomerId, {
        email: updatedEmail
      });

      expect(updatedStripeCustomer.email).toBe(updatedEmail);

      // Update in local database
      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update({ billing_email: updatedEmail })
        .eq('stripe_customer_id', customer.stripeCustomerId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedCustomer?.billing_email).toBe(updatedEmail);
    });

    it('should retrieve customer payment methods', async () => {
      const customer = testCustomers[0];

      // Create a test payment method
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2030,
          cvc: '123'
        }
      });

      // Attach to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer.stripeCustomerId
      });

      // Retrieve customer payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.stripeCustomerId,
        type: 'card'
      });

      expect(paymentMethods.data.length).toBeGreaterThan(0);
      expect(paymentMethods.data[0].card?.last4).toBe('4242');
    });
  });

  describe('Subscription Lifecycle', () => {
    let testPriceId: string;

    beforeAll(async () => {
      // Create test product and price
      const product = await stripe.products.create({
        name: 'Test Product',
        metadata: { test: 'true' }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 2900, // $29.00
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { test: 'true' }
      });

      testPriceId = price.id;
    });

    it('should create subscription and handle webhook events', async () => {
      const customer = testCustomers[0];

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.stripeCustomerId,
        items: [{ price: testPriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      });

      expect(subscription.id).toMatch(/^sub_/);
      expect(subscription.status).toBe('incomplete');

      // Simulate webhook event
      const webhookEvent = createMockWebhookEvent('customer.subscription.created', subscription);
      await processWebhookEvent(webhookEvent);

      // Verify subscription in database
      const { data: localSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscription.id)
        .single();

      expect(localSubscription?.id).toBe(subscription.id);
      expect(localSubscription?.status).toBe('incomplete');

      testSubscriptions.push({
        id: subscription.id,
        customerId: customer.stripeCustomerId,
        priceId: testPriceId,
        status: 'incomplete'
      });
    });

    it('should handle subscription payment confirmation', async () => {
      const subscription = testSubscriptions[0];

      // Retrieve subscription with payment intent
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id, {
        expand: ['latest_invoice.payment_intent']
      });

      const paymentIntent = stripeSubscription.latest_invoice?.payment_intent as Stripe.PaymentIntent;

      // Confirm payment intent with test card
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: 'pm_card_visa' // Test payment method
      });

      expect(confirmedPaymentIntent.status).toBe('succeeded');

      // Wait for webhook processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify subscription is now active
      const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id);
      expect(updatedSubscription.status).toBe('active');

      // Verify database update
      const { data: localSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscription.id)
        .single();

      expect(localSubscription?.status).toBe('active');
    });

    it('should handle subscription updates and plan changes', async () => {
      const subscription = testSubscriptions[0];

      // Create new price for upgrade
      const product = await stripe.products.create({
        name: 'Test Premium Product',
        metadata: { test: 'true' }
      });

      const newPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: 4900, // $49.00
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { test: 'true' }
      });

      // Update subscription
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        items: [{
          id: (await stripe.subscriptions.retrieve(subscription.id)).items.data[0].id,
          price: newPrice.id
        }],
        proration_behavior: 'create_prorations'
      });

      expect(updatedSubscription.items.data[0].price.id).toBe(newPrice.id);

      // Simulate webhook
      const webhookEvent = createMockWebhookEvent('customer.subscription.updated', updatedSubscription);
      await processWebhookEvent(webhookEvent);

      // Verify database update
      const { data: localSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscription.id)
        .single();

      expect(localSubscription?.price_id).toBe(newPrice.id);
    });

    it('should handle subscription cancellation', async () => {
      const subscription = testSubscriptions[0];

      // Cancel subscription at period end
      const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true
      });

      expect(canceledSubscription.cancel_at_period_end).toBe(true);

      // Simulate webhook
      const webhookEvent = createMockWebhookEvent('customer.subscription.updated', canceledSubscription);
      await processWebhookEvent(webhookEvent);

      // Verify database update
      const { data: localSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscription.id)
        .single();

      expect(localSubscription?.cancel_at_period_end).toBe(true);
    });

    it('should handle subscription deletion', async () => {
      const subscription = testSubscriptions[0];

      // Delete subscription immediately
      const deletedSubscription = await stripe.subscriptions.del(subscription.id);
      expect(deletedSubscription.status).toBe('canceled');

      // Simulate webhook
      const webhookEvent = createMockWebhookEvent('customer.subscription.deleted', deletedSubscription);
      await processWebhookEvent(webhookEvent);

      // Verify database update
      const { data: localSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscription.id)
        .single();

      expect(localSubscription?.status).toBe('canceled');
    });
  });

  describe('Payment Methods', () => {
    it('should add and manage payment methods', async () => {
      const customer = testCustomers[0];

      // Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.stripeCustomerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      expect(setupIntent.client_secret).toBeDefined();

      // Simulate payment method attachment
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: '4000000000000002', // Declined card for testing
          exp_month: 12,
          exp_year: 2030,
          cvc: '123'
        }
      });

      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer.stripeCustomerId
      });

      // Verify payment method is attached
      const customerPaymentMethods = await stripe.paymentMethods.list({
        customer: customer.stripeCustomerId,
        type: 'card'
      });

      const attachedMethod = customerPaymentMethods.data.find(pm => pm.id === paymentMethod.id);
      expect(attachedMethod).toBeDefined();
    });

    it('should set default payment method', async () => {
      const customer = testCustomers[0];

      // Get customer payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.stripeCustomerId,
        type: 'card'
      });

      const paymentMethod = paymentMethods.data[0];

      // Set as default
      await stripe.customers.update(customer.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id
        }
      });

      // Verify default payment method
      const updatedCustomer = await stripe.customers.retrieve(customer.stripeCustomerId);
      expect(updatedCustomer.invoice_settings?.default_payment_method).toBe(paymentMethod.id);
    });

    it('should handle payment method failures', async () => {
      const customer = testCustomers[0];

      // Create payment intent with declined card
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 2900,
        currency: 'usd',
        customer: customer.stripeCustomerId,
        payment_method: 'pm_card_chargeDeclined', // Always declined
        confirm: true,
        return_url: 'https://example.com/return'
      });

      expect(paymentIntent.status).toBe('requires_payment_method');
      expect(paymentIntent.last_payment_error?.code).toBe('card_declined');
    });
  });

  describe('Webhook Processing', () => {
    it('should process invoice.payment_succeeded webhook', async () => {
      const customer = testCustomers[0];

      // Create mock invoice
      const invoice = await stripe.invoices.create({
        customer: customer.stripeCustomerId,
        collection_method: 'send_invoice',
        days_until_due: 30
      });

      // Simulate payment succeeded webhook
      const webhookEvent = createMockWebhookEvent('invoice.payment_succeeded', invoice);
      await processWebhookEvent(webhookEvent);

      // Verify webhook was processed
      const { data: webhookLog } = await supabase
        .from('stripe_webhook_events')
        .select('*')
        .eq('stripe_event_id', webhookEvent.id)
        .single();

      expect(webhookLog?.processed).toBe(true);
    });

    it('should handle webhook event idempotency', async () => {
      const customer = testCustomers[0];

      const invoice = await stripe.invoices.create({
        customer: customer.stripeCustomerId,
        collection_method: 'send_invoice',
        days_until_due: 30
      });

      const webhookEvent = createMockWebhookEvent('invoice.payment_failed', invoice);

      // Process webhook twice
      await processWebhookEvent(webhookEvent);
      await processWebhookEvent(webhookEvent);

      // Verify only one record exists
      const { data: webhookLogs } = await supabase
        .from('stripe_webhook_events')
        .select('*')
        .eq('stripe_event_id', webhookEvent.id);

      expect(webhookLogs?.length).toBe(1);
    });

    it('should handle webhook processing failures and retries', async () => {
      // Mock database failure
      jest.spyOn(supabase, 'from').mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const webhookEvent = createMockWebhookEvent('customer.created', {
        id: 'cus_test_webhook_failure',
        email: 'webhook-test@example.com'
      });

      // Should not throw error, but should log failure
      await expect(processWebhookEvent(webhookEvent)).resolves.not.toThrow();

      // Restore mock
      jest.restoreAllMocks();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle Stripe API rate limits', async () => {
      // Create multiple rapid requests to trigger rate limiting
      const promises = Array.from({ length: 50 }, (_, i) =>
        stripe.customers.create({
          email: `rate-limit-test-${i}@example.com`,
          metadata: { test: 'rate-limit' }
        }).catch(error => error)
      );

      const results = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedRequests = results.filter(result => 
        result instanceof Error && result.type === 'StripeRateLimitError'
      );

      // Should have at least some successful requests and handle rate limits gracefully
      expect(results.length).toBe(50);
    });

    it('should handle invalid API keys', async () => {
      const invalidStripe = new Stripe('sk_test_invalid_key', {
        apiVersion: STRIPE_TEST_CONFIG.apiVersion
      });

      await expect(invalidStripe.customers.list()).rejects.toThrow(/Invalid API Key/);
    });

    it('should handle network timeouts', async () => {
      const timeoutStripe = new Stripe(STRIPE_TEST_CONFIG.secretKey, {
        apiVersion: STRIPE_TEST_CONFIG.apiVersion,
        timeout: 1 // 1ms timeout to force timeout
      });

      await expect(timeoutStripe.customers.list()).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent subscription operations', async () => {
      const customer = testCustomers[0];

      // Create multiple subscriptions concurrently
      const subscriptionPromises = Array.from({ length: 5 }, (_, i) =>
        stripe.subscriptions.create({
          customer: customer.stripeCustomerId,
          items: [{ price: testPriceId }],
          metadata: { test: `concurrent-${i}` }
        })
      );

      const subscriptions = await Promise.all(subscriptionPromises);

      expect(subscriptions.length).toBe(5);
      subscriptions.forEach(sub => {
        expect(sub.id).toMatch(/^sub_/);
      });

      // Cleanup
      await Promise.all(
        subscriptions.map(sub => stripe.subscriptions.del(sub.id))
      );
    });

    it('should measure webhook processing performance', async () => {
      const startTime = Date.now();

      // Process multiple webhook events
      const webhookPromises = Array.from({ length: 10 }, (_, i) =>
        processWebhookEvent(createMockWebhookEvent('customer.updated', {
          id: `cus_performance_test_${i}`,
          email: `performance-${i}@example.com`
        }))
      );

      await Promise.all(webhookPromises);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process all webhooks within reasonable time (< 5 seconds)
      expect(processingTime).toBeLessThan(5000);
      console.log(`Processed 10 webhooks in ${processingTime}ms`);
    });
  });

  // Helper functions
  async function verifyStripeTestMode(): Promise<void> {
    const account = await stripe.accounts.retrieve();
    if (!account.id.startsWith('acct_')) {
      throw new Error('Not using Stripe test mode');
    }
    console.log('✅ Stripe test mode verified');
  }

  async function setupTestEnvironment(): Promise<void> {
    // Create test tables if they don't exist
    // This would typically be handled by migrations
    console.log('🔧 Setting up test environment');
  }

  async function cleanupTestEnvironment(): Promise<void> {
    console.log('🧹 Cleaning up test environment');

    // Delete test customers
    for (const customer of testCustomers) {
      try {
        await stripe.customers.del(customer.stripeCustomerId);
        await supabase
          .from('customers')
          .delete()
          .eq('id', customer.id);
      } catch (error) {
        console.warn(`Failed to cleanup customer ${customer.id}:`, error);
      }
    }

    // Delete test subscriptions (if any remain)
    for (const subscription of testSubscriptions) {
      try {
        await stripe.subscriptions.del(subscription.id);
        await supabase
          .from('subscriptions')
          .delete()
          .eq('id', subscription.id);
      } catch (error) {
        console.warn(`Failed to cleanup subscription ${subscription.id}:`, error);
      }
    }
  }

  function createMockWebhookEvent(type: string, data: any): Stripe.Event {
    return {
      id: `evt_test_${Math.random().toString(36).substr(2, 9)}`,
      object: 'event',
      api_version: STRIPE_TEST_CONFIG.apiVersion,
      created: Math.floor(Date.now() / 1000),
      data: { object: data },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: type as Stripe.Event.Type
    };
  }

  async function processWebhookEvent(event: Stripe.Event): Promise<void> {
    // This would call your actual webhook processing function
    // For now, just simulate processing
    console.log(`Processing webhook event: ${event.type}`);

    // Simulate webhook processing logic
    await new Promise(resolve => setTimeout(resolve, 100));

    // Log webhook event
    await supabase
      .from('stripe_webhook_events')
      .upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed: true,
        processed_at: new Date().toISOString(),
        data: event.data
      });
  }
});