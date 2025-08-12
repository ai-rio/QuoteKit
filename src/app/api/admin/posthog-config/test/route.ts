import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function POST(request: NextRequest) {
  console.log('=== POSTHOG TEST ENDPOINT CALLED ===')
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: isAdminUser, error: adminError } = await supabase.rpc('is_admin', { 
      user_id: user.id 
    })
    
    if (adminError || !isAdminUser) {
      console.error('Admin check failed:', adminError)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    let { project_api_key, host, project_id, personal_api_key } = body

    // Handle masked keys - if keys appear to be masked, get the full keys from environment or database
    const isMaskedProjectKey = project_api_key && project_api_key.includes('...')
    const isMaskedPersonalKey = personal_api_key && personal_api_key.includes('...')
    
    if (isMaskedProjectKey || isMaskedPersonalKey || !project_api_key || !personal_api_key) {
      console.log('Detected masked or missing PostHog keys, fetching full keys from config...')
      
      // Get the full config (same logic as GET endpoint)
      let fullConfig = {
        project_api_key: '',
        host: 'https://us.posthog.com',
        project_id: '',
        personal_api_key: ''
      }

      try {
        const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin')
        const { data: dbConfig } = await supabaseAdminClient
          .from('admin_settings')
          .select('value')
          .eq('key', 'posthog_config')
          .single()

        if (dbConfig?.value && typeof dbConfig.value === 'object') {
          fullConfig = { ...fullConfig, ...dbConfig.value }
        }
      } catch (dbError) {
        console.log('No database config found, using environment variables')
      }

      // Fallback to environment variables if no database config
      if (!fullConfig.project_api_key) {
        fullConfig = {
          project_api_key: process.env.POSTHOG_PROJECT_API_KEY || '',
          host: process.env.POSTHOG_HOST || 'https://us.posthog.com',
          project_id: process.env.POSTHOG_PROJECT_ID || '',
          personal_api_key: process.env.POSTHOG_PERSONAL_API_KEY || ''
        }
      }

      // Use the full keys for testing
      project_api_key = fullConfig.project_api_key
      personal_api_key = fullConfig.personal_api_key
      host = host || fullConfig.host
      project_id = project_id || fullConfig.project_id
    }

    console.log('Testing PostHog config with:', {
      project_api_key: project_api_key ? `${project_api_key.substring(0, 8)}...` : 'MISSING',
      personal_api_key: personal_api_key ? `${personal_api_key.substring(0, 8)}...` : 'MISSING',
      host,
      project_id
    })

    // Validate required fields after fetching full config
    if (!project_api_key || !personal_api_key) {
      console.error('Missing required fields after fetching full config:', { 
        has_project_api_key: !!project_api_key, 
        has_personal_api_key: !!personal_api_key 
      })
      return NextResponse.json(
        { error: 'Project API Key and Personal API Key are required' },
        { status: 400 }
      )
    }

    const posthogHost = host || 'https://us.posthog.com'

    try {
      console.log('Attempting PostHog API call...')
      
      // Test the Personal API Key by fetching project info
      const projectResponse = await fetch(`${posthogHost}/api/projects/${project_id || ''}`, {
        headers: {
          'Authorization': `Bearer ${personal_api_key}`,
          'Content-Type': 'application/json'
        }
      })

      if (!projectResponse.ok) {
        const errorText = await projectResponse.text()
        console.error('PostHog API error:', errorText)
        
        if (projectResponse.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Personal API Key or unauthorized access' },
            { status: 400 }
          )
        } else if (projectResponse.status === 404) {
          return NextResponse.json(
            { error: 'Project not found. Check your Project ID.' },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: `PostHog API error: ${projectResponse.status}` },
            { status: 400 }
          )
        }
      }

      const projectData = await projectResponse.json()
      
      console.log('PostHog API call successful:', {
        project_name: projectData.name,
        project_id: projectData.id
      })

      // Test basic API access by fetching event definitions (simpler than queries)
      const definitionsResponse = await fetch(`${posthogHost}/api/projects/${project_id || projectData.id}/event_definition/`, {
        headers: {
          'Authorization': `Bearer ${personal_api_key}`,
          'Content-Type': 'application/json'
        }
      })

      if (!definitionsResponse.ok) {
        console.error('PostHog definitions test failed:', definitionsResponse.status)
        // Still allow success if project access works, just warn about limited permissions
        console.warn('Limited API permissions detected - some features may not work')
      }

      return NextResponse.json({
        success: true,
        message: 'PostHog connection test successful!',
        project_name: projectData.name || 'Unknown Project',
        project_id: projectData.id,
        host: posthogHost
      })

    } catch (fetchError) {
      console.error('PostHog connection error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to connect to PostHog. Check your host URL and network connection.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error testing PostHog connection:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}