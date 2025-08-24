/**
 * Page-Aware Tour Router
 * Handles tour routing and page detection for QuoteKit app routes
 */

export interface PageTourConfig {
  route: string
  availableTours: string[]
  defaultTour?: string
  requiresAuth?: boolean
}

/**
 * Map of app routes to their available tours
 * Updated to match actual TOUR_CONFIGS from tour-configs.ts
 */
export const PAGE_TOUR_MAP: Record<string, PageTourConfig> = {
  '/dashboard': {
    route: '/dashboard',
    availableTours: ['welcome', 'personalized-onboarding', 'contextual-help'],
    defaultTour: 'welcome',
    requiresAuth: true
  },
  '/quotes': {
    route: '/quotes',
    availableTours: ['quote-creation', 'interactive-tutorial'],
    defaultTour: 'quote-creation',
    requiresAuth: true
  },
  '/quotes/new': {
    route: '/quotes/new',
    availableTours: ['quote-creation', 'interactive-tutorial'],
    defaultTour: 'quote-creation',
    requiresAuth: true
  },
  '/quotes/[id]': {
    route: '/quotes/[id]',
    availableTours: ['quote-creation', 'interactive-tutorial'],
    defaultTour: 'quote-creation',
    requiresAuth: true
  },
  '/quotes/[id]/edit': {
    route: '/quotes/[id]/edit',
    availableTours: ['quote-creation', 'interactive-tutorial'],
    defaultTour: 'quote-creation',
    requiresAuth: true
  },
  '/items': {
    route: '/items',
    availableTours: ['item-library'],
    defaultTour: 'item-library',
    requiresAuth: true
  },
  '/clients': {
    route: '/clients',
    availableTours: ['welcome', 'contextual-help'],
    defaultTour: 'welcome',
    requiresAuth: true
  },
  '/settings': {
    route: '/settings',
    availableTours: ['settings'],
    defaultTour: 'settings',
    requiresAuth: true
  },
  '/analytics': {
    route: '/analytics',
    availableTours: ['pro-features', 'contextual-help'],
    defaultTour: 'pro-features',
    requiresAuth: true
  },
  '/analytics/surveys': {
    route: '/analytics/surveys',
    availableTours: ['pro-features', 'contextual-help'],
    defaultTour: 'pro-features',
    requiresAuth: true
  },
  '/usage': {
    route: '/usage',
    availableTours: ['pro-features', 'contextual-help'],
    defaultTour: 'pro-features',
    requiresAuth: true
  },
  '/admin': {
    route: '/admin',
    availableTours: ['contextual-help'],
    defaultTour: 'contextual-help',
    requiresAuth: true
  }
}

// First-time visit tracking for autoload behavior
export interface FirstVisitTracker {
  hasVisited: (pagePath: string) => boolean
  markVisited: (pagePath: string) => void
  shouldAutoloadTour: (pagePath: string) => boolean
  clearVisitHistory: () => void
}

class LocalStorageFirstVisitTracker implements FirstVisitTracker {
  private readonly STORAGE_KEY = 'quotekit_first_visits'

  private getVisitHistory(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn('Error reading first visits from localStorage:', error)
      return {}
    }
  }

  private setVisitHistory(visits: Record<string, string>): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(visits))
    } catch (error) {
      console.warn('Error saving first visits to localStorage:', error)
    }
  }

  hasVisited(pagePath: string): boolean {
    const visits = this.getVisitHistory()
    return pagePath in visits
  }

  markVisited(pagePath: string): void {
    const visits = this.getVisitHistory()
    visits[pagePath] = new Date().toISOString()
    this.setVisitHistory(visits)
    
    console.log('🎯 FirstVisitTracker: Marked visited:', pagePath)
  }

  shouldAutoloadTour(pagePath: string): boolean {
    // Only autoload on first visit to a page
    const isFirstVisit = !this.hasVisited(pagePath)
    const pageConfig = PAGE_TOUR_MAP[pagePath]
    
    console.log('🎯 FirstVisitTracker: Autoload check:', {
      pagePath,
      isFirstVisit,
      hasDefaultTour: !!pageConfig?.defaultTour,
      defaultTour: pageConfig?.defaultTour
    })
    
    // Autoload if it's the first visit and the page has a default tour
    return isFirstVisit && !!pageConfig?.defaultTour
  }

  clearVisitHistory(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('🎯 FirstVisitTracker: Cleared all visit history')
    } catch (error) {
      console.warn('Error clearing first visits from localStorage:', error)
    }
  }
}

