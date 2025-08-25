'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { startTourWithValidation } from '@/libs/onboarding/simple-tour-starter'
import { getTourConfig } from '@/libs/onboarding/tour-configs'

/**
 * Debug component to test tour functionality independently
 * This helps isolate issues from the main HelpMenu component
 */
export function TourTestComponent() {
  const [isEnabled, setIsEnabled] = useState(false)
  
  // Only show for debugging close button issues
  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg z-[10004]">
        <Button 
          onClick={() => setIsEnabled(true)}
          size="sm"
          variant="outline"
        >
          Enable Tour Debug
        </Button>
      </div>
    )
  }

  const handleStartTour = async () => {
    try {
      console.log('🔧 Testing tour with close button functionality')
      
      // Simple test tour config with proper TourConfig interface
      const testTourConfig = {
        id: 'close-button-test',
        name: 'Close Button Test',
        description: 'Testing close button functionality',
        steps: [
          {
            id: 'step-1',
            element: 'body',
            title: 'Step 1: Test ESC Key',
            description: 'This is step 1. Try pressing ESC key or clicking outside this popup to exit the tour.'
          },
          {
            id: 'step-2', 
            element: 'body',
            title: 'Step 2: Test Done Button',
            description: 'This is the final step. The "Done" button should complete the tour. No X button should be visible.'
          }
        ]
      }

      // UPDATED: Test with error handling to catch the TypeError
      console.log('🔍 Testing tour start with comprehensive error handling...')
      
      startTourWithValidation(testTourConfig, {
        onCompleted: (tourId) => {
          console.log('✅ Tour completed:', tourId)
          alert('SUCCESS: Done button works!')
        },
        onSkipped: (tourId) => {
          console.log('✅ Tour skipped:', tourId)
          alert('SUCCESS: ESC key or outside click works!')
        },
        onDestroyed: (tourId) => {
          console.log('🛠️ Tour destroyed:', tourId)
        }
      }, { skipValidation: true }) // Skip validation for body element
      
    } catch (error) {
      console.error('❌ Tour test failed:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      })
      alert(`Tour test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[10004] bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-sm">No Close Button Tour Test</h3>
          <p className="text-xs text-gray-600 mb-3">
            Test ESC key, outside-click, and Done button functionality
          </p>
        </div>
        
        <div className="space-y-2">
          <Button onClick={handleStartTour} size="sm">
            Start Simple Test
          </Button>
          <Button 
            onClick={() => setIsEnabled(false)}
            size="sm"
            variant="outline"
          >
            Hide
          </Button>
        </div>
      </div>
    </div>
  )
}