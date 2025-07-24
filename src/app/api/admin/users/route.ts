import { NextRequest, NextResponse } from 'next/server'

import { getUserActivity } from '@/libs/posthog/posthog-admin'
import { getUsersWithRoles,isAdmin } from '@/libs/supabase/admin-utils'
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

    // Check admin role
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get pagination parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get users from Supabase (with fallback for development) - FORCE FALLBACK FOR DEBUGGING
    let users: any[] = []
    console.log('Forcing fallback to debug user fetching...')
    const { data, error: dbError } = await supabaseAdminClient.auth.admin.listUsers()
    if (dbError) {
      console.error('Fallback auth.admin.listUsers() failed:', dbError)
      throw dbError
    }
    
    console.log(`Fallback returned ${data.users.length} users:`, data.users)
    users = data.users.map((u: any) => ({
      id: u.id,
      email: u.email,
      role: u.raw_user_meta_data?.role || 'user',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      full_name: u.user_metadata?.full_name || null
    }))

    // Apply pagination
    const totalUsers = users.length
    const paginatedUsers = users.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching admin users:', error)
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

    // Check admin role
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, role } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let result
    if (action === 'grant_admin' && role === 'admin') {
      result = await supabaseAdminClient.rpc('grant_admin_role', { target_user_id: userId })
    } else if (action === 'revoke_admin' && role === 'user') {
      result = await supabaseAdminClient.rpc('revoke_admin_role', { target_user_id: userId })
    } else {
      return NextResponse.json({ error: 'Invalid action or role' }, { status: 400 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `User role ${action === 'grant_admin' ? 'granted' : 'revoked'} successfully`
    })

  } catch (error) {
    console.error('Error updating user role:', error)
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

    // Check admin role
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role = 'user' } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Create user using Supabase Admin API
    const { data: newUser, error: createError } = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: full_name || null,
        created_by_admin: true
      }
    })

    if (createError) {
      return NextResponse.json({ 
        error: createError.message || 'Failed to create user' 
      }, { status: 400 })
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
    }

    // Grant admin role if specified
    if (role === 'admin') {
      const result = await supabaseAdminClient.rpc('grant_admin_role', { 
        target_user_id: newUser.user.id 
      })
      
      if (result.error) {
        console.error('Error granting admin role:', result.error)
        // Continue anyway, user was created successfully
      }
    }

    // Insert user profile data if full_name provided
    if (full_name) {
      const { error: profileError } = await supabaseAdminClient
        .from('users')
        .upsert({
          id: newUser.user.id,
          full_name: full_name
        })
      
      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Continue anyway, user was created successfully
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: full_name || null,
        role: role,
        created_at: newUser.user.created_at
      }
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

