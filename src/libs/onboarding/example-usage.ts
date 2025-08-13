/**
 * Example usage of the LawnQuote Onboarding System
 * 
 * This file demonstrates how to use the onboarding infrastructure
 * for creating and managing user tours.
 */

import {
  createTourDriver,
  type TourConfig,
  tourStorage,
  validateTourConfig,
} from './index';

/**
 * Example: Welcome Tour for New Users
 */
export function createWelcomeTour(): void {
  const welcomeTourConfig: TourConfig = {
    tourId: 'welcome-tour',
    steps: [
      {
        id: 'welcome-step',
        element: '#main-navigation',
        title: 'Welcome to LawnQuote! 🌱',
        description: 'Let\'s take a quick tour to help you get started with creating your first lawn care quote.',
        showProgress: true,
        allowClose: true,
      },
      {
        id: 'dashboard-step',
        element: '[data-tour="dashboard-link"]',
        title: 'Your Dashboard',
        description: 'This is your command center where you can view all your quotes, customers, and business metrics.',
      },
      {
        id: 'new-quote-step',
        element: '[data-tour="new-quote-button"]',
        title: 'Create a Quote',
        description: 'Click here to start creating a professional lawn care quote for your customers.',
        onNextClick: () => {
          console.log('User completed the welcome tour');
          // Track completion in analytics
        }
      },
    ],
    analytics: {
      trackStart: true,
      trackComplete: true,
      trackStepView: true,
    },
  };

  // Validate the configuration
  const errors = validateTourConfig(welcomeTourConfig);
  if (errors.length > 0) {
    console.error('Tour configuration errors:', errors);
    return;
  }

  // Check if user has already seen this tour
  if (tourStorage.isTourCompleted(welcomeTourConfig.tourId)) {
    console.log('User has already completed the welcome tour');
    return;
  }

  // Create and start the tour
  try {
    const driver = createTourDriver(welcomeTourConfig);
    
    // Add completion handler
    const originalDestroy = driver.destroy.bind(driver);
    driver.destroy = function() {
      tourStorage.markTourCompleted(welcomeTourConfig.tourId);
      originalDestroy();
    };

    // Start the tour
    driver.drive();
  } catch (error) {
    console.error('Failed to start welcome tour:', error);
  }
}

/**
 * Example: Feature Discovery Tour
 */
export function createFeatureTour(featureName: string): void {
  const featureTourConfig: TourConfig = {
    tourId: `feature-tour-${featureName}`,
    steps: [
      {
        id: 'feature-intro',
        element: `[data-feature="${featureName}"]`,
        title: 'New Feature Available! ✨',
        description: `We've added a new ${featureName} feature to help you work more efficiently.`,
      },
      {
        id: 'feature-demo',
        element: `[data-feature="${featureName}-demo"]`,
        title: 'How It Works',
        description: 'Here\'s how you can use this new feature in your workflow.',
      },
    ],
  };

  const errors = validateTourConfig(featureTourConfig);
  if (errors.length === 0) {
    const driver = createTourDriver(featureTourConfig);
    driver.drive();
  }
}

/**
 * Example: Conditional Tour Based on User Actions
 */
export function startConditionalTour(): void {
  // Only show if user hasn't created a quote yet
  const hasCreatedQuote = localStorage.getItem('lawnquote_has_created_quote') === 'true';
  
  if (!hasCreatedQuote && !tourStorage.isTourCompleted('quote-creation-help')) {
    const helpTourConfig: TourConfig = {
      tourId: 'quote-creation-help',
      steps: [
        {
          id: 'help-intro',
          element: '#quote-form',
          title: 'Need Help Creating Your First Quote?',
          description: 'We noticed you haven\'t created a quote yet. Would you like a quick walkthrough?',
        },
        {
          id: 'customer-info',
          element: '[data-tour="customer-section"]',
          title: 'Customer Information',
          description: 'Start by entering your customer\'s contact details here.',
        },
        {
          id: 'service-selection',
          element: '[data-tour="services-section"]',
          title: 'Select Services',
          description: 'Choose the lawn care services you\'ll be providing.',
        },
      ],
    };

    const errors = validateTourConfig(helpTourConfig);
    if (errors.length === 0) {
      const driver = createTourDriver(helpTourConfig);
      driver.drive();
    }
  }
}

/**
 * Example: Tour with Custom Validation
 */
export function createAdvancedTour(): void {
  const advancedConfig: TourConfig = {
    tourId: 'advanced-features-tour',
    steps: [
      {
        id: 'advanced-step-1',
        element: '#advanced-panel',
        title: 'Advanced Features',
        description: 'These advanced tools require a premium subscription.',
        // Note: validation is not a valid TourStep property
        onNextClick: async () => {
          // Custom analytics tracking
          console.log('User viewed advanced features tour');
        }
      },
    ],
  };

  const errors = validateTourConfig(advancedConfig);
  if (errors.length === 0) {
    const driver = createTourDriver(advancedConfig);
    driver.drive();
  }
}

/**
 * Utility function to reset all tour progress (for development/testing)
 */
export function resetAllTours(): void {
  tourStorage.resetTourProgress();
  console.log('All tour progress has been reset');
}

/**
 * Utility function to check tour completion status
 */
export function getTourStatus(): { completed: string[], pending: string[] } {
  const allTours = [
    'welcome-tour',
    'quote-creation-help',
    'feature-tour-calculator',
    'feature-tour-templates',
    'advanced-features-tour',
  ];

  const completed = tourStorage.getCompletedTours();
  const pending = allTours.filter(tour => !completed.includes(tour));

  return { completed, pending };
}

/**
 * Example usage in a React component or page:
 * 
 * ```typescript
 * import { createWelcomeTour, getTourStatus } from '@/libs/onboarding/example-usage';
 * 
 * // In useEffect or component mount
 * useEffect(() => {
 *   // Check if user is new and show welcome tour
 *   const isNewUser = !localStorage.getItem('lawnquote_visited_before');
 *   if (isNewUser) {
 *     createWelcomeTour();
 *     localStorage.setItem('lawnquote_visited_before', 'true');
 *   }
 * }, []);
 * 
 * // Show feature tour when new feature is introduced
 * const handleShowFeatureTour = () => {
 *   createFeatureTour('advanced-calculator');
 * };
 * ```
 */