/**
 * Sprint 3: Batch Processor Edge Function
 * Handles bulk operations with progress tracking and error handling
 * Supports up to 1000 items per request with chunked processing
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { authenticateUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { recordPerformance } from '../_shared/performance.ts';
import {
  ApiResponse,
  BulkOperation,
  BulkOperationResult,
  EdgeFunctionContext,
  PerformanceMetrics,
  ValidationResult
} from '../_shared/types.ts';
// Import shared utilities
import { 
  chunkArray,
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
  getErrorMessage,
  isValidUUID,
  retryWithBackoff,
  validateRequired} from '../_shared/utils.ts';

// Batch operation configurations
const BATCH_CONFIG = {
  MAX_BATCH_SIZE: 1000,
  CHUNK_SIZE: 50, // Process items in chunks for better performance
  MAX_CONCURRENT_CHUNKS: 5,
  OPERATION_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Supported batch operations
const BATCH_OPERATIONS = {
  DELETE_QUOTES: {
    operation: 'delete_quotes',
    table: 'quotes',
    requiredFields: ['items'],
    maxItems: 1000,
    chunkSize: 50
  },
  UPDATE_QUOTE_STATUS: {
    operation: 'update_quote_status',
    table: 'quotes',
    requiredFields: ['items', 'status'],
    maxItems: 1000,
    chunkSize: 100
  },
  EXPORT_QUOTES: {
    operation: 'export_quotes',
    table: 'quotes',
    requiredFields: ['items', 'format'],
    maxItems: 500, // Smaller limit for exports due to memory constraints
    chunkSize: 25
  },
  DELETE_CLIENTS: {
    operation: 'delete_clients',
    table: 'clients',
    requiredFields: ['items'],
    maxItems: 1000,
    chunkSize: 50
  },
  UPDATE_ITEM_PRICES: {
    operation: 'update_item_prices',
    table: 'items',
    requiredFields: ['items', 'price_adjustment'],
    maxItems: 1000,
    chunkSize: 100
  },
  BULK_CREATE_ITEMS: {
    operation: 'bulk_create_items',
    table: 'items',
    requiredFields: ['items'],
    maxItems: 500,
    chunkSize: 25
  }
} as const;

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  let metrics: PerformanceMetrics = {
    executionTimeMs: 0,
    databaseQueries: 0,
    apiCalls: 0,
    memoryUsageMb: 0,
    errorCount: 0
  };

  let supabase: any = null;
  let user: any = null;

  try {
    // Initialize Supabase client
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Authenticate user
    metrics.databaseQueries++;
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication required', 401);
    }
    user = authResult.user;

    const context: EdgeFunctionContext = {
      functionName: 'batch-processor',
      operationType: 'batch_operation',
      requestId,
      user,
      isAdmin: false // Will be determined based on user roles
    };

    // Parse request body
    const requestBody = await req.json();
    
    // Validate request structure
    const validation = validateBatchRequest(requestBody);
    if (!validation.isValid) {
      metrics.errorCount++;
      return createErrorResponse(
        `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const batchOperation: BulkOperation = requestBody;
    
    // Get operation configuration
    const operationConfig = getOperationConfig(batchOperation.operation);
    if (!operationConfig) {
      metrics.errorCount++;
      return createErrorResponse(`Unsupported operation: ${batchOperation.operation}`, 400);
    }

    // Validate operation-specific requirements
    const operationValidation = validateOperationRequirements(batchOperation, operationConfig);
    if (!operationValidation.isValid) {
      metrics.errorCount++;
      return createErrorResponse(
        `Operation validation failed: ${operationValidation.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    // Check batch size limits
    if (batchOperation.items.length > operationConfig.maxItems) {
      metrics.errorCount++;
      return createErrorResponse(
        `Batch size exceeds limit: ${batchOperation.items.length} > ${operationConfig.maxItems}`,
        400
      );
    }

    // Create batch job record
    metrics.databaseQueries++;
    const batchJobId = await createBatchJob(supabase, user.id, batchOperation, requestId);

    // Process batch operation
    const processingResult = await processBatchOperation(
      supabase,
      user,
      batchOperation,
      operationConfig,
      batchJobId,
      metrics
    );

    // Update batch job with results
    metrics.databaseQueries++;
    await updateBatchJobResults(supabase, batchJobId, processingResult);

    // Calculate final execution time
    metrics.executionTimeMs = Date.now() - startTime;

    // Record performance metrics
    await recordPerformance(supabase, context, metrics);

    return createSuccessResponse({
      batchJobId,
      processed: processingResult.processed,
      failed: processingResult.failed,
      errors: processingResult.errors,
      results: processingResult.results,
      executionTimeMs: metrics.executionTimeMs
    }, 'Batch operation completed');

  } catch (error) {
    metrics.errorCount++;
    metrics.executionTimeMs = Date.now() - startTime;

    console.error('Batch processor error:', error);

    // Record performance metrics for failed requests
    if (supabase && user) {
      const context: EdgeFunctionContext = {
        functionName: 'batch-processor',
        operationType: 'batch_operation_failed',
        requestId,
        user,
        isAdmin: false
      };
      await recordPerformance(supabase, context, metrics);
    }

    return createErrorResponse(getErrorMessage(error), 500);
  }
});

/**
 * Validate batch request structure
 */
