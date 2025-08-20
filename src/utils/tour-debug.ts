/**
 * Tour Debug Utilities
 * Helper functions to debug and test the tour system
 */

import { pageTourRouter } from '@/libs/onboarding/page-tour-router'
import { tourManager } from '@/libs/onboarding/tour-manager'

export const tourDebug = {
  /**
   * Get current page tour information
   */
  getCurrentPageInfo() {
    const config = pageTourRouter.getCurrentPageConfig()
    const recommendedTour = pageTourRouter.getPageWelcomeTour()
    const availableTours = pageTourRouter.getCurrentPageTours()
    
    return {
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
      pageConfig: config,
      recommendedTour,
      availableTours,
      isAppRoute: pageTourRouter.isAppRoute(),
      isDashboard: pageTourRouter.isDashboard(),
      isQuotesPage: pageTourRouter.isQuotesPage(),
      isItemsPage: pageTourRouter.isItemsPage(),
      isSettingsPage: pageTourRouter.isSettingsPage()
    }
  },

  /**
   * Check tour manager state
   */
  getTourManagerState() {
    return {
      isActive: tourManager.isActive(),
      currentTour: tourManager.getCurrentTour(),
      currentStep: tourManager.getCurrentStep(),
      totalSteps: tourManager.getTotalSteps(),
      hasNextStep: tourManager.hasNextStep(),
      hasPreviousStep: tourManager.hasPreviousStep()
    }
  },

  /**
   * Test if a tour can start on current page
   */
  testTourStart(tourId: string) {
    const canStart = pageTourRouter.canStartTour(tourId)
    const pageInfo = this.getCurrentPageInfo()
    
    return {
      tourId,
      canStart,
      reason: canStart ? 'Tour available on this page' : 'Tour not available on this page',
      pageInfo
    }
  },

  /**
   * Test tour availability for current page
   */
  testCurrentPageTours() {
    const pageInfo = this.getCurrentPageInfo()
    const availableTours = pageInfo.availableTours
    
    console.group('🧪 Current Page Tour Test')
    console.log('📍 Current page:', pageInfo.currentPath)
    console.log('🎯 Recommended tour:', pageInfo.recommendedTour)
    console.log('📋 Available tours:', availableTours)
    
    // Test each available tour
    availableTours.forEach(tourId => {
      const testResult = this.testTourStart(tourId)
      const status = testResult.canStart ? '✅' : '❌'
      console.log(`${status} ${tourId}: ${testResult.reason}`)
    })
    
    console.groupEnd()
    return {
      currentPath: pageInfo.currentPath,
      recommendedTour: pageInfo.recommendedTour,
      availableTours,
      testResults: availableTours.map(tourId => this.testTourStart(tourId))
    }
  },

  /**
   * Validate tour configs exist
   */
  async validateTourConfigs() {
    try {
      const { getTourConfig } = await import('@/libs/onboarding/tour-configs')
      const pageInfo = this.getCurrentPageInfo()
      
      console.group('🔍 Tour Config Validation')
      
      const results = pageInfo.availableTours.map(tourId => {
        const config = getTourConfig(tourId)
        const exists = !!config
        const status = exists ? '✅' : '❌'
        
        console.log(`${status} ${tourId}: ${exists ? 'Found' : 'NOT FOUND'}`)
        
        return { tourId, exists, config }
      })
      
      const validTours = results.filter(r => r.exists).length
      const totalTours = results.length
      
      console.log('')
      console.log(`📊 Summary: ${validTours}/${totalTours} tours have valid configs`)
      
      console.groupEnd()
      
      return results
    } catch (error) {
      console.error('Error validating tour configs:', error)
      return []
    }
  },

  /**
   * Log comprehensive debug information
   */
  logDebugInfo() {
    console.group('🔍 Tour Debug Information')
    console.log('📍 Page Info:', this.getCurrentPageInfo())
    console.log('🎭 Tour Manager State:', this.getTourManagerState())
    console.groupEnd()
  },

  /**
   * Quick fix test - run all diagnostics
   */
  async runDiagnostics() {
    console.log('🔧 Running Tour System Diagnostics...')
    console.log('')
    
    // 1. Page info
    this.logDebugInfo()
    
    // 2. Current page tours
    this.testCurrentPageTours()
    
    // 3. Validate configs
    await this.validateTourConfigs()
    
    // 4. Summary
    console.log('✅ Diagnostics complete! Check results above.')
  },

  /**
   * Test tour routing for all pages
   */
  testAllPageRoutes(): void {
    const testPaths = [
      '/dashboard',
      '/quotes',
      '/quotes/new',
      '/quotes/123',
      '/quotes/123/edit',
      '/items',
      '/clients',
      '/settings',
      '/analytics',
      '/analytics/surveys',
      '/usage',
      '/admin'
    ]

    console.group('🗺️ Page Route Testing')
    testPaths.forEach(path => {
      // Temporarily change path for testing
      const originalPath = window.location.pathname
      Object.defineProperty(window.location, 'pathname', {
        value: path,
        configurable: true
      })

      const config = pageTourRouter.getCurrentPageConfig()
      console.log(`${path}:`, {
        hasConfig: !!config,
        availableTours: config?.availableTours || [],
        defaultTour: config?.defaultTour || 'none'
      })

      // Restore original path
      Object.defineProperty(window.location, 'pathname', {
        value: originalPath,
        configurable: true
      })
    })
    console.groupEnd()
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).tourDebug = tourDebug
}
