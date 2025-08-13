"use client"

import { useCallback } from 'react'

import { useOnboarding } from '@/contexts/onboarding-context'
import { getTourConfig } from '@/libs/onboarding/tour-configs'
import { tourManager } from '@/libs/onboarding/tour-manager'

/**
 * Hook for replaying tours, bypassing completion restrictions
 * Following Driver.js best practices for manual tour control
 */
export function useTourReplay() {
  const { startTour, activeTour } = useOnboarding()

  /**
   * Replay a tour regardless of completion status
   * Following Driver.js best practices for manual tour triggering
   * @param tourId - The ID of the tour to replay
   * @param startAtStep - Optional step index to start from (defaults to 0)
   */
  const replayTour = useCallback(async (tourId: string, startAtStep: number = 0) => {
    try {
      // Check if there's already an active tour and destroy it
      if (activeTour && tourManager.isActive()) {
        console.log(`🔄 Stopping current tour: ${activeTour.tourId}`)
        await tourManager.destroyTour()
      }

      // Get tour configuration
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        throw new Error(`Tour configuration not found: ${tourId}`)
      }

      console.log(`🚀 Starting tour replay: ${tourId} (starting at step ${startAtStep})`)

      // CRITICAL FIX: Initialize tour manager first
      await tourManager.initializeTour(tourId, tourConfig)
      
      // CRITICAL FIX: Start the Driver.js tour immediately after initialization
      // This ensures the tour actually starts and becomes visible
      await tourManager.startTour()
      
      // Update onboarding context state after successful start
      await startTour(tourId)
      
      // CRITICAL FIX: Handle step navigation after tour is running
      if (startAtStep > 0) {
        // Use Driver.js moveTo method for precise step navigation
        setTimeout(() => {
          const driverInstance = tourManager.getDriverInstance()
          if (driverInstance && driverInstance.isActive()) {
            driverInstance.moveTo(startAtStep)
          }
        }, 300) // Increased delay to ensure tour is fully initialized
      }

      console.log(`✅ Tour replay started successfully: ${tourId}`)
    } catch (error) {
      console.error(`❌ Error replaying tour ${tourId}:`, error)
      throw error
    }
  }, [startTour, activeTour])

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
   * Check if a tour can be replayed
   */
  const canReplayTour = useCallback((tourId: string): boolean => {
    const tourConfig = getTourConfig(tourId)
    return !!tourConfig
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