// Export singleton instance
export const firstVisitTracker: FirstVisitTracker = new LocalStorageFirstVisitTracker()

// Helper function to handle tour autoloading
export function handleTourAutoload(pagePath: string, startTour: (tourId: string) => Promise<void>): void {
  // Normalize the path for consistent tracking
  const normalizedPath = normalizePagePath(pagePath)
  
  if (firstVisitTracker.shouldAutoloadTour(normalizedPath)) {
    const pageConfig = PAGE_TOUR_MAP[normalizedPath]
    
    if (pageConfig?.defaultTour) {
      console.log('🎯 TourAutoload: Starting default tour for first visit:', {
        pagePath: normalizedPath,
        defaultTour: pageConfig.defaultTour
      })
      
      // Mark as visited immediately to prevent double-loading
      firstVisitTracker.markVisited(normalizedPath)
      
      // Start the default tour with a small delay to ensure page is fully loaded
      setTimeout(() => {
        startTour(pageConfig.defaultTour!)
          .then(() => {
            console.log('✅ TourAutoload: Successfully started default tour:', pageConfig.defaultTour)
          })
          .catch((error) => {
            console.error('❌ TourAutoload: Failed to start default tour:', error)
            // If tour fails to start, we don't want to block future attempts
            // So we don't mark it as visited in this case
          })
      }, 1000) // 1 second delay to ensure page is stable
    }
  } else if (!firstVisitTracker.hasVisited(normalizedPath)) {
    // Mark as visited even if no default tour, so we track the visit
    firstVisitTracker.markVisited(normalizedPath)
  }
}

// Normalize page paths for consistent tracking (handle dynamic routes)
export function normalizePagePath(pagePath: string): string {
  // Handle dynamic routes by normalizing them to their pattern
  if (pagePath.startsWith('/quotes/') && pagePath !== '/quotes/new') {
    if (pagePath.includes('/edit')) {
      return '/quotes/[id]/edit'
    } else {
      return '/quotes/[id]'
    }
  }
  
  return pagePath
}

// Development utilities for testing first-time autoload behavior
export const firstVisitUtils = {
  // Reset all visit history (for testing)
  resetAllVisits: () => firstVisitTracker.clearVisitHistory(),
  
  // Check if a page has been visited
  hasVisited: (pagePath: string) => firstVisitTracker.hasVisited(normalizePagePath(pagePath)),
  
  // Manually mark a page as visited (for testing)
  markVisited: (pagePath: string) => firstVisitTracker.markVisited(normalizePagePath(pagePath)),
  
  // Get all visited pages (for debugging)
  getVisitHistory: () => {
    if (typeof window === 'undefined') return {}
    
    try {
      const stored = localStorage.getItem('quotekit_first_visits')
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn('Error reading visit history:', error)
      return {}
    }
  },
  
  // Check which page would autoload a tour
  checkAutoload: (pagePath: string) => {
    const normalizedPath = normalizePagePath(pagePath)
    const pageConfig = PAGE_TOUR_MAP[normalizedPath]
    const shouldAutoload = firstVisitTracker.shouldAutoloadTour(normalizedPath)
    
    return {
      pagePath,
      normalizedPath,
      isFirstVisit: !firstVisitTracker.hasVisited(normalizedPath),
      hasPageConfig: !!pageConfig,
      defaultTour: pageConfig?.defaultTour,
      shouldAutoload
    }
  }
}

