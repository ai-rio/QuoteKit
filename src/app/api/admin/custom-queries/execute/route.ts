import { NextRequest, NextResponse } from 'next/server'

import { executePostHogQuery } from '@/libs/posthog/posthog-admin'
import { isAdmin } from '@/libs/supabase/admin-utils'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

// POST - Execute a custom HogQL query
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { query } = body

    // Validate input
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    // Basic query validation (prevent potentially dangerous queries)
    const dangerousPatterns = [
      /delete\s+from/i,
      /drop\s+table/i,
      /truncate\s+table/i,
      /alter\s+table/i,
      /create\s+table/i,
      /insert\s+into/i,
      /update\s+.*\s+set/i
    ]

    const isDangerous = dangerousPatterns.some(pattern => pattern.test(query))
    if (isDangerous) {
      return NextResponse.json(
        { error: 'Query contains potentially dangerous operations. Only SELECT queries are allowed.' },
        { status: 400 }
      )
    }

    // Execute the query
    console.log('Executing custom PostHog query:', {
      query: query.substring(0, 100) + '...',
      user: user.email,
      timestamp: new Date().toISOString()
    })

    const result = await executePostHogQuery(query)

    // Process and format the results
    const processedResult = {
      query,
      results: result.results || [],
      columns: result.columns || [],
      query_duration_ms: result.query_duration_ms || 0,
      executed_at: new Date().toISOString(),
      row_count: Array.isArray(result.results) ? result.results.length : 0
    }

    return NextResponse.json({
      success: true,
      data: processedResult
    })

  } catch (error) {
    console.error('Error executing custom query:', error)
    
    // Handle specific PostHog errors
    let errorMessage = 'Failed to execute query'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        errorMessage = 'PostHog API rate limit exceeded. Please try again later.'
        statusCode = 429
      } else if (error.message.includes('authentication')) {
        errorMessage = 'PostHog authentication failed. Please check configuration.'
        statusCode = 401
      } else if (error.message.includes('configuration missing')) {
        errorMessage = 'PostHog is not configured. Please configure PostHog in Admin Settings.'
        statusCode = 503
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: statusCode }
    )
  }
}