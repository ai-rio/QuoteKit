import { NextRequest, NextResponse } from 'next/server'

import { createStripeAdminClient, type StripeConfig } from '@/libs/stripe/stripe-admin'
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Stripe configuration
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single()

    if (!configData?.value) {
      return NextResponse.json(
        { error: 'Stripe not configured. Please configure Stripe first.' },
        { status: 400 }
      )
    }

    const stripeConfig = configData.value as unknown as StripeConfig
    const stripe = createStripeAdminClient(stripeConfig)

    try {
      // Fetch prices from Stripe
      const prices = await stripe.prices.list({
        limit: 100,
        expand: ['data.product']
      })

      // Get stored prices from database for additional metadata
      const { data: dbPrices } = await supabaseAdminClient
        .from('stripe_prices')
        .select('*')

      // Combine Stripe data with database data
      const combinedPrices = prices.data.map(price => {
        const dbPrice = dbPrices?.find(p => p.stripe_price_id === price.id)
        
        return {
          id: dbPrice?.id || null,
          stripe_price_id: price.id,
          stripe_product_id: typeof price.product === 'string' ? price.product : price.product?.id,
          product_name: typeof price.product === 'string' ? null : (price.product && 'name' in price.product ? price.product.name : null),
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring_interval: price.recurring?.interval || null,
          active: price.active,
          created: price.created,
          metadata: price.metadata,
          // Database fields
          created_at: dbPrice?.created_at,
          updated_at: dbPrice?.updated_at
        }
      })

      return NextResponse.json({
        success: true,
        prices: combinedPrices,
        total: prices.data.length
      })

    } catch (stripeError: any) {
      console.error('Stripe prices fetch error:', stripeError)
      return NextResponse.json(
        { error: `Failed to fetch prices: ${stripeError.message}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error fetching Stripe prices:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Stripe configuration
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single()

    if (!configData?.value) {
      return NextResponse.json(
        { error: 'Stripe not configured. Please configure Stripe first.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      product_id, 
      unit_amount, 
      currency = 'usd', 
      recurring_interval, 
      active = true,
      metadata = {} 
    } = body

    // Validate required fields
    if (!product_id || !unit_amount) {
      return NextResponse.json(
        { error: 'Product ID and unit amount are required' },
        { status: 400 }
      )
    }

    // Validate unit_amount is positive integer
    if (!Number.isInteger(unit_amount) || unit_amount <= 0) {
      return NextResponse.json(
        { error: 'Unit amount must be a positive integer (in cents)' },
        { status: 400 }
      )
    }

    // Validate recurring interval if provided
    if (recurring_interval && !['month', 'year'].includes(recurring_interval)) {
      return NextResponse.json(
        { error: 'Recurring interval must be "month" or "year"' },
        { status: 400 }
      )
    }

    const stripeConfig = configData.value as unknown as StripeConfig
    const stripe = createStripeAdminClient(stripeConfig)

    try {
      // Prepare price creation data
      const priceData: any = {
        product: product_id,
        unit_amount,
        currency,
        active,
        metadata
      }

      // Add recurring data if specified
      if (recurring_interval) {
        priceData.recurring = {
          interval: recurring_interval
        }
      }

      // Create price in Stripe
      const price = await stripe.prices.create(priceData)

      // Store price in database for additional tracking
      const { data: dbPrice, error: dbError } = await supabaseAdminClient
        .from('stripe_prices')
        .insert({
          stripe_price_id: price.id,
          stripe_product_id: typeof price.product === 'string' ? price.product : price.product?.id,
          unit_amount: price.unit_amount || 0,
          currency: price.currency,
          recurring_interval: price.recurring?.interval || null,
          active: price.active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.warn('Failed to store price in database:', dbError)
        // Continue even if database storage fails
      }

      return NextResponse.json({
        success: true,
        message: 'Price created successfully',
        price: {
          id: dbPrice?.id || null,
          stripe_price_id: price.id,
          stripe_product_id: typeof price.product === 'string' ? price.product : price.product?.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring_interval: price.recurring?.interval || null,
          active: price.active,
          created: price.created,
          metadata: price.metadata
        }
      })

    } catch (stripeError: any) {
      console.error('Stripe price creation error:', stripeError)
      return NextResponse.json(
        { error: `Failed to create price: ${stripeError.message}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error creating Stripe price:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Stripe configuration
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single()

    if (!configData?.value) {
      return NextResponse.json(
        { error: 'Stripe not configured. Please configure Stripe first.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      stripe_price_id, 
      active, 
      metadata = {},
      nickname
    } = body

    // Validate required fields
    if (!stripe_price_id) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    const stripeConfig = configData.value as unknown as StripeConfig
    const stripe = createStripeAdminClient(stripeConfig)

    try {
      // Prepare update data (only updatable fields for prices)
      const updateData: any = {}
      
      if (active !== undefined) updateData.active = active
      if (metadata !== undefined) updateData.metadata = metadata
      if (nickname !== undefined) updateData.nickname = nickname

      // Update price in Stripe
      const price = await stripe.prices.update(stripe_price_id, updateData)

      // Update price in database
      const { data: dbPrice, error: dbError } = await supabaseAdminClient
        .from('stripe_prices')
        .update({
          active: price.active,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_price_id', stripe_price_id)
        .select()
        .single()

      if (dbError) {
        console.warn('Failed to update price in database:', dbError)
        // Continue even if database update fails
      }

      return NextResponse.json({
        success: true,
        message: 'Price updated successfully',
        price: {
          id: dbPrice?.id || null,
          stripe_price_id: price.id,
          stripe_product_id: typeof price.product === 'string' ? price.product : price.product?.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring_interval: price.recurring?.interval || null,
          active: price.active,
          metadata: price.metadata,
          nickname: price.nickname
        }
      })

    } catch (stripeError: any) {
      console.error('Stripe price update error:', stripeError)
      return NextResponse.json(
        { error: `Failed to update price: ${stripeError.message}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating Stripe price:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
