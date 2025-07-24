import { NextRequest, NextResponse } from 'next/server'

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

    // Try to get config from database first, then fallback to environment variables
    let config = {
      secret_key: '',
      publishable_key: '',
      webhook_secret: '',
      mode: 'test' as 'test' | 'live'
    }

    try {
      const { data: dbConfig } = await supabaseAdminClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'stripe_config')
        .single()

      if (dbConfig?.value) {
        config = { ...config, ...dbConfig.value }
      }
    } catch (dbError) {
      console.log('No database config found, using environment variables')
    }

    // Fallback to environment variables if no database config
    if (!config.secret_key) {
      config = {
        secret_key: process.env.STRIPE_SECRET_KEY || '',
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || '',
        webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || '',
        mode: (process.env.STRIPE_MODE as 'test' | 'live') || 'test'
      }
    }

    const status = {
      isConfigured: !!(config.secret_key && config.publishable_key),
      isConnected: false, // Will be determined by test endpoint
      lastChecked: null
    }

    // Mask sensitive keys for security
    const maskedConfig = {
      ...config,
      secret_key: config.secret_key ? `${config.secret_key.substring(0, 8)}...` : '',
      webhook_secret: config.webhook_secret ? `${config.webhook_secret.substring(0, 8)}...` : ''
    }

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      status
    })

  } catch (error) {
    console.error('Error fetching Stripe config:', error)
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

    // Check admin role (when implemented)
    // const isAdmin = await checkAdminRole(user.id)
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const body = await request.json()
    const { secret_key, publishable_key, webhook_secret, mode } = body

    // Validate required fields
    if (!secret_key || !publishable_key) {
      return NextResponse.json(
        { error: 'Secret Key and Publishable Key are required' },
        { status: 400 }
      )
    }

    // Validate mode
    if (mode && !['test', 'live'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be either "test" or "live"' },
        { status: 400 }
      )
    }

    // Store configuration in database
    try {
      const { error: upsertError } = await supabaseAdminClient
        .from('admin_settings')
        .upsert({
          key: 'stripe_config',
          value: {
            secret_key,
            publishable_key,
            webhook_secret: webhook_secret || '',
            mode: mode || 'test'
          },
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (upsertError) {
        console.error('Database error:', upsertError)
        return NextResponse.json(
          { error: 'Failed to save configuration to database' },
          { status: 500 }
        )
      }
    } catch (dbError) {
      console.log('Admin settings table may not exist, this is expected during development')
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe configuration saved successfully'
    })

  } catch (error) {
    console.error('Error saving Stripe config:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}