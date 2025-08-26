/**
 * Homeowner Invoice Actions - S2.1 B2B2C Payment System
 * 
 * This module handles the creation and management of invoices sent to homeowners
 * for lawn care services. It leverages the existing Stripe infrastructure to
 * create a seamless B2B2C payment experience.
 */

'use server';

import type Stripe from 'stripe';

import { getSession } from '@/features/account/controllers/get-session';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

interface HomeownerInvoiceData {
  quoteId: string;
  homeownerEmail: string;
  homeownerName?: string;
  paymentTerms?: number; // Days until due (default: 30)
}

interface HomeownerInvoiceResult {
  success: boolean;
  data?: {
    invoice: Stripe.Invoice;
    customer: Stripe.Customer;
    hosted_invoice_url: string;
    payment_due_date: string;
  };
  error?: string;
}

interface HomeownerPortalResult {
  success: boolean;
  data?: {
    url: string;
  };
  error?: string;
}

// =====================================================
// MAIN INVOICE CREATION FUNCTION
// =====================================================

/**
 * Creates a Stripe invoice for a homeowner and sends it via email
 * This is the core function for the B2B2C payment workflow
 */
export async function createHomeownerInvoice({
  quoteId,
  homeownerEmail,
  homeownerName,
  paymentTerms = 30
}: HomeownerInvoiceData): Promise<HomeownerInvoiceResult> {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const supabase = await createSupabaseServerClient();
    
    // Get quote details with property and client info
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        title,
        total,
        user_id,
        client_name,
        properties!inner (
          service_address,
          property_name,
          clients!inner (
            name,
            company_name
          )
        )
      `)
      .eq('id', quoteId)
      .eq('user_id', session.user.id)
      .single();

    if (quoteError || !quote) {
      return {
        success: false,
        error: 'Quote not found or access denied'
      };
    }

    // Type assertion since we know the structure from the query
    const typedQuote = quote as any;

    // Validate quote has required information
    if (!typedQuote.properties?.service_address) {
      return {
        success: false,
        error: 'Quote must have a service address to send invoice'
      };
    }

    // Get company information for branding
    const companyName = typedQuote.properties.clients.company_name || 
                       typedQuote.properties.clients.name || 
                       'Lawn Care Services';

    // Create Stripe Customer for homeowner
    const customer = await stripeAdmin.customers.create({
      email: homeownerEmail,
      name: homeownerName || `Homeowner - ${typedQuote.properties.service_address}`,
      description: `Property owner for ${typedQuote.properties.service_address}`,
      metadata: {
        quote_id: quoteId,
        created_by: 'QuoteKit',
        customer_type: 'homeowner',
        lawn_care_company: companyName,
        service_address: typedQuote.properties.service_address,
        quote_number: typedQuote.quote_number
      }
    });

    // Create invoice for the quote
    const invoice = await stripeAdmin.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: paymentTerms,
      description: `${companyName} - Lawn Care Services`,
      statement_descriptor: 'LAWN CARE SVCS',
      footer: `Service Address: ${typedQuote.properties.service_address}`,
      metadata: {
        quote_id: quoteId,
        quote_number: typedQuote.quote_number,
        lawn_care_company_id: session.user.id,
        service_address: typedQuote.properties.service_address,
        company_name: companyName
      }
    });

    // Add quote line items to invoice
    await stripeAdmin.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: Math.round(typedQuote.total * 100), // Convert to cents
      currency: 'usd',
      description: `${typedQuote.title || 'Lawn Care Services'} - Quote #${typedQuote.quote_number}`,
      metadata: {
        quote_id: quoteId,
        service_address: typedQuote.properties.service_address,
        quote_number: typedQuote.quote_number
      }
    });

    // Finalize and send invoice
    const finalizedInvoice = await stripeAdmin.invoices.finalizeInvoice(invoice.id);
    
    // Calculate payment due date
    const paymentDueDate = new Date();
    paymentDueDate.setDate(paymentDueDate.getDate() + paymentTerms);
    
    // Update quote with invoice information
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        stripe_invoice_id: finalizedInvoice.id,
        stripe_customer_id: customer.id,
        invoice_status: 'sent',
        invoice_sent_at: new Date().toISOString(),
        homeowner_email: homeownerEmail,
        homeowner_name: homeownerName,
        payment_terms: paymentTerms,
        payment_due_date: paymentDueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Failed to update quote with invoice info:', updateError);
      // Don't fail the entire operation, just log the error
    }

    // Create homeowner payment tracking record
    try {
      const { error: paymentError } = await supabase
        .from('homeowner_payments')
        .insert({
          user_id: session.user.id,
          quote_id: quoteId,
          stripe_invoice_id: finalizedInvoice.id,
          stripe_customer_id: customer.id,
          amount_cents: Math.round(typedQuote.total * 100),
          currency: 'usd',
          payment_status: 'pending',
          homeowner_email: homeownerEmail,
          homeowner_name: homeownerName,
          invoice_sent_at: new Date().toISOString()
        });

      if (paymentError) {
        console.error('Failed to create payment tracking record:', paymentError);
      }
    } catch (trackingError) {
      console.error('Error creating payment tracking:', trackingError);
    }

    return {
      success: true,
      data: {
        invoice: finalizedInvoice,
        customer: customer,
        hosted_invoice_url: finalizedInvoice.hosted_invoice_url || '',
        payment_due_date: paymentDueDate.toISOString().split('T')[0]
      }
    };

  } catch (error) {
    console.error('Failed to create homeowner invoice:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid email')) {
        return {
          success: false,
          error: 'Please provide a valid email address'
        };
      }
      if (error.message.includes('customer')) {
        return {
          success: false,
          error: 'Failed to create customer account. Please try again.'
        };
      }
      if (error.message.includes('invoice')) {
        return {
          success: false,
          error: 'Failed to create invoice. Please check your Stripe configuration.'
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to create invoice. Please try again or contact support.'
    };
  }
}

