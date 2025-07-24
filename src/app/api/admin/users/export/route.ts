import { NextRequest, NextResponse } from 'next/server'

import { getUserActivity } from '@/libs/posthog/posthog-admin'
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin'
import { getUsersWithRoles, isAdmin } from '@/libs/supabase/admin-utils'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

// Export users data as CSV
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

    // Get all users data (without pagination for export)
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
        full_name: profile?.full_name || user.full_name || '',
        company_name: profile?.full_name || 'Individual User',
        role: user.role,
        status: user.email_confirmed_at ? 'active' : 'inactive',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        quote_count: analytics?.total_quotes || 0,
        total_revenue: analytics?.total_quote_value || 0,
        accepted_quotes: analytics?.accepted_quotes || 0,
        acceptance_rate: analytics?.acceptance_rate_percent || 0,
        event_count: activity?.event_count || 0,
        last_active: activity?.last_active || user.last_sign_in_at
      }
    })

    // Generate CSV data
    const csvHeaders = [
      'ID',
      'Email', 
      'Full Name',
      'Company Name',
      'Role',
      'Status',
      'Created At',
      'Last Sign In',
      'Quote Count',
      'Total Revenue',
      'Accepted Quotes',
      'Acceptance Rate (%)',
      'Event Count',
      'Last Active'
    ]

    const csvRows = usersWithActivity.map(user => [
      user.id,
      user.email,
      user.full_name,
      user.company_name,
      user.role,
      user.status,
      new Date(user.created_at).toLocaleDateString(),
      user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
      user.quote_count,
      user.total_revenue,
      user.accepted_quotes,
      user.acceptance_rate.toFixed(1),
      user.event_count,
      user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'
    ])

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(','))
    ].join('\n')

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

  } catch (error) {
    console.error('Error exporting users data:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}