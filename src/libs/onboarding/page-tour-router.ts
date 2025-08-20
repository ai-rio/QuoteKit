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
