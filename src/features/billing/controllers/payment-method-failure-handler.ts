/**
 * Payment Method Failure Handler - Step 2.3 Edge Case Implementation
 * 
 * Handles payment method failures and recovery including:
 * - Card expiration handling
 * - Declined card management
 * - Payment method validation failures
 * - Automatic payment method updates
 * - Customer notification for payment method issues
 * - Subscription pause/resume based on payment method status
 */

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import Stripe from 'stripe';

export interface PaymentMethodFailure {
  paymentMethodId: string;
  customerId: string;
  failureType: 'expired' | 'declined' | 'invalid' | 'authentication_required' | 'processing_error';
  failureCode?: string;
  failureMessage?: string;
  lastAttempt: Date;
  retryable: boolean;
}

export interface PaymentMethodRecovery {
  success: boolean;
  newPaymentMethodId?: string;
  recoveryMethod: 'automatic_update' | 'customer_action_required' | 'manual_intervention';
  nextAction?: string;
  error?: string;
}

export interface PaymentMethodStatus {
  id: string;
  status: 'active' | 'requires_action' | 'expired' | 'failed';
  lastError?: string;
  expiresAt?: Date;
  needsUpdate: boolean;
}

/**
 * Handle payment method failure events from webhooks
 */
export async function handlePaymentMethodFailure(
  paymentMethod: Stripe.PaymentMethod,
  failureContext: {
    failureType: string;
    failureCode?: string;
    failureMessage?: string;
  },
  stripeConfig: any
): Promise<void> {
  console.log(`💳 [PM_FAILURE] ===== STARTING PAYMENT METHOD FAILURE HANDLER =====`);
  console.log(`💳 [PM_FAILURE] Payment Method ID: ${paymentMethod.id}`);
  console.log(`💳 [PM_FAILURE] Customer: ${paymentMethod.customer}`);
  console.log(`💳 [PM_FAILURE] Failure Type: ${failureContext.failureType}`);
  console.log(`💳 [PM_FAILURE] Failure Code: ${failureContext.failureCode}`);

  try {
    // STEP 1: Find affected user
    const userId = await findUserFromPaymentMethod(paymentMethod, stripeConfig);
    if (!userId) {
      console.warn(`⚠️ [STEP 1] Could not find user for payment method ${paymentMethod.id}`);
      return;
    }
    console.log(`✅ [STEP 1] User found: ${userId}`);

    // STEP 2: Create failure context
    const failure: PaymentMethodFailure = {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer as string,
      failureType: mapFailureType(failureContext.failureType),
      failureCode: failureContext.failureCode,
      failureMessage: failureContext.failureMessage,
      lastAttempt: new Date(),
      retryable: isRetryableFailure(failureContext.failureType, failureContext.failureCode)
    };

    console.log(`✅ [STEP 2] Failure context created:`, failure);

    // STEP 3: Record failure in database
    await recordPaymentMethodFailure(failure, userId);
    console.log(`✅ [STEP 3] Payment method failure recorded`);

    // STEP 4: Attempt automatic recovery
    const recovery = await attemptPaymentMethodRecovery(failure, stripeConfig, userId);
    console.log(`✅ [STEP 4] Recovery attempt completed:`, recovery);

    // STEP 5: Handle subscriptions based on failure severity
    await handleSubscriptionsForFailedPaymentMethod(failure, recovery, userId, stripeConfig);
    console.log(`✅ [STEP 5] Subscription handling completed`);

    // STEP 6: Send customer notification
    await sendPaymentMethodFailureNotification(failure, recovery, userId);
    console.log(`✅ [STEP 6] Customer notification sent`);

    // STEP 7: Create admin alert if needed
    if (!recovery.success && !failure.retryable) {
      await createPaymentMethodAlert(failure, userId);
      console.log(`✅ [STEP 7] Admin alert created for non-recoverable failure`);
    }

    console.log(`🎉 [SUCCESS] ===== PAYMENT METHOD FAILURE HANDLER COMPLETED =====`);

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Payment method failure handler failed:`, {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      failureContext,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Don't throw - we want webhook to succeed even if failure handling fails
  }
}

/**
 * Check and handle expiring payment methods proactively
 */
export async function checkExpiringPaymentMethods(stripeConfig: any): Promise<void> {
  console.log(`📅 [EXPIRY_CHECK] ===== STARTING EXPIRING PAYMENT METHODS CHECK =====`);

  try {
    const stripe = createStripeAdminClient(stripeConfig);
    
    // Get all active payment methods that expire within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringPaymentMethods } = await supabaseAdminClient
      .from('payment_methods')
      .select('*')
      .eq('type', 'card')
      .lte('card_exp_year', thirtyDaysFromNow.getFullYear())
      .lte('card_exp_month', thirtyDaysFromNow.getMonth() + 1);

    console.log(`📅 [EXPIRY_CHECK] Found ${expiringPaymentMethods?.length || 0} expiring payment methods`);

    for (const pm of expiringPaymentMethods || []) {
      try {
        await handleExpiringPaymentMethod(pm, stripe);
        console.log(`✅ Processed expiring payment method: ${pm.id}`);
      } catch (error) {
        console.error(`❌ Failed to process expiring payment method ${pm.id}:`, error);
      }
    }

    console.log(`🎉 [SUCCESS] ===== EXPIRING PAYMENT METHODS CHECK COMPLETED =====`);

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Expiring payment methods check failed:`, error);
  }
}

