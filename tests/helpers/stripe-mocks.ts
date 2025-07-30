/**
 * Stripe API mocks for integration testing
 */

import { jest } from '@jest/globals';

// Mock Stripe client factory
export const createMockStripeClient = () => {
  const mockStripe = {
    // Customer operations
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_mock123',
        email: 'test@example.com',
        created: Math.floor(Date.now() / 1000),
        deleted: false,
        invoice_settings: {
          default_payment_method: null
        },
        metadata: {}
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cus_mock123',
        email: 'test@example.com',
        created: Math.floor(Date.now() / 1000),
        deleted: false,
        invoice_settings: {
          default_payment_method: null
        },
        metadata: {}
      }),
      update: jest.fn().mockResolvedValue({
        id: 'cus_mock123',
        email: 'test@example.com',
        invoice_settings: {
          default_payment_method: 'pm_mock123'
        }
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        has_more: false
      }),
      delete: jest.fn().mockResolvedValue({
        id: 'cus_mock123',
        deleted: true
      })
    },

    // Subscription operations
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_mock123',
        customer: 'cus_mock123',
        status: 'active',
        items: {
          data: [{
            id: 'si_mock123',
            price: {
              id: 'price_mock123',
              unit_amount: 2900,
              currency: 'usd',
              recurring: { interval: 'month' }
            }
          }]
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        cancel_at_period_end: false
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'sub_mock123',
        customer: 'cus_mock123',
        status: 'active',
        items: {
          data: [{
            id: 'si_mock123',
            price: {
              id: 'price_mock123',
              unit_amount: 2900,
              currency: 'usd',
              recurring: { interval: 'month' }
            }
          }]
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        cancel_at_period_end: false
      }),
      update: jest.fn().mockResolvedValue({
        id: 'sub_mock123',
        customer: 'cus_mock123',
        status: 'active',
        cancel_at_period_end: true
      }),
      cancel: jest.fn().mockResolvedValue({
        id: 'sub_mock123',
        customer: 'cus_mock123',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000)
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        has_more: false
      })
    },

    // Payment Method operations
    paymentMethods: {
      create: jest.fn().mockResolvedValue({
        id: 'pm_mock123',
        type: 'card',
        card: {
          brand: 'visa',
          country: 'US',
          exp_month: 12,
          exp_year: 2025,
          last4: '4242',
          funding: 'credit'
        },
        created: Math.floor(Date.now() / 1000)
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pm_mock123',
        type: 'card',
        card: {
          brand: 'visa',
          country: 'US',
          exp_month: 12,
          exp_year: 2025,
          last4: '4242',
          funding: 'credit'
        }
      }),
      attach: jest.fn().mockResolvedValue({
        id: 'pm_mock123',
        customer: 'cus_mock123'
      }),
      detach: jest.fn().mockResolvedValue({
        id: 'pm_mock123',
        customer: null
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        has_more: false
      })
    },

    // Setup Intent operations
    setupIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'seti_mock123',
        client_secret: 'seti_mock123_secret_abc123',
        customer: 'cus_mock123',
        payment_method_types: ['card'],
        status: 'requires_payment_method',
        usage: 'off_session'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'seti_mock123',
        client_secret: 'seti_mock123_secret_abc123',
        status: 'succeeded',
        payment_method: 'pm_mock123'
      }),
      confirm: jest.fn().mockResolvedValue({
        id: 'seti_mock123',
        status: 'succeeded',
        payment_method: 'pm_mock123'
      })
    },

    // Checkout Session operations
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_mock123',
          url: 'https://checkout.stripe.com/c/pay/cs_mock123',
          customer: 'cus_mock123',
          payment_status: 'unpaid',
          mode: 'subscription'
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'cs_mock123',
          customer: 'cus_mock123',
          customer_details: {
            email: 'test@example.com'
          },
          payment_status: 'paid',
          mode: 'subscription',
          subscription: 'sub_mock123'
        }),
        list: jest.fn().mockResolvedValue({
          data: [],
          has_more: false
        })
      }
    },

    // Invoice operations
    invoices: {
      create: jest.fn().mockResolvedValue({
        id: 'in_mock123',
        customer: 'cus_mock123',
        amount_paid: 2900,
        status: 'paid'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'in_mock123',
        customer: 'cus_mock123',
        amount_paid: 2900,
        status: 'paid',
        hosted_invoice_url: 'https://invoice.stripe.com/i/acct_test/in_mock123'
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        has_more: false
      }),
      pay: jest.fn().mockResolvedValue({
        id: 'in_mock123',
        status: 'paid'
      })
    },

    // Product operations
    products: {
      create: jest.fn().mockResolvedValue({
        id: 'prod_mock123',
        name: 'Test Product',
        description: 'Test product description',
        active: true,
        created: Math.floor(Date.now() / 1000)
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'prod_mock123',
        name: 'Test Product',
        active: true
      }),
      update: jest.fn().mockResolvedValue({
        id: 'prod_mock123',
        name: 'Updated Test Product',
        active: true
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        has_more: false
      })
    },

    // Price operations
    prices: {
      create: jest.fn().mockResolvedValue({
        id: 'price_mock123',
        product: 'prod_mock123',
        unit_amount: 2900,
        currency: 'usd',
        recurring: { interval: 'month' },
        active: true,
        created: Math.floor(Date.now() / 1000)
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'price_mock123',
        product: 'prod_mock123',
        unit_amount: 2900,
        currency: 'usd',
        recurring: { interval: 'month' },
        active: true
      }),
      update: jest.fn().mockResolvedValue({
        id: 'price_mock123',
        active: false
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        has_more: false
      })
    },

    // Webhook operations
    webhooks: {
      constructEvent: jest.fn().mockImplementation((body, signature, secret) => {
        // Mock webhook event construction
        try {
          const parsedBody = JSON.parse(body);
          return {
            id: parsedBody.id || 'evt_mock123',
            type: parsedBody.type || 'customer.subscription.created',
            data: parsedBody.data || { object: {} },
            created: Math.floor(Date.now() / 1000)
          };
        } catch {
          throw new Error('Invalid payload');
        }
      })
    },

    // WebhookEndpoint operations
    webhookEndpoints: {
      create: jest.fn().mockResolvedValue({
        id: 'we_mock123',
        url: 'https://example.com/webhook',
        enabled_events: ['customer.subscription.created'],
        status: 'enabled'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'we_mock123',
        url: 'https://example.com/webhook',
        enabled_events: ['customer.subscription.created'],
        status: 'enabled'
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        has_more: false
      })
    }
  };

  return mockStripe;
};

