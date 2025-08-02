import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { upsertUserSubscription } from '@/features/account/controllers/upsert-user-subscription'
import { createStripeAdminClient, stripeAdmin } from '@/libs/stripe/stripe-admin'
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin'
import { handleBillingEdgeCase } from '@/features/billing/controllers/edge-case-coordinator'

// Helper function to convert Unix timestamp to Date
const toDateTime = (secs: number): Date => {
  const t = new Date('1970-01-01T00:30:00Z'); // Unix epoch start
  t.setSeconds(secs);
  return t;
};

export async function POST(request: NextRequest) {
  console.log(`🚀 [WEBHOOK] ===== STRIPE WEBHOOK REQUEST RECEIVED =====`)
  
  try {
    // STEP 1: Extract request body and signature
    console.log(`📥 [STEP 1] Extracting request body and signature...`)
    let body, signature
    try {
      body = await request.text()
      signature = request.headers.get('stripe-signature')
      
      console.log(`✅ [STEP 1 SUCCESS] Request data extracted:`, {
        bodyLength: body.length,
        hasSignature: !!signature,
        signaturePrefix: signature ? signature.substring(0, 20) + '...' : 'none'
      })
    } catch (extractError) {
      console.error(`💥 [STEP 1 CRITICAL ERROR] Failed to extract request data:`, {
        error: extractError,
        message: extractError instanceof Error ? extractError.message : 'Unknown extraction error'
      })
      return NextResponse.json({ error: 'Failed to read request' }, { status: 400 })
    }

    if (!signature) {
      console.error(`💥 [STEP 1 CRITICAL ERROR] Missing Stripe signature`)
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // STEP 2: Get Stripe configuration for webhook secret
    console.log(`🔧 [STEP 2] Getting Stripe configuration for webhook verification...`)
    let configData, config, stripeConfig, stripe
    try {
      const configResult = await supabaseAdminClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'stripe_config')
        .single()

      configData = configResult.data
      if (configResult.error) {
        console.error(`💥 [STEP 2 CRITICAL ERROR] Failed to get Stripe config from database:`, {
          error: configResult.error,
          message: configResult.error.message,
          code: configResult.error.code,
          details: configResult.error.details,
          hint: configResult.error.hint
        })
        return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 })
      }

      config = configData?.value as any;
      if (!config?.webhook_secret) {
        console.error(`💥 [STEP 2 CRITICAL ERROR] Webhook secret not configured in database`)
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
      }

      stripeConfig = configData?.value as any
      stripe = createStripeAdminClient(stripeConfig)
      
      console.log(`✅ [STEP 2 SUCCESS] Stripe configuration loaded and client created`)
      
    } catch (configError) {
      console.error(`💥 [STEP 2 CRITICAL ERROR] Stripe configuration setup failed:`, {
        error: configError,
        message: configError instanceof Error ? configError.message : 'Unknown config error',
        stack: configError instanceof Error ? configError.stack : undefined
      })
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    // STEP 3: Verify webhook signature
    console.log(`🔐 [STEP 3] Verifying webhook signature...`)
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.webhook_secret
      )
      
      console.log(`✅ [STEP 3 SUCCESS] Webhook signature verified:`, {
        eventId: event.id,
        eventType: event.type,
        created: event.created,
        livemode: event.livemode
      })
      
    } catch (signatureError: any) {
      console.error(`💥 [STEP 3 CRITICAL ERROR] Webhook signature verification failed:`, {
        error: signatureError,
        message: signatureError.message,
        type: signatureError.type,
        stack: signatureError.stack,
        signatureProvided: !!signature,
        webhookSecretConfigured: !!config.webhook_secret
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // STEP 4: Enhanced idempotency check
    console.log(`🔄 [STEP 4] Checking for duplicate event processing...`)
    try {
      const { data: existingEvent } = await supabaseAdminClient
        .from('stripe_webhook_events')
        .select('processed, processed_at')
        .eq('stripe_event_id', event.id)
        .single()

      if (existingEvent?.processed) {
        console.log(`ℹ️ [STEP 4 INFO] Event ${event.id} already processed at ${existingEvent.processed_at}`)
        return NextResponse.json({ received: true, message: 'Event already processed' })
      }
      
      console.log(`✅ [STEP 4 SUCCESS] Event ${event.id} is new, proceeding with processing`)
      
    } catch (idempotencyError) {
      console.error(`⚠️ [STEP 4 WARNING] Idempotency check failed (proceeding anyway):`, {
        eventId: event.id,
        error: idempotencyError,
        message: idempotencyError instanceof Error ? idempotencyError.message : 'Unknown idempotency error'
      })
      // Continue processing even if idempotency check fails
    }

    // STEP 5: Log the webhook event for debugging and idempotency
    console.log(`📝 [STEP 5] Logging webhook event: ${event.type} (${event.id})`)
    try {
      await supabaseAdminClient
        .from('stripe_webhook_events')
        .upsert({
          stripe_event_id: event.id,
          event_type: event.type,
          processed: false,
          data: event.data as any,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'stripe_event_id',
          ignoreDuplicates: false
        })
        
      console.log(`✅ [STEP 5 SUCCESS] Webhook event logged successfully`)
      
    } catch (logError) {
      console.error(`💥 [STEP 5 CRITICAL ERROR] Failed to log webhook event:`, {
        eventId: event.id,
        eventType: event.type,
        error: logError,
        message: logError instanceof Error ? logError.message : 'Unknown logging error',
        stack: logError instanceof Error ? logError.stack : undefined
      })
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
    }

    // STEP 6: Process webhook event with retry logic
    console.log(`⚙️ [STEP 6] Processing webhook event with retry logic...`)
    let processingResult: { success: boolean; error?: string } = { success: false }
    try {
      processingResult = await processWebhookEventWithRetry(event, 3)
      
      if (processingResult.success) {
        console.log(`✅ [STEP 6 SUCCESS] Webhook event processed successfully`)
      } else {
        console.error(`💥 [STEP 6 ERROR] Webhook event processing failed:`, {
          eventId: event.id,
          eventType: event.type,
          error: processingResult.error
        })
      }
      
    } catch (processingError) {
      console.error(`💥 [STEP 6 CRITICAL ERROR] Final webhook processing failure:`, {
        eventId: event.id,
        eventType: event.type,
        error: processingError,
        message: processingError instanceof Error ? processingError.message : 'Unknown processing error',
        stack: processingError instanceof Error ? processingError.stack : undefined
      })
      processingResult = { 
        success: false, 
        error: processingError instanceof Error ? processingError.message : 'Unknown processing error' 
      }
    }

    // STEP 7: Update event processing status
    console.log(`💾 [STEP 7] Updating event processing status...`)
    try {
      await supabaseAdminClient
        .from('stripe_webhook_events')
        .update({ 
          processed: processingResult.success, 
          processed_at: new Date().toISOString(),
          error_message: processingResult.error || null
        })
        .eq('stripe_event_id', event.id)
        
      console.log(`✅ [STEP 7 SUCCESS] Event processing status updated:`, {
        eventId: event.id,
        processed: processingResult.success,
        hasError: !!processingResult.error
      })
      
    } catch (updateError) {
      console.error(`⚠️ [STEP 7 WARNING] Failed to update webhook event status (non-critical):`, {
        eventId: event.id,
        error: updateError,
        message: updateError instanceof Error ? updateError.message : 'Unknown update error'
      })
    }

    // STEP 8: Return appropriate response
    if (!processingResult.success) {
      console.error(`🚨 [FAILURE] ===== WEBHOOK PROCESSING FAILED =====`)
      console.error(`🚨 [FAILURE] Event ID: ${event.id}`)
      console.error(`🚨 [FAILURE] Event Type: ${event.type}`)
      console.error(`🚨 [FAILURE] Error: ${processingResult.error}`)
      
      // For failed events, we return 500 so Stripe will retry
      return NextResponse.json({
        error: 'Processing failed',
        message: processingResult.error || 'Unknown error',
        eventId: event.id
      }, { status: 500 })
    }

    console.log(`🎉 [SUCCESS] ===== WEBHOOK PROCESSING COMPLETED SUCCESSFULLY =====`)
    console.log(`🎉 [SUCCESS] Event ID: ${event.id}`)
    console.log(`🎉 [SUCCESS] Event Type: ${event.type}`)
    
    return NextResponse.json({ received: true, eventId: event.id })

  } catch (error) {
    console.error(`💥 [CRITICAL FAILURE] ===== WEBHOOK HANDLER TOP-LEVEL FAILURE =====`)
    console.error(`💥 [CRITICAL FAILURE] Unexpected error in webhook processing:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown top-level error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// Enhanced webhook processing with retry logic
async function processWebhookEventWithRetry(
  event: Stripe.Event, 
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Processing attempt ${attempt}/${maxRetries} for event ${event.id}`)
      
      await processWebhookEvent(event)
      
      console.log(`Successfully processed event ${event.id} on attempt ${attempt}`)
      return { success: true }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`Attempt ${attempt}/${maxRetries} failed for event ${event.id}:`, lastError.message)
      
      // Exponential backoff for retries (100ms, 200ms, 400ms, etc.)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 100
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // All retries failed - send to dead letter queue
  try {
    await sendToDeadLetterQueue(event, lastError?.message || 'Unknown error')
  } catch (dlqError) {
    console.error('Failed to send event to dead letter queue:', dlqError)
  }
  
  return { 
    success: false, 
    error: `Failed after ${maxRetries} attempts: ${lastError?.message}` 
  }
}

// Process individual webhook event
async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  // STEP 1: Check if this is an edge case event that needs special handling
  const edgeCaseEvents = [
    'invoice.payment_failed',
    'charge.dispute.created',
    'charge.dispute.updated', 
    'charge.dispute.closed',
    'payment_method.attached',
    'setup_intent.succeeded',
    'customer.subscription.updated'
  ];

  if (edgeCaseEvents.includes(event.type)) {
    console.log(`🎯 [EDGE_CASE] Processing edge case event: ${event.type}`);
    
    try {
      // Get Stripe configuration for edge case handling
      const { data: configData } = await supabaseAdminClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'stripe_config')
        .single();

      const stripeConfig = configData?.value as any;
      if (stripeConfig) {
        const edgeCaseResult = await handleBillingEdgeCase(event, stripeConfig);
        console.log(`✅ [EDGE_CASE] Edge case handled:`, {
          eventType: event.type,
          success: edgeCaseResult.success,
          handlerUsed: edgeCaseResult.handlerUsed,
          actions: edgeCaseResult.actions
        });
      }
    } catch (edgeCaseError) {
      console.error(`❌ [EDGE_CASE] Edge case handling failed:`, {
        eventType: event.type,
        eventId: event.id,
        error: edgeCaseError instanceof Error ? edgeCaseError.message : 'Unknown error'
      });
      // Don't throw - continue with normal webhook processing
    }
  }

  // STEP 2: Continue with normal webhook processing
  switch (event.type) {
    case 'product.created':
    case 'product.updated':
      await handleProductEvent(event)
      break

    case 'product.deleted':
      await handleProductDeleted(event)
      break

    case 'price.created':
    case 'price.updated':
      await handlePriceEvent(event)
      break

    case 'price.deleted':
      await handlePriceDeleted(event)
      break

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionEvent(event)
      break

    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event)
      break

    case 'setup_intent.succeeded':
      await handleSetupIntentSucceeded(event)
      break

    case 'payment_method.attached':
      await handlePaymentMethodAttached(event)
      break

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event)
      break

    case 'invoice.payment_failed':
      await handlePaymentFailed(event)
      break

    case 'customer.created':
    case 'customer.updated':
    case 'customer.deleted':
      // Handle customer events if needed
      console.log(`Customer event processed: ${event.type}`)
      break

    case 'setup_intent.succeeded':
      await handleSetupIntentSucceeded(event)
      break

    case 'payment_method.attached':
      await handlePaymentMethodAttached(event)
      break

    case 'payment_method.detached':
      console.log('Payment method detached event - handled by main payment method sync')
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
      // Don't throw error for unhandled events
  }
}

