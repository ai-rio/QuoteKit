/**
 * Simple Tour Starter - Following Official Driver.js Documentation
 * 
 * Based on official patterns from driver.js documentation:
 * https://driverjs.com/docs/basic-usage
 * 
 * Official Pattern:
 * import { driver } from "driver.js";
 * import "driver.js/dist/driver.css";
 * 
 * const driverObj = driver({
 *   showProgress: true,
 *   steps: [
 *     { element: '.selector', popover: { title: 'Title', description: 'Description' } }
 *   ]
 * });
 * 
 * driverObj.drive();
 */

import "driver.js/dist/driver.css";

import { driver } from "driver.js";

import type { TourConfig } from "@/libs/onboarding/tour-manager";

// Global reference to active driver instance for cleanup
let activeDriverInstance: ReturnType<typeof driver> | null = null;

export interface SimpleTourCallbacks {
  onCompleted?: (tourId: string) => void;
  onSkipped?: (tourId: string) => void;
  onDestroyed?: (tourId: string) => void;
}

/**
 * Start a tour using official Driver.js patterns
 * 
 * This function follows the exact patterns from the official documentation:
 * 1. Import driver function and CSS
 * 2. Create driver instance with configuration
 * 3. Call drive() to start the tour
 * 
 * @param tourConfig - Our internal tour configuration
 * @param callbacks - Optional callbacks for tour events
 */
export function startTour(tourConfig: TourConfig, callbacks?: SimpleTourCallbacks): void {
  console.log(`🚀 Starting tour using official driver.js pattern: ${tourConfig.id}`);

  // Clean up any existing tour first (official best practice)
  if (activeDriverInstance?.isActive()) {
    console.log('🧹 Cleaning up existing active tour');
    activeDriverInstance.destroy();
  }

  // Convert our TourStep format to official Driver.js DriveStep format
  // Following the official documentation structure exactly
  const driverSteps = tourConfig.steps.map((step: any) => ({
    // Element selector (official property)
    element: step.element,
    
    // Popover configuration (official structure)
    popover: {
      title: step.title,
      description: step.description,
      side: step.position || 'bottom',  // Official position property
      align: step.align || 'start',     // Official align property
    }
  }));

  // Create driver instance using official configuration structure
  // Following exact patterns from the official documentation
  const driverObj = driver({
    // Progress configuration (official options)
    showProgress: tourConfig.showProgress ?? true,
    progressText: "{{current}} of {{total}}",
    
    // Control options (official options)
    allowClose: tourConfig.allowClose ?? true,
    allowKeyboardControl: true,
    
    // Animation and styling (official options)
    animate: true,
    smoothScroll: true,
    
    // Overlay configuration (official options)
    overlayOpacity: 0.6,
    stagePadding: 8,
    stageRadius: 6,
    
    // Button configuration (official options)
    showButtons: ['next', 'previous', 'close'],
    nextBtnText: 'Next',
    prevBtnText: 'Previous',
    doneBtnText: 'Done',
    
    // Steps array (official property)
    steps: driverSteps,
    
    // Global event handlers (official callbacks)
    onDestroyed: () => {
      console.log(`✅ Tour destroyed: ${tourConfig.id}`);
      activeDriverInstance = null;
      
      // Call appropriate callback based on tour state
      if (callbacks?.onDestroyed) {
        callbacks.onDestroyed(tourConfig.id);
      }
    },
    
    onDestroyStarted: () => {
      console.log(`🏁 Tour destruction started: ${tourConfig.id}`);
    },
    
    // Handle close button clicks specifically
    onCloseClick: () => {
      console.log(`🔴 Tour close button clicked: ${tourConfig.id}`);
      // Force destroy the tour immediately since driver.js close button isn't working properly
      if (activeDriverInstance?.isActive()) {
        console.log(`🧹 Force destroying active tour: ${tourConfig.id}`);
        activeDriverInstance.destroy();
      }
    }
  });

  // Store reference for cleanup
  activeDriverInstance = driverObj;

  // Start the tour using official method
  // According to docs: driverObj.drive() starts the tour
  try {
    driverObj.drive();
    console.log(`✅ Tour started successfully: ${tourConfig.id}`);
  } catch (error) {
    console.error(`❌ Error starting tour ${tourConfig.id}:`, error);
    activeDriverInstance = null;
    throw error;
  }
}