// Helper to mock Stripe errors
export const mockStripeError = (mockStripe: any, method: string, operation: string, error: any) => {
  const [service, func] = method.split('.');
  if (mockStripe[service] && mockStripe[service][func]) {
    mockStripe[service][func].mockRejectedValue(error);
  }
};

// Helper to mock Stripe timeouts
export const mockStripeTimeout = (mockStripe: any, method: string, delay: number = 5000) => {
  const [service, func] = method.split('.');
  if (mockStripe[service] && mockStripe[service][func]) {
    mockStripe[service][func].mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), delay)
      )
    );
  }
};

// Helper to mock successful Stripe operations
export const mockStripeSuccess = (mockStripe: any, method: string, result: any) => {
  const [service, func] = method.split('.');
  if (mockStripe[service] && mockStripe[service][func]) {
    mockStripe[service][func].mockResolvedValue(result);
  }
};

// Helper to create mock Stripe webhook events
export const createMockWebhookEvent = (type: string, data: any = {}) => ({
  id: `evt_${Math.random().toString(36).substr(2, 9)}`,
  type,
  data: { object: data },
  created: Math.floor(Date.now() / 1000),
  api_version: '2023-10-16',
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: `req_${Math.random().toString(36).substr(2, 9)}`,
    idempotency_key: null
  }
});

// Helper to simulate webhook signature validation
export const simulateWebhookSignature = (payload: string, secret: string = 'whsec_test123') => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = `t=${timestamp},v1=mock_signature_${Buffer.from(payload + secret).toString('base64').slice(0, 10)}`;
  return signature;
};

