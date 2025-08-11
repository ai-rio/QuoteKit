import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  // Preserve plan parameters from signup flow
  const plan = searchParams.get('plan')
  const amount = searchParams.get('amount')
  const interval = searchParams.get('interval')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      // Build redirect URL with plan parameters if they exist
      let redirectUrl = next
      if (plan || amount || interval) {
        const params = new URLSearchParams()
        if (plan) params.set('plan', plan)
        if (amount) params.set('amount', amount)
        if (interval) params.set('interval', interval)
        params.set('authenticated', 'true')
        
        // If user came from pricing page, redirect back to pricing with auth confirmation
        if (plan) {
          redirectUrl = `/pricing?${params.toString()}`
        } else {
          redirectUrl = `${next}?${params.toString()}`
        }
      }
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${redirectUrl}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectUrl}`)
      } 
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
