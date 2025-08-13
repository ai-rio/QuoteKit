/**
 * Smart Tour Configurations - Tours that can start from any page
 */

import { SmartTourConfig } from './smart-tour-manager';

// Settings Tour - Can start from any page, works best on settings page
export const SMART_SETTINGS_TOUR: SmartTourConfig = {
  id: 'settings',
  name: 'Company Setup',
  description: 'Configure your company information for professional quotes',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  primaryPage: '/settings',
  validStartPages: ['/dashboard', '/settings', '/quotes', '/items'],
  pageSpecificSteps: {
    'company-profile': '/settings',
    'logo-upload': '/settings',
    'financial-defaults': '/settings',
    'quote-terms': '/settings',
    'save-settings': '/settings'
  },
  steps: [
    {
      id: 'settings-intro',
      title: 'Company Settings Setup 🏢',
      description: 'Let\'s configure your company information to create professional, branded quotes. This is essential for making a great first impression with clients.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
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
};

// Quote Creation Tour - Can start from dashboard or quotes page
export const SMART_QUOTE_CREATION_TOUR: SmartTourConfig = {
  id: 'quote-creation',
  name: 'Create Your First Quote',
  description: 'Learn how to create professional quotes for your clients',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  primaryPage: '/quotes/new',
  validStartPages: ['/dashboard', '/quotes', '/quotes/new'],
  pageSpecificSteps: {
    'create-quote-button': '/dashboard',
    'client-selector': '/quotes/new',
    'quote-details': '/quotes/new',
    'add-items': '/quotes/new',
    'line-items-table': '/quotes/new',
    'financial-settings': '/quotes/new',
    'quote-totals': '/quotes/new',
    'save-send-actions': '/quotes/new'
  },
  steps: [
    {
      id: 'quote-intro',
      title: 'Create Your First Quote 📝',
      description: 'Let\'s walk through creating a professional quote for your clients. We\'ll guide you through the entire process step by step.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
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
};

// Item Library Tour - Can start from dashboard or items page
export const SMART_ITEM_LIBRARY_TOUR: SmartTourConfig = {
  id: 'item-library',
  name: 'Item Library Management',
  description: 'Learn how to manage your services and materials library',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  primaryPage: '/items',
  validStartPages: ['/dashboard', '/items'],
  pageSpecificSteps: {
    'add-item': '/items',
    'categories': '/items',
    'items-list': '/items',
    'search-filter': '/items',
    'global-library': '/items'
  },
  steps: [
    {
      id: 'item-library-intro',
      title: 'Item Library Overview 📚',
      description: 'Your item library is the foundation of quick quote creation. Store all your services and materials here with default prices and descriptions.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
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
};

// Export all smart tour configurations
export const SMART_TOUR_CONFIGS = {
  'settings': SMART_SETTINGS_TOUR,
  'quote-creation': SMART_QUOTE_CREATION_TOUR,
  'item-library': SMART_ITEM_LIBRARY_TOUR
};

export function getSmartTourConfig(tourId: string): SmartTourConfig | undefined {
  return SMART_TOUR_CONFIGS[tourId as keyof typeof SMART_TOUR_CONFIGS];
}