function validateBatchRequest(requestBody: any): ValidationResult {
  const requiredFields = ['operation', 'items'];
  return validateRequired(requestBody, requiredFields);
}

/**
 * Get operation configuration by operation type
 */
function getOperationConfig(operation: string): any | null {
  return Object.values(BATCH_OPERATIONS).find(config => config.operation === operation) || null;
}

/**
 * Validate operation-specific requirements
 */
function validateOperationRequirements(batchOperation: BulkOperation, config: any): ValidationResult {
  const errors = [];

  // Check required fields for the specific operation
  for (const field of config.requiredFields) {
    if (field === 'items') continue; // Already validated in main request validation
    
    if (!batchOperation.options || batchOperation.options[field] === undefined) {
      errors.push({
        field,
        message: `Required field '${field}' is missing in options`,
        code: 'REQUIRED_FIELD_MISSING'
      });
    }
  }

  // Validate item IDs are UUIDs
  if (batchOperation.items.some(id => !isValidUUID(id))) {
    errors.push({
      field: 'items',
      message: 'All item IDs must be valid UUIDs',
      code: 'INVALID_UUID'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create batch job record for tracking
 */
async function createBatchJob(
  supabase: any,
  userId: string,
  batchOperation: BulkOperation,
  requestId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('batch_jobs')
    .insert({
      user_id: userId,
      operation_type: batchOperation.operation,
      total_items: batchOperation.items.length,
      status: 'processing',
      request_id: requestId,
      options: batchOperation.options || {},
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Update batch job with processing results
 */
async function updateBatchJobResults(
  supabase: any,
  batchJobId: string,
  result: BulkOperationResult
): Promise<void> {
  const { error } = await supabase
    .from('batch_jobs')
    .update({
      status: result.success ? 'completed' : 'failed',
      processed_items: result.processed,
      failed_items: result.failed,
      error_details: result.errors.length > 0 ? result.errors : null,
      completed_at: new Date().toISOString()
    })
    .eq('id', batchJobId);

  if (error) throw error;
}

/**
 * Process batch operation with chunked processing
 */
async function processBatchOperation(
  supabase: any,
  user: any,
  batchOperation: BulkOperation,
  config: any,
  batchJobId: string,
  metrics: PerformanceMetrics
): Promise<BulkOperationResult> {
  const chunks = chunkArray(batchOperation.items, config.chunkSize);
  const results: BulkOperationResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
    results: []
  };

  console.log(`Processing ${chunks.length} chunks for operation ${batchOperation.operation}`);

  // Process chunks with controlled concurrency
  for (let i = 0; i < chunks.length; i += BATCH_CONFIG.MAX_CONCURRENT_CHUNKS) {
    const chunkSlice = chunks.slice(i, i + BATCH_CONFIG.MAX_CONCURRENT_CHUNKS);
    
    const chunkPromises = chunkSlice.map(async (chunk, chunkIndex) => {
      const actualChunkIndex = i + chunkIndex;
      
      try {
        const chunkResult = await processChunk(
          supabase,
          user,
          batchOperation,
          config,
          chunk,
          actualChunkIndex,
          metrics
        );

        return chunkResult;
      } catch (error) {
        console.error(`Chunk ${actualChunkIndex} failed:`, error);
        return {
          processed: 0,
          failed: chunk.length,
          errors: chunk.map(id => ({
            id,
            error: getErrorMessage(error)
          })),
          results: []
        };
      }
    });

    // Wait for current chunk slice to complete
    const chunkResults = await Promise.all(chunkPromises);

    // Aggregate results
    for (const chunkResult of chunkResults) {
      results.processed += chunkResult.processed;
      results.failed += chunkResult.failed;
      results.errors.push(...chunkResult.errors);
      if (chunkResult.results) {
        results.results!.push(...chunkResult.results);
      }
    }

    // Update progress
    const totalProcessedSoFar = results.processed + results.failed;
    const progressPercent = Math.round((totalProcessedSoFar / batchOperation.items.length) * 100);
    
    await updateBatchJobProgress(supabase, batchJobId, progressPercent, results.processed, results.failed);
    
    console.log(`Processed ${totalProcessedSoFar}/${batchOperation.items.length} items (${progressPercent}%)`);
  }

  results.success = results.failed === 0;
  
  console.log(`Batch operation completed: ${results.processed} processed, ${results.failed} failed`);

  return results;
}

/**
 * Process a single chunk of items
 */
async function processChunk(
  supabase: any,
  user: any,
  batchOperation: BulkOperation,
  config: any,
  chunk: string[],
  chunkIndex: number,
  metrics: PerformanceMetrics
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  results?: any[];
}> {
  console.log(`Processing chunk ${chunkIndex} with ${chunk.length} items`);

  switch (batchOperation.operation) {
    case 'delete_quotes':
      return await processDeleteQuotes(supabase, user, chunk, metrics);
    
    case 'update_quote_status':
      return await processUpdateQuoteStatus(supabase, user, chunk, batchOperation.options!.status, metrics);
    
    case 'export_quotes':
      return await processExportQuotes(supabase, user, chunk, batchOperation.options!.format, metrics);
    
    case 'delete_clients':
      return await processDeleteClients(supabase, user, chunk, metrics);
    
    case 'update_item_prices':
      return await processUpdateItemPrices(supabase, user, chunk, batchOperation.options!.price_adjustment, metrics);
    
    case 'bulk_create_items':
      return await processBulkCreateItems(supabase, user, batchOperation.options!.items, metrics);
    
    default:
      throw new Error(`Unsupported operation: ${batchOperation.operation}`);
  }
}

/**
 * Process delete quotes operation
 */
async function processDeleteQuotes(
  supabase: any,
  user: any,
  quoteIds: string[],
  metrics: PerformanceMetrics
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const errors: Array<{ id: string; error: string }> = [];
  let processed = 0;

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('quotes')
    .delete()
    .in('id', quoteIds)
    .eq('user_id', user.id); // Ensure user owns the quotes

  if (error) {
    // If bulk delete fails, try individual deletes
    for (const quoteId of quoteIds) {
      try {
        metrics.databaseQueries++;
        const { error: deleteError } = await supabase
          .from('quotes')
          .delete()
          .eq('id', quoteId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        processed++;
      } catch (err) {
        errors.push({
          id: quoteId,
          error: getErrorMessage(err)
        });
      }
    }
  } else {
    processed = quoteIds.length;
  }

  return {
    processed,
    failed: errors.length,
    errors
  };
}

/**
 * Process update quote status operation
 */
async function processUpdateQuoteStatus(
  supabase: any,
  user: any,
  quoteIds: string[],
  status: string,
  metrics: PerformanceMetrics
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const errors: Array<{ id: string; error: string }> = [];
  let processed = 0;

  // Validate status
  const validStatuses = ['draft', 'sent', 'accepted', 'declined', 'expired'];
  if (!validStatuses.includes(status)) {
    return {
      processed: 0,
      failed: quoteIds.length,
      errors: quoteIds.map(id => ({ id, error: `Invalid status: ${status}` }))
    };
  }

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('quotes')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .in('id', quoteIds)
    .eq('user_id', user.id);

  if (error) {
    // If bulk update fails, try individual updates
    for (const quoteId of quoteIds) {
      try {
        metrics.databaseQueries++;
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ 
            status, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', quoteId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        processed++;
      } catch (err) {
        errors.push({
          id: quoteId,
          error: getErrorMessage(err)
        });
      }
    }
  } else {
    processed = quoteIds.length;
  }

  return {
    processed,
    failed: errors.length,
    errors
  };
}

/**
 * Process export quotes operation
 */
async function processExportQuotes(
  supabase: any,
  user: any,
  quoteIds: string[],
  format: string,
  metrics: PerformanceMetrics
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  results: any[];
}> {
  const errors: Array<{ id: string; error: string }> = [];
  const results: any[] = [];

  // Validate format
  const validFormats = ['json', 'csv'];
  if (!validFormats.includes(format)) {
    return {
      processed: 0,
      failed: quoteIds.length,
      errors: quoteIds.map(id => ({ id, error: `Invalid format: ${format}` })),
      results: []
    };
  }

  // Get quote data
  metrics.databaseQueries++;
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(`
      id,
      quote_number,
      client_name,
      client_email,
      status,
      subtotal,
      tax_amount,
      total,
      created_at,
      updated_at
    `)
    .in('id', quoteIds)
    .eq('user_id', user.id);

  if (error) {
    return {
      processed: 0,
      failed: quoteIds.length,
      errors: quoteIds.map(id => ({ id, error: getErrorMessage(error) })),
      results: []
    };
  }

  for (const quote of quotes) {
    try {
      if (format === 'csv') {
        // Convert to CSV format
        const csvRow = {
          quote_number: quote.quote_number,
          client_name: quote.client_name,
          client_email: quote.client_email || '',
          status: quote.status,
          subtotal: quote.subtotal,
          tax_amount: quote.tax_amount,
          total: quote.total,
          created_at: quote.created_at,
          updated_at: quote.updated_at
        };
        results.push(csvRow);
      } else {
        // JSON format (default)
        results.push(quote);
      }
    } catch (err) {
      errors.push({
        id: quote.id,
        error: getErrorMessage(err)
      });
    }
  }

  return {
    processed: results.length,
    failed: errors.length,
    errors,
    results
  };
}

/**
 * Process delete clients operation
 */
async function processDeleteClients(
  supabase: any,
  user: any,
  clientIds: string[],
  metrics: PerformanceMetrics
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const errors: Array<{ id: string; error: string }> = [];
  let processed = 0;

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('clients')
    .delete()
    .in('id', clientIds)
    .eq('user_id', user.id);

  if (error) {
    // If bulk delete fails, try individual deletes
    for (const clientId of clientIds) {
      try {
        metrics.databaseQueries++;
        const { error: deleteError } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        processed++;
      } catch (err) {
        errors.push({
          id: clientId,
          error: getErrorMessage(err)
        });
      }
    }
  } else {
    processed = clientIds.length;
  }

  return {
    processed,
    failed: errors.length,
    errors
  };
}

/**
 * Process update item prices operation
 */
async function processUpdateItemPrices(
  supabase: any,
  user: any,
  itemIds: string[],
  priceAdjustment: { type: 'percentage' | 'fixed'; value: number },
  metrics: PerformanceMetrics
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const errors: Array<{ id: string; error: string }> = [];
  let processed = 0;

  // Get current item prices
  metrics.databaseQueries++;
  const { data: items, error: fetchError } = await supabase
    .from('items')
    .select('id, unit_price')
    .in('id', itemIds)
    .eq('user_id', user.id);

  if (fetchError) {
    return {
      processed: 0,
      failed: itemIds.length,
      errors: itemIds.map(id => ({ id, error: getErrorMessage(fetchError) }))
    };
  }

  // Update prices individually
  for (const item of items) {
    try {
      let newPrice: number;
      
      if (priceAdjustment.type === 'percentage') {
        newPrice = item.unit_price * (1 + priceAdjustment.value / 100);
      } else {
        newPrice = item.unit_price + priceAdjustment.value;
      }

      // Ensure price is not negative
      newPrice = Math.max(0, newPrice);

      metrics.databaseQueries++;
      const { error: updateError } = await supabase
        .from('items')
        .update({ 
          unit_price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      processed++;
    } catch (err) {
      errors.push({
        id: item.id,
        error: getErrorMessage(err)
      });
    }
  }

  return {
    processed,
    failed: errors.length,
    errors
  };
}

/**
 * Process bulk create items operation
 */
async function processBulkCreateItems(
  supabase: any,
  user: any,
  items: any[],
  metrics: PerformanceMetrics
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  results: any[];
}> {
  const errors: Array<{ id: string; error: string }> = [];
  const results: any[] = [];

  // Prepare items for insertion
  const itemsToInsert = items.map(item => ({
    ...item,
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  try {
    metrics.databaseQueries++;
    const { data: insertedItems, error } = await supabase
      .from('items')
      .insert(itemsToInsert)
      .select('id');

    if (error) throw error;

    results.push(...insertedItems);
    
    return {
      processed: insertedItems.length,
      failed: 0,
      errors: [],
      results
    };
  } catch (err) {
    // If bulk insert fails, try individual inserts
    for (const item of itemsToInsert) {
      try {
        metrics.databaseQueries++;
        const { data: insertedItem, error: insertError } = await supabase
          .from('items')
          .insert(item)
          .select('id')
          .single();

        if (insertError) throw insertError;
        results.push(insertedItem);
      } catch (individualErr) {
        errors.push({
          id: item.name || 'unknown',
          error: getErrorMessage(individualErr)
        });
      }
    }

    return {
      processed: results.length,
      failed: errors.length,
      errors,
      results
    };
  }
}

/**
 * Update batch job progress
 */
async function updateBatchJobProgress(
  supabase: any,
  batchJobId: string,
  progressPercent: number,
  processed: number,
  failed: number
): Promise<void> {
  try {
    await supabase
      .from('batch_jobs')
      .update({
        progress_percent: progressPercent,
        processed_items: processed,
        failed_items: failed,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchJobId);
  } catch (error) {
    console.error('Failed to update batch job progress:', error);
    // Don't throw - this is not critical for the operation
  }
}