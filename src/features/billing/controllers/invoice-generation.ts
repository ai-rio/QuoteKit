import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface InvoiceGenerationOptions {
  customerId: string;
  subscriptionId?: string;
  description?: string;
  metadata?: Record<string, string>;
  autoAdvance?: boolean;
  collectionMethod?: 'charge_automatically' | 'send_invoice';
  daysUntilDue?: number;
}

interface InvoiceItem {
  price?: string;
  quantity?: number;
  description?: string;
  amount?: number;
  currency?: string;
}

interface GeneratedInvoice {
  id: string;
  number: string | null;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: number;
  due_date: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  description: string | null;
  customer: string;
  subscription: string | null;
}

/**
 * Configure automatic invoice generation for a customer
 * This sets up Stripe to automatically generate invoices for subscriptions
 */
export async function configureAutomaticInvoices(customerId: string): Promise<void> {
  try {
    console.debug('Invoice Generation: Configuring automatic invoices', {
      customerId,
      timestamp: new Date().toISOString()
    });

    // Update customer to ensure proper invoice settings
    await stripeAdmin.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: undefined, // Will use subscription's default payment method
        custom_fields: [],
        rendering_options: {
          amount_tax_display: 'include_inclusive_tax'
        }
      },
      // Ensure customer has proper tax settings
      tax_exempt: 'none', // Customer is not tax exempt
    });

    console.debug('Invoice Generation: Successfully configured automatic invoices', {
      customerId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Invoice Generation: Failed to configure automatic invoices', {
      customerId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Generate a manual invoice for a customer
 * Useful for one-time charges or custom billing scenarios
 */
export async function generateManualInvoice(
  customerId: string,
  items: InvoiceItem[],
  options: Partial<InvoiceGenerationOptions> = {}
): Promise<GeneratedInvoice> {
  try {
    console.debug('Invoice Generation: Creating manual invoice', {
      customerId,
      itemCount: items.length,
      options,
      timestamp: new Date().toISOString()
    });

    // Create invoice items first
    const invoiceItems = [];
    for (const item of items) {
      if (item.price) {
        // Use existing price
        const invoiceItem = await stripeAdmin.invoiceItems.create({
          customer: customerId,
          price: item.price,
          quantity: item.quantity || 1,
          description: item.description,
        });
        invoiceItems.push(invoiceItem);
      } else if (item.amount && item.currency) {
        // Create custom amount
        const invoiceItem = await stripeAdmin.invoiceItems.create({
          customer: customerId,
          amount: item.amount,
          currency: item.currency,
          description: item.description || 'Custom charge',
        });
        invoiceItems.push(invoiceItem);
      }
    }

    // Create the invoice
    const invoice = await stripeAdmin.invoices.create({
      customer: customerId,
      description: options.description || 'Manual invoice',
      metadata: options.metadata || {},
      auto_advance: options.autoAdvance !== false, // Default to true
      collection_method: options.collectionMethod || 'charge_automatically',
      days_until_due: options.daysUntilDue || undefined,
    });

    // Finalize the invoice if auto_advance is true
    let finalizedInvoice = invoice;
    if (options.autoAdvance !== false) {
      finalizedInvoice = await stripeAdmin.invoices.finalizeInvoice(invoice.id);
    }

    console.debug('Invoice Generation: Successfully created manual invoice', {
      customerId,
      invoiceId: finalizedInvoice.id,
      invoiceNumber: finalizedInvoice.number,
      status: finalizedInvoice.status,
      amountDue: finalizedInvoice.amount_due,
      timestamp: new Date().toISOString()
    });

    return {
      id: finalizedInvoice.id,
      number: finalizedInvoice.number,
      status: finalizedInvoice.status || 'draft',
      amount_due: finalizedInvoice.amount_due,
      amount_paid: finalizedInvoice.amount_paid,
      currency: finalizedInvoice.currency,
      created: finalizedInvoice.created,
      due_date: finalizedInvoice.due_date,
      hosted_invoice_url: finalizedInvoice.hosted_invoice_url || null,
      invoice_pdf: finalizedInvoice.invoice_pdf || null,
      description: finalizedInvoice.description,
      customer: finalizedInvoice.customer as string,
      subscription: finalizedInvoice.subscription as string | null,
    };

  } catch (error) {
    console.error('Invoice Generation: Failed to create manual invoice', {
      customerId,
      itemCount: items.length,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Generate invoice for subscription billing cycle
 * This creates an invoice for the current billing period
 */
export async function generateSubscriptionInvoice(
  subscriptionId: string,
  options: Partial<InvoiceGenerationOptions> = {}
): Promise<GeneratedInvoice> {
  try {
    console.debug('Invoice Generation: Creating subscription invoice', {
      subscriptionId,
      options,
      timestamp: new Date().toISOString()
    });

    // Get subscription details
    const subscription = await stripeAdmin.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    // Create invoice for subscription
    const invoice = await stripeAdmin.invoices.create({
      customer: subscription.customer as string,
      subscription: subscriptionId,
      description: options.description || `Invoice for subscription ${subscription.id}`,
      metadata: {
        subscription_id: subscriptionId,
        ...options.metadata
      },
      auto_advance: options.autoAdvance !== false,
      collection_method: options.collectionMethod || 'charge_automatically',
    });

    // Finalize the invoice
    const finalizedInvoice = await stripeAdmin.invoices.finalizeInvoice(invoice.id);

    console.debug('Invoice Generation: Successfully created subscription invoice', {
      subscriptionId,
      customerId: subscription.customer,
      invoiceId: finalizedInvoice.id,
      invoiceNumber: finalizedInvoice.number,
      status: finalizedInvoice.status,
      amountDue: finalizedInvoice.amount_due,
      timestamp: new Date().toISOString()
    });

    return {
      id: finalizedInvoice.id,
      number: finalizedInvoice.number,
      status: finalizedInvoice.status || 'draft',
      amount_due: finalizedInvoice.amount_due,
      amount_paid: finalizedInvoice.amount_paid,
      currency: finalizedInvoice.currency,
      created: finalizedInvoice.created,
      due_date: finalizedInvoice.due_date,
      hosted_invoice_url: finalizedInvoice.hosted_invoice_url || null,
      invoice_pdf: finalizedInvoice.invoice_pdf || null,
      description: finalizedInvoice.description,
      customer: finalizedInvoice.customer as string,
      subscription: finalizedInvoice.subscription as string | null,
    };

  } catch (error) {
    console.error('Invoice Generation: Failed to create subscription invoice', {
      subscriptionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Get upcoming invoice preview for a subscription
 * Useful for showing users what their next bill will be
 */
export async function getUpcomingInvoicePreview(
  customerId: string,
  subscriptionId?: string
): Promise<GeneratedInvoice> {
  try {
    console.debug('Invoice Generation: Getting upcoming invoice preview', {
      customerId,
      subscriptionId,
      timestamp: new Date().toISOString()
    });

    const upcomingInvoice = await stripeAdmin.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscriptionId,
    });

    console.debug('Invoice Generation: Successfully retrieved upcoming invoice preview', {
      customerId,
      subscriptionId,
      amountDue: upcomingInvoice.amount_due,
      periodStart: upcomingInvoice.period_start,
      periodEnd: upcomingInvoice.period_end,
      timestamp: new Date().toISOString()
    });

    return {
      id: `upcoming_${Date.now()}`, // UpcomingInvoice doesn't have an id, use placeholder
      number: upcomingInvoice.number,
      status: upcomingInvoice.status || 'draft',
      amount_due: upcomingInvoice.amount_due,
      amount_paid: upcomingInvoice.amount_paid,
      currency: upcomingInvoice.currency,
      created: upcomingInvoice.created,
      due_date: upcomingInvoice.due_date,
      hosted_invoice_url: upcomingInvoice.hosted_invoice_url || null,
      invoice_pdf: upcomingInvoice.invoice_pdf || null,
      description: upcomingInvoice.description,
      customer: upcomingInvoice.customer as string,
      subscription: upcomingInvoice.subscription as string | null,
    };

  } catch (error) {
    console.error('Invoice Generation: Failed to get upcoming invoice preview', {
      customerId,
      subscriptionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Store invoice information in local database for faster access
 * This is called by webhooks when invoices are created/updated
 */
export async function syncInvoiceToDatabase(
  invoiceId: string,
  userId: string
): Promise<void> {
  try {
    console.debug('Invoice Generation: Syncing invoice to database', {
      invoiceId,
      userId,
      timestamp: new Date().toISOString()
    });

    // Get invoice from Stripe
    const invoice = await stripeAdmin.invoices.retrieve(invoiceId);
    
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found in Stripe`);
    }

    // Store in billing_history table
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('billing_history')
      .upsert({
        id: invoice.id,
        user_id: userId,
        subscription_id: invoice.subscription as string | null,
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status || 'unknown',
        description: invoice.description || `Invoice ${invoice.number || invoice.id}`,
        invoice_url: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
        stripe_invoice_id: invoice.id,
        created_at: new Date(invoice.created * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      throw new Error(`Failed to sync invoice to database: ${error.message}`);
    }

    console.debug('Invoice Generation: Successfully synced invoice to database', {
      invoiceId,
      userId,
      invoiceNumber: invoice.number,
      amount: invoice.amount_paid || invoice.amount_due,
      status: invoice.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Invoice Generation: Failed to sync invoice to database', {
      invoiceId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Configure invoice settings for a subscription
 * This ensures invoices are generated with proper line items and descriptions
 */
export async function configureSubscriptionInvoicing(
  subscriptionId: string,
  settings: {
    description?: string;
    metadata?: Record<string, string>;
    automaticTax?: boolean;
  } = {}
): Promise<void> {
  try {
    console.debug('Invoice Generation: Configuring subscription invoicing', {
      subscriptionId,
      settings,
      timestamp: new Date().toISOString()
    });

    // Update subscription with invoice settings
    await stripeAdmin.subscriptions.update(subscriptionId, {
      description: settings.description,
      metadata: settings.metadata || {},
      automatic_tax: {
        enabled: settings.automaticTax || false
      },
      // Ensure invoices are created automatically
      collection_method: 'charge_automatically',
    });

    console.debug('Invoice Generation: Successfully configured subscription invoicing', {
      subscriptionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Invoice Generation: Failed to configure subscription invoicing', {
      subscriptionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Helper function to format invoice data for API responses
 */
export function formatInvoiceForAPI(invoice: any): GeneratedInvoice {
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    created: invoice.created,
    due_date: invoice.due_date,
    hosted_invoice_url: invoice.hosted_invoice_url,
    invoice_pdf: invoice.invoice_pdf,
    description: invoice.description,
    customer: invoice.customer,
    subscription: invoice.subscription,
  };
}
