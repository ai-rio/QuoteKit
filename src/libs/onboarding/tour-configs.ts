import { navigateForTour, validatePageForTour } from './navigation-helper'
import { SPRINT3_TOUR_CONFIGS } from './sprint3-tour-configs'
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
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'navigate-to-quotes',
      element: '[data-tour="create-quote"]',
      title: 'Create New Quote 📝',
      description: 'Click here to start creating a new quote for your clients. We\'ll guide you through the entire process step by step.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        // Ensure we're on the dashboard page
        await navigateForTour('/dashboard');
      }
    },
    {
      id: 'client-selection-intro',
      title: 'Client Information Setup 👤',
      description: 'First, you\'ll need to select or add a new client. You can store client information for quick access in future quotes. Let\'s navigate to the quote creation page.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close'],
      onBeforeHighlight: async () => {
        // Navigate to quote creation page if not already there
        await navigateForTour('/quotes/new');
      }
    },
    {
      id: 'client-selector',
      element: '[data-tour="client-selector"]',
      title: 'Select Your Client',
      description: 'Choose an existing client from your database or create a new one. Client information will be saved for future quotes.',
      position: 'bottom',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        // Check if client selector is visible
        const clientSelector = document.querySelector('[data-tour="client-selector"]')
        return !!clientSelector
      }
    },
    {
      id: 'quote-details',
      element: '[data-tour="quote-details"]',
      title: 'Quote Details & Numbering',
      description: 'Set your quote number and basic details. The system can auto-generate quote numbers for you.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'add-items-section',
      element: '[data-tour="add-items"]',
      title: 'Add Services & Materials 🛠️',
      description: 'This is where you add services and materials from your item library. You can customize quantities, prices, and descriptions for each quote.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'line-items-table',
      element: '[data-tour="line-items-table"]',
      title: 'Quote Line Items',
      description: 'Your selected items appear here. You can adjust quantities, modify prices, and see real-time calculations.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'financial-settings',
      element: '[data-tour="financial-settings"]',
      title: 'Tax & Markup Settings ⚙️',
      description: 'Configure tax rates and markup percentages. These can be set as defaults in your company settings.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'quote-totals',
      element: '[data-tour="quote-totals"]',
      title: 'Quote Calculations 💰',
      description: 'See your quote totals update in real-time as you add items and adjust settings. Subtotal, tax, and final total are calculated automatically.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'save-and-send',
      element: '[data-tour="save-send-actions"]',
      title: 'Save & Send Your Quote 🚀',
      description: 'Save as draft, create the final quote, or send it directly to your client via email. You can also generate a professional PDF.',
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
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'settings-navigation',
      title: 'Company Settings Setup 🏢',
      description: 'Let\'s configure your company information to create professional, branded quotes. This is essential for making a great first impression with clients.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        // Navigate to settings page if not already there
        await navigateForTour('/settings');
      }
    },
    {
      id: 'company-profile',
      element: '[data-tour="company-profile"]',
      title: 'Company Profile Information',
      description: 'Add your business name, address, phone, and email. This information appears on all your quotes and helps establish credibility.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        const companyProfile = document.querySelector('[data-tour="company-profile"]')
        return !!companyProfile
      }
    },
    {
      id: 'logo-upload',
      element: '[data-tour="logo-upload"]',
      title: 'Upload Your Company Logo 🎨',
      description: 'Upload your company logo to brand your quotes professionally. Supports PNG, JPG, and SVG formats. A good logo builds trust with clients.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'financial-defaults',
      element: '[data-tour="financial-defaults"]',
      title: 'Financial Settings 💰',
      description: 'Set your default tax rate, markup percentage, and preferred currency. These will be automatically applied to new quotes, saving you time.',
      position: 'right',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'quote-terms',
      element: '[data-tour="quote-terms"]',
      title: 'Terms & Conditions 📋',
      description: 'Add your standard terms and conditions that will appear on all quotes. Include warranty information, payment terms, and service details.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'save-settings',
      element: '[data-tour="save-settings"]',
      title: 'Save Your Configuration ✅',
      description: 'Don\'t forget to save your settings! Once saved, these defaults will be applied to all new quotes, making quote creation much faster.',
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
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'item-library-intro',
      title: 'Item Library Overview 📚',
      description: 'Your item library is the foundation of quick quote creation. Store all your services and materials here with default prices and descriptions.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        // Navigate to items page if not already there
        await navigateForTour('/items');
      }
    },
    {
      id: 'add-item',
      element: '[data-tour="add-item"]',
      title: 'Add New Items ➕',
      description: 'Click here to add your services and materials. Set default prices, descriptions, units, and categories for quick quote creation.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        const addButton = document.querySelector('[data-tour="add-item"]')
        return !!addButton
      }
    },
    {
      id: 'item-categories',
      element: '[data-tour="categories"]',
      title: 'Organize with Categories 🗂️',
      description: 'Use categories to organize your items efficiently. Create categories like "Lawn Care", "Hardscaping", "Materials", "Equipment", etc.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'item-list',
      element: '[data-tour="items-list"]',
      title: 'Your Item Collection',
      description: 'All your items are displayed here. You can edit prices, update descriptions, and manage availability. Items marked as favorites appear first in quote creation.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'item-search-filter',
      element: '[data-tour="search-filter"]',
      title: 'Search & Filter Tools 🔍',
      description: 'Use search and category filters to quickly find items when creating quotes. This becomes very useful as your library grows.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'global-library',
      element: '[data-tour="global-library"]',
      title: 'Global Item Library 🌍',
      description: 'Browse our pre-built library of common landscaping services and materials. Copy items to your personal library to save time on setup.',
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

// Contextual Help Tour (S1.1 - Should Have)
export const CONTEXTUAL_HELP_TOUR: TourConfig = {
  id: 'contextual-help',
  name: 'Contextual Help System',
  description: 'Learn how to get help when you need it',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'help-introduction',
      title: 'Getting Help When You Need It 🆘',
      description: 'QuoteKit provides contextual help throughout the application. Look for help icons and tooltips to get assistance with any feature.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'help-tooltips',
      element: '[data-tour="help-tooltip"]',
      title: 'Interactive Tooltips',
      description: 'Hover over or click these help icons to get detailed explanations about specific features and best practices.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'help-buttons',
      element: '[data-tour="help-button"]',
      title: 'Help Buttons',
      description: 'Click these help buttons to launch specific mini-tours or get detailed guidance for complex workflows.',
      position: 'left',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// S2.1: Freemium Feature Highlights Tour (Sprint 3)
export const FREEMIUM_HIGHLIGHTS_TOUR: TourConfig = {
  id: 'freemium-highlights',
  name: 'Discover Premium Features',
  description: 'Learn about advanced features available with premium plans',
  userTiers: ['free'], // Only show to free users
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'freemium-intro',
      title: 'Unlock More with Premium 🚀',
      description: 'You\'re currently on the Free plan with 5 quotes limit. Discover powerful features available with our Premium plan to grow your business faster.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'unlimited-quotes-highlight',
      element: '[data-tour="quote-limit-indicator"]',
      title: 'Unlimited Quotes 📈',
      description: 'Premium users can create unlimited quotes without restrictions. Perfect for growing businesses that need to send multiple quotes daily.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'pdf-export-highlight',
      element: '[data-tour="pdf-export-locked"]',
      title: 'Professional PDF Export 📄',
      description: 'Generate professional PDF quotes with your branding. Impress clients with polished, branded documents that stand out from the competition.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'analytics-highlight',
      element: '[data-tour="analytics-locked"]',
      title: 'Business Analytics 📊',
      description: 'Track your quote conversion rates, revenue trends, and client insights. Make data-driven decisions to grow your landscaping business.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'custom-branding-highlight',
      element: '[data-tour="branding-locked"]',
      title: 'Custom Branding 🎨',
      description: 'Add your logo, colors, and custom styling to quotes and emails. Build brand recognition and look more professional to clients.',
      position: 'right',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'upgrade-call-to-action',
      element: '[data-tour="upgrade-button"]',
      title: 'Ready to Upgrade? 💎',
      description: 'Start your free trial today and unlock all premium features. No commitment required - cancel anytime. Your business growth is worth the investment.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// C1.1: Interactive Tutorial Tour (Sprint 3)
export const INTERACTIVE_TUTORIAL_TOUR: TourConfig = {
  id: 'interactive-tutorial',
  name: 'Hands-On Practice',
  description: 'Practice with real features in a safe environment',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'tutorial-intro',
      title: 'Interactive Learning Mode 🎯',
      description: 'This tutorial lets you practice with real features safely. All actions can be undone, so feel free to experiment and learn by doing.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'practice-client-creation',
      element: '[data-tour="client-selector"]',
      title: 'Practice: Add a Client 👤',
      description: 'Try adding a practice client. Click "Add New Client" and fill in some sample information. This won\'t affect your real client database.',
      position: 'bottom',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      onBeforeHighlight: async () => {
        await navigateForTour('/quotes/new');
      }
    },
    {
      id: 'practice-item-selection',
      element: '[data-tour="add-items"]',
      title: 'Practice: Add Line Items 🛠️',
      description: 'Now try adding some services or materials. Browse your item library and add a few items to see how pricing calculations work.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'practice-calculations',
      element: '[data-tour="quote-totals"]',
      title: 'Practice: Watch Calculations 💰',
      description: 'Notice how totals update automatically as you add items and adjust quantities. Try changing some quantities to see real-time calculations.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'practice-save-draft',
      element: '[data-tour="save-send-actions"]',
      title: 'Practice: Save as Draft 💾',
      description: 'Save this practice quote as a draft. You can always delete it later or use it as a template for real quotes.',
      position: 'top',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// C1.2: Personalized Onboarding Tour (Sprint 3)
export const PERSONALIZED_ONBOARDING_TOUR: TourConfig = {
  id: 'personalized-onboarding',
  name: 'Tailored Experience',
  description: 'Customized onboarding based on your business type and goals',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'personalization-intro',
      title: 'Welcome to Your Personalized Tour 🎯',
      description: 'Based on your business profile, we\'ve customized this experience to focus on features most relevant to your landscaping business.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'business-type-focus',
      title: 'Your Business Focus 🌱',
      description: 'We\'ve identified you as a landscaping professional. This tour will emphasize quote management, client communication, and business growth features.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'recommended-workflow',
      element: '[data-tour="quick-actions"]',
      title: 'Your Recommended Workflow 📋',
      description: 'For landscaping businesses, we recommend this workflow: 1) Set up your item library, 2) Configure company settings, 3) Create your first quote.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'industry-specific-tips',
      title: 'Landscaping Pro Tips 💡',
      description: 'Tip: Create categories like "Lawn Care", "Hardscaping", "Seasonal Services", and "Materials" to organize your services effectively.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'growth-recommendations',
      title: 'Business Growth Features 📈',
      description: 'As your business grows, consider using analytics to track conversion rates and client preferences. This helps optimize your pricing and services.',
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
  'pro-features': PRO_FEATURES_TOUR,
  'contextual-help': CONTEXTUAL_HELP_TOUR,
  'freemium-highlights': FREEMIUM_HIGHLIGHTS_TOUR,
  'interactive-tutorial': INTERACTIVE_TUTORIAL_TOUR,
  'personalized-onboarding': PERSONALIZED_ONBOARDING_TOUR,
  ...SPRINT3_TOUR_CONFIGS
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