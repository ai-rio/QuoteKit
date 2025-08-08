/**
 * API route to test Supabase connection from server-side
 * Bypasses browser CSP restrictions for connection testing
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection from server...')
    
    const supabaseUrl = 'http://127.0.0.1:54321'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    
    // Test 1: Basic HTTP connectivity
    const httpResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (!httpResponse.ok) {
      throw new Error(`HTTP ${httpResponse.status}: ${httpResponse.statusText}`)
    }
    
    // Test 2: Supabase client connectivity
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data, error } = await supabase
      .from('edge_function_metrics')
      .select('id')
      .limit(1)
    
    // Test 3: Admin authentication
    let authTest = null
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'carlos@ai.rio.br',
        password: 'password123'
      })
      
      if (authError) {
        authTest = { success: false, error: authError.message }
      } else {
        authTest = { success: true, user: authData.user?.email }
        // Sign out immediately
        await supabase.auth.signOut()
      }
    } catch (authErr: any) {
      authTest = { success: false, error: authErr.message }
    }
    
    // Test 4: Edge Function connectivity
    let edgeFunctionTest = null
    try {
      const { data: funcData, error: funcError } = await supabase.functions.invoke('test-connection', {
        body: { test: true, includeDbTest: true }
      })
      
      if (funcError) {
        edgeFunctionTest = { success: false, error: funcError.message }
      } else {
        edgeFunctionTest = { success: true, data: funcData }
      }
    } catch (funcErr: any) {
      edgeFunctionTest = { success: false, error: funcErr.message }
    }
    
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        http_connectivity: {
          success: true,
          status: httpResponse.status,
          statusText: httpResponse.statusText
        },
        supabase_client: {
          success: !error,
          error: error?.message || null,
          data_available: !!data
        },
        authentication: authTest,
        edge_function: edgeFunctionTest
      },
      environment: {
        supabase_url: supabaseUrl,
        has_service_key: !!supabaseKey,
        node_env: process.env.NODE_ENV
      }
    }
    
    console.log('✅ Connection test completed:', results)
    
    return NextResponse.json(results)
    
  } catch (error: any) {
    console.error('❌ Connection test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      suggestion: 'Please ensure Supabase is running with: supabase start'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests for more detailed testing
  return GET(request)
}
