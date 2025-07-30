/**
 * Test utilities and mock factories for integration tests
 */

import { NextRequest } from 'next/server';

// User mock factory
export const createMockUser = (overrides: any = {}) => ({
  id: 'user_test123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Subscription mock factory
export const createMockSubscription = (type: 'free' | 'paid' = 'paid', overrides: any = {}) => ({
  id: type === 'paid' ? `sub_${Math.random().toString(36).substr(2, 9)}` : `free_${Math.random().toString(36).substr(2, 9)}`,
  internal_id: `internal_${Math.random().toString(36).substr(2, 9)}`,
  user_id: 'user_test123',
  stripe_subscription_id: type === 'paid' ? `sub_${Math.random().toString(36).substr(2, 9)}` : null,
  stripe_price_id: type === 'paid' ? 'price_test123' : null,
  status: 'active',
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created: new Date().toISOString(),
  metadata: { plan_type: type },
  cancel_at_period_end: false,
  cancel_at: null,
  canceled_at: null,
  ended_at: null,
  trial_start: null,
  trial_end: null,
  ...overrides
});

// Stripe subscription mock factory (for webhook events)
export const createMockStripeSubscription = (overrides: any = {}) => ({
  id: 'sub_stripe123',
  customer: 'cus_stripe123',
  status: 'active',
  items: {
    data: [
      {
        id: 'si_test123',
        price: {
          id: 'price_test123',
          unit_amount: 2900,
          currency: 'usd',
          recurring: { interval: 'month' }
        }
      }
    ]
  },
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
  cancel_at_period_end: false,
  cancel_at: null,
  canceled_at: null,
  ended_at: null,
  trial_start: null,
  trial_end: null,
  metadata: {},
  ...overrides
});

// Stripe event mock factory
export const createMockStripeEvent = (type: string, eventId?: string) => ({
  id: eventId || `evt_${Math.random().toString(36).substr(2, 9)}`,
  type,
  data: {
    object: type.startsWith('customer.subscription.') 
      ? createMockStripeSubscription()
      : {}
  },
  created: Math.floor(Date.now() / 1000),
  api_version: '2023-10-16',
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: `req_${Math.random().toString(36).substr(2, 9)}`,
    idempotency_key: null
  }
});

// Product mock factory
export const createMockProduct = (overrides: any = {}) => ({
  stripe_product_id: `prod_${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Product',
  description: 'Test product description',
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  prices: [createMockPrice()],
  ...overrides
});

// Price mock factory
export const createMockPrice = (overrides: any = {}) => ({
  stripe_price_id: `price_${Math.random().toString(36).substr(2, 9)}`,
  stripe_product_id: `prod_${Math.random().toString(36).substr(2, 9)}`,
  unit_amount: 2900,
  currency: 'usd',
  recurring_interval: 'month',
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  interval: 'month', // Compatibility field
  type: 'recurring' as const,
  ...overrides
});

// Stripe customer mock factory
export const createMockStripeCustomer = (overrides: any = {}) => ({
  id: `cus_${Math.random().toString(36).substr(2, 9)}`,
  email: 'test@example.com',
  created: Math.floor(Date.now() / 1000),
  deleted: false,
  invoice_settings: {
    default_payment_method: null
  },
  metadata: {
    userId: 'user_test123'
  },
  ...overrides
});

// Payment method mock factory
export const createMockPaymentMethod = (overrides: any = {}) => ({
  id: `pm_${Math.random().toString(36).substr(2, 9)}`,
  type: 'card',
  card: {
    brand: 'visa',
    country: 'US',
    exp_month: 12,
    exp_year: 2025,
    last4: '4242',
    funding: 'credit'
  },
  created: Math.floor(Date.now() / 1000),
  customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
  ...overrides
});

// Setup intent mock factory
export const createMockSetupIntent = (overrides: any = {}) => ({
  id: `seti_${Math.random().toString(36).substr(2, 9)}`,
  client_secret: `seti_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
  customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
  payment_method_types: ['card'],
  status: 'requires_payment_method',
  usage: 'off_session',
  ...overrides
});

// Checkout session mock factory
export const createMockCheckoutSession = (overrides: any = {}) => ({
  id: `cs_${Math.random().toString(36).substr(2, 9)}`,
  customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
  customer_details: {
    email: 'test@example.com'
  },
  payment_status: 'paid',
  mode: 'subscription',
  subscription: `sub_${Math.random().toString(36).substr(2, 9)}`,
  url: `https://checkout.stripe.com/c/pay/cs_${Math.random().toString(36).substr(2, 9)}`,
  ...overrides
});

// Invoice mock factory
export const createMockInvoice = (overrides: any = {}) => ({
  id: `in_${Math.random().toString(36).substr(2, 9)}`,
  customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
  amount_paid: 2900,
  amount_due: 0,
  status: 'paid',
  created: Math.floor(Date.now() / 1000),
  hosted_invoice_url: `https://invoice.stripe.com/i/acct_test/${Math.random().toString(36).substr(2, 9)}`,
  invoice_pdf: `https://pay.stripe.com/invoice/${Math.random().toString(36).substr(2, 9)}/pdf`,
  lines: {
    data: [
      {
        id: `il_${Math.random().toString(36).substr(2, 9)}`,
        description: 'Subscription for Test Product',
        amount: 2900
      }
    ]
  },
  ...overrides
});

// Mock Next.js request factory
export const createMockRequest = (
  body?: string | object,
  method: string = 'GET',
  params?: any,
  headers: Record<string, string> = {}
): NextRequest => {
  const url = 'http://localhost:3000/api/test';
  const requestBody = typeof body === 'string' ? body : JSON.stringify(body);
  
  const request = new NextRequest(url, {
    method,
    body: method !== 'GET' ? requestBody : undefined,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  });

  // Add params if provided (for dynamic routes)
  if (params) {
    (request as any).params = params;
  }

  return request;
};

// Mock Stripe webhook signature
export const createMockWebhookSignature = (payload: string, secret: string = 'whsec_test123') => {
  // This is a simplified mock - in real tests you might use the actual Stripe signature
  return `t=${Math.floor(Date.now() / 1000)},v1=${Buffer.from(payload + secret).toString('base64')}`;
};

// Database test utilities
export const truncateTable = async (tableName: string) => {
  // Mock implementation - in real tests this would clear the test database
  console.log(`Truncating table: ${tableName}`);
};

export const seedTestUser = async (userData: any = {}) => {
  // Mock implementation - in real tests this would seed test data
  const user = createMockUser(userData);
  console.log(`Seeding test user: ${user.id}`);
  return user;
};

export const seedTestPlans = async () => {
  // Mock implementation - in real tests this would seed test plans
  const plans = [
    createMockProduct({ name: 'Free Plan' }),
    createMockProduct({ name: 'Basic Plan' }),
    createMockProduct({ name: 'Pro Plan' })
  ];
  console.log(`Seeding ${plans.length} test plans`);
  return plans;
};

// Performance testing utilities
export const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  
  return {
    result,
    duration: endTime - startTime
  };
};

