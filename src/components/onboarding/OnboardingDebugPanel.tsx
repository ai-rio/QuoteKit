"use client"

import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/contexts/onboarding-context'
import { getTourConfig, TOUR_CONFIGS } from '@/libs/onboarding/tour-configs'
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

  // State for minimize/collapse functionality
  const [isMinimized, setIsMinimized] = useState(false)

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

  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMinimized(!isMinimized)
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

  // Individual tour handlers to avoid the function object issue
  const handleStartWelcome = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await startTourById('welcome')
  }

  const handleStartSettings = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await startTourById('settings')
  }

  const handleStartQuoteCreation = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await startTourById('quote-creation')
  }

  const handleStartItemLibrary = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await startTourById('item-library')
  }

  const handleStartProFeatures = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await startTourById('pro-features')
  }

  const handleStartContextualHelp = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await startTourById('contextual-help')
  }

  const startTourById = async (tourId: string) => {
    console.log(`🔧 Debug button clicked: Start ${tourId} Tour`)
    try {
      console.log(`🚀 Manually starting ${tourId} tour...`)
      
      // Check if this is a page-aware tour
      const { getPageAwareTourConfig, canStartTourFromCurrentPage } = await import('@/libs/onboarding/page-aware-tours')
      const pageAwareConfig = getPageAwareTourConfig(tourId)
      
      if (pageAwareConfig) {
        console.log(`🧭 Using page-aware tour system for ${tourId}`)
        
        // Check if tour can start from current page
        const canStart = canStartTourFromCurrentPage(tourId)
        if (!canStart) {
          console.warn(`Cannot start tour ${tourId} from current page`)
          alert(`Cannot start tour from this page. Please try again.`)
          return
        }
        
        // Initialize and start the page-aware tour
        await tourManager.initializeTour(tourId, pageAwareConfig)
        await startTour(tourId)
        await tourManager.startTour()
      } else {
        // Fallback to regular tour system
        const tourConfig = getTourConfig(tourId)
        if (tourConfig) {
          await tourManager.initializeTour(tourId, tourConfig)
          await startTour(tourId)
          await tourManager.startTour()
        }
      }
    } catch (error) {
      console.error(`Error starting ${tourId} tour:`, error)
    }
  }

  const isPhantom = activeTour && !tourManager.isActive()

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] bg-red-500 text-white p-2 rounded shadow-lg text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold">🔧 Debug</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 text-white hover:bg-red-600"
            onClick={handleToggleMinimize}
          >
            ⬆️
          </Button>
        </div>
      </div>
    )
  }

  // Full view
  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-red-500 text-white p-3 rounded shadow-lg text-xs max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold">🔧 Debug Panel ({typeof window !== 'undefined' ? window.location.pathname : 'unknown'})</div>
        <Button
          size="sm"
          variant="ghost"
          className="h-4 w-4 p-0 text-white hover:bg-red-600"
          onClick={handleToggleMinimize}
        >
          ⬇️
        </Button>
      </div>
      
      <div className="space-y-1 mb-3 text-xs">
        <div>Active Tour: {activeTour ? String(activeTour) : 'None'}</div>
        <div>Is Phantom: {isPhantom ? 'Yes' : 'No'}</div>
        <div>Progress Keys: {Object.keys(progress || {}).length}</div>
        <div>Completed: {progress?.completedTours?.join(', ') || 'None'}</div>
        <div>Skipped: {progress?.skippedTours?.join(', ') || 'None'}</div>
      </div>

      <div className="space-y-1 mb-3">
        <div className="font-semibold text-xs mb-1">🎯 Tour Controls:</div>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleStartWelcome}
        >
          👋 Welcome Tour
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleStartSettings}
        >
          ⚙️ Settings Tour
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleStartQuoteCreation}
        >
          📝 Quote Creation
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleStartItemLibrary}
        >
          📚 Item Library
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleStartProFeatures}
        >
          ⭐ Pro Features
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-6 bg-white text-black hover:bg-gray-100"
          onClick={handleStartContextualHelp}
        >
          🆘 Contextual Help
        </Button>
      </div>

      <div className="space-y-1">
        <div className="font-semibold text-xs mb-1">🔧 Debug Actions:</div>
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
      </div>
    </div>
  )
}
