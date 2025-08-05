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

    // If no Stripe config, fallback to database-only mode
    if (!configData?.value) {
      console.log('No Stripe config found, using database-only mode for products')
      
      // Get products from database only
      const { data: dbProducts, error: dbError } = await supabaseAdminClient
        .from('stripe_products')
        .select('*')
        .order('created_at')

      if (dbError) {
        console.error('Database products fetch error:', dbError)
        return NextResponse.json(
          { error: `Failed to fetch products from database: ${dbError.message}` },
          { status: 500 }
        )
      }

      const databaseProducts = (dbProducts || []).map(product => ({
        id: product.id,
        stripe_product_id: product.id, // Use id as stripe_product_id for compatibility
        name: product.name,
        description: product.description,
        active: product.active,
        default_price: null, // Not available in database-only mode
        created: null,
        updated: null,
        images: [],
        metadata: product.metadata || {}, // Use actual metadata from database
        // Database fields
        created_at: product.created_at,
        updated_at: product.updated_at,
        database_only: true
      }))

      return NextResponse.json({
        success: true,
        products: databaseProducts,
        total: databaseProducts.length,
        database_only: true,
        message: 'Stripe not configured. Showing database-only data. Configure Stripe for full functionality.'
      })
    }

    const stripeConfig = configData.value as unknown as StripeConfig
    const stripe = createStripeAdminClient(stripeConfig)

    try {
      // Fetch products from Stripe
      const products = await stripe.products.list({
        limit: 100,
        expand: ['data.default_price']
      })

      // Get stored products from database for additional metadata
      const { data: dbProducts } = await supabaseAdminClient
        .from('stripe_products')
        .select('*')

      // Combine Stripe data with database data
      const combinedProducts = products.data.map(product => {
        const dbProduct = dbProducts?.find(p => p.stripe_product_id === product.id)
        
        return {
          id: dbProduct?.id || null,
          stripe_product_id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          default_price: product.default_price,
          created: product.created,
          updated: product.updated,
          images: product.images,
          metadata: product.metadata,
          // Database fields
          created_at: dbProduct?.created_at,
          updated_at: dbProduct?.updated_at
        }
      })

      return NextResponse.json({
        success: true,
        products: combinedProducts,
        total: products.data.length
      })

    } catch (stripeError: any) {
      console.error('Stripe products fetch error:', stripeError)
      return NextResponse.json(
        { 
          error: `Failed to fetch products: ${stripeError.message}`,
          stripe_config_exists: !!stripeConfig,
          config_mode: stripeConfig?.mode,
          details: stripeError
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error fetching Stripe products:', error)
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

    const body = await request.json()
    const { name, description, active = true, metadata = {} } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    // If no Stripe config, create in database only (for feature management)
    if (!configData?.value) {
      console.log('No Stripe config found, creating database-only mode for product')
      
      // Generate a unique product ID for database-only mode
      const productId = `prod_db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create product in database only
      const { data: dbProduct, error: dbError } = await supabaseAdminClient
        .from('stripe_products')
        .insert({
          id: productId,
          name: name,
          description: description || null,
          active: active,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database product creation error:', dbError)
        return NextResponse.json(
          { error: `Failed to create product in database: ${dbError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Product created successfully (database-only mode)',
        product: {
          id: dbProduct.id,
          stripe_product_id: dbProduct.id, // Use id as stripe_product_id for compatibility
          name: dbProduct.name,
          description: dbProduct.description,
          active: dbProduct.active,
          created: dbProduct.created_at,
          metadata: dbProduct.metadata,
          images: [],
          statement_descriptor: null,
          unit_label: null,
          url: null
        }
      })
    }

    // Stripe is configured, proceed with full Stripe + database sync
    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    const stripeConfig = configData.value as unknown as StripeConfig
    const stripe = createStripeAdminClient(stripeConfig)

    try {
      // Create product in Stripe
      const product = await stripe.products.create({
        name,
        description: description || '',
        active,
        metadata
      })

      // Store product in database for additional tracking
      const { data: dbProduct, error: dbError } = await supabaseAdminClient
        .from('stripe_products')
        .insert({
          id: product.id, // Use Stripe product ID as the database ID
          stripe_product_id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.warn('Failed to store product in database:', dbError)
        // Continue even if database storage fails
      }

      return NextResponse.json({
        success: true,
        message: 'Product created successfully',
        product: {
          id: dbProduct?.id || null,
          stripe_product_id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          created: product.created,
          metadata: product.metadata
        }
      })

    } catch (stripeError: any) {
      console.error('Stripe product creation error:', stripeError)
      return NextResponse.json(
        { error: `Failed to create product: ${stripeError.message}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error creating Stripe product:', error)
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

    const body = await request.json()
    const { 
      stripe_product_id, 
      name, 
      description, 
      active, 
      metadata = {},
      images,
      statement_descriptor,
      unit_label,
      url
    } = body

    // Validate required fields
    if (!stripe_product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // If no Stripe config, update database only (for feature management)
    if (!configData?.value) {
      console.log('No Stripe config found, updating database-only mode for product:', stripe_product_id)
      
      // Update product in database only
      const { data: dbProduct, error: dbError } = await supabaseAdminClient
        .from('stripe_products')
        .update({
          name: name || undefined,
          description: description || undefined,
          active: active !== undefined ? active : undefined,
          metadata: metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', stripe_product_id)
        .select()
        .single()

      if (dbError) {
        console.error('Database product update error:', dbError)
        return NextResponse.json(
          { error: `Failed to update product in database: ${dbError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Product updated successfully (database-only mode)',
        product: {
          id: dbProduct.id,
          stripe_product_id: dbProduct.id, // Use id as stripe_product_id for compatibility
          name: dbProduct.name,
          description: dbProduct.description,
          active: dbProduct.active,
          updated: dbProduct.updated_at,
          metadata: dbProduct.metadata,
          images: [],
          statement_descriptor: null,
          unit_label: null,
          url: null
        }
      })
    }

    // Stripe is configured, proceed with full Stripe + database sync
    const stripeConfig = configData.value as unknown as StripeConfig
    const stripe = createStripeAdminClient(stripeConfig)

    try {
      // Prepare update data (only include fields that are provided)
      const updateData: any = {}
      
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (active !== undefined) updateData.active = active
      if (metadata !== undefined) updateData.metadata = metadata
      if (images !== undefined) updateData.images = images
      if (statement_descriptor !== undefined) updateData.statement_descriptor = statement_descriptor
      if (unit_label !== undefined) updateData.unit_label = unit_label
      if (url !== undefined) updateData.url = url

      // Update product in Stripe
      const product = await stripe.products.update(stripe_product_id, updateData)

      // Update product in database
      const { data: dbProduct, error: dbError } = await supabaseAdminClient
        .from('stripe_products')
        .update({
          name: product.name,
          description: product.description,
          active: product.active,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_product_id', stripe_product_id)
        .select()
        .single()

      if (dbError) {
        console.warn('Failed to update product in database:', dbError)
        // Continue even if database update fails
      }

      return NextResponse.json({
        success: true,
        message: 'Product updated successfully',
        product: {
          id: dbProduct?.id || null,
          stripe_product_id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          updated: product.updated,
          metadata: product.metadata,
          images: product.images,
          statement_descriptor: product.statement_descriptor,
          unit_label: product.unit_label,
          url: product.url
        }
      })

    } catch (stripeError: any) {
      console.error('Stripe product update error:', stripeError)
      return NextResponse.json(
        { error: `Failed to update product: ${stripeError.message}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating Stripe product:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const { stripe_product_id } = body

    // Validate required fields
    if (!stripe_product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const stripeConfig = configData.value as unknown as StripeConfig
    const stripe = createStripeAdminClient(stripeConfig)

    try {
      // Check if product has any prices
      const prices = await stripe.prices.list({
        product: stripe_product_id,
        limit: 1
      })

      if (prices.data.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot delete product with associated prices. Archive the product instead or delete all prices first.',
            has_prices: true
          },
          { status: 400 }
        )
      }

      // Delete product from Stripe
      const deletedProduct = await stripe.products.del(stripe_product_id)

      // Remove product from database
      const { error: dbError } = await supabaseAdminClient
        .from('stripe_products')
        .delete()
        .eq('stripe_product_id', stripe_product_id)

      if (dbError) {
        console.warn('Failed to delete product from database:', dbError)
        // Continue even if database deletion fails
      }

      return NextResponse.json({
        success: true,
        message: 'Product deleted successfully',
        deleted: deletedProduct.deleted,
        product_id: stripe_product_id
      })

    } catch (stripeError: any) {
      console.error('Stripe product deletion error:', stripeError)
      return NextResponse.json(
        { error: `Failed to delete product: ${stripeError.message}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error deleting Stripe product:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
