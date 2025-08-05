import { getOrCreateCustomerForUser } from '@/features/account/controllers/get-or-create-customer';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_url: string;
  description: string;
  type: 'stripe_invoice' | 'subscription_change' | 'billing_record';
  metadata?: {
    stripe_invoice_id?: string;
    subscription_id?: string;
    payment_intent_id?: string;
  };
}

interface BillingHistoryOptions {
  limit?: number;
  offset?: number;
  statusFilter?: string;
  fromDate?: string;
  toDate?: string;
  includeSubscriptionHistory?: boolean;
  productionMode?: boolean; // Force production behavior
}

interface BillingHistoryResponse {
  success: boolean;
  data: BillingHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  metadata: {
    stripeCustomerId?: string;
    hasStripeInvoices: boolean;
    hasSubscriptionHistory: boolean;
    hasBillingRecords: boolean;
    isProductionMode: boolean;
    timestamp: string;
    message?: string;
  };
}

/**
 * Enhanced billing history that prioritizes real Stripe invoices
 * Production-ready with proper fallback messaging
 */
export async function getEnhancedBillingHistory(
  userId: string,
  options: BillingHistoryOptions = {}
): Promise<BillingHistoryResponse> {
  const {
    limit = 50,
    offset = 0,
    statusFilter,
    fromDate,
    toDate,
    includeSubscriptionHistory = false, // Default to false for production
    productionMode = process.env.NODE_ENV === 'production'
  } = options;

  try {
    console.debug('Enhanced Billing History: Starting fetch', {
      userId,
      options: { ...options, productionMode },
      timestamp: new Date().toISOString()
    });

    const supabase = await createSupabaseServerClient();
    
    // Get user details
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      throw new Error('Authentication required or user mismatch');
    }

    let billingHistory: BillingHistoryItem[] = [];
    let stripeCustomerId: string | null = null;
    let hasStripeInvoices = false;
    let hasSubscriptionHistory = false;
    let hasBillingRecords = false;

    // Step 1: Always try to get real Stripe invoices first
    try {
      stripeCustomerId = await getOrCreateCustomerForUser({
        userId,
        email: user.email!,
        supabaseClient: supabase,
        forceCreate: false
      });

      if (stripeCustomerId) {
        console.debug('Enhanced Billing History: Found Stripe customer, fetching invoices', {
          userId,
          stripeCustomerId
        });

        const stripeInvoices = await fetchStripeInvoices(stripeCustomerId, {
          limit: limit + 1,
          offset,
          statusFilter,
          fromDate,
          toDate
        });

        if (stripeInvoices.length > 0) {
          hasStripeInvoices = true;
          billingHistory = stripeInvoices.slice(0, limit).map(invoice => ({
            id: invoice.id,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid || invoice.amount_due,
            status: invoice.status || 'unknown',
            invoice_url: invoice.hosted_invoice_url || invoice.invoice_pdf || '#',
            description: getInvoiceDescription(invoice),
            type: 'stripe_invoice' as const,
            metadata: {
              stripe_invoice_id: invoice.id,
              subscription_id: invoice.subscription as string | undefined,
              payment_intent_id: typeof invoice.payment_intent === 'string' 
                ? invoice.payment_intent 
                : invoice.payment_intent?.id
            }
          }));

          console.debug('Enhanced Billing History: Successfully fetched Stripe invoices', {
            userId,
            stripeCustomerId,
            invoiceCount: billingHistory.length
          });
        }
      }
    } catch (stripeError) {
      console.warn('Enhanced Billing History: Failed to fetch Stripe invoices', {
        userId,
        error: stripeError instanceof Error ? stripeError.message : 'Unknown error'
      });
    }

    // Step 2: If no Stripe invoices, check explicit billing records
    if (billingHistory.length === 0) {
      console.debug('Enhanced Billing History: No Stripe invoices, checking billing records', {
        userId
      });

      const billingRecords = await fetchExplicitBillingHistory(userId, supabase, {
        limit,
        offset,
        statusFilter,
        fromDate,
        toDate
      });

      if (billingRecords.length > 0) {
        hasBillingRecords = true;
        billingHistory = billingRecords;
        console.debug('Enhanced Billing History: Found explicit billing records', {
          userId,
          recordCount: billingHistory.length
        });
      }
    }

    // Step 3: subscription history in development mode (only if explicitly enabled)
    if (billingHistory.length === 0 && includeSubscriptionHistory && !productionMode) {
      console.debug('Enhanced Billing History: Fetching subscription history (development mode)', {
        userId,
        productionMode
      });

      const subscriptionHistory = await fetchSubscriptionHistory(userId, supabase, {
        limit,
        offset,
        statusFilter,
        fromDate,
        toDate
      });

      if (subscriptionHistory.length > 0) {
        hasSubscriptionHistory = true;
        billingHistory = subscriptionHistory;
        console.debug('Enhanced Billing History: Using subscription history fallback', {
          userId,
          subscriptionCount: billingHistory.length
        });
      }
    }

    // Calculate pagination
    const hasMore = billingHistory.length > limit;
    if (hasMore) {
      billingHistory = billingHistory.slice(0, limit);
    }

    // Determine appropriate user message
    let message: string | undefined;
    if (billingHistory.length === 0) {
      if (productionMode) {
        message = 'No billing history available. Invoices will appear here once you have billing activity.';
      } else {
        message = 'No billing history found. This may be because you\'re on a free plan or haven\'t been billed yet.';
      }
    } else if (hasStripeInvoices) {
      message = 'Showing real Stripe invoices with downloadable receipts.';
    } else if (hasBillingRecords) {
      message = 'Showing billing records. Stripe invoices will appear when available.';
    } else if (hasSubscriptionHistory) {
      message = 'Development mode: Showing subscription history. Real invoices will replace this in production.';
    }

    const response: BillingHistoryResponse = {
      success: true,
      data: billingHistory,
      pagination: {
        total: billingHistory.length,
        limit,
        offset,
        hasMore
      },
      metadata: {
        stripeCustomerId: stripeCustomerId || undefined,
        hasStripeInvoices,
        hasSubscriptionHistory,
        hasBillingRecords,
        isProductionMode: productionMode,
        timestamp: new Date().toISOString(),
        message
      }
    };

    console.debug('Enhanced Billing History: Successfully compiled billing history', {
      userId,
      totalItems: billingHistory.length,
      hasStripeInvoices,
      hasSubscriptionHistory,
      hasBillingRecords,
      productionMode,
      stripeCustomerId
    });

    return response;

  } catch (error) {
    console.error('Enhanced Billing History: Failed to fetch billing history', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Fetch invoices from Stripe with enhanced error handling
 */
async function fetchStripeInvoices(
  customerId: string,
  options: {
    limit: number;
    offset: number;
    statusFilter?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<any[]> {
  const { limit, offset, statusFilter, fromDate, toDate } = options;

  try {
    // Build Stripe query parameters
    const stripeParams: any = {
      customer: customerId,
      limit: limit,
      expand: ['data.payment_intent', 'data.subscription']
    };

    // Add status filter
    if (statusFilter && statusFilter !== 'all') {
      stripeParams.status = statusFilter;
    }

    // Add date filters
    if (fromDate || toDate) {
      stripeParams.created = {};
      if (fromDate) {
        stripeParams.created.gte = Math.floor(new Date(fromDate).getTime() / 1000);
      }
      if (toDate) {
        stripeParams.created.lte = Math.floor(new Date(toDate).getTime() / 1000);
      }
    }

    // Handle pagination
    if (offset > 0) {
      const allInvoices = await stripeAdmin.invoices.list({
        ...stripeParams,
        limit: offset + limit
      });
      return allInvoices.data.slice(offset);
    } else {
      const invoices = await stripeAdmin.invoices.list(stripeParams);
      return invoices.data;
    }
  } catch (error) {
    console.error('Failed to fetch Stripe invoices:', error);
    throw error;
  }
}

/**
 * Fetch subscription history from local database (development fallback)
 */
async function fetchSubscriptionHistory(
  userId: string,
  supabase: any,
  options: {
    limit: number;
    offset: number;
    statusFilter?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<BillingHistoryItem[]> {
  const { limit, offset, statusFilter, fromDate, toDate } = options;

  try {
    let query = supabase
      .from('subscriptions')
      .select(`
        id,
        created,
        updated_at,
        status,
        stripe_price_id,
        prices:stripe_prices(
          unit_amount,
          interval,
          products:stripe_products(name)
        )
      `)
      .eq('user_id', userId)
      .order('created', { ascending: false });

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'paid') {
        query = query.eq('status', 'active');
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    if (fromDate) {
      query = query.gte('created', fromDate);
    }

    if (toDate) {
      query = query.lte('created', toDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: subscriptions, error } = await query;

    if (error || !subscriptions) {
      console.warn('Failed to fetch subscription history:', error);
      return [];
    }

    return subscriptions.map((sub: any, index: number) => {
      const price = sub.prices;
      const amount = price?.unit_amount || 0;
      const planName = price?.products?.name || 'Unknown Plan';
      
      let description = `Subscription to ${planName}`;
      if (index < subscriptions.length - 1) {
        description = `Plan change to ${planName}`;
      }

      return {
        id: `sub_${sub.id}`,
        date: sub.updated_at || sub.created,
        amount: amount,
        status: sub.status === 'active' ? 'paid' : sub.status,
        invoice_url: '#',
        description: description,
        type: 'subscription_change' as const,
        metadata: {
          subscription_id: sub.id
        }
      };
    });
  } catch (error) {
    console.error('Failed to fetch subscription history:', error);
    return [];
  }
}

/**
 * Fetch explicit billing history records from database
 */
async function fetchExplicitBillingHistory(
  userId: string,
  supabase: any,
  options: {
    limit: number;
    offset: number;
    statusFilter?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<BillingHistoryItem[]> {
  const { limit, offset, statusFilter, fromDate, toDate } = options;

  try {
    let query = supabase
      .from('billing_history')
      .select(`
        id,
        created_at,
        amount,
        currency,
        status,
        description,
        invoice_url,
        stripe_invoice_id,
        subscription_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: billingRecords, error } = await query;

    if (error || !billingRecords) {
      console.warn('Failed to fetch explicit billing history:', error);
      return [];
    }

    return billingRecords.map((record: any) => ({
      id: record.id,
      date: record.created_at,
      amount: record.amount,
      status: record.status,
      invoice_url: record.invoice_url || '#',
      description: record.description,
      type: 'billing_record' as const,
      metadata: {
        stripe_invoice_id: record.stripe_invoice_id,
        subscription_id: record.subscription_id
      }
    }));
  } catch (error) {
    console.error('Failed to fetch explicit billing history:', error);
    return [];
  }
}

/**
 * Get description for a Stripe invoice
 */
function getInvoiceDescription(invoice: any): string {
  if (invoice.description) {
    return invoice.description;
  }

  // Try to get description from first line item
  if (invoice.lines && invoice.lines.data && invoice.lines.data.length > 0) {
    const firstLineItem = invoice.lines.data[0];
    if (firstLineItem.description) {
      return firstLineItem.description;
    }
    
    // Try to get from price/product
    if (firstLineItem.price && firstLineItem.price.product) {
      const product = firstLineItem.price.product;
      if (typeof product === 'object' && product.name) {
        return `Invoice for ${product.name}`;
      }
    }
  }

  // Fallback to invoice number or ID
  return `Invoice ${invoice.number || invoice.id}`;
}

/**
 * Check if user has any real billing activity (Stripe invoices or billing records)
 */
export async function hasRealBillingActivity(userId: string): Promise<boolean> {
  try {
    const history = await getEnhancedBillingHistory(userId, { 
      limit: 1, 
      productionMode: true,
      includeSubscriptionHistory: false 
    });
    
    return history.metadata.hasStripeInvoices || history.metadata.hasBillingRecords;
  } catch (error) {
    console.warn('Failed to check billing activity:', error);
    return false;
  }
}

/**
 * Get billing summary with real data only
 */
export async function getProductionBillingSummary(userId: string): Promise<{
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  currency: string;
  lastInvoiceDate?: string;
  hasRealData: boolean;
}> {
  try {
    const history = await getEnhancedBillingHistory(userId, { 
      limit: 100,
      productionMode: true,
      includeSubscriptionHistory: false
    });
    
    const summary = {
      totalInvoices: history.data.length,
      totalPaid: 0,
      totalPending: 0,
      currency: 'usd',
      lastInvoiceDate: undefined as string | undefined,
      hasRealData: history.metadata.hasStripeInvoices || history.metadata.hasBillingRecords
    };

    if (history.data.length > 0) {
      summary.lastInvoiceDate = history.data[0].date;
      
      for (const item of history.data) {
        if (item.status === 'paid') {
          summary.totalPaid += item.amount;
        } else if (item.status === 'pending' || item.status === 'open') {
          summary.totalPending += item.amount;
        }
      }
    }

    return summary;
  } catch (error) {
    console.error('Failed to get production billing summary:', error);
    return {
      totalInvoices: 0,
      totalPaid: 0,
      totalPending: 0,
      currency: 'usd',
      hasRealData: false
    };
  }
}
