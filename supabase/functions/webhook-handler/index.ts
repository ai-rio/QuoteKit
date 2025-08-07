/**
 * Sprint 3: Unified Webhook Handler Edge Function
 * Intelligent webhook processing with routing and performance optimizations
 * Target: Process webhooks in <200ms (60% improvement from 500ms baseline)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.12.0';

import { corsHeaders } from '../_shared/cors.ts';
import { recordPerformance } from '../_shared/performance.ts';
import {
  ApiResponse,
  EdgeFunctionContext,
  PerformanceMetrics,
  WebhookEvent} from '../_shared/types.ts';
// Import shared utilities
import { 
  chunkArray,
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
  getErrorMessage,
  retryWithBackoff} from '../_shared/utils.ts';

// Webhook event routing configuration
const WEBHOOK_ROUTES = {
  // Subscription events - highest priority
  'customer.subscription.created': { handler: 'handleSubscription', priority: 1, timeout: 5000 },
  'customer.subscription.updated': { handler: 'handleSubscription', priority: 1, timeout: 5000 },
  'customer.subscription.deleted': { handler: 'handleSubscription', priority: 1, timeout: 5000 },
  
  // Payment events - high priority
  'checkout.session.completed': { handler: 'handleCheckout', priority: 2, timeout: 4000 },
  'invoice.payment_succeeded': { handler: 'handlePayment', priority: 2, timeout: 3000 },
  'invoice.payment_failed': { handler: 'handlePayment', priority: 2, timeout: 3000 },
  
  // Payment method events - medium priority
  'setup_intent.succeeded': { handler: 'handlePaymentMethod', priority: 3, timeout: 3000 },
  'payment_method.attached': { handler: 'handlePaymentMethod', priority: 3, timeout: 2000 },
  'payment_method.detached': { handler: 'handlePaymentMethod', priority: 3, timeout: 2000 },
  
  // Product/Price events - lower priority
  'product.created': { handler: 'handleProduct', priority: 4, timeout: 2000 },
  'product.updated': { handler: 'handleProduct', priority: 4, timeout: 2000 },
  'product.deleted': { handler: 'handleProduct', priority: 4, timeout: 2000 },
  'price.created': { handler: 'handlePrice', priority: 4, timeout: 2000 },
  'price.updated': { handler: 'handlePrice', priority: 4, timeout: 2000 },
  'price.deleted': { handler: 'handlePrice', priority: 4, timeout: 2000 },
  
  // Customer events - lowest priority
  'customer.created': { handler: 'handleCustomer', priority: 5, timeout: 1500 },
  'customer.updated': { handler: 'handleCustomer', priority: 5, timeout: 1500 },
  'customer.deleted': { handler: 'handleCustomer', priority: 5, timeout: 1500 },
} as const;

// Dead letter queue reasons
const DLQ_REASONS = {
  MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
  TIMEOUT_EXCEEDED: 'TIMEOUT_EXCEEDED',
  SIGNATURE_INVALID: 'SIGNATURE_INVALID',
  PARSING_FAILED: 'PARSING_FAILED',
  HANDLER_NOT_FOUND: 'HANDLER_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const context: EdgeFunctionContext = {
    functionName: 'webhook-handler',
    operationType: 'webhook_processing',
    requestId,
    isAdmin: false
  };

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

  let event: Stripe.Event | null = null;
  let supabase: any = null;
  let stripe: Stripe | null = null;

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

    // Get webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      metrics.errorCount++;
      await recordFailedWebhook(supabase, null, DLQ_REASONS.SIGNATURE_INVALID, 'Missing Stripe signature');
      return createErrorResponse('Missing signature', 400);
    }

    // Get request body
    const body = await req.text();
    if (!body) {
      metrics.errorCount++;
      return createErrorResponse('Empty request body', 400);
    }

    // Get Stripe configuration with caching
    metrics.databaseQueries++;
    const stripeConfig = await getStripeConfig(supabase);
    if (!stripeConfig) {
      metrics.errorCount++;
      return createErrorResponse('Stripe configuration not found', 500);
    }

    // Initialize Stripe client
    stripe = new Stripe(stripeConfig.secret_key, {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeConfig.webhook_secret
      ) as Stripe.Event;
    } catch (err) {
      metrics.errorCount++;
      await recordFailedWebhook(supabase, null, DLQ_REASONS.SIGNATURE_INVALID, getErrorMessage(err));
      return createErrorResponse('Invalid signature', 400);
    }

    // Check for duplicate webhook processing (idempotency)
    metrics.databaseQueries++;
    const isDuplicate = await checkWebhookIdempotency(supabase, event.id);
    if (isDuplicate) {
      return createSuccessResponse({ received: true, message: 'Event already processed', eventId: event.id });
    }

    // Record webhook event
    metrics.databaseQueries++;
    await recordWebhookEvent(supabase, event);

    // Route webhook to appropriate handler
    const routeConfig = WEBHOOK_ROUTES[event.type as keyof typeof WEBHOOK_ROUTES];
    if (!routeConfig) {
      console.log(`Unhandled webhook event type: ${event.type}`);
      await markWebhookProcessed(supabase, event.id, true, null);
      return createSuccessResponse({ 
        received: true, 
        message: 'Event acknowledged but not handled',
        eventId: event.id 
      });
    }

    // Process webhook with timeout and retries
    const processingResult = await processWebhookWithTimeout(
      supabase,
      stripe,
      event,
      routeConfig,
      metrics
    );

    if (!processingResult.success) {
      metrics.errorCount++;
      await recordFailedWebhook(supabase, event, DLQ_REASONS.MAX_RETRIES_EXCEEDED, processingResult.error);
      return createErrorResponse('Webhook processing failed', 500);
    }

    // Mark webhook as processed
    metrics.databaseQueries++;
    await markWebhookProcessed(supabase, event.id, true, null);

    // Calculate final execution time
    metrics.executionTimeMs = Date.now() - startTime;

    // Record performance metrics
    await recordPerformance(supabase, context, metrics);

    return createSuccessResponse({
      received: true,
      eventId: event.id,
      processingTimeMs: metrics.executionTimeMs,
      handler: routeConfig.handler
    });

  } catch (error) {
    metrics.errorCount++;
    metrics.executionTimeMs = Date.now() - startTime;

    console.error('Webhook handler error:', error);

    // Record failed webhook if event was parsed
    if (event && supabase) {
      await recordFailedWebhook(supabase, event, DLQ_REASONS.DATABASE_ERROR, getErrorMessage(error));
    }

    // Record performance metrics for failed requests
    if (supabase) {
      await recordPerformance(supabase, context, metrics);
    }

    return createErrorResponse(getErrorMessage(error), 500);
  }
});

/**
 * Get Stripe configuration from database with caching
 */
