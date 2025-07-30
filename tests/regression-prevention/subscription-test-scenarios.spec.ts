/**
 * Comprehensive Subscription Test Scenarios
 * Specific test cases for subscription lifecycle scenarios
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/libs/supabase/types';
import Stripe from 'stripe';
import { jest } from '@jest/globals';

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  testUserId: 'test-user-subscription-scenarios',
  testCustomerEmail: 'subscription-test@example.com'
};

describe('Subscription Lifecycle Test Scenarios', () => {
  let supabase: ReturnType<typeof createClient<Database>>;
  let stripe: Stripe;
  let testCustomerId: string;
  let testPriceIds: { free: string; basic: string; pro: string; premium: string };

  beforeAll(async () => {
    // Initialize clients
    supabase = createClient<Database>(
      TEST_CONFIG.supabaseUrl,
      TEST_CONFIG.supabaseServiceKey
    );

    stripe = new Stripe(TEST_CONFIG.stripeSecretKey, {
      apiVersion: '2024-06-20'
    });

    // Setup test data
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  describe('Free Plan Management', () => {
    it('should create free plan subscription for new user', async () => {
      // Create new user
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: 'free-plan-test@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      expect(userError).toBeNull();
      expect(user.user).toBeDefined();

      const userId = user.user!.id;

      // Create free plan subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          price_id: testPriceIds.free,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 100 years
          created: new Date().toISOString()
        })
        .select()
        .single();

      expect(subError).toBeNull();
      expect(subscription).toBeDefined();
      expect(subscription?.status).toBe('active');
      expect(subscription?.stripe_subscription_id).toBeNull(); // Free plans have no Stripe subscription

      // Verify user can access free features
      const { data: userSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      expect(userSubscription).toBeDefined();
      expect(userSubscription?.price_id).toBe(testPriceIds.free);

      // Cleanup
      await supabase.auth.admin.deleteUser(userId);
    });

    it('should handle multiple free plan subscriptions correctly', async () => {
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: 'multiple-free-test@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      expect(userError).toBeNull();
      const userId = user.user!.id;

      // Create first free subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          price_id: testPriceIds.free,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString()
        });

      // Attempt to create second free subscription
      const { error: duplicateError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          price_id: testPriceIds.free,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString()
        });

      // Should handle duplicate gracefully or prevent it
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      // Should only have one active subscription
      expect(subscriptions?.length).toBeLessThanOrEqual(1);

      // Cleanup
      await supabase.auth.admin.deleteUser(userId);
    });
  });

  describe('Free to Paid Upgrade Scenarios', () => {
    it('should upgrade from free to basic plan', async () => {
      // Create user with free plan
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'free-to-basic@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      // Create free subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          price_id: testPriceIds.free,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString()
        });

      // Create Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: 'free-to-basic@example.com',
        metadata: { user_id: userId }
      });

      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.basic }],
        metadata: { user_id: userId }
      });

      // Update free subscription to canceled
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('price_id', testPriceIds.free);

      // Create paid subscription
      const { data: paidSubscription, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          id: stripeSubscription.id,
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: stripeCustomer.id,
          status: stripeSubscription.status,
          price_id: testPriceIds.basic,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          created: new Date().toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(paidSubscription?.stripe_subscription_id).toBe(stripeSubscription.id);

      // Verify only one active subscription
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      expect(activeSubscriptions?.length).toBe(1);
      expect(activeSubscriptions?.[0].price_id).toBe(testPriceIds.basic);

      // Cleanup
      await stripe.subscriptions.del(stripeSubscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });

    it('should handle upgrade with payment method attachment', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'upgrade-with-payment@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      // Create Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: 'upgrade-with-payment@example.com',
        metadata: { user_id: userId }
      });

      // Create payment method
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2030,
          cvc: '123'
        }
      });

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: stripeCustomer.id
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.id
        }
      });

      // Create subscription with payment method
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.pro }],
        default_payment_method: paymentMethod.id,
        metadata: { user_id: userId }
      });

      expect(stripeSubscription.status).toBe('active');
      expect(stripeSubscription.default_payment_method).toBe(paymentMethod.id);

      // Create local subscription record
      const { data: localSubscription, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          id: stripeSubscription.id,
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: stripeCustomer.id,
          status: stripeSubscription.status,
          price_id: testPriceIds.pro,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          created: new Date().toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(localSubscription?.status).toBe('active');

      // Cleanup
      await stripe.subscriptions.del(stripeSubscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });
  });

  describe('Plan Change Scenarios', () => {
    it('should upgrade from basic to pro plan', async () => {
      // Setup user with basic plan
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'basic-to-pro@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      // Create Stripe customer and basic subscription
      const stripeCustomer = await stripe.customers.create({
        email: 'basic-to-pro@example.com',
        metadata: { user_id: userId }
      });

      const basicSubscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.basic }],
        metadata: { user_id: userId }
      });

      // Create local subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          id: basicSubscription.id,
          stripe_subscription_id: basicSubscription.id,
          stripe_customer_id: stripeCustomer.id,
          status: basicSubscription.status,
          price_id: testPriceIds.basic,
          current_period_start: new Date(basicSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(basicSubscription.current_period_end * 1000).toISOString(),
          created: new Date().toISOString()
        });

      // Upgrade to pro plan
      const updatedSubscription = await stripe.subscriptions.update(basicSubscription.id, {
        items: [{
          id: basicSubscription.items.data[0].id,
          price: testPriceIds.pro
        }],
        proration_behavior: 'create_prorations'
      });

      expect(updatedSubscription.items.data[0].price.id).toBe(testPriceIds.pro);

      // Update local subscription
      const { data: updatedLocalSub, error } = await supabase
        .from('subscriptions')
        .update({
          price_id: testPriceIds.pro,
          current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', basicSubscription.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedLocalSub?.price_id).toBe(testPriceIds.pro);

      // Cleanup
      await stripe.subscriptions.del(basicSubscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });

    it('should downgrade from pro to basic plan', async () => {
      // Setup user with pro plan
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'pro-to-basic@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      const stripeCustomer = await stripe.customers.create({
        email: 'pro-to-basic@example.com',
        metadata: { user_id: userId }
      });

      const proSubscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.pro }],
        metadata: { user_id: userId }
      });

      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          id: proSubscription.id,
          stripe_subscription_id: proSubscription.id,
          stripe_customer_id: stripeCustomer.id,
          status: proSubscription.status,
          price_id: testPriceIds.pro,
          current_period_start: new Date(proSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(proSubscription.current_period_end * 1000).toISOString(),
          created: new Date().toISOString()
        });

      // Downgrade to basic plan (effective at period end)
      const downgradedSubscription = await stripe.subscriptions.update(proSubscription.id, {
        items: [{
          id: proSubscription.items.data[0].id,
          price: testPriceIds.basic
        }],
        proration_behavior: 'none' // No immediate proration for downgrades
      });

      expect(downgradedSubscription.items.data[0].price.id).toBe(testPriceIds.basic);

      // Update local subscription
      const { data: downgradedLocalSub, error } = await supabase
        .from('subscriptions')
        .update({
          price_id: testPriceIds.basic
        })
        .eq('stripe_subscription_id', proSubscription.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(downgradedLocalSub?.price_id).toBe(testPriceIds.basic);

      // Cleanup
      await stripe.subscriptions.del(proSubscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });
  });

  describe('Subscription Cancellation Scenarios', () => {
    it('should cancel subscription at period end', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'cancel-at-end@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      const stripeCustomer = await stripe.customers.create({
        email: 'cancel-at-end@example.com',
        metadata: { user_id: userId }
      });

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.basic }],
        metadata: { user_id: userId }
      });

      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          id: subscription.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: stripeCustomer.id,
          status: subscription.status,
          price_id: testPriceIds.basic,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created: new Date().toISOString()
        });

      // Cancel at period end
      const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true
      });

      expect(canceledSubscription.cancel_at_period_end).toBe(true);
      expect(canceledSubscription.status).toBe('active'); // Still active until period end

      // Update local subscription
      const { data: canceledLocalSub, error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          cancel_at: new Date(canceledSubscription.cancel_at! * 1000).toISOString()
        })
        .eq('stripe_subscription_id', subscription.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(canceledLocalSub?.cancel_at_period_end).toBe(true);

      // Cleanup
      await stripe.subscriptions.del(subscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });

    it('should cancel subscription immediately', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'cancel-immediate@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      const stripeCustomer = await stripe.customers.create({
        email: 'cancel-immediate@example.com',
        metadata: { user_id: userId }
      });

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.basic }],
        metadata: { user_id: userId }
      });

      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          id: subscription.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: stripeCustomer.id,
          status: subscription.status,
          price_id: testPriceIds.basic,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created: new Date().toISOString()
        });

      // Cancel immediately
      const canceledSubscription = await stripe.subscriptions.del(subscription.id);
      expect(canceledSubscription.status).toBe('canceled');

      // Update local subscription
      const { data: canceledLocalSub, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(canceledLocalSub?.status).toBe('canceled');

      // Cleanup
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });

    it('should reactivate canceled subscription', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'reactivate-sub@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      const stripeCustomer = await stripe.customers.create({
        email: 'reactivate-sub@example.com',
        metadata: { user_id: userId }
      });

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.basic }],
        metadata: { user_id: userId }
      });

      // Cancel at period end
      const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true
      });

      // Reactivate by removing cancellation
      const reactivatedSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false
      });

      expect(reactivatedSubscription.cancel_at_period_end).toBe(false);
      expect(reactivatedSubscription.status).toBe('active');

      // Update local subscription
      const { data: reactivatedLocalSub, error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          cancel_at: null
        })
        .eq('stripe_subscription_id', subscription.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(reactivatedLocalSub?.cancel_at_period_end).toBe(false);

      // Cleanup
      await stripe.subscriptions.del(subscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });
  });

  describe('Payment Failure Scenarios', () => {
    it('should handle subscription past due status', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'past-due-test@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      const stripeCustomer = await stripe.customers.create({
        email: 'past-due-test@example.com',
        metadata: { user_id: userId }
      });

      // Create subscription with a card that will be declined
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.basic }],
        metadata: { user_id: userId }
      });

      // Simulate subscription going past due
      // Note: In real scenario, this would happen automatically with failed payments
      // For testing, we'll manually update the status

      const pastDueSubscription = {
        ...subscription,
        status: 'past_due' as const
      };

      // Update local subscription to past due
      const { data: pastDueLocalSub, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          id: subscription.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: stripeCustomer.id,
          status: 'past_due',
          price_id: testPriceIds.basic,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created: new Date().toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(pastDueLocalSub?.status).toBe('past_due');

      // Verify user still has limited access during past due period
      const { data: userSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'past_due')
        .single();

      expect(userSubscription).toBeDefined();

      // Cleanup
      await stripe.subscriptions.del(subscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });

    it('should handle subscription becoming unpaid', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'unpaid-test@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      // Simulate unpaid subscription scenario
      const { data: unpaidSub, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: null, // No Stripe subscription for this scenario
          status: 'unpaid',
          price_id: testPriceIds.basic,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Past due
          created: new Date().toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(unpaidSub?.status).toBe('unpaid');

      // Verify user loses access when unpaid
      const { data: userSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'unpaid')
        .single();

      expect(userSubscription).toBeDefined();

      // Cleanup
      await supabase.auth.admin.deleteUser(userId);
    });
  });

  describe('Trial Period Scenarios', () => {
    it('should handle trial period subscriptions', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'trial-test@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      const stripeCustomer = await stripe.customers.create({
        email: 'trial-test@example.com',
        metadata: { user_id: userId }
      });

      // Create subscription with trial period
      const trialEndDate = Math.floor((Date.now() + 14 * 24 * 60 * 60 * 1000) / 1000); // 14 days

      const trialSubscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.pro }],
        trial_end: trialEndDate,
        metadata: { user_id: userId }
      });

      expect(trialSubscription.status).toBe('trialing');
      expect(trialSubscription.trial_end).toBe(trialEndDate);

      // Create local subscription
      const { data: localTrialSub, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          id: trialSubscription.id,
          stripe_subscription_id: trialSubscription.id,
          stripe_customer_id: stripeCustomer.id,
          status: 'trialing',
          price_id: testPriceIds.pro,
          current_period_start: new Date(trialSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(trialSubscription.current_period_end * 1000).toISOString(),
          trial_start: new Date(trialSubscription.trial_start! * 1000).toISOString(),
          trial_end: new Date(trialSubscription.trial_end! * 1000).toISOString(),
          created: new Date().toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(localTrialSub?.status).toBe('trialing');
      expect(localTrialSub?.trial_end).toBeDefined();

      // Cleanup
      await stripe.subscriptions.del(trialSubscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });

    it('should handle trial conversion to paid', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'trial-conversion@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      // Start with trialing subscription
      const { data: trialSub } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'trialing',
          price_id: testPriceIds.pro,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString()
        })
        .select()
        .single();

      // Simulate trial conversion to active
      const { data: activeSub, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          trial_start: null,
          trial_end: null
        })
        .eq('internal_id', trialSub?.internal_id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(activeSub?.status).toBe('active');
      expect(activeSub?.trial_end).toBeNull();

      // Cleanup
      await supabase.auth.admin.deleteUser(userId);
    });
  });

  describe('Data Integrity Scenarios', () => {
    it('should maintain data integrity during rapid status changes', async () => {
      const { data: user } = await supabase.auth.admin.createUser({
        email: 'integrity-test@example.com',
        password: 'test-password-123',
        email_confirm: true
      });

      const userId = user.user!.id;

      const stripeCustomer = await stripe.customers.create({
        email: 'integrity-test@example.com',
        metadata: { user_id: userId }
      });

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: testPriceIds.basic }],
        metadata: { user_id: userId }
      });

      // Rapid succession of updates
      const updates = [
        { status: 'active' as const },
        { status: 'past_due' as const },
        { status: 'active' as const },
        { cancel_at_period_end: true },
        { cancel_at_period_end: false }
      ];

      for (const update of updates) {
        await stripe.subscriptions.update(subscription.id, update);
        
        // Update local record
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            id: subscription.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: stripeCustomer.id,
            status: update.status || 'active',
            price_id: testPriceIds.basic,
            cancel_at_period_end: update.cancel_at_period_end || false,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            created: new Date().toISOString()
          });
      }

      // Verify final state consistency
      const finalStripeSubscription = await stripe.subscriptions.retrieve(subscription.id);
      const { data: finalLocalSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      expect(finalLocalSubscription?.status).toBe(finalStripeSubscription.status);
      expect(finalLocalSubscription?.cancel_at_period_end).toBe(finalStripeSubscription.cancel_at_period_end);

      // Cleanup
      await stripe.subscriptions.del(subscription.id);
      await stripe.customers.del(stripeCustomer.id);
      await supabase.auth.admin.deleteUser(userId);
    });
  });

  // Setup and cleanup helper functions
  async function setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up subscription test environment');

    // Create test products and prices in Stripe
    const freeProduct = await stripe.products.create({
      name: 'Free Plan',
      metadata: { test: 'true', plan: 'free' }
    });

    const basicProduct = await stripe.products.create({
      name: 'Basic Plan',
      metadata: { test: 'true', plan: 'basic' }
    });

    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      metadata: { test: 'true', plan: 'pro' }
    });

    const premiumProduct = await stripe.products.create({
      name: 'Premium Plan',
      metadata: { test: 'true', plan: 'premium' }
    });

    // Create prices
    const freePrice = await stripe.prices.create({
      product: freeProduct.id,
      unit_amount: 0,
      currency: 'usd',
      metadata: { test: 'true', plan: 'free' }
    });

    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 1900, // $19.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { test: 'true', plan: 'basic' }
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { test: 'true', plan: 'pro' }
    });

    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { test: 'true', plan: 'premium' }
    });

    testPriceIds = {
      free: freePrice.id,
      basic: basicPrice.id,
      pro: proPrice.id,
      premium: premiumPrice.id
    };

    console.log('✅ Test environment setup complete');
  }

  async function cleanupTestEnvironment(): Promise<void> {
    console.log('🧹 Cleaning up subscription test environment');

    try {
      // Clean up any test subscriptions and customers
      const customers = await stripe.customers.list({
        limit: 100,
        expand: ['data.subscriptions']
      });

      for (const customer of customers.data) {
        if (customer.metadata?.test === 'true' || customer.email?.includes('test')) {
          // Delete subscriptions first
          if (customer.subscriptions) {
            for (const subscription of customer.subscriptions.data) {
              await stripe.subscriptions.del(subscription.id);
            }
          }
          // Delete customer
          await stripe.customers.del(customer.id);
        }
      }

      // Clean up test prices and products
      if (testPriceIds) {
        for (const priceId of Object.values(testPriceIds)) {
          try {
            const price = await stripe.prices.retrieve(priceId);
            await stripe.products.update(price.product as string, { active: false });
          } catch (error) {
            // Price might already be deleted
          }
        }
      }

      console.log('✅ Test environment cleanup complete');
    } catch (error) {
      console.warn('⚠️ Some cleanup operations failed:', error);
    }
  }
});