// =====================================================
// CUSTOMER PORTAL SESSION CREATION
// =====================================================

/**
 * Creates a Stripe Customer Portal session for homeowners to manage their payment
 * This allows homeowners to pay invoices, update payment methods, and view history
 */
export async function createHomeownerPortalSession(
  customerId: string, 
  quoteId: string
): Promise<HomeownerPortalResult> {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Verify the customer belongs to a quote owned by the current user
    const supabase = await createSupabaseServerClient();
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('id, stripe_customer_id')
      .eq('id', quoteId)
      .eq('user_id', session.user.id)
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !quote) {
      return {
        success: false,
        error: 'Quote not found or access denied'
      };
    }

    // Create portal session with homeowner-specific configuration
    const portalSession = await stripeAdmin.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/quote-payment-success?quote=${quoteId}`
    });

    return {
      success: true,
      data: { 
        url: portalSession.url 
      }
    };

  } catch (error) {
    console.error('Failed to create portal session:', error);
    return {
      success: false,
      error: 'Failed to open payment portal. Please try again.'
    };
  }
}

// =====================================================
// INVOICE STATUS MANAGEMENT
// =====================================================

/**
 * Updates the payment status of a quote based on Stripe webhook events
 * This function is called by the webhook handler when payment status changes
 */
export async function updateQuotePaymentStatus(
  quoteId: string,
  status: 'paid' | 'failed' | 'cancelled',
  paymentDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const updateData: any = {
      invoice_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'paid' && paymentDate) {
      updateData.payment_received_at = paymentDate;
    }

    const { error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', quoteId);

    if (error) {
      console.error('Failed to update quote payment status:', error);
      return {
        success: false,
        error: 'Failed to update payment status'
      };
    }

    // Also update the homeowner_payments table if it exists
    try {
      await supabase
        .from('homeowner_payments')
        .update({
          payment_status: status === 'paid' ? 'succeeded' : status,
          payment_completed_at: status === 'paid' ? (paymentDate || new Date().toISOString()) : null,
          updated_at: new Date().toISOString()
        })
        .eq('quote_id', quoteId);
    } catch (trackingError) {
      console.error('Failed to update payment tracking:', trackingError);
      // Don't fail the main operation
    }

    return { success: true };

  } catch (error) {
    console.error('Error updating quote payment status:', error);
    return {
      success: false,
      error: 'Failed to update payment status'
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Gets the payment status and details for a quote
 */
export async function getQuotePaymentStatus(quoteId: string) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id,
        stripe_invoice_id,
        stripe_customer_id,
        invoice_status,
        homeowner_email,
        homeowner_name,
        invoice_sent_at,
        payment_received_at,
        payment_due_date,
        payment_terms
      `)
      .eq('id', quoteId)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('Failed to get quote payment status:', error);
    return {
      success: false,
      error: 'Failed to get payment status'
    };
  }
}

/**
 * Cancels a pending invoice
 */
export async function cancelHomeownerInvoice(quoteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const supabase = await createSupabaseServerClient();
    
    // Get quote with invoice ID
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('stripe_invoice_id, invoice_status')
      .eq('id', quoteId)
      .eq('user_id', session.user.id)
      .single();

    if (quoteError || !quote) {
      return {
        success: false,
        error: 'Quote not found'
      };
    }

    if (!quote.stripe_invoice_id) {
      return {
        success: false,
        error: 'No invoice to cancel'
      };
    }

    if (quote.invoice_status === 'paid') {
      return {
        success: false,
        error: 'Cannot cancel a paid invoice'
      };
    }

    // Cancel the Stripe invoice
    await stripeAdmin.invoices.voidInvoice(quote.stripe_invoice_id);

    // Update quote status
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        invoice_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Failed to update quote status:', updateError);
    }

    return { success: true };

  } catch (error) {
    console.error('Failed to cancel invoice:', error);
    return {
      success: false,
      error: 'Failed to cancel invoice'
    };
  }
}
