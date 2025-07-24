import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/libs/supabase/admin-utils'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

// GET - Get a specific query
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: queryId } = await params

    // Get saved queries
    const { data: savedQueries } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'custom_queries')
      .single()

    const queries = (savedQueries?.value as any)?.queries || []
    const query = queries.find((q: any) => q.id === queryId)

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: query
    })

  } catch (error) {
    console.error('Error fetching query:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// PUT - Update a query
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: queryId } = await params
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
    const queryIndex = existingQueries.findIndex((q: any) => q.id === queryId)

    if (queryIndex === -1) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    // Update the query
    existingQueries[queryIndex] = {
      ...existingQueries[queryIndex],
      name,
      description: description || '',
      query,
      updated_at: new Date().toISOString()
    }

    // Save back to database
    const { error: saveError } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'custom_queries',
        value: { queries: existingQueries },
        updated_by: user.id
      })

    if (saveError) {
      throw saveError
    }

    return NextResponse.json({
      success: true,
      data: existingQueries[queryIndex]
    })

  } catch (error) {
    console.error('Error updating query:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// DELETE - Delete a query
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: queryId } = await params

    // Get existing queries
    const { data: existingData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'custom_queries')
      .single()

    const existingQueries = (existingData?.value as any)?.queries || []
    const filteredQueries = existingQueries.filter((q: any) => q.id !== queryId)

    if (existingQueries.length === filteredQueries.length) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    // Save back to database
    const { error: saveError } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'custom_queries',
        value: { queries: filteredQueries },
        updated_by: user.id
      })

    if (saveError) {
      throw saveError
    }

    return NextResponse.json({
      success: true,
      message: 'Query deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting query:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}