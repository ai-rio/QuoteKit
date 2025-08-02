/**
 * Edge Case Handling Integration Tests - Step 2.3
 * 
 * Comprehensive test suite for all edge case handling scenarios including:
 * - Failed payment handling and retry logic
 * - Proration calculations and plan changes
 * - Refund and credit processing
 * - Dispute handling workflows
 * - Payment method failure recovery
 * - Cross-system coordination
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { handleBillingEdgeCase, runProactiveEdgeCaseMonitoring } from '@/features/billing/controllers/edge-case-coordinator';
import { handleFailedPayment } from '@/features/billing/controllers/failed-payment-handler';
import { previewPlanChangeProration, executePlanChangeWithProration } from '@/features/billing/controllers/proration-handler';
import { processRefund, createCreditNote } from '@/features/billing/controllers/refunds-credits-handler';
import { handleDisputeEvent, submitDisputeEvidence } from '@/features/billing/controllers/dispute-handler';
import { handlePaymentMethodFailure, validateUserPaymentMethods } from '@/features/billing/controllers/payment-method-failure-handler';

// Mock Stripe configuration
const mockStripeConfig = {
  secret_key: 'sk_test_mock',
  publishable_key: 'pk_test_mock',
  webhook_secret: 'whsec_test_mock'
};

// Mock Stripe objects
const mockStripeInvoice = {
  id: 'in_test_failed_payment',
  customer: 'cus_test_customer',
  subscription: 'sub_test_subscription',
  amount_due: 2000,
  currency: 'usd',
  attempt_count: 1,
  last_finalization_error: {
    code: 'card_declined',
    message: 'Your card was declined.'
  },
  next_payment_attempt: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
};

const mockStripeDispute = {
  id: 'dp_test_dispute',
  charge: 'ch_test_charge',
  amount: 2000,
  currency: 'usd',
  reason: 'fraudulent',
  status: 'warning_needs_response',
  evidence_details: {
    due_by: Math.floor(Date.now() / 1000) + 604800 // 7 days from now
  },
  created: Math.floor(Date.now() / 1000)
};

const mockStripePaymentMethod = {
  id: 'pm_test_payment_method',
  customer: 'cus_test_customer',
  type: 'card',
  card: {
    brand: 'visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2025
  }
};

// Mock Stripe client
const mockStripe = {
  invoices: {
    retrieve: jest.fn(),
    update: jest.fn(),
    pay: jest.fn()
  },
  subscriptions: {
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn()
  },
  disputes: {
    retrieve: jest.fn(),
    update: jest.fn()
  },
  charges: {
    retrieve: jest.fn()
  },
  refunds: {
    create: jest.fn()
  },
  creditNotes: {
    create: jest.fn()
  },
  paymentMethods: {
    retrieve: jest.fn(),
    list: jest.fn()
  },
  customers: {
    retrieve: jest.fn(),
    update: jest.fn()
  },
  prices: {
    retrieve: jest.fn()
  }
};

// Mock createStripeAdminClient
jest.mock('@/libs/stripe/stripe-admin', () => ({
  createStripeAdminClient: jest.fn(() => mockStripe)
}));

// Test data
let testUserId: string;
let testCustomerId: string;
let testSubscriptionId: string;

describe('Edge Case Handling Integration Tests', () => {
  const supabase = supabaseAdminClient;

  beforeAll(async () => {
    console.log('🧪 [SETUP] Setting up edge case handling test environment');

    // Create test user with unique email
    const uniqueEmail = `edge-case-test-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: uniqueEmail,
      password: 'test-password-123',
      email_confirm: true
    });

    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }

    testUserId = userData.user.id;
    testCustomerId = 'cus_test_customer';
    testSubscriptionId = 'sub_test_subscription';

    // Create customer mapping
    await supabase
      .from('customers')
      .insert({
        id: testUserId,
        stripe_customer_id: testCustomerId
      });

    // Create test subscription
    await supabase
      .from('subscriptions')
      .insert({
        id: 'test-subscription-id',
        user_id: testUserId,
        stripe_subscription_id: testSubscriptionId,
        stripe_price_id: 'price_test_monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    console.log('✅ [SETUP] Test environment ready');
  });

  afterAll(async () => {
    console.log('🧹 [CLEANUP] Cleaning up edge case handling test environment');

    // Clean up test data
    await supabase.auth.admin.deleteUser(testUserId);
    await supabase.from('customers').delete().eq('id', testUserId);
    await supabase.from('subscriptions').delete().eq('user_id', testUserId);
    await supabase.from('edge_case_events').delete().eq('user_id', testUserId);
    await supabase.from('payment_method_failures').delete().eq('user_id', testUserId);
    await supabase.from('payment_disputes').delete().eq('user_id', testUserId);
    await supabase.from('subscription_changes').delete().eq('user_id', testUserId);
    await supabase.from('user_notifications').delete().eq('user_id', testUserId);
    await supabase.from('billing_history').delete().eq('user_id', testUserId);

    console.log('✅ [CLEANUP] Test environment cleaned up');
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Failed Payment Handling', () => {
    test('should handle failed payment with retry logic', async () => {
      console.log('🧪 [TEST] Testing failed payment handling with retry logic');

      // Mock Stripe responses
      mockStripe.invoices.retrieve.mockResolvedValue(mockStripeInvoice);
      mockStripe.invoices.update.mockResolvedValue({
        ...mockStripeInvoice,
        metadata: { retry_scheduled: 'true' }
      });

      // Test failed payment handling
      const result = await handleFailedPayment(mockStripeInvoice as any, mockStripeConfig);

      expect(result.success).toBe(true);
      expect(result.retryScheduled).toBe(true);
      expect(result.nextRetryAt).toBeDefined();
      expect(result.maxRetriesReached).toBe(false);

      // Verify database records
      const { data: failureRecord } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', testUserId)
        .eq('status', 'payment_failed')
        .single();

      expect(failureRecord).toBeTruthy();
      expect(failureRecord.amount).toBe(-mockStripeInvoice.amount_due);

      // Verify notification was created
      const { data: notification } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'payment_failed')
        .single();

      expect(notification).toBeTruthy();
      expect(notification.title).toBe('Payment Failed');

      console.log('✅ [TEST] Failed payment handling test passed');
    });

    test('should handle max retries reached scenario', async () => {
      console.log('🧪 [TEST] Testing max retries reached scenario');

      const maxRetriesInvoice = {
        ...mockStripeInvoice,
        id: 'in_test_max_retries',
        attempt_count: 4 // Max retries reached
      };

      mockStripe.invoices.retrieve.mockResolvedValue(maxRetriesInvoice);

      const result = await handleFailedPayment(maxRetriesInvoice as any, mockStripeConfig);

      expect(result.success).toBe(false);
      expect(result.retryScheduled).toBe(false);
      expect(result.maxRetriesReached).toBe(true);

      console.log('✅ [TEST] Max retries scenario test passed');
    });
  });

  describe('Proration Handling', () => {
    test('should preview plan change proration correctly', async () => {
      console.log('🧪 [TEST] Testing plan change proration preview');

      // Mock Stripe responses
      const mockSubscription = {
        id: testSubscriptionId,
        customer: testCustomerId,
        items: {
          data: [{
            id: 'si_test_item',
            price: {
              id: 'price_test_monthly',
              unit_amount: 1000,
              currency: 'usd',
              recurring: { interval: 'month' }
            }
          }]
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000 // 30 days
      };

      const mockNewPrice = {
        id: 'price_test_yearly',
        unit_amount: 10000,
        currency: 'usd',
        recurring: { interval: 'year' }
      };

      const mockUpcomingInvoice = {
        total: 8500, // Prorated amount
        subtotal: 8500,
        lines: {
          data: [
            {
              type: 'subscription',
              amount: -500, // Credit for unused monthly
              currency: 'usd',
              description: 'Unused time on monthly plan',
              period: {
                start: Math.floor(Date.now() / 1000),
                end: Math.floor(Date.now() / 1000) + 2592000
              }
            },
            {
              type: 'subscription',
              amount: 9000, // Charge for yearly
              currency: 'usd',
              description: 'Yearly plan charge',
              period: {
                start: Math.floor(Date.now() / 1000),
                end: Math.floor(Date.now() / 1000) + 31536000 // 1 year
              }
            }
          ]
        }
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      mockStripe.prices.retrieve.mockResolvedValue(mockNewPrice);
      mockStripe.invoices.retrieveUpcoming = jest.fn().mockResolvedValue(mockUpcomingInvoice);

      const preview = await previewPlanChangeProration(
        testSubscriptionId,
        'price_test_yearly',
        mockStripeConfig
      );

      expect(preview.currentPlan.priceId).toBe('price_test_monthly');
      expect(preview.newPlan.priceId).toBe('price_test_yearly');
      expect(preview.prorationDetails.netAmount).toBe(8500);
      expect(preview.breakdown).toHaveLength(2);
      expect(preview.breakdown[0].type).toBe('credit');
      expect(preview.breakdown[1].type).toBe('debit');

      console.log('✅ [TEST] Proration preview test passed');
    });

    test('should execute plan change with proration', async () => {
      console.log('🧪 [TEST] Testing plan change execution with proration');

      const mockUpdatedSubscription = {
        id: testSubscriptionId,
        status: 'active',
        items: {
          data: [{
            id: 'si_test_item',
            price: { id: 'price_test_yearly' }
          }]
        }
      };

      mockStripe.subscriptions.update.mockResolvedValue(mockUpdatedSubscription);

      const result = await executePlanChangeWithProration(
        testSubscriptionId,
        'price_test_yearly',
        mockStripeConfig
      );

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe(testSubscriptionId);

      // Verify database record
      const { data: changeRecord } = await supabase
        .from('subscription_changes')
        .select('*')
        .eq('user_id', testUserId)
        .eq('change_type', 'plan_change')
        .single();

      expect(changeRecord).toBeTruthy();
      expect(changeRecord.new_value.price_id).toBe('price_test_yearly');

      console.log('✅ [TEST] Plan change execution test passed');
    });
  });

  describe('Refund and Credit Processing', () => {
    test('should process refund successfully', async () => {
      console.log('🧪 [TEST] Testing refund processing');

      const mockRefund = {
        id: 'ref_test_refund',
        amount: 2000,
        currency: 'usd',
        status: 'succeeded',
        reason: 'requested_by_customer',
        created: Math.floor(Date.now() / 1000)
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const refundRequest = {
        paymentIntentId: 'pi_test_payment_intent',
        amount: 2000,
        reason: 'requested_by_customer' as const
      };

      const result = await processRefund(refundRequest, mockStripeConfig, testUserId);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('ref_test_refund');
      expect(result.amount).toBe(2000);

      // Verify database record
      const { data: refundRecord } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', testUserId)
        .eq('status', 'refund_processed')
        .single();

      expect(refundRecord).toBeTruthy();
      expect(refundRecord.amount).toBe(-2000); // Negative for refund

      console.log('✅ [TEST] Refund processing test passed');
    });

    test('should create credit note successfully', async () => {
      console.log('🧪 [TEST] Testing credit note creation');

      const mockCreditNote = {
        id: 'cn_test_credit_note',
        amount: 1000,
        currency: 'usd',
        status: 'issued',
        invoice: 'in_test_invoice',
        created: Math.floor(Date.now() / 1000)
      };

      const mockInvoice = {
        id: 'in_test_invoice',
        customer: testCustomerId,
        amount_paid: 2000,
        status: 'paid'
      };

      mockStripe.invoices.retrieve.mockResolvedValue(mockInvoice);
      mockStripe.creditNotes.create.mockResolvedValue(mockCreditNote);

      const creditRequest = {
        invoiceId: 'in_test_invoice',
        amount: 1000,
        reason: 'service_issue'
      };

      const result = await createCreditNote(creditRequest, mockStripeConfig, testUserId);

      expect(result.success).toBe(true);
      expect(result.creditNoteId).toBe('cn_test_credit_note');
      expect(result.amount).toBe(1000);

      console.log('✅ [TEST] Credit note creation test passed');
    });
  });

  describe('Dispute Handling', () => {
    test('should handle dispute creation event', async () => {
      console.log('🧪 [TEST] Testing dispute creation handling');

      const mockCharge = {
        id: 'ch_test_charge',
        customer: testCustomerId
      };

      mockStripe.charges.retrieve.mockResolvedValue(mockCharge);

      await handleDisputeEvent(mockStripeDispute as any, 'charge.dispute.created', mockStripeConfig);

      // Verify database records
      const { data: disputeRecord } = await supabase
        .from('payment_disputes')
        .select('*')
        .eq('id', mockStripeDispute.id)
        .single();

      expect(disputeRecord).toBeTruthy();
      expect(disputeRecord.user_id).toBe(testUserId);
      expect(disputeRecord.status).toBe('warning_needs_response');

      // Verify billing history record
      const { data: billingRecord } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', testUserId)
        .eq('status', 'dispute_created')
        .single();

      expect(billingRecord).toBeTruthy();
      expect(billingRecord.amount).toBe(-mockStripeDispute.amount);

      console.log('✅ [TEST] Dispute creation handling test passed');
    });

    test('should submit dispute evidence successfully', async () => {
      console.log('🧪 [TEST] Testing dispute evidence submission');

      const mockUpdatedDispute = {
        ...mockStripeDispute,
        evidence: {
          submission_count: 1
        }
      };

      mockStripe.disputes.retrieve.mockResolvedValue(mockStripeDispute);
      mockStripe.disputes.update.mockResolvedValue(mockUpdatedDispute);

      const evidence = {
        uncategorizedText: 'This is a legitimate charge for our software service.',
        customerCommunication: 'Customer email: test@example.com'
      };

      const result = await submitDisputeEvidence(
        mockStripeDispute.id,
        evidence,
        mockStripeConfig,
        testUserId
      );

      expect(result.success).toBe(true);
      expect(result.disputeId).toBe(mockStripeDispute.id);
      expect(result.evidenceSubmitted).toBe(true);

      // Verify evidence record
      const { data: evidenceRecord } = await supabase
        .from('dispute_evidence')
        .select('*')
        .eq('dispute_id', mockStripeDispute.id)
        .single();

      expect(evidenceRecord).toBeTruthy();
      expect(evidenceRecord.evidence_data).toEqual(evidence);

      console.log('✅ [TEST] Dispute evidence submission test passed');
    });
  });

  describe('Payment Method Failure Handling', () => {
    test('should handle payment method failure', async () => {
      console.log('🧪 [TEST] Testing payment method failure handling');

      const failureContext = {
        failureType: 'card_declined',
        failureCode: 'generic_decline',
        failureMessage: 'Your card was declined.'
      };

      await handlePaymentMethodFailure(
        mockStripePaymentMethod as any,
        failureContext,
        mockStripeConfig
      );

      // Verify failure record
      const { data: failureRecord } = await supabase
        .from('payment_method_failures')
        .select('*')
        .eq('user_id', testUserId)
        .eq('payment_method_id', mockStripePaymentMethod.id)
        .single();

      expect(failureRecord).toBeTruthy();
      expect(failureRecord.failure_type).toBe('declined');
      expect(failureRecord.failure_code).toBe('generic_decline');

      console.log('✅ [TEST] Payment method failure handling test passed');
    });

    test('should validate user payment methods', async () => {
      console.log('🧪 [TEST] Testing payment method validation');

      // Create test payment method record
      await supabase
        .from('payment_methods')
        .insert({
          id: mockStripePaymentMethod.id,
          user_id: testUserId,
          stripe_customer_id: testCustomerId,
          type: 'card',
          card_data: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          },
          is_default: true
        });

      mockStripe.paymentMethods.retrieve.mockResolvedValue(mockStripePaymentMethod);

      const statuses = await validateUserPaymentMethods(testUserId, mockStripeConfig);

      expect(statuses).toHaveLength(1);
      expect(statuses[0].id).toBe(mockStripePaymentMethod.id);
      expect(statuses[0].status).toBe('active');
      expect(statuses[0].needsUpdate).toBe(false);

      console.log('✅ [TEST] Payment method validation test passed');
    });
  });

  describe('Edge Case Coordination', () => {
    test('should coordinate failed payment edge case', async () => {
      console.log('🧪 [TEST] Testing edge case coordination for failed payment');

      const mockEvent = {
        id: 'evt_test_failed_payment',
        type: 'invoice.payment_failed',
        data: {
          object: mockStripeInvoice
        }
      };

      const result = await handleBillingEdgeCase(mockEvent as any, mockStripeConfig);

      expect(result.success).toBe(true);
      expect(result.handlerUsed).toBe('failed_payment_handler');
      expect(result.actions).toContain('retry_scheduled');

      // Verify edge case event record
      const { data: eventRecord } = await supabase
        .from('edge_case_events')
        .select('*')
        .eq('event_id', mockEvent.id)
        .single();

      expect(eventRecord).toBeTruthy();
      expect(eventRecord.handler_used).toBe('failed_payment_handler');
      expect(eventRecord.success).toBe(true);

      console.log('✅ [TEST] Edge case coordination test passed');
    });

    test('should run proactive edge case monitoring', async () => {
      console.log('🧪 [TEST] Testing proactive edge case monitoring');

      // This test verifies that the monitoring function runs without errors
      // In a real environment, it would check for actual edge cases
      await expect(runProactiveEdgeCaseMonitoring(mockStripeConfig)).resolves.not.toThrow();

      console.log('✅ [TEST] Proactive monitoring test passed');
    });
  });

  describe('Analytics and Reporting', () => {
    test('should generate edge case analytics', async () => {
      console.log('🧪 [TEST] Testing edge case analytics generation');

      // Create some test edge case events
      const testEvents = [
        {
          event_type: 'invoice.payment_failed',
          event_id: 'evt_test_1',
          user_id: testUserId,
          handler_used: 'failed_payment_handler',
          success: true,
          actions: ['retry_scheduled'],
          created_at: new Date().toISOString()
        },
        {
          event_type: 'charge.dispute.created',
          event_id: 'evt_test_2',
          user_id: testUserId,
          handler_used: 'dispute_handler',
          success: true,
          actions: ['dispute_created'],
          created_at: new Date().toISOString()
        }
      ];

      await supabase
        .from('edge_case_events')
        .insert(testEvents);

      // Get edge case summary
      const { data: summaryData } = await supabase
        .rpc('get_user_edge_case_summary', { p_user_id: testUserId });

      const summary = summaryData?.[0];
      expect(summary).toBeTruthy();
      expect(summary.total_events).toBeGreaterThan(0);
      expect(summary.successful_events).toBeGreaterThan(0);

      console.log('✅ [TEST] Edge case analytics test passed');
    });
  });
});

console.log('🎉 [EDGE_CASE_TESTS] All edge case handling tests defined successfully');