// Dead letter queue for failed events
async function sendToDeadLetterQueue(event: Stripe.Event, errorMessage: string): Promise<void> {
  try {
    await supabaseAdminClient
      .from('stripe_webhook_events')
      .update({
        processed: false,
        error_message: `DEAD_LETTER: ${errorMessage}`,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', event.id)
    
    console.error(`Event ${event.id} sent to dead letter queue: ${errorMessage}`)
    
    // TODO: In production, you might want to:
    // 1. Send alert to monitoring system
    // 2. Create admin notification
    // 3. Queue for manual review
    
  } catch (error) {
    console.error('Failed to update dead letter queue status:', error)
  }
}

// Enhanced subscription event handling
async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription
  
  console.log(`🔄 [WEBHOOK] ===== STARTING SUBSCRIPTION EVENT HANDLER =====`)
  console.log(`🔄 [WEBHOOK] Event ID: ${event.id}`)
  console.log(`🔄 [WEBHOOK] Event Type: ${event.type}`)
  console.log(`🔄 [WEBHOOK] Subscription ID: ${subscription.id}`)
  console.log(`🔄 [WEBHOOK] Customer ID: ${subscription.customer}`)
  
  try {
    if (event.type === 'customer.subscription.deleted') {
      console.log(`🗑️ [DELETION] Processing subscription deletion: ${subscription.id} for customer ${subscription.customer}`)
      
      // STEP 1: Update subscription status to canceled instead of deleting
      console.log(`💾 [STEP 1] Updating subscription status to canceled...`)
      try {
        const { error } = await supabaseAdminClient
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            ended_at: new Date().toISOString(),
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) {
          console.error(`💥 [STEP 1 CRITICAL ERROR] Failed to update subscription status on deletion:`, {
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            error: error,
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          throw new Error(`Failed to update subscription on deletion: ${error.message}`)
        }
        
        console.log(`✅ [STEP 1 SUCCESS] Subscription marked as canceled: ${subscription.id} for customer ${subscription.customer}`)
        
      } catch (deleteError) {
        console.error(`💥 [DELETION CRITICAL ERROR] Subscription deletion handling failed:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          error: deleteError,
          message: deleteError instanceof Error ? deleteError.message : 'Unknown deletion error',
          stack: deleteError instanceof Error ? deleteError.stack : undefined
        })
        throw deleteError
      }
      
    } else {
      // Handle subscription creation/update using centralized function with consistent config
      console.log(`🔄 [CREATE/UPDATE] Processing subscription ${event.type}: ${subscription.id} for customer ${subscription.customer}`)
      
      // STEP 1: Get Stripe configuration for consistent API calls
      console.log(`🔧 [STEP 1] Getting Stripe configuration for subscription processing...`)
      let configData, stripeConfig
      try {
        const configResult = await supabaseAdminClient
          .from('admin_settings')
          .select('value')
          .eq('key', 'stripe_config')
          .single()

        configData = configResult.data
        if (configResult.error) {
          console.error(`❌ [STEP 1 ERROR] Failed to get Stripe config for subscription processing:`, configResult.error)
          throw new Error(`Failed to get Stripe config: ${configResult.error.message}`)
        }
        
        stripeConfig = configData?.value as any
        if (!stripeConfig) {
          console.error(`❌ [STEP 1 ERROR] No Stripe config found in database for subscription processing`)
          throw new Error('No Stripe config found in database')
        }
        
        console.log(`✅ [STEP 1 SUCCESS] Stripe configuration loaded for subscription processing`)
        
      } catch (configError) {
        console.error(`💥 [STEP 1 CRITICAL ERROR] Stripe config setup failed for subscription:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          eventType: event.type,
          error: configError,
          message: configError instanceof Error ? configError.message : 'Unknown config error',
          stack: configError instanceof Error ? configError.stack : undefined
        })
        throw configError
      }
      
      // STEP 2: Call the centralized upsert function
      console.log(`💾 [STEP 2] Calling upsertUserSubscriptionWithConfig...`)
      try {
        await upsertUserSubscriptionWithConfig({
          subscriptionId: subscription.id,
          customerId: subscription.customer as string,
          isCreateAction: event.type === 'customer.subscription.created',
          stripeConfig // Pass the same config to ensure consistency
        })
        console.log(`✅ [STEP 2 SUCCESS] Subscription ${event.type} completed: ${subscription.id} for customer ${subscription.customer}`)
        
      } catch (upsertError) {
        console.error(`💥 [STEP 2 CRITICAL ERROR] Subscription upsert failed:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          eventType: event.type,
          isCreateAction: event.type === 'customer.subscription.created',
          error: upsertError,
          message: upsertError instanceof Error ? upsertError.message : 'Unknown upsert error',
          stack: upsertError instanceof Error ? upsertError.stack : undefined
        })
        throw upsertError
      }
    }

    // STEP 3: Invalidate account page cache after any subscription change
    console.log(`🔄 [STEP 3] Invalidating account page cache after subscription ${event.type}...`)
    try {
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/account')
      console.log(`✅ [STEP 3 SUCCESS] Account page cache invalidated`)
      
    } catch (cacheError) {
      console.error(`⚠️ [STEP 3 WARNING] Cache invalidation failed (non-critical):`, {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        eventType: event.type,
        error: cacheError,
        message: cacheError instanceof Error ? cacheError.message : 'Unknown cache error'
      })
      // Don't throw - this is non-critical
    }
    
    console.log(`🎉 [SUCCESS] ===== SUBSCRIPTION EVENT COMPLETED SUCCESSFULLY =====`)
    console.log(`🎉 [SUCCESS] Event ${event.type} processed for subscription ${subscription.id}`)
    
  } catch (error) {
    console.error(`💥 [CRITICAL FAILURE] ===== SUBSCRIPTION EVENT HANDLER FAILED =====`)
    console.error(`💥 [CRITICAL FAILURE] Event ID: ${event.id}`)
    console.error(`💥 [CRITICAL FAILURE] Event Type: ${event.type}`)
    console.error(`💥 [CRITICAL FAILURE] Subscription ID: ${subscription.id}`)
    console.error(`💥 [CRITICAL FAILURE] Customer ID: ${subscription.customer}`)
    console.error(`💥 [CRITICAL FAILURE] Error details:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined
    })
    console.error(`💥 [CRITICAL FAILURE] Full subscription object:`, JSON.stringify(subscription, null, 2))
    throw error // Re-throw to trigger retry
  }
}

// Helper function to ensure customer mapping exists
async function ensureCustomerMapping(session: Stripe.Checkout.Session): Promise<string> {
  const customerId = session.customer as string
  const customerEmail = session.customer_details?.email
  
  console.log(`🔗 [MAPPING] ===== STARTING ENSURE CUSTOMER MAPPING =====`)
  console.log(`🔗 [MAPPING] Session ID: ${session.id}`)
  console.log(`🔗 [MAPPING] Customer ID: ${customerId}`)
  console.log(`🔗 [MAPPING] Customer Email: ${customerEmail}`)
  
  // STEP 1: Validate required data
  console.log(`✅ [STEP 1] Validating customer ID and email...`)
  if (!customerId || !customerEmail) {
    const error = 'Missing customer ID or email in checkout session'
    console.error(`💥 [STEP 1 CRITICAL ERROR] ${error}:`, { 
      customerId, 
      customerEmail,
      sessionId: session.id,
      hasCustomerDetails: !!session.customer_details,
      customerDetailsObject: session.customer_details
    })
    throw new Error(error)
  }
  console.log(`✅ [STEP 1 SUCCESS] Customer ID and email validated`)
  
  // STEP 2: Check if customer mapping already exists
  console.log(`🔍 [STEP 2] Checking for existing customer mapping...`)
  try {
    const { data: existingCustomer, error: lookupError } = await supabaseAdminClient
      .from('stripe_customers')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()
    
    if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error(`💥 [STEP 2 CRITICAL ERROR] Database lookup error:`, {
        customerId,
        customerEmail,
        error: lookupError,
        message: lookupError.message,
        code: lookupError.code,
        details: lookupError.details,
        hint: lookupError.hint
      })
      throw lookupError
    }
    
    if (existingCustomer) {
      console.log(`✅ [STEP 2 SUCCESS] Found existing customer mapping: user ${existingCustomer.id} -> customer ${customerId}`)
      console.log(`🎉 [SUCCESS] ===== CUSTOMER MAPPING FOUND =====`)
      return existingCustomer.id
    }
    
    console.log(`ℹ️ [STEP 2 INFO] No existing customer mapping found, will create new mapping for ${customerEmail}`)
    
  } catch (lookupError) {
    console.error(`💥 [STEP 2 CRITICAL ERROR] Customer mapping lookup failed:`, {
      customerId,
      customerEmail,
      sessionId: session.id,
      error: lookupError,
      message: lookupError instanceof Error ? lookupError.message : 'Unknown lookup error',
      stack: lookupError instanceof Error ? lookupError.stack : undefined
    })
    throw lookupError
  }
  
  // STEP 3: Find user by email
  console.log(`👤 [STEP 3] Finding user by email: ${customerEmail}`)
  let userData
  try {
    const { data: userResult, error: userError } = await supabaseAdminClient
      .from('users')
      .select('id')
      .eq('email', customerEmail)
      .single()
    
    userData = userResult
    if (userError) {
      console.error(`💥 [STEP 3 CRITICAL ERROR] User lookup failed for email ${customerEmail}:`, {
        customerId,
        customerEmail,
        sessionId: session.id,
        error: userError,
        message: userError.message,
        code: userError.code,
        details: userError.details,
        hint: userError.hint
      })
      
      if (userError.code === 'PGRST116') {
        throw new Error(`User not found for email: ${customerEmail}`)
      } else {
        throw userError
      }
    }
    
    if (!userData) {
      const error = `User not found for email: ${customerEmail}`
      console.error(`💥 [STEP 3 CRITICAL ERROR] ${error}`)
      throw new Error(error)
    }
    
    console.log(`✅ [STEP 3 SUCCESS] Found user ${userData.id} for email ${customerEmail}`)
    
  } catch (userLookupError) {
    console.error(`💥 [STEP 3 CRITICAL ERROR] User lookup operation failed:`, {
      customerId,
      customerEmail,
      sessionId: session.id,
      error: userLookupError,
      message: userLookupError instanceof Error ? userLookupError.message : 'Unknown user lookup error',
      stack: userLookupError instanceof Error ? userLookupError.stack : undefined
    })
    throw userLookupError
  }
  
  // STEP 4: Create customer mapping
  console.log(`🔗 [STEP 4] Creating customer mapping: user ${userData.id} -> customer ${customerId}`)
  try {
    const mappingData = {
      id: userData.id,
      stripe_customer_id: customerId,
      email: customerEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log(`📤 [STEP 4A] Inserting customer mapping with data:`, mappingData)
    
    const { data: newCustomer, error: customerError } = await supabaseAdminClient
      .from('stripe_customers')
      .insert(mappingData)
      .select('id')
      .single()
    
    if (customerError) {
      console.error(`💥 [STEP 4 CRITICAL ERROR] Customer mapping creation failed:`, {
        customerId,
        customerEmail,
        userId: userData.id,
        sessionId: session.id,
        mappingData,
        error: customerError,
        message: customerError.message,
        code: customerError.code,
        details: customerError.details,
        hint: customerError.hint
      })
      throw new Error(`Failed to create customer mapping: ${customerError.message}`)
    }
    
    if (!newCustomer) {
      const error = `Failed to create customer mapping - no data returned`
      console.error(`💥 [STEP 4 CRITICAL ERROR] ${error}:`, {
        customerId,
        customerEmail,
        userId: userData.id,
        sessionId: session.id,
        mappingData
      })
      throw new Error(error)
    }
    
    console.log(`✅ [STEP 4 SUCCESS] Created customer mapping: user ${userData.id} -> customer ${customerId}`)
    console.log(`🎉 [SUCCESS] ===== CUSTOMER MAPPING CREATED SUCCESSFULLY =====`)
    return newCustomer.id
    
  } catch (createError) {
    console.error(`💥 [STEP 4 CRITICAL ERROR] Customer mapping creation operation failed:`, {
      customerId,
      customerEmail,
      userId: userData.id,
      sessionId: session.id,
      error: createError,
      message: createError instanceof Error ? createError.message : 'Unknown creation error',
      stack: createError instanceof Error ? createError.stack : undefined
    })
    throw createError
  }
}

// Handle successful checkout sessions
async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session
  
  console.log(`🛒 [WEBHOOK] ===== STARTING CHECKOUT SESSION COMPLETED HANDLER =====`)
  console.log(`🛒 [WEBHOOK] Event ID: ${event.id}`)
  console.log(`🛒 [WEBHOOK] Session ID: ${session.id}`)
  console.log(`🛒 [WEBHOOK] Customer: ${session.customer}`)
  
  try {
    console.log(`🛒 [WEBHOOK] Checkout session completed: ${session.id} for customer ${session.customer}`)
    console.log(`🔍 [DEBUG] Session details:`, {
      sessionId: session.id,
      customerId: session.customer,
      customerEmail: session.customer_details?.email,
      paymentStatus: session.payment_status,
      mode: session.mode,
      subscriptionId: session.subscription
    })
    
    // STEP 1: Get Stripe configuration for API calls
    console.log(`🔧 [STEP 1] Getting Stripe configuration...`)
    let configData, stripeConfig, stripe
    try {
      const configResult = await supabaseAdminClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'stripe_config')
        .single()
      
      configData = configResult.data
      if (configResult.error) {
        console.error(`❌ [STEP 1 ERROR] Failed to get Stripe config:`, configResult.error)
        throw new Error(`Failed to get Stripe config: ${configResult.error.message}`)
      }
      
      stripeConfig = configData?.value as any
      if (!stripeConfig) {
        console.error(`❌ [STEP 1 ERROR] No Stripe config found in database`)
        throw new Error('No Stripe config found in database')
      }
      
      stripe = createStripeAdminClient(stripeConfig)
      console.log(`✅ [STEP 1 SUCCESS] Stripe configuration loaded and client created`)
      
    } catch (configError) {
      console.error(`💥 [STEP 1 CRITICAL ERROR] Stripe config setup failed:`, {
        error: configError,
        message: configError instanceof Error ? configError.message : 'Unknown config error',
        stack: configError instanceof Error ? configError.stack : undefined
      })
      throw configError
    }
    
    // STEP 2: Retrieve full checkout session with subscription expansion
    console.log(`🔍 [STEP 2] Retrieving full checkout session with expansions...`)
    let fullSession
    try {
      fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['subscription', 'customer']
      })
      console.log(`✅ [STEP 2 SUCCESS] Full session retrieved:`, {
        id: fullSession.id,
        mode: fullSession.mode,
        paymentStatus: fullSession.payment_status,
        hasSubscription: !!fullSession.subscription,
        customer: fullSession.customer
      })
      
    } catch (sessionError) {
      console.error(`💥 [STEP 2 CRITICAL ERROR] Failed to retrieve checkout session:`, {
        sessionId: session.id,
        error: sessionError,
        message: sessionError instanceof Error ? sessionError.message : 'Unknown session retrieval error',
        stack: sessionError instanceof Error ? sessionError.stack : undefined
      })
      throw sessionError
    }
    
    // STEP 3: Check if subscription exists
    if (!fullSession.subscription) {
      console.log(`⚠️ [WARNING] No subscription found for checkout session ${session.id}, skipping subscription handling`)
      console.log(`🔍 [DEBUG] Full session data:`, {
        id: fullSession.id,
        mode: fullSession.mode,
        paymentStatus: fullSession.payment_status,
        hasSubscription: !!fullSession.subscription,
        customer: fullSession.customer
      })
      return
    }
    
    // STEP 4: Ensure customer mapping exists
    console.log(`🔗 [STEP 4] Ensuring customer mapping for session ${fullSession.id}...`)
    let userId
    try {
      userId = await ensureCustomerMapping(fullSession)
      console.log(`✅ [STEP 4 SUCCESS] Customer mapping confirmed for user ${userId}`)
      
    } catch (mappingError) {
      console.error(`💥 [STEP 4 CRITICAL ERROR] Customer mapping failed:`, {
        sessionId: fullSession.id,
        customerId: fullSession.customer,
        customerEmail: fullSession.customer_details?.email,
        error: mappingError,
        message: mappingError instanceof Error ? mappingError.message : 'Unknown mapping error',
        stack: mappingError instanceof Error ? mappingError.stack : undefined
      })
      throw mappingError
    }
    
    // STEP 5: Extract subscription and customer IDs
    console.log(`📋 [STEP 5] Extracting subscription and customer IDs...`)
    let subscriptionId, customerId
    try {
      subscriptionId = typeof fullSession.subscription === 'string' 
        ? fullSession.subscription 
        : fullSession.subscription.id
      customerId = typeof fullSession.customer === 'string' 
        ? fullSession.customer 
        : fullSession.customer!.id
      
      console.log(`✅ [STEP 5 SUCCESS] IDs extracted:`, {
        subscriptionId,
        customerId,
        userId,
        isCreateAction: true
      })
      
    } catch (extractError) {
      console.error(`💥 [STEP 5 CRITICAL ERROR] ID extraction failed:`, {
        subscription: fullSession.subscription,
        customer: fullSession.customer,
        error: extractError,
        message: extractError instanceof Error ? extractError.message : 'Unknown extraction error'
      })
      throw extractError
    }
    
    // STEP 6: Create/update subscription using the centralized function
    console.log(`💾 [STEP 6] Upserting subscription with config...`)
    try {
      await upsertUserSubscriptionWithConfig({
        subscriptionId,
        customerId,
        isCreateAction: true,
        stripeConfig // Pass the same config to ensure consistency
      })
      console.log(`✅ [STEP 6 SUCCESS] Subscription upserted successfully for user ${userId}`)
      
    } catch (upsertError) {
      console.error(`💥 [STEP 6 CRITICAL ERROR] Subscription upsert failed:`, {
        subscriptionId,
        customerId,
        userId,
        error: upsertError,
        message: upsertError instanceof Error ? upsertError.message : 'Unknown upsert error',
        stack: upsertError instanceof Error ? upsertError.stack : undefined
      })
      throw upsertError
    }
    
    // STEP 7: Revalidate the account page cache
    console.log(`🔄 [STEP 7] Revalidating account page cache...`)
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/account');
      console.log(`✅ [STEP 7 SUCCESS] Account page cache revalidated`)
      
    } catch (cacheError) {
      console.error(`⚠️ [STEP 7 WARNING] Cache revalidation failed (non-critical):`, {
        error: cacheError,
        message: cacheError instanceof Error ? cacheError.message : 'Unknown cache error'
      })
      // Don't throw - this is non-critical
    }

    // STEP 8: Save payment method from the checkout session if available
    console.log(`💳 [STEP 8] Attempting to save payment method from checkout session...`)
    try {
      if (fullSession.mode === 'subscription' && fullSession.payment_intent) {
        console.log(`💳 [DEBUG] Getting payment method from payment intent...`)
        
        // Get payment intent to find payment method
        const paymentIntentId = typeof fullSession.payment_intent === 'string' 
          ? fullSession.payment_intent 
          : fullSession.payment_intent.id

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        
        if (paymentIntent.payment_method) {
          const paymentMethodId = typeof paymentIntent.payment_method === 'string' 
            ? paymentIntent.payment_method 
            : paymentIntent.payment_method.id

          // Retrieve payment method details
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
          
          await savePaymentMethodToDatabase(paymentMethod, customerId)
          console.log(`✅ [STEP 8 SUCCESS] Payment method ${paymentMethodId} saved from checkout session`)
        } else {
          console.log(`ℹ️ [STEP 8 INFO] No payment method found in payment intent`)
        }
      } else {
        console.log(`ℹ️ [STEP 8 INFO] Not a subscription checkout or no payment intent`)
      }
    } catch (paymentMethodError) {
      console.error('⚠️ [STEP 8 WARNING] Failed to save payment method from checkout session (subscription still created):', {
        error: paymentMethodError,
        message: paymentMethodError instanceof Error ? paymentMethodError.message : 'Unknown payment method error',
        stack: paymentMethodError instanceof Error ? paymentMethodError.stack : undefined
      })
      // Don't throw error - subscription creation is more important
    }
    
    // STEP 9: Additional payment method handling
    console.log(`💳 [STEP 9] Additional payment method handling for card payments...`)
    try {
      if (fullSession.payment_method_types?.includes('card')) {
        await saveCheckoutPaymentMethodWithConfig(fullSession, userId, stripe)
        console.log(`✅ [STEP 9 SUCCESS] Additional payment method handling completed`)
      } else {
        console.log(`ℹ️ [STEP 9 INFO] No card payment methods to save`)
      }
    } catch (pmError) {
      console.error('⚠️ [STEP 9 WARNING] Failed to save additional payment method from checkout (non-critical):', {
        error: pmError,
        message: pmError instanceof Error ? pmError.message : 'Unknown additional payment method error'
      })
      // Don't fail the entire checkout process if payment method saving fails
    }

    console.log(`🎉 [SUCCESS] ===== CHECKOUT SESSION COMPLETED SUCCESSFULLY =====`)
    console.log(`🎉 [SUCCESS] Session ${session.id} processed for user ${userId}`)
    
  } catch (error) {
    console.error(`💥 [CRITICAL FAILURE] ===== CHECKOUT SESSION HANDLER FAILED =====`)
    console.error(`💥 [CRITICAL FAILURE] Session ID: ${session.id}`)
    console.error(`💥 [CRITICAL FAILURE] Customer: ${session.customer}`)
    console.error(`💥 [CRITICAL FAILURE] Error details:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined
    })
    console.error(`💥 [CRITICAL FAILURE] Full session object:`, JSON.stringify(session, null, 2))
    throw error
  }
}

// Version of upsertUserSubscription that accepts Stripe config for consistency
async function upsertUserSubscriptionWithConfig({
  subscriptionId,
  customerId,
  isCreateAction,
  stripeConfig
}: {
  subscriptionId: string;
  customerId: string;
  isCreateAction?: boolean;
  stripeConfig: any;
}) {
  console.log(`🔄 [UPSERT] ===== STARTING UPSERT USER SUBSCRIPTION WITH CONFIG =====`)
  console.log(`🔄 [UPSERT] Subscription ID: ${subscriptionId}`)
  console.log(`🔄 [UPSERT] Customer ID: ${customerId}`)
  console.log(`🔄 [UPSERT] Is Create Action: ${isCreateAction}`)
  
  // STEP 1: Validate required parameters
  console.log(`✅ [STEP 1] Validating required parameters...`)
  if (!subscriptionId || typeof subscriptionId !== 'string') {
    const error = 'Invalid subscription ID provided to upsertUserSubscriptionWithConfig'
    console.error(`💥 [STEP 1 CRITICAL ERROR] ${error}:`, { subscriptionId, type: typeof subscriptionId })
    throw new Error(error);
  }
  
  if (!customerId || typeof customerId !== 'string') {
    const error = 'Invalid customer ID provided to upsertUserSubscriptionWithConfig'
    console.error(`💥 [STEP 1 CRITICAL ERROR] ${error}:`, { customerId, type: typeof customerId })
    throw new Error(error);
  }
  
  if (!stripeConfig) {
    const error = 'Stripe configuration is required for upsertUserSubscriptionWithConfig'
    console.error(`💥 [STEP 1 CRITICAL ERROR] ${error}:`, { stripeConfig })
    throw new Error(error);
  }
  
  console.log(`✅ [STEP 1 SUCCESS] All required parameters validated`)
  
  try {
    // STEP 2: Get customer's userId from mapping table with retry mechanism
    console.log(`🔍 [STEP 2] Looking up user ID for Stripe customer: ${customerId}`)
    let customerData
    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 500 // ms
    
    while (retryCount <= maxRetries) {
      try {
        const customerResult = await supabaseAdminClient
          .from('stripe_customers')
          .select('user_id') // CRITICAL FIX: Was selecting 'id', should be 'user_id'
          .eq('stripe_customer_id', customerId)
          .single();
        
        customerData = customerResult.data
        if (customerResult.error) {
          if (customerResult.error.code === 'PGRST116' && retryCount < maxRetries) {
            // No rows returned - customer might not be saved yet due to race condition
            console.warn(`⚠️ [STEP 2 RETRY ${retryCount + 1}/${maxRetries}] Customer ${customerId} not found, retrying in ${retryDelay}ms...`)
            retryCount++
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue
          }
          
          console.error(`💥 [STEP 2 CRITICAL ERROR] Customer lookup failed for ${customerId} after ${retryCount + 1} attempts:`, {
            error: customerResult.error,
            message: customerResult.error.message,
            code: customerResult.error.code,
            details: customerResult.error.details,
            hint: customerResult.error.hint
          });
          throw customerResult.error;
        }
        
        if (!customerData || !customerData.user_id) {
          if (retryCount < maxRetries) {
            console.warn(`⚠️ [STEP 2 RETRY ${retryCount + 1}/${maxRetries}] Customer data incomplete for ${customerId}, retrying in ${retryDelay}ms...`)
            retryCount++
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue
          }
          
          const error = `Customer mapping not found for Stripe customer: ${customerId} after ${retryCount + 1} attempts`
          console.error(`💥 [STEP 2 CRITICAL ERROR] ${error}`)
          throw new Error(error);
        }

        console.log(`✅ [STEP 2 SUCCESS] Found user ID: ${customerData.user_id} for Stripe customer: ${customerId}`)
        break
        
      } catch (customerLookupError) {
        if (retryCount < maxRetries && 
            (customerLookupError instanceof Error && 
             (customerLookupError.message.includes('not found') || 
              customerLookupError.message.includes('0 rows')))) {
          console.warn(`⚠️ [STEP 2 RETRY ${retryCount + 1}/${maxRetries}] Customer lookup failed, retrying in ${retryDelay}ms:`, customerLookupError.message)
          retryCount++
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
        
        console.error(`💥 [STEP 2 CRITICAL ERROR] Customer lookup operation failed after ${retryCount + 1} attempts:`, {
          customerId,
          error: customerLookupError,
          message: customerLookupError instanceof Error ? customerLookupError.message : 'Unknown customer lookup error',
          stack: customerLookupError instanceof Error ? customerLookupError.stack : undefined
        })
        throw customerLookupError
      }
    }

    if (!customerData?.user_id) {
      console.error(`❌ [STEP 2 ERROR] No user_id found in customer data for ${customerId}`)
      throw new Error(`Customer data missing user_id for customer: ${customerId}`)
    }
    
    const { user_id: userId } = customerData; // CRITICAL FIX: Use user_id instead of id

    // STEP 3: Create Stripe client and retrieve subscription
    console.log(`🔌 [STEP 3] Creating Stripe client and retrieving subscription: ${subscriptionId}`)
    let stripe, subscription
    try {
      stripe = createStripeAdminClient(stripeConfig);
      console.log(`✅ [STEP 3A] Stripe client created successfully`)
      
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method'],
      });
      
      console.log(`✅ [STEP 3B] Subscription retrieved from Stripe:`, {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer,
        priceId: subscription.items.data[0]?.price?.id,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        itemsCount: subscription.items.data.length
      });
      
    } catch (stripeError) {
      console.error(`💥 [STEP 3 CRITICAL ERROR] Stripe client creation or subscription retrieval failed:`, {
        subscriptionId,
        customerId,
        userId,
        error: stripeError,
        message: stripeError instanceof Error ? stripeError.message : 'Unknown stripe error',
        stack: stripeError instanceof Error ? stripeError.stack : undefined,
        stripeErrorType: stripeError instanceof Error ? stripeError.name : undefined
      })
      throw stripeError
    }

    // STEP 4: Extract price ID and prepare subscription data
    console.log(`📋 [STEP 4] Preparing subscription data for database upsert...`)
    let priceId
    try {
      if (!subscription.items.data || subscription.items.data.length === 0) {
        const error = `No subscription items found for subscription ${subscriptionId}`
        console.error(`💥 [STEP 4 CRITICAL ERROR] ${error}`)
        throw new Error(error)
      }
      
      priceId = subscription.items.data[0].price.id;
      if (!priceId) {
        const error = `No price ID found in subscription items for subscription ${subscriptionId}`
        console.error(`💥 [STEP 4 CRITICAL ERROR] ${error}`)
        throw new Error(error)
      }
      
      console.log(`✅ [STEP 4 SUCCESS] Subscription data prepared:`, {
        subscriptionId: subscription.id,
        userId: userId,
        status: subscription.status,
        priceId: priceId,
        customerId: customerId
      });
      
    } catch (dataError) {
      console.error(`💥 [STEP 4 CRITICAL ERROR] Subscription data preparation failed:`, {
        subscriptionId,
        customerId,
        userId,
        subscriptionItems: subscription.items?.data,
        error: dataError,
        message: dataError instanceof Error ? dataError.message : 'Unknown data preparation error'
      })
      throw dataError
    }

    // STEP 5: Perform safe database upsert using RPC function
    console.log(`💾 [STEP 5] Performing safe database upsert using RPC function...`)
    try {
      const rpcParams = {
        p_stripe_subscription_id: subscription.id,
        p_user_id: userId,
        p_stripe_customer_id: customerId,
        p_stripe_price_id: priceId,
        p_status: subscription.status,
        p_metadata: subscription.metadata || {},
        p_cancel_at_period_end: subscription.cancel_at_period_end,
        p_current_period_start: toDateTime(subscription.current_period_start).toISOString(),
        p_current_period_end: toDateTime(subscription.current_period_end).toISOString(),
        p_trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
        p_trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
        p_cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
        p_canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
        p_ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null
      }
      
      console.log(`📤 [STEP 5A] Calling RPC with parameters:`, {
        functionName: 'upsert_subscription_by_stripe_id',
        subscriptionId: rpcParams.p_stripe_subscription_id,
        userId: rpcParams.p_user_id,
        customerId: rpcParams.p_stripe_customer_id,
        priceId: rpcParams.p_stripe_price_id,
        status: rpcParams.p_status,
        cancelAtPeriodEnd: rpcParams.p_cancel_at_period_end
      })

      const { data: upsertResult, error: upsertError } = await supabaseAdminClient.rpc('upsert_subscription_by_stripe_id', rpcParams);

      if (upsertError) {
        console.error(`💥 [STEP 5 CRITICAL ERROR] Database upsert RPC failed for subscription ${subscription.id}:`, {
          error: upsertError,
          message: upsertError.message,
          code: upsertError.code,
          details: upsertError.details,
          hint: upsertError.hint,
          userId,
          customerId,
          priceId,
          subscriptionStatus: subscription.status,
          rpcParams
        });
        
        throw new Error(`Database upsert failed: ${upsertError.message}`);
      } else {
        console.log(`✅ [STEP 5 SUCCESS] Safe upsert successful: subscription [${subscription.id}] upserted with result: ${upsertResult}`);
      }
      
    } catch (upsertError) {
      console.error(`💥 [STEP 5 CRITICAL ERROR] Database upsert operation failed:`, {
        subscriptionId,
        customerId,
        userId,
        priceId,
        error: upsertError,
        message: upsertError instanceof Error ? upsertError.message : 'Unknown upsert error',
        stack: upsertError instanceof Error ? upsertError.stack : undefined
      })
      throw upsertError
    }
    
    // STEP 6: Verify the subscription was actually created/updated
    console.log(`🔍 [STEP 6] Verifying subscription was created/updated in database...`)
    try {
      const { data: verifyData, error: verifyError } = await supabaseAdminClient
        .from('subscriptions')
        .select('id, user_id, status, stripe_price_id, stripe_subscription_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      
      if (verifyError || !verifyData) {
        console.error(`💥 [STEP 6 CRITICAL ERROR] Verification failed - could not find subscription ${subscription.id} after upsert:`, {
          verifyError,
          hasVerifyData: !!verifyData,
          subscriptionId: subscription.id,
          userId,
          customerId
        });
        throw new Error(`Subscription upsert verification failed: ${verifyError?.message || 'Record not found'}`);
      }
      
      console.log(`✅ [STEP 6 SUCCESS] Subscription verification confirmed in database:`, {
        id: verifyData.id,
        stripeSubscriptionId: verifyData.stripe_subscription_id,
        userId: verifyData.user_id,
        status: verifyData.status,
        priceId: verifyData.stripe_price_id
      });
      
    } catch (verifyError) {
      console.error(`💥 [STEP 6 CRITICAL ERROR] Database verification operation failed:`, {
        subscriptionId,
        customerId,
        userId,
        error: verifyError,
        message: verifyError instanceof Error ? verifyError.message : 'Unknown verification error',
        stack: verifyError instanceof Error ? verifyError.stack : undefined
      })
      throw verifyError
    }

    console.log(`🎉 [SUCCESS] ===== UPSERT USER SUBSCRIPTION COMPLETED SUCCESSFULLY =====`)
    console.log(`🎉 [SUCCESS] Subscription ${subscriptionId} successfully upserted for user ${userId}`)
    
  } catch (error) {
    console.error(`💥 [CRITICAL FAILURE] ===== UPSERT USER SUBSCRIPTION FAILED =====`)
    console.error(`💥 [CRITICAL FAILURE] Subscription ID: ${subscriptionId}`)
    console.error(`💥 [CRITICAL FAILURE] Customer ID: ${customerId}`)
    console.error(`💥 [CRITICAL FAILURE] Is Create Action: ${isCreateAction}`)
    console.error(`💥 [CRITICAL FAILURE] Error details:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined
    })
    throw error;
  }
}

