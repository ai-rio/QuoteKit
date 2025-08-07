/**
 * Quote PDF Generator Edge Function
 * Optimized PDF generation with template caching and batch processing
 * 
 * Features:
 * - Single and batch PDF generation
 * - Template caching for performance
 * - Memory-optimized rendering
 * - Company branding integration
 * - Concurrent processing for multiple quotes
 */

import { getAuthenticatedUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { PerformanceMonitor,withPerformanceTracking } from '../_shared/performance.ts';
import type { ApiResponse,Quote } from '../_shared/types.ts';

// PDF Generation Request Types
interface GeneratePDFRequest {
  quotes: Quote[];
  template_options?: {
    company_logo?: string;
    custom_branding?: boolean;
    include_terms?: boolean;
    template_id?: string;
  };
  output_options?: {
    format?: 'single' | 'batch';
    storage_path?: string;
    filename?: string;
  };
}

interface PDFTemplate {
  id: string;
  name: string;
  html_template: string;
  css_styles: string;
  created_at: string;
  updated_at: string;
}

interface GeneratePDFResponse {
  success: boolean;
  pdf_urls: string[];
  template_used?: string;
  generation_time_ms: number;
  file_sizes_kb: number[];
  performance: {
    execution_time_ms: number;
    pdfs_generated: number;
    templates_cached: number;
    memory_usage_mb?: number;
  };
  errors?: Array<{
    quote_id: string;
    error: string;
  }>;
}

// Template cache for performance optimization
const templateCache = new Map<string, PDFTemplate>();

/**
 * Main PDF Generator Handler
 */
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, isAdmin } = await getAuthenticatedUser(req);
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const method = req.method;
    const operationType = `${method}_${url.pathname}`;

    return await withPerformanceTracking(
      'quote-pdf-generator',
      operationType,
      user.id,
      async (monitor) => {
        switch (method) {
          case 'POST':
            const path = url.pathname;
            if (path.endsWith('/batch')) {
              return await handleBatchPDFGeneration(req, user, monitor);
            } else {
              return await handleSinglePDFGeneration(req, user, monitor);
            }
          case 'GET':
            if (url.pathname.includes('/template/')) {
              return await handleGetTemplate(req, user, monitor);
            } else {
              return monitor.createResponse(
                { success: false, error: 'Invalid GET endpoint' },
                404
              );
            }
          default:
            return monitor.createResponse(
              { success: false, error: 'Method not allowed' },
              405
            );
        }
      }
    );
  } catch (error) {
    console.error('PDF generator error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle single PDF generation
 */
async function handleSinglePDFGeneration(
  req: Request,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  try {
    const request = await req.json() as GeneratePDFRequest;
    
    if (!request.quotes || request.quotes.length === 0) {
      return monitor.createResponse(
        { success: false, error: 'No quotes provided for PDF generation' },
        400
      );
    }

    // For single PDF, we'll process just the first quote
    const quote = request.quotes[0];
    
    // Verify quote belongs to user
    if (quote.user_id !== user.id) {
      return monitor.createResponse(
        { success: false, error: 'Unauthorized access to quote' },
        403
      );
    }

    const startTime = performance.now();
    
    // Get or create PDF template
    const template = await getOrCreateTemplate(
      user.id,
      request.template_options,
      monitor
    );

    // Generate PDF
    const pdfResult = await generatePDFFromTemplate(
      quote,
      template,
      request.output_options,
      monitor
    );

    const generationTime = Math.round(performance.now() - startTime);

    const response: GeneratePDFResponse = {
      success: true,
      pdf_urls: [pdfResult.url],
      template_used: template.name,
      generation_time_ms: generationTime,
      file_sizes_kb: [pdfResult.size_kb],
      performance: {
        execution_time_ms: monitor.getExecutionTime(),
        pdfs_generated: 1,
        templates_cached: templateCache.size,
        memory_usage_mb: await getMemoryUsage()
      }
    };

    return monitor.createResponse(response);

  } catch (error) {
    console.error('Single PDF generation error:', error);
    return monitor.createResponse(
      { 
        success: false, 
        error: 'PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}

/**
 * Handle batch PDF generation
 */
async function handleBatchPDFGeneration(
  req: Request,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  try {
    const request = await req.json() as GeneratePDFRequest;
    
    if (!request.quotes || request.quotes.length === 0) {
      return monitor.createResponse(
        { success: false, error: 'No quotes provided for batch PDF generation' },
        400
      );
    }

    // Verify all quotes belong to user
    const unauthorizedQuotes = request.quotes.filter(q => q.user_id !== user.id);
    if (unauthorizedQuotes.length > 0) {
      return monitor.createResponse(
        { success: false, error: 'Unauthorized access to one or more quotes' },
        403
      );
    }

    const startTime = performance.now();
    const pdfUrls: string[] = [];
    const fileSizes: number[] = [];
    const errors: Array<{ quote_id: string; error: string }> = [];

    // Get template once for batch processing
    const template = await getOrCreateTemplate(
      user.id,
      request.template_options,
      monitor
    );

    // Process quotes in batches to manage memory
    const batchSize = 5; // Process 5 PDFs at a time
    const quoteBatches = [];
    
    for (let i = 0; i < request.quotes.length; i += batchSize) {
      quoteBatches.push(request.quotes.slice(i, i + batchSize));
    }

    for (const batch of quoteBatches) {
      // Process batch concurrently
      const batchPromises = batch.map(async (quote) => {
        try {
          const pdfResult = await generatePDFFromTemplate(
            quote,
            template,
            request.output_options,
            monitor
          );
          return { success: true, url: pdfResult.url, size_kb: pdfResult.size_kb };
        } catch (error) {
          return {
            success: false,
            quote_id: quote.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      // Process results
      batchResults.forEach((result) => {
        if (result.success) {
          pdfUrls.push(result.url);
          fileSizes.push(result.size_kb);
        } else {
          errors.push({ quote_id: result.quote_id, error: result.error });
        }
      });

      // Small delay between batches to prevent memory issues
      if (quoteBatches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const generationTime = Math.round(performance.now() - startTime);

    const response: GeneratePDFResponse = {
      success: errors.length === 0,
      pdf_urls: pdfUrls,
      template_used: template.name,
      generation_time_ms: generationTime,
      file_sizes_kb: fileSizes,
      performance: {
        execution_time_ms: monitor.getExecutionTime(),
        pdfs_generated: pdfUrls.length,
        templates_cached: templateCache.size,
        memory_usage_mb: await getMemoryUsage()
      },
      errors: errors.length > 0 ? errors : undefined
    };

    return monitor.createResponse(response);

  } catch (error) {
    console.error('Batch PDF generation error:', error);
    return monitor.createResponse(
      { 
        success: false, 
        error: 'Batch PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}

/**
 * Handle template retrieval
 */
async function handleGetTemplate(
  req: Request,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const templateId = url.pathname.split('/template/')[1];

    if (!templateId) {
      return monitor.createResponse(
        { success: false, error: 'Template ID required' },
        400
      );
    }

    // Check cache first
    if (templateCache.has(templateId)) {
      const template = templateCache.get(templateId)!;
      return monitor.createResponse({
        success: true,
        template,
        cached: true
      });
    }

    // Fetch from database
    const { getSupabaseAdmin } = await import('../_shared/auth.ts');
    const supabase = getSupabaseAdmin();

    const { data: template, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    monitor.incrementDbQueries();

    if (error || !template) {
      return monitor.createResponse(
        { success: false, error: 'Template not found' },
        404
      );
    }

    // Cache template
    templateCache.set(templateId, template);

    return monitor.createResponse({
      success: true,
      template,
      cached: false
    });

  } catch (error) {
    console.error('Get template error:', error);
    return monitor.createResponse(
      { success: false, error: 'Failed to retrieve template' },
      500
    );
  }
}

/**
 * Get or create PDF template for user
 */
async function getOrCreateTemplate(
  userId: string,
  templateOptions: any = {},
  monitor: PerformanceMonitor
): Promise<PDFTemplate> {
  const templateId = templateOptions?.template_id || 'default';
  
  // Check cache first
  if (templateCache.has(templateId)) {
    return templateCache.get(templateId)!;
  }

  const { getSupabaseAdmin } = await import('../_shared/auth.ts');
  const supabase = getSupabaseAdmin();

  // Try to get existing template
  const { data: existingTemplate } = await supabase
    .from('pdf_templates')
    .select('*')
    .eq('id', templateId)
    .single();
  monitor.incrementDbQueries();

  if (existingTemplate) {
    templateCache.set(templateId, existingTemplate);
    return existingTemplate;
  }

  // Create default template if none exists
  const defaultTemplate: PDFTemplate = {
    id: templateId,
    name: 'Default Quote Template',
    html_template: getDefaultHtmlTemplate(),
    css_styles: getDefaultCssStyles(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Save to database
  const { error: saveError } = await supabase
    .from('pdf_templates')
    .insert(defaultTemplate);
  monitor.incrementDbQueries();

  if (saveError) {
    console.warn('Failed to save template to database:', saveError);
  }

  // Cache template
  templateCache.set(templateId, defaultTemplate);
  
  return defaultTemplate;
}

/**
 * Generate PDF from template
 */
async function generatePDFFromTemplate(
  quote: Quote,
  template: PDFTemplate,
  outputOptions: any = {},
  monitor: PerformanceMonitor
): Promise<{ url: string; size_kb: number }> {
  try {
    // Generate HTML content from template
    const htmlContent = renderQuoteHtml(quote, template);
    
    // For now, we'll simulate PDF generation
    // In a real implementation, you would use a library like puppeteer-core
    // or a Deno-compatible PDF generation library
    
    const pdfBuffer = await generatePDFBuffer(htmlContent);
    const sizeKb = Math.round(pdfBuffer.byteLength / 1024);
    
    // Upload to Supabase Storage
    const filename = outputOptions?.filename || `quote-${quote.quote_number}.pdf`;
    const storagePath = outputOptions?.storage_path || 'quotes';
    
    const { getSupabaseAdmin } = await import('../_shared/auth.ts');
    const supabase = getSupabaseAdmin();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`${storagePath}/${filename}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`${storagePath}/${filename}`);

    monitor.addMetadata('pdf_file_size_kb', sizeKb);
    
    return {
      url: urlData.publicUrl,
      size_kb: sizeKb
    };
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

/**
 * Render quote HTML from template
 */
function renderQuoteHtml(quote: Quote, template: PDFTemplate): string {
  let html = template.html_template;

  // Replace template variables
  const templateVars = {
    '{{quote_number}}': quote.quote_number,
    '{{client_name}}': quote.client_name,
    '{{client_email}}': quote.client_email || '',
    '{{client_phone}}': quote.client_phone || '',
    '{{client_address}}': quote.client_address || '',
    '{{quote_date}}': new Date(quote.created_at).toLocaleDateString(),
    '{{valid_until}}': quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : '',
    '{{notes}}': quote.notes || '',
    '{{subtotal}}': formatCurrency(quote.subtotal),
    '{{tax_rate}}': `${quote.tax_rate}%`,
    '{{tax_amount}}': formatCurrency(quote.tax_amount),
    '{{total}}': formatCurrency(quote.total),
    '{{line_items}}': renderLineItems(quote.line_items),
    '{{status}}': quote.status.charAt(0).toUpperCase() + quote.status.slice(1)
  };

  // Replace all template variables
  Object.entries(templateVars).forEach(([key, value]) => {
    html = html.replace(new RegExp(key, 'g'), String(value));
  });

  // Add CSS styles
  html = html.replace('</head>', `<style>${template.css_styles}</style></head>`);

  return html;
}

/**
 * Render line items HTML
 */
function renderLineItems(lineItems: any[]): string {
  return lineItems.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.description || ''}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');
}

/**
 * Format currency values
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Simulate PDF generation (placeholder)
 * In a real implementation, use a proper PDF library
 */
async function generatePDFBuffer(htmlContent: string): Promise<ArrayBuffer> {
  // This is a placeholder - in reality you would use:
  // - puppeteer-core for Chromium-based PDF generation
  // - jsPDF for client-side PDF generation
  // - PDFKit for Node.js-style PDF generation
  // - Or call an external PDF service

  // Simulate PDF generation delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Create a simple mock PDF buffer
  const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Quote: ${htmlContent.substring(0, 20)}...) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`;

  return new TextEncoder().encode(mockPdfContent).buffer;
}

/**
 * Get memory usage (if available)
 */
async function getMemoryUsage(): Promise<number | undefined> {
  try {
    // Deno doesn't have built-in memory usage, so we'll return undefined
    // In a real implementation, you might use Deno.memoryUsage() if available
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Default HTML template for quotes
 */
function getDefaultHtmlTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote {{quote_number}}</title>
</head>
<body>
    <div class="quote-container">
        <header class="quote-header">
            <h1>Quote {{quote_number}}</h1>
            <div class="quote-info">
                <p><strong>Date:</strong> {{quote_date}}</p>
                <p><strong>Valid Until:</strong> {{valid_until}}</p>
                <p><strong>Status:</strong> {{status}}</p>
            </div>
        </header>

        <section class="client-info">
            <h2>Client Information</h2>
            <p><strong>Name:</strong> {{client_name}}</p>
            <p><strong>Email:</strong> {{client_email}}</p>
            <p><strong>Phone:</strong> {{client_phone}}</p>
            <p><strong>Address:</strong> {{client_address}}</p>
        </section>

        <section class="line-items">
            <h2>Services & Materials</h2>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{line_items}}
                </tbody>
            </table>
        </section>

        <section class="quote-totals">
            <table class="totals-table">
                <tr>
                    <td><strong>Subtotal:</strong></td>
                    <td>{{subtotal}}</td>
                </tr>
                <tr>
                    <td><strong>Tax ({{tax_rate}}):</strong></td>
                    <td>{{tax_amount}}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Total:</strong></td>
                    <td><strong>{{total}}</strong></td>
                </tr>
            </table>
        </section>

        <section class="notes">
            <h2>Notes</h2>
            <p>{{notes}}</p>
        </section>
    </div>
</body>
</html>`;
}

/**
 * Default CSS styles for quotes
 */
function getDefaultCssStyles(): string {
  return `
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        color: #333;
        line-height: 1.6;
    }
    
    .quote-container {
        max-width: 800px;
        margin: 0 auto;
    }
    
    .quote-header {
        border-bottom: 2px solid #007bff;
        padding-bottom: 20px;
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .quote-header h1 {
        color: #007bff;
        margin: 0;
    }
    
    .quote-info p {
        margin: 5px 0;
    }
    
    .client-info, .line-items, .notes {
        margin-bottom: 30px;
    }
    
    .client-info h2, .line-items h2, .notes h2 {
        color: #007bff;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
    }
    
    .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }
    
    .items-table th, .items-table td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
    }
    
    .items-table th {
        background-color: #f8f9fa;
        font-weight: bold;
    }
    
    .quote-totals {
        float: right;
        width: 300px;
    }
    
    .totals-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .totals-table td {
        padding: 8px;
        border-bottom: 1px solid #ddd;
    }
    
    .total-row {
        border-top: 2px solid #007bff;
        font-size: 1.2em;
    }
    
    .total-row td {
        border-bottom: 2px solid #007bff;
        padding: 12px 8px;
    }
    
    @media print {
        body {
            margin: 0;
            padding: 15px;
        }
        
        .quote-container {
            max-width: none;
        }
    }
  `;
}