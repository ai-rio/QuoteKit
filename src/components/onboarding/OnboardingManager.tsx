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
    exitTour,
    activeTour,
    shouldShowTour,
    getTourProgress,
    clearPhantomActiveTour
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
          // FIXED: Clear activeTour state when tour is destroyed (close button pressed)
          // This ensures the onboarding context knows the tour is no longer active
          try {
            if (activeTour?.tourId === completedTourId) {
              console.log(`🎯 OnboardingManager: Tour ${completedTourId} was closed/destroyed - clearing context state`)
              // Call exitTour to properly clear the onboarding context state
              exitTour().catch(error => {
                console.error(`Error calling exitTour for ${completedTourId}:`, error)
                // Fallback: Force clear the state if exitTour fails
                console.log(`🔧 OnboardingManager: Attempting fallback state clear via clearPhantomActiveTour`)
                try {
                  // Use the clearPhantomActiveTour method as a fallback
                  clearPhantomActiveTour?.()
                } catch (fallbackError) {
                  console.error(`Error in fallback state clear:`, fallbackError)
                }
              })
            } else if (debugMode) {
              console.log(`🔍 OnboardingManager: Tour ${completedTourId} destroyed but not current active tour (activeTour: ${activeTour?.tourId})`)
            }
          } catch (error) {
            console.error(`Error clearing tour state for ${completedTourId}:`, error)
          }
        }
      }, {
        retryAttempts: 2 // Retry if elements not found initially
      })
      
    } catch (error) {
      console.error(`Error starting tour ${tourId}:`, error)
    }
  }, [simpleTourStarter, handleTourComplete, handleTourSkip, debugMode, activeTour, exitTour, clearPhantomActiveTour])

  // Auto-start page-appropriate tours using first-time visit logic
  useEffect(() => {
    if (debugMode) {
      console.log('🎯 OnboardingManager: Auto-start check (with first-time visit logic)')
      console.log('  autoStartWelcome:', autoStartWelcome)
      console.log('  user?.id:', user?.id)
      console.log('  tierLoading:', tierLoading)
      console.log('  userTier:', userTier)
      console.log('  isActive:', isActive)
      console.log('  activeTour:', activeTour)
      console.log('  currentTour:', currentTour)
      console.log('  window?.location?.pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')
    }
    
    // Import page tour router and first-time visit tracker dynamically to avoid SSR issues
    if (typeof window !== 'undefined' && simpleTourStarter) {
      import('@/libs/onboarding/page-tour-router').then(({ pageTourRouter, handleTourAutoload }) => {
        // Basic checks for user authentication and readiness
        if (
          autoStartWelcome &&
          user?.id &&
          !tierLoading &&
          !isActive
        ) {
          const currentPath = window.location.pathname
          
          if (debugMode) {
            console.log('🎯 OnboardingManager: Checking first-time autoload for path:', currentPath)
          }
          
          // Use the new first-time autoload handler
          try {
            handleTourAutoload(currentPath, async (tourId: string) => {
              if (debugMode) {
                console.log('🚀 OnboardingManager: First-time autoload triggered for tour:', tourId)
              }
              
              // Validate the tour exists and user can access it
              const tourConfig = getTourConfig(tourId)
              if (!tourConfig) {
                console.error(`First-time autoload failed: Tour "${tourId}" not found in TOUR_CONFIGS`)
                return
              }
              
              // Check if user should see this tour (tier-based filtering, etc.)
              if (!shouldShowTour(tourId)) {
                if (debugMode) {
                  console.log('🚫 OnboardingManager: First-time autoload blocked - user should not see tour:', tourId)
                }
                return
              }
              
              // Start the context tour first (this updates the state)
              await startTour(tourId)
              
              // Then start the visual tour
              setTimeout(() => {
                startSimpleTour(tourId)
              }, 500) // Small delay to ensure context is updated
            })
          } catch (error) {
            console.error('Error in first-time autoload:', error)
            
            // Fallback to original logic if first-time tracking fails
            if (debugMode) {
              console.log('🔄 OnboardingManager: Falling back to original autoload logic')
            }
            
            const recommendedTour = pageTourRouter.getPageWelcomeTour()
            const isAppRoute = pageTourRouter.isAppRoute()
            
            if (
              isAppRoute &&
              recommendedTour &&
              shouldShowTour(recommendedTour) &&
              pageTourRouter.canStartTour(recommendedTour)
            ) {
              const isSpecificTourCompleted = isTourCompleted(recommendedTour)
              
              if (!isSpecificTourCompleted) {
                if (debugMode) {
                  console.log(`🚀 OnboardingManager: Fallback starting ${recommendedTour} tour`)
                }
                
                // Clear any existing timeout to prevent double starts
                if (tourStartTimeoutRef.current) {
                  clearTimeout(tourStartTimeoutRef.current)
                }
                
                tourStartTimeoutRef.current = setTimeout(() => {
                  try {
                    startSimpleTour(recommendedTour)
                  } catch (error) {
                    console.error(`Error starting fallback ${recommendedTour} tour:`, error)
                  }
                }, 1500)

                return () => {
                  if (tourStartTimeoutRef.current) {
                    clearTimeout(tourStartTimeoutRef.current)
                  }
                }
              }
            }
          }
        } else if (debugMode) {
          console.log('❌ OnboardingManager: Conditions not met for first-time autoload')
          console.log('  Missing conditions:', {
            autoStartWelcome,
            hasUserId: !!user?.id,
            tierLoaded: !tierLoading,
            notActive: !isActive
          })
        }
      }).catch(error => {
        console.error('Error loading page tour router or first-time tracker:', error)
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

  // Watch for activeTour changes and start visual tour (for dropdown/manual starts)
  useEffect(() => {
    if (activeTour?.tourId && simpleTourStarter && !simpleTourStarter.isTourActive()) {
      if (debugMode) {
        console.log(`🎯 OnboardingManager: Detected activeTour change, starting visual tour: ${activeTour.tourId}`)
      }
      
      // Small delay to ensure UI is ready
      setTimeout(() => {
        startSimpleTour(activeTour.tourId)
      }, 300)
    }
  }, [activeTour?.tourId, simpleTourStarter, startSimpleTour, debugMode])

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