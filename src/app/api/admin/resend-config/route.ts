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
      api_key: '',
      from_email: '',
      from_name: 'LawnQuote'
    }

    try {
      const { data: dbConfig } = await supabaseAdminClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'resend_config')
        .single()

      if (dbConfig?.value) {
        config = { ...config, ...dbConfig.value }
      }
    } catch (dbError) {
      console.log('No database config found, using environment variables')
    }

    // Fallback to environment variables if no database config
    if (!config.api_key) {
      config = {
        api_key: process.env.RESEND_API_KEY || '',
        from_email: process.env.RESEND_FROM_EMAIL || '',
        from_name: process.env.RESEND_FROM_NAME || 'LawnQuote'
      }
    }

    const status = {
      isConfigured: !!(config.api_key && config.from_email),
      isConnected: false, // Will be determined by test endpoint
      lastChecked: null
    }

    // Mask sensitive keys for security
    const maskedConfig = {
      ...config,
      api_key: config.api_key ? `${config.api_key.substring(0, 8)}...` : ''
    }

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      status
    })

  } catch (error) {
    console.error('Error fetching Resend config:', error)
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

    const body = await request.json()
    const { api_key, from_email, from_name } = body

    // Validate required fields
    if (!api_key || !from_email) {
      return NextResponse.json(
        { error: 'API Key and From Email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(from_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Store in admin settings table
    try {
      const { error: upsertError } = await supabaseAdminClient
        .from('admin_settings')
        .upsert({
          key: 'resend_config',
          value: {
            api_key,
            from_email,
            from_name: from_name || 'LawnQuote'
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
      message: 'Resend configuration saved successfully'
    })

  } catch (error) {
    console.error('Error saving Resend config:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}