// Concurrency testing utilities
export const createConcurrentRequests = <T>(requestFn: () => Promise<T>, count: number): Promise<T>[] => {
  return Array.from({ length: count }, () => requestFn());
};

// Error simulation utilities
export const simulateError = (errorMessage: string, delay: number = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, delay);
  });
};

// Mock service response factories
export const createSuccessResponse = <T>(data: T) => ({
  success: true,
  data,
  error: null
});

export const createErrorResponse = (error: string, statusCode: number = 500) => ({
  success: false,
  data: null,
  error,
  statusCode
});

// Test environment utilities
export const setupTestEnvironment = () => {
  // Mock environment variables
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
  
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
};

export const cleanupTestEnvironment = () => {
  // Restore console methods
  (console.log as jest.Mock).mockRestore();
  (console.warn as jest.Mock).mockRestore();
  (console.error as jest.Mock).mockRestore();
  
  // Clear environment variables
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SITE_URL;
};

// Assertion helpers
export const expectSubscriptionToMatch = (actual: any, expected: any) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.user_id).toBe(expected.user_id);
  expect(actual.status).toBe(expected.status);
  expect(actual.stripe_price_id).toBe(expected.stripe_price_id);
};

export const expectPaymentMethodToMatch = (actual: any, expected: any) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.type).toBe(expected.type);
  expect(actual.card.last4).toBe(expected.card.last4);
  expect(actual.card.brand).toBe(expected.card.brand);
};

// Time utilities for tests
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const createDateString = (daysFromNow: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

export const createUnixTimestamp = (daysFromNow: number = 0): number => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return Math.floor(date.getTime() / 1000);
};