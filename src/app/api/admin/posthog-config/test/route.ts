import { NextRequest, NextResponse } from 'next/server'
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
    const { project_api_key, host, project_id, personal_api_key } = body

    // Validate required fields
    if (!project_api_key || !personal_api_key) {
      return NextResponse.json(
        { error: 'Project API Key and Personal API Key are required' },
        { status: 400 }
      )
    }

    const posthogHost = host || 'https://us.posthog.com'

    try {
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

      // Test the Project API Key by making a simple query
      const queryResponse = await fetch(`${posthogHost}/api/projects/${project_id || projectData.id}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${personal_api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: {
            kind: 'EventsQuery',
            select: ['event', 'timestamp'],
            limit: 1
          }
        })
      })

      if (!queryResponse.ok) {
        console.error('PostHog query test failed:', queryResponse.status)
        return NextResponse.json(
          { error: 'Connection successful but query test failed. Check your API permissions.' },
          { status: 400 }
        )
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