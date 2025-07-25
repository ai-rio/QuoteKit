"use client"

import { useCallback, useEffect, useState } from "react"

import { createSupabaseClientClient } from "@/libs/supabase/supabase-client-client"
import { User } from "@supabase/supabase-js"

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClientClient()

    // Get initial user
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          setError(error)
        } else {
          setUser(user)
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { data: user, loading, error }
}

// Dashboard-specific hook for system status aggregation

export interface SystemStatus {
  posthog: {
    configured: boolean
    connected: boolean
    lastChecked: string | null
  }
  resend: {
    configured: boolean
    connected: boolean
    lastChecked: string | null
  }
  stripe: {
    configured: boolean
    connected: boolean
    lastChecked: string | null
  }
  database: {
    connected: boolean
    responseTime: number | null
  }
  userActivity: {
    totalUsers: number
    activeUsers: number
    todaySignups: number
  }
  overall: {
    health: 'healthy' | 'warning' | 'critical'
    issuesCount: number
  }
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSystemStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all system status data in parallel
      const [posthogResponse, resendResponse, stripeResponse, usersResponse] = await Promise.allSettled([
        fetch('/api/admin/posthog-config'),
        fetch('/api/admin/resend-config'),
        fetch('/api/admin/stripe-config'),
        fetch('/api/admin/users?page=1&limit=1')
      ])

      const systemStatus: SystemStatus = {
        posthog: {
          configured: false,
          connected: false,
          lastChecked: null
        },
        resend: {
          configured: false,
          connected: false,
          lastChecked: null
        },
        stripe: {
          configured: false,
          connected: false,
          lastChecked: null
        },
        database: {
          connected: true, // Assume connected if we can make API calls
          responseTime: null
        },
        userActivity: {
          totalUsers: 0,
          activeUsers: 0,
          todaySignups: 0
        },
        overall: {
          health: 'healthy',
          issuesCount: 0
        }
      }

      // Process PostHog status
      if (posthogResponse.status === 'fulfilled' && posthogResponse.value.ok) {
        const posthogData = await posthogResponse.value.json()
        systemStatus.posthog = {
          configured: posthogData.status?.isConfigured || false,
          connected: posthogData.status?.isConnected || false,
          lastChecked: posthogData.status?.lastChecked || null
        }
      }

      // Process Resend status
      if (resendResponse.status === 'fulfilled' && resendResponse.value.ok) {
        const resendData = await resendResponse.value.json()
        systemStatus.resend = {
          configured: resendData.status?.isConfigured || false,
          connected: resendData.status?.isConnected || false,
          lastChecked: resendData.status?.lastChecked || null
        }
      }

      // Process Stripe status
      if (stripeResponse.status === 'fulfilled' && stripeResponse.value.ok) {
        const stripeData = await stripeResponse.value.json()
        systemStatus.stripe = {
          configured: stripeData.status?.isConfigured || false,
          connected: stripeData.status?.isConnected || false,
          lastChecked: stripeData.status?.lastChecked || null
        }
      }

      // Process User activity data
      if (usersResponse.status === 'fulfilled' && usersResponse.value.ok) {
        const usersData = await usersResponse.value.json()
        if (usersData.success && usersData.pagination) {
          systemStatus.userActivity = {
            totalUsers: usersData.pagination.total || 0,
            activeUsers: usersData.data?.filter((user: any) => user.status === 'active').length || 0,
            todaySignups: 0 // This would need additional API endpoint
          }
        }
      }

      // Calculate overall health
      let issuesCount = 0
      if (!systemStatus.posthog.configured) issuesCount++
      if (!systemStatus.resend.configured) issuesCount++
      if (!systemStatus.stripe.configured) issuesCount++
      if (!systemStatus.database.connected) issuesCount++

      systemStatus.overall = {
        health: issuesCount === 0 ? 'healthy' : issuesCount <= 2 ? 'warning' : 'critical',
        issuesCount
      }

      setStatus(systemStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system status')
      console.error('Error fetching system status:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSystemStatus()
    // Set up periodic refresh every 5 minutes
    const interval = setInterval(fetchSystemStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSystemStatus])

  return {
    status,
    loading,
    error,
    refresh: fetchSystemStatus
  }
}