// Version of saveCheckoutPaymentMethod that accepts Stripe client for consistency
async function saveCheckoutPaymentMethodWithConfig(session: Stripe.Checkout.Session, userId: string, stripe: Stripe): Promise<void> {
  try {
    // Get payment method from session - checkout sessions don't have payment_method directly
    // We need to use the customer and retrieve payment methods from the customer
    if (!session.customer && !session.setup_intent) {
      console.log(`⚠️ No customer or setup intent in checkout session ${session.id}`)
      return
    }
    
    let paymentMethodId: string | null = null
    
    if (session.setup_intent) {
      // Get payment method from setup intent
      const setupIntent = await stripe.setupIntents.retrieve(
        typeof session.setup_intent === 'string' 
          ? session.setup_intent 
          : session.setup_intent.id
      )
      
      if (setupIntent.payment_method) {
        paymentMethodId = typeof setupIntent.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent.payment_method.id
      }
    } else if (session.customer) {
      // Get the most recent payment method from the customer
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 1,
      })
      
      if (paymentMethods.data.length > 0) {
        paymentMethodId = paymentMethods.data[0].id
      }
    }
    
    if (!paymentMethodId) {
      console.log(`⚠️ No payment method found in checkout session ${session.id}`)
      return
    }
    
    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    await savePaymentMethodToDatabase(paymentMethod, session.customer as string)
    
    console.log(`✅ Payment method saved from checkout: ${paymentMethod.id}`)
    
  } catch (error) {
    console.error('Failed to save payment method from checkout:', error)
    throw error
  }
}

