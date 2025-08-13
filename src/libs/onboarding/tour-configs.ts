import { TourConfig } from './tour-manager'

// Welcome Tour - Dashboard Overview (M1.3 Specification)
export const WELCOME_TOUR: TourConfig = {
  id: 'welcome',
  name: 'Welcome to LawnQuote',
  description: 'Get started with your quote management system',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'welcome-message',
      title: 'Welcome to LawnQuote! 🌱',
      description: 'Welcome to your new quote management system! Let\'s take a quick tour to help you get started and discover all the powerful features available to grow your landscaping business.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'navigation-sidebar',
      element: '[data-tour="sidebar"]',
      title: 'Main Navigation',
      description: 'This is your main navigation sidebar. Access all features including Dashboard, Quotes, Items, Clients, Settings, and Account management from here.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      onBeforeHighlight: () => {
        // Ensure sidebar is visible on mobile
        const sidebarTrigger = document.querySelector('[data-tour="sidebar-trigger"]')
        if (sidebarTrigger && window.innerWidth < 768) {
          (sidebarTrigger as HTMLElement).click()
        }
      }
    },
    {
      id: 'dashboard-stats',
      element: '[data-tour="stats-cards"]',
      title: 'Dashboard Statistics',
      description: 'These cards show your business metrics at a glance - total quotes, sent quotes, accepted quotes, revenue, and library items. Perfect for tracking your progress!',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'quick-actions',
      element: '[data-tour="quick-actions"]',
      title: 'Quick Actions Panel',
      description: 'Access your most common tasks quickly from this panel. Create new quotes, manage existing ones, update your item library, and configure settings.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'account-menu',
      element: '[data-tour="account-menu"]',
      title: 'Account Menu',
      description: 'Click here to access your account settings, billing information, and subscription details. You can also sign out from this menu.',
      position: 'bottom',
      align: 'end',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'settings-access',
      element: '[data-tour="settings-link"]',
      title: 'Company Settings',
      description: 'Complete your company profile here to create professional quotes. Add your logo, contact information, and default pricing to get started.',
      position: 'left',
      align: 'center',
      showButtons: ['previous', 'close'],
      validation: () => {
        // Check if settings link is visible
        const settingsLink = document.querySelector('[data-tour="settings-link"]')
        return !!settingsLink
      }
    }
  ]
}

// Quote Creation Tour
export const QUOTE_CREATION_TOUR: TourConfig = {
  id: 'quote-creation',
  name: 'Create Your First Quote',
  description: 'Learn how to create professional quotes for your clients',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  steps: [
    {
      id: 'create-quote-button',
      element: '[data-tour="create-quote"]',
      title: 'Create New Quote',
      description: 'Click here to start creating a new quote for your clients. We\'ll guide you through the entire process.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'client-selection',
      title: 'Select Your Client',
      description: 'First, you\'ll select or add a new client. You can store client information for quick access in future quotes.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'add-items',
      title: 'Add Services & Materials',
      description: 'Add services and materials from your item library. You can customize quantities, prices, and descriptions for each quote.',
      position: 'right',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'review-send',
      title: 'Review & Send',
      description: 'Review your quote, add any notes or terms, then send it directly to your client via email or generate a PDF.',
      position: 'top',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Settings Configuration Tour
export const SETTINGS_TOUR: TourConfig = {
  id: 'settings',
  name: 'Company Setup',
  description: 'Configure your company information for professional quotes',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  steps: [
    {
      id: 'company-profile',
      element: '[data-tour="company-profile"]',
      title: 'Company Profile',
      description: 'Add your business name, address, phone, and email. This information appears on all your quotes.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'close']
    },
    {
      id: 'logo-upload',
      element: '[data-tour="logo-upload"]',
      title: 'Upload Your Logo',
      description: 'Upload your company logo to brand your quotes professionally. Supports PNG, JPG, and SVG formats.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'financial-defaults',
      element: '[data-tour="financial-defaults"]',
      title: 'Financial Settings',
      description: 'Set your default tax rate, currency, and payment terms. These will be automatically applied to new quotes.',
      position: 'right',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'quote-terms',
      element: '[data-tour="quote-terms"]',
      title: 'Quote Terms & Conditions',
      description: 'Add your standard terms and conditions that will appear on all quotes. Include warranty, payment, and service details.',
      position: 'top',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Item Library Tour
export const ITEM_LIBRARY_TOUR: TourConfig = {
  id: 'item-library',
  name: 'Item Library Management',
  description: 'Learn how to manage your services and materials library',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  steps: [
    {
      id: 'add-item',
      element: '[data-tour="add-item"]',
      title: 'Add New Items',
      description: 'Add your services and materials here. Set default prices, descriptions, and categories for quick quote creation.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'categories',
      element: '[data-tour="categories"]',
      title: 'Organize with Categories',
      description: 'Use categories to organize your items. Create categories like "Lawn Care", "Hardscaping", "Materials", etc.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'global-library',
      element: '[data-tour="global-library"]',
      title: 'Global Item Library',
      description: 'Browse our pre-built library of common landscaping services and materials. Copy items to your personal library.',
      position: 'top',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Pro Features Tour (for Pro users only)
export const PRO_FEATURES_TOUR: TourConfig = {
  id: 'pro-features',
  name: 'Pro Features Overview',
  description: 'Discover advanced features available with your Pro subscription',
  userTiers: ['pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  steps: [
    {
      id: 'unlimited-quotes',
      title: 'Unlimited Quotes',
      description: 'As a Pro user, you can create unlimited quotes without any restrictions. Perfect for growing businesses!',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'advanced-analytics',
      element: '[data-tour="analytics-link"]',
      title: 'Advanced Analytics',
      description: 'Access detailed business analytics including conversion rates, revenue trends, and client insights.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'custom-branding',
      title: 'Custom Branding',
      description: 'Customize your quote templates with your brand colors, fonts, and layout preferences.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'priority-support',
      title: 'Priority Support',
      description: 'Get priority email support and access to our knowledge base for any questions or issues.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Export all tour configurations
export const TOUR_CONFIGS: Record<string, TourConfig> = {
  welcome: WELCOME_TOUR,
  'quote-creation': QUOTE_CREATION_TOUR,
  settings: SETTINGS_TOUR,
  'item-library': ITEM_LIBRARY_TOUR,
  'pro-features': PRO_FEATURES_TOUR
}

// Helper function to get tour config by ID
export function getTourConfig(tourId: string): TourConfig | undefined {
  return TOUR_CONFIGS[tourId]
}

// Helper function to get tours available for user tier
export function getToursForTier(userTier: 'free' | 'pro' | 'enterprise'): TourConfig[] {
  return Object.values(TOUR_CONFIGS).filter(tour => 
    tour.userTiers?.includes(userTier) ?? true
  )
}

// Helper function to get prerequisite chain
export function getTourPrerequisites(tourId: string): string[] {
  const tour = getTourConfig(tourId)
  if (!tour?.prerequisites) return []
  
  const chain: string[] = []
  const visited = new Set<string>()
  
  function buildChain(id: string) {
    if (visited.has(id)) return // Prevent circular dependencies
    visited.add(id)
    
    const config = getTourConfig(id)
    if (config?.prerequisites) {
      for (const prereq of config.prerequisites) {
        buildChain(prereq)
        if (!chain.includes(prereq)) {
          chain.push(prereq)
        }
      }
    }
  }
  
  buildChain(tourId)
  return chain
}