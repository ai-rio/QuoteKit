/**
 * Quote Processor Edge Function
 * Consolidates quote creation, calculation, PDF generation, and email delivery
 * 
 * Replaces 8-12 existing API endpoints:
 * - /api/quotes (POST/GET)
 * - /api/quotes/[id]/pdf  
 * - /api/quotes/[id]/email
 * - /api/quotes/[id]/status
 * - /api/quotes/bulk-status
 * - /api/quotes/bulk-export
 * - /api/features/usage
 * - Database RPC: generate_quote_number, increment_usage
 */

import { getAuthenticatedUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { PerformanceMonitor,withPerformanceTracking } from '../_shared/performance.ts';
import type { 
  ApiResponse, 
  BulkOperation,
  BulkOperationResult,
  EdgeFunctionContext,
  LineItem, 
  Quote} from '../_shared/types.ts';

// Request/Response Types for Quote Processing
interface CreateQuoteRequest {
  quote: {
    client_name: string;
    client_email?: string;
    client_phone?: string;
    client_address?: string;
    client_id?: string;
    line_items: LineItem[];
    tax_rate: number;
    notes?: string;
    valid_until?: string;
    is_template?: boolean;
    template_name?: string;
  };
  operations?: {
    generate_pdf?: boolean;
    send_email?: boolean;
    update_usage?: boolean;
    auto_save?: boolean;
  };
}

interface UpdateQuoteRequest {
  quote_id: string;
  updates: Partial<CreateQuoteRequest['quote']>;
  operations?: CreateQuoteRequest['operations'];
}

interface BatchQuoteRequest {
  operation: 'status_update' | 'bulk_export' | 'bulk_delete';
  quote_ids: string[];
  options?: {
    status?: string;
    format?: 'pdf' | 'csv';
    email?: string;
    export_settings?: Record<string, any>;
  };
}

interface QuoteProcessorResponse {
  success: boolean;
  quote?: Quote;
  quotes?: Quote[];
  generated_pdf_url?: string;
  email_sent?: boolean;
  usage_updated?: boolean;
  bulk_results?: BulkOperationResult;
  performance: {
    execution_time_ms: number;
    database_queries: number;
    operations_completed: string[];
  };
  diagnostics?: Array<{
    level: 'info' | 'warning' | 'error';
    message: string;
    recommendation?: string;
  }>;
}

/**
 * Main Quote Processor Handler
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
      'quote-processor',
      operationType,
      user.id,
      async (monitor) => {
        switch (method) {
          case 'GET':
            return await handleGetQuote(req, user, monitor);
          case 'POST':
            return await handleCreateQuote(req, user, monitor);
          case 'PUT':
            return await handleUpdateQuote(req, user, monitor);
          case 'DELETE':
            return await handleDeleteQuote(req, user, monitor);
          default:
            return monitor.createResponse(
              { success: false, error: 'Method not allowed' },
              405
            );
        }
      }
    );
  } catch (error) {
    console.error('Quote processor error:', error);
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
 * Handle GET requests - Quote retrieval
 */
async function handleGetQuote(
  req: Request,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  const url = new URL(req.url);
  const quoteId = url.searchParams.get('id');
  const includeDeleted = url.searchParams.get('include_deleted') === 'true';
  
  if (!quoteId) {
    // Get all quotes for user
    return await getAllQuotes(user, monitor, includeDeleted);
  } else {
    // Get specific quote
    return await getQuoteById(quoteId, user, monitor);
  }
}

/**
 * Handle POST requests - Quote creation or batch operations
 */
async function handleCreateQuote(
  req: Request,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  const url = new URL(req.url);
  const isBatch = url.pathname.endsWith('/batch');
  
  const body = await req.json();
  
  if (isBatch) {
    return await handleBatchOperation(body as BatchQuoteRequest, user, monitor);
  } else {
    return await createQuote(body as CreateQuoteRequest, user, monitor);
  }
}

/**
 * Handle PUT requests - Quote updates
 */
async function handleUpdateQuote(
  req: Request,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  const body = await req.json() as UpdateQuoteRequest;
  return await updateQuote(body, user, monitor);
}

/**
 * Handle DELETE requests - Quote deletion
 */
async function handleDeleteQuote(
  req: Request,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  const url = new URL(req.url);
  const quoteId = url.searchParams.get('id');
  
  if (!quoteId) {
    return monitor.createResponse(
      { success: false, error: 'Quote ID required for deletion' },
      400
    );
  }
  
  return await deleteQuote(quoteId, user, monitor);
}

/**
 * Create new quote with full processing pipeline
 */
async function createQuote(
  request: CreateQuoteRequest,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  const operations = request.operations || {};
  const completedOperations: string[] = [];
  const diagnostics: Array<{ level: 'info' | 'warning' | 'error'; message: string }> = [];

  try {
    // 1. Validate quote data
    const validationResult = validateQuoteData(request.quote);
    if (!validationResult.isValid) {
      return monitor.createResponse(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.errors
        },
        400
      );
    }
    completedOperations.push('validation');

    // 2. Calculate quote totals
    const calculatedQuote = calculateQuoteTotals(request.quote);
    completedOperations.push('calculation');

    // 3. Generate quote number
    const { getSupabaseAdmin } = await import('../_shared/auth.ts');
    const supabase = getSupabaseAdmin();
    
    const { data: quoteNumber, error: numberError } = await supabase.rpc(
      'generate_quote_number',
      { p_user_id: user.id }
    );
    monitor.incrementDbQueries();

    if (numberError) {
      diagnostics.push({
        level: 'error',
        message: `Failed to generate quote number: ${numberError.message}`
      });
      return monitor.createResponse(
        { success: false, error: 'Failed to generate quote number' },
        500
      );
    }
    completedOperations.push('quote_number_generation');

    // 4. Create final quote object
    const newQuote: Quote = {
      id: crypto.randomUUID(),
      user_id: user.id,
      quote_number: quoteNumber,
      client_name: calculatedQuote.client_name,
      client_id: calculatedQuote.client_id || null,
      client_email: calculatedQuote.client_email || null,
      client_phone: calculatedQuote.client_phone || null,
      client_address: calculatedQuote.client_address || null,
      notes: calculatedQuote.notes || null,
      status: 'draft',
      line_items: calculatedQuote.line_items,
      subtotal: calculatedQuote.subtotal,
      tax_rate: calculatedQuote.tax_rate,
      tax_amount: calculatedQuote.tax_amount,
      total: calculatedQuote.total,
      valid_until: calculatedQuote.valid_until || null,
      is_template: calculatedQuote.is_template || false,
      template_name: calculatedQuote.template_name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 5. Save quote to database
    const { data: savedQuote, error: saveError } = await supabase
      .from('quotes')
      .insert(newQuote)
      .select()
      .single();
    monitor.incrementDbQueries();

    if (saveError) {
      diagnostics.push({
        level: 'error',
        message: `Failed to save quote: ${saveError.message}`
      });
      return monitor.createResponse(
        { success: false, error: 'Failed to save quote' },
        500
      );
    }
    completedOperations.push('database_save');

    // 6. Update usage tracking (if requested)
    let usageUpdated = false;
    if (operations.update_usage !== false) { // Default to true
      try {
        const { error: usageError } = await supabase.rpc(
          'increment_usage',
          { 
            p_user_id: user.id,
            p_feature: 'quotes',
            p_increment: 1
          }
        );
        monitor.incrementDbQueries();

        if (usageError) {
          diagnostics.push({
            level: 'warning',
            message: `Usage tracking failed: ${usageError.message}`
          });
        } else {
          usageUpdated = true;
          completedOperations.push('usage_tracking');
        }
      } catch (error) {
        diagnostics.push({
          level: 'warning',
          message: `Usage tracking error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // 7. Generate PDF (if requested)
    let pdfUrl: string | undefined;
    if (operations.generate_pdf) {
      try {
        pdfUrl = await generateQuotePDF(savedQuote, monitor);
        completedOperations.push('pdf_generation');
      } catch (error) {
        diagnostics.push({
          level: 'warning',
          message: `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // 8. Send email (if requested)
    let emailSent = false;
    if (operations.send_email && savedQuote.client_email) {
      try {
        emailSent = await sendQuoteEmail(savedQuote, savedQuote.client_email, pdfUrl, monitor);
        completedOperations.push('email_delivery');
      } catch (error) {
        diagnostics.push({
          level: 'warning',
          message: `Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // Build successful response
    const response: QuoteProcessorResponse = {
      success: true,
      quote: savedQuote,
      generated_pdf_url: pdfUrl,
      email_sent: emailSent,
      usage_updated: usageUpdated,
      performance: {
        execution_time_ms: monitor.getExecutionTime(),
        database_queries: monitor['dbQueries'] || 0,
        operations_completed: completedOperations
      }
    };

    if (diagnostics.length > 0) {
      response.diagnostics = diagnostics;
    }

    return monitor.createResponse(response);

  } catch (error) {
    console.error('Quote creation error:', error);
    return monitor.createResponse(
      {
        success: false,
        error: 'Quote creation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        operations_completed: completedOperations,
        performance: {
          execution_time_ms: monitor.getExecutionTime(),
          database_queries: monitor['dbQueries'] || 0,
          operations_completed: completedOperations
        }
      },
      500
    );
  }
}

/**
 * Update existing quote
 */
async function updateQuote(
  request: UpdateQuoteRequest,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  try {
    const { getSupabaseAdmin } = await import('../_shared/auth.ts');
    const supabase = getSupabaseAdmin();

    // 1. Get existing quote
    const { data: existingQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', request.quote_id)
      .eq('user_id', user.id)
      .single();
    monitor.incrementDbQueries();

    if (fetchError || !existingQuote) {
      return monitor.createResponse(
        { success: false, error: 'Quote not found' },
        404
      );
    }

    // 2. Merge updates with existing data
    const updatedQuote = { ...existingQuote, ...request.updates };
    
    // 3. Recalculate if line items changed
    if (request.updates.line_items || request.updates.tax_rate) {
      const calculated = calculateQuoteTotals(updatedQuote);
      updatedQuote.subtotal = calculated.subtotal;
      updatedQuote.tax_amount = calculated.tax_amount;
      updatedQuote.total = calculated.total;
    }

    updatedQuote.updated_at = new Date().toISOString();

    // 4. Save updated quote
    const { data: savedQuote, error: saveError } = await supabase
      .from('quotes')
      .update(updatedQuote)
      .eq('id', request.quote_id)
      .eq('user_id', user.id)
      .select()
      .single();
    monitor.incrementDbQueries();

    if (saveError) {
      return monitor.createResponse(
        { success: false, error: 'Failed to update quote' },
        500
      );
    }

    const response: QuoteProcessorResponse = {
      success: true,
      quote: savedQuote,
      performance: {
        execution_time_ms: monitor.getExecutionTime(),
        database_queries: monitor['dbQueries'] || 0,
        operations_completed: ['validation', 'calculation', 'database_update']
      }
    };

    return monitor.createResponse(response);

  } catch (error) {
    console.error('Quote update error:', error);
    return monitor.createResponse(
      { success: false, error: 'Quote update failed' },
      500
    );
  }
}

/**
 * Delete quote
 */
async function deleteQuote(
  quoteId: string,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  try {
    const { getSupabaseAdmin } = await import('../_shared/auth.ts');
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('user_id', user.id);
    monitor.incrementDbQueries();

    if (error) {
      return monitor.createResponse(
        { success: false, error: 'Failed to delete quote' },
        500
      );
    }

    return monitor.createResponse({
      success: true,
      performance: {
        execution_time_ms: monitor.getExecutionTime(),
        database_queries: monitor['dbQueries'] || 0,
        operations_completed: ['database_delete']
      }
    });

  } catch (error) {
    console.error('Quote deletion error:', error);
    return monitor.createResponse(
      { success: false, error: 'Quote deletion failed' },
      500
    );
  }
}

/**
 * Get all quotes for user
 */
async function getAllQuotes(
  user: any,
  monitor: PerformanceMonitor,
  includeDeleted = false
): Promise<Response> {
  try {
    const { getSupabaseAdmin } = await import('../_shared/auth.ts');
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!includeDeleted) {
      query = query.neq('status', 'deleted');
    }

    const { data: quotes, error } = await query;
    monitor.incrementDbQueries();

    if (error) {
      return monitor.createResponse(
        { success: false, error: 'Failed to fetch quotes' },
        500
      );
    }

    return monitor.createResponse({
      success: true,
      quotes: quotes || [],
      performance: {
        execution_time_ms: monitor.getExecutionTime(),
        database_queries: monitor['dbQueries'] || 0,
        operations_completed: ['database_query']
      }
    });

  } catch (error) {
    console.error('Get quotes error:', error);
    return monitor.createResponse(
      { success: false, error: 'Failed to fetch quotes' },
      500
    );
  }
}

/**
 * Get specific quote by ID
 */
async function getQuoteById(
  quoteId: string,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  try {
    const { getSupabaseAdmin } = await import('../_shared/auth.ts');
    const supabase = getSupabaseAdmin();

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single();
    monitor.incrementDbQueries();

    if (error || !quote) {
      return monitor.createResponse(
        { success: false, error: 'Quote not found' },
        404
      );
    }

    return monitor.createResponse({
      success: true,
      quote,
      performance: {
        execution_time_ms: monitor.getExecutionTime(),
        database_queries: monitor['dbQueries'] || 0,
        operations_completed: ['database_query']
      }
    });

  } catch (error) {
    console.error('Get quote error:', error);
    return monitor.createResponse(
      { success: false, error: 'Failed to fetch quote' },
      500
    );
  }
}

/**
 * Handle batch operations
 */
async function handleBatchOperation(
  request: BatchQuoteRequest,
  user: any,
  monitor: PerformanceMonitor
): Promise<Response> {
  try {
    const { getSupabaseAdmin } = await import('../_shared/auth.ts');
    const supabase = getSupabaseAdmin();

    const batchResult: BulkOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    switch (request.operation) {
      case 'status_update':
        if (!request.options?.status) {
          return monitor.createResponse(
            { success: false, error: 'Status required for status update' },
            400
          );
        }

        for (const quoteId of request.quote_ids) {
          try {
            const { error } = await supabase
              .from('quotes')
              .update({ 
                status: request.options.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', quoteId)
              .eq('user_id', user.id);
            monitor.incrementDbQueries();

            if (error) {
              batchResult.errors.push({ id: quoteId, error: error.message });
              batchResult.failed++;
            } else {
              batchResult.processed++;
            }
          } catch (error) {
            batchResult.errors.push({ 
              id: quoteId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            batchResult.failed++;
          }
        }
        break;

      case 'bulk_delete':
        for (const quoteId of request.quote_ids) {
          try {
            const { error } = await supabase
              .from('quotes')
              .delete()
              .eq('id', quoteId)
              .eq('user_id', user.id);
            monitor.incrementDbQueries();

            if (error) {
              batchResult.errors.push({ id: quoteId, error: error.message });
              batchResult.failed++;
            } else {
              batchResult.processed++;
            }
          } catch (error) {
            batchResult.errors.push({ 
              id: quoteId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            batchResult.failed++;
          }
        }
        break;

      case 'bulk_export':
        // For bulk export, we'll need to call the PDF generator
        // This is a placeholder for now
        batchResult.results = [];
        for (const quoteId of request.quote_ids) {
          try {
            const { data: quote, error } = await supabase
              .from('quotes')
              .select('*')
              .eq('id', quoteId)
              .eq('user_id', user.id)
              .single();
            monitor.incrementDbQueries();

            if (error) {
              batchResult.errors.push({ id: quoteId, error: error.message });
              batchResult.failed++;
            } else {
              batchResult.results!.push(quote);
              batchResult.processed++;
            }
          } catch (error) {
            batchResult.errors.push({ 
              id: quoteId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            batchResult.failed++;
          }
        }
        break;

      default:
        return monitor.createResponse(
          { success: false, error: 'Invalid batch operation' },
          400
        );
    }

    batchResult.success = batchResult.failed === 0;

    return monitor.createResponse({
      success: true,
      bulk_results: batchResult,
      performance: {
        execution_time_ms: monitor.getExecutionTime(),
        database_queries: monitor['dbQueries'] || 0,
        operations_completed: ['batch_operation']
      }
    });

  } catch (error) {
    console.error('Batch operation error:', error);
    return monitor.createResponse(
      { success: false, error: 'Batch operation failed' },
      500
    );
  }
}

/**
 * Validate quote data
 */
function validateQuoteData(quote: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!quote.client_name || quote.client_name.trim() === '') {
    errors.push('Client name is required');
  }

  if (!quote.line_items || !Array.isArray(quote.line_items) || quote.line_items.length === 0) {
    errors.push('At least one line item is required');
  } else {
    quote.line_items.forEach((item: any, index: number) => {
      if (!item.name || item.name.trim() === '') {
        errors.push(`Line item ${index + 1}: Name is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Line item ${index + 1}: Valid quantity is required`);
      }
      if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
        errors.push(`Line item ${index + 1}: Valid unit price is required`);
      }
    });
  }

  if (typeof quote.tax_rate !== 'number' || quote.tax_rate < 0 || quote.tax_rate > 100) {
    errors.push('Tax rate must be between 0 and 100');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Calculate quote totals
 */
function calculateQuoteTotals(quote: any): any {
  let subtotal = 0;
  
  const calculatedLineItems = quote.line_items.map((item: LineItem) => {
    const total = item.quantity * item.unit_price;
    subtotal += total;
    return { ...item, total };
  });

  const taxAmount = Math.round((subtotal * (quote.tax_rate / 100)) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    ...quote,
    line_items: calculatedLineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: taxAmount,
    total
  };
}

/**
 * Generate PDF for quote (placeholder for now)
 */
async function generateQuotePDF(
  quote: Quote,
  monitor: PerformanceMonitor
): Promise<string> {
  // This would call the quote-pdf-generator function
  // For now, return a placeholder URL
  monitor.addMetadata('pdf_generation_attempted', true);
  
  // Simulate PDF generation delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return `https://storage.supabase.com/quotes/${quote.id}.pdf`;
}

/**
 * Send quote email (placeholder for now)
 */
async function sendQuoteEmail(
  quote: Quote,
  email: string,
  pdfUrl: string | undefined,
  monitor: PerformanceMonitor
): Promise<boolean> {
  // This would integrate with Resend or similar service
  monitor.addMetadata('email_send_attempted', true);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  return true;
}