// Handle successful payment
async function handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice
  
  try {
    console.log(`💰 [WEBHOOK] Payment succeeded: ${invoice.id} for customer ${invoice.customer}`)
    
    if (!invoice.customer || !invoice.subscription) {
      console.log(`⚠️ [WARNING] Payment succeeded but missing customer or subscription data`, {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        subscriptionId: invoice.subscription
      })
      return
    }

    // Get Stripe configuration for API calls
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single()

    const stripeConfig = configData?.value as any
    const stripe = createStripeAdminClient(stripeConfig)

    // Retrieve full invoice with line items
    const fullInvoice = await stripe.invoices.retrieve(invoice.id, {
      expand: ['lines', 'subscription', 'customer']
    })

    // Find the customer mapping
    const { data: customer } = await supabaseAdminClient
      .from('stripe_customers')
      .select('id')
      .eq('stripe_customer_id', invoice.customer as string)
      .single()

    if (!customer) {
      console.error(`❌ [ERROR] Customer mapping not found for stripe_customer_id: ${invoice.customer}`)
      return
    }

    // Update subscription status if needed (ensure it's active after successful payment)
    if (invoice.subscription) {
      console.log(`🔄 [DEBUG] Ensuring subscription is synced after successful payment`)
      await upsertUserSubscription({
        subscriptionId: invoice.subscription as string,
        customerId: invoice.customer as string,
        isCreateAction: false
      })
    }

    // Store billing history in subscription_changes table for tracking
    try {
      await supabaseAdminClient
        .from('subscription_changes')
        .insert({
          user_id: customer.id,
          change_type: 'payment_succeeded',
          old_value: null,
          new_value: {
            invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            subscription_id: invoice.subscription
          },
          timestamp: new Date().toISOString(),
          metadata: {
            stripe_invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            payment_intent: invoice.payment_intent,
            hosted_invoice_url: invoice.hosted_invoice_url
          }
        })
      
      console.log(`📋 [SUCCESS] Billing history recorded for invoice ${invoice.id}`)
    } catch (historyError) {
      console.error('⚠️ [WARNING] Failed to record billing history (continuing):', historyError)
      // Don't fail the webhook if history recording fails
    }

    // Invalidate account page cache to refresh UI immediately
    console.log(`🔄 [CACHE] Invalidating account page cache after payment success`)
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/account')

    console.log(`✅ [SUCCESS] Payment succeeded handler completed for invoice ${invoice.id}`)
    
  } catch (error) {
    console.error('❌ [ERROR] Failed to handle payment success:', error)
    throw error
  }
}

