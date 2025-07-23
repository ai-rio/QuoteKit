import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/libs/supabase/admin-utils'
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function PATCH(
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
    const { full_name } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Update user profile information
    if (full_name !== undefined) {
      const { error: updateError } = await supabaseAdminClient
        .from('users')
        .upsert({
          id: userId,
          full_name: full_name
        }, {
          onConflict: 'id'
        })

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}