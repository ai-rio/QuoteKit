'use client'

import { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'

import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client'

// Simplified types
interface FeatureUsage {
  quotes_count: number
}

interface PlanFeatures {
  max_quotes: number
  pdf_export: boolean
  analytics_access: boolean
  custom_branding: boolean
  bulk_operations: boolean
}

interface FeatureAccess {
  hasAccess: boolean
  upgradeRequired: boolean
  limit?: number
  current?: number
  isAtLimit?: boolean
}

const FREE_PLAN_FEATURES: PlanFeatures = {
  max_quotes: 5,
  pdf_export: false,
  analytics_access: false,
  custom_branding: false,
  bulk_operations: false
}

export function useFeatureAccessFixed() {
  const [user, setUser] = useState<User | null>(null)
  const [features, setFeatures] = useState<PlanFeatures>(FREE_PLAN_FEATURES)
  const [usage, setUsage] = useState<FeatureUsage>({ quotes_count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createSupabaseClientClient()

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user session with timeout
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.warn('Session error:', sessionError)
        setUser(null)
        setFeatures(FREE_PLAN_FEATURES)
        setUsage({ quotes_count: 0 })
        return
      }

      setUser(session?.user || null)

      if (!session?.user) {
        // No user - use free features
        setFeatures(FREE_PLAN_FEATURES)
        setUsage({ quotes_count: 0 })
        return
      }

      // For now, just use free features for all authenticated users
      // TODO: Implement subscription checking later
      setFeatures(FREE_PLAN_FEATURES)
      
      // Get quote count for the user
      try {
        const { count, error: countError } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)

        if (countError) {
          console.warn('Count error:', countError)
          setUsage({ quotes_count: 0 })
        } else {
          setUsage({ quotes_count: count || 0 })
        }
      } catch (countErr) {
        console.warn('Quote count fetch failed:', countErr)
        setUsage({ quotes_count: 0 })
      }

    } catch (err) {
      console.error('Error in fetchUserData:', err)
      setError(err as Error)
      setFeatures(FREE_PLAN_FEATURES)
      setUsage({ quotes_count: 0 })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUserData()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUserData()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserData, supabase.auth])

  const canAccess = useCallback((featureKey: keyof PlanFeatures): FeatureAccess => {
    const featureValue = features[featureKey]

    // Handle boolean features
    if (typeof featureValue === 'boolean') {
      return {
        hasAccess: featureValue,
        upgradeRequired: !featureValue
      }
    }

    // Handle numeric features (like max_quotes)
    if (typeof featureValue === 'number' && featureKey === 'max_quotes') {
      const unlimited = featureValue === -1
      const current = usage.quotes_count || 0
      const hasAccess = unlimited || current < featureValue
      
      return {
        hasAccess,
        limit: unlimited ? undefined : featureValue,
        current,
        isAtLimit: !unlimited && current >= featureValue,
        upgradeRequired: !hasAccess
      }
    }

    return {
      hasAccess: false,
      upgradeRequired: true
    }
  }, [features, usage])

  const isFreePlan = useCallback(() => {
    return features.max_quotes <= 5 && !features.pdf_export
  }, [features])

  const isPremiumPlan = useCallback(() => {
    return features.max_quotes === -1 || features.pdf_export
  }, [features])

  return {
    user,
    features,
    usage,
    canAccess,
    isFreePlan,
    isPremiumPlan,
    loading,
    error,
    refresh: fetchUserData
  }
}