/**
 * Validate all payment methods for a user
 */
export async function validateUserPaymentMethods(
  userId: string,
  stripeConfig: any
): Promise<PaymentMethodStatus[]> {
  console.log(`🔍 [VALIDATION] ===== STARTING PAYMENT METHOD VALIDATION =====`);
  console.log(`🔍 [VALIDATION] User ID: ${userId}`);

  try {
    const stripe = createStripeAdminClient(stripeConfig);
    
    // Get user's payment methods
    const { data: paymentMethods } = await supabaseAdminClient
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId);

    const statuses: PaymentMethodStatus[] = [];

    for (const pm of paymentMethods || []) {
      try {
        const status = await validateSinglePaymentMethod(pm, stripe);
        statuses.push(status);
        console.log(`✅ Validated payment method ${pm.id}: ${status.status}`);
      } catch (error) {
        console.error(`❌ Failed to validate payment method ${pm.id}:`, error);
        statuses.push({
          id: pm.id,
          status: 'failed',
          lastError: error instanceof Error ? error.message : 'Unknown error',
          needsUpdate: true
        });
      }
    }

    console.log(`🎉 [SUCCESS] ===== PAYMENT METHOD VALIDATION COMPLETED =====`);
    return statuses;

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Payment method validation failed:`, error);
    return [];
  }
}

/**
 * Find user ID from payment method
 */
async function findUserFromPaymentMethod(
  paymentMethod: Stripe.PaymentMethod,
  stripeConfig: any
): Promise<string | null> {
  try {
    if (!paymentMethod.customer) {
      console.warn(`⚠️ Payment method ${paymentMethod.id} has no customer`);
      return null;
    }

    const { data: customer } = await supabaseAdminClient
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', paymentMethod.customer as string)
      .single();

    return customer?.id || null;
  } catch (error) {
    console.error(`❌ Failed to find user from payment method:`, error);
    return null;
  }
}

/**
 * Map Stripe failure types to our internal types
 */
function mapFailureType(stripeFailureType: string): PaymentMethodFailure['failureType'] {
  const mapping: Record<string, PaymentMethodFailure['failureType']> = {
    'card_declined': 'declined',
    'expired_card': 'expired',
    'incorrect_cvc': 'invalid',
    'processing_error': 'processing_error',
    'authentication_required': 'authentication_required',
    'card_not_supported': 'invalid',
    'currency_not_supported': 'invalid',
    'duplicate_transaction': 'declined',
    'fraudulent': 'declined',
    'generic_decline': 'declined',
    'insufficient_funds': 'declined',
    'invalid_account': 'invalid',
    'invalid_amount': 'invalid',
    'invalid_cvc': 'invalid',
    'invalid_expiry_month': 'invalid',
    'invalid_expiry_year': 'invalid',
    'invalid_number': 'invalid',
    'issuer_not_available': 'processing_error',
    'lost_card': 'declined',
    'merchant_blacklist': 'declined',
    'new_account_information_available': 'requires_action',
    'no_action_taken': 'processing_error',
    'not_permitted': 'declined',
    'pickup_card': 'declined',
    'pin_try_exceeded': 'declined',
    'restricted_card': 'declined',
    'revocation_of_all_authorizations': 'declined',
    'revocation_of_authorization': 'declined',
    'security_violation': 'declined',
    'service_not_allowed': 'declined',
    'stolen_card': 'declined',
    'stop_payment_order': 'declined',
    'testmode_decline': 'declined',
    'transaction_not_allowed': 'declined',
    'try_again_later': 'processing_error',
    'withdrawal_count_limit_exceeded': 'declined'
  };

  return mapping[stripeFailureType] || 'processing_error';
}

/**
 * Determine if a failure is retryable
 */
function isRetryableFailure(failureType: string, failureCode?: string): boolean {
  const nonRetryableTypes = [
    'expired_card',
    'incorrect_cvc',
    'invalid_number',
    'invalid_expiry_month',
    'invalid_expiry_year',
    'card_not_supported',
    'currency_not_supported',
    'fraudulent',
    'lost_card',
    'stolen_card'
  ];

  const nonRetryableCodes = [
    'card_declined',
    'generic_decline',
    'not_permitted',
    'restricted_card',
    'security_violation'
  ];

  return !nonRetryableTypes.includes(failureType) && 
         !nonRetryableCodes.includes(failureCode || '');
}

/**
 * Record payment method failure in database
 */
async function recordPaymentMethodFailure(
  failure: PaymentMethodFailure,
  userId: string
): Promise<void> {
  try {
    // Update payment method status
    await supabaseAdminClient
      .from('payment_methods')
      .update({
        status: 'requires_action',
        last_error: failure.failureMessage || failure.failureCode || 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', failure.paymentMethodId);

    // Record failure event
    await supabaseAdminClient
      .from('payment_method_failures')
      .insert({
        payment_method_id: failure.paymentMethodId,
        user_id: userId,
        failure_type: failure.failureType,
        failure_code: failure.failureCode,
        failure_message: failure.failureMessage,
        retryable: failure.retryable,
        occurred_at: failure.lastAttempt.toISOString(),
        created_at: new Date().toISOString()
      });

    console.log(`📝 Payment method failure recorded for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to record payment method failure:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Attempt automatic recovery of failed payment method
 */
async function attemptPaymentMethodRecovery(
  failure: PaymentMethodFailure,
  stripeConfig: any,
  userId: string
): Promise<PaymentMethodRecovery> {
  console.log(`🔧 [RECOVERY] Attempting payment method recovery for ${failure.paymentMethodId}`);

  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // Check if this is an expired card that can be auto-updated
    if (failure.failureType === 'expired') {
      return await attemptCardUpdate(failure, stripe, userId);
    }

    // Check if customer has other valid payment methods
    if (failure.failureType === 'declined' || failure.failureType === 'invalid') {
      return await switchToAlternativePaymentMethod(failure, stripe, userId);
    }

    // For authentication required, guide customer to complete authentication
    if (failure.failureType === 'authentication_required') {
      return {
        success: false,
        recoveryMethod: 'customer_action_required',
        nextAction: 'complete_authentication'
      };
    }

    // For processing errors, mark as retryable
    if (failure.failureType === 'processing_error' && failure.retryable) {
      return {
        success: false,
        recoveryMethod: 'automatic_update',
        nextAction: 'retry_later'
      };
    }

    // Default: customer action required
    return {
      success: false,
      recoveryMethod: 'customer_action_required',
      nextAction: 'update_payment_method'
    };

  } catch (error) {
    console.error(`❌ Payment method recovery failed:`, error);
    return {
      success: false,
      recoveryMethod: 'manual_intervention',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Attempt to update expired card automatically
 */
async function attemptCardUpdate(
  failure: PaymentMethodFailure,
  stripe: Stripe,
  userId: string
): Promise<PaymentMethodRecovery> {
  try {
    // Check if Stripe has updated card information available
    const paymentMethod = await stripe.paymentMethods.retrieve(failure.paymentMethodId);
    
    if (paymentMethod.card?.exp_month && paymentMethod.card?.exp_year) {
      const currentDate = new Date();
      const cardExpiry = new Date(paymentMethod.card.exp_year, paymentMethod.card.exp_month - 1);
      
      if (cardExpiry > currentDate) {
        // Card has been updated by the network
        await supabaseAdminClient
          .from('payment_methods')
          .update({
            card_exp_month: paymentMethod.card.exp_month,
            card_exp_year: paymentMethod.card.exp_year,
            status: 'active',
            last_error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', failure.paymentMethodId);

        console.log(`✅ Card automatically updated: ${failure.paymentMethodId}`);
        return {
          success: true,
          recoveryMethod: 'automatic_update'
        };
      }
    }

    return {
      success: false,
      recoveryMethod: 'customer_action_required',
      nextAction: 'update_expired_card'
    };

  } catch (error) {
    console.error(`❌ Card update attempt failed:`, error);
    return {
      success: false,
      recoveryMethod: 'customer_action_required',
      nextAction: 'update_expired_card',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Switch to alternative payment method if available
 */
async function switchToAlternativePaymentMethod(
  failure: PaymentMethodFailure,
  stripe: Stripe,
  userId: string
): Promise<PaymentMethodRecovery> {
  try {
    // Find other active payment methods for the user
    const { data: alternativePaymentMethods } = await supabaseAdminClient
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('id', failure.paymentMethodId);

    if (!alternativePaymentMethods || alternativePaymentMethods.length === 0) {
      return {
        success: false,
        recoveryMethod: 'customer_action_required',
        nextAction: 'add_new_payment_method'
      };
    }

    // Use the first alternative payment method
    const alternativePM = alternativePaymentMethods[0];

    // Update customer's default payment method
    await stripe.customers.update(failure.customerId, {
      invoice_settings: {
        default_payment_method: alternativePM.id
      }
    });

    // Update database
    await supabaseAdminClient
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    await supabaseAdminClient
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', alternativePM.id);

    console.log(`✅ Switched to alternative payment method: ${alternativePM.id}`);
    return {
      success: true,
      newPaymentMethodId: alternativePM.id,
      recoveryMethod: 'automatic_update'
    };

  } catch (error) {
    console.error(`❌ Alternative payment method switch failed:`, error);
    return {
      success: false,
      recoveryMethod: 'customer_action_required',
      nextAction: 'update_payment_method',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle subscriptions when payment method fails
 */
async function handleSubscriptionsForFailedPaymentMethod(
  failure: PaymentMethodFailure,
  recovery: PaymentMethodRecovery,
  userId: string,
  stripeConfig: any
): Promise<void> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // If recovery was successful, no need to pause subscriptions
    if (recovery.success) {
      console.log(`✅ Payment method recovered, subscriptions remain active`);
      return;
    }

    // For non-retryable failures, pause subscriptions
    if (!failure.retryable) {
      const { data: subscriptions } = await supabaseAdminClient
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing']);

      for (const subscription of subscriptions || []) {
        try {
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            pause_collection: {
              behavior: 'mark_uncollectible'
            },
            metadata: {
              paused_reason: 'payment_method_failed',
              failed_payment_method_id: failure.paymentMethodId,
              paused_at: new Date().toISOString()
            }
          });

          console.log(`⏸️ Subscription ${subscription.stripe_subscription_id} paused due to payment method failure`);
        } catch (error) {
          console.error(`❌ Failed to pause subscription ${subscription.stripe_subscription_id}:`, error);
        }
      }
    }

  } catch (error) {
    console.error(`❌ Failed to handle subscriptions for payment method failure:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Handle expiring payment method proactively
 */
async function handleExpiringPaymentMethod(
  paymentMethod: any,
  stripe: Stripe
): Promise<void> {
  try {
    const expiryDate = new Date(paymentMethod.card_exp_year, paymentMethod.card_exp_month - 1);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 7) {
      // Send urgent notification
      await sendExpiryNotification(paymentMethod, 'urgent', daysUntilExpiry);
    } else if (daysUntilExpiry <= 30) {
      // Send warning notification
      await sendExpiryNotification(paymentMethod, 'warning', daysUntilExpiry);
    }

    // Check if card has been automatically updated
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethod.id);
    if (stripePaymentMethod.card?.exp_month !== paymentMethod.card_exp_month ||
        stripePaymentMethod.card?.exp_year !== paymentMethod.card_exp_year) {
      
      // Update database with new expiry
      await supabaseAdminClient
        .from('payment_methods')
        .update({
          card_exp_month: stripePaymentMethod.card.exp_month,
          card_exp_year: stripePaymentMethod.card.exp_year,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentMethod.id);

      console.log(`✅ Payment method ${paymentMethod.id} automatically updated with new expiry`);
    }

  } catch (error) {
    console.error(`❌ Failed to handle expiring payment method ${paymentMethod.id}:`, error);
  }
}

/**
 * Validate a single payment method
 */
async function validateSinglePaymentMethod(
  paymentMethod: any,
  stripe: Stripe
): Promise<PaymentMethodStatus> {
  try {
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethod.id);
    
    // Check if card is expired
    if (stripePaymentMethod.card) {
      const expiryDate = new Date(stripePaymentMethod.card.exp_year, stripePaymentMethod.card.exp_month - 1);
      const isExpired = expiryDate < new Date();
      const expiresWithin30Days = (expiryDate.getTime() - Date.now()) < (30 * 24 * 60 * 60 * 1000);

      if (isExpired) {
        return {
          id: paymentMethod.id,
          status: 'expired',
          expiresAt: expiryDate,
          needsUpdate: true
        };
      }

      if (expiresWithin30Days) {
        return {
          id: paymentMethod.id,
          status: 'requires_action',
          expiresAt: expiryDate,
          needsUpdate: true
        };
      }
    }

    // Check for recent failures
    const { data: recentFailures } = await supabaseAdminClient
      .from('payment_method_failures')
      .select('*')
      .eq('payment_method_id', paymentMethod.id)
      .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('occurred_at', { ascending: false })
      .limit(1);

    if (recentFailures && recentFailures.length > 0) {
      const lastFailure = recentFailures[0];
      return {
        id: paymentMethod.id,
        status: 'failed',
        lastError: lastFailure.failure_message || lastFailure.failure_code,
        needsUpdate: !lastFailure.retryable
      };
    }

    return {
      id: paymentMethod.id,
      status: 'active',
      needsUpdate: false
    };

  } catch (error) {
    console.error(`❌ Failed to validate payment method ${paymentMethod.id}:`, error);
    return {
      id: paymentMethod.id,
      status: 'failed',
      lastError: error instanceof Error ? error.message : 'Unknown error',
      needsUpdate: true
    };
  }
}

/**
 * Send payment method failure notification
 */
async function sendPaymentMethodFailureNotification(
  failure: PaymentMethodFailure,
  recovery: PaymentMethodRecovery,
  userId: string
): Promise<void> {
  try {
    const { data: user } = await supabaseAdminClient
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      console.warn(`⚠️ User email not found for payment method failure notification: ${userId}`);
      return;
    }

    let title: string;
    let message: string;

    if (recovery.success) {
      title = 'Payment Method Issue Resolved';
      message = 'We automatically resolved an issue with your payment method. Your service will continue uninterrupted.';
    } else {
      switch (failure.failureType) {
        case 'expired':
          title = 'Payment Method Expired';
          message = 'Your payment method has expired. Please update your payment information to continue your service.';
          break;
        case 'declined':
          title = 'Payment Method Declined';
          message = 'Your payment method was declined. Please check with your bank or update your payment information.';
          break;
        case 'authentication_required':
          title = 'Payment Authentication Required';
          message = 'Your payment requires additional authentication. Please complete the verification process.';
          break;
        default:
          title = 'Payment Method Issue';
          message = 'There was an issue with your payment method. Please update your payment information.';
      }
    }

    await supabaseAdminClient
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'payment_method_failure',
        title,
        message,
        metadata: {
          payment_method_id: failure.paymentMethodId,
          failure_type: failure.failureType,
          failure_code: failure.failureCode,
          recovery_success: recovery.success,
          recovery_method: recovery.recoveryMethod,
          next_action: recovery.nextAction
        },
        created_at: new Date().toISOString()
      });

    console.log(`📧 Payment method failure notification queued for ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send payment method failure notification:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Send expiry notification
 */
async function sendExpiryNotification(
  paymentMethod: any,
  urgency: 'warning' | 'urgent',
  daysUntilExpiry: number
): Promise<void> {
  try {
    const { data: user } = await supabaseAdminClient
      .from('users')
      .select('email, full_name')
      .eq('id', paymentMethod.user_id)
      .single();

    if (!user?.email) {
      console.warn(`⚠️ User email not found for expiry notification: ${paymentMethod.user_id}`);
      return;
    }

    const title = urgency === 'urgent' 
      ? 'Payment Method Expires Soon' 
      : 'Payment Method Expiring';
    
    const message = `Your payment method ending in ${paymentMethod.card_last4} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Please update your payment information to avoid service interruption.`;

    await supabaseAdminClient
      .from('user_notifications')
      .insert({
        user_id: paymentMethod.user_id,
        type: 'payment_method_expiring',
        title,
        message,
        metadata: {
          payment_method_id: paymentMethod.id,
          days_until_expiry: daysUntilExpiry,
          urgency,
          card_last4: paymentMethod.card_last4
        },
        created_at: new Date().toISOString()
      });

    console.log(`📧 Payment method expiry notification queued for ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send expiry notification:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Create admin alert for payment method issues
 */
async function createPaymentMethodAlert(
  failure: PaymentMethodFailure,
  userId: string
): Promise<void> {
  try {
    await supabaseAdminClient
      .from('admin_alerts')
      .insert({
        type: 'payment_method_failure',
        title: `Payment Method Failure: ${failure.paymentMethodId}`,
        message: `Non-recoverable payment method failure for user ${userId}. Type: ${failure.failureType}. Manual intervention may be required.`,
        severity: 'medium',
        metadata: {
          payment_method_id: failure.paymentMethodId,
          user_id: userId,
          failure_type: failure.failureType,
          failure_code: failure.failureCode,
          failure_message: failure.failureMessage,
          retryable: failure.retryable
        },
        created_at: new Date().toISOString()
      });

    console.log(`🚨 Admin alert created for payment method failure ${failure.paymentMethodId}`);
  } catch (error) {
    console.error(`❌ Failed to create payment method alert:`, error);
    // Don't throw - this is non-critical
  }
}
