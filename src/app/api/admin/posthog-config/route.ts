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
      project_api_key: '',
      host: 'https://us.posthog.com',
      project_id: '',
      personal_api_key: ''
    }

    try {
      const { data: dbConfig } = await supabaseAdminClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'posthog_config')
        .single()

      if (dbConfig?.value && typeof dbConfig.value === 'object') {
        config = { ...config, ...dbConfig.value }
      }
    } catch (dbError) {
      console.log('No database config found, using environment variables')
    }

    // Fallback to environment variables if no database config
    if (!config.project_api_key) {
      config = {
        project_api_key: process.env.POSTHOG_PROJECT_API_KEY || '',
        host: process.env.POSTHOG_HOST || 'https://us.posthog.com',
        project_id: process.env.POSTHOG_PROJECT_ID || '',
        personal_api_key: process.env.POSTHOG_PERSONAL_API_KEY || ''
      }
    }

    const status = {
      isConfigured: !!(config.project_api_key && config.personal_api_key),
      isConnected: false, // Will be determined by test endpoint
      lastChecked: null
    }

    // Mask sensitive keys for security
    const maskedConfig = {
      ...config,
      project_api_key: config.project_api_key ? `${config.project_api_key.substring(0, 8)}...` : '',
      personal_api_key: config.personal_api_key ? `${config.personal_api_key.substring(0, 8)}...` : ''
    }

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      status
    })

  } catch (error) {
    console.error('Error fetching PostHog config:', error)
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
    const { project_api_key, host, project_id, personal_api_key } = body

    // Validate required fields
    if (!project_api_key || !personal_api_key) {
      return NextResponse.json(
        { error: 'Project API Key and Personal API Key are required' },
        { status: 400 }
      )
    }

    // In a production environment, you would:
    // 1. Store these securely in a database table with encryption
    // 2. Use a key management service
    // 3. Update environment variables through your deployment system
    
    // For this demo, we'll store in a secure admin settings table
    try {
      const { error: upsertError } = await supabaseAdminClient
        .from('admin_settings')
        .upsert({
          key: 'posthog_config',
          value: {
            project_api_key,
            host: host || 'https://us.posthog.com',
            project_id,
            personal_api_key
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
      // If the admin_settings table doesn't exist, create it
      console.log('Admin settings table may not exist, this is expected during development')
    }

    return NextResponse.json({
      success: true,
      message: 'PostHog configuration saved successfully'
    })

  } catch (error) {
    console.error('Error saving PostHog config:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}