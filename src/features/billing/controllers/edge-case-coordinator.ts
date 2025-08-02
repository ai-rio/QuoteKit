/**
 * Edge Case Coordinator - Step 2.3 Main Controller
 * 
 * Central coordinator for all billing edge cases including:
 * - Failed payment orchestration
 * - Proration management
 * - Refund and credit processing
 * - Dispute handling
 * - Payment method failure recovery
 * - Cross-system event coordination
 * - Comprehensive error recovery workflows
 */

import { handleFailedPayment } from './failed-payment-handler';
import { previewPlanChangeProration, executePlanChangeWithProration } from './proration-handler';
import { processRefund, createCreditNote } from './refunds-credits-handler';
import { handleDisputeEvent, submitDisputeEvidence } from './dispute-handler';
import { handlePaymentMethodFailure, checkExpiringPaymentMethods } from './payment-method-failure-handler';
import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import Stripe from 'stripe';

export interface EdgeCaseContext {
  eventType: string;
  eventId: string;
  userId?: string;
  customerId?: string;
  subscriptionId?: string;
  invoiceId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

export interface EdgeCaseResult {
  success: boolean;
  handlerUsed: string;
  actions: string[];
  nextSteps?: string[];
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Main entry point for all edge case handling
 * Routes events to appropriate specialized handlers
 */
export async function handleBillingEdgeCase(
  event: Stripe.Event,
  stripeConfig: any
): Promise<EdgeCaseResult> {
  console.log(`🎯 [EDGE_CASE] ===== STARTING EDGE CASE COORDINATION =====`);
  console.log(`🎯 [EDGE_CASE] Event Type: ${event.type}`);
  console.log(`🎯 [EDGE_CASE] Event ID: ${event.id}`);

  try {
    // STEP 1: Extract context from event
    const context = await extractEdgeCaseContext(event, stripeConfig);
    console.log(`✅ [STEP 1] Edge case context extracted:`, context);

    // STEP 2: Route to appropriate handler
    const result = await routeToHandler(event, context, stripeConfig);
    console.log(`✅ [STEP 2] Handler execution completed:`, result);

    // STEP 3: Record edge case handling for analytics
    await recordEdgeCaseHandling(context, result);
    console.log(`✅ [STEP 3] Edge case handling recorded`);

    // STEP 4: Trigger follow-up actions if needed
    await triggerFollowUpActions(context, result, stripeConfig);
    console.log(`✅ [STEP 4] Follow-up actions triggered`);

    console.log(`🎉 [SUCCESS] ===== EDGE CASE COORDINATION COMPLETED =====`);
    return result;

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Edge case coordination failed:`, {
      eventType: event.type,
      eventId: event.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      handlerUsed: 'coordinator',
      actions: ['error_handling'],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Proactive edge case monitoring and prevention
 */
export async function runProactiveEdgeCaseMonitoring(stripeConfig: any): Promise<void> {
  console.log(`🔍 [PROACTIVE] ===== STARTING PROACTIVE EDGE CASE MONITORING =====`);

  try {
    // STEP 1: Check for expiring payment methods
    console.log(`📅 [STEP 1] Checking expiring payment methods...`);
    await checkExpiringPaymentMethods(stripeConfig);
    console.log(`✅ [STEP 1] Expiring payment methods check completed`);

    // STEP 2: Check for subscriptions with payment issues
    console.log(`💳 [STEP 2] Checking subscriptions with payment issues...`);
    await checkSubscriptionsWithPaymentIssues(stripeConfig);
    console.log(`✅ [STEP 2] Subscription payment issues check completed`);

    // STEP 3: Check for pending disputes requiring action
    console.log(`⚖️ [STEP 3] Checking pending disputes...`);
    await checkPendingDisputes(stripeConfig);
    console.log(`✅ [STEP 3] Pending disputes check completed`);

    // STEP 4: Check for failed invoices requiring retry
    console.log(`📄 [STEP 4] Checking failed invoices...`);
    await checkFailedInvoicesForRetry(stripeConfig);
    console.log(`✅ [STEP 4] Failed invoices check completed`);

    // STEP 5: Generate edge case analytics report
    console.log(`📊 [STEP 5] Generating edge case analytics...`);
    await generateEdgeCaseAnalytics();
    console.log(`✅ [STEP 5] Edge case analytics generated`);

    console.log(`🎉 [SUCCESS] ===== PROACTIVE EDGE CASE MONITORING COMPLETED =====`);

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Proactive edge case monitoring failed:`, error);
  }
}

/**
 * Extract context from Stripe event for edge case handling
 */
async function extractEdgeCaseContext(
  event: Stripe.Event,
  stripeConfig: any
): Promise<EdgeCaseContext> {
  const context: EdgeCaseContext = {
    eventType: event.type,
    eventId: event.id,
    metadata: {}
  };

  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // Extract context based on event type
    switch (event.type) {
      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        context.invoiceId = invoice.id;
        context.customerId = invoice.customer as string;
        context.subscriptionId = invoice.subscription as string;
        context.userId = await findUserFromCustomerId(context.customerId);
        context.metadata = {
          amount: invoice.amount_due,
          currency: invoice.currency,
          attempt_count: invoice.attempt_count
        };
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        context.subscriptionId = subscription.id;
        context.customerId = subscription.customer as string;
        context.userId = await findUserFromCustomerId(context.customerId);
        context.metadata = {
          status: subscription.status,
          price_id: subscription.items.data[0]?.price?.id
        };
        break;

      case 'charge.dispute.created':
      case 'charge.dispute.updated':
      case 'charge.dispute.closed':
        const dispute = event.data.object as Stripe.Dispute;
        const charge = await stripe.charges.retrieve(dispute.charge as string);
        context.customerId = charge.customer as string;
        context.userId = await findUserFromCustomerId(context.customerId);
        context.metadata = {
          dispute_id: dispute.id,
          charge_id: dispute.charge,
          amount: dispute.amount,
          reason: dispute.reason,
          status: dispute.status
        };
        break;

      case 'payment_method.attached':
      case 'setup_intent.succeeded':
        const paymentMethod = event.data.object as Stripe.PaymentMethod | Stripe.SetupIntent;
        if ('customer' in paymentMethod && paymentMethod.customer) {
          context.customerId = paymentMethod.customer as string;
          context.userId = await findUserFromCustomerId(context.customerId);
          context.paymentMethodId = 'payment_method' in paymentMethod 
            ? (paymentMethod.payment_method as string)
            : paymentMethod.id;
        }
        break;

      default:
        console.log(`ℹ️ No specific context extraction for event type: ${event.type}`);
    }

    return context;

  } catch (error) {
    console.error(`❌ Failed to extract edge case context:`, error);
    return context; // Return partial context
  }
}

