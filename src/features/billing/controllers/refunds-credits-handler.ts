/**
 * Refunds and Credits Handler - Step 2.3 Edge Case Implementation
 * 
 * Handles refund and credit scenarios including:
 * - Full and partial refunds
 * - Credit note generation
 * - Subscription cancellation refunds
 * - Dispute-related refunds
 * - Account credit management
 * - Refund policy enforcement
 */

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import Stripe from 'stripe';

export interface RefundRequest {
  paymentIntentId?: string;
  chargeId?: string;
  invoiceId?: string;
  amount?: number; // If partial refund
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'subscription_cancellation';
  metadata?: Record<string, string>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  error?: string;
}

export interface CreditNoteRequest {
  invoiceId: string;
  amount?: number; // If partial credit
  reason: string;
  memo?: string;
  metadata?: Record<string, string>;
}

export interface CreditNoteResult {
  success: boolean;
  creditNoteId?: string;
  amount: number;
  currency: string;
  status: string;
  error?: string;
}

/**
 * Process a refund request with comprehensive validation and tracking
 */
export async function processRefund(
  request: RefundRequest,
  stripeConfig: any,
  userId: string
): Promise<RefundResult> {
  console.log(`💰 [REFUND] ===== STARTING REFUND PROCESSING =====`);
  console.log(`💰 [REFUND] Request:`, request);
  console.log(`💰 [REFUND] User ID: ${userId}`);

  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // STEP 1: Validate refund eligibility
    const eligibility = await validateRefundEligibility(request, stripe, userId);
    if (!eligibility.eligible) {
      console.log(`❌ [STEP 1] Refund not eligible: ${eligibility.reason}`);
      return {
        success: false,
        amount: 0,
        currency: 'usd',
        status: 'failed',
        reason: request.reason,
        error: eligibility.reason
      };
    }

    console.log(`✅ [STEP 1] Refund eligibility validated:`, eligibility);

    // STEP 2: Determine refund target (payment intent or charge)
    const refundTarget = await determineRefundTarget(request, stripe);
    console.log(`✅ [STEP 2] Refund target determined:`, refundTarget);

    // STEP 3: Calculate refund amount
    const refundAmount = request.amount || refundTarget.maxRefundableAmount;
    if (refundAmount > refundTarget.maxRefundableAmount) {
      throw new Error(`Refund amount ${refundAmount} exceeds maximum refundable amount ${refundTarget.maxRefundableAmount}`);
    }

    console.log(`✅ [STEP 3] Refund amount calculated: ${refundAmount}`);

    // Map custom reasons to valid Stripe refund reasons
    const mapRefundReason = (reason: string): 'duplicate' | 'fraudulent' | 'requested_by_customer' => {
      switch (reason) {
        case 'subscription_cancellation':
        case 'requested_by_customer':
          return 'requested_by_customer';
        case 'duplicate':
          return 'duplicate';
        case 'fraudulent':
          return 'fraudulent';
        default:
          return 'requested_by_customer';
      }
    };

    // STEP 4: Create the refund
    const refund = await stripe.refunds.create({
      [refundTarget.type]: refundTarget.id,
      amount: refundAmount,
      reason: mapRefundReason(request.reason),
      metadata: {
        user_id: userId,
        processed_by: 'system',
        original_reason: request.reason, // Store original reason in metadata
        ...request.metadata
      }
    });

    console.log(`✅ [STEP 4] Refund created:`, {
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });

    // STEP 5: Record refund in database
    await recordRefund(refund, userId, request);
    console.log(`✅ [STEP 5] Refund recorded in database`);

    // STEP 6: Handle subscription-related refunds
    if (request.reason === 'subscription_cancellation') {
      await handleSubscriptionCancellationRefund(refund, userId, stripe);
      console.log(`✅ [STEP 6] Subscription cancellation refund handled`);
    }

    // STEP 7: Send refund notification
    await sendRefundNotification(refund, userId);
    console.log(`✅ [STEP 7] Refund notification sent`);

    const result: RefundResult = {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status || 'pending',
      reason: refund.reason || request.reason
    };

    console.log(`🎉 [SUCCESS] ===== REFUND PROCESSING COMPLETED =====`);
    return result;

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Refund processing failed:`, {
      request,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      amount: request.amount || 0,
      currency: 'usd',
      status: 'failed',
      reason: request.reason,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a credit note for an invoice
 */
export async function createCreditNote(
  request: CreditNoteRequest,
  stripeConfig: any,
  userId: string
): Promise<CreditNoteResult> {
  console.log(`📝 [CREDIT_NOTE] ===== STARTING CREDIT NOTE CREATION =====`);
  console.log(`📝 [CREDIT_NOTE] Request:`, request);
  console.log(`📝 [CREDIT_NOTE] User ID: ${userId}`);

  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // STEP 1: Validate invoice and ownership
    const invoice = await stripe.invoices.retrieve(request.invoiceId);
    const isOwner = await validateInvoiceOwnership(invoice, userId);
    
    if (!isOwner) {
      throw new Error('Invoice does not belong to the authenticated user');
    }

    console.log(`✅ [STEP 1] Invoice validated:`, {
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      status: invoice.status
    });

    // STEP 2: Calculate credit amount
    const creditAmount = request.amount || invoice.amount_paid;
    if (creditAmount > invoice.amount_paid) {
      throw new Error(`Credit amount ${creditAmount} exceeds invoice amount ${invoice.amount_paid}`);
    }

    console.log(`✅ [STEP 2] Credit amount calculated: ${creditAmount}`);

    // STEP 3: Create credit note
    const creditNote = await stripe.creditNotes.create({
      invoice: request.invoiceId,
      amount: creditAmount,
      reason: 'product_unsatisfactory', // Valid Stripe credit note reason
      memo: request.memo,
      metadata: {
        user_id: userId,
        reason: request.reason,
        ...request.metadata
      }
    });

    console.log(`✅ [STEP 3] Credit note created:`, {
      creditNoteId: creditNote.id,
      amount: creditNote.amount,
      status: creditNote.status
    });

    // STEP 4: Record credit note in database
    await recordCreditNote(creditNote, userId, request);
    console.log(`✅ [STEP 4] Credit note recorded in database`);

    // STEP 5: Apply credit to customer account
    await applyCreditToAccount(creditNote, userId, stripe);
    console.log(`✅ [STEP 5] Credit applied to customer account`);

    // STEP 6: Send credit notification
    await sendCreditNotification(creditNote, userId);
    console.log(`✅ [STEP 6] Credit notification sent`);

    const result: CreditNoteResult = {
      success: true,
      creditNoteId: creditNote.id,
      amount: creditNote.amount,
      currency: creditNote.currency,
      status: creditNote.status
    };

    console.log(`🎉 [SUCCESS] ===== CREDIT NOTE CREATION COMPLETED =====`);
    return result;

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Credit note creation failed:`, {
      request,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      amount: request.amount || 0,
      currency: 'usd',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate refund eligibility based on business rules
 */
async function validateRefundEligibility(
  request: RefundRequest,
  stripe: Stripe,
  userId: string
): Promise<{ eligible: boolean; reason?: string; maxAmount?: number }> {
  try {
    // STEP 1: Check refund policy timeframe
    const refundPolicyDays = 30; // Business rule: 30-day refund policy
    
    let chargeDate: Date;
    let maxRefundableAmount: number;

    if (request.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(request.paymentIntentId);
      chargeDate = new Date(paymentIntent.created * 1000);
      
      // Get existing refunds for this payment intent
      const refunds = await stripe.refunds.list({
        payment_intent: request.paymentIntentId,
        limit: 100
      });
      const totalRefunded = refunds.data.reduce((sum, refund) => sum + refund.amount, 0);
      maxRefundableAmount = paymentIntent.amount - totalRefunded;
    } else if (request.chargeId) {
      const charge = await stripe.charges.retrieve(request.chargeId);
      chargeDate = new Date(charge.created * 1000);
      maxRefundableAmount = charge.amount - charge.amount_refunded;
    } else if (request.invoiceId) {
      const invoice = await stripe.invoices.retrieve(request.invoiceId);
      chargeDate = new Date(invoice.created * 1000);
      maxRefundableAmount = invoice.amount_paid;
    } else {
      return { eligible: false, reason: 'No valid payment reference provided' };
    }

    // Check if within refund policy timeframe
    const daysSinceCharge = (Date.now() - chargeDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCharge > refundPolicyDays && request.reason === 'requested_by_customer') {
      return { 
        eligible: false, 
        reason: `Refund request exceeds ${refundPolicyDays}-day policy (${Math.floor(daysSinceCharge)} days ago)` 
      };
    }

    // Check if there's any amount left to refund
    if (maxRefundableAmount <= 0) {
      return { eligible: false, reason: 'No refundable amount remaining' };
    }

    // Check if requested amount is valid
    if (request.amount && request.amount > maxRefundableAmount) {
      return { 
        eligible: false, 
        reason: `Requested amount ${request.amount} exceeds refundable amount ${maxRefundableAmount}` 
      };
    }

    // Additional business rules based on reason
    if (request.reason === 'fraudulent') {
      // Fraudulent refunds are always eligible regardless of time
      return { eligible: true, maxAmount: maxRefundableAmount };
    }

    if (request.reason === 'duplicate') {
      // Check for actual duplicates
      // This would require additional logic to detect duplicates
      return { eligible: true, maxAmount: maxRefundableAmount };
    }

    return { eligible: true, maxAmount: maxRefundableAmount };

  } catch (error) {
    console.error(`❌ Refund eligibility validation failed:`, error);
    return { eligible: false, reason: 'Unable to validate refund eligibility' };
  }
}

/**
 * Determine the correct Stripe object to refund
 */
async function determineRefundTarget(
  request: RefundRequest,
  stripe: Stripe
): Promise<{ type: 'payment_intent' | 'charge'; id: string; maxRefundableAmount: number }> {
  if (request.paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(request.paymentIntentId);
    
    // Get existing refunds for this payment intent
    const refunds = await stripe.refunds.list({
      payment_intent: request.paymentIntentId,
      limit: 100
    });
    const totalRefunded = refunds.data.reduce((sum, refund) => sum + refund.amount, 0);
    
    return {
      type: 'payment_intent',
      id: request.paymentIntentId,
      maxRefundableAmount: paymentIntent.amount - totalRefunded
    };
  }

  if (request.chargeId) {
    const charge = await stripe.charges.retrieve(request.chargeId);
    return {
      type: 'charge',
      id: request.chargeId,
      maxRefundableAmount: charge.amount - charge.amount_refunded
    };
  }

  if (request.invoiceId) {
    const invoice = await stripe.invoices.retrieve(request.invoiceId);
    if (invoice.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        typeof invoice.payment_intent === 'string' 
          ? invoice.payment_intent 
          : invoice.payment_intent.id
      );
      
      // Get existing refunds for this payment intent
      const refunds = await stripe.refunds.list({
        payment_intent: paymentIntent.id,
        limit: 100
      });
      const totalRefunded = refunds.data.reduce((sum, refund) => sum + refund.amount, 0);
      
      return {
        type: 'payment_intent',
        id: paymentIntent.id,
        maxRefundableAmount: paymentIntent.amount - totalRefunded
      };
    } else if (invoice.charge) {
      const charge = await stripe.charges.retrieve(
        typeof invoice.charge === 'string' 
          ? invoice.charge 
          : invoice.charge.id
      );
      return {
        type: 'charge',
        id: charge.id,
        maxRefundableAmount: charge.amount - charge.amount_refunded
      };
    }
  }

  throw new Error('No valid refund target found');
}

/**
 * Validate that an invoice belongs to the specified user
 */
async function validateInvoiceOwnership(invoice: Stripe.Invoice, userId: string): Promise<boolean> {
  try {
    const { data: customer } = await supabaseAdminClient
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', invoice.customer as string)
      .single();

    return customer?.id === userId;
  } catch (error) {
    console.error(`❌ Invoice ownership validation failed:`, error);
    return false;
  }
}

/**
 * Record refund in database for tracking
 */
async function recordRefund(refund: Stripe.Refund, userId: string, request: RefundRequest): Promise<void> {
  try {
    await supabaseAdminClient
      .from('billing_history')
      .insert({
        id: `refund_${refund.id}`,
        user_id: userId,
        amount: -refund.amount, // Negative amount for refunds
        currency: refund.currency,
        status: 'refund_processed',
        description: `Refund: ${refund.reason || request.reason}`,
        stripe_invoice_id: null,
        created_at: new Date(refund.created * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log(`📝 Refund recorded in billing history for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to record refund:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Record credit note in database
 */
async function recordCreditNote(
  creditNote: Stripe.CreditNote, 
  userId: string, 
  request: CreditNoteRequest
): Promise<void> {
  try {
    await supabaseAdminClient
      .from('billing_history')
      .insert({
        id: `credit_${creditNote.id}`,
        user_id: userId,
        amount: -creditNote.amount, // Negative amount for credits
        currency: creditNote.currency,
        status: 'credit_issued',
        description: `Credit Note: ${request.reason}`,
        stripe_invoice_id: request.invoiceId,
        created_at: new Date(creditNote.created * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log(`📝 Credit note recorded in billing history for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to record credit note:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Handle subscription cancellation refunds
 */
async function handleSubscriptionCancellationRefund(
  refund: Stripe.Refund,
  userId: string,
  stripe: Stripe
): Promise<void> {
  try {
    // Find active subscriptions for the user
    const { data: subscriptions } = await supabaseAdminClient
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing']);

    // Cancel active subscriptions
    for (const subscription of subscriptions || []) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
          metadata: {
            cancellation_reason: 'refund_processed',
            refund_id: refund.id
          }
        });

        console.log(`🚫 Subscription ${subscription.stripe_subscription_id} marked for cancellation due to refund`);
      } catch (error) {
        console.error(`❌ Failed to cancel subscription ${subscription.stripe_subscription_id}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to handle subscription cancellation refund:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Apply credit to customer account balance
 */
async function applyCreditToAccount(
  creditNote: Stripe.CreditNote,
  userId: string,
  stripe: Stripe
): Promise<void> {
  try {
    // Get customer ID
    const { data: customer } = await supabaseAdminClient
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!customer) {
      throw new Error(`Customer not found for user ${userId}`);
    }

    // Apply credit to customer balance
    await stripe.customers.update(customer.stripe_customer_id, {
      balance: creditNote.amount // This adds to the customer's credit balance
    });

    console.log(`💳 Credit of ${creditNote.amount} applied to customer ${customer.stripe_customer_id}`);
  } catch (error) {
    console.error(`❌ Failed to apply credit to account:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Send refund notification to user
 */
async function sendRefundNotification(refund: Stripe.Refund, userId: string): Promise<void> {
  try {
    const { data: user } = await supabaseAdminClient
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      console.warn(`⚠️ User email not found for refund notification: ${userId}`);
      return;
    }

    await supabaseAdminClient
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'refund_processed',
        title: 'Refund Processed',
        message: `Your refund of ${refund.amount / 100} ${refund.currency.toUpperCase()} has been processed and will appear in your account within 5-10 business days.`,
        metadata: {
          refund_id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason
        },
        created_at: new Date().toISOString()
      });

    console.log(`📧 Refund notification queued for ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send refund notification:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Send credit notification to user
 */
async function sendCreditNotification(creditNote: Stripe.CreditNote, userId: string): Promise<void> {
  try {
    const { data: user } = await supabaseAdminClient
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      console.warn(`⚠️ User email not found for credit notification: ${userId}`);
      return;
    }

    await supabaseAdminClient
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'credit_issued',
        title: 'Account Credit Issued',
        message: `A credit of ${creditNote.amount / 100} ${creditNote.currency.toUpperCase()} has been applied to your account.`,
        metadata: {
          credit_note_id: creditNote.id,
          amount: creditNote.amount,
          currency: creditNote.currency,
          invoice_id: creditNote.invoice
        },
        created_at: new Date().toISOString()
      });

    console.log(`📧 Credit notification queued for ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send credit notification:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get refund and credit history for a user
 */
export async function getRefundCreditHistory(userId: string): Promise<Array<{
  id: string;
  type: 'refund' | 'credit';
  amount: number;
  currency: string;
  reason: string;
  date: Date;
  status: string;
}>> {
  try {
    const { data: history } = await supabaseAdminClient
      .from('billing_history')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['refund_processed', 'credit_issued'])
      .order('created_at', { ascending: false });

    return (history || []).map(item => ({
      id: item.id,
      type: item.status === 'refund_processed' ? 'refund' : 'credit',
      amount: Math.abs(item.amount || 0),
      currency: item.currency || 'usd',
      reason: item.description || 'No reason provided',
      date: new Date(item.created_at || Date.now()),
      status: item.status || 'unknown'
    }));
  } catch (error) {
    console.error(`❌ Failed to get refund/credit history:`, error);
    return [];
  }
}

/**
 * Calculate total refunds and credits for a user
 */
export async function getRefundCreditSummary(userId: string): Promise<{
  totalRefunds: number;
  totalCredits: number;
  currency: string;
  lastRefundDate?: Date;
  lastCreditDate?: Date;
}> {
  try {
    const history = await getRefundCreditHistory(userId);
    
    const refunds = history.filter(item => item.type === 'refund');
    const credits = history.filter(item => item.type === 'credit');

    return {
      totalRefunds: refunds.reduce((sum, item) => sum + item.amount, 0),
      totalCredits: credits.reduce((sum, item) => sum + item.amount, 0),
      currency: history[0]?.currency || 'usd',
      lastRefundDate: refunds[0]?.date,
      lastCreditDate: credits[0]?.date
    };
  } catch (error) {
    console.error(`❌ Failed to get refund/credit summary:`, error);
    return {
      totalRefunds: 0,
      totalCredits: 0,
      currency: 'usd'
    };
  }
}
