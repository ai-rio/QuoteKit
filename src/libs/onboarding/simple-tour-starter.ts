/**
 * Simple Tour Starter - Following Official Driver.js Documentation
 * 
 * Based on official patterns from Context7 documentation:
 * https://github.com/kamranahmedse/driver.js
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
      showButtons: step.showButtons || ['next', 'previous', 'close'] // Official buttons
    },
    
    // Step lifecycle hooks (official callbacks)
    onHighlighted: step.onAfterHighlight ? (element?: Element) => {
      step.onAfterHighlight!(element);
    } : undefined,
    
    onDeselected: step.onBeforeHighlight ? (element?: Element) => {
      // We'll use onDeselected for cleanup when leaving a step
    } : undefined
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
    overlayOpacity: 0.6, // Enhanced from 0.1 for better contrast
    stagePadding: 8,
    stageRadius: 6,
    
    // Button configuration (official options)
    showButtons: ['next', 'previous', 'close'],
    nextBtnText: 'Next',
    prevBtnText: 'Previous',
    doneBtnText: 'Done',
    // Note: closeBtnText may not be in latest driver.js - using doneBtnText instead
    
    // Steps array (official property)
    steps: driverSteps,
    
    // Global event handlers (official callbacks)
    onDestroyed: () => {
      console.log(`✅ Tour destroyed: ${tourConfig.id}`);
      activeDriverInstance = null;
      
      // Determine if tour was completed or skipped
      // According to official docs, onDestroyed is called for both completion and skip
      const wasCompleted = !driverObj.hasNextStep(); // No next step = completed
      
      if (wasCompleted) {
        console.log(`🎉 Tour completed: ${tourConfig.id}`);
        callbacks?.onCompleted?.(tourConfig.id);
      } else {
        console.log(`⏭️ Tour skipped: ${tourConfig.id}`);
        callbacks?.onSkipped?.(tourConfig.id);
      }
      
      callbacks?.onDestroyed?.(tourConfig.id);
    },
    
    onDestroyStarted: () => {
      console.log(`🏁 Tour destruction started: ${tourConfig.id}`);
    },
    
    // Navigation hooks (official callbacks)
    onNextClick: (element, step, options) => {
      // Use default behavior - just move to next step
      // Official docs show this is optional for default behavior
      driverObj.moveNext();
    },
    
    onPrevClick: (element, step, options) => {
      // Use default behavior - just move to previous step
      // Official docs show this is optional for default behavior
      driverObj.movePrevious();
    },
    
    onCloseClick: (element, step, options) => {
      // Use default behavior - destroy the tour
      // Official docs show this is optional for default behavior
      driverObj.destroy();
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
      const element = document.querySelector(step.element);
      if (!element) {
        missingElements.push(`Step ${index + 1}: ${step.element}`);
      }
    }
  });

  return {
    valid: missingElements.length === 0,
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
        return;
      }
    }
  }

  startTour(tourConfig, callbacks);
}