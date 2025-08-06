'use client'

import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client'

export function useSimpleAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClientClient()

    // Get initial session
    async function getInitialSession() {
      try {
        console.log('🔍 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
          setError(error.message)
        } else {
          console.log('✅ Session data:', session ? 'User logged in' : 'No session')
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('❌ Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session ? 'User logged in' : 'No session')
      setUser(session?.user ?? null)
      setError(null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}