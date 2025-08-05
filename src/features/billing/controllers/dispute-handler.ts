/**
 * Invoice Dispute Handler - Step 2.3 Edge Case Implementation
 * 
 * Handles invoice disputes and chargebacks including:
 * - Dispute notification processing
 * - Evidence collection and submission
 * - Dispute status tracking
 * - Automatic subscription handling during disputes
 * - Chargeback protection measures
 * - Dispute resolution workflows
 */

import Stripe from 'stripe';

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export interface DisputeContext {
  disputeId: string;
  chargeId: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  evidenceDueBy: Date;
  created: Date;
}

export interface DisputeEvidence {
  customerCommunication?: string;
  receipt?: string;
  shippingDocumentation?: string;
  duplicateChargeDocumentation?: string;
  refundPolicy?: string;
  cancellationPolicy?: string;
  customerSignature?: string;
  uncategorizedText?: string;
  uncategorizedFile?: string;
}

export interface DisputeResponse {
  success: boolean;
  disputeId: string;
  status: string;
  evidenceSubmitted: boolean;
  error?: string;
}

/**
 * Handle incoming dispute webhook events
 */
export async function handleDisputeEvent(
  dispute: Stripe.Dispute,
  eventType: string,
  stripeConfig: any
): Promise<void> {
  console.log(`⚖️ [DISPUTE] ===== STARTING DISPUTE EVENT HANDLER =====`);
  console.log(`⚖️ [DISPUTE] Event Type: ${eventType}`);
  console.log(`⚖️ [DISPUTE] Dispute ID: ${dispute.id}`);
  console.log(`⚖️ [DISPUTE] Charge ID: ${dispute.charge}`);
  console.log(`⚖️ [DISPUTE] Amount: ${dispute.amount} ${dispute.currency}`);
  console.log(`⚖️ [DISPUTE] Reason: ${dispute.reason}`);
  console.log(`⚖️ [DISPUTE] Status: ${dispute.status}`);

  try {
    // STEP 1: Extract dispute context
    const context = extractDisputeContext(dispute);
    console.log(`✅ [STEP 1] Dispute context extracted:`, context);

    // STEP 2: Find affected user
    const userId = await findUserFromCharge(dispute.charge as string, stripeConfig);
    if (!userId) {
      console.warn(`⚠️ [STEP 2] Could not find user for charge ${dispute.charge}`);
      return;
    }
    console.log(`✅ [STEP 2] User found: ${userId}`);

    // STEP 3: Record dispute in database
    await recordDispute(context, userId, eventType);
    console.log(`✅ [STEP 3] Dispute recorded in database`);

    // STEP 4: Handle dispute based on event type
    switch (eventType) {
      case 'charge.dispute.created':
        await handleDisputeCreated(context, userId, stripeConfig);
        break;
      case 'charge.dispute.updated':
        await handleDisputeUpdated(context, userId, stripeConfig);
        break;
      case 'charge.dispute.closed':
        await handleDisputeClosed(context, userId, stripeConfig);
        break;
      default:
        console.log(`ℹ️ Unhandled dispute event type: ${eventType}`);
    }

    console.log(`✅ [STEP 4] Dispute event handled for type: ${eventType}`);

    // STEP 5: Send notifications
    await sendDisputeNotification(context, userId, eventType);
    console.log(`✅ [STEP 5] Dispute notification sent`);

    console.log(`🎉 [SUCCESS] ===== DISPUTE EVENT HANDLER COMPLETED =====`);

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Dispute event handler failed:`, {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      eventType,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Don't throw - we want webhook to succeed even if dispute handling fails
  }
}

/**
 * Submit evidence for a dispute
 */
export async function submitDisputeEvidence(
  disputeId: string,
  evidence: DisputeEvidence,
  stripeConfig: any,
  userId: string
): Promise<DisputeResponse> {
  console.log(`📋 [EVIDENCE] ===== STARTING EVIDENCE SUBMISSION =====`);
  console.log(`📋 [EVIDENCE] Dispute ID: ${disputeId}`);
  console.log(`📋 [EVIDENCE] User ID: ${userId}`);

  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // STEP 1: Validate dispute ownership
    const dispute = await stripe.disputes.retrieve(disputeId);
    const isOwner = await validateDisputeOwnership(dispute, userId, stripeConfig);
    
    if (!isOwner) {
      throw new Error('Dispute does not belong to the authenticated user');
    }

    console.log(`✅ [STEP 1] Dispute ownership validated`);

    // STEP 2: Check if evidence can still be submitted
    const canSubmitEvidence = dispute.status === 'warning_needs_response' || 
                             dispute.status === 'needs_response';
    
    if (!canSubmitEvidence) {
      throw new Error(`Cannot submit evidence for dispute in status: ${dispute.status}`);
    }

    console.log(`✅ [STEP 2] Evidence submission eligibility confirmed`);

    // STEP 3: Submit evidence to Stripe
    const updatedDispute = await stripe.disputes.update(disputeId, {
      evidence: evidence,
      metadata: {
        submitted_by_user: userId,
        submission_date: new Date().toISOString()
      }
    });

    console.log(`✅ [STEP 3] Evidence submitted to Stripe:`, {
      disputeId: updatedDispute.id,
      status: updatedDispute.status,
      evidenceSubmissionCount: (updatedDispute.evidence as any).submission_count
    });

    // STEP 4: Record evidence submission
    await recordEvidenceSubmission(disputeId, evidence, userId);
    console.log(`✅ [STEP 4] Evidence submission recorded`);

    // STEP 5: Send confirmation notification
    await sendEvidenceSubmissionNotification(disputeId, userId);
    console.log(`✅ [STEP 5] Evidence submission notification sent`);

    const response: DisputeResponse = {
      success: true,
      disputeId: updatedDispute.id,
      status: updatedDispute.status,
      evidenceSubmitted: true
    };

    console.log(`🎉 [SUCCESS] ===== EVIDENCE SUBMISSION COMPLETED =====`);
    return response;

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Evidence submission failed:`, {
      disputeId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      disputeId,
      status: 'unknown',
      evidenceSubmitted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract dispute context from Stripe dispute object
 */
function extractDisputeContext(dispute: Stripe.Dispute): DisputeContext {
  return {
    disputeId: dispute.id,
    chargeId: dispute.charge as string,
    amount: dispute.amount,
    currency: dispute.currency,
    reason: dispute.reason,
    status: dispute.status,
    evidenceDueBy: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : new Date(),
    created: new Date(dispute.created * 1000)
  };
}

/**
 * Find user ID from charge ID
 */
async function findUserFromCharge(chargeId: string, stripeConfig: any): Promise<string | null> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);
    const charge = await stripe.charges.retrieve(chargeId);
    
    if (!charge.customer) {
      console.warn(`⚠️ Charge ${chargeId} has no customer`);
      return null;
    }

    const { data: customer } = await supabaseAdminClient
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', charge.customer as string)
      .single();

    return customer?.id || null;
  } catch (error) {
    console.error(`❌ Failed to find user from charge:`, error);
    return null;
  }
}

