/**
 * B2B2C Payment Webhook Handlers - S2.1
 * 
 * This module contains webhook handlers specifically for B2B2C payment events
 * where homeowners pay invoices for lawn care services.
 */

import type Stripe from 'stripe';

import { updateQuotePaymentStatus } from '@/features/quotes/actions/homeowner-invoice-actions';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// =====================================================
// B2B2C INVOICE PAYMENT HANDLERS
// =====================================================

/**
 * Handles successful invoice payments from homeowners
 * Updates quote status and payment tracking
 */
export async function handleHomeownerInvoicePaymentSucceeded(event: Stripe.Event) {
  try {
    const invoice = event.data.object as Stripe.Invoice;
    
    console.log(`🏠 [B2B2C] Processing homeowner invoice payment succeeded:`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_paid,
      status: invoice.status
    });

    // Check if this is a B2B2C invoice (has quote_id in metadata)
    const quoteId = invoice.metadata?.quote_id;
    if (!quoteId) {
      console.log(`ℹ️ [B2B2C] Invoice ${invoice.id} is not a B2B2C invoice (no quote_id), skipping`);
      return;
    }

    // Update quote payment status
    const result = await updateQuotePaymentStatus(
      quoteId,
      'paid',
      new Date(invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now()).toISOString()
    );

    if (!result.success) {
      console.error(`❌ [B2B2C] Failed to update quote payment status:`, result.error);
      throw new Error(`Failed to update quote payment status: ${result.error}`);
    }

    // Update homeowner payment tracking
    const supabase = await createSupabaseServerClient();
    
    const { error: trackingError } = await supabase
      .from('homeowner_payments')
      .update({
        payment_status: 'succeeded',
        payment_method_type: invoice.payment_intent ? 
          (typeof invoice.payment_intent === 'string' ? 
            'unknown' : 
            (typeof invoice.payment_intent.payment_method === 'string' ? 
              'unknown' : 
              invoice.payment_intent.payment_method?.type || 'unknown'
            )
          ) : 
          'unknown',
        payment_completed_at: new Date().toISOString(),
        stripe_payment_intent_id: typeof invoice.payment_intent === 'string' ? 
          invoice.payment_intent : 
          invoice.payment_intent?.id,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_invoice_id', invoice.id);

    if (trackingError) {
      console.error(`⚠️ [B2B2C] Failed to update payment tracking:`, trackingError);
      // Don't throw - main payment update succeeded
    }

    console.log(`✅ [B2B2C] Successfully processed homeowner payment for quote ${quoteId}`);

  } catch (error) {
    console.error(`💥 [B2B2C] Error processing homeowner invoice payment:`, error);
    throw error;
  }
}

/**
 * Handles failed invoice payments from homeowners
 * Updates quote status and sends notifications
 */
export async function handleHomeownerInvoicePaymentFailed(event: Stripe.Event) {
  try {
    const invoice = event.data.object as Stripe.Invoice;
    
    console.log(`🏠 [B2B2C] Processing homeowner invoice payment failed:`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_due,
      attemptCount: invoice.attempt_count
    });

    // Check if this is a B2B2C invoice
    const quoteId = invoice.metadata?.quote_id;
    if (!quoteId) {
      console.log(`ℹ️ [B2B2C] Invoice ${invoice.id} is not a B2B2C invoice, skipping`);
      return;
    }

    // Update quote payment status to failed if this was the final attempt
    if (invoice.attempt_count >= 4) { // Stripe default is 4 attempts
      const result = await updateQuotePaymentStatus(quoteId, 'failed');
      
      if (!result.success) {
        console.error(`❌ [B2B2C] Failed to update quote payment status:`, result.error);
      }
    }

    // Update homeowner payment tracking
    const supabase = await createSupabaseServerClient();
    
    const { error: trackingError } = await supabase
      .from('homeowner_payments')
      .update({
        payment_status: invoice.attempt_count >= 4 ? 'failed' : 'pending',
        payment_attempted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_invoice_id', invoice.id);

    if (trackingError) {
      console.error(`⚠️ [B2B2C] Failed to update payment tracking:`, trackingError);
    }

    console.log(`✅ [B2B2C] Processed homeowner payment failure for quote ${quoteId}`);

  } catch (error) {
    console.error(`💥 [B2B2C] Error processing homeowner invoice payment failure:`, error);
    throw error;
  }
}

/**
 * Handles invoice finalization (when invoice is sent to homeowner)
 * Updates quote status to 'sent'
 */
export async function handleHomeownerInvoiceFinalized(event: Stripe.Event) {
  try {
    const invoice = event.data.object as Stripe.Invoice;
    
    console.log(`🏠 [B2B2C] Processing homeowner invoice finalized:`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_due,
      dueDate: invoice.due_date
    });

    // Check if this is a B2B2C invoice
    const quoteId = invoice.metadata?.quote_id;
    if (!quoteId) {
      console.log(`ℹ️ [B2B2C] Invoice ${invoice.id} is not a B2B2C invoice, skipping`);
      return;
    }

    // Update quote status to sent if not already updated
    const supabase = await createSupabaseServerClient();
    
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('invoice_status')
      .eq('id', quoteId)
      .single();

    if (quoteError) {
      console.error(`❌ [B2B2C] Failed to get quote status:`, quoteError);
      return;
    }

    if (quote?.invoice_status === 'draft') {
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          invoice_status: 'sent',
          invoice_sent_at: new Date().toISOString(),
          payment_due_date: invoice.due_date ? 
            new Date(invoice.due_date * 1000).toISOString().split('T')[0] : 
            null,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (updateError) {
        console.error(`❌ [B2B2C] Failed to update quote status to sent:`, updateError);
      } else {
        console.log(`✅ [B2B2C] Updated quote ${quoteId} status to sent`);
      }
    }

  } catch (error) {
    console.error(`💥 [B2B2C] Error processing homeowner invoice finalized:`, error);
    throw error;
  }
}

/**
 * Handles invoice voiding (when invoice is cancelled)
 * Updates quote status to 'cancelled'
 */
export async function handleHomeownerInvoiceVoided(event: Stripe.Event) {
  try {
    const invoice = event.data.object as Stripe.Invoice;
    
    console.log(`🏠 [B2B2C] Processing homeowner invoice voided:`, {
      invoiceId: invoice.id,
      customerId: invoice.customer
    });

    // Check if this is a B2B2C invoice
    const quoteId = invoice.metadata?.quote_id;
    if (!quoteId) {
      console.log(`ℹ️ [B2B2C] Invoice ${invoice.id} is not a B2B2C invoice, skipping`);
      return;
    }

    // Update quote payment status
    const result = await updateQuotePaymentStatus(quoteId, 'cancelled');
    
    if (!result.success) {
      console.error(`❌ [B2B2C] Failed to update quote payment status:`, result.error);
      throw new Error(`Failed to update quote payment status: ${result.error}`);
    }

    // Update homeowner payment tracking
    const supabase = await createSupabaseServerClient();
    
    const { error: trackingError } = await supabase
      .from('homeowner_payments')
      .update({
        payment_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_invoice_id', invoice.id);

    if (trackingError) {
      console.error(`⚠️ [B2B2C] Failed to update payment tracking:`, trackingError);
    }

    console.log(`✅ [B2B2C] Successfully processed homeowner invoice cancellation for quote ${quoteId}`);

  } catch (error) {
    console.error(`💥 [B2B2C] Error processing homeowner invoice voided:`, error);
    throw error;
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Checks if an invoice is a B2B2C homeowner invoice
 */
export function isHomeownerInvoice(invoice: Stripe.Invoice): boolean {
  return !!(invoice.metadata?.quote_id && invoice.metadata?.customer_type === 'homeowner');
}

/**
 * Extracts homeowner information from invoice metadata
 */
export function extractHomeownerInfo(invoice: Stripe.Invoice) {
  return {
    quoteId: invoice.metadata?.quote_id,
    quoteNumber: invoice.metadata?.quote_number,
    serviceAddress: invoice.metadata?.service_address,
    companyName: invoice.metadata?.company_name,
    lawnCareCompanyId: invoice.metadata?.lawn_care_company_id
  };
}
