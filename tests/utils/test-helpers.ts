/**
 * Test helpers for integration tests
 * Provides utilities for creating and cleaning up test data
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize test Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create a test user for integration tests
 */
export async function createTestUser(overrides: any = {}) {
  const userId = uuidv4();
  const email = `test-${Date.now()}@example.com`;
  
  const userData = {
    id: userId,
    email,
    full_name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };

  // Insert into auth.users (using service role)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    email_confirm: true,
    user_metadata: {
      full_name: userData.full_name
    }
  });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  // Insert into public.users
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      full_name: userData.full_name,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    });

  if (userError) {
    throw new Error(`Failed to create user profile: ${userError.message}`);
  }

  return {
    id: authUser.user.id,
    email: authUser.user.email,
    full_name: userData.full_name,
    created_at: userData.created_at,
    updated_at: userData.updated_at
  };
}

/**
 * Clean up test user and all associated data
 */
export async function cleanupTestUser(userId: string) {
  try {
    // Delete from subscriptions
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    // Delete from customers
    await supabase
      .from('customers')
      .delete()
      .eq('id', userId);

    // Delete from payment_methods
    await supabase
      .from('payment_methods')
      .delete()
      .eq('user_id', userId);

    // Delete from billing_history
    await supabase
      .from('billing_history')
      .delete()
      .eq('user_id', userId);

    // Delete from quotes
    await supabase
      .from('quotes')
      .delete()
      .eq('user_id', userId);

    // Delete from clients
    await supabase
      .from('clients')
      .delete()
      .eq('user_id', userId);

    // Delete from line_items
    await supabase
      .from('line_items')
      .delete()
      .eq('user_id', userId);

    // Delete from item_categories
    await supabase
      .from('item_categories')
      .delete()
      .eq('user_id', userId);

    // Delete from company_settings
    await supabase
      .from('company_settings')
      .delete()
      .eq('id', userId);

    // Delete from public.users
    await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    // Delete from auth.users (using admin API)
    await supabase.auth.admin.deleteUser(userId);

  } catch (error) {
    console.warn(`Warning: Failed to cleanup test user ${userId}:`, error);
    // Don't throw - cleanup should be best effort
  }
}

/**
 * Create a test Stripe customer
 */
export function createTestStripeCustomer(overrides: any = {}) {
  return {
    id: `cus_test_${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    created: Math.floor(Date.now() / 1000),
    deleted: false,
    invoice_settings: {
      default_payment_method: null
    },
    metadata: {
      user_id: uuidv4(),
      created_by: 'test_suite'
    },
    ...overrides
  };
}

/**
 * Create test subscription data
 */
export function createTestSubscription(userId: string, overrides: any = {}) {
  return {
    id: `sub_test_${Date.now()}`,
    user_id: userId,
    stripe_subscription_id: `sub_stripe_${Date.now()}`,
    stripe_price_id: 'price_test_pro_monthly',
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created: new Date().toISOString(),
    cancel_at_period_end: false,
    ...overrides
  };
}

/**
 * Create test payment method data
 */
export function createTestPaymentMethod(userId: string, overrides: any = {}) {
  return {
    id: `pm_test_${Date.now()}`,
    user_id: userId,
    stripe_payment_method_id: `pm_stripe_${Date.now()}`,
    type: 'card',
    card_brand: 'visa',
    card_last4: '4242',
    card_exp_month: 12,
    card_exp_year: 2025,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create test price data
 */
export function createTestPrice(overrides: any = {}) {
  return {
    id: `price_test_${Date.now()}`,
    stripe_price_id: `price_stripe_${Date.now()}`,
    stripe_product_id: 'prod_test_123',
    unit_amount: 2900,
    currency: 'usd',
    recurring_interval: 'month',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create test product data
 */
export function createTestProduct(overrides: any = {}) {
  return {
    id: 'prod_test_123',
    stripe_product_id: 'prod_stripe_123',
    name: 'Test Product',
    description: 'Test product for integration tests',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Setup test database with required data
 */
export async function setupTestDatabase() {
  // Insert test products
  const { error: productError } = await supabase
    .from('stripe_products')
    .upsert([
      createTestProduct({
        id: 'prod_test',
        stripe_product_id: 'prod_test',
        name: 'Pro Plan'
      })
    ]);

  if (productError) {
    console.warn('Failed to setup test products:', productError);
  }

  // Insert test prices
  const { error: priceError } = await supabase
    .from('stripe_prices')
    .upsert([
      createTestPrice({
        id: 'price_test_pro_monthly',
        stripe_price_id: 'price_test_pro_monthly',
        stripe_product_id: 'prod_test'
      }),
      createTestPrice({
        id: 'price_test_basic_monthly',
        stripe_price_id: 'price_test_basic_monthly',
        stripe_product_id: 'prod_basic',
        unit_amount: 1900
      }),
      createTestPrice({
        id: 'price_test_starter_monthly',
        stripe_price_id: 'price_test_starter_monthly',
        stripe_product_id: 'prod_starter',
        unit_amount: 900
      })
    ]);

  if (priceError) {
    console.warn('Failed to setup test prices:', priceError);
  }
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase() {
  try {
    // Clean up test data
    await supabase
      .from('stripe_prices')
      .delete()
      .like('id', 'price_test_%');

    await supabase
      .from('stripe_products')
      .delete()
      .like('id', 'prod_test%');

  } catch (error) {
    console.warn('Warning: Failed to cleanup test database:', error);
  }
}

/**
 * Wait for a condition to be true (useful for async operations)
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a mock Stripe webhook event
 */
export function createMockWebhookEvent(type: string, data: any) {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    data: {
      object: data
    },
    created: Math.floor(Date.now() / 1000),
    api_version: '2023-10-16',
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: null
    }
  };
}

/**
 * Generate a test webhook signature
 */
export function generateTestWebhookSignature(payload: string, secret: string = 'whsec_test123'): string {
  const timestamp = Math.floor(Date.now() / 1000);
  // This is a simplified mock signature for testing
  return `t=${timestamp},v1=${Buffer.from(payload + secret).toString('base64')}`;
}
