import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_url: string;
  description: string;
}

/**
 * GET /api/billing-history
 * Fetch billing history for the authenticated user
 * 
 * Query Parameters:
 * - limit: number (optional, default: 50, max: 100)
 * - offset: number (optional, default: 0)
 * - status: string (optional, filter by status)
 * - from_date: string (optional, ISO date string)
 * - to_date: string (optional, ISO date string)
 */
export async function GET(request: NextRequest) {
  try {
    console.debug('billing-history API: Processing GET request');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const statusFilter = searchParams.get('status');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    console.debug('billing-history API: Query parameters', {
      limit,
      offset,
      statusFilter,
      fromDate,
      toDate
    });

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('billing-history API: Authentication failed', {
        hasAuthError: !!authError,
        hasUser: !!user,
        errorMessage: authError?.message
      });
      
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    console.debug('billing-history API: User authenticated', {
      userId: user.id,
      email: user.email
    });

    // Import helper functions
    const { getOrCreateCustomerForUser, userNeedsStripeCustomer } = await import('@/features/account/controllers/get-or-create-customer');
    
    // Check if user actually needs a Stripe customer (has paid subscriptions)
    const needsCustomer = await userNeedsStripeCustomer(user.id, supabase);
    
    if (!needsCustomer) {
      console.debug('billing-history API: User is on free plan, returning empty history', {
        userId: user.id
      });
      
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        },
        message: 'No billing history available for free plan users'
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId;
    try {
      stripeCustomerId = await getOrCreateCustomerForUser({ 
        userId: user.id, 
        email: user.email!, 
        supabaseClient: supabase,
        forceCreate: false // Don't create customer just to check billing history
      });
      
      if (!stripeCustomerId) {
        console.debug('billing-history API: No existing Stripe customer found', {
          userId: user.id
        });
        
        // Try direct Stripe lookup before giving up
        console.debug('billing-history API: Trying direct Stripe lookup');
        
        const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        
        if (stripeSecretKey) {
          const stripe = createStripeAdminClient({
            secret_key: stripeSecretKey,
            mode: 'test'
          });
          
          // Try to find existing customer by email
          const existingCustomers = await stripe.customers.list({
            email: user.email,
            limit: 1,
          });
          
          if (existingCustomers.data.length > 0) {
            stripeCustomerId = existingCustomers.data[0].id;
            console.debug('billing-history API: Found customer via direct Stripe lookup', {
              userId: user.id,
              stripeCustomerId
            });
          }
        }
        
        if (!stripeCustomerId) {
          // Still no customer found - don't return empty, continue to show subscription history
          console.debug('billing-history API: No Stripe customer found, will show subscription history only');
          stripeCustomerId = null;
        }
      }
      
      console.debug('billing-history API: Found Stripe customer', {
        userId: user.id,
        stripeCustomerId
      });
    } catch (customerError) {
      console.error('billing-history API: Failed to get customer', {
        userId: user.id,
        error: customerError instanceof Error ? customerError.message : 'Unknown customer error'
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to retrieve customer information',
          code: 'CUSTOMER_ERROR'
        },
        { status: 500 }
      );
    }

    // Fetch invoices from Stripe (only if customer found)
    let billingHistory: BillingHistoryItem[] = [];
    
    if (stripeCustomerId) {
      const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
      
      try {
        console.debug('billing-history API: Fetching invoices from Stripe', {
          stripeCustomerId,
          limit: limit + 1, // Fetch one extra to check if there are more
          offset
        });

        // Build Stripe query parameters
        const stripeParams: any = {
          customer: stripeCustomerId,
          limit: limit + 1, // Fetch one extra to determine hasMore
        };

      // Add status filter if provided
      if (statusFilter) {
        stripeParams.status = statusFilter;
      }

      // Add date filters if provided
      if (fromDate) {
        const fromTimestamp = Math.floor(new Date(fromDate).getTime() / 1000);
        stripeParams.created = { gte: fromTimestamp };
      }
      
      if (toDate) {
        const toTimestamp = Math.floor(new Date(toDate).getTime() / 1000);
        if (stripeParams.created) {
          stripeParams.created.lte = toTimestamp;
        } else {
          stripeParams.created = { lte: toTimestamp };
        }
      }

      // Handle pagination with Stripe's cursor-based pagination
      if (offset > 0) {
        // For offset-based pagination, we need to fetch all records up to the offset
        // This is not ideal for large datasets, but works for typical billing history sizes
        const allInvoices = await stripeAdmin.invoices.list({
          customer: stripeCustomerId,
          limit: offset + limit + 1,
          ...(statusFilter && { status: statusFilter }),
          ...(stripeParams.created && { created: stripeParams.created })
        });
        
        // Slice to get the requested page
        const paginatedInvoices = allInvoices.data.slice(offset, offset + limit);
        const hasMore = allInvoices.data.length > offset + limit;
        
        stripeParams.data = paginatedInvoices;
        stripeParams.has_more = hasMore;
      } else {
        // For first page, use direct Stripe pagination
        const invoices = await stripeAdmin.invoices.list(stripeParams);
        stripeParams.data = invoices.data.slice(0, limit);
        stripeParams.has_more = invoices.data.length > limit;
      }

      const invoices = stripeParams.data;
      const hasMore = stripeParams.has_more;

      console.debug('billing-history API: Retrieved invoices from Stripe', {
        userId: user.id,
        stripeCustomerId,
        invoiceCount: invoices.length,
        hasMore,
        actualLimit: limit
      });

      // Transform Stripe invoice data to match our interface
      let billingHistory: BillingHistoryItem[] = invoices.map((invoice: any) => {
        // Get the first line item for description fallback
        const firstLineItem = invoice.lines.data[0];
        const description = invoice.description || 
                          firstLineItem?.description || 
                          `Invoice ${invoice.number || invoice.id}`;

        return {
          id: invoice.id,
          date: new Date(invoice.created * 1000).toISOString(),
          amount: invoice.amount_paid || invoice.total || 0,
          status: invoice.status || 'unknown',
          invoice_url: invoice.hosted_invoice_url || invoice.invoice_pdf || '#',
          description: description,
        };
      });

      // In development mode or when no invoices exist, supplement with subscription changes
      const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1');
      if (isDevelopment || billingHistory.length === 0) {
        console.debug('billing-history API: Adding development mode subscription history');
        
        // Fetch subscription changes from local database
        const { data: subscriptions, error: subError } = await supabase
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
          .eq('user_id', user.id)
          .order('created', { ascending: false })
          .limit(limit);

        if (!subError && subscriptions && subscriptions.length > 0) {
          const subscriptionHistory = subscriptions.map((sub: any, index: number) => {
            const price = sub.prices;
            const amount = price?.unit_amount || 0;
            const planName = price?.products?.name || 'Unknown Plan';
            
            // Create a description based on whether this is the first subscription or a change
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
            };
          });

          // Merge and sort by date (newest first)
          billingHistory = [...billingHistory, ...subscriptionHistory]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);
        }
      }

      console.debug('billing-history API: Successfully transformed billing data', {
        userId: user.id,
        transformedCount: billingHistory.length,
        hasMore
      });

      // Return successful response with pagination info
      return NextResponse.json({
        data: billingHistory,
        pagination: {
          total: billingHistory.length, // Note: Stripe doesn't provide total count easily
          limit,
          offset,
          hasMore
        },
        timestamp: new Date().toISOString()
      });

    } catch (stripeError) {
      console.error('billing-history API: Stripe API error', {
        userId: user.id,
        stripeCustomerId,
        error: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error',
        stack: stripeError instanceof Error ? stripeError.stack : undefined
      });

      return NextResponse.json(
        { 
          error: 'Failed to retrieve billing history from Stripe',
          code: 'STRIPE_ERROR',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    } else {
      // No Stripe customer found, return subscription history only
      console.debug('billing-history API: No Stripe customer, showing subscription history only');
      
      const { data: subscriptions, error: subError } = await supabase
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
        .eq('user_id', user.id)
        .order('created', { ascending: false })
        .limit(limit);

      if (!subError && subscriptions && subscriptions.length > 0) {
        billingHistory = subscriptions.map((sub: any, index: number) => {
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
          };
        });
      }

      return NextResponse.json({
        data: billingHistory,
        pagination: {
          total: billingHistory.length,
          limit,
          offset,
          hasMore: false
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('billing-history API: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing-history/refresh
 * Force refresh billing history cache
 * This endpoint can be called after payment events to ensure fresh data
 */
export async function POST(request: NextRequest) {
  try {
    console.debug('billing-history API: Processing POST refresh request');

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('billing-history API: Authentication failed for refresh', {
        hasAuthError: !!authError,
        hasUser: !!user,
        errorMessage: authError?.message
      });
      
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // For now, just return success - the GET endpoint always fetches fresh data from Stripe
    // In the future, this could invalidate any caching layers
    console.debug('billing-history API: Refresh requested', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Billing history cache refreshed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('billing-history API: Refresh error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Failed to refresh billing history',
        code: 'REFRESH_ERROR'
      },
      { status: 500 }
    );
  }
}
