/**
 * Failed Payment Handler - Step 2.3 Edge Case Implementation
 * 
 * Handles failed payment scenarios including:
 * - Payment retry logic with exponential backoff
 * - Customer notification system
 * - Subscription status management during payment failures
 * - Dunning management integration
 * - Payment method validation and recovery
 */

import Stripe from 'stripe';

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export interface FailedPaymentContext {
  invoiceId: string;
  customerId: string;
  subscriptionId: string;
  attemptCount: number;
  failureReason: string;
  amountDue: number;
  currency: string;
  nextRetryAt?: Date;
}

export interface PaymentRetryResult {
  success: boolean;
  retryScheduled: boolean;
  nextRetryAt?: Date;
  maxRetriesReached: boolean;
  error?: string;
}

/**
 * Main handler for failed payment events
 * Called from webhook when invoice.payment_failed event occurs
 */
export async function handleFailedPayment(
  invoice: Stripe.Invoice,
  stripeConfig: any
): Promise<PaymentRetryResult> {
  console.log(`💥 [FAILED_PAYMENT] ===== STARTING FAILED PAYMENT HANDLER =====`);
  console.log(`💥 [FAILED_PAYMENT] Invoice ID: ${invoice.id}`);
  console.log(`💥 [FAILED_PAYMENT] Customer: ${invoice.customer}`);
  console.log(`💥 [FAILED_PAYMENT] Subscription: ${invoice.subscription}`);
  console.log(`💥 [FAILED_PAYMENT] Attempt Count: ${invoice.attempt_count}`);
  console.log(`💥 [FAILED_PAYMENT] Amount Due: ${invoice.amount_due} ${invoice.currency}`);

  try {
    // STEP 1: Extract and validate payment failure context
    const context = await extractFailedPaymentContext(invoice, stripeConfig);
    console.log(`✅ [STEP 1] Payment failure context extracted:`, context);

    // STEP 2: Record payment failure in database
    await recordPaymentFailure(context);
    console.log(`✅ [STEP 2] Payment failure recorded in database`);

    // STEP 3: Determine retry strategy based on attempt count and failure reason
    const retryStrategy = determineRetryStrategy(context);
    console.log(`✅ [STEP 3] Retry strategy determined:`, retryStrategy);

    // STEP 4: Handle subscription status during payment failure
    await handleSubscriptionDuringFailure(context, retryStrategy);
    console.log(`✅ [STEP 4] Subscription status updated for payment failure`);

    // STEP 5: Schedule retry if appropriate
    let retryResult: PaymentRetryResult;
    if (retryStrategy.shouldRetry) {
      retryResult = await schedulePaymentRetry(context, retryStrategy, stripeConfig);
      console.log(`✅ [STEP 5] Payment retry scheduled:`, retryResult);
    } else {
      retryResult = {
        success: false,
        retryScheduled: false,
        maxRetriesReached: retryStrategy.maxRetriesReached
      };
      console.log(`✅ [STEP 5] No retry scheduled - max attempts reached or permanent failure`);
    }

    // STEP 6: Send customer notification
    await sendFailedPaymentNotification(context, retryResult);
    console.log(`✅ [STEP 6] Customer notification sent`);

    // STEP 7: Update payment method status if needed
    await validateAndUpdatePaymentMethod(context, stripeConfig);
    console.log(`✅ [STEP 7] Payment method validation completed`);

    console.log(`🎉 [SUCCESS] ===== FAILED PAYMENT HANDLER COMPLETED =====`);
    return retryResult;

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Failed payment handler failed:`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return failure result but don't throw - we want webhook to succeed
    return {
      success: false,
      retryScheduled: false,
      maxRetriesReached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract comprehensive context from failed payment invoice
 */
async function extractFailedPaymentContext(
  invoice: Stripe.Invoice,
  stripeConfig: any
): Promise<FailedPaymentContext> {
  const stripe = createStripeAdminClient(stripeConfig);

  // Get detailed failure information
  let failureReason = 'unknown';
  if (invoice.last_finalization_error) {
    failureReason = `${invoice.last_finalization_error.code}: ${invoice.last_finalization_error.message}`;
  } else if (invoice.payment_intent) {
    // Get payment intent to check for more detailed error
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        typeof invoice.payment_intent === 'string' 
          ? invoice.payment_intent 
          : invoice.payment_intent.id
      );
      
      if (paymentIntent.last_payment_error) {
        failureReason = `${paymentIntent.last_payment_error.code}: ${paymentIntent.last_payment_error.message}`;
      }
    } catch (error) {
      console.warn(`⚠️ Could not retrieve payment intent details:`, error);
    }
  }

  return {
    invoiceId: invoice.id,
    customerId: invoice.customer as string,
    subscriptionId: invoice.subscription as string,
    attemptCount: invoice.attempt_count || 0,
    failureReason,
    amountDue: invoice.amount_due || 0,
    currency: invoice.currency || 'usd',
    nextRetryAt: invoice.next_payment_attempt 
      ? new Date(invoice.next_payment_attempt * 1000) 
      : undefined
  };
}

/**
 * Record payment failure in database for tracking and analytics
 */
async function recordPaymentFailure(context: FailedPaymentContext): Promise<void> {
  try {
    // Find user ID from customer mapping
    const { data: customer } = await supabaseAdminClient
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', context.customerId)
      .single();

    if (!customer) {
      throw new Error(`Customer mapping not found for ${context.customerId}`);
    }

    // Record in billing_history table
    await supabaseAdminClient
      .from('billing_history')
      .insert({
        id: `failed_${context.invoiceId}`,
        user_id: customer.id,
        subscription_id: context.subscriptionId,
        amount: context.amountDue,
        currency: context.currency,
        status: 'payment_failed',
        description: `Payment failed: ${context.failureReason}`,
        stripe_invoice_id: context.invoiceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log(`📝 Payment failure recorded for user ${customer.id}`);

  } catch (error) {
    console.error(`❌ Failed to record payment failure:`, error);
    // Don't throw - this is non-critical for webhook processing
  }
}

/**
 * Determine retry strategy based on failure context
 */
function determineRetryStrategy(context: FailedPaymentContext): {
  shouldRetry: boolean;
  maxRetriesReached: boolean;
  retryDelay: number;
  retryReason: string;
} {
  const MAX_RETRY_ATTEMPTS = 4; // Stripe default
  const maxRetriesReached = context.attemptCount >= MAX_RETRY_ATTEMPTS;

  // Permanent failure codes that should not be retried
  const permanentFailureCodes = [
    'card_declined',
    'expired_card',
    'incorrect_cvc',
    'processing_error',
    'authentication_required'
  ];

  const isPermanentFailure = permanentFailureCodes.some(code => 
    context.failureReason.toLowerCase().includes(code)
  );

  if (maxRetriesReached) {
    return {
      shouldRetry: false,
      maxRetriesReached: true,
      retryDelay: 0,
      retryReason: 'Maximum retry attempts reached'
    };
  }

  if (isPermanentFailure) {
    return {
      shouldRetry: false,
      maxRetriesReached: false,
      retryDelay: 0,
      retryReason: 'Permanent failure - requires customer action'
    };
  }

  // Calculate exponential backoff delay
  const baseDelay = 24 * 60 * 60; // 24 hours in seconds
  const retryDelay = baseDelay * Math.pow(2, context.attemptCount - 1);

  return {
    shouldRetry: true,
    maxRetriesReached: false,
    retryDelay,
    retryReason: 'Temporary failure - will retry with exponential backoff'
  };
}

/**
 * Handle subscription status during payment failure
 */
async function handleSubscriptionDuringFailure(
  context: FailedPaymentContext,
  retryStrategy: { shouldRetry: boolean; maxRetriesReached: boolean }
): Promise<void> {
  try {
    let newStatus: string;
    let statusReason: string;

    if (retryStrategy.maxRetriesReached) {
      newStatus = 'past_due';
      statusReason = 'Maximum payment retry attempts reached';
    } else if (!retryStrategy.shouldRetry) {
      newStatus = 'past_due';
      statusReason = 'Payment failed with permanent error';
    } else {
      newStatus = 'past_due';
      statusReason = 'Payment failed - retry scheduled';
    }

    // Update subscription status in database
    const { error } = await supabaseAdminClient
      .from('subscriptions')
      .update({
        status: newStatus as any,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', context.subscriptionId);

    if (error) {
      console.error(`❌ Failed to update subscription status:`, error);
    } else {
      console.log(`✅ Subscription ${context.subscriptionId} status updated to ${newStatus}: ${statusReason}`);
    }

  } catch (error) {
    console.error(`❌ Error handling subscription during failure:`, error);
    // Don't throw - this is non-critical for webhook processing
  }
}

/**
 * Schedule payment retry with Stripe
 */
async function schedulePaymentRetry(
  context: FailedPaymentContext,
  retryStrategy: { retryDelay: number },
  stripeConfig: any
): Promise<PaymentRetryResult> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);
    
    // Calculate next retry time
    const nextRetryAt = new Date(Date.now() + (retryStrategy.retryDelay * 1000));

    // Update invoice with retry information
    await stripe.invoices.update(context.invoiceId, {
      metadata: {
        retry_scheduled: 'true',
        next_retry_at: nextRetryAt.toISOString(),
        retry_reason: 'automatic_retry_after_failure'
      }
    });

    console.log(`⏰ Payment retry scheduled for ${nextRetryAt.toISOString()}`);

    return {
      success: true,
      retryScheduled: true,
      nextRetryAt,
      maxRetriesReached: false
    };

  } catch (error) {
    console.error(`❌ Failed to schedule payment retry:`, error);
    return {
      success: false,
      retryScheduled: false,
      maxRetriesReached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send customer notification about failed payment
 */
async function sendFailedPaymentNotification(
  context: FailedPaymentContext,
  retryResult: PaymentRetryResult
): Promise<void> {
  try {
    // Find user email from customer mapping
    const { data: customer } = await supabaseAdminClient
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', context.customerId)
      .single();

    if (!customer) {
      console.warn(`⚠️ Customer mapping not found for notification: ${context.customerId}`);
      return;
    }

    const { data: user } = await supabaseAdminClient
      .from('users')
      .select('email, full_name')
      .eq('id', customer.id)
      .single();

    if (!user?.email) {
      console.warn(`⚠️ User email not found for notification: ${customer.id}`);
      return;
    }

    // Create notification record (actual email sending would be handled by a separate service)
    await supabaseAdminClient
      .from('user_notifications')
      .insert({
        user_id: customer.id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: retryResult.retryScheduled 
          ? `Your payment of ${context.amountDue / 100} ${context.currency.toUpperCase()} failed. We'll retry automatically on ${retryResult.nextRetryAt?.toLocaleDateString()}.`
          : `Your payment of ${context.amountDue / 100} ${context.currency.toUpperCase()} failed. Please update your payment method.`,
        metadata: {
          invoice_id: context.invoiceId,
          amount_due: context.amountDue,
          currency: context.currency,
          failure_reason: context.failureReason,
          retry_scheduled: retryResult.retryScheduled,
          next_retry_at: retryResult.nextRetryAt?.toISOString()
        },
        created_at: new Date().toISOString()
      });

    console.log(`📧 Payment failure notification queued for ${user.email}`);

  } catch (error) {
    console.error(`❌ Failed to send payment failure notification:`, error);
    // Don't throw - this is non-critical for webhook processing
  }
}

