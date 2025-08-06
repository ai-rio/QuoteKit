import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Test basic connection
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      return NextResponse.json({ 
        error: error.message,
        code: error.status 
      }, { status: error.status || 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}