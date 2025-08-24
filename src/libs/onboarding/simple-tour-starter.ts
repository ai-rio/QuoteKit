/**
 * UPDATED: Simplified Tour Starter with Close Button Removed
 * 
 * Clean UX approach:
 * - ESC key and outside clicks handle tour exit
 * - Done button on final step handles tour completion  
 * - No close (X) button to eliminate conflicts
 */

import { driver } from "driver.js";

import type { TourConfig } from "@/libs/onboarding/tour-manager";

// Global reference to active driver instance for cleanup
let activeDriverInstance: ReturnType<typeof driver> | null = null;

// REMOVED: Enhanced positioning function that was causing button issues
// Using Driver.js native positioning instead

export interface SimpleTourCallbacks {
  onCompleted?: (tourId: string) => void;
  onSkipped?: (tourId: string) => void;
  onDestroyed?: (tourId: string) => void;
  onStepChange?: (currentStep: number, totalSteps: number) => void;
}

/**
 * CRITICAL FIX: Simplified tour starter with minimal customizations
 * Removed all complex positioning and styling that was breaking buttons
 */
export function startTour(tourConfig: TourConfig, callbacks?: SimpleTourCallbacks): void {
  console.log(`🚀 SIMPLIFIED: Starting tour: ${tourConfig.id}`);

  // Clean up any existing tour first
  if (activeDriverInstance?.isActive()) {
    console.log('🧹 Cleaning up existing active tour');
    activeDriverInstance.destroy();
  }

  // Convert steps to simple Driver.js format
  const driverSteps = tourConfig.steps.map((step: any, index: number) => {
    const isLastStep = index === tourConfig.steps.length - 1;
    
    return {
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.position || 'bottom',
        align: step.align || 'start',
        showButtons: isLastStep 
          ? ['previous', 'close'] // Last step shows Done button (close = Done)
          : ['next', 'previous'] // Regular steps have no close button
      }
    };
  });

  // CRITICAL: Minimal Driver.js configuration - no complex customizations
  const driverObj = driver({
    // Basic settings only
    showProgress: true,
    progressText: "Step {{current}} of {{total}}",
    allowClose: true,
    allowKeyboardControl: true,
    overlayClickBehavior: 'close' as 'close',
    animate: true,
    smoothScroll: true,
    
    // Basic button configuration (no close button)
    nextBtnText: 'Next',
    prevBtnText: 'Previous',
    doneBtnText: 'Done',
    // Note: showButtons is set per step above to show Done only on last step
    
    // Simple steps - no complex modifications
    steps: driverSteps,
    
    // Minimal event handlers
    onDestroyed: () => {
      console.log(`✅ Tour destroyed: ${tourConfig.id}`);
      activeDriverInstance = null;
      if (callbacks?.onDestroyed) {
        callbacks.onDestroyed(tourConfig.id);
      }
    },
    
    // Basic step tracking
    onHighlighted: (element, step, options) => {
      const stepIndex = options?.state?.activeIndex || 0;
      console.log(`✨ Step ${stepIndex + 1} of ${driverSteps.length}`);
      
      if (callbacks?.onStepChange) {
        callbacks.onStepChange(stepIndex + 1, driverSteps.length);
      }
    },
    
    // Done button detection (only on last step)
    onCloseClick: (element, step, options) => {
      // This will only be called for Done button on last step
      console.log(`🎉 Tour completed: ${tourConfig.id}`);
      if (callbacks?.onCompleted) {
        callbacks.onCompleted(tourConfig.id);
      }
    }
  });

  // Store reference and start tour
  activeDriverInstance = driverObj;

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