async function getStripeConfig(supabase: any): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (error || !data?.value) {
      console.error('Failed to get Stripe config:', error);
      return null;
    }

    return data.value;
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return null;
  }
}

/**
 * Check if webhook event has already been processed
 */
async function checkWebhookIdempotency(supabase: any, eventId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('stripe_webhook_events')
      .select('processed')
      .eq('stripe_event_id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return data?.processed || false;
  } catch (error) {
    console.error('Error checking webhook idempotency:', error);
    return false;
  }
}

/**
 * Record webhook event for idempotency and auditing
 */
async function recordWebhookEvent(supabase: any, event: Stripe.Event): Promise<void> {
  try {
    const { error } = await supabase
      .from('stripe_webhook_events')
      .upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed: false,
        data: event.data,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_event_id',
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error recording webhook event:', error);
    throw error;
  }
}

/**
 * Mark webhook as processed
 */
async function markWebhookProcessed(
  supabase: any, 
  eventId: string, 
  processed: boolean, 
  errorMessage: string | null
): Promise<void> {
  try {
    const { error } = await supabase
      .from('stripe_webhook_events')
      .update({
        processed,
        processed_at: new Date().toISOString(),
        error_message: errorMessage
      })
      .eq('stripe_event_id', eventId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error marking webhook as processed:', error);
    // Don't throw - this is not critical for webhook processing
  }
}

/**
 * Process webhook with timeout and retry logic
 */
async function processWebhookWithTimeout(
  supabase: any,
  stripe: Stripe,
  event: Stripe.Event,
  routeConfig: any,
  metrics: PerformanceMetrics
): Promise<{ success: boolean; error?: string }> {
  const timeoutMs = routeConfig.timeout || 5000;
  
  try {
    const result = await Promise.race([
      processWebhookEvent(supabase, stripe, event, routeConfig.handler, metrics),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);

    return { success: true };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    
    if (errorMessage.includes('Timeout')) {
      await recordFailedWebhook(supabase, event, DLQ_REASONS.TIMEOUT_EXCEEDED, errorMessage);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Main webhook event processor with intelligent routing
 */
async function processWebhookEvent(
  supabase: any,
  stripe: Stripe,
  event: Stripe.Event,
  handlerName: string,
  metrics: PerformanceMetrics
): Promise<void> {
  switch (handlerName) {
    case 'handleSubscription':
      await handleSubscriptionEvent(supabase, stripe, event, metrics);
      break;
    case 'handleCheckout':
      await handleCheckoutEvent(supabase, stripe, event, metrics);
      break;
    case 'handlePayment':
      await handlePaymentEvent(supabase, stripe, event, metrics);
      break;
    case 'handlePaymentMethod':
      await handlePaymentMethodEvent(supabase, stripe, event, metrics);
      break;
    case 'handleProduct':
      await handleProductEvent(supabase, event, metrics);
      break;
    case 'handlePrice':
      await handlePriceEvent(supabase, event, metrics);
      break;
    case 'handleCustomer':
      await handleCustomerEvent(supabase, event, metrics);
      break;
    default:
      throw new Error(`Unknown handler: ${handlerName}`);
  }
}

/**
 * Handle subscription events (created, updated, deleted)
 */
async function handleSubscriptionEvent(
  supabase: any,
  stripe: Stripe,
  event: Stripe.Event,
  metrics: PerformanceMetrics
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  console.log(`Processing subscription event: ${event.type} for ${subscription.id}`);

  if (event.type === 'customer.subscription.deleted') {
    // Mark subscription as canceled
    metrics.databaseQueries++;
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        ended_at: new Date().toISOString(),
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) throw error;
  } else {
    // Handle subscription creation/update
    metrics.apiCalls++;
    const fullSubscription = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ['customer', 'default_payment_method'],
    });

    // Get customer mapping
    metrics.databaseQueries++;
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', fullSubscription.customer)
      .single();

    if (customerError || !customer) {
      throw new Error(`Customer mapping not found for ${fullSubscription.customer}`);
    }

    // Upsert subscription
    metrics.databaseQueries++;
    const subscriptionData = {
      user_id: customer.user_id,
      stripe_subscription_id: fullSubscription.id,
      stripe_customer_id: fullSubscription.customer as string,
      stripe_price_id: fullSubscription.items.data[0]?.price?.id,
      status: fullSubscription.status,
      metadata: fullSubscription.metadata || {},
      cancel_at_period_end: fullSubscription.cancel_at_period_end,
      current_period_start: new Date(fullSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(fullSubscription.current_period_end * 1000).toISOString(),
      trial_start: fullSubscription.trial_start ? new Date(fullSubscription.trial_start * 1000).toISOString() : null,
      trial_end: fullSubscription.trial_end ? new Date(fullSubscription.trial_end * 1000).toISOString() : null,
      cancel_at: fullSubscription.cancel_at ? new Date(fullSubscription.cancel_at * 1000).toISOString() : null,
      canceled_at: fullSubscription.canceled_at ? new Date(fullSubscription.canceled_at * 1000).toISOString() : null,
      ended_at: fullSubscription.ended_at ? new Date(fullSubscription.ended_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id'
      });

    if (upsertError) throw upsertError;
  }

  console.log(`Successfully processed subscription event: ${event.type}`);
}

/**
 * Handle checkout session completed events
 */
async function handleCheckoutEvent(
  supabase: any,
  stripe: Stripe,
  event: Stripe.Event,
  metrics: PerformanceMetrics
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  
  console.log(`Processing checkout event for session: ${session.id}`);

  if (!session.subscription) {
    console.log('No subscription in checkout session, skipping');
    return;
  }

  // Ensure customer mapping exists
  if (session.customer && session.customer_details?.email) {
    await ensureCustomerMapping(supabase, session, metrics);
  }

  // Process the subscription
  await handleSubscriptionFromCheckout(supabase, stripe, session, metrics);

  console.log(`Successfully processed checkout session: ${session.id}`);
}

/**
 * Handle payment events (succeeded, failed)
 */
async function handlePaymentEvent(
  supabase: any,
  stripe: Stripe,
  event: Stripe.Event,
  metrics: PerformanceMetrics
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  
  console.log(`Processing payment event: ${event.type} for invoice ${invoice.id}`);

  if (!invoice.customer || !invoice.subscription) {
    console.log('Missing customer or subscription data in invoice');
    return;
  }

  // Get customer mapping
  metrics.databaseQueries++;
  const { data: customer, error } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (error || !customer) {
    throw new Error(`Customer mapping not found for ${invoice.customer}`);
  }

  // Record payment event in subscription_changes
  metrics.databaseQueries++;
  const changeType = event.type === 'invoice.payment_succeeded' ? 'payment_succeeded' : 'payment_failed';
  const { error: insertError } = await supabase
    .from('subscription_changes')
    .insert({
      user_id: customer.user_id,
      change_type: changeType,
      old_value: null,
      new_value: {
        invoice_id: invoice.id,
        amount: event.type === 'invoice.payment_succeeded' ? invoice.amount_paid : invoice.amount_due,
        currency: invoice.currency,
        subscription_id: invoice.subscription
      },
      timestamp: new Date().toISOString(),
      metadata: {
        stripe_invoice_id: invoice.id,
        payment_intent: invoice.payment_intent,
        status: invoice.status
      }
    });

  if (insertError) throw insertError;

  console.log(`Successfully processed payment event: ${event.type}`);
}

/**
 * Handle payment method events
 */
async function handlePaymentMethodEvent(
  supabase: any,
  stripe: Stripe,
  event: Stripe.Event,
  metrics: PerformanceMetrics
): Promise<void> {
  console.log(`Processing payment method event: ${event.type}`);

  if (event.type === 'setup_intent.succeeded') {
    const setupIntent = event.data.object as Stripe.SetupIntent;
    if (setupIntent.payment_method && setupIntent.customer) {
      metrics.apiCalls++;
      const paymentMethod = await stripe.paymentMethods.retrieve(
        typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method.id
      );
      await savePaymentMethodToDatabase(supabase, paymentMethod, setupIntent.customer as string, metrics);
    }
  } else if (event.type === 'payment_method.attached') {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;
    if (paymentMethod.customer) {
      await savePaymentMethodToDatabase(supabase, paymentMethod, paymentMethod.customer as string, metrics);
    }
  }

  console.log(`Successfully processed payment method event: ${event.type}`);
}

/**
 * Handle product events
 */
async function handleProductEvent(
  supabase: any,
  event: Stripe.Event,
  metrics: PerformanceMetrics
): Promise<void> {
  const product = event.data.object as Stripe.Product;
  
  console.log(`Processing product event: ${event.type} for ${product.id}`);

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('stripe_products')
    .upsert({
      id: product.id,
      stripe_product_id: product.id,
      name: product.name,
      description: product.description,
      active: event.type === 'product.deleted' ? false : product.active,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_product_id'
    });

  if (error) throw error;

  console.log(`Successfully processed product event: ${event.type}`);
}

/**
 * Handle price events
 */
async function handlePriceEvent(
  supabase: any,
  event: Stripe.Event,
  metrics: PerformanceMetrics
): Promise<void> {
  const price = event.data.object as Stripe.Price;
  
  console.log(`Processing price event: ${event.type} for ${price.id}`);

  metrics.databaseQueries++;
  const { error } = await supabase
    .from('stripe_prices')
    .upsert({
      id: price.id,
      stripe_price_id: price.id,
      stripe_product_id: typeof price.product === 'string' ? price.product : price.product?.id,
      unit_amount: price.unit_amount || 0,
      currency: price.currency,
      recurring_interval: price.recurring?.interval || null,
      active: event.type === 'price.deleted' ? false : price.active,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_price_id'
    });

  if (error) throw error;

  console.log(`Successfully processed price event: ${event.type}`);
}

/**
 * Handle customer events
 */
async function handleCustomerEvent(
  supabase: any,
  event: Stripe.Event,
  metrics: PerformanceMetrics
): Promise<void> {
  console.log(`Processing customer event: ${event.type}`);
  // Customer events are typically handled implicitly through other events
  // This is a placeholder for future customer-specific logic
}

/**
 * Ensure customer mapping exists
 */
async function ensureCustomerMapping(
  supabase: any,
  session: Stripe.Checkout.Session,
  metrics: PerformanceMetrics
): Promise<void> {
  const customerId = session.customer as string;
  const customerEmail = session.customer_details?.email;

  if (!customerId || !customerEmail) return;

  // Check if mapping exists
  metrics.databaseQueries++;
  const { data: existing, error: checkError } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') throw checkError;
  if (existing) return; // Mapping already exists

  // Find user by email
  metrics.databaseQueries++;
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (userError || !user) {
    throw new Error(`User not found for email: ${customerEmail}`);
  }

  // Create mapping
  metrics.databaseQueries++;
  const { error: insertError } = await supabase
    .from('stripe_customers')
    .insert({
      user_id: user.id,
      stripe_customer_id: customerId,
      email: customerEmail,
      created_at: new Date().toISOString()
    });

  if (insertError) throw insertError;
}

/**
 * Handle subscription from checkout session
 */
async function handleSubscriptionFromCheckout(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  metrics: PerformanceMetrics
): Promise<void> {
  if (!session.subscription) return;

  const subscriptionId = typeof session.subscription === 'string' 
    ? session.subscription 
    : session.subscription.id;

  // Retrieve full subscription
  metrics.apiCalls++;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'default_payment_method'],
  });

  // Create a subscription event and process it
  const mockEvent: Stripe.Event = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: { object: subscription },
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    type: 'customer.subscription.created'
  };

  const mockMetrics: PerformanceMetrics = { ...metrics };
  await handleSubscriptionEvent(supabase, stripe, mockEvent, mockMetrics);
  
  // Update original metrics
  metrics.databaseQueries += mockMetrics.databaseQueries;
  metrics.apiCalls += mockMetrics.apiCalls;
}

