'use server';

import { renderToBuffer } from '@react-pdf/renderer';
import { revalidatePath } from 'next/cache';
import React from 'react';

import { getSession } from '@/features/account/controllers/get-session';
import QuoteEmail from '@/features/emails/quote-email';
import { getCompanySettings } from '@/features/settings/actions';
import { emailService } from '@/libs/email/email-service';
import { QuotePDFTemplate } from '@/libs/pdf/quote-template';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export interface SendQuoteEmailData {
  quoteId: string;
  to?: string;
  subject?: string;
  message?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export async function sendQuoteEmail(data: SendQuoteEmailData): Promise<EmailResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'You must be logged in to send emails',
        timestamp: new Date().toISOString(),
      };
    }

    const supabase = await createSupabaseServerClient();

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', data.quoteId)
      .eq('user_id', session.user.id)
      .single();

    if (quoteError || !quote) {
      return {
        success: false,
        error: 'Quote not found',
        timestamp: new Date().toISOString(),
      };
    }

    // Get company settings
    const companySettingsResponse = await getCompanySettings();
    const companySettings = companySettingsResponse?.data;

    // Validate email recipient
    const emailTo = data.to || quote.client_contact;
    if (!emailTo) {
      return {
        success: false,
        error: 'No recipient email address provided',
        timestamp: new Date().toISOString(),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTo)) {
      return {
        success: false,
        error: 'Invalid email address format',
        timestamp: new Date().toISOString(),
      };
    }

    // Generate PDF attachment directly
    let pdfBuffer = null;
    try {
      const pdfData = {
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
          company_name: companySettings?.company_name || 'Your Company',
          company_address: companySettings?.company_address || null,
          company_phone: companySettings?.company_phone || null,
          logo_url: companySettings?.logo_url || null,
        },
      };
      
      pdfBuffer = await renderToBuffer(React.createElement(QuotePDFTemplate, pdfData) as any);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      // Continue without PDF attachment
    }

    // Send email
    const emailResult = await emailService.sendEmail({
      to: emailTo,
      from: companySettings?.company_email || session.user.email || 'noreply@quotekit.dev',
      subject: data.subject || `Quote #${quote.quote_number || quote.id.slice(0, 8)} from ${companySettings?.company_name || 'Your Company'}`,
      component: React.createElement(QuoteEmail, {
        quote: {
          id: quote.id,
          quote_number: quote.quote_number || `Q-${quote.id.slice(0, 8)}`,
          client_name: quote.client_name,
          total: quote.total,
          expires_at: quote.expires_at || '',
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
      return {
        success: false,
        error: emailResult.error || 'Failed to send email',
        timestamp: new Date().toISOString(),
      };
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

    // Revalidate quotes page to show updated status
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${quote.id}`);

    return {
      success: true,
      messageId: emailResult.messageId,
      timestamp: emailResult.timestamp,
    };

  } catch (error) {
    console.error('Send Quote Email Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function resendQuoteEmail(quoteId: string): Promise<EmailResponse> {
  return sendQuoteEmail({ quoteId });
}

export async function sendBulkQuoteEmails(quoteIds: string[]): Promise<{
  success: boolean;
  results: Array<{ quoteId: string; success: boolean; error?: string }>;
  timestamp: string;
}> {
  // Check bulk operations access for multiple emails
  if (quoteIds.length > 1) {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        results: quoteIds.map(id => ({ 
          quoteId: id, 
          success: false, 
          error: 'User not authenticated' 
        })),
        timestamp: new Date().toISOString()
      };
    }

    const supabase = await createSupabaseServerClient();
    const bulkAccess = await checkBulkOperationsAccess(session.user.id, supabase);
    if (!bulkAccess.hasAccess) {
      return {
        success: false,
        results: quoteIds.map(id => ({ 
          quoteId: id, 
          success: false, 
          error: bulkAccess.message 
        })),
        timestamp: new Date().toISOString()
      };
    }
  }

  const results = [];
  
  for (const quoteId of quoteIds) {
    const result = await sendQuoteEmail({ quoteId });
    results.push({
      quoteId,
      success: result.success,
      error: result.error,
    });
  }

  const allSuccessful = results.every(r => r.success);
  
  return {
    success: allSuccessful,
    results,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if user has access to bulk operations feature
 */
async function checkBulkOperationsAccess(userId: string, supabase: any) {
  try {
    // Import here to avoid circular dependencies
    const { parseStripeMetadata, FREE_PLAN_FEATURES } = await import('@/types/features');
    
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

    // Check bulk operations access
    if (!features.bulk_operations) {
      return {
        hasAccess: false,
        message: 'Bulk operations are a premium feature. Upgrade to Pro to send multiple emails at once.'
      }
    }

    return {
      hasAccess: true
    }

  } catch (error) {
    console.error('Error checking bulk operations access:', error)
    // On error, deny access to be safe
    return {
      hasAccess: false,
      message: 'Unable to verify bulk operations access. Please try again.'
    }
  }
}
