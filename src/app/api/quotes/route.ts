import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'
import { FREE_PLAN_FEATURES,parseStripeMetadata } from '@/types/features'

/**
 * POST /api/quotes - Create a new quote with feature enforcement
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user's feature access
    const featureAccess = await checkQuoteCreationAccess(user.id, supabase)
    if (!featureAccess.hasAccess) {
      return NextResponse.json(
        { 
          error: 'Quote limit exceeded',
          message: featureAccess.message,
          upgradeRequired: true,
          currentUsage: featureAccess.currentUsage,
          limit: featureAccess.limit
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.client_name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      )
    }

    // Generate quote number
    const { data: quoteNumber, error: quoteNumberError } = await supabase
      .rpc('generate_quote_number', { user_uuid: user.id })

    if (quoteNumberError) {
      console.error('Error generating quote number:', quoteNumberError)
      return NextResponse.json(
        { error: 'Failed to generate quote number' },
        { status: 500 }
      )
    }

    // Create the quote
    const quoteData = {
      user_id: user.id,
      quote_number: quoteNumber,
      client_name: body.client_name,
      client_id: body.client_id || null,
      client_email: body.client_email || null,
      client_phone: body.client_phone || null,
      client_address: body.client_address || null,
      notes: body.notes || null,
      status: body.status || 'draft',
      line_items: body.line_items || [],
      subtotal: body.subtotal || 0,
      tax_rate: body.tax_rate || 0,
      tax_amount: body.tax_amount || 0,
      total: body.total || 0,
      valid_until: body.valid_until || null,
      is_template: body.is_template || false,
      template_name: body.template_name || null
    }

    const { data: quote, error: createError } = await supabase
      .from('quotes')
      .insert(quoteData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating quote:', createError)
      return NextResponse.json(
        { error: 'Failed to create quote' },
        { status: 500 }
      )
    }

    // Increment usage counter
    const { error: usageError } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_usage_type: 'quotes',
      p_amount: 1
    })

    if (usageError) {
      console.error('Error incrementing usage:', usageError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      quote,
      message: 'Quote created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/quotes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/quotes - List user's quotes with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('quotes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`client_name.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: quotes, error: quotesError, count } = await query

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError)
      return NextResponse.json(
        { error: 'Failed to fetch quotes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      quotes: quotes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/quotes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Check if user can create quotes based on their subscription and usage
 */
async function checkQuoteCreationAccess(userId: string, supabase: any) {
  try {
    // Get user's subscription and features
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stripe_prices!inner (
          *,
          stripe_products!inner (
            metadata
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    // Parse features from subscription or use free plan defaults
    let features = FREE_PLAN_FEATURES
    if (subscription?.stripe_prices?.stripe_products?.metadata) {
      features = parseStripeMetadata(subscription.stripe_prices.stripe_products.metadata)
    }

    // Check if quotes are unlimited
    if (features.max_quotes === -1) {
      return { hasAccess: true }
    }

    // Get current usage
    const { data: usage } = await supabase
      .rpc('get_current_usage', { p_user_id: userId })
      .single()

    const currentUsage = usage?.quotes_count || 0
    const limit = features.max_quotes

    // Check if user has exceeded limit
    if (currentUsage >= limit) {
      return {
        hasAccess: false,
        message: `You have reached your limit of ${limit} quotes this month. Upgrade to Pro for unlimited quotes.`,
        currentUsage,
        limit
      }
    }

    return { 
      hasAccess: true,
      currentUsage,
      limit
    }

  } catch (error) {
    console.error('Error checking quote access:', error)
    // On error, deny access to be safe
    return {
      hasAccess: false,
      message: 'Unable to verify quote access. Please try again.',
      currentUsage: 0,
      limit: 0
    }
  }
}