// Handle failed payment
async function handlePaymentFailed(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice
  
  try {
    console.log(`❌ [WEBHOOK] Payment failed: ${invoice.id} for customer ${invoice.customer}`)
    
    if (!invoice.customer || !invoice.subscription) {
      console.log(`⚠️ [WARNING] Payment failed but missing customer or subscription data`, {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        subscriptionId: invoice.subscription
      })
      return
    }

    // Find the customer mapping
    const { data: customer } = await supabaseAdminClient
      .from('stripe_customers')
      .select('id')
      .eq('stripe_customer_id', invoice.customer as string)
      .single()

    if (!customer) {
      console.error(`❌ [ERROR] Customer mapping not found for stripe_customer_id: ${invoice.customer}`)
      return
    }

    // Record payment failure in subscription_changes for tracking
    try {
      await supabaseAdminClient
        .from('subscription_changes')
        .insert({
          user_id: customer.id,
          change_type: 'payment_failed',
          old_value: null,
          new_value: {
            invoice_id: invoice.id,
            amount_due: invoice.amount_due,
            currency: invoice.currency,
            attempt_count: invoice.attempt_count,
            next_payment_attempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
            subscription_id: invoice.subscription
          },
          timestamp: new Date().toISOString(),
          metadata: {
            stripe_invoice_id: invoice.id,
            amount_due: invoice.amount_due,
            currency: invoice.currency,
            payment_intent: invoice.payment_intent,
            failure_code: invoice.last_finalization_error?.code,
            failure_message: invoice.last_finalization_error?.message
          }
        })
      
      console.log(`📋 [SUCCESS] Payment failure recorded for invoice ${invoice.id}`)
    } catch (historyError) {
      console.error('⚠️ [WARNING] Failed to record payment failure history (continuing):', historyError)
      // Don't fail the webhook if history recording fails
    }

    // Invalidate account page cache to refresh billing status immediately
    console.log(`🔄 [CACHE] Invalidating account page cache after payment failure`)
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/account')

    console.log(`✅ [SUCCESS] Payment failed handler completed for invoice ${invoice.id}`)
    
  } catch (error) {
    console.error('❌ [ERROR] Failed to handle payment failure:', error)
    throw error
  }
}

