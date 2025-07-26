import React from 'react';
import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/features/account/controllers/get-session';
import QuoteEmail from '@/features/emails/quote-email';
import { getCompanySettings } from '@/features/settings/actions';
import { emailService } from '@/libs/email/email-service';
import { QuotePDFTemplate } from '@/libs/pdf/quote-template';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { renderToBuffer } from '@react-pdf/renderer';

interface EmailQuoteRequest {
  to?: string;
  subject?: string;
  message?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, message }: EmailQuoteRequest = await request.json();
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Get company settings
    const companySettingsResponse = await getCompanySettings();
    const companySettings = companySettingsResponse?.data;

    // Validate email recipient
    const emailTo = to || quote.client_contact;
    if (!emailTo) {
      return NextResponse.json(
        { error: 'No recipient email address provided' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTo)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Generate PDF attachment directly
    let pdfBuffer = null;
    // TODO: Fix PDF generation - temporarily disabled due to type conflicts
    // The QuotePDFTemplate component needs proper Document wrapper for renderToBuffer
    console.log('PDF generation temporarily disabled - requires Document wrapper fix');

    // Send email
    const emailResult = await emailService.sendEmail({
      to: emailTo,
      from: companySettings?.company_email || session.user.email || 'noreply@quotekit.dev',
      subject: subject || `Quote #${quote.quote_number || quote.id.slice(0, 8)} from ${companySettings?.company_name || 'Your Company'}`,
      component: React.createElement(QuoteEmail, {
        quote: {
          id: quote.id,
          quote_number: quote.quote_number || `Q-${quote.id.slice(0, 8)}`,
          client_name: quote.client_name,
          total: quote.total,
          expires_at: quote.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        company: {
          name: companySettings?.company_name || 'Your Company',
          email: companySettings?.company_email || session.user.email || '',
          phone: companySettings?.company_phone || undefined,
          address: companySettings?.company_address || undefined,
          logo: companySettings?.logo_url || undefined,
        },
      }),
      attachments: pdfBuffer ? [
        {
          filename: `quote-${quote.quote_number || quote.id.slice(0, 8)}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ] : [],
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update quote status to 'sent' and set sent_at timestamp
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', quote.id);

    if (updateError) {
      console.error('Failed to update quote status:', updateError);
      // Don't fail the request since email was sent successfully
    }

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      timestamp: emailResult.timestamp,
    });

  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}