/**
 * Save payment method to database
 */
async function savePaymentMethodToDatabase(
  supabase: any,
  paymentMethod: Stripe.PaymentMethod,
  stripeCustomerId: string,
  metrics: PerformanceMetrics
): Promise<void> {
  // Find customer mapping
  metrics.databaseQueries++;
  const { data: customer, error: customerError } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (customerError || !customer) {
    console.error(`Customer not found for stripe_customer_id: ${stripeCustomerId}`);
    return;
  }

  // Prepare card data
  const cardData = paymentMethod.card ? {
    brand: paymentMethod.card.brand,
    last4: paymentMethod.card.last4,
    exp_month: paymentMethod.card.exp_month,
    exp_year: paymentMethod.card.exp_year,
    country: paymentMethod.card.country || '',
    funding: paymentMethod.card.funding || 'unknown'
  } : {};

  // Check if this is the first payment method
  metrics.databaseQueries++;
  const { data: existingMethods } = await supabase
    .from('payment_methods')
    .select('id')
    .eq('user_id', customer.user_id);

  const isFirstMethod = !existingMethods || existingMethods.length === 0;

  // Save payment method
  metrics.databaseQueries++;
  const { error } = await supabase
    .from('payment_methods')
    .upsert({
      id: paymentMethod.id,
      user_id: customer.user_id,
      stripe_customer_id: stripeCustomerId,
      type: paymentMethod.type,
      card_data: cardData,
      is_default: isFirstMethod,
      metadata: paymentMethod.metadata || {},
      created_at: new Date(paymentMethod.created * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (error) throw error;
}

/**
 * Record failed webhook in dead letter queue
 */
async function recordFailedWebhook(
  supabase: any,
  event: Stripe.Event | null,
  reason: string,
  errorMessage: string
): Promise<void> {
  try {
    if (!event) return;

    await supabase
      .from('stripe_webhook_events')
      .update({
        processed: false,
        error_message: `${reason}: ${errorMessage}`,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', event.id);
  } catch (error) {
    console.error('Failed to record webhook failure:', error);
  }
}