/**
 * Record dispute in database
 */
async function recordDispute(
  context: DisputeContext,
  userId: string,
  eventType: string
): Promise<void> {
  try {
    await supabaseAdminClient
      .from('billing_history')
      .upsert({
        id: `dispute_${context.disputeId}`,
        user_id: userId,
        amount: -context.amount, // Negative amount for disputes
        currency: context.currency,
        status: 'dispute_created',
        description: `Dispute: ${context.reason} (${context.status})`,
        stripe_invoice_id: null,
        created_at: context.created.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    // Also record in disputes table for detailed tracking
    await supabaseAdminClient
      .from('payment_disputes')
      .upsert({
        id: context.disputeId,
        user_id: userId,
        charge_id: context.chargeId,
        amount: context.amount,
        currency: context.currency,
        reason: context.reason,
        status: context.status,
        evidence_due_by: context.evidenceDueBy.toISOString(),
        created_at: context.created.toISOString(),
        updated_at: new Date().toISOString(),
        last_event_type: eventType
      }, {
        onConflict: 'id'
      });

    console.log(`📝 Dispute recorded for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to record dispute:`, error);
    // Don't throw - this is non-critical for webhook processing
  }
}

/**
 * Handle dispute created event
 */
async function handleDisputeCreated(
  context: DisputeContext,
  userId: string,
  stripeConfig: any
): Promise<void> {
  try {
    console.log(`🚨 [DISPUTE_CREATED] Processing new dispute: ${context.disputeId}`);

    // STEP 1: Pause related subscriptions to prevent further charges
    await pauseRelatedSubscriptions(userId, context.chargeId, stripeConfig);
    console.log(`✅ Related subscriptions paused for dispute`);

    // STEP 2: Generate automatic evidence if possible
    const autoEvidence = await generateAutomaticEvidence(context, userId);
    if (autoEvidence) {
      await submitDisputeEvidence(context.disputeId, autoEvidence, stripeConfig, userId);
      console.log(`✅ Automatic evidence submitted`);
    }

    // STEP 3: Create admin alert for manual review
    await createDisputeAlert(context, userId);
    console.log(`✅ Admin alert created for dispute review`);

  } catch (error) {
    console.error(`❌ Failed to handle dispute created:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Handle dispute updated event
 */
async function handleDisputeUpdated(
  context: DisputeContext,
  userId: string,
  stripeConfig: any
): Promise<void> {
  try {
    console.log(`🔄 [DISPUTE_UPDATED] Processing dispute update: ${context.disputeId} -> ${context.status}`);

    // Update dispute status in database
    await supabaseAdminClient
      .from('payment_disputes')
      .update({
        status: context.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.disputeId);

    console.log(`✅ Dispute status updated in database`);

  } catch (error) {
    console.error(`❌ Failed to handle dispute updated:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Handle dispute closed event
 */
async function handleDisputeClosed(
  context: DisputeContext,
  userId: string,
  stripeConfig: any
): Promise<void> {
  try {
    console.log(`🏁 [DISPUTE_CLOSED] Processing dispute closure: ${context.disputeId} -> ${context.status}`);

    // STEP 1: Update dispute status
    await supabaseAdminClient
      .from('payment_disputes')
      .update({
        status: context.status,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', context.disputeId);

    // STEP 2: Handle outcome-specific actions
    if (context.status === 'won') {
      await handleDisputeWon(context, userId, stripeConfig);
    } else if (context.status === 'lost') {
      await handleDisputeLost(context, userId, stripeConfig);
    }

    console.log(`✅ Dispute closure handled for status: ${context.status}`);

  } catch (error) {
    console.error(`❌ Failed to handle dispute closed:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Pause subscriptions related to a disputed charge
 */
async function pauseRelatedSubscriptions(
  userId: string,
  chargeId: string,
  stripeConfig: any
): Promise<void> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // Find active subscriptions for the user
    const { data: subscriptions } = await supabaseAdminClient
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing']);

    // Pause subscriptions to prevent further charges during dispute
    for (const subscription of subscriptions || []) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          pause_collection: {
            behavior: 'mark_uncollectible'
          },
          metadata: {
            paused_reason: 'dispute_created',
            dispute_charge_id: chargeId,
            paused_at: new Date().toISOString()
          }
        });

        console.log(`⏸️ Subscription ${subscription.stripe_subscription_id} paused due to dispute`);
      } catch (error) {
        console.error(`❌ Failed to pause subscription ${subscription.stripe_subscription_id}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to pause related subscriptions:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Generate automatic evidence based on available data
 */
async function generateAutomaticEvidence(
  context: DisputeContext,
  userId: string
): Promise<DisputeEvidence | null> {
  try {
    // Get user's subscription and usage data
    const { data: user } = await supabaseAdminClient
      .from('users')
      .select('email, full_name, created_at')
      .eq('id', userId)
      .single();

    if (!user) {
      return null;
    }

    // Get subscription history
    const { data: subscriptions } = await supabaseAdminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Build evidence text
    let evidenceText = `Customer Information:\n`;
    evidenceText += `- Email: ${user.email}\n`;
    evidenceText += `- Account created: ${new Date(user.created_at).toLocaleDateString()}\n`;
    evidenceText += `- Active customer since: ${new Date(user.created_at).toLocaleDateString()}\n\n`;

    if (subscriptions && subscriptions.length > 0) {
      evidenceText += `Subscription History:\n`;
      subscriptions.forEach((sub, index) => {
        evidenceText += `- Subscription ${index + 1}: ${sub.status} (${new Date(sub.created_at).toLocaleDateString()})\n`;
      });
      evidenceText += `\n`;
    }

    evidenceText += `Service Usage:\n`;
    evidenceText += `- Customer has been actively using our LawnQuote software service\n`;
    evidenceText += `- Service provides quote management and PDF generation capabilities\n`;
    evidenceText += `- Digital service delivered immediately upon subscription activation\n\n`;

    evidenceText += `Dispute Response:\n`;
    evidenceText += `- This charge is for legitimate software subscription services\n`;
    evidenceText += `- Customer received full access to our platform features\n`;
    evidenceText += `- Service was delivered as described in our terms of service\n`;

    return {
      uncategorizedText: evidenceText,
      customerCommunication: `Customer email: ${user.email}`,
      refundPolicy: 'Our refund policy allows for refunds within 30 days of purchase for unused services.'
    };

  } catch (error) {
    console.error(`❌ Failed to generate automatic evidence:`, error);
    return null;
  }
}

/**
 * Create admin alert for dispute review
 */
async function createDisputeAlert(context: DisputeContext, userId: string): Promise<void> {
  try {
    await supabaseAdminClient
      .from('admin_alerts')
      .insert({
        type: 'dispute_created',
        title: `New Payment Dispute: ${context.disputeId}`,
        message: `A payment dispute has been created for $${context.amount / 100} ${context.currency.toUpperCase()}. Reason: ${context.reason}. Evidence due by: ${context.evidenceDueBy.toLocaleDateString()}.`,
        severity: 'high',
        metadata: {
          dispute_id: context.disputeId,
          charge_id: context.chargeId,
          user_id: userId,
          amount: context.amount,
          currency: context.currency,
          reason: context.reason,
          evidence_due_by: context.evidenceDueBy.toISOString()
        },
        created_at: new Date().toISOString()
      });

    console.log(`🚨 Admin alert created for dispute ${context.disputeId}`);
  } catch (error) {
    console.error(`❌ Failed to create dispute alert:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Handle dispute won outcome
 */
async function handleDisputeWon(
  context: DisputeContext,
  userId: string,
  stripeConfig: any
): Promise<void> {
  try {
    console.log(`🎉 [DISPUTE_WON] Handling dispute victory: ${context.disputeId}`);

    // Resume paused subscriptions
    await resumePausedSubscriptions(userId, context.chargeId, stripeConfig);
    console.log(`✅ Paused subscriptions resumed`);

    // Record victory in billing history
    await supabaseAdminClient
      .from('billing_history')
      .insert({
        id: `dispute_won_${context.disputeId}`,
        user_id: userId,
        amount: context.amount, // Positive amount - we kept the money
        currency: context.currency,
        status: 'dispute_won',
        description: `Dispute won: ${context.reason}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log(`📝 Dispute victory recorded`);

  } catch (error) {
    console.error(`❌ Failed to handle dispute won:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Handle dispute lost outcome
 */
async function handleDisputeLost(
  context: DisputeContext,
  userId: string,
  stripeConfig: any
): Promise<void> {
  try {
    console.log(`😞 [DISPUTE_LOST] Handling dispute loss: ${context.disputeId}`);

    // Cancel subscriptions since we lost the dispute
    await cancelSubscriptionsAfterDisputeLoss(userId, stripeConfig);
    console.log(`✅ Subscriptions cancelled after dispute loss`);

    // Record loss in billing history
    await supabaseAdminClient
      .from('billing_history')
      .insert({
        id: `dispute_lost_${context.disputeId}`,
        user_id: userId,
        amount: -context.amount, // Negative amount - we lost the money
        currency: context.currency,
        status: 'dispute_lost',
        description: `Dispute lost: ${context.reason}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log(`📝 Dispute loss recorded`);

  } catch (error) {
    console.error(`❌ Failed to handle dispute lost:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Resume paused subscriptions after dispute resolution
 */
async function resumePausedSubscriptions(
  userId: string,
  chargeId: string,
  stripeConfig: any
): Promise<void> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // Find subscriptions paused due to this dispute
    const { data: subscriptions } = await supabaseAdminClient
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId);

    for (const subscription of subscriptions || []) {
      try {
        // Get subscription details to check if it was paused for this dispute
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        
        if (stripeSubscription.pause_collection && 
            stripeSubscription.metadata?.dispute_charge_id === chargeId) {
          
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            pause_collection: null,
            metadata: {
              ...stripeSubscription.metadata,
              resumed_reason: 'dispute_won',
              resumed_at: new Date().toISOString()
            }
          });

          console.log(`▶️ Subscription ${subscription.stripe_subscription_id} resumed after dispute victory`);
        }
      } catch (error) {
        console.error(`❌ Failed to resume subscription ${subscription.stripe_subscription_id}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to resume paused subscriptions:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Cancel subscriptions after losing a dispute
 */
async function cancelSubscriptionsAfterDisputeLoss(
  userId: string,
  stripeConfig: any
): Promise<void> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // Find active subscriptions for the user
    const { data: subscriptions } = await supabaseAdminClient
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due']);

    for (const subscription of subscriptions || []) {
      try {
        // Update subscription with metadata first, then cancel
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          metadata: {
            cancellation_reason: 'dispute_lost',
            cancelled_at: new Date().toISOString()
          }
        });
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

        console.log(`❌ Subscription ${subscription.stripe_subscription_id} cancelled after dispute loss`);
      } catch (error) {
        console.error(`❌ Failed to cancel subscription ${subscription.stripe_subscription_id}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to cancel subscriptions after dispute loss:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Validate that a dispute belongs to the specified user
 */
async function validateDisputeOwnership(
  dispute: Stripe.Dispute,
  userId: string,
  stripeConfig: any
): Promise<boolean> {
  try {
    const stripe = createStripeAdminClient(stripeConfig);
    const charge = await stripe.charges.retrieve(dispute.charge as string);
    
    if (!charge.customer) {
      return false;
    }

    const { data: customer } = await supabaseAdminClient
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', charge.customer as string)
      .single();

    return customer?.id === userId;
  } catch (error) {
    console.error(`❌ Dispute ownership validation failed:`, error);
    return false;
  }
}

/**
 * Record evidence submission in database
 */
async function recordEvidenceSubmission(
  disputeId: string,
  evidence: DisputeEvidence,
  userId: string
): Promise<void> {
  try {
    await supabaseAdminClient
      .from('dispute_evidence')
      .insert({
        dispute_id: disputeId,
        user_id: userId,
        evidence_data: evidence,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    console.log(`📝 Evidence submission recorded for dispute ${disputeId}`);
  } catch (error) {
    console.error(`❌ Failed to record evidence submission:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Send dispute-related notifications
 */
async function sendDisputeNotification(
  context: DisputeContext,
  userId: string,
  eventType: string
): Promise<void> {
  try {
    const { data: user } = await supabaseAdminClient
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      console.warn(`⚠️ User email not found for dispute notification: ${userId}`);
      return;
    }

    let title: string;
    let message: string;

    switch (eventType) {
      case 'charge.dispute.created':
        title = 'Payment Dispute Created';
        message = `A payment dispute has been created for your charge of ${context.amount / 100} ${context.currency.toUpperCase()}. We're working to resolve this automatically.`;
        break;
      case 'charge.dispute.updated':
        title = 'Payment Dispute Updated';
        message = `Your payment dispute status has been updated to: ${context.status}`;
        break;
      case 'charge.dispute.closed':
        title = context.status === 'won' ? 'Payment Dispute Resolved' : 'Payment Dispute Closed';
        message = context.status === 'won' 
          ? `Good news! We successfully resolved your payment dispute.`
          : `Your payment dispute has been closed with status: ${context.status}`;
        break;
      default:
        return; // Don't send notification for unknown event types
    }

    await supabaseAdminClient
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'dispute_update',
        title,
        message,
        metadata: {
          dispute_id: context.disputeId,
          charge_id: context.chargeId,
          amount: context.amount,
          currency: context.currency,
          reason: context.reason,
          status: context.status,
          event_type: eventType
        },
        created_at: new Date().toISOString()
      });

    console.log(`📧 Dispute notification queued for ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send dispute notification:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Send evidence submission confirmation
 */
async function sendEvidenceSubmissionNotification(
  disputeId: string,
  userId: string
): Promise<void> {
  try {
    const { data: user } = await supabaseAdminClient
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      console.warn(`⚠️ User email not found for evidence notification: ${userId}`);
      return;
    }

    await supabaseAdminClient
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'evidence_submitted',
        title: 'Dispute Evidence Submitted',
        message: `Your evidence for dispute ${disputeId} has been successfully submitted. We'll notify you of any updates.`,
        metadata: {
          dispute_id: disputeId,
          submission_date: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    console.log(`📧 Evidence submission notification queued for ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send evidence submission notification:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get dispute history for a user
 */
export async function getDisputeHistory(userId: string): Promise<Array<{
  disputeId: string;
  chargeId: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  created: Date;
  evidenceDueBy?: Date;
  closedAt?: Date;
}>> {
  try {
    const { data: disputes } = await supabaseAdminClient
      .from('payment_disputes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (disputes || []).map(dispute => ({
      disputeId: dispute.id,
      chargeId: dispute.charge_id,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      created: new Date(dispute.created_at),
      evidenceDueBy: dispute.evidence_due_by ? new Date(dispute.evidence_due_by) : undefined,
      closedAt: dispute.closed_at ? new Date(dispute.closed_at) : undefined
    }));
  } catch (error) {
    console.error(`❌ Failed to get dispute history:`, error);
    return [];
  }
}
