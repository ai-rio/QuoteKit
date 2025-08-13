"use client"

import { useCallback } from 'react'

import { useOnboarding } from '@/contexts/onboarding-context'
import { getTourConfig } from '@/libs/onboarding/tour-configs'
import { tourManager } from '@/libs/onboarding/tour-manager'

/**
 * Hook for manually controlling onboarding tours
 * Provides easy access to tour management functions
 */
export function useOnboardingTours() {
  const { 
    startTour, 
    completeTour, 
    skipTour, 
    resetProgress,
    shouldShowTour,
    getTourProgress,
    activeTour
  } = useOnboarding()
  
  // Adapt context properties to hook expectations
  const isTourCompleted = (tourId: string) => {
    const progress = getTourProgress(tourId)
    return progress?.completed || false
  }
  const isActive = !!activeTour
  const currentTour = activeTour?.tourId
  const currentStep = activeTour?.currentStep || 0

  // Start a specific tour
  const triggerTour = useCallback(async (tourId: string) => {
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

  // Stop current tour
  const stopTour = useCallback(async () => {
    try {
      await tourManager.destroyTour()
    } catch (error) {
      console.error('Error stopping tour:', error)
      throw error
    }
  }, [])

  // Complete current tour
  const finishTour = useCallback(async () => {
    try {
      await tourManager.completeTour()
    } catch (error) {
      console.error('Error completing tour:', error)
      throw error
    }
  }, [])

  // Skip current tour
  const dismissTour = useCallback(async () => {
    try {
      if (currentTour) {
        await skipTour(currentTour)
      }
      await tourManager.destroyTour()
    } catch (error) {
      console.error('Error skipping tour:', error)
      throw error
    }
  }, [currentTour, skipTour])

  // Reset all onboarding progress
  const resetAllProgress = useCallback(async () => {
    try {
      await tourManager.destroyTour()
      await resetProgress()
    } catch (error) {
      console.error('Error resetting progress:', error)
      throw error
    }
  }, [resetProgress])

  // Move to next step in current tour
  const nextStep = useCallback(() => {
    if (tourManager.isActive() && tourManager.hasNextStep()) {
      tourManager.moveNext()
    }
  }, [])

  // Move to previous step in current tour
  const previousStep = useCallback(() => {
    if (tourManager.isActive() && tourManager.hasPreviousStep()) {
      tourManager.movePrevious()
    }
  }, [])

  // Move to specific step in current tour
  const goToStep = useCallback((stepIndex: number) => {
    if (tourManager.isActive()) {
      tourManager.moveTo(stepIndex)
    }
  }, [])

  // Get tour completion status for multiple tours
  const getCompletionStatus = useCallback((tourIds: string[]) => {
    return tourIds.map(tourId => ({
      tourId,
      completed: isTourCompleted(tourId),
      progress: getTourProgress(tourId)
    }))
  }, [isTourCompleted, getTourProgress])

  return {
    // Tour control
    triggerTour,
    stopTour,
    finishTour,
    dismissTour,
    resetAllProgress,
    
    // Step navigation
    nextStep,
    previousStep,
    goToStep,
    
    // Status queries
    isTourCompleted,
    shouldShowTour,
    getTourProgress,
    getCompletionStatus,
    
    // Current state
    isActive,
    currentTour,
    currentStep,
    
    // Tour manager access (for advanced use)
    tourManager
  }
}