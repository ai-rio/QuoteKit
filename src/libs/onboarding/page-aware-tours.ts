/**
 * Page-Aware Tour System
 * Simple solution that allows tours to work from any page
 */

import { TourConfig, TourStep } from './tour-manager';

/**
 * Check if we're on a specific page
 */
function isOnPage(path: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes(path);
}

/**
 * Navigate to a page and wait for it to load
 */
async function navigateAndWait(path: string, waitTime = 1000): Promise<void> {
  if (typeof window === 'undefined') return;
  
  if (!isOnPage(path)) {
    console.log(`🧭 Navigating to ${path} for tour`);
    window.location.href = path;
    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

/**
 * Check if required elements exist on the page
 */
function validateTourElements(steps: TourStep[]): { valid: boolean; missingElements: string[] } {
  const missingElements: string[] = [];
  
  for (const step of steps) {
    if (step.element) {
      const element = document.querySelector(step.element);
      if (!element) {
        missingElements.push(step.element);
      }
    }
  }
  
  return {
    valid: missingElements.length === 0,
    missingElements
  };
}

/**
 * Enhanced tour configurations that work from any page
 */

// Settings Tour - Works from any page, navigates to settings if needed
export const PAGE_AWARE_SETTINGS_TOUR: TourConfig = {
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
      description: isOnPage('/settings') 
        ? 'Let\'s configure your company information to create professional, branded quotes.'
        : 'Let\'s navigate to your company settings to configure your business information.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        if (!isOnPage('/settings')) {
          await navigateAndWait('/settings');
        }
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
};

// Quote Creation Tour - Works from any page, navigates to quotes if needed
export const PAGE_AWARE_QUOTE_CREATION_TOUR: TourConfig = {
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
      id: 'quote-navigation',
      title: 'Create Your First Quote 📝',
      description: isOnPage('/quotes/new')
        ? 'Let\'s walk through creating a professional quote for your clients.'
        : 'Let\'s navigate to the quote creation page to start building your first quote.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        if (!isOnPage('/quotes/new')) {
          await navigateAndWait('/quotes/new');
        }
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
        const clientSelector = document.querySelector('[data-tour="client-selector"]')
        return !!clientSelector
      }
    },
    // ... rest of quote creation steps
  ]
};

// Item Library Tour - Works from any page, navigates to items if needed
export const PAGE_AWARE_ITEM_LIBRARY_TOUR: TourConfig = {
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
      id: 'item-library-navigation',
      title: 'Item Library Overview 📚',
      description: isOnPage('/items')
        ? 'Your item library is the foundation of quick quote creation.'
        : 'Let\'s navigate to your item library to manage your services and materials.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        if (!isOnPage('/items')) {
          await navigateAndWait('/items');
        }
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
    // ... rest of item library steps
  ]
};

/**
 * Get page-aware tour configuration
 */
export function getPageAwareTourConfig(tourId: string): TourConfig | undefined {
  switch (tourId) {
    case 'settings':
      return PAGE_AWARE_SETTINGS_TOUR;
    case 'quote-creation':
      return PAGE_AWARE_QUOTE_CREATION_TOUR;
    case 'item-library':
      return PAGE_AWARE_ITEM_LIBRARY_TOUR;
    default:
      return undefined;
  }
}

/**
 * Check if a tour can start from the current page
 */
export function canStartTourFromCurrentPage(tourId: string): boolean {
  const config = getPageAwareTourConfig(tourId);
  if (!config) return false;

  // For page-aware tours, we can always start them since they handle navigation
  return true;
}

/**
 * Validate that a tour can run on the current page
 */
export function validateTourForCurrentPage(tourId: string): { canRun: boolean; reason?: string } {
  const config = getPageAwareTourConfig(tourId);
  if (!config) {
    return { canRun: false, reason: 'Tour configuration not found' };
  }

  // Check if required elements exist (skip navigation steps)
  const nonNavigationSteps = config.steps.filter(step => 
    !step.id.includes('navigation') && step.element
  );

  if (nonNavigationSteps.length > 0) {
    const validation = validateTourElements(nonNavigationSteps);
    if (!validation.valid) {
      return { 
        canRun: true, // Can still run, will navigate to correct page
        reason: `Some elements not found on current page: ${validation.missingElements.join(', ')}`
      };
    }
  }

  return { canRun: true };
}