// Helper to reset all Stripe mocks
export const resetStripeMocks = (mockStripe: any) => {
  Object.keys(mockStripe).forEach(service => {
    if (typeof mockStripe[service] === 'object') {
      Object.keys(mockStripe[service]).forEach(method => {
        if (jest.isMockFunction(mockStripe[service][method])) {
          mockStripe[service][method].mockClear();
        }
      });
    }
  });
};

// Helper to verify Stripe API calls
export const verifyStripeCall = (mockStripe: any, method: string, expectedParams?: any) => {
  const [service, func] = method.split('.');
  const mockFn = mockStripe[service][func];
  
  expect(mockFn).toHaveBeenCalled();
  
  if (expectedParams) {
    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining(expectedParams)
    );
  }
};

// Helper to count Stripe API calls
export const countStripeCalls = (mockStripe: any, method: string): number => {
  const [service, func] = method.split('.');
  const mockFn = mockStripe[service][func];
  return mockFn.mock.calls.length;
};

// Helper to get last Stripe API call parameters
export const getLastStripeCall = (mockStripe: any, method: string): any[] => {
  const [service, func] = method.split('.');
  const mockFn = mockStripe[service][func];
  const calls = mockFn.mock.calls;
  return calls[calls.length - 1] || [];
};

// Helper to mock Stripe configuration
export const mockStripeConfig = (config: any = null) => {
  if (config) {
    return {
      secret_key: config.secret_key || 'sk_test_123',
      publishable_key: config.publishable_key || 'pk_test_123',
      webhook_secret: config.webhook_secret || 'whsec_test123',
      mode: config.mode || 'test'
    };
  }
  return null;
};

// Helper to create mock Stripe customer
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

// Helper to create mock Stripe subscription
export const createMockStripeSubscription = (overrides: any = {}) => ({
  id: `sub_${Math.random().toString(36).substr(2, 9)}`,
  customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
  status: 'active',
  items: {
    data: [{
      id: `si_${Math.random().toString(36).substr(2, 9)}`,
      price: {
        id: `price_${Math.random().toString(36).substr(2, 9)}`,
        unit_amount: 2900,
        currency: 'usd',
        recurring: { interval: 'month' }
      }
    }]
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

// Helper to create mock Stripe payment method
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

// Helper to create mock setup intent
export const createMockSetupIntent = (overrides: any = {}) => ({
  id: `seti_${Math.random().toString(36).substr(2, 9)}`,
  client_secret: `seti_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
  customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
  payment_method_types: ['card'],
  status: 'requires_payment_method',
  usage: 'off_session',
  ...overrides
});

// Helper to create mock invoice
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
    data: [{
      id: `il_${Math.random().toString(36).substr(2, 9)}`,
      description: 'Subscription for Test Product',
      amount: 2900
    }]
  },
  ...overrides
});

// Helper to create mock product
export const createMockProduct = (overrides: any = {}) => ({
  id: `prod_${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Product',
  description: 'Test product description',
  active: true,
  created: Math.floor(Date.now() / 1000),
  updated: Math.floor(Date.now() / 1000),
  metadata: {},
  ...overrides
});

// Helper to create mock price
export const createMockPrice = (overrides: any = {}) => ({
  id: `price_${Math.random().toString(36).substr(2, 9)}`,
  product: `prod_${Math.random().toString(36).substr(2, 9)}`,
  unit_amount: 2900,
  currency: 'usd',
  recurring: { interval: 'month' },
  active: true,
  created: Math.floor(Date.now() / 1000),
  metadata: {},
  ...overrides
});

// Common Stripe error types
export const StripeErrors = {
  INVALID_API_KEY: {
    type: 'invalid_request_error',
    code: 'invalid_api_key',
    message: 'Invalid API Key provided'
  },
  RESOURCE_NOT_FOUND: {
    type: 'invalid_request_error',
    code: 'resource_missing',
    message: 'No such resource'
  },
  CARD_DECLINED: {
    type: 'card_error',
    code: 'card_declined',
    message: 'Your card was declined'
  },
  RATE_LIMIT: {
    type: 'rate_limit_error',
    message: 'Too many requests made to the API too quickly'
  },
  API_CONNECTION: {
    type: 'api_connection_error',
    message: 'Network communication with Stripe failed'
  }
};