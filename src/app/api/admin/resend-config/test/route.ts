import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function POST(request: NextRequest) {
  console.log('=== RESEND TEST ENDPOINT CALLED ===')
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    let { api_key, from_email, from_name } = body

    // Handle masked keys - if keys appear to be masked, get the full keys from environment or database
    const isMaskedApiKey = api_key && api_key.includes('...')
    
    if (isMaskedApiKey || !api_key || !from_email) {
      console.log('Detected masked or missing Resend keys, fetching full keys from config...')
      
      // Get the full config (same logic as GET endpoint)
      let fullConfig = {
        api_key: '',
        from_email: '',
        from_name: 'LawnQuote'
      }

      try {
        const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin')
        const { data: dbConfig } = await supabaseAdminClient
          .from('admin_settings')
          .select('value')
          .eq('key', 'resend_config')
          .single()

        if (dbConfig?.value && typeof dbConfig.value === 'object') {
          fullConfig = { ...fullConfig, ...dbConfig.value }
        }
      } catch (dbError) {
        console.log('No database config found, using environment variables')
      }

      // Fallback to environment variables if no database config
      if (!fullConfig.api_key) {
        fullConfig = {
          api_key: process.env.RESEND_API_KEY || '',
          from_email: process.env.RESEND_FROM_EMAIL || '',
          from_name: process.env.RESEND_FROM_NAME || 'LawnQuote'
        }
      }

      // Use the full keys for testing
      api_key = fullConfig.api_key
      from_email = from_email || fullConfig.from_email
      from_name = from_name || fullConfig.from_name
    }

    console.log('Testing Resend config with:', {
      api_key: api_key ? `${api_key.substring(0, 8)}...` : 'MISSING',
      from_email,
      from_name
    })

    // Validate required fields after fetching full config
    if (!api_key || !from_email) {
      console.error('Missing required fields after fetching full config:', { 
        has_api_key: !!api_key, 
        has_from_email: !!from_email 
      })
      return NextResponse.json(
        { error: 'API Key and From Email are required' },
        { status: 400 }
      )
    }

    try {
      console.log('Attempting Resend API call...')
      
      // Test the Resend API by getting domains first
      const testResponse = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        }
      })

      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.error('Resend API error:', errorText)
        
        if (testResponse.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Resend API Key or unauthorized access' },
            { status: 400 }
          )
        } else if (testResponse.status === 403) {
          return NextResponse.json(
            { error: 'API Key does not have sufficient permissions' },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: `Resend API error: ${testResponse.status}` },
            { status: 400 }
          )
        }
      }

      const domainsData = await testResponse.json()
      
      console.log('Resend API call successful:', {
        domains_count: domainsData.data?.length || 0
      })
      
      // Check if the from_email domain is verified
      const emailDomain = from_email.split('@')[1]
      const verifiedDomains = domainsData.data || []
      const domainVerified = verifiedDomains.some((domain: any) => 
        domain.name === emailDomain && domain.status === 'verified'
      )

      if (!domainVerified) {
        return NextResponse.json(
          { 
            error: `Domain "${emailDomain}" is not verified in Resend. Please verify the domain first.`,
            domains: verifiedDomains.map((d: any) => ({ name: d.name, status: d.status }))
          },
          { status: 400 }
        )
      }

      // Send a test email to verify full functionality
      const testEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${from_name || 'LawnQuote'} <${from_email}>`,
          to: [user.email], // Send test email to the admin user
          subject: 'Resend Configuration Test - LawnQuote Admin',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2d7d32;">✅ Resend Configuration Successful!</h2>
              <p>This is a test email to confirm that your Resend integration is working correctly.</p>
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li>From Email: ${from_email}</li>
                <li>From Name: ${from_name || 'LawnQuote'}</li>
                <li>Domain: ${emailDomain}</li>
              </ul>
              <p>Your LawnQuote admin panel can now send emails through Resend.</p>
              <hr style="margin: 20px 0; border: none; height: 1px; background-color: #e0e0e0;">
              <p style="font-size: 12px; color: #666;">
                This email was sent from the LawnQuote Admin Settings panel.
              </p>
            </div>
          `
        })
      })

      if (!testEmailResponse.ok) {
        const emailError = await testEmailResponse.text()
        console.error('Resend test email error:', emailError)
        return NextResponse.json(
          { error: 'API connection successful but failed to send test email. Check your from_email configuration.' },
          { status: 400 }
        )
      }

      const emailResult = await testEmailResponse.json()

      return NextResponse.json({
        success: true,
        message: 'Resend connection test successful! A test email has been sent to your account.',
        email_id: emailResult.id,
        verified_domains: verifiedDomains.length,
        from_email,
        from_name: from_name || 'LawnQuote'
      })

    } catch (fetchError) {
      console.error('Resend connection error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to connect to Resend. Check your API key and network connection.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error testing Resend connection:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}