import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { upsertUserSubscription } from '@/features/account/controllers/upsert-user-subscription'
import { createStripeAdminClient, stripeAdmin } from '@/libs/stripe/stripe-admin'
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Get Stripe configuration for webhook secret
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single()

    const config = configData?.value as any;
    if (!config?.webhook_secret) {
      console.error('Webhook secret not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
    }

    const stripeConfig = configData?.value as any
    const stripe = createStripeAdminClient(stripeConfig)

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.webhook_secret
      )
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Enhanced idempotency check - check if event was already processed
    const { data: existingEvent } = await supabaseAdminClient
      .from('stripe_webhook_events')
      .select('processed, processed_at')
      .eq('stripe_event_id', event.id)
      .single()

    if (existingEvent?.processed) {
      console.log(`Event ${event.id} already processed at ${existingEvent.processed_at}`)
      return NextResponse.json({ received: true, message: 'Event already processed' })
    }

    // Log the webhook event for debugging and idempotency
    console.log(`Processing Stripe webhook: ${event.type} (${event.id})`)

    try {
      // Store or update webhook event
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
    } catch (dbError) {
      console.error('Failed to log webhook event:', dbError)
      // For critical events, we might want to fail here
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
    }

    let processingResult: { success: boolean; error?: string } = { success: false }

    // Enhanced event processing with retry logic
    try {
      processingResult = await processWebhookEventWithRetry(event, 3)
    } catch (error) {
      console.error('Final webhook processing failure:', error)
      processingResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown processing error' 
      }
    }

    // Update event processing status
    try {
      await supabaseAdminClient
        .from('stripe_webhook_events')
        .update({ 
          processed: processingResult.success, 
          processed_at: new Date().toISOString(),
          error_message: processingResult.error || null
        })
        .eq('stripe_event_id', event.id)
    } catch (dbError) {
      console.error('Failed to update webhook event status:', dbError)
    }

    if (!processingResult.success) {
      // For failed events, we return 500 so Stripe will retry
      return NextResponse.json({
        error: 'Processing failed',
        message: processingResult.error || 'Unknown error',
        eventId: event.id
      }, { status: 500 })
    }

    return NextResponse.json({ received: true, eventId: event.id })

  } catch (error) {
    console.error('Webhook processing error:', error)
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
  
  try {
    if (event.type === 'customer.subscription.deleted') {
      // Handle subscription cancellation - update status instead of deleting
      console.log(`🗑️ Processing subscription deletion: ${subscription.id} for customer ${subscription.customer}`)
      
      const { error } = await supabaseAdminClient
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          ended_at: new Date().toISOString(),
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id)
      
      if (error) {
        console.error('Failed to update subscription status on deletion:', error)
        throw new Error(`Failed to update subscription on deletion: ${error.message}`)
      }
      
      console.log(`✅ Subscription marked as canceled: ${subscription.id} for customer ${subscription.customer}`)
    } else {
      // Handle subscription creation/update using centralized function
      console.log(`🔄 Processing subscription ${event.type}: ${subscription.id} for customer ${subscription.customer}`)
      await upsertUserSubscription({
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        isCreateAction: event.type === 'customer.subscription.created'
      })
      
      console.log(`✅ Subscription ${event.type}: ${subscription.id} for customer ${subscription.customer}`)
    }
  } catch (error) {
    console.error('Failed to sync subscription:', error)
    throw error // Re-throw to trigger retry
  }
}

// Helper function to ensure customer mapping exists
async function ensureCustomerMapping(session: Stripe.Checkout.Session): Promise<string> {
  const customerId = session.customer as string
  const customerEmail = session.customer_details?.email
  
  console.log(`🔍 [DEBUG] Ensuring customer mapping:`, {
    customerId,
    customerEmail,
    sessionId: session.id
  })
  
  if (!customerId || !customerEmail) {
    const error = 'Missing customer ID or email in checkout session'
    console.error(`❌ [ERROR] ${error}:`, { customerId, customerEmail })
    throw new Error(error)
  }
  
  // Check if customer mapping already exists
  const { data: existingCustomer } = await supabaseAdminClient
    .from('stripe_customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()
  
  if (existingCustomer) {
    console.log(`✅ [SUCCESS] Found existing customer mapping: user ${existingCustomer.id} -> customer ${customerId}`)
    return existingCustomer.id
  }
  
  console.log(`🔍 [DEBUG] No existing customer mapping found, creating new mapping for ${customerEmail}`)
  
  // Find user by email
  const { data: userData, error: userError } = await supabaseAdminClient
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single()
  
  if (userError || !userData) {
    const error = `User not found for email: ${customerEmail}`
    console.error(`❌ [ERROR] ${error}:`, { userError: userError?.message, hasUserData: !!userData })
    throw new Error(error)
  }
  
  console.log(`✅ [SUCCESS] Found user ${userData.id} for email ${customerEmail}`)
  
  // Create customer mapping
  const { data: newCustomer, error: customerError } = await supabaseAdminClient
    .from('stripe_customers')
    .insert({
      id: userData.id,
      stripe_customer_id: customerId,
      email: customerEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single()
  
  if (customerError || !newCustomer) {
    throw new Error(`Failed to create customer mapping: ${customerError?.message}`)
  }
  
  console.log(`Created customer mapping: user ${userData.id} -> customer ${customerId}`)
  return newCustomer.id
}

// Handle successful checkout sessions
async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session
  
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
    
    // Retrieve full checkout session with subscription expansion
    const fullSession = await stripeAdmin.checkout.sessions.retrieve(session.id, {
      expand: ['subscription', 'customer']
    })
    
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
    
    // Ensure customer mapping exists
    console.log(`🔗 [DEBUG] Ensuring customer mapping for session ${fullSession.id}`)
    const userId = await ensureCustomerMapping(fullSession)
    console.log(`✅ [SUCCESS] Customer mapping confirmed for user ${userId}`)
    
    // Extract subscription and customer IDs
    const subscriptionId = typeof fullSession.subscription === 'string' 
      ? fullSession.subscription 
      : fullSession.subscription.id
    const customerId = typeof fullSession.customer === 'string' 
      ? fullSession.customer 
      : fullSession.customer!.id
    
    console.log(`📝 [DEBUG] About to upsert subscription:`, {
      subscriptionId,
      customerId,
      userId,
      isCreateAction: true
    })
    
    // Create/update subscription using the centralized function
    await upsertUserSubscription({
      subscriptionId,
      customerId,
      isCreateAction: true
    })
    
    console.log(`✅ [SUCCESS] Subscription upserted successfully for user ${userId}`)
    
    console.log(`🎉 [SUCCESS] Successfully processed checkout session ${session.id} and created subscription for user ${userId}`)
    
  } catch (error) {
    console.error('Failed to handle checkout session completion:', error)
    throw error
  }
}

// Handle successful payment
async function handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice
  
  try {
    console.log(`Payment succeeded: ${invoice.id} for customer ${invoice.customer}`)
    
    // Additional logic for successful payments
    // e.g., extend service, send receipt, update credits, etc.
    
  } catch (error) {
    console.error('Failed to handle payment success:', error)
    throw error
  }
}

// Handle failed payment
async function handlePaymentFailed(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice
  
  try {
    console.log(`Payment failed: ${invoice.id} for customer ${invoice.customer}`)
    
    // Additional logic for failed payments
    // e.g., send notification, update subscription status, trigger dunning, etc.
    
  } catch (error) {
    console.error('Failed to handle payment failure:', error)
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