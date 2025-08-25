import { renderToBuffer } from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';

import { QuotePDFTemplate } from '@/libs/pdf/quote-template';
import { PDFGenerationOptions } from '@/libs/pdf/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { FREE_PLAN_FEATURES,parseStripeMetadata } from '@/types/features';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[PDF Generation] Starting for user ${user.id}, quote ${id}`);

    // Check PDF export feature access
    const pdfAccess = await checkPDFExportAccess(user.id, supabase);
    if (!pdfAccess.hasAccess) {
      return NextResponse.json({
        error: 'PDF export not available',
        message: pdfAccess.message,
        upgradeRequired: true,
        feature: 'pdf_export'
      }, { status: 403 });
    }

    // Get the quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the quote
      .single();

    if (quoteError || !quote) {
      console.error('[PDF Generation] Quote not found:', quoteError);
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Get company settings
    const { data: company, error: companyError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', user.id) // Fixed: use 'id' instead of 'user_id'
      .single();

    console.log(`[PDF Generation] Company settings query result:`, {
      company: company ? {
        company_name: company.company_name,
        logo_url: company.logo_url,
        hasLogo: !!company.logo_url
      } : null,
      error: companyError
    });

    // If no company settings, use defaults
    const companyData = company || {
      company_name: null,
      company_address: null,
      company_phone: null,
      logo_url: null,
    };

    console.log(`[PDF Generation] Final company data for PDF:`, {
      company_name: companyData.company_name,
      logo_url: companyData.logo_url,
      hasLogo: !!companyData.logo_url
    });

    // Prepare PDF data with watermark info
    const pdfData: PDFGenerationOptions = {
      quote: {
        id: quote.id,
        client_name: quote.client_name,
        client_contact: quote.client_contact,
        quote_data: quote.quote_data as {
          id: string;
          name: string;
          unit: string;
          cost: number;
          quantity: number;
        }[],
        subtotal: quote.subtotal,
        tax_rate: quote.tax_rate,
        total: quote.total,
        created_at: quote.created_at || new Date().toISOString(),
      },
      company: {
        company_name: companyData.company_name,
        company_address: companyData.company_address,
        company_phone: companyData.company_phone,
        logo_url: companyData.logo_url,
      },
      // Add watermark info based on user's plan
      showWatermark: !pdfAccess.hasCustomBranding,
      watermarkText: pdfAccess.hasCustomBranding ? undefined : 'Created with QuoteKit',
    };

    console.log(`[PDF Generation] About to generate PDF with logo URL:`, pdfData.company.logo_url);

    // Generate PDF
    const pdfBuffer = await renderToBuffer(QuotePDFTemplate(pdfData));

    console.log(`[PDF Generation] PDF generated successfully, size: ${pdfBuffer.byteLength} bytes`);

    // Increment PDF export usage counter
    const { error: usageError } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_usage_type: 'pdf_exports',
      p_amount: 1
    });

    if (usageError) {
      console.error('Error incrementing PDF usage:', usageError);
      // Don't fail the request, but log the error
    }

    // Generate filename
    const filename = `quote-${quote.client_name.replace(/[^a-zA-Z0-9]/g, '-')}-${quote.id.slice(0, 8)}.pdf`;

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
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