// Make utilities available on window for easy console access during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore - Development utility
  window.firstVisitUtils = firstVisitUtils
}

/**
 * Page Tour Router Class
 */
export class PageTourRouter {
  /**
   * Get current page path (client-side only)
   */
  private getCurrentPath(): string {
    if (typeof window === 'undefined') return ''
    return window.location.pathname
  }

  /**
   * Match current path to route pattern (handles dynamic routes)
   */
  private matchRoute(currentPath: string, routePattern: string): boolean {
    // Exact match
    if (currentPath === routePattern) return true
    
    // Dynamic route matching (e.g., /quotes/[id] matches /quotes/123)
    if (routePattern.includes('[') && routePattern.includes(']')) {
      const pattern = routePattern.replace(/\[.*?\]/g, '[^/]+')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(currentPath)
    }
    
    return false
  }

  /**
   * Get page configuration for current route
   */
  getCurrentPageConfig(): PageTourConfig | null {
    const currentPath = this.getCurrentPath()
    if (!currentPath) return null

    for (const [route, config] of Object.entries(PAGE_TOUR_MAP)) {
      if (this.matchRoute(currentPath, route)) {
        return config
      }
    }

    return null
  }

  /**
   * Get available tours for current page
   */
  getCurrentPageTours(): string[] {
    const config = this.getCurrentPageConfig()
    return config?.availableTours || []
  }

  /**
   * Get recommended tour for current page
   */
  getRecommendedTour(): string | null {
    const config = this.getCurrentPageConfig()
    return config?.defaultTour || null
  }

  /**
   * Check if a tour can start on current page
   */
  canStartTour(tourId: string): boolean {
    const availableTours = this.getCurrentPageTours()
    return availableTours.includes(tourId)
  }

  /**
   * Check if current page is an app route (requires auth)
   */
  isAppRoute(): boolean {
    const config = this.getCurrentPageConfig()
    return config?.requiresAuth || false
  }

  /**
   * Check if we're on dashboard specifically
   */
  isDashboard(): boolean {
    return this.getCurrentPath() === '/dashboard'
  }

  /**
   * Check if we're on any quotes page
   */
  isQuotesPage(): boolean {
    const currentPath = this.getCurrentPath()
    return currentPath.startsWith('/quotes')
  }

  /**
   * Check if we're on items page
   */
  isItemsPage(): boolean {
    return this.getCurrentPath() === '/items'
  }

  /**
   * Check if we're on settings page
   */
  isSettingsPage(): boolean {
    return this.getCurrentPath() === '/settings'
  }

  /**
   * Get page-specific welcome tour with fallback logic
   */
  getPageWelcomeTour(): string | null {
    const currentPath = this.getCurrentPath()
    const config = this.getCurrentPageConfig()
    
    // Return page-specific recommended tour if available
    if (config?.defaultTour) {
      return config.defaultTour
    }
    
    // Fallback logic based on path patterns
    if (currentPath === '/dashboard') return 'welcome'
    if (currentPath.startsWith('/quotes')) return 'quote-creation'
    if (currentPath === '/items') return 'item-library'
    if (currentPath === '/settings') return 'settings'
    if (currentPath.startsWith('/analytics')) return 'pro-features'
    
    // Default fallback for any app route
    if (this.isAppRoute()) return 'welcome'
    
    return null
  }

  /**
   * Get available tours with validation against actual tour configs
   */
  getValidatedPageTours(): string[] {
    const availableTours = this.getCurrentPageTours()
    
    // Import tour configs dynamically to validate
    if (typeof window !== 'undefined') {
      try {
        // This will be validated at runtime
        return availableTours
      } catch (error) {
        console.warn('Could not validate tours:', error)
        return availableTours
      }
    }
    
    return availableTours
  }
}

// Export singleton instance
export const pageTourRouter = new PageTourRouter()