/**
 * Check if a tour is currently active
 * Using official Driver.js isActive() method
 */
export function isTourActive(): boolean {
  return activeDriverInstance?.isActive() ?? false;
}

/**
 * Destroy the current active tour
 * Using official Driver.js destroy() method
 */
export function destroyActiveTour(): void {
  if (activeDriverInstance?.isActive()) {
    console.log('🛑 Destroying active tour');
    activeDriverInstance.destroy();
  }
}

/**
 * Get current tour state using official Driver.js methods
 */
export function getCurrentTourState() {
  if (!activeDriverInstance?.isActive()) {
    return null;
  }

  return {
    isActive: activeDriverInstance.isActive(),
    currentStep: activeDriverInstance.getActiveIndex(),
    totalSteps: activeDriverInstance.getConfig()?.steps?.length ?? 0,
    hasNext: activeDriverInstance.hasNextStep(),
    hasPrevious: activeDriverInstance.hasPreviousStep(),
    isFirst: activeDriverInstance.isFirstStep(),
    isLast: activeDriverInstance.isLastStep()
  };
}

/**
 * Manual tour navigation using official Driver.js methods
 */
export const tourNavigation = {
  moveNext: () => activeDriverInstance?.moveNext(),
  movePrevious: () => activeDriverInstance?.movePrevious(),
  moveTo: (stepIndex: number) => activeDriverInstance?.moveTo(stepIndex),
  refresh: () => activeDriverInstance?.refresh()
};

/**
 * Helper function to validate tour configuration before starting
 * Ensures all required elements exist before starting tour
 */
export function validateTourElements(tourConfig: TourConfig): { valid: boolean; missingElements: string[] } {
  const missingElements: string[] = [];
  
  if (typeof document === 'undefined') {
    return { valid: false, missingElements: ['Document not available (SSR)'] };
  }

  tourConfig.steps.forEach((step: any, index: number) => {
    if (step.element && typeof step.element === 'string') {
      // Handle multiple selector fallbacks (comma-separated)
      const selectors = step.element.split(',').map((s: string) => s.trim());
      let found = false;
      
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            found = true;
            break;
          }
        } catch (e) {
          console.warn(`Invalid selector in step ${step.id || index + 1}: ${selector}`, e);
        }
      }
      
      if (!found) {
        missingElements.push(`Step ${index + 1} (${step.id || 'unnamed'}): ${step.element}`);
      }
    }
  });

  const isValid = missingElements.length === 0;
  
  // Enhanced logging for debugging
  if (!isValid) {
    console.log(`🔍 Tour validation details for ${tourConfig.id}:`);
    console.log(`  - Current URL: ${window.location.href}`);
    console.log(`  - Missing elements: ${missingElements.length}`);
    console.log(`  - Total steps with elements: ${tourConfig.steps.filter(s => s.element).length}`);
    console.log(`  - Missing details:`, missingElements);
  } else {
    console.log(`✅ Tour validation passed for ${tourConfig.id} (${tourConfig.steps.filter(s => s.element).length} elements found)`);
  }

  return {
    valid: isValid,
    missingElements
  };
}

/**
 * Start tour with validation
 * Validates elements exist before starting the tour
 */
