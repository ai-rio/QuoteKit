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

    // Check admin role (temporarily disabled for development)
    // const userIsAdmin = await isAdmin(user.id)
    // if (!userIsAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

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
        role: 'user', // Default role
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at
      }))
    }

    // Get user activity from PostHog
    const userActivity = await getUserActivity()

    // Combine user data with activity metrics
    const usersWithActivity = users.map(user => {
      const activity = userActivity.find((a: any) => a.user_id === user.id)
      return {
        ...user,
        quote_count: activity?.quotes_created || 0,
        event_count: activity?.event_count || 0,
        last_active: activity?.last_active || user.last_sign_in_at,
        // Mock revenue data - replace with real data from your quotes table
        total_revenue: Math.floor(Math.random() * 10000)
      }
    })

    return NextResponse.json({
      success: true,
      data: usersWithActivity
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