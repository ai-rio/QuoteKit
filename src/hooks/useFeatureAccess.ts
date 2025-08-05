'use client'

import { useCallback, useEffect, useState } from 'react'

import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client'
import { 
  type FeatureAccess,
  type FeatureKey, 
  type FeatureUsage,
  FREE_PLAN_FEATURES,
  parseStripeMetadata,
  type PlanFeatures} from '@/types/features'

/**
 * Enhanced hook for checking feature access based on user's subscription
 * Connects to real Supabase data and Stripe metadata
 */
export function useFeatureAccess() {
  const [features, setFeatures] = useState<PlanFeatures>(FREE_PLAN_FEATURES)
  const [usage, setUsage] = useState<FeatureUsage>({ quotes_count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createSupabaseClientClient()

  /**
   * Fetch subscription data and usage from Supabase
   */
  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) {
        setFeatures(FREE_PLAN_FEATURES)
        setUsage({ quotes_count: 0 })
        return
      }

      // Fetch active subscription with product metadata
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          stripe_prices!inner (
            *,
            stripe_products!inner (
              *
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      // If no active subscription or error (except not found), user gets free features
      if (subError && subError.code !== 'PGRST116') {
        console.warn('Error fetching subscription:', subError)
        // Don't throw - just use free features as fallback
      }

      // Parse features from Stripe product metadata
      let planFeatures = FREE_PLAN_FEATURES
      if (subscription?.stripe_prices?.stripe_products?.metadata) {
        try {
          planFeatures = parseStripeMetadata(subscription.stripe_prices.stripe_products.metadata)
        } catch (parseError) {
          console.warn('Error parsing Stripe metadata:', parseError)
          // Fallback to free features if parsing fails
        }
      }

      setFeatures(planFeatures)

      // Fetch current usage using the database function
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_current_usage', { p_user_id: user.id })
        .single()

      if (usageError) {
        console.warn('Error fetching usage:', usageError)
        setUsage({ quotes_count: 0 }) // Fallback to zero usage
      } else {
        setUsage({
          quotes_count: (usageData as any)?.quotes_count || 0
        })
      }

    } catch (err) {
      console.error('Error in fetchSubscriptionData:', err)
      setError(err as Error)
      // Fallback to free features on error
      setFeatures(FREE_PLAN_FEATURES)
      setUsage({ quotes_count: 0 })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch data on mount and when user changes
  useEffect(() => {
    fetchSubscriptionData()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchSubscriptionData()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchSubscriptionData, supabase.auth])

  /**
   * Check if user has access to a specific feature
   */
  const canAccess = useCallback((featureKey: FeatureKey): FeatureAccess => {
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

    // Default fallback
    return {
      hasAccess: false,
      upgradeRequired: true
    }
  }, [features, usage])

  /**
   * Check if user is at or near a feature limit
   */
  const isAtLimit = useCallback((featureKey: FeatureKey, threshold = 1): boolean => {
    const access = canAccess(featureKey)
    
    if (access.limit === undefined || access.current === undefined) {
      return false
    }

    return access.current >= (access.limit - threshold)
  }, [canAccess])

  /**
   * Get usage percentage for a feature
   */
  const getUsagePercentage = useCallback((featureKey: FeatureKey): number => {
    const access = canAccess(featureKey)
    
    if (access.limit === undefined || access.current === undefined) {
      return 0
    }

    return Math.min(100, (access.current / access.limit) * 100)
  }, [canAccess])

  /**
   * Check if user is on free plan
   */
  const isFreePlan = useCallback((): boolean => {
    return features.max_quotes <= 5 && 
           !features.pdf_export && 
           !features.analytics_access
  }, [features])

  /**
   * Check if user is on premium plan
   */
  const isPremiumPlan = useCallback((): boolean => {
    return features.max_quotes === -1 || 
           features.pdf_export || 
           features.analytics_access ||
           features.custom_branding
  }, [features])

  /**
   * Increment usage for a specific feature
   */
  const incrementUsage = useCallback(async (featureType: 'quotes' | 'pdf_exports' | 'api_calls' | 'bulk_operations', amount = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_usage_type: featureType,
        p_amount: amount
      })

      if (error) {
        console.error('Error incrementing usage:', error)
        return
      }

      // Refresh usage data after incrementing
      const { data: usageData } = await supabase
        .rpc('get_current_usage', { p_user_id: user.id })
        .single()

      if (usageData) {
        setUsage({
          quotes_count: (usageData as any).quotes_count || 0
        })
      }
    } catch (err) {
      console.error('Error in incrementUsage:', err)
    }
  }, [supabase])

  /**
   * Check if user would exceed limit with additional usage
   */
  const wouldExceedLimit = useCallback((featureKey: FeatureKey, additionalUsage = 1): boolean => {
    const access = canAccess(featureKey)
    
    if (access.limit === undefined || access.current === undefined) {
      return false
    }

    return (access.current + additionalUsage) > access.limit
  }, [canAccess])

  return {
    // Feature configuration
    features,
    
    // Usage data
    usage,
    
    // Access checking functions
    canAccess,
    isAtLimit,
    getUsagePercentage,
    wouldExceedLimit,
    
    // Plan type helpers
    isFreePlan,
    isPremiumPlan,
    
    // State
    loading,
    error,
    
    // Actions
    refresh: fetchSubscriptionData,
    incrementUsage
  }
}

/**
 * Simplified hook for checking a single feature
 */
export function useFeature(featureKey: FeatureKey) {
  const { canAccess, loading, error } = useFeatureAccess()
  
  const access = canAccess(featureKey)
  
  return {
    ...access,
    loading,
    error
  }
}

/**
 * Hook for checking quote limits specifically
 */
export function useQuoteLimits() {
  const { canAccess, usage, incrementUsage, wouldExceedLimit, loading, error } = useFeatureAccess()
  
  const quotesAccess = canAccess('max_quotes')
  
  return {
    ...quotesAccess,
    usage: usage.quotes_count,
    canCreateQuote: quotesAccess.hasAccess && !wouldExceedLimit('max_quotes'),
    incrementQuoteUsage: () => incrementUsage('quotes'),
    wouldExceedWithOne: wouldExceedLimit('max_quotes', 1),
    loading,
    error
  }
}
