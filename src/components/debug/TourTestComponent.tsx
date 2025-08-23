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
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testBasicTour = async () => {
    addResult('🧪 Testing basic tour functionality...')
    
    try {
      // Test 1: Check if driver.js is available
      const { driver } = await import('driver.js')
      addResult('✅ driver.js imported successfully')
      
      // Test 2: Create a simple driver instance
      const simpleDriver = driver({
        steps: [
          {
            popover: {
              title: 'Test Tour',
              description: 'This is a test to verify driver.js is working.'
            }
          }
        ]
      })
      
      addResult('✅ Driver instance created successfully')
      
      // Test 3: Try to start the tour
      simpleDriver.drive()
      addResult('✅ Basic tour started - check if popover appears')
      
    } catch (error) {
      addResult(`❌ Basic tour test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testWelcomeTour = async () => {
    addResult('🧪 Testing welcome tour configuration...')
    
    try {
      const tourConfig = getTourConfig('welcome')
      if (!tourConfig) {
        addResult('❌ Welcome tour configuration not found')
        return
      }
      
      addResult('✅ Welcome tour configuration loaded')
      addResult(`📋 Tour has ${tourConfig.steps?.length || 0} steps`)
      
      // Test starting the tour with validation
      startTourWithValidation(tourConfig, {
        onDestroyed: (id) => {
          addResult(`✅ Tour ${id} completed and destroyed`)
        }
      })
      
      addResult('✅ Welcome tour started with validation')
      
    } catch (error) {
      addResult(`❌ Welcome tour test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testConsoleErrors = () => {
    addResult('🧪 Checking for console errors...')
    
    // Check for common browser issues
    if (typeof window !== 'undefined') {
      addResult(`📍 Current URL: ${window.location.href}`)
      addResult(`🌍 User Agent: ${navigator.userAgent.substring(0, 50)}...`)
      
      // Check for CSP violations (common cause of tour failures)
      if ('securityPolicy' in document) {
        addResult('🔒 Content Security Policy detected')
      }
      
      addResult('✅ Console check completed - see browser console for detailed errors')
    } else {
      addResult('❌ Window object not available (SSR environment)')
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Disabled - use OnboardingDebug panel instead
  return null

  return (
    <div className="fixed top-4 left-4 z-[9999] bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-md">
      <h3 className="font-bold text-sm mb-2">🧪 Tour Debug Test</h3>
      
      <div className="space-y-2 mb-3">
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-7 bg-white text-black hover:bg-gray-100"
          onClick={testBasicTour}
        >
          Test Basic Tour
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-7 bg-white text-black hover:bg-gray-100"
          onClick={testWelcomeTour}
        >
          Test Welcome Tour
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-7 bg-white text-black hover:bg-gray-100"
          onClick={testConsoleErrors}
        >
          Check Console
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-7 bg-white text-red-600 hover:bg-red-50"
          onClick={clearResults}
        >
          Clear Results
        </Button>
      </div>
      
      <div className="max-h-40 overflow-y-auto bg-black bg-opacity-20 p-2 rounded text-xs">
        {testResults.length === 0 ? (
          <p className="text-gray-300">Click buttons above to run tests</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1">{result}</div>
          ))
        )}
      </div>
    </div>
  )
}