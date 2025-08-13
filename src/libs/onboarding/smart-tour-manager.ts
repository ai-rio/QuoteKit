/**
 * Smart Tour Manager - Handles tours that can start from any page
 * Detects current page and adapts tour flow accordingly
 */

import { navigationHelper } from './navigation-helper';
import { TourConfig, TourStep } from './tour-manager';

export interface SmartTourConfig extends TourConfig {
  // Define which pages this tour can start from
  validStartPages?: string[];
  // Define the primary page for this tour
  primaryPage?: string;
  // Steps that require specific pages
  pageSpecificSteps?: {
    [stepId: string]: string; // stepId -> required page path
  };
}

class SmartTourManager {
  /**
   * Prepare a tour for the current page context
   * Filters steps and adjusts navigation based on current location
   */
  prepareTourForCurrentPage(config: SmartTourConfig): TourConfig {
    const currentPath = navigationHelper.getCurrentPath();
    console.log(`🧭 Preparing tour "${config.id}" for current page: ${currentPath}`);

    // If tour has a primary page and we're not on it, add navigation step
    if (config.primaryPage && !navigationHelper.isOnPage(config.primaryPage)) {
      return this.createNavigationTour(config);
    }

    // If we're on the right page, return the tour as-is but with page validation
    return this.createPageAwareTour(config);
  }

  /**
   * Create a tour that starts with navigation to the correct page
   */
  private createNavigationTour(config: SmartTourConfig): TourConfig {
    const navigationStep: TourStep = {
      id: `navigate-to-${config.id}`,
      title: `Navigate to ${config.name}`,
      description: `Let's navigate to the ${config.primaryPage} page to start the ${config.name} tour.`,
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: () => {
        // Use window.location for navigation but with a delay to allow tour to complete
        setTimeout(() => {
          if (config.primaryPage) {
            window.location.href = config.primaryPage;
          }
        }, 1000);
      }
    };

    return {
      ...config,
      steps: [navigationStep, ...config.steps]
    };
  }

  /**
   * Create a tour that validates page requirements for each step
   */
  private createPageAwareTour(config: SmartTourConfig): TourConfig {
    const enhancedSteps = config.steps.map(step => {
      const requiredPage = config.pageSpecificSteps?.[step.id];
      
      if (requiredPage) {
        return {
          ...step,
          validation: () => {
            const isOnCorrectPage = navigationHelper.isOnPage(requiredPage);
            if (!isOnCorrectPage) {
              console.warn(`Step ${step.id} requires page ${requiredPage} but currently on ${navigationHelper.getCurrentPath()}`);
            }
            return isOnCorrectPage;
          }
        };
      }

      return step;
    });

    return {
      ...config,
      steps: enhancedSteps
    };
  }

  /**
   * Check if a tour can start from the current page
   */
  canStartTourFromCurrentPage(config: SmartTourConfig): boolean {
    const currentPath = navigationHelper.getCurrentPath();

    // If no valid start pages defined, tour can start from anywhere
    if (!config.validStartPages || config.validStartPages.length === 0) {
      return true;
    }

    // Check if current page is in the valid start pages
    return config.validStartPages.some(page => navigationHelper.isOnPage(page));
  }

  /**
   * Get the best starting strategy for a tour
   */
  getTourStartStrategy(config: SmartTourConfig): 'direct' | 'navigate' | 'invalid' {
    const currentPath = navigationHelper.getCurrentPath();

    // If we're on the primary page, start directly
    if (config.primaryPage && navigationHelper.isOnPage(config.primaryPage)) {
      return 'direct';
    }

    // If we can start from current page, start directly
    if (this.canStartTourFromCurrentPage(config)) {
      return 'direct';
    }

    // If tour has a primary page, we need to navigate
    if (config.primaryPage) {
      return 'navigate';
    }

    // Tour cannot be started from current context
    return 'invalid';
  }
}

export const smartTourManager = new SmartTourManager();
