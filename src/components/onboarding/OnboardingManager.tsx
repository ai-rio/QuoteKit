"use client"

import React, { useCallback,useEffect } from 'react'

import { useOnboarding } from '@/contexts/onboarding-context'
import { useUser } from '@/hooks/use-user'
import { useUserTier } from '@/hooks/use-user-tier'
import { getTourConfig, getToursForTier } from '@/libs/onboarding/tour-configs'
import { tourManager } from '@/libs/onboarding/tour-manager'
import { onboardingDebug } from '@/utils/onboarding-debug'

interface OnboardingManagerProps {
  autoStartWelcome?: boolean
  enableTierBasedTours?: boolean
  debugMode?: boolean
}

export function OnboardingManager({
  autoStartWelcome = true,
  enableTierBasedTours = true,
  debugMode = false
}: OnboardingManagerProps) {
  const { 
    startTour,
    completeTour,
    skipTour,
    activeTour,
    shouldShowTour,
    getTourProgress
  } = useOnboarding()

  // Debounce mechanism to prevent cascading skip events
  const skipDebounceRef = React.useRef<Set<string>>(new Set())
  const skipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  
  // Adapt context properties to component expectations  
  const currentTour = activeTour?.tourId
  const isActive = !!activeTour
  const isTourCompleted = (tourId: string) => {
    const progress = getTourProgress(tourId)
    return progress?.completed || false
  }
  
  const { data: user } = useUser()
  const { tier: userTier, isLoading: tierLoading, canAccess } = useUserTier()

  // Handle tour completion
  const handleTourComplete = useCallback(async (tourId: string) => {
    if (debugMode) {
      console.log(`Tour completed: ${tourId}`)
    }
    
    await completeTour(tourId)
    
    // Auto-start next recommended tour based on completion and user tier
    if (enableTierBasedTours && !tierLoading) {
      const availableTours = getToursForTier(userTier)
      
      // Define tour sequence based on user tier (Progressive Onboarding - S1.2)
      const tourSequence: Record<string, string> = {
        'welcome': 'settings',
        'settings': 'quote-creation', 
        'quote-creation': 'item-library',
        'item-library': 'contextual-help'
      }
      
      // Add pro-specific tour for pro users after contextual-help
      if ((userTier === 'pro' || userTier === 'enterprise') && tourId === 'contextual-help') {
        tourSequence['contextual-help'] = 'pro-features'
      }
      
      const nextTourId = tourSequence[tourId]
      if (nextTourId && shouldShowTour(nextTourId)) {
        // Check if next tour is available for user's tier
        const nextTourConfig = getTourConfig(nextTourId)
        if (nextTourConfig?.userTiers?.includes(userTier)) {
          // Delay next tour to avoid overwhelming user
          setTimeout(() => {
            if (shouldShowTour(nextTourId)) {
              startNextTour(nextTourId)
            }
          }, 3000)
        }
      }
    }
  }, [completeTour, enableTierBasedTours, userTier, tierLoading, shouldShowTour, debugMode])

  // Handle tour skip with debouncing to prevent cascading events
  const handleTourSkip = useCallback(async (tourId: string) => {
    // Prevent rapid cascading skip events
    if (skipDebounceRef.current.has(tourId)) {
      if (debugMode) {
        console.log(`Skip already in progress for tour: ${tourId} - ignoring duplicate`)
      }
      return
    }

    // Add to debounce set
    skipDebounceRef.current.add(tourId)

    if (debugMode) {
      console.log(`Tour skipped: ${tourId}`)
    }
    
    try {
      await skipTour(tourId)
    } catch (error) {
      console.error(`Error skipping tour ${tourId}:`, error)
    }

    // Clear debounce after a delay
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current)
    }
    skipTimeoutRef.current = setTimeout(() => {
      skipDebounceRef.current.delete(tourId)
    }, 2000) // Clear after 2 seconds

  }, [skipTour, debugMode])

  // Start next tour in sequence
  const startNextTour = useCallback(async (tourId: string) => {
    try {
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        console.error(`Tour configuration not found: ${tourId}`)
        return
      }

      await tourManager.initializeTour(tourId, tourConfig)
      await startTour(tourId)
      
      // Add slight delay to ensure proper initialization
      setTimeout(async () => {
        await tourManager.startTour()
      }, 100)
      
    } catch (error) {
      console.error(`Error starting next tour ${tourId}:`, error)
    }
  }, [startTour])

  // Initialize tour manager event handlers
  useEffect(() => {
    if (!user?.id) return

    // Set up global tour event handlers
    tourManager.onTourComplete(handleTourComplete)
    tourManager.onTourSkip(handleTourSkip)

    return () => {
      // Cleanup event handlers
      tourManager.removeTourCompleteCallback(handleTourComplete)
      tourManager.removeTourSkipCallback(handleTourSkip)
      
      // Cleanup skip timeout
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current)
        skipTimeoutRef.current = null
      }
      // Clear skip debounce set
      skipDebounceRef.current.clear()
    }
  }, [user?.id, handleTourComplete, handleTourSkip])

  // Auto-start welcome tour for new users
  useEffect(() => {
    if (debugMode) {
      console.log('🎯 OnboardingManager: Auto-start check conditions:')
      console.log('  autoStartWelcome:', autoStartWelcome)
      console.log('  user?.id:', user?.id)
      console.log('  tierLoading:', tierLoading)
      console.log('  userTier:', userTier)
      console.log('  shouldShowTour("welcome"):', shouldShowTour('welcome'))
      console.log('  isActive:', isActive)
      console.log('  activeTour:', activeTour)
      console.log('  currentTour:', currentTour)
      console.log('  window?.location?.pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')
      
      // Enhanced debugging for phantom active tour
      if (isActive && typeof window !== 'undefined') {
        console.log('🔍 OnboardingManager: Investigating phantom active tour...')
        const hasPhantom = onboardingDebug.checkForPhantomActiveTour()
        if (hasPhantom) {
          console.log('🔧 OnboardingManager: Phantom tour detected! Use onboardingDebug.clearPhantomActiveTour() to fix')
        }
      }
    }
    
    if (
      autoStartWelcome &&
      user?.id &&
      !tierLoading &&
      shouldShowTour('welcome') &&
      !isActive &&
      typeof window !== 'undefined' &&
      window.location.pathname === '/dashboard'
    ) {
      // Check if user is truly new (no completed tours)
      const availableTours = getToursForTier(userTier)
      const hasCompletedAnyTour = availableTours.some(tour => isTourCompleted(tour.id))
      
      if (debugMode) {
        console.log('🎯 OnboardingManager: All conditions met!')
        console.log('  availableTours:', availableTours.map(t => t.id))
        console.log('  hasCompletedAnyTour:', hasCompletedAnyTour)
      }
      
      if (!hasCompletedAnyTour) {
        if (debugMode) {
          console.log('🚀 OnboardingManager: Starting welcome tour in 2 seconds...')
        }
        // Delay to ensure page is fully loaded
        const timer = setTimeout(() => {
          if (debugMode) {
            console.log('🚀 OnboardingManager: Executing startNextTour("welcome")')
          }
          startNextTour('welcome')
        }, 2000)

        return () => clearTimeout(timer)
      } else if (debugMode) {
        console.log('❌ OnboardingManager: User has already completed tours, not starting welcome tour')
      }
    } else if (debugMode) {
      console.log('❌ OnboardingManager: Conditions not met for auto-start')
    }
  }, [
    autoStartWelcome,
    user?.id,
    tierLoading,
    userTier,
    shouldShowTour,
    isActive,
    isTourCompleted,
    startNextTour
  ])

  // Debug logging
  useEffect(() => {
    if (debugMode && activeTour?.tourId) {
      console.log(`Active tour: ${activeTour?.tourId}`)
      console.log(`Tour manager active: ${tourManager.isActive()}`)
      console.log(`Current step: ${tourManager.getCurrentStep()}`)
    }
  }, [debugMode, activeTour?.tourId])

  // This component doesn't render anything visible
  return null
}

