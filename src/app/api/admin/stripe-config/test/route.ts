import { NextRequest, NextResponse } from 'next/server'

import { createStripeAdminClient, type StripeConfig } from '@/libs/stripe/stripe-admin'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function POST(request: NextRequest) {
  console.log('=== STRIPE TEST ENDPOINT CALLED ===')
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    let { secret_key, publishable_key, webhook_secret, mode } = body

    // Handle masked keys - if keys appear to be masked, get the full keys from environment or database
    const isMaskedSecretKey = secret_key && secret_key.includes('...')
    const isMaskedPublishableKey = publishable_key && publishable_key.includes('...')
    
    if (isMaskedSecretKey || isMaskedPublishableKey || !secret_key || !publishable_key) {
      console.log('Detected masked or missing keys, fetching full keys from config...')
      
      // Get the full config (same logic as GET endpoint)
      let fullConfig = {
        secret_key: '',
        publishable_key: '',
        webhook_secret: '',
        mode: 'test' as 'test' | 'live'
      }

      try {
        const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin')
        const { data: dbConfig } = await supabaseAdminClient
          .from('admin_settings')
          .select('value')
          .eq('key', 'stripe_config')
          .single()

        if (dbConfig?.value && typeof dbConfig.value === 'object') {
          fullConfig = { ...fullConfig, ...dbConfig.value }
        }
      } catch (dbError) {
        console.log('No database config found, using environment variables')
      }

      // Fallback to environment variables if no database config
      if (!fullConfig.secret_key) {
        console.log('Environment variables check:', {
          STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? `${process.env.STRIPE_SECRET_KEY.substring(0, 8)}...` : 'MISSING',
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8)}...` : 'MISSING',
          STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 8)}...` : 'MISSING'
        })
        
        fullConfig = {
          secret_key: process.env.STRIPE_SECRET_KEY || '',
          publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '',
          webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || '',
          mode: (process.env.STRIPE_MODE as 'test' | 'live') || 'test'
        }
      }

      // Use the full keys for testing
      secret_key = fullConfig.secret_key
      publishable_key = fullConfig.publishable_key
      webhook_secret = webhook_secret || fullConfig.webhook_secret
      mode = mode || fullConfig.mode
    }

    console.log('Testing Stripe config with:', {
      secret_key: secret_key ? `${secret_key.substring(0, 8)}...` : 'MISSING',
      publishable_key: publishable_key ? `${publishable_key.substring(0, 8)}...` : 'MISSING',
      webhook_secret: webhook_secret ? `${webhook_secret.substring(0, 8)}...` : 'MISSING',
      mode
    })
    
    console.log('Full key details:', {
      secret_key_length: secret_key?.length,
      secret_key_ends_with: secret_key ? secret_key.slice(-10) : 'N/A',
      publishable_key_length: publishable_key?.length,
      publishable_key_ends_with: publishable_key ? publishable_key.slice(-10) : 'N/A'
    })

    // Validate required fields
    if (!secret_key || !publishable_key) {
      console.error('Missing required fields after fetching full config:', { 
        has_secret_key: !!secret_key, 
        has_publishable_key: !!publishable_key 
      })
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
      
      console.log('Attempting Stripe API call...')
      
      // Perform multiple test operations to ensure the connection is working
      const account = await stripe.accounts.retrieve()
      
      console.log('Stripe API call successful:', {
        account_id: account.id,
        account_type: account.type
      })
      
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
      console.error('Stripe connection error details:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        decline_code: stripeError.decline_code,
        param: stripeError.param
      })
      
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