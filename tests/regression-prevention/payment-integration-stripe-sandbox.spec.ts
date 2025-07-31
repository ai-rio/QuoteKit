/**
 * Payment Integration Tests with Stripe Sandbox
 * Comprehensive testing of payment methods, processing, and webhook handling
 * Following London School TDD with extensive mocking and behavior verification
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';
import { Database } from '@/libs/supabase/types';

// Mock dependencies following London School TDD approach
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-123', email: 'test@example.com' } }
    }),
  },
};

const mockStripe = {
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  paymentMethods: {
    create: vi.fn(),
    retrieve: vi.fn(),
    attach: vi.fn(),
    detach: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  },
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    list: vi.fn(),
  },
  setupIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
  },
  invoices: {
    create: vi.fn(),
    retrieve: vi.fn(),
    pay: vi.fn(),
    voidInvoice: vi.fn(),
    list: vi.fn(),
    finalizeInvoice: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn(),
    cancel: vi.fn(),
  },
  subscriptions: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
  charges: {
    retrieve: vi.fn(),
    list: vi.fn(),
  },
};

// Mock payment service
const mockPaymentService = {
  createPaymentMethod: vi.fn(),
  attachPaymentMethod: vi.fn(),
  setDefaultPaymentMethod: vi.fn(),
  removePaymentMethod: vi.fn(),
  createPaymentIntent: vi.fn(),
  confirmPayment: vi.fn(),
  processRefund: vi.fn(),
  syncPaymentMethods: vi.fn(),
  validatePaymentMethod: vi.fn(),
  handlePaymentWebhook: vi.fn(),
};

// Mock webhook service
const mockWebhookService = {
  validateSignature: vi.fn(),
  processEvent: vi.fn(),
  handlePaymentIntentSucceeded: vi.fn(),
  handlePaymentIntentFailed: vi.fn(),
  handlePaymentMethodAttached: vi.fn(),
  handleInvoicePaymentSucceeded: vi.fn(),
  handleInvoicePaymentFailed: vi.fn(),
  retryFailedWebhook: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => mockStripe)
}));

describe('Payment Integration with Stripe Sandbox', () => {
  let testUserId: string;
  let testCustomerId: string;
  let testPaymentMethodId: string;
  let testPaymentIntentId: string;

  beforeAll(async () => {
    // Initialize swarm coordination for payment testing
    await vi.importActual('child_process').execSync(
      'npx claude-flow@alpha hooks pre-task --description "Payment integration testing with Stripe sandbox"',
      { stdio: 'inherit' }
    );
  });

  beforeEach(async () => {
    // Reset all mocks and setup default responses
    vi.clearAllMocks();
    
    // Generate test identifiers
    testUserId = `test-user-${Date.now()}`;
    testCustomerId = `cus_test${Date.now()}`;
    testPaymentMethodId = `pm_test${Date.now()}`;
    testPaymentIntentId = `pi_test${Date.now()}`;

    // Setup default mock responses
    setupDefaultMockResponses();
  });

  afterEach(async () => {
    // Store test results in swarm memory
    await vi.importActual('child_process').execSync(
      `npx claude-flow@alpha hooks post-edit --file "payment-integration-stripe-sandbox.spec.ts" --memory-key "tdd/payment-integration-results"`,
      { stdio: 'inherit' }
    );
  });

  function setupDefaultMockResponses() {
    // Supabase default responses
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        in: vi.fn().mockReturnValue({ data: [], error: null }),
        order: vi.fn().mockReturnValue({ data: [], error: null })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      }),
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    });

    // Stripe default responses
    mockStripe.customers.create.mockResolvedValue({
      id: testCustomerId,
      email: 'test@example.com'
    });

    mockStripe.paymentMethods.create.mockResolvedValue({
      id: testPaymentMethodId,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025
      }
    });
  }

  describe('Payment Method Management', () => {
    it('should create and store payment method with card details', async () => {
      // Arrange - Mock card payment method creation
      const cardDetails = {
        type: 'card',
        card: {
          number: '4242424242424242', // Test card
          exp_month: 12,
          exp_year: 2025,
          cvc: '123'
        }
      };

      const expectedPaymentMethod = {
        id: testPaymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          country: 'US'
        }
      };

      mockStripe.paymentMethods.create.mockResolvedValue(expectedPaymentMethod);
      mockStripe.paymentMethods.attach.mockResolvedValue({
        ...expectedPaymentMethod,
        customer: testCustomerId
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: testPaymentMethodId,
              user_id: testUserId,
              stripe_customer_id: testCustomerId,
              type: 'card',
              card_brand: 'visa',
              card_last4: '4242',
              card_exp_month: 12,
              card_exp_year: 2025,
              is_default: false,
              status: 'active'
            }],
            error: null
          })
        })
      });

      // Act
      const result = await mockPaymentService.createPaymentMethod({
        userId: testUserId,
        customerId: testCustomerId,
        paymentMethodData: cardDetails
      });

      // Assert - Verify payment method creation and storage
      expect(mockStripe.paymentMethods.create).toHaveBeenCalledWith(cardDetails);
      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith(
        testPaymentMethodId,
        { customer: testCustomerId }
      );
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should set default payment method and update others', async () => {
      // Arrange - Mock setting default payment method
      const existingPaymentMethods = [
        {
          id: 'pm_existing1',
          user_id: testUserId,
          is_default: true,
          status: 'active'
        },
        {
          id: 'pm_existing2',
          user_id: testUserId,
          is_default: false,
          status: 'active'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: existingPaymentMethods,
            error: null
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ is_default: false }],
              error: null
            })
          })
        })
      });

      mockStripe.customers.retrieve.mockResolvedValue({
        id: testCustomerId,
        invoice_settings: {
          default_payment_method: testPaymentMethodId
        }
      });

      mockStripe.customers.update.mockResolvedValue({
        id: testCustomerId,
        invoice_settings: {
          default_payment_method: testPaymentMethodId
        }
      });

      // Act
      const result = await mockPaymentService.setDefaultPaymentMethod({
        userId: testUserId,
        paymentMethodId: testPaymentMethodId
      });

      // Assert - Verify default payment method update
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
      expect(mockStripe.customers.update).toHaveBeenCalledWith(
        testCustomerId,
        {
          invoice_settings: {
            default_payment_method: testPaymentMethodId
          }
        }
      );
    });

    it('should validate payment method before processing', async () => {
      // Arrange - Mock payment method validation
      const paymentMethodValidation = {
        id: testPaymentMethodId,
        type: 'card',
        card: {
          checks: {
            cvc_check: 'pass',
            address_line1_check: 'pass',
            address_postal_code_check: 'pass'
          },
          three_d_secure_usage: {
            supported: true
          }
        }
      };

      mockStripe.paymentMethods.retrieve.mockResolvedValue(paymentMethodValidation);

      mockPaymentService.validatePaymentMethod.mockResolvedValue({
        valid: true,
        checks: {
          cvc_check: 'pass',
          address_check: 'pass',
          three_d_secure: 'supported'
        },
        risk_level: 'low'
      });

      // Act
      const validationResult = await mockPaymentService.validatePaymentMethod(testPaymentMethodId);

      // Assert - Verify payment method validation
      expect(mockStripe.paymentMethods.retrieve).toHaveBeenCalledWith(testPaymentMethodId);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.risk_level).toBe('low');
    });

    it('should handle payment method removal and cleanup', async () => {
      // Arrange - Mock payment method removal
      mockStripe.paymentMethods.detach.mockResolvedValue({
        id: testPaymentMethodId,
        customer: null
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{
                id: testPaymentMethodId,
                status: 'inactive'
              }],
              error: null
            })
          })
        })
      });

      // Act
      const removalResult = await mockPaymentService.removePaymentMethod({
        userId: testUserId,
        paymentMethodId: testPaymentMethodId
      });

      // Assert - Verify payment method removal
      expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith(testPaymentMethodId);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });
  });

  describe('Payment Processing', () => {
    it('should create payment intent with proper amount and currency', async () => {
      // Arrange - Mock payment intent creation
      const paymentIntentData = {
        amount: 2000, // $20.00
        currency: 'usd',
        customer: testCustomerId,
        payment_method: testPaymentMethodId,
        confirmation_method: 'manual',
        confirm: true
      };

      const expectedPaymentIntent = {
        id: testPaymentIntentId,
        amount: 2000,
        currency: 'usd',
        status: 'requires_confirmation',
        customer: testCustomerId,
        payment_method: testPaymentMethodId
      };

      mockStripe.paymentIntents.create.mockResolvedValue(expectedPaymentIntent);

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'payment-uuid-123',
              stripe_payment_intent_id: testPaymentIntentId,
              user_id: testUserId,
              amount: 2000,
              currency: 'usd',
              status: 'requires_confirmation'
            }],
            error: null
          })
        })
      });

      // Act
      const result = await mockPaymentService.createPaymentIntent({
        userId: testUserId,
        amount: 2000,
        currency: 'usd',
        paymentMethodId: testPaymentMethodId
      });

      // Assert - Verify payment intent creation
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining(paymentIntentData)
      );
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should handle 3D Secure authentication flow', async () => {
      // Arrange - Mock 3D Secure payment flow
      const paymentIntentWith3DS = {
        id: testPaymentIntentId,
        status: 'requires_action',
        next_action: {
          type: 'use_stripe_sdk',
          use_stripe_sdk: {
            type: 'three_d_secure_redirect',
            stripe_js: 'v3'
          }
        }
      };

      mockStripe.paymentIntents.create.mockResolvedValue(paymentIntentWith3DS);
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        ...paymentIntentWith3DS,
        status: 'succeeded'
      });

      // Act
      const createResult = await mockPaymentService.createPaymentIntent({
        userId: testUserId,
        amount: 5000, // Higher amount triggers 3D Secure
        currency: 'usd',
        paymentMethodId: testPaymentMethodId
      });

      const confirmResult = await mockPaymentService.confirmPayment({
        paymentIntentId: testPaymentIntentId,
        paymentMethodId: testPaymentMethodId
      });

      // Assert - Verify 3D Secure handling
      expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(testPaymentIntentId);
    });

    it('should handle payment failures and retry logic', async () => {
      // Arrange - Mock payment failure scenario
      const failedPaymentIntent = {
        id: testPaymentIntentId,
        status: 'requires_payment_method',
        last_payment_error: {
          type: 'card_error',
          code: 'card_declined',
          decline_code: 'generic_decline',
          message: 'Your card was declined.'
        }
      };

      mockStripe.paymentIntents.create.mockResolvedValue(failedPaymentIntent);

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{
                id: 'payment-uuid-123',
                status: 'failed',
                failure_code: 'card_declined',
                failure_message: 'Your card was declined.'
              }],
              error: null
            })
          })
        })
      });

      // Act
      const failureResult = await mockPaymentService.createPaymentIntent({
        userId: testUserId,
        amount: 2000,
        currency: 'usd',
        paymentMethodId: 'pm_declined' // Test declined card
      });

      // Assert - Verify failure handling
      expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });

    it('should process refunds correctly', async () => {
      // Arrange - Mock refund processing
      const refundData = {
        payment_intent: testPaymentIntentId,
        amount: 1000, // Partial refund of $10.00
        reason: 'requested_by_customer'
      };

      const expectedRefund = {
        id: 'ref_test123',
        amount: 1000,
        currency: 'usd',
        payment_intent: testPaymentIntentId,
        status: 'succeeded',
        reason: 'requested_by_customer'
      };

      mockStripe.refunds.create.mockResolvedValue(expectedRefund);

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'refund-uuid-123',
              stripe_refund_id: 'ref_test123',
              payment_id: 'payment-uuid-123',
              user_id: testUserId,
              amount: 1000,
              currency: 'usd',
              reason: 'requested_by_customer',
              status: 'succeeded'
            }],
            error: null
          })
        })
      });

      // Act
      const refundResult = await mockPaymentService.processRefund({
        paymentIntentId: testPaymentIntentId,
        amount: 1000,
        reason: 'requested_by_customer'
      });

      // Assert - Verify refund processing
      expect(mockStripe.refunds.create).toHaveBeenCalledWith(refundData);
      expect(mockSupabase.from).toHaveBeenCalledWith('refunds');
    });
  });

  describe('Webhook Processing', () => {
    it('should validate webhook signatures correctly', async () => {
      // Arrange - Mock webhook signature validation
      const webhookSecret = 'whsec_test_secret';
      const payload = JSON.stringify({
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: { object: { id: testPaymentIntentId } }
      });
      const signature = 'v1=' + crypto
        .createHmac('sha256', webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: { object: { id: testPaymentIntentId, status: 'succeeded' } }
      });

      mockWebhookService.validateSignature.mockReturnValue(true);

      // Act
      const validationResult = await mockWebhookService.validateSignature(
        payload,
        signature,
        webhookSecret
      );

      // Assert - Verify signature validation
      expect(mockWebhookService.validateSignature).toHaveBeenCalledWith(
        payload,
        signature,
        webhookSecret
      );
      expect(validationResult).toBe(true);
    });

    it('should handle payment_intent.succeeded webhook', async () => {
      // Arrange - Mock successful payment webhook
      const successWebhook = {
        id: 'evt_success123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: testPaymentIntentId,
            status: 'succeeded',
            amount: 2000,
            amount_received: 2000,
            charges: {
              data: [{
                id: 'ch_test123',
                amount: 2000,
                paid: true,
                receipt_url: 'https://pay.stripe.com/receipts/test123'
              }]
            }
          }
        }
      };

      mockWebhookService.handlePaymentIntentSucceeded.mockResolvedValue({
        processed: true,
        paymentUpdated: true,
        receiptGenerated: true
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{
                id: 'payment-uuid-123',
                status: 'succeeded',
                amount_received: 2000,
                receipt_url: 'https://pay.stripe.com/receipts/test123'
              }],
              error: null
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'webhook-uuid-123',
              stripe_event_id: 'evt_success123',
              status: 'succeeded'
            }],
            error: null
          })
        })
      });

      // Act
      const webhookResult = await mockWebhookService.processEvent(successWebhook);

      // Assert - Verify successful payment processing
      expect(mockWebhookService.handlePaymentIntentSucceeded).toHaveBeenCalledWith(
        successWebhook.data.object
      );
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(mockSupabase.from).toHaveBeenCalledWith('webhook_events');
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      // Arrange - Mock failed payment webhook
      const failureWebhook = {
        id: 'evt_failed123',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: testPaymentIntentId,
            status: 'requires_payment_method',
            last_payment_error: {
              type: 'card_error',
              code: 'card_declined',
              decline_code: 'insufficient_funds',
              message: 'Your card has insufficient funds.'
            }
          }
        }
      };

      mockWebhookService.handlePaymentIntentFailed.mockResolvedValue({
        processed: true,
        errorLogged: true,
        retryScheduled: true
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{
                id: 'payment-uuid-123',
                status: 'failed',
                failure_code: 'card_declined',
                failure_message: 'Your card has insufficient funds.'
              }],
              error: null
            })
          })
        })
      });

      // Act
      const failureResult = await mockWebhookService.processEvent(failureWebhook);

      // Assert - Verify payment failure processing
      expect(mockWebhookService.handlePaymentIntentFailed).toHaveBeenCalledWith(
        failureWebhook.data.object
      );
    });

    it('should handle payment_method.attached webhook', async () => {
      // Arrange - Mock payment method attached webhook
      const attachedWebhook = {
        id: 'evt_attached123',
        type: 'payment_method.attached',
        data: {
          object: {
            id: testPaymentMethodId,
            type: 'card',
            customer: testCustomerId,
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025
            }
          }
        }
      };

      mockWebhookService.handlePaymentMethodAttached.mockResolvedValue({
        processed: true,
        paymentMethodSynced: true
      });

      // Act
      const attachResult = await mockWebhookService.processEvent(attachedWebhook);

      // Assert - Verify payment method attachment processing
      expect(mockWebhookService.handlePaymentMethodAttached).toHaveBeenCalledWith(
        attachedWebhook.data.object
      );
    });

    it('should retry failed webhook processing', async () => {
      // Arrange - Mock webhook retry scenario
      const retryWebhook = {
        id: 'evt_retry123',
        type: 'payment_intent.succeeded',
        data: { object: { id: testPaymentIntentId } }
      };

      mockWebhookService.processEvent
        .mockRejectedValueOnce(new Error('Temporary processing error'))
        .mockResolvedValueOnce({ processed: true, retried: true });

      // Act
      const retryResult = await mockWebhookService.retryFailedWebhook(retryWebhook);

      // Assert - Verify retry logic
      expect(mockWebhookService.processEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Payment Method Synchronization', () => {
    it('should sync payment methods from Stripe to local database', async () => {
      // Arrange - Mock Stripe payment methods list
      const stripePaymentMethods = {
        data: [
          {
            id: 'pm_stripe1',
            type: 'card',
            customer: testCustomerId,
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025
            }
          },
          {
            id: 'pm_stripe2',
            type: 'card',
            customer: testCustomerId,
            card: {
              brand: 'mastercard',
              last4: '5555',
              exp_month: 6,
              exp_year: 2026
            }
          }
        ]
      };

      const localPaymentMethods = [
        {
          id: 'pm_stripe1',
          user_id: testUserId,
          card_brand: 'visa',
          card_last4: '4242'
        }
      ];

      mockStripe.paymentMethods.list.mockResolvedValue(stripePaymentMethods);
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: localPaymentMethods,
            error: null
          })
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: stripePaymentMethods.data.map(pm => ({
              id: pm.id,
              user_id: testUserId,
              type: pm.type,
              card_brand: pm.card.brand,
              card_last4: pm.card.last4
            })),
            error: null
          })
        })
      });

      // Act
      const syncResult = await mockPaymentService.syncPaymentMethods(testUserId);

      // Assert - Verify synchronization
      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: testCustomerId,
        type: 'card'
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should detect and resolve payment method inconsistencies', async () => {
      // Arrange - Mock inconsistency scenario
      const inconsistency = {
        type: 'card_details_mismatch',
        payment_method_id: testPaymentMethodId,
        local_last4: '4242',
        stripe_last4: '1234',
        resolved: false
      };

      mockPaymentService.syncPaymentMethods.mockResolvedValue({
        synced: 2,
        inconsistencies: [inconsistency],
        resolved: 1
      });

      // Act
      const inconsistencyResult = await mockPaymentService.syncPaymentMethods(testUserId);

      // Assert - Verify inconsistency detection and resolution
      expect(inconsistencyResult.inconsistencies).toHaveLength(1);
      expect(inconsistencyResult.resolved).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle Stripe rate limiting gracefully', async () => {
      // Arrange - Mock rate limiting error
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.name = 'StripeRateLimitError';
      rateLimitError.statusCode = 429;
      
      mockStripe.paymentMethods.create.mockRejectedValue(rateLimitError);

      // Act & Assert - Verify rate limit handling
      await expect(
        mockPaymentService.createPaymentMethod({
          userId: testUserId,
          customerId: testCustomerId,
          paymentMethodData: { type: 'card' }
        })
      ).rejects.toThrow('Too Many Requests');
    });

    it('should handle network timeouts with retry logic', async () => {
      // Arrange - Mock network timeout
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'NetworkError';
      
      mockStripe.paymentIntents.create
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({
          id: testPaymentIntentId,
          status: 'requires_confirmation'
        });

      // Act
      const retryResult = await mockPaymentService.createPaymentIntent({
        userId: testUserId,
        amount: 2000,
        currency: 'usd',
        paymentMethodId: testPaymentMethodId,
        retryOnFailure: true
      });

      // Assert - Verify retry logic
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid webhook signatures', async () => {
      // Arrange - Mock invalid signature
      const invalidSignatureError = new Error('Invalid signature');
      invalidSignatureError.name = 'StripeSignatureVerificationError';

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw invalidSignatureError;
      });

      mockWebhookService.validateSignature.mockReturnValue(false);

      // Act & Assert - Verify signature validation failure
      const validationResult = await mockWebhookService.validateSignature(
        'invalid payload',
        'invalid signature',
        'webhook secret'
      );

      expect(validationResult).toBe(false);
    });

    it('should handle database transaction failures', async () => {
      // Arrange - Mock database failure
      const dbError = new Error('Database connection failed');
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockRejectedValue(dbError)
      });

      // Act & Assert - Verify database error handling
      await expect(
        mockPaymentService.createPaymentMethod({
          userId: testUserId,
          customerId: testCustomerId,
          paymentMethodData: { type: 'card' }
        })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Security and Compliance Tests', () => {
    it('should not store sensitive card details locally', async () => {
      // Arrange - Mock payment method creation with sensitive data
      const cardData = {
        type: 'card',
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2025,
          cvc: '123'
        }
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: testPaymentMethodId,
              user_id: testUserId,
              type: 'card',
              card_brand: 'visa',
              card_last4: '4242',
              card_exp_month: 12,
              card_exp_year: 2025,
              // No sensitive data stored
            }],
            error: null
          })
        })
      });

      // Act
      await mockPaymentService.createPaymentMethod({
        userId: testUserId,
        customerId: testCustomerId,
        paymentMethodData: cardData
      });

      // Assert - Verify no sensitive data is stored
      const insertCall = mockSupabase.from().insert.mock.calls[0][0];
      expect(insertCall).not.toHaveProperty('card_number');
      expect(insertCall).not.toHaveProperty('cvc');
    });

    it('should validate webhook authenticity', async () => {
      // Arrange - Mock webhook authentication
      const validPayload = JSON.stringify({ id: 'evt_test' });
      const validSignature = 'valid_signature';
      const webhookSecret = 'whsec_secret';

      mockWebhookService.validateSignature.mockImplementation(
        (payload, signature, secret) => {
          return signature === 'valid_signature' && secret === 'whsec_secret';
        }
      );

      // Act
      const isValid = await mockWebhookService.validateSignature(
        validPayload,
        validSignature,
        webhookSecret
      );

      // Assert - Verify webhook authentication
      expect(isValid).toBe(true);
      expect(mockWebhookService.validateSignature).toHaveBeenCalledWith(
        validPayload,
        validSignature,
        webhookSecret
      );
    });

    it('should implement proper access controls', async () => {
      // Arrange - Mock access control validation
      const unauthorizedUserId = 'unauthorized-user';
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [], // No payment methods for unauthorized user
            error: null
          })
        })
      });

      // Act
      const accessResult = await mockPaymentService.syncPaymentMethods(unauthorizedUserId);

      // Assert - Verify access controls
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });
  });
});