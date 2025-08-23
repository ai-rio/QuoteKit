"use client"

import { useCallback } from 'react'

import { useOnboarding } from '@/contexts/onboarding-context'
import { 
  destroyActiveTour, 
  startTourWithValidation,
  tourNavigation
} from '@/libs/onboarding/simple-tour-starter'
import { getTourConfig } from '@/libs/onboarding/tour-configs'

/**
 * Hook for replaying tours, bypassing completion restrictions.
 * Now uses the simplified, official Driver.js pattern.
 */
export function useTourReplay() {
  const { activeTour, completeTour } = useOnboarding()

  /**
   * Replay a tour using the new simple-tour-starter.
   * @param tourId - The ID of the tour to replay.
   * @param startAtStep - Optional step index to start from (defaults to 0).
   */
  const replayTour = useCallback(async (tourId: string, startAtStep: number = 0) => {
    try {
      console.log(`🚀 Replaying tour with simple starter: ${tourId}`)

      // Clean up any existing active tour first
      if (activeTour) {
        console.log(`🔄 Stopping current tour (${activeTour.tourId}) before starting: ${tourId}`)
        destroyActiveTour()
        // Add a small delay to ensure cleanup completes before starting new tour
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get the tour configuration
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        throw new Error(`Tour configuration not found: ${tourId}`)
      }

      // Define callbacks to integrate with OnboardingContext
      const callbacks = {
        onDestroyed: (id: string) => {
          console.log(`Tour ${id} destroyed. Marking as complete.`);
          completeTour(id); 
        }
      };

      // Start the tour using the new validated method
      // It will automatically validate if elements exist on the current page.
      startTourWithValidation(tourConfig, callbacks);

      // Handle starting at a specific step
      if (startAtStep > 0) {
        // Brief delay to ensure tour is fully started before moving step
        setTimeout(() => {
          console.log(`📍 Navigating to step ${startAtStep}`)
          tourNavigation.moveTo(startAtStep)
        }, 300)
      }

      console.log(`✅ Tour replay initiated successfully: ${tourId}`)
    } catch (error) {
      console.error(`❌ Error replaying tour ${tourId}:`, error)
      alert(`Failed to start the tour. Please check the console for details.`);
    }
  }, [activeTour, completeTour])

  /**
   * Quick replay - restart current tour from beginning.
   */
  const restartCurrentTour = useCallback(async () => {
    if (!activeTour) {
      console.warn('No active tour to restart')
      return
    }
    
    await replayTour(activeTour.tourId, 0)
  }, [activeTour, replayTour])

  /**
   * Continue tour from specific step.
   */
  const continueFromStep = useCallback(async (tourId: string, stepIndex: number) => {
    await replayTour(tourId, stepIndex)
  }, [replayTour])

  /**
   * Check if a tour can be replayed.
   * The new `startTourWithValidation` handles element existence, so this check can be simplified.
   */
  const canReplayTour = useCallback((tourId: string): boolean => {
    return !!getTourConfig(tourId); // Simply check if the tour config exists.
  }, [])

  return {
    replayTour,
    restartCurrentTour,
    continueFromStep,
    canReplayTour,
    isActive: !!activeTour,
    currentTour: activeTour?.tourId
  }
}
