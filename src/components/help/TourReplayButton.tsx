"use client"

import { Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useTourReplay } from '@/hooks/use-tour-replay'

interface TourReplayButtonProps {
  tourId: string
  tourName?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  className?: string
  children?: React.ReactNode
}

export function TourReplayButton({
  tourId,
  tourName,
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  className = '',
  children
}: TourReplayButtonProps) {
  const [isStarting, setIsStarting] = useState(false)
  const { replayTour, canReplayTour, isActive, currentTour } = useTourReplay()

  const handleReplay = async () => {
    if (isActive || !canReplayTour(tourId)) return
    
    setIsStarting(true)
    try {
      console.log(`🎯 TourReplayButton: Starting tour ${tourId}`)
      
      // CRITICAL FIX: Add small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await replayTour(tourId)
      
      console.log(`✅ TourReplayButton: Tour ${tourId} started successfully`)
    } catch (error) {
      console.error('Failed to replay tour:', error)
      // Show user-friendly error message
      alert(`Failed to start tour: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsStarting(false)
    }
  }

  const isCurrentTour = currentTour === tourId
  const disabled = (isActive && !isCurrentTour) || !canReplayTour(tourId) || isStarting

  const getButtonContent = () => {
    if (children) return children

    const iconElement = showIcon ? (
      isCurrentTour ? (
        <RotateCcw className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )
    ) : null

    const text = isCurrentTour 
      ? 'Restart Tour' 
      : tourName 
        ? `Replay ${tourName}` 
        : 'Replay Tour'

    return (
      <>
        {iconElement}
        <span className={showIcon ? 'ml-2' : ''}>{text}</span>
      </>
    )
  }

  const getVariantStyles = () => {
    if (isCurrentTour) {
      return 'text-forest-green border-forest-green/60 bg-forest-green/10 hover:bg-forest-green hover:text-white'
    }
    
    switch (variant) {
      case 'outline':
        return 'text-charcoal/70 border-stone-gray hover:bg-stone-gray/20'
      case 'ghost':
        return 'text-charcoal/70 hover:bg-stone-gray/20 hover:text-charcoal'
      case 'link':
        return 'text-forest-green hover:text-forest-green/80 underline-offset-4 hover:underline'
      default:
        return ''
    }
  }

  return (
    <Button
      variant={isCurrentTour ? 'outline' : variant}
      size={size}
      onClick={handleReplay}
      disabled={disabled}
      className={`
        transition-all duration-200 font-medium
        ${getVariantStyles()}
        ${isStarting ? 'animate-pulse' : ''}
        ${className}
      `}
      title={
        disabled 
          ? isActive 
            ? 'Another tour is currently active' 
            : 'Tour not available'
          : `${isCurrentTour ? 'Restart' : 'Replay'} the ${tourName || tourId} tour`
      }
    >
      {getButtonContent()}
    </Button>
  )
}

// Preset configurations for common use cases
export const QuoteTourButton = () => (
  <TourReplayButton 
    tourId="enhanced-quote-creation" 
    tourName="Quote Creation"
    variant="ghost"
    showIcon={true}
    className="text-sm"
  />
)

export const ItemLibraryTourButton = () => (
  <TourReplayButton 
    tourId="enhanced-item-library" 
    tourName="Item Library"
    variant="ghost"
    showIcon={true}
    className="text-sm"
  />
)

export const SettingsTourButton = () => (
  <TourReplayButton 
    tourId="settings" 
    tourName="Settings"
    variant="ghost"
    showIcon={true}
    className="text-sm"
  />
)