export function startTourWithValidation(
  tourConfig: TourConfig, 
  callbacks?: SimpleTourCallbacks,
  options?: { skipValidation?: boolean; retryAttempts?: number }
): void {
  const { skipValidation = false, retryAttempts = 1 } = options || {};

  if (!skipValidation) {
    // Check if this is a navigation-based tour (tours that handle their own navigation)
    const hasNavigationSteps = tourConfig.steps.some(step => 
      step.onBeforeHighlight || 
      step.id.includes('navigation') ||
      step.id.includes('welcome-overview') ||
      step.id.includes('intro')
    );

    // For navigation-based tours, be more permissive with validation
    if (hasNavigationSteps) {
      console.log(`🧭 Navigation-based tour detected: ${tourConfig.id}, allowing start with relaxed validation`);
      
      // Only validate critical structural elements, not page-specific ones
      const criticalSteps = tourConfig.steps.filter(step => 
        step.element && 
        !step.validation && // Skip steps with custom validation
        !step.onBeforeHighlight && // Skip steps that handle their own navigation
        !step.id.includes('navigation') &&
        !step.id.includes('welcome-overview')
      );

      if (criticalSteps.length > 0) {
        const validation = validateTourElements({ ...tourConfig, steps: criticalSteps });
        
        if (!validation.valid) {
          console.warn(`⚠️ Some elements not available yet for ${tourConfig.id}, but tour will handle navigation:`, validation.missingElements);
          
          // For navigation-based tours, we allow the tour to start and handle missing elements gracefully
          // Only fail if retries are exhausted AND no navigation is possible
          if (retryAttempts > 0) {
            console.log(`🔄 Retrying navigation-based tour start in 1000ms (${retryAttempts} attempts remaining)`);
            setTimeout(() => {
              startTourWithValidation(tourConfig, callbacks, { 
                skipValidation, 
                retryAttempts: retryAttempts - 1 
              });
            }, 1000);
            return;
          } else {
            // Last attempt - start anyway and let the tour handle navigation/missing elements
            console.log(`🎯 Starting navigation-based tour ${tourConfig.id} with graceful error handling`);
          }
        }
      }
    } else {
      // For non-navigation tours, use strict validation
      const validation = validateTourElements(tourConfig);
      
      if (!validation.valid) {
        console.warn(`⚠️ Tour validation failed for ${tourConfig.id}:`, validation.missingElements);
        
        if (retryAttempts > 0) {
          console.log(`🔄 Retrying tour start in 500ms (${retryAttempts} attempts remaining)`);
          setTimeout(() => {
            startTourWithValidation(tourConfig, callbacks, { 
              skipValidation, 
              retryAttempts: retryAttempts - 1 
            });
          }, 500);
          return;
        } else {
          console.error(`❌ Tour start failed after retries: ${tourConfig.id}`);
          
          // Show helpful error message to user using proper import
          const errorMessage = `The "${tourConfig.name || tourConfig.id}" tour cannot start from this page. ` +
            `${tourConfig.id === 'quote-creation' ? 'Please navigate to the Quotes page first, or try starting the tour from the Dashboard.' : 
              'Please make sure you\'re on the correct page for this tour.'}`;
          
          // Use the imported showTourError function
          try {
            const { showTourError } = require('@/libs/onboarding/tour-error-handler');
            if (typeof showTourError === 'function') {
              showTourError(errorMessage, { type: 'warning', duration: 5000 });
            } else {
              console.warn('Tour Error:', errorMessage);
              if (typeof document !== 'undefined') {
                setTimeout(() => alert(errorMessage), 100);
              }
            }
          } catch (e) {
            console.warn('Could not load tour error handler:', e);
            console.warn('Tour Error:', errorMessage);
            if (typeof document !== 'undefined') {
              setTimeout(() => alert(errorMessage), 100);
            }
          }
          return;
        }
      }
    }
  }

  // Enhanced error handling for tour start
  try {
    console.log(`🚀 Starting tour: ${tourConfig.id}`);
    startTour(tourConfig, callbacks);
  } catch (error) {
    console.error(`❌ Error starting tour ${tourConfig.id}:`, error);
    
    // Show user-friendly error message
    const errorMessage = `There was an issue starting the "${tourConfig.name || tourConfig.id}" tour. Please try refreshing the page.`;
    try {
      const { showTourError } = require('@/libs/onboarding/tour-error-handler');
      if (typeof showTourError === 'function') {
        showTourError(errorMessage, { type: 'error', duration: 5000 });
      } else {
        console.warn('Tour Start Error:', errorMessage);
        if (typeof document !== 'undefined') {
          setTimeout(() => alert(errorMessage), 100);
        }
      }
    } catch (e) {
      console.warn('Could not load tour error handler:', e);
      console.warn('Tour Start Error:', errorMessage);
      if (typeof document !== 'undefined') {
        setTimeout(() => alert(errorMessage), 100);
      }
    }
  }
}