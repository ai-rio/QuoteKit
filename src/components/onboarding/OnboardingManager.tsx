"use client"

import React, { useCallback, useEffect } from 'react'

import { useOnboarding } from '@/contexts/onboarding-context'
import { useUser } from '@/hooks/use-user'
import { useUserTier } from '@/hooks/use-user-tier'
import { getTourConfig } from '@/libs/onboarding/tour-configs'
// Removed complex TourManager dependencies - using official driver.js patterns directly
// import { enhancedTourManager } from '@/libs/onboarding/enhanced-tour-manager'
// import { tourManager } from '@/libs/onboarding/tour-manager'
// import { onboardingDebug } from '@/utils/onboarding-debug'

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

  // Import the simplified tour starter following official Driver.js patterns
  const [simpleTourStarter, setSimpleTourStarter] = React.useState<any>(null)
  
  React.useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/libs/onboarding/simple-tour-starter').then(module => {
      setSimpleTourStarter(module)
    })
  }, [])

  // Debounce mechanism to prevent cascading events (simplified)
  const tourStartTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  
  // Adapt context properties to component expectations  
  const currentTour = activeTour?.tourId
  const isActive = !!activeTour
  const isTourCompleted = (tourId: string) => {
    const progress = getTourProgress(tourId)
    return progress?.completed || false
  }
  
  const { data: user } = useUser()
  const { tier: userTier, isLoading: tierLoading, canAccess } = useUserTier()

  // Simplified tour completion handler using official Driver.js callbacks
  const handleTourComplete = useCallback(async (tourId: string) => {
    if (debugMode) {
      console.log(`✅ Tour completed (official driver.js callback): ${tourId}`)
    }
    
    await completeTour(tourId)
    
    // Note: Removed complex cascading tour logic as per official Driver.js best practices
    // Each tour should be started independently based on user navigation
    
  }, [completeTour, debugMode])

  // Simplified tour skip handler using official Driver.js callbacks
  const handleTourSkip = useCallback(async (tourId: string) => {
    if (debugMode) {
      console.log(`⏭️ Tour skipped (official driver.js callback): ${tourId}`)
    }
    
    try {
      await skipTour(tourId)
    } catch (error) {
      console.error(`Error skipping tour ${tourId}:`, error)
    }
  }, [skipTour, debugMode])

  // Simplified tour starter following official Driver.js documentation
  const startSimpleTour = useCallback((tourId: string) => {
    if (!simpleTourStarter) {
      console.warn('Simple tour starter not loaded yet')
      return
    }

    try {
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        console.error(`Tour configuration not found: ${tourId}`)
        return
      }

      if (debugMode) {
        console.log(`🚀 Starting tour using official driver.js pattern: ${tourId}`)
      }

      // Use the simplified tour starter with official Driver.js patterns
      simpleTourStarter.startTourWithValidation(tourConfig, {
        onCompleted: handleTourComplete,
        onSkipped: handleTourSkip,
        onDestroyed: (completedTourId: string) => {
          if (debugMode) {
            console.log(`🧹 Tour cleanup completed: ${completedTourId}`)
          }
        }
      }, {
        retryAttempts: 2 // Retry if elements not found initially
      })
      
    } catch (error) {
      console.error(`Error starting tour ${tourId}:`, error)
    }
  }, [simpleTourStarter, handleTourComplete, handleTourSkip, debugMode])

  // Auto-start page-appropriate tours using simplified logic
  useEffect(() => {
    if (debugMode) {
      console.log('🎯 OnboardingManager: Auto-start check (simplified approach)')
      console.log('  autoStartWelcome:', autoStartWelcome)
      console.log('  user?.id:', user?.id)
      console.log('  tierLoading:', tierLoading)
      console.log('  userTier:', userTier)
      console.log('  isActive:', isActive)
      console.log('  activeTour:', activeTour)
      console.log('  currentTour:', currentTour)
      console.log('  window?.location?.pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')
    }
    
    // Import page tour router dynamically to avoid SSR issues
    if (typeof window !== 'undefined' && simpleTourStarter) {
      import('@/libs/onboarding/page-tour-router').then(({ pageTourRouter }) => {
        const recommendedTour = pageTourRouter.getPageWelcomeTour()
        const isAppRoute = pageTourRouter.isAppRoute()
        
        if (debugMode) {
          console.log('🗺️ PageTourRouter: Current page analysis:')
          console.log('  isAppRoute:', isAppRoute)
          console.log('  recommendedTour:', recommendedTour)
          console.log('  canStartTour:', recommendedTour ? pageTourRouter.canStartTour(recommendedTour) : false)
          console.log('  availableTours:', pageTourRouter.getCurrentPageTours())
        }
        
        // Validate that the recommended tour actually exists
        let validTour = recommendedTour
        if (recommendedTour) {
          const tourConfig = getTourConfig(recommendedTour)
          if (!tourConfig) {
            console.warn(`⚠️ Recommended tour "${recommendedTour}" not found in TOUR_CONFIGS, falling back to welcome`)
            validTour = 'welcome'
          }
        }
        
        if (
          autoStartWelcome &&
          user?.id &&
          !tierLoading &&
          !isActive &&
          isAppRoute &&
          validTour &&
          shouldShowTour(validTour) &&
          pageTourRouter.canStartTour(validTour)
        ) {
          // FIXED LOGIC: Check if this specific tour has been completed
          // Following official Driver.js best practices - each tour is independent
          const isSpecificTourCompleted = isTourCompleted(validTour)
          
          if (debugMode) {
            console.log('🎯 OnboardingManager: Tour-specific checks (following official driver.js patterns):')
            console.log('  validTour:', validTour)
            console.log('  isSpecificTourCompleted:', isSpecificTourCompleted)
          }
          
          // Start tour if this specific tour hasn't been completed
          // This follows the official Driver.js documentation pattern:
          // - Each tour is independent
          // - Tours can be started based on page context
          // - No complex inter-tour dependencies
          if (!isSpecificTourCompleted) {
            if (debugMode) {
              console.log(`🚀 OnboardingManager: Starting ${validTour} tour using official driver.js pattern`)
            }
            
            // Clear any existing timeout to prevent double starts
            if (tourStartTimeoutRef.current) {
              clearTimeout(tourStartTimeoutRef.current)
            }
            
            // Start tour with delay to ensure page is fully loaded
            // This follows official Driver.js best practice for SPA navigation
            tourStartTimeoutRef.current = setTimeout(() => {
              if (debugMode) {
                console.log(`🎬 OnboardingManager: Executing ${validTour} tour with official driver.js`)
              }
              
              try {
                startSimpleTour(validTour)
              } catch (error) {
                console.error(`Error starting ${validTour} tour:`, error)
              }
            }, 1500) // Reduced delay - official driver.js handles timing better

            return () => {
              if (tourStartTimeoutRef.current) {
                clearTimeout(tourStartTimeoutRef.current)
              }
            }
          } else if (debugMode) {
            console.log('❌ OnboardingManager: Specific tour already completed, not starting')
          }
        } else if (debugMode) {
          console.log('❌ OnboardingManager: Conditions not met for auto-start')
          console.log('  Missing conditions:', {
            autoStartWelcome,
            hasUserId: !!user?.id,
            tierLoaded: !tierLoading,
            notActive: !isActive,
            isAppRoute,
            hasRecommendedTour: !!validTour,
            shouldShow: validTour ? shouldShowTour(validTour) : false,
            canStart: validTour ? pageTourRouter.canStartTour(validTour) : false
          })
        }
      }).catch(error => {
        console.error('Error loading page tour router:', error)
      })
    }
  }, [
    autoStartWelcome,
    user?.id,
    tierLoading,
    userTier,
    shouldShowTour,
    isActive,
    isTourCompleted,
    startSimpleTour,
    simpleTourStarter
  ])

  // Debug logging for active tours using official Driver.js state methods
  useEffect(() => {
    if (debugMode && activeTour?.tourId && simpleTourStarter) {
      console.log(`🔍 Active tour debug info:`)
      console.log(`  Tour ID: ${activeTour?.tourId}`)
      console.log(`  Simple tour starter active:`, simpleTourStarter.isTourActive())
      
      const tourState = simpleTourStarter.getCurrentTourState()
      if (tourState) {
        console.log(`  Current step: ${tourState.currentStep}/${tourState.totalSteps}`)
        console.log(`  Navigation: hasNext=${tourState.hasNext}, hasPrev=${tourState.hasPrevious}`)
        console.log(`  Position: isFirst=${tourState.isFirst}, isLast=${tourState.isLast}`)
      }
    }
  }, [debugMode, activeTour?.tourId, simpleTourStarter])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tourStartTimeoutRef.current) {
        clearTimeout(tourStartTimeoutRef.current)
      }
      
      // Clean up any active tours using official Driver.js method
      if (simpleTourStarter?.isTourActive()) {
        if (debugMode) {
          console.log('🧹 OnboardingManager unmounting - cleaning up active tour')
        }
        simpleTourStarter.destroyActiveTour()
      }
    }
  }, [simpleTourStarter, debugMode])

  // This component doesn't render anything visible - it's a controller
  // Following React best practices for manager components
  return null
}

