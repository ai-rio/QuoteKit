"use client"

import React, { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/contexts/onboarding-context'
import { getTourConfig } from '@/libs/onboarding/tour-configs'
import { tourManager } from '@/libs/onboarding/tour-manager'
import { fixDebugPanelButtons } from '@/utils/driver-button-fix'

// Debug panel for testing onboarding - only show in development
export function OnboardingDebugPanel() {
  const { 
    progress, 
    activeTour, 
    clearPhantomActiveTour, 
    resetProgress,
    startTour
  } = useOnboarding()

  // Fix button interactions on mount and when content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fixDebugPanelButtons()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleClearPhantom = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔧 Debug button clicked: Clear Phantom Tour')
    try {
      console.log('🔧 Manually clearing phantom active tour...')
      await clearPhantomActiveTour()
      window.location.reload()
    } catch (error) {
      console.error('Error clearing phantom tour:', error)
    }
  }

  const handleResetProgress = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔧 Debug button clicked: Reset All Progress')
    try {
      console.log('🔄 Resetting all onboarding progress...')
      await resetProgress()
      window.location.reload()
    } catch (error) {
      console.error('Error resetting progress:', error)
    }
  }

  const handleClearWelcomeSkipped = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔧 Debug button clicked: Un-skip Welcome Tour')
    try {
      console.log('🎯 Clearing welcome tour skipped status...')
      const currentProgress = JSON.parse(localStorage.getItem('onboarding-progress') || '{}')
      if (currentProgress.skippedTours) {
        currentProgress.skippedTours = currentProgress.skippedTours.filter((id: string) => id !== 'welcome')
        localStorage.setItem('onboarding-progress', JSON.stringify(currentProgress))
        console.log('✅ Welcome tour removed from skipped list')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error clearing welcome skipped:', error)
    }
  }

  const handleManualStart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔧 Debug button clicked: Start Welcome Tour')
    try {
      console.log('🚀 Manually starting welcome tour...')
      const tourConfig = getTourConfig('welcome')
      if (tourConfig) {
        await tourManager.initializeTour('welcome', tourConfig)
        await startTour('welcome')
        await tourManager.startTour()
      }
    } catch (error) {
      console.error('Error starting manual tour:', error)
    }
  }

  const isPhantom = activeTour && !tourManager.isActive()

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-red-500 text-white p-2 rounded shadow-lg text-xs">
      <div className="font-bold mb-2">🔧 Onboarding Debug Panel</div>
      
      <div className="space-y-1 mb-2">
        <div>Active Tour: {activeTour ? String(activeTour) : 'None'}</div>
        <div>Is Phantom: {isPhantom ? 'Yes' : 'No'}</div>
        <div>Progress Keys: {Object.keys(progress || {}).length}</div>
      </div>

      <div className="space-y-1">
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleClearPhantom}
        >
          Clear Phantom Tour
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleResetProgress}
        >
          Reset All Progress
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleClearWelcomeSkipped}
        >
          Un-skip Welcome
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleManualStart}
        >
          Start Welcome Tour
        </Button>
      </div>
    </div>
  )
}