async function handleProductEvent(event: Stripe.Event): Promise<void> {
  const product = event.data.object as Stripe.Product

  try {
    const result = await supabaseAdminClient
      .from('stripe_products')
      .upsert({
        stripe_product_id: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_product_id'
      })

    if (result?.error) {
      throw new Error(`Database error: ${result.error.message}`)
    }

    console.log(`Product ${event.type}: ${product.name} (${product.id})`)
  } catch (error) {
    console.error('Failed to sync product:', error)
    throw error // Re-throw to trigger retry logic
  }
}

async function handleProductDeleted(event: Stripe.Event): Promise<void> {
  const product = event.data.object as Stripe.Product

  try {
    const result = await supabaseAdminClient
      .from('stripe_products')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('stripe_product_id', product.id)

    if (result?.error) {
      throw new Error(`Database error: ${result.error.message}`)
    }

    console.log(`Product deleted: ${product.name} (${product.id})`)
  } catch (error) {
    console.error('Failed to mark product as deleted:', error)
    throw error // Re-throw to trigger retry logic
  }
}

async function handlePriceEvent(event: Stripe.Event): Promise<void> {
  const price = event.data.object as Stripe.Price

  try {
    const result = await supabaseAdminClient
      .from('stripe_prices')
      .upsert({
        stripe_price_id: price.id,
        stripe_product_id: typeof price.product === 'string' ? price.product : price.product?.id,
        unit_amount: price.unit_amount || 0,
        currency: price.currency,
        recurring_interval: price.recurring?.interval || null,
        active: price.active,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_price_id'
      })

    if (result?.error) {
      throw new Error(`Database error: ${result.error.message}`)
    }

    console.log(`Price ${event.type}: ${price.id} for product ${price.product}`)
  } catch (error) {
    console.error('Failed to sync price:', error)
    throw error // Re-throw to trigger retry logic
  }
}

