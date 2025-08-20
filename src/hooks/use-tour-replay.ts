"use client"

import { useCallback, useEffect,useState } from 'react'

import { useOnboarding } from '@/contexts/onboarding-context'
import { getTourConfig } from '@/libs/onboarding/tour-configs'
import { tourManager } from '@/libs/onboarding/tour-manager'

/**
 * Hook for replaying tours, bypassing completion restrictions
 * Following Driver.js best practices for manual tour control
 */
export function useTourReplay() {
  const { startTour, activeTour } = useOnboarding()

  // Import the simplified tour starter dynamically (following OnboardingManager pattern)
  const [simpleTourStarter, setSimpleTourStarter] = useState<any>(null)
  
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/libs/onboarding/simple-tour-starter').then(module => {
      setSimpleTourStarter(module)
    })
  }, [])

  /**
   * Replay a tour regardless of completion status
   * FIXED: Following official Driver.js patterns for manual tour triggering
   * @param tourId - The ID of the tour to replay
   * @param startAtStep - Optional step index to start from (defaults to 0)
   */
  const replayTour = useCallback(async (tourId: string, startAtStep: number = 0) => {
    if (!simpleTourStarter) {
      console.warn('Simple tour starter not loaded yet')
      throw new Error('Tour system not ready')
    }

    try {
      // Clean up any existing active tour first (official Driver.js best practice)
      if (simpleTourStarter.isTourActive()) {
        console.log(`🔄 Stopping current tour before starting: ${tourId}`)
        simpleTourStarter.destroyActiveTour()
      }

      // Get tour configuration
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        throw new Error(`Tour configuration not found: ${tourId}`)
      }

      console.log(`🚀 Starting manual tour using official driver.js pattern: ${tourId}`)

      // FIXED: Use simplified tour starter following official Driver.js documentation
      // This replaces the complex tourManager.initializeTour() + tourManager.startTour() pattern
      simpleTourStarter.startTourWithValidation(tourConfig, {
        onCompleted: async (completedTourId: string) => {
          console.log(`✅ Manual tour completed: ${completedTourId}`)
          // Note: Don't automatically update completion state for manual replays
          // User might want to replay tours for reference
        },
        onSkipped: async (skippedTourId: string) => {
          console.log(`⏭️ Manual tour skipped: ${skippedTourId}`)
        },
        onDestroyed: (destroyedTourId: string) => {
          console.log(`🧹 Manual tour cleanup completed: ${destroyedTourId}`)
        }
      }, {
        retryAttempts: 2, // Retry if elements not found initially
        skipValidation: false // Always validate for manual tours
      })

      // Update onboarding context state (for tracking active tour)
      await startTour(tourId)
      
      // FIXED: Handle step navigation using official Driver.js API
      if (startAtStep > 0) {
        // Use official driver.js navigation method
        setTimeout(() => {
          if (simpleTourStarter.isTourActive()) {
            console.log(`📍 Navigating to step ${startAtStep}`)
            simpleTourStarter.tourNavigation.moveTo(startAtStep)
          }
        }, 300) // Brief delay to ensure tour is fully started
      }

      console.log(`✅ Manual tour started successfully: ${tourId}`)
    } catch (error) {
      console.error(`❌ Error starting manual tour ${tourId}:`, error)
      throw error
    }
  }, [startTour, simpleTourStarter])

  /**
   * Quick replay - restart current tour from beginning
   */
  const restartCurrentTour = useCallback(async () => {
    if (!activeTour) {
      console.warn('No active tour to restart')
      return
    }
    
    await replayTour(activeTour.tourId, 0)
  }, [activeTour, replayTour])

  /**
   * Continue tour from specific step
   */
  const continueFromStep = useCallback(async (tourId: string, stepIndex: number) => {
    await replayTour(tourId, stepIndex)
  }, [replayTour])

  /**
   * Get page-appropriate tour for current location
   * ADDED: Page-aware tour selection for manual triggering
   */
  const getPageTour = useCallback(async (tourId?: string): Promise<string | null> => {
    try {
      // Import page tour router dynamically
      const { pageTourRouter } = await import('@/libs/onboarding/page-tour-router')
      
      if (tourId) {
        // Validate provided tour ID exists
        const tourConfig = getTourConfig(tourId)
        return tourConfig ? tourId : null
      }
      
      // Get page-appropriate tour if no specific tour requested
      return pageTourRouter.getPageWelcomeTour()
    } catch (error) {
      console.error('Error getting page tour:', error)
      return null
    }
  }, [])

  /**
   * Smart replay - uses page-appropriate tour if none specified
   * ADDED: Page-aware manual tour triggering
   */
  const smartReplayTour = useCallback(async (tourId?: string, startAtStep: number = 0) => {
    const actualTourId = await getPageTour(tourId)
    
    if (!actualTourId) {
      throw new Error(tourId 
        ? `Tour "${tourId}" not found`
        : 'No tour available for current page'
      )
    }
    
    await replayTour(actualTourId, startAtStep)
  }, [replayTour, getPageTour])

  /**
   * Check if a tour can be replayed
   */
  const canReplayTour = useCallback((tourId: string): boolean => {
    const tourConfig = getTourConfig(tourId)
    return !!tourConfig
  }, [])

  return {
    replayTour,
    smartReplayTour, // NEW: Page-aware tour triggering
    restartCurrentTour,
    continueFromStep,
    canReplayTour,
    getPageTour, // NEW: Get appropriate tour for current page
    isActive: simpleTourStarter?.isTourActive() ?? false, // FIXED: Use official Driver.js active check
    currentTour: activeTour?.tourId
  }
}