import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/libs/supabase/admin-utils'
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function POST(
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

    const { id: userId } = await params
    const body = await request.json()
    const { status } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required (active or inactive)' }, { status: 400 })
    }

    // For Supabase Auth, we handle user status by updating the user's email_confirmed_at
    // Active users have email_confirmed_at set, inactive users have it null
    if (status === 'active') {
      // Enable user by confirming email if not already confirmed
      const { data: userData, error: getUserError } = await supabaseAdminClient.auth.admin.getUserById(userId)
      if (getUserError) {
        return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
      }

      if (!userData.user.email_confirmed_at) {
        const { error: confirmError } = await supabaseAdminClient.auth.admin.updateUserById(userId, {
          email_confirm: true
        })

        if (confirmError) {
          console.error('Error confirming user email:', confirmError)
          return NextResponse.json({ error: 'Failed to activate user' }, { status: 500 })
        }
      }
    } else {
      // Disable user by setting email_confirmed_at to null
      const { error: disableError } = await supabaseAdminClient.auth.admin.updateUserById(userId, {
        email_confirm: false
      })

      if (disableError) {
        console.error('Error disabling user:', disableError)
        return NextResponse.json({ error: 'Failed to disable user' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}