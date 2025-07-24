import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/libs/supabase/admin-utils'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

// GET - Retrieve saved queries
export async function GET(request: NextRequest) {
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

    // Get saved queries from admin_settings
    const { data: savedQueries, error: queryError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'custom_queries')
      .single()

    const queries = (savedQueries?.value as any)?.queries || []

    return NextResponse.json({
      success: true,
      data: queries
    })

  } catch (error) {
    console.error('Error fetching custom queries:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// POST - Save a new query
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
    const { name, description, query } = body

    // Validate input
    if (!name || !query) {
      return NextResponse.json(
        { error: 'Name and query are required' },
        { status: 400 }
      )
    }

    // Get existing queries
    const { data: existingData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'custom_queries')
      .single()

    const existingQueries = (existingData?.value as any)?.queries || []

    // Create new query object
    const newQuery = {
      id: Date.now().toString(),
      name,
      description: description || '',
      query,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add to queries array
    const updatedQueries = [...existingQueries, newQuery]

    // Save back to database
    const { error: saveError } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'custom_queries',
        value: { queries: updatedQueries },
        updated_by: user.id
      })

    if (saveError) {
      throw saveError
    }

    return NextResponse.json({
      success: true,
      data: newQuery
    })

  } catch (error) {
    console.error('Error saving custom query:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}