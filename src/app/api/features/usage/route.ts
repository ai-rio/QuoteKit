import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

/**
 * GET /api/features/usage
 * Get current feature usage for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get quote count (excluding templates)
    const { count: quotesCount, error: quotesError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_template', false)

    if (quotesError) {
      console.error('Error counting quotes:', quotesError)
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      )
    }

    const usage = {
      quotes_count: quotesCount || 0
    }

    return NextResponse.json({ usage })

  } catch (error) {
    console.error('Error in feature usage API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
