import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

/**
 * GET /api/billing-history/[id]/invoice
 * Download or redirect to invoice for a specific billing record
 * 
 * This endpoint handles invoice downloads by:
 * 1. Verifying user authentication and ownership
 * 2. Fetching the invoice from Stripe
 * 3. Either redirecting to Stripe's hosted invoice or proxying the PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.debug('invoice-download API: Processing GET request', {
      invoiceId: params.id,
      timestamp: new Date().toISOString()
    });

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('invoice-download API: Authentication failed', {
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

    console.debug('invoice-download API: User authenticated', {
      userId: user.id,
      email: user.email,
      invoiceId: params.id
    });

    // Import Stripe admin client
    const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');
    
    // Get user's Stripe customer ID
    const { getOrCreateCustomerForUser } = await import('@/features/account/controllers/get-or-create-customer');
    
    let stripeCustomerId;
    try {
      stripeCustomerId = await getOrCreateCustomerForUser({ 
        userId: user.id, 
        email: user.email!, 
        supabaseClient: supabase,
        forceCreate: false // Don't create customer just for invoice download
      });
      
      if (!stripeCustomerId) {
        console.error('invoice-download API: No Stripe customer found', {
          userId: user.id,
          invoiceId: params.id
        });
        
        return NextResponse.json(
          { 
            error: 'No billing history available',
            code: 'NO_CUSTOMER'
          },
          { status: 404 }
        );
      }
      
      console.debug('invoice-download API: Found Stripe customer', {
        userId: user.id,
        stripeCustomerId,
        invoiceId: params.id
      });
    } catch (customerError) {
      console.error('invoice-download API: Failed to get customer', {
        userId: user.id,
        invoiceId: params.id,
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

    // Fetch the specific invoice from Stripe
    let invoice;
    try {
      console.debug('invoice-download API: Fetching invoice from Stripe', {
        invoiceId: params.id,
        stripeCustomerId
      });

      invoice = await stripeAdmin.invoices.retrieve(params.id);
      
      console.debug('invoice-download API: Retrieved invoice from Stripe', {
        invoiceId: params.id,
        invoiceStatus: invoice.status,
        invoiceCustomer: invoice.customer,
        hasHostedUrl: !!invoice.hosted_invoice_url,
        hasPdfUrl: !!invoice.invoice_pdf
      });

      // Verify the invoice belongs to the authenticated user's customer
      if (invoice.customer !== stripeCustomerId) {
        console.error('invoice-download API: Invoice does not belong to user', {
          userId: user.id,
          invoiceId: params.id,
          invoiceCustomer: invoice.customer,
          userCustomer: stripeCustomerId
        });
        
        return NextResponse.json(
          { 
            error: 'Invoice not found or access denied',
            code: 'ACCESS_DENIED'
          },
          { status: 403 }
        );
      }

    } catch (stripeError: any) {
      console.error('invoice-download API: Stripe API error', {
        userId: user.id,
        invoiceId: params.id,
        stripeCustomerId,
        error: stripeError.message,
        stripeErrorType: stripeError.type,
        stripeErrorCode: stripeError.code
      });

      // Handle specific Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError' && stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { 
            error: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to retrieve invoice from Stripe',
          code: 'STRIPE_ERROR',
          details: stripeError.message
        },
        { status: 500 }
      );
    }

    // Determine the best download method
    const hostedUrl = invoice.hosted_invoice_url;
    const pdfUrl = invoice.invoice_pdf;
    
    console.debug('invoice-download API: Determining download method', {
      invoiceId: params.id,
      hasHostedUrl: !!hostedUrl,
      hasPdfUrl: !!pdfUrl,
      invoiceStatus: invoice.status
    });

    // Check query parameters for download preference
    const { searchParams } = new URL(request.url);
    const downloadType = searchParams.get('type') || 'redirect'; // 'redirect' or 'proxy'
    const forceDownload = searchParams.get('download') === 'true';

    if (downloadType === 'proxy' && pdfUrl) {
      // Option 1: Proxy the PDF through our server
      try {
        console.debug('invoice-download API: Proxying PDF download', {
          invoiceId: params.id,
          pdfUrl: pdfUrl.substring(0, 50) + '...'
        });

        const pdfResponse = await fetch(pdfUrl);
        
        if (!pdfResponse.ok) {
          throw new Error(`PDF fetch failed: ${pdfResponse.status}`);
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        
        console.debug('invoice-download API: Successfully proxied PDF', {
          invoiceId: params.id,
          pdfSize: pdfBuffer.byteLength
        });

        // Return the PDF with appropriate headers
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': forceDownload 
              ? `attachment; filename="invoice-${params.id}.pdf"`
              : `inline; filename="invoice-${params.id}.pdf"`,
            'Content-Length': pdfBuffer.byteLength.toString(),
            'Cache-Control': 'private, no-cache'
          }
        });

      } catch (proxyError) {
        console.error('invoice-download API: PDF proxy failed', {
          invoiceId: params.id,
          error: proxyError instanceof Error ? proxyError.message : 'Unknown proxy error'
        });
        
        // Fall back to redirect if proxy fails
      }
    }

    // Option 2: Redirect to Stripe's hosted invoice (default and fallback)
    if (hostedUrl) {
      console.debug('invoice-download API: Redirecting to hosted invoice', {
        invoiceId: params.id,
        hostedUrl: hostedUrl.substring(0, 50) + '...'
      });

      // Add download parameter to Stripe URL if requested
      const redirectUrl = forceDownload && hostedUrl.includes('?') 
        ? `${hostedUrl}&download=true`
        : forceDownload 
        ? `${hostedUrl}?download=true`
        : hostedUrl;

      return NextResponse.redirect(redirectUrl, 302);
    }

    // Option 3: Direct PDF URL redirect (if no hosted URL)
    if (pdfUrl) {
      console.debug('invoice-download API: Redirecting to PDF URL', {
        invoiceId: params.id,
        pdfUrl: pdfUrl.substring(0, 50) + '...'
      });

      return NextResponse.redirect(pdfUrl, 302);
    }

    // No download options available
    console.error('invoice-download API: No download options available', {
      invoiceId: params.id,
      invoiceStatus: invoice.status,
      hasHostedUrl: !!hostedUrl,
      hasPdfUrl: !!pdfUrl
    });

    return NextResponse.json(
      { 
        error: 'Invoice download not available',
        code: 'NO_DOWNLOAD_URL',
        details: 'This invoice does not have a downloadable URL'
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('invoice-download API: Unexpected error', {
      invoiceId: params.id,
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
