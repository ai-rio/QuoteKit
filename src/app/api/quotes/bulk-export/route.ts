import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { FREE_PLAN_FEATURES, parseStripeMetadata } from '@/types/features';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get quote IDs from request body
    const { quoteIds } = await request.json();
    
    if (!Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json({ error: 'Invalid quote IDs provided' }, { status: 400 });
    }

    // Check bulk operations feature access
    const bulkAccess = await checkBulkOperationsAccess(user.id, supabase, quoteIds.length);
    if (!bulkAccess.hasAccess) {
      return NextResponse.json({
        error: 'Bulk operations not available',
        message: bulkAccess.message,
        upgradeRequired: true,
        feature: 'bulk_operations',
        limit: bulkAccess.limit,
        requested: quoteIds.length
      }, { status: 403 });
    }

    // Also check PDF export access since this is PDF export
    const pdfAccess = await checkPDFExportAccess(user.id, supabase);
    if (!pdfAccess.hasAccess) {
      return NextResponse.json({
        error: 'PDF export not available',
        message: pdfAccess.message,
        upgradeRequired: true,
        feature: 'pdf_export'
      }, { status: 403 });
    }

    // Verify all quotes belong to the user
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, client_name, client_contact, quote_data, subtotal, tax_rate, total, created_at')
      .in('id', quoteIds)
      .eq('user_id', user.id);

    if (quotesError || !quotes) {
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
    }

    if (quotes.length === 0) {
      return NextResponse.json({ error: 'No valid quotes found for export' }, { status: 404 });
    }

    // Get company settings for branding
    const { data: company } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', user.id)
      .single();

    const companyData = company || {
      company_name: null,
      company_address: null,
      company_phone: null,
      logo_url: null,
    };

    // For bulk export, create a ZIP file with all PDFs
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Import PDF generation components
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { QuotePDFTemplate } = await import('@/libs/pdf/quote-template');

    // Generate PDF for each quote
    for (const quote of quotes) {
      try {
        const pdfData = {
          quote: {
            id: quote.id,
            client_name: quote.client_name,
            client_contact: quote.client_contact,
            quote_data: quote.quote_data,
            subtotal: quote.subtotal,
            tax_rate: quote.tax_rate,
            total: quote.total,
            created_at: quote.created_at,
          },
          company: companyData,
          showWatermark: !pdfAccess.hasCustomBranding,
          watermarkText: pdfAccess.hasCustomBranding ? undefined : 'Created with QuoteKit',
        };

        const pdfBuffer = await renderToBuffer(QuotePDFTemplate(pdfData));
        const filename = `quote-${quote.client_name.replace(/[^a-zA-Z0-9]/g, '-')}-${quote.id.slice(0, 8)}.pdf`;
        
        zip.file(filename, pdfBuffer);
      } catch (error) {
        console.error(`Error generating PDF for quote ${quote.id}:`, error);
        // Continue with other quotes
      }
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Increment bulk operations usage counter
    const { error: usageError } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_usage_type: 'bulk_operations',
      p_amount: 1
    });

    if (usageError) {
      console.error('Error incrementing bulk operations usage:', usageError);
      // Don't fail the request, but log the error
    }

    // Return ZIP file
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="quotes-export-${Date.now()}.zip"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error in bulk export operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk export' },
      { status: 500 }
    );
  }
}

/**
 * Check if user can perform bulk operations based on their subscription
 */
async function checkBulkOperationsAccess(userId: string, supabase: any, operationCount: number = 1) {
  try {
    // Get user email for admin check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Admin/test user override - grant full access to carlos@ai.rio.br
    if (user?.email === 'carlos@ai.rio.br') {
      return {
        hasAccess: true,
        limit: 999999 // Very high limit for admin
      }
    }

    // Get user's subscription and features
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stripe_prices!inner (
          *,
          stripe_products!inner (
            metadata
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Parse features from subscription or use free plan defaults
    let features = FREE_PLAN_FEATURES;
    if (subscription?.stripe_prices?.stripe_products?.metadata) {
      features = parseStripeMetadata(subscription.stripe_prices.stripe_products.metadata);
    }

    // Check bulk operations access
    if (!features.bulk_operations) {
      return {
        hasAccess: false,
        message: 'Bulk operations are a premium feature. Upgrade to Pro to perform bulk actions on multiple quotes.',
        limit: 1
      };
    }

    // Check operation count limits for different tiers
    const limits = getBulkOperationLimits(features);
    if (operationCount > limits.maxItemsPerOperation) {
      return {
        hasAccess: false,
        message: `Bulk operation limit exceeded. You can process up to ${limits.maxItemsPerOperation} items at once.`,
        limit: limits.maxItemsPerOperation
      };
    }

    return {
      hasAccess: true,
      limit: limits.maxItemsPerOperation
    };

  } catch (error) {
    console.error('Error checking bulk operations access:', error);
    // On error, deny access to be safe
    return {
      hasAccess: false,
      message: 'Unable to verify bulk operations access. Please try again.',
      limit: 0
    };
  }
}

/**
 * Check if user can export PDFs based on their subscription
 */
async function checkPDFExportAccess(userId: string, supabase: any) {
  try {
    // Get user email for admin check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Admin/test user override - grant full access to carlos@ai.rio.br
    if (user?.email === 'carlos@ai.rio.br') {
      return {
        hasAccess: true,
        hasCustomBranding: true
      }
    }

    // Get user's subscription and features
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stripe_prices!inner (
          *,
          stripe_products!inner (
            metadata
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    // Parse features from subscription or use free plan defaults
    let features = FREE_PLAN_FEATURES
    if (subscription?.stripe_prices?.stripe_products?.metadata) {
      features = parseStripeMetadata(subscription.stripe_prices.stripe_products.metadata)
    }

    // Check PDF export access
    if (!features.pdf_export) {
      return {
        hasAccess: false,
        message: 'PDF export is a premium feature. Upgrade to Pro to export professional PDFs.',
        hasCustomBranding: false
      }
    }

    return {
      hasAccess: true,
      hasCustomBranding: features.custom_branding
    }

  } catch (error) {
    console.error('Error checking PDF access:', error)
    // On error, deny access to be safe
    return {
      hasAccess: false,
      message: 'Unable to verify PDF export access. Please try again.',
      hasCustomBranding: false
    }
  }
}

/**
 * Get bulk operation limits based on plan features
 */
function getBulkOperationLimits(features: any) {
  // Pro plans get higher limits
  if (features.max_quotes === -1) { // Unlimited quotes indicates pro plan
    return {
      maxItemsPerOperation: 100
    };
  }
  
  // Premium plans get moderate limits
  if (features.bulk_operations) {
    return {
      maxItemsPerOperation: 25
    };
  }

  // Free plans don't get bulk operations
  return {
    maxItemsPerOperation: 1
  };
}