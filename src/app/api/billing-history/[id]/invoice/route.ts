import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';

/**
 * GET /api/billing-history/[id]/invoice
 * Download invoice PDF for a specific billing history item
 * 
 * Security: Only allows users to download their own invoices
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceId = resolvedParams.id;
    
    console.debug('Invoice Download API: Processing download request', {
      invoiceId,
      timestamp: new Date().toISOString()
    });

    // Validate invoice ID format
    if (!invoiceId || (!invoiceId.startsWith('in_') && !invoiceId.startsWith('sub_'))) {
      console.warn('Invoice Download API: Invalid invoice ID format', {
        invoiceId
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid invoice ID format',
          code: 'INVALID_INVOICE_ID'
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Invoice Download API: Authentication failed', {
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

    console.debug('Invoice Download API: User authenticated', {
      userId: user.id,
      email: user.email,
      invoiceId
    });

    // Handle Stripe invoices
    if (invoiceId.startsWith('in_')) {
      try {
        // Get invoice from Stripe
        const invoice = await stripeAdmin.invoices.retrieve(invoiceId);
        
        if (!invoice) {
          console.warn('Invoice Download API: Invoice not found in Stripe', {
            invoiceId,
            userId: user.id
          });
          
          return NextResponse.json(
            { 
              error: 'Invoice not found',
              code: 'INVOICE_NOT_FOUND'
            },
            { status: 404 }
          );
        }

        // Verify user owns this invoice by checking customer
        const { getOrCreateCustomerForUser } = await import('@/features/account/controllers/get-or-create-customer');
        
        const userStripeCustomerId = await getOrCreateCustomerForUser({
          userId: user.id,
          email: user.email!,
          supabaseClient: supabase,
          forceCreate: false
        });

        if (!userStripeCustomerId || invoice.customer !== userStripeCustomerId) {
          console.warn('Invoice Download API: User does not own this invoice', {
            invoiceId,
            userId: user.id,
            userStripeCustomerId,
            invoiceCustomerId: invoice.customer
          });
          
          return NextResponse.json(
            { 
              error: 'Access denied - invoice not found for this user',
              code: 'ACCESS_DENIED'
            },
            { status: 403 }
          );
        }

        // Get download URL
        let downloadUrl = invoice.hosted_invoice_url || invoice.invoice_pdf;
        
        if (!downloadUrl) {
          console.warn('Invoice Download API: No download URL available', {
            invoiceId,
            userId: user.id,
            hasHostedUrl: !!invoice.hosted_invoice_url,
            hasPdfUrl: !!invoice.invoice_pdf
          });
          
          return NextResponse.json(
            { 
              error: 'Invoice download not available',
              code: 'DOWNLOAD_NOT_AVAILABLE'
            },
            { status: 404 }
          );
        }

        console.debug('Invoice Download API: Redirecting to Stripe invoice', {
          invoiceId,
          userId: user.id,
          downloadUrl: downloadUrl.substring(0, 50) + '...'
        });

        // Redirect to Stripe's hosted invoice URL
        return NextResponse.redirect(downloadUrl);

      } catch (stripeError) {
        console.error('Invoice Download API: Stripe API error', {
          invoiceId,
          userId: user.id,
          error: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
        });

        return NextResponse.json(
          { 
            error: 'Failed to retrieve invoice from Stripe',
            code: 'STRIPE_ERROR',
            details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Handle subscription-based invoices (fallback for development)
    if (invoiceId.startsWith('sub_')) {
      console.debug('Invoice Download API: Handling subscription-based invoice', {
        invoiceId,
        userId: user.id
      });

      // Extract subscription ID from invoice ID
      const subscriptionId = invoiceId.replace('sub_', '');
      
      // Verify user owns this subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id, user_id, price_id, prices:prices(unit_amount, products:products(name))')
        .eq('id', subscriptionId)
        .eq('user_id', user.id)
        .single();

      if (subError || !subscription) {
        console.warn('Invoice Download API: Subscription not found or access denied', {
          invoiceId,
          subscriptionId,
          userId: user.id,
          error: subError?.message
        });
        
        return NextResponse.json(
          { 
            error: 'Subscription invoice not found',
            code: 'SUBSCRIPTION_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // For subscription invoices, we don't have a real PDF
      // Return a message or generate a simple receipt
      console.debug('Invoice Download API: Subscription invoice - no PDF available', {
        invoiceId,
        subscriptionId,
        userId: user.id
      });

      return NextResponse.json(
        { 
          error: 'PDF not available for subscription records',
          code: 'PDF_NOT_AVAILABLE',
          message: 'This is a subscription record. Real invoices will be available once Stripe invoicing is fully configured.',
          subscription: {
            id: subscription.id,
            plan: (subscription.prices as any)?.products?.name || 'Unknown Plan',
            amount: (subscription.prices as any)?.unit_amount || 0
          }
        },
        { status: 404 }
      );
    }

    // Invalid invoice ID format
    console.warn('Invoice Download API: Unrecognized invoice ID format', {
      invoiceId,
      userId: user.id
    });

    return NextResponse.json(
      { 
        error: 'Unrecognized invoice ID format',
        code: 'INVALID_FORMAT'
      },
      { status: 400 }
    );

  } catch (error) {
    const resolvedParams = await params;
    console.error('Invoice Download API: Unexpected error', {
      invoiceId: resolvedParams.id,
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
 * POST /api/billing-history/[id]/invoice
 * Generate a new invoice for a subscription (admin/development use)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceId = resolvedParams.id;
    
    console.debug('Invoice Generation API: Processing generation request', {
      invoiceId,
      timestamp: new Date().toISOString()
    });

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { description, metadata } = body;

    // Only allow for subscription IDs in development
    if (!invoiceId.startsWith('sub_')) {
      return NextResponse.json(
        { 
          error: 'Invoice generation only supported for subscriptions',
          code: 'INVALID_OPERATION'
        },
        { status: 400 }
      );
    }

    const subscriptionId = invoiceId.replace('sub_', '');

    // Verify user owns this subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { 
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // If this is a real Stripe subscription, generate invoice
    if (subscription.stripe_subscription_id && subscription.stripe_subscription_id.startsWith('sub_')) {
      const { generateSubscriptionInvoice } = await import('@/features/billing/controllers/invoice-generation');
      
      try {
        const generatedInvoice = await generateSubscriptionInvoice(
          subscription.stripe_subscription_id,
          {
            description: description || `Manual invoice for subscription ${subscription.id}`,
            metadata: {
              user_id: user.id,
              subscription_id: subscription.id,
              ...metadata
            }
          }
        );

        console.debug('Invoice Generation API: Successfully generated invoice', {
          subscriptionId: subscription.stripe_subscription_id,
          invoiceId: generatedInvoice.id,
          userId: user.id
        });

        return NextResponse.json({
          success: true,
          invoice: generatedInvoice,
          message: 'Invoice generated successfully'
        });

      } catch (generationError) {
        console.error('Invoice Generation API: Failed to generate invoice', {
          subscriptionId: subscription.stripe_subscription_id,
          userId: user.id,
          error: generationError instanceof Error ? generationError.message : 'Unknown error'
        });

        return NextResponse.json(
          { 
            error: 'Failed to generate invoice',
            code: 'GENERATION_FAILED',
            details: generationError instanceof Error ? generationError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // For local subscriptions, return not supported
    return NextResponse.json(
      { 
        error: 'Invoice generation not supported for local subscriptions',
        code: 'NOT_SUPPORTED',
        message: 'This subscription is not connected to Stripe. Invoice generation requires a Stripe subscription.'
      },
      { status: 400 }
    );

  } catch (error) {
    const resolvedParams = await params;
    console.error('Invoice Generation API: Unexpected error', {
      invoiceId: resolvedParams.id,
      error: error instanceof Error ? error.message : 'Unknown error'
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
