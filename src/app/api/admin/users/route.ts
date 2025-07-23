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

    // Get users from Supabase (with fallback for development)
    let users: any[] = []
    try {
      users = await getUsersWithRoles()
    } catch (error) {
      console.log('Admin functions not available, using fallback query')
      // Fallback to basic query if admin functions aren't set up yet
      const { data, error: dbError } = await supabaseAdminClient.auth.admin.listUsers()
      if (dbError) throw dbError
      
      users = data.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.raw_user_meta_data?.role || 'user',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        full_name: u.user_metadata?.full_name || null
      }))
    }

    // Get user activity from PostHog
    const userActivity = await getUserActivity()

    // Get real quote analytics for each user
    const { data: quoteAnalytics, error: quoteError } = await supabaseAdminClient
      .from('quote_analytics')
      .select('*')
    
    if (quoteError) {
      console.error('Error fetching quote analytics:', quoteError)
    }

    // Get company names from users table
    const { data: userProfiles, error: profileError } = await supabaseAdminClient
      .from('users')
      .select('id, full_name')
    
    if (profileError) {
      console.error('Error fetching user profiles:', profileError)
    }

    // Combine user data with activity metrics and real quote data
    const usersWithActivity = users.map(user => {
      const activity = userActivity.find((a: any) => a.user_id === user.id)
      const analytics = quoteAnalytics?.find((q: any) => q.user_id === user.id)
      const profile = userProfiles?.find((p: any) => p.id === user.id)
      
      return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.full_name || null,
        company_name: profile?.full_name || 'Individual User', // Using full_name as company for now
        role: user.role,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        quote_count: analytics?.total_quotes || 0,
        total_revenue: analytics?.total_quote_value || 0,
        accepted_quotes: analytics?.accepted_quotes || 0,
        acceptance_rate: analytics?.acceptance_rate_percent || 0,
        event_count: activity?.event_count || 0,
        last_active: activity?.last_active || user.last_sign_in_at,
        status: user.email_confirmed_at ? 'active' : 'inactive'
      }
    })

    // Apply pagination
    const totalUsers = usersWithActivity.length
    const paginatedUsers = usersWithActivity.slice(offset, offset + limit)

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