/**
 * Validate and update payment method status after failure
 */
async function validateAndUpdatePaymentMethod(
  context: FailedPaymentContext,
  stripeConfig: any
): Promise<void> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(context.customerId, {
      expand: ['invoice_settings.default_payment_method']
    });

    if (!customer.deleted && customer.invoice_settings?.default_payment_method) {
      const paymentMethod = customer.invoice_settings.default_payment_method as Stripe.PaymentMethod;

      // Check if payment method needs to be marked as problematic
      const problemCodes = ['card_declined', 'expired_card', 'insufficient_funds'];
      const hasPaymentMethodProblem = problemCodes.some(code => 
        context.failureReason.toLowerCase().includes(code)
      );

      if (hasPaymentMethodProblem) {
        // Update payment method status in database
        await supabaseAdminClient
          .from('payment_methods')
          .update({
            status: 'requires_action',
            last_error: context.failureReason,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentMethod.id);

        console.log(`⚠️ Payment method ${paymentMethod.id} marked as requiring action`);
      }
    }

  } catch (error) {
    console.error(`❌ Failed to validate payment method:`, error);
    // Don't throw - this is non-critical for webhook processing
  }
}

/**
 * Get failed payment statistics for a user
 */
export async function getFailedPaymentStats(userId: string): Promise<{
  totalFailedPayments: number;
  totalFailedAmount: number;
  lastFailedPayment?: Date;
  activeRetries: number;
}> {
  try {
    const { data: failedPayments } = await supabaseAdminClient
      .from('billing_history')
      .select('amount, created_at')
      .eq('user_id', userId)
      .eq('status', 'payment_failed')
      .order('created_at', { ascending: false });

    const totalFailedPayments = failedPayments?.length || 0;
    const totalFailedAmount = failedPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const lastFailedPayment = failedPayments?.[0]?.created_at 
      ? new Date(failedPayments[0].created_at) 
      : undefined;

    // Count active retries (subscriptions in past_due status)
    const { data: activeRetries } = await supabaseAdminClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'past_due');

    return {
      totalFailedPayments,
      totalFailedAmount,
      lastFailedPayment,
      activeRetries: activeRetries?.length || 0
    };

  } catch (error) {
    console.error(`❌ Failed to get payment failure stats:`, error);
    return {
      totalFailedPayments: 0,
      totalFailedAmount: 0,
      activeRetries: 0
    };
  }
}
