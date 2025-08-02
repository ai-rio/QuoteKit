'use client'

import { useCallback, useState } from 'react'

import { 
  type PlanFeatures, 
  type FeatureKey, 
  type FeatureAccess,
  FREE_PLAN_FEATURES
} from '@/types/features'

/**
 * Simplified hook for checking feature access based on user's subscription
 * This is a minimal version for testing - will be enhanced later
 */
export function useFeatureAccess() {
  const [features] = useState<PlanFeatures>(FREE_PLAN_FEATURES)
  const [loading] = useState(false)
  const [error] = useState<Error | null>(null)

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
    if (typeof featureValue === 'number') {
      if (featureKey === 'max_quotes') {
        const unlimited = featureValue === -1
        const current = 0 // For now, assume 0 usage
        const hasAccess = unlimited || current < featureValue
        
        return {
          hasAccess,
          limit: unlimited ? undefined : featureValue,
          current,
          isAtLimit: !unlimited && current >= featureValue,
          upgradeRequired: !hasAccess
        }
      }
    }

    // Default fallback
    return {
      hasAccess: false,
      upgradeRequired: true
    }
  }, [features])

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
   * Refresh feature and usage data
   */
  const refresh = useCallback(async () => {
    // For now, do nothing - will implement later
  }, [])

  return {
    // Feature configuration
    features,
    
    // Usage data
    usage: { quotes_count: 0 },
    
    // Access checking functions
    canAccess,
    isAtLimit,
    getUsagePercentage,
    
    // Plan type helpers
    isFreePlan,
    isPremiumPlan,
    
    // State
    loading,
    error,
    
    // Actions
    refresh
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
