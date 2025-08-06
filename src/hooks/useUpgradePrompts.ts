'use client'

import { useRouter } from 'next/navigation'
import { useCallback,useState } from 'react'

import { useFeatureAccess } from './useFeatureAccess'

interface UpgradePromptConfig {
  trigger: 'limit_reached' | 'feature_blocked' | 'usage_warning' | 'manual'
  featureType: string
  currentUsage?: number
  limit?: number
  variant?: 'urgent' | 'benefit' | 'social_proof'
  onUpgrade?: () => void
  onDismiss?: () => void
}

interface ActivePrompt extends UpgradePromptConfig {
  id: string
  timestamp: number
}

export function useUpgradePrompts() {
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null)
  const { canAccess, features, usage } = useFeatureAccess()
  const router = useRouter()

  const showPrompt = useCallback((config: UpgradePromptConfig) => {
    const promptId = `${config.featureType}_${config.trigger}_${Date.now()}`
    
    setActivePrompt({
      ...config,
      id: promptId,
      timestamp: Date.now(),
      onUpgrade: config.onUpgrade || (() => {
        setActivePrompt(null)
        router.push(`/pricing?source=upgrade_prompt&feature=${encodeURIComponent(config.featureType)}`)
      }),
      onDismiss: config.onDismiss || (() => {
        setActivePrompt(null)
      })
    })
  }, [router])

  const hidePrompt = useCallback(() => {
    setActivePrompt(null)
  }, [])

  const checkAndShowPrompt = useCallback((
    featureType: 'max_quotes' | 'pdf_export' | 'bulk_operations' | 'analytics_access' | 'custom_branding',
    attemptedAction?: string
  ) => {
    if (!features || !usage) return false

    const featureAccess = canAccess(featureType)
    let shouldShow = false
    let trigger: UpgradePromptConfig['trigger'] = 'manual'
    let currentUsage: number | undefined
    let limit: number | undefined

    switch (featureType) {
      case 'max_quotes':
        currentUsage = usage.quotes_count
        limit = features.max_quotes
        
        if (!featureAccess.hasAccess && featureAccess.isAtLimit) {
          shouldShow = true
          trigger = 'limit_reached'
        } else if (limit > 0 && currentUsage >= limit * 0.8) {
          shouldShow = true
          trigger = 'usage_warning'
        }
        break
        
      case 'pdf_export':
      case 'bulk_operations':
      case 'analytics_access':
      case 'custom_branding':
        if (!featureAccess.hasAccess) {
          shouldShow = true
          trigger = 'feature_blocked'
        }
        break
    }

    if (shouldShow) {
      // Don't show multiple prompts too quickly
      const lastPromptTime = localStorage.getItem(`last_prompt_${featureType}`)
      const cooldownPeriod = 5 * 60 * 1000 // 5 minutes
      
      if (lastPromptTime && Date.now() - parseInt(lastPromptTime) < cooldownPeriod) {
        return false
      }

      localStorage.setItem(`last_prompt_${featureType}`, Date.now().toString())
      
      showPrompt({
        trigger,
        featureType,
        currentUsage,
        limit
      })
      
      return true
    }

    return false
  }, [features, usage, canAccess, showPrompt])

  const checkQuoteLimitAndPrompt = useCallback(() => {
    return checkAndShowPrompt('max_quotes', 'create_quote')
  }, [checkAndShowPrompt])

  const checkPDFExportAndPrompt = useCallback(() => {
    return checkAndShowPrompt('pdf_export', 'export_pdf')
  }, [checkAndShowPrompt])

  const checkBulkOperationsAndPrompt = useCallback(() => {
    return checkAndShowPrompt('bulk_operations', 'bulk_action')
  }, [checkAndShowPrompt])

  const checkAnalyticsAndPrompt = useCallback(() => {
    return checkAndShowPrompt('analytics_access', 'view_analytics')
  }, [checkAndShowPrompt])

  // Intelligent prompt triggering based on user behavior
  const triggerContextualPrompt = useCallback((context: {
    page: string
    action: string
    featureType: string
    metadata?: Record<string, any>
  }) => {
    const { page, action, featureType, metadata } = context
    
    // Custom logic for different contexts
    if (page === '/quotes' && action === 'create' && featureType === 'max_quotes') {
      return checkQuoteLimitAndPrompt()
    }
    
    if (action === 'bulk_select' && featureType === 'bulk_operations') {
      return checkBulkOperationsAndPrompt()
    }
    
    if (page === '/analytics' && featureType === 'analytics_access') {
      return checkAnalyticsAndPrompt()
    }
    
    return false
  }, [checkQuoteLimitAndPrompt, checkBulkOperationsAndPrompt, checkAnalyticsAndPrompt])

  return {
    activePrompt,
    showPrompt,
    hidePrompt,
    checkAndShowPrompt,
    checkQuoteLimitAndPrompt,
    checkPDFExportAndPrompt,
    checkBulkOperationsAndPrompt,
    checkAnalyticsAndPrompt,
    triggerContextualPrompt
  }
}

/**
 * Hook for displaying upgrade prompts in response to feature access attempts
 */
export function useFeatureGating() {
  const { checkAndShowPrompt } = useUpgradePrompts()
  
  const requireFeature = useCallback((
    featureType: 'max_quotes' | 'pdf_export' | 'bulk_operations' | 'analytics_access' | 'custom_branding',
    callback: () => void
  ) => {
    const promptShown = checkAndShowPrompt(featureType)
    if (!promptShown) {
      // Feature is available, execute callback
      callback()
    }
    // If prompt was shown, callback won't execute until user upgrades
  }, [checkAndShowPrompt])

  return { requireFeature }
}