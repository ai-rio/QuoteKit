import { NextRequest, NextResponse } from 'next/server'

import { createStripeAdminClient, type StripeConfig } from '@/libs/stripe/stripe-admin'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { secret_key, publishable_key, webhook_secret, mode } = body

    // Validate required fields
    if (!secret_key || !publishable_key) {
      return NextResponse.json(
        { error: 'Secret Key and Publishable Key are required' },
        { status: 400 }
      )
    }

    const stripeConfig: StripeConfig = {
      secret_key,
      publishable_key,
      webhook_secret: webhook_secret || '',
      mode: mode || 'test'
    }

    try {
      // Test the Stripe connection by retrieving account information
      const stripe = createStripeAdminClient(stripeConfig)
      
      // Perform multiple test operations to ensure the connection is working
      const account = await stripe.accounts.retrieve()
      
      // Test listing products (should work even if empty)
      const products = await stripe.products.list({ limit: 1 })
      
      // Verify the key matches the expected mode
      const isTestKey = secret_key.startsWith('sk_test_')
      const isLiveKey = secret_key.startsWith('sk_live_')
      
      if (mode === 'test' && !isTestKey) {
        return NextResponse.json(
          { error: 'Test mode selected but provided key appears to be a live key' },
          { status: 400 }
        )
      }
      
      if (mode === 'live' && !isLiveKey) {
        return NextResponse.json(
          { error: 'Live mode selected but provided key appears to be a test key' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Stripe connection test successful!',
        account_id: account.id,
        account_type: account.type,
        country: account.country,
        default_currency: account.default_currency,
        mode: isTestKey ? 'test' : 'live',
        capabilities: account.capabilities,
        products_accessible: true
      })

    } catch (stripeError: any) {
      console.error('Stripe connection error:', stripeError)
      
      // Handle specific Stripe errors
      if (stripeError.type === 'StripeAuthenticationError') {
        return NextResponse.json(
          { error: 'Invalid Stripe API key. Please check your Secret Key.' },
          { status: 400 }
        )
      }
      
      if (stripeError.type === 'StripePermissionError') {
        return NextResponse.json(
          { error: 'Insufficient permissions. Please check your API key permissions.' },
          { status: 400 }
        )
      }
      
      if (stripeError.type === 'StripeConnectionError') {
        return NextResponse.json(
          { error: 'Failed to connect to Stripe. Please check your network connection.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: `Stripe API error: ${stripeError.message || 'Unknown error'}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error testing Stripe connection:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}