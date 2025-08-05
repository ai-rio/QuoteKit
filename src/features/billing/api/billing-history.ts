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
}

interface BillingHistoryOptions {
  limit?: number;
  offset?: number;
  statusFilter?: string;
  fromDate?: string;
  toDate?: string;
  includeSubscriptionHistory?: boolean;
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
    timestamp: string;
  };
}

/**
 * Get comprehensive billing history for a user
 * Prioritizes real Stripe invoices, falls back to subscription history for development
 */
export async function getBillingHistory(
  userId: string,
  options: BillingHistoryOptions = {}
): Promise<BillingHistoryResponse> {
  const {
    limit = 50,
    offset = 0,
    statusFilter,
    fromDate,
    toDate,
    includeSubscriptionHistory = true
  } = options;

  try {
    console.debug('Billing History API: Fetching billing history', {
      userId,
      options,
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

    // Step 1: Try to get real Stripe invoices
    try {
      stripeCustomerId = await getOrCreateCustomerForUser({
        userId,
        email: user.email!,
        supabaseClient: supabase,
        forceCreate: false // Don't create customer just for billing history
      });

      if (stripeCustomerId) {
        console.debug('Billing History API: Found Stripe customer, fetching invoices', {
          userId,
          stripeCustomerId
        });

        const stripeInvoices = await fetchStripeInvoices(stripeCustomerId, {
          limit: limit + 1, // Fetch one extra to check hasMore
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
            type: 'stripe_invoice' as const
          }));

          console.debug('Billing History API: Successfully fetched Stripe invoices', {
            userId,
            stripeCustomerId,
            invoiceCount: billingHistory.length
          });
        }
      }
    } catch (stripeError) {
      console.warn('Billing History API: Failed to fetch Stripe invoices, will try alternatives', {
        userId,
        error: stripeError instanceof Error ? stripeError.message : 'Unknown error'
      });
    }

    // Step 2: If no Stripe invoices and development mode, include subscription history
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1');
    
    if (billingHistory.length === 0 && includeSubscriptionHistory && isDevelopment) {
      console.debug('Billing History API: No Stripe invoices found, fetching subscription history', {
        userId,
        isDevelopment
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

        console.debug('Billing History API: Successfully fetched subscription history', {
          userId,
          subscriptionCount: billingHistory.length
        });
      }
    }

    // Step 3: Check for explicit billing history records
    if (billingHistory.length === 0) {
      console.debug('Billing History API: Fetching explicit billing history records', {
        userId
      });

      const explicitBilling = await fetchExplicitBillingHistory(userId, supabase, {
        limit,
        offset,
        statusFilter,
        fromDate,
        toDate
      });

      if (explicitBilling.length > 0) {
        billingHistory = explicitBilling;
        console.debug('Billing History API: Successfully fetched explicit billing records', {
          userId,
          recordCount: billingHistory.length
        });
      }
    }

    // Calculate pagination
    const hasMore = billingHistory.length > limit;
    if (hasMore) {
      billingHistory = billingHistory.slice(0, limit);
    }

    const response: BillingHistoryResponse = {
      success: true,
      data: billingHistory,
      pagination: {
        total: billingHistory.length, // Note: Stripe doesn't provide total count easily
        limit,
        offset,
        hasMore
      },
      metadata: {
        stripeCustomerId: stripeCustomerId || undefined,
        hasStripeInvoices,
        hasSubscriptionHistory,
        timestamp: new Date().toISOString()
      }
    };

    console.debug('Billing History API: Successfully compiled billing history', {
      userId,
      totalItems: billingHistory.length,
      hasStripeInvoices,
      hasSubscriptionHistory,
      stripeCustomerId
    });

    return response;

  } catch (error) {
    console.error('Billing History API: Failed to fetch billing history', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Fetch invoices from Stripe
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

  // Build Stripe query parameters
  const stripeParams: any = {
    customer: customerId,
    limit: limit,
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

  // Handle pagination (Stripe uses cursor-based pagination)
  if (offset > 0) {
    // For offset-based pagination, we need to fetch all records up to the offset
    // This is not ideal for large datasets, but works for typical billing history sizes
    const allInvoices = await stripeAdmin.invoices.list({
      ...stripeParams,
      limit: offset + limit
    });
    
    return allInvoices.data.slice(offset);
  } else {
    // For first page, use direct Stripe pagination
    const invoices = await stripeAdmin.invoices.list(stripeParams);
    return invoices.data;
  }
}

/**
 * Fetch subscription history from local database
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
      type: 'subscription_change' as const
    };
  });
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

  let query = supabase
    .from('billing_history')
    .select(`
      id,
      created_at,
      amount,
      currency,
      status,
      description,
      invoice_url
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
    type: 'billing_record' as const
  }));
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
 * Refresh billing history cache
 * This can be called after payment events to ensure fresh data
 */
export async function refreshBillingHistoryCache(userId: string): Promise<void> {
  try {
    console.debug('Billing History API: Refreshing cache', {
      userId,
      timestamp: new Date().toISOString()
    });

    // For now, this is a no-op since we always fetch fresh data
    // In the future, this could invalidate Redis cache or similar
    
    console.debug('Billing History API: Cache refresh completed', {
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Billing History API: Failed to refresh cache', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Check if user has any billing history
 */
export async function hasBillingHistory(userId: string): Promise<boolean> {
  try {
    const history = await getBillingHistory(userId, { limit: 1 });
    return history.data.length > 0;
  } catch (error) {
    console.warn('Failed to check billing history:', error);
    return false;
  }
}

/**
 * Get billing summary for a user
 */
export async function getBillingSummary(userId: string): Promise<{
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  currency: string;
  lastInvoiceDate?: string;
}> {
  try {
    const history = await getBillingHistory(userId, { limit: 100 });
    
    const summary = {
      totalInvoices: history.data.length,
      totalPaid: 0,
      totalPending: 0,
      currency: 'usd',
      lastInvoiceDate: undefined as string | undefined
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
    console.error('Failed to get billing summary:', error);
    return {
      totalInvoices: 0,
      totalPaid: 0,
      totalPending: 0,
      currency: 'usd'
    };
  }
}