async function handlePriceDeleted(event: Stripe.Event): Promise<void> {
  const price = event.data.object as Stripe.Price

  try {
    const result = await supabaseAdminClient
      .from('stripe_prices')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('stripe_price_id', price.id)

    if (result?.error) {
      throw new Error(`Database error: ${result.error.message}`)
    }

    console.log(`Price deleted: ${price.id}`)
  } catch (error) {
    console.error('Failed to mark price as deleted:', error)
    throw error // Re-throw to trigger retry logic
  }
}

// Handle setup intent succeeded for payment method creation
async function handleSetupIntentSucceeded(event: Stripe.Event): Promise<void> {
  const setupIntent = event.data.object as Stripe.SetupIntent
  
  try {
    console.log(`💳 [WEBHOOK] Setup intent succeeded: ${setupIntent.id} for customer ${setupIntent.customer}`)
    
    if (!setupIntent.payment_method || !setupIntent.customer) {
      console.log(`⚠️ [WARNING] Setup intent ${setupIntent.id} missing payment method or customer`)
      return
    }
    
    // CRITICAL FIX: Use consistent Stripe configuration
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single()

    const stripeConfig = configData?.value as any
    const stripe = createStripeAdminClient(stripeConfig)
    
    // Get payment method details from Stripe using consistent client
    const paymentMethod = await stripe.paymentMethods.retrieve(
      typeof setupIntent.payment_method === 'string' 
        ? setupIntent.payment_method 
        : setupIntent.payment_method.id
    )
    
    await savePaymentMethodToDatabase(paymentMethod, setupIntent.customer as string)
    
    console.log(`✅ [SUCCESS] Payment method saved from setup intent: ${paymentMethod.id}`)

    // Invalidate account page cache after setup intent payment method is saved
    console.log(`🔄 [CACHE] Invalidating account page cache after setup intent success`)
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/account')
    
  } catch (error) {
    console.error('Failed to handle setup intent succeeded:', error)
    throw error
  }
}

