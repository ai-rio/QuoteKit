'use client'

import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { useEffect } from 'react'

import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client'

// Type definitions for Google One-Tap (since we can't install the package)
interface CredentialResponse {
  credential: string
  select_by: string
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

interface GoogleOneTapProps {
  disabled?: boolean
}

export function GoogleOneTap({ disabled = false }: GoogleOneTapProps) {
  const supabase = createSupabaseClientClient()
  const router = useRouter()

  // Generate nonce for security
  const generateNonce = async (): Promise<[string, string]> => {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    const encoder = new TextEncoder()
    const encodedNonce = encoder.encode(nonce)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return [nonce, hashedNonce]
  }

  useEffect(() => {
    if (disabled || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      return
    }

    const initializeGoogleOneTap = async () => {
      // Check if user is already authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        return // Don't show One-Tap if already authenticated
      }

      // Wait for Google script to load
      if (typeof window.google === 'undefined') {
        setTimeout(initializeGoogleOneTap, 100)
        return
      }

      try {
        const [nonce, hashedNonce] = await generateNonce()

        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: CredentialResponse) => {
            try {
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce,
              })

              if (error) {
                console.error('Google One-Tap sign-in error:', error)
                return
              }

              console.log('Successfully signed in with Google One-Tap')
              router.push('/dashboard')
            } catch (error) {
              console.error('Error during Google One-Tap sign-in:', error)
            }
          },
          nonce: hashedNonce,
          use_fedcm_for_prompt: true, // Use FedCM for better Chrome compatibility
          auto_select: false, // Don't auto-select to give users control
          cancel_on_tap_outside: true,
        })

        // Show the One-Tap prompt
        window.google.accounts.id.prompt()
      } catch (error) {
        console.error('Failed to initialize Google One-Tap:', error)
      }
    }

    // Initialize after a short delay to ensure the page is loaded
    const timer = setTimeout(initializeGoogleOneTap, 1000)

    return () => clearTimeout(timer)
  }, [disabled, supabase, router])

  if (disabled || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null
  }

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
      />
      <div id="g_id_onload" className="fixed top-0 right-0 z-50" />
    </>
  )
}
