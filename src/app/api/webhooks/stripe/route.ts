import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin'
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

    if (!configData?.value?.webhook_secret) {
      console.error('Webhook secret not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
    }

    const stripeConfig = configData.value
    const stripe = createStripeAdminClient(stripeConfig)

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeConfig.webhook_secret
      )
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Log the webhook event for debugging
    console.log(`Received Stripe webhook: ${event.type}`)

    try {
      // Store webhook event for idempotency and debugging
      await supabaseAdminClient
        .from('stripe_webhook_events')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          processed: false,
          data: event.data,
          created_at: new Date().toISOString()
        })
    } catch (dbError) {
      console.warn('Failed to log webhook event:', dbError)
      // Continue processing even if logging fails
    }

    // Handle different event types
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

      case 'customer.created':
      case 'customer.updated':
      case 'customer.deleted':
        // Handle customer events if needed
        console.log(`Customer event: ${event.type}`)
        break

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        // Handle payment events if needed
        console.log(`Payment event: ${event.type}`)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    try {
      await supabaseAdminClient
        .from('stripe_webhook_events')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('stripe_event_id', event.id)
    } catch (dbError) {
      console.warn('Failed to mark webhook event as processed:', dbError)
    }

    return NextResponse.json({ received: true })

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

async function handleProductEvent(event: Stripe.Event) {
  const product = event.data.object as Stripe.Product

  try {
    await supabaseAdminClient
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

    console.log(`Product ${event.type}: ${product.name} (${product.id})`)
  } catch (error) {
    console.error('Failed to sync product:', error)
  }
}

async function handleProductDeleted(event: Stripe.Event) {
  const product = event.data.object as Stripe.Product

  try {
    await supabaseAdminClient
      .from('stripe_products')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('stripe_product_id', product.id)

    console.log(`Product deleted: ${product.name} (${product.id})`)
  } catch (error) {
    console.error('Failed to mark product as deleted:', error)
  }
}

async function handlePriceEvent(event: Stripe.Event) {
  const price = event.data.object as Stripe.Price

  try {
    await supabaseAdminClient
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

    console.log(`Price ${event.type}: ${price.id} for product ${price.product}`)
  } catch (error) {
    console.error('Failed to sync price:', error)
  }
}

async function handlePriceDeleted(event: Stripe.Event) {
  const price = event.data.object as Stripe.Price

  try {
    await supabaseAdminClient
      .from('stripe_prices')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('stripe_price_id', price.id)

    console.log(`Price deleted: ${price.id}`)
  } catch (error) {
    console.error('Failed to mark price as deleted:', error)
  }
}