// Handle payment method attached event
async function handlePaymentMethodAttached(event: Stripe.Event): Promise<void> {
  const paymentMethod = event.data.object as Stripe.PaymentMethod
  
  try {
    console.log(`💳 [WEBHOOK] Payment method attached: ${paymentMethod.id} to customer ${paymentMethod.customer}`)
    
    if (!paymentMethod.customer) {
      console.log(`⚠️ [WARNING] Payment method ${paymentMethod.id} has no customer`)
      return
    }
    
    // Save payment method to database
    await savePaymentMethodToDatabase(paymentMethod, paymentMethod.customer as string)
    
    console.log(`✅ [SUCCESS] Payment method saved: ${paymentMethod.id}`)

    // Invalidate account page cache to refresh payment methods section immediately
    console.log(`🔄 [CACHE] Invalidating account page cache after payment method attachment`)
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/account')
    
  } catch (error) {
    console.error('❌ [ERROR] Failed to handle payment method attached:', error)
    throw error
  }
}

// Save payment method from checkout session
async function saveCheckoutPaymentMethod(session: Stripe.Checkout.Session, userId: string): Promise<void> {
  try {
    // Get payment method from session - checkout sessions don't have payment_method directly
    // We need to use the customer and retrieve payment methods from the customer
    if (!session.customer && !session.setup_intent) {
      console.log(`⚠️ No customer or setup intent in checkout session ${session.id}`)
      return
    }
    
    let paymentMethodId: string | null = null
    
    if (session.setup_intent) {
      // Get payment method from setup intent
      const setupIntent = await stripeAdmin.setupIntents.retrieve(
        typeof session.setup_intent === 'string' 
          ? session.setup_intent 
          : session.setup_intent.id
      )
      
      if (setupIntent.payment_method) {
        paymentMethodId = typeof setupIntent.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent.payment_method.id
      }
    } else if (session.customer) {
      // Get the most recent payment method from the customer
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id
      const paymentMethods = await stripeAdmin.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 1,
      })
      
      if (paymentMethods.data.length > 0) {
        paymentMethodId = paymentMethods.data[0].id
      }
    }
    
    if (!paymentMethodId) {
      console.log(`⚠️ No payment method found in checkout session ${session.id}`)
      return
    }
    
    // Get payment method details
    const paymentMethod = await stripeAdmin.paymentMethods.retrieve(paymentMethodId)
    
    await savePaymentMethodToDatabase(paymentMethod, session.customer as string)
    
    console.log(`✅ Payment method saved from checkout: ${paymentMethod.id}`)
    
  } catch (error) {
    console.error('Failed to save payment method from checkout:', error)
    throw error
  }
}

// Common function to save payment method to database
async function savePaymentMethodToDatabase(paymentMethod: Stripe.PaymentMethod, stripeCustomerId: string): Promise<void> {
  try {
    // Find user by customer ID
    const { data: customer, error: customerError } = await supabaseAdminClient
      .from('stripe_customers')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()
    
    if (customerError || !customer) {
      console.error(`❌ Customer not found for stripe_customer_id: ${stripeCustomerId}`)
      return
    }
    
    // Prepare card data
    const cardData = paymentMethod.card ? {
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      country: paymentMethod.card.country || '',
      funding: paymentMethod.card.funding || 'unknown'
    } : {}
    
    // Check if this is the user's first payment method (make it default)
    const { data: existingPaymentMethods } = await supabaseAdminClient
      .from('payment_methods')
      .select('id')
      .eq('user_id', customer.id)
    
    const isFirstPaymentMethod = !existingPaymentMethods || existingPaymentMethods.length === 0
    
    // Save to database
    const { error: insertError } = await supabaseAdminClient
      .from('payment_methods')
      .upsert({
        id: paymentMethod.id,
        user_id: customer.id,
        stripe_customer_id: stripeCustomerId,
        type: paymentMethod.type,
        card_data: cardData,
        is_default: isFirstPaymentMethod, // First payment method becomes default
        metadata: paymentMethod.metadata || {},
        created_at: new Date(paymentMethod.created * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
    
    if (insertError) {
      console.error('Failed to save payment method to database:', insertError)
      throw new Error(`Database error: ${insertError.message}`)
    }
    
    console.log(`💾 Payment method saved to database: ${paymentMethod.id} for user ${customer.id} (default: ${isFirstPaymentMethod})`)
    
  } catch (error) {
    console.error('Failed to save payment method to database:', error)
    throw error
  }
}

// Helper function to get user ID from customer ID
async function getUserIdFromCustomerId(customerId: string): Promise<string | null> {
  try {
    const { data: customer } = await supabaseAdminClient
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()
    
    return customer?.user_id || null
  } catch (error) {
    console.error('Failed to get user ID from customer ID:', error)
    return null
  }
}