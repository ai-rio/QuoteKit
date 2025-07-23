import { NextRequest, NextResponse } from 'next/server';

import { QuotePDFTemplate } from '@/libs/pdf/quote-template';
import { PDFGenerationOptions } from '@/libs/pdf/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { renderToBuffer } from '@react-pdf/renderer';

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

    // Get the quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the quote
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Get company settings
    const { data: company, error: companyError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no company settings, use defaults
    const companyData = company || {
      company_name: null,
      company_address: null,
      company_phone: null,
      logo_url: null,
    };

    // Prepare PDF data
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
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(QuotePDFTemplate(pdfData));

    // Generate filename
    const filename = `quote-${quote.client_name.replace(/[^a-zA-Z0-9]/g, '-')}-${quote.id.slice(0, 8)}.pdf`;

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
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