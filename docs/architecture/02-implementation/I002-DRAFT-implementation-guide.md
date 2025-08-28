# SaaS Subscription Schema Implementation Guide

## Overview

This guide provides developers with practical implementation patterns and code examples for working with the comprehensive SaaS subscription management schema. It covers common use cases, best practices, and integration patterns with Stripe and your existing LawnQuote application.

## Table of Contents

1. [Core Integration Patterns](#core-integration-patterns)
2. [Subscription Management](#subscription-management)
3. [Usage Tracking and Metering](#usage-tracking-and-metering)
4. [Feature Access Control](#feature-access-control)
5. [Payment and Invoice Handling](#payment-and-invoice-handling)
6. [Trial Management](#trial-management)
7. [Plan Changes and Proration](#plan-changes-and-proration)
8. [Webhook Processing](#webhook-processing)
9. [Analytics and Reporting](#analytics-and-reporting)
10. [Performance Optimization](#performance-optimization)

## Core Integration Patterns

### Database Connection and Client Setup

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// For server-side operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Type Definitions

```typescript
// types/subscription.ts
export interface SubscriptionWithDetails {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  current_period_end: string
  trial_end: string | null
  product: {
    name: string
    tier: string
    features: Record<string, any>
    limits: Record<string, any>
  }
  price: {
    unit_amount: number
    currency: string
    recurring_interval: string
  }
}

export interface UsageMetric {
  id: string
  metric_key: string
  metric_name: string
  unit: string
  current_usage: number
  included_amount: number
  overage_amount: number
  utilization_percentage: number
}

export interface FeatureAccess {
  feature_key: string
  has_access: boolean
  limit_value?: number
  current_usage?: number
}
```

## Subscription Management

### Get User's Active Subscription

```typescript
// lib/subscription/queries.ts
export async function getUserActiveSubscription(userId: string): Promise<SubscriptionWithDetails | null> {
  const { data, error } = await supabase
    .rpc('get_user_subscription_details', { p_user_id: userId })
    .single()

  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }

  return data
}

// Alternative direct query approach
export async function getUserSubscriptionDirect(userId: string) {
  const { data, error } = await supabase
    .from('subscription_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  return { data, error }
}
```

### Create Subscription

```typescript
// lib/subscription/mutations.ts
export async function createSubscription(params: {
  userId: string
  stripeCustomerId: string
  stripePriceId: string
  stripeSubscriptionId?: string
  quantity?: number
  trialEnd?: Date
}) {
  const { data, error } = await supabaseAdmin
    .rpc('upsert_subscription', {
      p_user_id: params.userId,
      p_stripe_customer_id: params.stripeCustomerId,
      p_stripe_price_id: params.stripePriceId,
      p_stripe_subscription_id: params.stripeSubscriptionId || null,
      p_status: params.trialEnd ? 'trialing' : 'active',
      p_quantity: params.quantity || 1,
      p_trial_end: params.trialEnd?.toISOString() || null
    })

  return { data, error }
}
```

### Subscription Status Check Middleware

```typescript
// middleware/subscription.ts
import { NextRequest } from 'next/server'

export async function requireActiveSubscription(request: NextRequest, userId: string) {
  const subscription = await getUserActiveSubscription(userId)
  
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return new Response('Subscription required', { status: 402 })
  }
  
  return subscription
}

// Usage in API routes
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  const subscription = await requireActiveSubscription(request, userId)
  
  if (subscription instanceof Response) {
    return subscription // Return 402 if no active subscription
  }
  
  // Continue with API logic...
}
```

## Usage Tracking and Metering

### Record Usage Events

```typescript
// lib/usage/tracking.ts
export async function recordUsage(params: {
  userId: string
  metricKey: string
  amount?: number
  source?: string
  metadata?: Record<string, any>
}) {
  const { data, error } = await supabaseAdmin
    .rpc('record_usage_event', {
      p_user_id: params.userId,
      p_metric_key: params.metricKey,
      p_usage_amount: params.amount || 1,
      p_source: params.source || null,
      p_metadata: params.metadata || {}
    })

  if (error) {
    console.error('Error recording usage:', error)
    // Consider implementing retry logic or queuing for critical usage events
  }

  return { data, error }
}

// Usage tracking decorator
export function trackUsage(metricKey: string, source?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args)
      
      // Extract userId from context (adjust based on your auth system)
      const userId = this.userId || args[0]?.userId
      
      if (userId) {
        await recordUsage({
          userId,
          metricKey,
          source: source || propertyName,
          metadata: { timestamp: new Date().toISOString() }
        })
      }
      
      return result
    }
  }
}

// Example usage
class QuoteService {
  @trackUsage('quotes_generated', 'api')
  async createQuote(userId: string, quoteData: any) {
    // Quote creation logic...
    return quote
  }
}
```

### Get Current Usage

```typescript
// lib/usage/queries.ts
export async function getCurrentUsage(userId: string, metricKey: string) {
  const { data, error } = await supabase
    .rpc('get_user_current_usage', {
      p_user_id: userId,
      p_metric_key: metricKey
    })
    .single()

  return { data, error }
}

export async function getAllCurrentUsage(userId: string): Promise<UsageMetric[]> {
  const { data, error } = await supabase
    .from('usage_analytics')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching usage:', error)
    return []
  }

  return data || []
}
```

### Usage-Based Billing Integration

```typescript
// lib/usage/billing.ts
export async function checkUsageLimits(userId: string, metricKey: string, additionalUsage: number = 1) {
  const usage = await getCurrentUsage(userId, metricKey)
  
  if (!usage.data) {
    return { allowed: false, reason: 'Unable to check usage limits' }
  }
  
  const { usage_amount, included_amount, overage_amount } = usage.data
  const newTotal = usage_amount + additionalUsage
  
  // Check if user has overage allowance or unlimited plan
  if (included_amount === -1) {
    return { allowed: true, reason: 'Unlimited plan' }
  }
  
  if (newTotal > included_amount) {
    // Check if overages are allowed for this plan
    const subscription = await getUserActiveSubscription(userId)
    const allowOverages = subscription?.product.limits?.allow_overages || false
    
    if (!allowOverages) {
      return { 
        allowed: false, 
        reason: 'Usage limit exceeded. Upgrade your plan to continue.',
        current: usage_amount,
        limit: included_amount
      }
    }
  }
  
  return { allowed: true, overage: Math.max(0, newTotal - included_amount) }
}

// Middleware for usage checking
export async function withUsageCheck(metricKey: string) {
  return async (request: NextRequest, context: any) => {
    const userId = await getCurrentUserId(request)
    const check = await checkUsageLimits(userId, metricKey)
    
    if (!check.allowed) {
      return Response.json({ error: check.reason }, { status: 403 })
    }
    
    // Add usage info to context for later recording
    context.usageCheck = check
    return null // Continue to handler
  }
}
```

## Feature Access Control

### Check Feature Access

```typescript
// lib/features/access.ts
export async function hasFeatureAccess(userId: string, featureKey: string): Promise<boolean> {
  const { data } = await supabase
    .rpc('user_has_feature_access', {
      p_user_id: userId,
      p_feature_key: featureKey
    })

  return data || false
}

export async function getFeatureAccess(userId: string): Promise<Record<string, FeatureAccess>> {
  const subscription = await getUserActiveSubscription(userId)
  
  if (!subscription) {
    return {} // No access to any features
  }
  
  const features = subscription.product.features || {}
  const access: Record<string, FeatureAccess> = {}
  
  for (const [key, config] of Object.entries(features)) {
    access[key] = {
      feature_key: key,
      has_access: config.enabled || false,
      limit_value: config.limit || null
    }
  }
  
  return access
}
```

### Feature Gate Component

```tsx
// components/FeatureGate.tsx
import { useEffect, useState } from 'react'
import { useUser } from '@/lib/auth'

interface FeatureGateProps {
  feature: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { user } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  
  useEffect(() => {
    if (user) {
      hasFeatureAccess(user.id, feature).then(setHasAccess)
    }
  }, [user, feature])
  
  if (hasAccess === null) {
    return <div>Loading...</div>
  }
  
  if (!hasAccess) {
    return fallback ? <>{fallback}</> : (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p>This feature requires a plan upgrade.</p>
        <button className="mt-2 btn-primary">Upgrade Plan</button>
      </div>
    )
  }
  
  return <>{children}</>
}

// Usage
export default function AdvancedQuotes() {
  return (
    <FeatureGate 
      feature="advanced_quotes"
      fallback={<UpgradePrompt feature="Advanced Quotes" />}
    >
      <AdvancedQuoteEditor />
    </FeatureGate>
  )
}
```

### API Route Protection

```typescript
// lib/middleware/feature-guard.ts
export function requireFeature(featureKey: string) {
  return async (request: NextRequest, context: any) => {
    const userId = await getCurrentUserId(request)
    const hasAccess = await hasFeatureAccess(userId, featureKey)
    
    if (!hasAccess) {
      return Response.json(
        { error: `Feature '${featureKey}' not available in your plan` },
        { status: 403 }
      )
    }
    
    return null // Continue to handler
  }
}

// Usage in API route
export const POST = withAuth(
  requireFeature('api_access'),
  async (request: NextRequest) => {
    // API logic here
  }
)
```

## Payment and Invoice Handling

### Create Stripe Checkout Session

```typescript
// lib/stripe/checkout.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createCheckoutSession(params: {
  userId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  trialDays?: number
}) {
  // Get or create Stripe customer
  let customer = await getStripeCustomer(params.userId)
  
  if (!customer) {
    customer = await createStripeCustomer(params.userId)
  }
  
  const session = await stripe.checkout.sessions.create({
    customer: customer.stripe_customer_id,
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: params.trialDays ? {
      trial_period_days: params.trialDays,
    } : undefined,
    metadata: {
      user_id: params.userId,
    },
  })
  
  return session
}

async function getStripeCustomer(userId: string) {
  const { data } = await supabase
    .from('stripe_customers')
    .select('*')
    .eq('user_id', userId)
    .single()
    
  return data
}

async function createStripeCustomer(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single()
    
  if (!user) throw new Error('User not found')
  
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.full_name,
    metadata: { user_id: userId },
  })
  
  const { data } = await supabaseAdmin
    .from('stripe_customers')
    .insert({
      user_id: userId,
      stripe_customer_id: customer.id,
      email: user.email,
      name: user.full_name,
    })
    .select()
    .single()
    
  return data
}
```

### Handle Invoice Updates

```typescript
// lib/stripe/invoices.ts
export async function syncInvoiceFromStripe(stripeInvoiceId: string) {
  const invoice = await stripe.invoices.retrieve(stripeInvoiceId, {
    expand: ['subscription', 'customer']
  })
  
  // Get user from customer
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single()
    
  if (!customer) {
    console.error('Customer not found for invoice:', stripeInvoiceId)
    return
  }
  
  await supabaseAdmin
    .from('invoices')
    .upsert({
      stripe_invoice_id: invoice.id,
      user_id: customer.user_id,
      subscription_id: invoice.subscription as string,
      invoice_number: invoice.number,
      status: invoice.status,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      amount_remaining: invoice.amount_remaining,
      subtotal: invoice.subtotal,
      tax: invoice.tax || 0,
      total: invoice.total,
      currency: invoice.currency,
      created_at: new Date(invoice.created * 1000).toISOString(),
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      paid_at: invoice.status_transitions.paid_at ? 
        new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf_url: invoice.invoice_pdf,
      stripe_metadata: invoice.metadata,
    })
}
```

## Trial Management

### Start Trial

```typescript
// lib/trials/management.ts
export async function startTrial(params: {
  userId: string
  priceId: string
  trialDays: number
  trialType?: 'time_based' | 'usage_based' | 'feature_based'
}) {
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + params.trialDays)
  
  const { data: subscription } = await createSubscription({
    userId: params.userId,
    stripePriceId: params.priceId,
    trialEnd,
  })
  
  if (subscription) {
    await supabaseAdmin
      .from('subscription_trials')
      .insert({
        user_id: params.userId,
        subscription_id: subscription,
        trial_type: params.trialType || 'time_based',
        trial_length_days: params.trialDays,
        trial_start: new Date().toISOString(),
        trial_end: trialEnd.toISOString(),
        status: 'active'
      })
  }
  
  return subscription
}
```

### Trial Conversion Tracking

```typescript
// lib/trials/conversion.ts
export async function convertTrial(userId: string, paymentMethodId: string) {
  const { data: trial } = await supabase
    .from('subscription_trials')
    .select('*, subscriptions(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
    
  if (!trial) {
    throw new Error('No active trial found')
  }
  
  // Update Stripe subscription to end trial and add payment method
  const subscription = await stripe.subscriptions.update(
    trial.subscriptions.stripe_subscription_id,
    {
      trial_end: 'now',
      default_payment_method: paymentMethodId,
    }
  )
  
  // Update trial status
  await supabaseAdmin
    .from('subscription_trials')
    .update({
      status: 'converted',
      conversion_date: new Date().toISOString(),
      days_to_convert: Math.floor(
        (new Date().getTime() - new Date(trial.trial_start).getTime()) / (1000 * 60 * 60 * 24)
      )
    })
    .eq('id', trial.id)
    
  return subscription
}
```

## Plan Changes and Proration

### Change Subscription Plan

```typescript
// lib/subscription/changes.ts
export async function changeSubscriptionPlan(params: {
  userId: string
  newPriceId: string
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  effectiveDate?: Date
}) {
  const subscription = await getUserActiveSubscription(params.userId)
  
  if (!subscription) {
    throw new Error('No active subscription found')
  }
  
  // Record the change request
  const { data: changeRecord } = await supabaseAdmin
    .from('subscription_changes')
    .insert({
      subscription_id: subscription.id,
      user_id: params.userId,
      change_type: 'upgrade', // Determine based on price comparison
      old_stripe_price_id: subscription.price.stripe_price_id,
      new_stripe_price_id: params.newPriceId,
      requested_at: new Date().toISOString(),
      effective_at: params.effectiveDate?.toISOString() || new Date().toISOString(),
      proration_behavior: params.prorationBehavior || 'create_prorations',
      status: 'processing'
    })
    .select()
    .single()
  
  try {
    // Update Stripe subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id!,
      {
        items: [{
          id: subscription.stripe_subscription_id, // Get the subscription item ID
          price: params.newPriceId,
        }],
        proration_behavior: params.prorationBehavior || 'create_prorations',
      }
    )
    
    // Update change record
    await supabaseAdmin
      .from('subscription_changes')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', changeRecord.id)
      
    return updatedSubscription
  } catch (error) {
    // Update change record with failure
    await supabaseAdmin
      .from('subscription_changes')
      .update({
        status: 'failed',
        failure_reason: error.message,
      })
      .eq('id', changeRecord.id)
      
    throw error
  }
}
```

## Webhook Processing

### Main Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  // Store webhook event for processing
  const { data: webhookEvent } = await supabaseAdmin
    .from('webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event.data,
      status: 'pending'
    })
    .select()
    .single()
  
  try {
    await processWebhookEvent(event, webhookEvent.id)
    
    await supabaseAdmin
      .from('webhook_events')
      .update({
        status: 'succeeded',
        processed_at: new Date().toISOString()
      })
      .eq('id', webhookEvent.id)
      
  } catch (error) {
    console.error('Webhook processing failed:', error)
    
    await supabaseAdmin
      .from('webhook_events')
      .update({
        status: 'failed',
        error_message: error.message,
        retry_count: 0
      })
      .eq('id', webhookEvent.id)
  }
  
  return Response.json({ received: true })
}

async function processWebhookEvent(event: Stripe.Event, webhookEventId: string) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription)
      break
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break
      
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
      break
      
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
      break
      
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  // Get user from customer
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', subscription.customer as string)
    .single()
    
  if (!customer) {
    throw new Error(`Customer not found: ${subscription.customer}`)
  }
  
  // Update subscription
  await upsertSubscription({
    userId: customer.user_id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    stripePriceId: subscription.items.data[0].price.id,
    status: subscription.status as any,
    quantity: subscription.items.data[0].quantity || 1,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialStart: subscription.trial_start ? 
      new Date(subscription.trial_start * 1000) : null,
    trialEnd: subscription.trial_end ? 
      new Date(subscription.trial_end * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? 
      new Date(subscription.canceled_at * 1000) : null,
    endedAt: subscription.ended_at ? 
      new Date(subscription.ended_at * 1000) : null,
  })
}
```

## Analytics and Reporting

### Revenue Analytics

```typescript
// lib/analytics/revenue.ts
export async function getRevenueMetrics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month') {
  const { data, error } = await supabaseAdmin
    .from('revenue_analytics')
    .select('*')
    .order('month', { ascending: false })
    .limit(12)
    
  return { data, error }
}

export async function getSubscriptionMetrics() {
  const { data: metrics } = await supabaseAdmin
    .rpc('get_subscription_metrics')
    
  return metrics || {
    total_subscribers: 0,
    active_subscribers: 0,
    trialing_subscribers: 0,
    churned_subscribers: 0,
    mrr: 0,
    arr: 0,
    average_revenue_per_user: 0,
    churn_rate: 0
  }
}
```

### Usage Analytics

```typescript
// lib/analytics/usage.ts
export async function getUserUsageReport(userId: string, period: string = '30d') {
  const { data } = await supabase
    .from('usage_analytics')
    .select('*')
    .eq('user_id', userId)
    
  return data || []
}

export async function getUsageTrends(metricKey: string, period: string = '30d') {
  const { data } = await supabaseAdmin
    .rpc('get_usage_trends', {
      p_metric_key: metricKey,
      p_period: period
    })
    
  return data || []
}
```

## Performance Optimization

### Connection Pooling

```typescript
// lib/database/pool.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function queryWithPool<T>(
  text: string, 
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows
  } finally {
    client.release()
  }
}
```

### Caching Strategies

```typescript
// lib/cache/redis.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export async function getCachedSubscription(userId: string) {
  const cached = await redis.get(`subscription:${userId}`)
  return cached ? JSON.parse(cached) : null
}

export async function setCachedSubscription(userId: string, subscription: any) {
  await redis.setex(`subscription:${userId}`, 300, JSON.stringify(subscription)) // 5 minutes
}

export async function invalidateSubscriptionCache(userId: string) {
  await redis.del(`subscription:${userId}`)
}

// Cached subscription getter
export async function getUserSubscriptionCached(userId: string) {
  let subscription = await getCachedSubscription(userId)
  
  if (!subscription) {
    subscription = await getUserActiveSubscription(userId)
    if (subscription) {
      await setCachedSubscription(userId, subscription)
    }
  }
  
  return subscription
}
```

### Batch Operations

```typescript
// lib/database/batch.ts
export async function batchRecordUsage(events: Array<{
  userId: string
  metricKey: string
  amount: number
  timestamp: Date
  metadata?: Record<string, any>
}>) {
  if (events.length === 0) return
  
  const values = events.map((event, index) => {
    const baseIndex = index * 7
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`
  }).join(', ')
  
  const params = events.flatMap(event => [
    event.userId,
    event.metricKey,
    event.amount,
    event.timestamp.toISOString(),
    event.metadata || {},
    event.source || null,
    crypto.randomUUID()
  ])
  
  const query = `
    INSERT INTO usage_events (user_id, metric_key, usage_amount, event_timestamp, metadata, source, id)
    VALUES ${values}
    ON CONFLICT (id) DO NOTHING
  `
  
  await queryWithPool(query, params)
}
```

## Testing Strategies

### Unit Tests

```typescript
// __tests__/subscription.test.ts
import { getUserActiveSubscription, createSubscription } from '@/lib/subscription'

describe('Subscription Management', () => {
  it('should retrieve active subscription', async () => {
    const subscription = await getUserActiveSubscription('user-123')
    expect(subscription).toBeDefined()
    expect(subscription.status).toBe('active')
  })
  
  it('should handle subscription creation', async () => {
    const result = await createSubscription({
      userId: 'user-123',
      stripeCustomerId: 'cus-123',
      stripePriceId: 'price_123'
    })
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
  })
})
```

### Integration Tests

```typescript
// __tests__/webhook.integration.test.ts
import { POST } from '@/app/api/webhooks/stripe/route'

describe('Stripe Webhook Integration', () => {
  it('should process subscription.created webhook', async () => {
    const webhookPayload = {
      id: 'evt_test',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test',
          customer: 'cus_test',
          status: 'active',
          // ... other subscription data
        }
      }
    }
    
    const response = await POST(new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(webhookPayload),
      headers: {
        'stripe-signature': 'test-signature'
      }
    }))
    
    expect(response.status).toBe(200)
  })
})
```

This implementation guide provides practical patterns and code examples for integrating the comprehensive subscription schema into your LawnQuote application. The examples cover the most common use cases and include performance optimizations, error handling, and testing strategies.