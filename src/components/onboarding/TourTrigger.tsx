"use client"

import React, { useCallback, useEffect, useRef } from 'react'

import { useOnboarding } from '@/contexts/onboarding-context'
import { getTourConfig } from '@/libs/onboarding/tour-configs'
import { tourManager } from '@/libs/onboarding/tour-manager'
import { cn } from '@/utils/cn'

interface TourTriggerProps {
  tourId: string
  trigger?: 'click' | 'hover' | 'focus' | 'auto' | 'manual'
  delay?: number
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  onTourStart?: () => void
  onTourComplete?: () => void
  onTourSkip?: () => void
}

export function TourTrigger({
  tourId,
  trigger = 'click',
  delay = 0,
  children,
  className,
  disabled = false,
  onTourStart,
  onTourComplete,
  onTourSkip
}: TourTriggerProps) {
  const { 
    startTour, 
    shouldShowTour,
    activeTour,
    getTourProgress
  } = useOnboarding()
  
  // Adapt context properties to component expectations
  const isTourCompleted = (tourId: string) => {
    const progress = getTourProgress(tourId)
    return progress?.completed || false
  }
  const isActive = !!activeTour
  const currentTour = activeTour?.tourId
  
  const triggerRef = useRef<HTMLDivElement>(null)
  const hasTriggered = useRef(false)

  const handleTrigger = useCallback(async () => {
    if (disabled || isTourCompleted(tourId) || !shouldShowTour(tourId)) {
      return
    }

    // Prevent multiple triggers
    if (hasTriggered.current || (isActive && currentTour === tourId)) {
      return
    }

    hasTriggered.current = true

    try {
      // Get tour configuration
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        console.error(`Tour configuration not found for: ${tourId}`)
        return
      }

      // Initialize and start tour
      await tourManager.initializeTour(tourId, tourConfig)
      
      // Set up event handlers
      tourManager.onTourComplete((completedTourId) => {
        if (completedTourId === tourId) {
          onTourComplete?.()
          hasTriggered.current = false
        }
      })

      tourManager.onTourSkip((skippedTourId) => {
        if (skippedTourId === tourId) {
          onTourSkip?.()
          hasTriggered.current = false
        }
      })

      // Start the tour with delay if specified
      if (delay > 0) {
        setTimeout(async () => {
          await startTour(tourId)
          await tourManager.startTour()
          onTourStart?.()
        }, delay)
      } else {
        await startTour(tourId)
        await tourManager.startTour()
        onTourStart?.()
      }
    } catch (error) {
      console.error(`Error starting tour ${tourId}:`, error)
      hasTriggered.current = false
    }
  }, [
    tourId, 
    delay, 
    disabled, 
    startTour, 
    isTourCompleted, 
    shouldShowTour,
    isActive,
    currentTour,
    onTourStart, 
    onTourComplete, 
    onTourSkip
  ])

  // Auto trigger effect
  useEffect(() => {
    if (trigger === 'auto' && shouldShowTour(tourId) && !hasTriggered.current) {
      handleTrigger()
    }
  }, [trigger, tourId, shouldShowTour, handleTrigger])

  // Click handler
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (trigger === 'click') {
      event.preventDefault()
      handleTrigger()
    }
  }, [trigger, handleTrigger])

  // Hover handler
  const handleMouseEnter = useCallback(() => {
    if (trigger === 'hover') {
      handleTrigger()
    }
  }, [trigger, handleTrigger])

  // Focus handler
  const handleFocus = useCallback(() => {
    if (trigger === 'focus') {
      handleTrigger()
    }
  }, [trigger, handleTrigger])

  // Manual trigger (expose via ref)
  useEffect(() => {
    if (triggerRef.current) {
      (triggerRef.current as any).__triggerTour = handleTrigger
    }
  }, [handleTrigger])

  // Don't render anything for auto trigger without children
  if (trigger === 'auto' && !children) {
    return null
  }

  // Don't render if tour is completed and should be hidden
  if (isTourCompleted(tourId) && !children) {
    return null
  }

  return (
    <div
      ref={triggerRef}
      className={cn(
        trigger === 'click' && 'cursor-pointer',
        trigger === 'hover' && 'hover:opacity-75 transition-opacity',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      tabIndex={trigger === 'focus' ? 0 : undefined}
      role={trigger === 'click' ? 'button' : undefined}
      aria-label={trigger === 'click' ? `Start ${tourId} tour` : undefined}
    >
      {children}
    </div>
  )
}

// Hook to manually trigger tours
export function useTourTrigger() {
  const { startTour, activeTour } = useOnboarding()
  const isActive = !!activeTour
  const currentTour = activeTour?.tourId

  const triggerTour = useCallback(async (tourId: string) => {
    if (isActive && currentTour === tourId) {
      return // Tour already active
    }

    try {
      const tourConfig = getTourConfig(tourId)
      if (!tourConfig) {
        throw new Error(`Tour configuration not found for: ${tourId}`)
      }

      await tourManager.initializeTour(tourId, tourConfig)
      await startTour(tourId)
      await tourManager.startTour()
    } catch (error) {
      console.error(`Error triggering tour ${tourId}:`, error)
      throw error
    }
  }, [startTour, isActive, currentTour])

  return { triggerTour }
}