/**
 * Route event to appropriate specialized handler
 */
async function routeToHandler(
  event: Stripe.Event,
  context: EdgeCaseContext,
  stripeConfig: any
): Promise<EdgeCaseResult> {
  try {
    switch (event.type) {
      // Failed Payment Handling
      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        const paymentResult = await handleFailedPayment(invoice, stripeConfig);
        return {
          success: paymentResult.success,
          handlerUsed: 'failed_payment_handler',
          actions: paymentResult.retryScheduled ? ['retry_scheduled'] : ['max_retries_reached'],
          nextSteps: paymentResult.retryScheduled 
            ? [`Retry scheduled for ${paymentResult.nextRetryAt?.toISOString()}`]
            : ['Customer action required'],
          metadata: {
            retry_scheduled: paymentResult.retryScheduled,
            next_retry_at: paymentResult.nextRetryAt?.toISOString(),
            max_retries_reached: paymentResult.maxRetriesReached
          }
        };

      // Dispute Handling
      case 'charge.dispute.created':
      case 'charge.dispute.updated':
      case 'charge.dispute.closed':
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeEvent(dispute, event.type, stripeConfig);
        return {
          success: true,
          handlerUsed: 'dispute_handler',
          actions: [`dispute_${event.type.split('.').pop()}`],
          metadata: {
            dispute_id: dispute.id,
            status: dispute.status,
            amount: dispute.amount
          }
        };

      // Payment Method Issues
      case 'payment_method.attached':
        // This is actually a success case, but we monitor for potential issues
        return {
          success: true,
          handlerUsed: 'payment_method_monitor',
          actions: ['payment_method_attached'],
          metadata: {
            payment_method_id: (event.data.object as Stripe.PaymentMethod).id
          }
        };

      case 'setup_intent.succeeded':
        // Monitor for authentication issues
        const setupIntent = event.data.object as Stripe.SetupIntent;
        if (setupIntent.last_setup_error) {
          await handlePaymentMethodFailure(
            setupIntent.payment_method as Stripe.PaymentMethod,
            {
              failureType: setupIntent.last_setup_error.code || 'unknown',
              failureCode: setupIntent.last_setup_error.code,
              failureMessage: setupIntent.last_setup_error.message
            },
            stripeConfig
          );
          return {
            success: false,
            handlerUsed: 'payment_method_failure_handler',
            actions: ['setup_intent_error_handled'],
            error: setupIntent.last_setup_error.message
          };
        }
        return {
          success: true,
          handlerUsed: 'setup_intent_monitor',
          actions: ['setup_intent_succeeded']
        };

      // Subscription Changes (Proration Monitoring)
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        const previousAttributes = event.data.previous_attributes as any;
        
        if (previousAttributes?.items) {
          // This was a plan change - monitor for proration issues
          return {
            success: true,
            handlerUsed: 'proration_monitor',
            actions: ['plan_change_monitored'],
            metadata: {
              subscription_id: subscription.id,
              old_price: previousAttributes.items?.data?.[0]?.price?.id,
              new_price: subscription.items.data[0]?.price?.id
            }
          };
        }
        return {
          success: true,
          handlerUsed: 'subscription_monitor',
          actions: ['subscription_updated']
        };

      default:
        console.log(`ℹ️ No specific handler for event type: ${event.type}`);
        return {
          success: true,
          handlerUsed: 'default_monitor',
          actions: ['event_logged']
        };
    }

  } catch (error) {
    console.error(`❌ Handler routing failed:`, error);
    return {
      success: false,
      handlerUsed: 'error_handler',
      actions: ['error_occurred'],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Find user ID from Stripe customer ID
 */
async function findUserFromCustomerId(customerId: string): Promise<string | undefined> {
  try {
    const { data: customer } = await supabaseAdminClient
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    return customer?.id;
  } catch (error) {
    console.error(`❌ Failed to find user from customer ID ${customerId}:`, error);
    return undefined;
  }
}

/**
 * Record edge case handling for analytics and monitoring
 */
async function recordEdgeCaseHandling(
  context: EdgeCaseContext,
  result: EdgeCaseResult
): Promise<void> {
  try {
    await supabaseAdminClient
      .from('edge_case_events')
      .insert({
        event_type: context.eventType,
        event_id: context.eventId,
        user_id: context.userId,
        customer_id: context.customerId,
        subscription_id: context.subscriptionId,
        invoice_id: context.invoiceId,
        payment_method_id: context.paymentMethodId,
        handler_used: result.handlerUsed,
        success: result.success,
        actions: result.actions,
        next_steps: result.nextSteps,
        error_message: result.error,
        context_metadata: context.metadata,
        result_metadata: result.metadata,
        created_at: new Date().toISOString()
      });

    console.log(`📝 Edge case handling recorded: ${context.eventType} -> ${result.handlerUsed}`);
  } catch (error) {
    console.error(`❌ Failed to record edge case handling:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Trigger follow-up actions based on edge case results
 */
async function triggerFollowUpActions(
  context: EdgeCaseContext,
  result: EdgeCaseResult,
  stripeConfig: any
): Promise<void> {
  try {
    // Trigger cache invalidation for affected users
    if (context.userId) {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/account');
      console.log(`🔄 Cache invalidated for user ${context.userId}`);
    }

    // Create admin alerts for critical failures
    if (!result.success && result.handlerUsed !== 'default_monitor') {
      await createEdgeCaseAlert(context, result);
      console.log(`🚨 Admin alert created for failed edge case handling`);
    }

    // Schedule follow-up monitoring for retryable failures
    if (result.nextSteps && result.nextSteps.length > 0) {
      await scheduleFollowUpMonitoring(context, result);
      console.log(`⏰ Follow-up monitoring scheduled`);
    }

  } catch (error) {
    console.error(`❌ Failed to trigger follow-up actions:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Check subscriptions with payment issues
 */
async function checkSubscriptionsWithPaymentIssues(stripeConfig: any): Promise<void> {
  try {
    const { data: problemSubscriptions } = await supabaseAdminClient
      .from('subscriptions')
      .select('*')
      .in('status', ['past_due', 'unpaid'])
      .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Not updated in 24 hours

    console.log(`🔍 Found ${problemSubscriptions?.length || 0} subscriptions with payment issues`);

    for (const subscription of problemSubscriptions || []) {
      try {
        // Check if we need to take action
        const daysSinceLastUpdate = Math.floor(
          (Date.now() - new Date(subscription.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastUpdate >= 7) {
          // Cancel subscriptions that have been past due for a week
          const stripe = createStripeAdminClient(stripeConfig);
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
          console.log(`❌ Cancelled long-overdue subscription: ${subscription.stripe_subscription_id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to process problem subscription ${subscription.id}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to check subscriptions with payment issues:`, error);
  }
}

/**
 * Check pending disputes requiring action
 */
async function checkPendingDisputes(stripeConfig: any): Promise<void> {
  try {
    const { data: pendingDisputes } = await supabaseAdminClient
      .from('payment_disputes')
      .select('*')
      .in('status', ['warning_needs_response', 'needs_response'])
      .lt('evidence_due_by', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()); // Due within 48 hours

    console.log(`🔍 Found ${pendingDisputes?.length || 0} disputes requiring urgent attention`);

    for (const dispute of pendingDisputes || []) {
      try {
        // Create urgent admin alert
        await supabaseAdminClient
          .from('admin_alerts')
          .insert({
            type: 'dispute_urgent',
            title: `URGENT: Dispute Evidence Due Soon - ${dispute.id}`,
            message: `Dispute ${dispute.id} requires evidence submission by ${new Date(dispute.evidence_due_by).toLocaleDateString()}. Immediate action required.`,
            severity: 'critical',
            metadata: {
              dispute_id: dispute.id,
              user_id: dispute.user_id,
              evidence_due_by: dispute.evidence_due_by,
              amount: dispute.amount
            },
            created_at: new Date().toISOString()
          });

        console.log(`🚨 Urgent alert created for dispute ${dispute.id}`);
      } catch (error) {
        console.error(`❌ Failed to create urgent alert for dispute ${dispute.id}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to check pending disputes:`, error);
  }
}

/**
 * Check failed invoices that might need retry
 */
async function checkFailedInvoicesForRetry(stripeConfig: any): Promise<void> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);
    
    // Get invoices that failed but might be retryable
    const { data: failedInvoices } = await supabaseAdminClient
      .from('billing_history')
      .select('*')
      .eq('status', 'payment_failed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Within last 7 days
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // But older than 24 hours

    console.log(`🔍 Found ${failedInvoices?.length || 0} failed invoices to check for retry`);

    for (const failedInvoice of failedInvoices || []) {
      try {
        if (failedInvoice.stripe_invoice_id) {
          const invoice = await stripe.invoices.retrieve(failedInvoice.stripe_invoice_id);
          
          // Check if invoice can be retried
          if (invoice.status === 'open' && invoice.attempt_count < 4) {
            // Attempt to pay the invoice again
            await stripe.invoices.pay(invoice.id);
            console.log(`🔄 Retried payment for invoice ${invoice.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to retry invoice ${failedInvoice.id}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to check failed invoices for retry:`, error);
  }
}

/**
 * Generate edge case analytics report
 */
async function generateEdgeCaseAnalytics(): Promise<void> {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get edge case statistics
    const { data: edgeCaseStats } = await supabaseAdminClient
      .from('edge_case_events')
      .select('handler_used, success, created_at')
      .gte('created_at', last30Days);

    if (!edgeCaseStats || edgeCaseStats.length === 0) {
      console.log(`📊 No edge case events in the last 30 days`);
      return;
    }

    // Calculate statistics
    const totalEvents = edgeCaseStats.length;
    const successfulEvents = edgeCaseStats.filter(event => event.success).length;
    const successRate = (successfulEvents / totalEvents) * 100;

    const handlerStats = edgeCaseStats.reduce((acc, event) => {
      acc[event.handler_used] = (acc[event.handler_used] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Store analytics
    await supabaseAdminClient
      .from('edge_case_analytics')
      .insert({
        period_start: last30Days,
        period_end: new Date().toISOString(),
        total_events: totalEvents,
        successful_events: successfulEvents,
        success_rate: successRate,
        handler_breakdown: handlerStats,
        generated_at: new Date().toISOString()
      });

    console.log(`📊 Edge case analytics generated:`, {
      totalEvents,
      successfulEvents,
      successRate: `${successRate.toFixed(2)}%`,
      topHandler: Object.entries(handlerStats).sort(([,a], [,b]) => b - a)[0]
    });

  } catch (error) {
    console.error(`❌ Failed to generate edge case analytics:`, error);
  }
}

/**
 * Create admin alert for edge case failures
 */
async function createEdgeCaseAlert(
  context: EdgeCaseContext,
  result: EdgeCaseResult
): Promise<void> {
  try {
    await supabaseAdminClient
      .from('admin_alerts')
      .insert({
        type: 'edge_case_failure',
        title: `Edge Case Handler Failed: ${result.handlerUsed}`,
        message: `Edge case handling failed for event ${context.eventType} (${context.eventId}). Handler: ${result.handlerUsed}. Error: ${result.error}`,
        severity: 'high',
        metadata: {
          event_type: context.eventType,
          event_id: context.eventId,
          handler_used: result.handlerUsed,
          user_id: context.userId,
          error_message: result.error,
          context_metadata: context.metadata
        },
        created_at: new Date().toISOString()
      });

    console.log(`🚨 Admin alert created for edge case failure`);
  } catch (error) {
    console.error(`❌ Failed to create edge case alert:`, error);
  }
}

/**
 * Schedule follow-up monitoring for edge cases
 */
async function scheduleFollowUpMonitoring(
  context: EdgeCaseContext,
  result: EdgeCaseResult
): Promise<void> {
  try {
    // This would integrate with a job queue system in production
    // For now, we'll just log the scheduling
    console.log(`⏰ Follow-up monitoring scheduled:`, {
      eventType: context.eventType,
      handlerUsed: result.handlerUsed,
      nextSteps: result.nextSteps,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    });

    // Store in database for manual follow-up
    await supabaseAdminClient
      .from('scheduled_follow_ups')
      .insert({
        event_type: context.eventType,
        event_id: context.eventId,
        user_id: context.userId,
        handler_used: result.handlerUsed,
        next_steps: result.nextSteps,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error(`❌ Failed to schedule follow-up monitoring:`, error);
  }
}

/**
 * Public API functions for manual edge case handling
 */

export async function manuallyProcessRefund(
  userId: string,
  refundRequest: {
    paymentIntentId?: string;
    chargeId?: string;
    invoiceId?: string;
    amount?: number;
    reason: string;
  },
  stripeConfig: any
) {
  return await processRefund(refundRequest, stripeConfig, userId);
}

export async function manuallyCreateCreditNote(
  userId: string,
  creditRequest: {
    invoiceId: string;
    amount?: number;
    reason: string;
    memo?: string;
  },
  stripeConfig: any
) {
  return await createCreditNote(creditRequest, stripeConfig, userId);
}

export async function manuallyPreviewPlanChange(
  subscriptionId: string,
  newPriceId: string,
  stripeConfig: any
) {
  return await previewPlanChangeProration(subscriptionId, newPriceId, stripeConfig);
}

export async function manuallyExecutePlanChange(
  subscriptionId: string,
  newPriceId: string,
  stripeConfig: any,
  options?: any
) {
  return await executePlanChangeWithProration(subscriptionId, newPriceId, stripeConfig, options);
}

export async function manuallySubmitDisputeEvidence(
  disputeId: string,
  evidence: any,
  stripeConfig: any,
  userId: string
) {
  return await submitDisputeEvidence(disputeId, evidence, stripeConfig, userId);
}