// Hook for manual tour management using official driver.js patterns
export function useOnboardingManager() {
  const { startTour, completeTour, skipTour, resetProgress } = useOnboarding()

  const startSpecificTour = useCallback(async (tourId: string) => {
    try {
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        throw new Error(`Tour configuration not found: ${tourId}`)
      }

      // Use simplified tour starter following official driver.js patterns
      const { startTourWithValidation } = await import('@/libs/onboarding/simple-tour-starter')
      
      await startTour(tourId)
      startTourWithValidation(tourConfig, {
        onCompleted: () => completeTour(tourId),
        onSkipped: () => skipTour(tourId)
      })
    } catch (error) {
      console.error(`Error starting tour ${tourId}:`, error)
      throw error
    }
  }, [startTour, completeTour, skipTour])

  const stopCurrentTour = useCallback(async () => {
    try {
      // Use official driver.js cleanup method
      const { destroyActiveTour } = await import('@/libs/onboarding/simple-tour-starter')
      destroyActiveTour()
    } catch (error) {
      console.error('Error stopping tour:', error)
      throw error
    }
  }, [])

  const completeCurrentTour = useCallback(async () => {
    try {
      // Use official driver.js navigation to complete
      const { tourNavigation } = await import('@/libs/onboarding/simple-tour-starter')
      // Move to last step to trigger completion
      while (tourNavigation.moveNext()) {
        // Continue until tour completes
      }
    } catch (error) {
      console.error('Error completing tour:', error)
      throw error
    }
  }, [])

  const resetAllProgress = useCallback(async () => {
    try {
      // Clean up active tour and reset progress
      const { destroyActiveTour } = await import('@/libs/onboarding/simple-tour-starter')
      destroyActiveTour()
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