// Hook for manual tour management
export function useOnboardingManager() {
  const { startTour, completeTour, skipTour, resetProgress } = useOnboarding()

  const startSpecificTour = useCallback(async (tourId: string) => {
    try {
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        throw new Error(`Tour configuration not found: ${tourId}`)
      }

      await tourManager.initializeTour(tourId, tourConfig)
      await startTour(tourId)
      await tourManager.startTour()
    } catch (error) {
      console.error(`Error starting tour ${tourId}:`, error)
      throw error
    }
  }, [startTour])

  const stopCurrentTour = useCallback(async () => {
    try {
      await tourManager.destroyTour()
    } catch (error) {
      console.error('Error stopping tour:', error)
      throw error
    }
  }, [])

  const completeCurrentTour = useCallback(async () => {
    try {
      await tourManager.completeTour()
    } catch (error) {
      console.error('Error completing tour:', error)
      throw error
    }
  }, [])

  const resetAllProgress = useCallback(async () => {
    try {
      await tourManager.destroyTour()
      await resetProgress()
    } catch (error) {
      console.error('Error resetting progress:', error)
      throw error
    }
  }, [resetProgress])

  return {
    startTour: startSpecificTour,
    stopTour: stopCurrentTour,
    completeTour: completeCurrentTour,
    resetProgress: resetAllProgress
  }
}