import { Config as DriverConfig,driver, DriveStep } from 'driver.js';

// Import CSS only in browser environment
if (typeof window !== 'undefined') {
  require('driver.js/dist/driver.css');
}

// Custom types for enhanced TypeScript support
export interface TourStep extends DriveStep {
  id: string;
  title: string;
  description: string;
  showProgress?: boolean;
  allowClose?: boolean;
  onNextClick?: () => void;
  onPrevClick?: () => void;
  onCloseClick?: () => void;
}

export interface TourConfig extends Omit<DriverConfig, 'steps'> {
  tourId: string;
  steps: TourStep[];
  analytics?: {
    trackStart?: boolean;
    trackComplete?: boolean;
    trackSkip?: boolean;
    trackStepView?: boolean;
  };
}

export interface TourState {
  currentStep: number;
  totalSteps: number;
  isActive: boolean;
  tourId: string;
  startedAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;
}

// Custom configuration matching LawnQuote design system
export const defaultDriverConfig: Partial<DriverConfig> = {
  animate: true,
  smoothScroll: true,
  allowClose: true,
  // allowClickMaskNextStep: false, // Property may not exist in all driver.js versions
  allowKeyboardControl: false, // CRITICAL FIX: Disable to prevent ESC key conflicts
  disableActiveInteraction: false,
  overlayClickBehavior: 'close' as 'close', // Allow closing on overlay click
  
  // Custom popover configuration
  popoverClass: 'lawnquote-driver-popover',
  popoverOffset: 10,
  
  // Progress configuration
  showProgress: true,
  progressText: '{{current}} of {{total}}',
  
  // Navigation buttons
  nextBtnText: 'Next →',
  prevBtnText: '← Previous',
  doneBtnText: 'Got it!',
  
  // Callbacks for analytics and state management
  // Note: onInitialized is not a valid driver.js config property
  
  onHighlightStarted: (element?: Element) => {
    console.log('Step highlighted:', element);
    // CRITICAL FIX: Ensure modals and high z-index elements stay interactive
    fixModalInteractions();
  },
  
  onHighlighted: (element?: Element) => {
    console.log('Step shown:', element);
    // CRITICAL FIX: Re-fix modal interactions after each step
    setTimeout(() => fixModalInteractions(), 100);
  },
  
  onDeselected: (element?: Element) => {
    console.log('Step deselected:', element);
  },
  
  onDestroyed: () => {
    console.log('Tour ended');
    // CRITICAL FIX: Restore normal event handling
    restoreModalInteractions();
  },
};

// CRITICAL FIX: Modal interaction fix functions
function fixModalInteractions() {
  if (typeof window === 'undefined') return;
  
  // Set up custom ESC key handler that works with driver.js
  const handleEscKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.keyCode === 27) {
      // Check if there's an open modal first (higher priority)
      const openModal = document.querySelector('[data-radix-dialog-content][data-state="open"], [role="dialog"][aria-modal="true"]');
      if (openModal) {
        // Let the modal handle the ESC key
        return;
      }
      
      // Otherwise, close the tour
      const driverInstance = (window as any).driver;
      if (driverInstance && typeof driverInstance.destroy === 'function') {
        event.preventDefault();
        event.stopPropagation();
        driverInstance.destroy();
      }
    }
  };
  
  // Remove any existing listener first
  document.removeEventListener('keydown', handleEscKey, true);
  // Add with capture to ensure it runs before driver.js handlers
  document.addEventListener('keydown', handleEscKey, true);
  
  // Store reference for cleanup
  (window as any).__driverEscHandler = handleEscKey;
  
  // Fix modal z-index and pointer events immediately
  setTimeout(() => {
    const modals = document.querySelectorAll(`
      [data-radix-dialog-content],
      [role="dialog"],
      [aria-modal="true"],
      .fixed.inset-0.z-50
    `);
    
    modals.forEach((modal) => {
      const el = modal as HTMLElement;
      el.style.zIndex = '10010'; // Higher than driver.js
      el.style.pointerEvents = 'auto';
      el.style.position = 'fixed';
      
      // Fix all buttons within modals
      const buttons = el.querySelectorAll('button, [role="button"]');
      buttons.forEach((btn) => {
        const button = btn as HTMLElement;
        button.style.pointerEvents = 'auto';
        button.style.zIndex = '10011';
        button.style.position = 'relative';
      });
    });
    
    // Ensure modal overlays are also properly positioned - FIXED CSS SELECTORS
    const overlays = document.querySelectorAll(`
      [data-radix-dialog-overlay],
      .fixed.inset-0[class*="bg-black"],
      .fixed.inset-0[class*="bg-background"]
    `);
    
    overlays.forEach((overlay) => {
      const el = overlay as HTMLElement;
      el.style.zIndex = '10009'; // Just below modal content
      el.style.pointerEvents = 'auto';
    });
    
    console.log('🔧 Fixed modal interactions - found', modals.length, 'modals and', overlays.length, 'overlays');
  }, 50);
}

function restoreModalInteractions() {
  if (typeof window === 'undefined') return;
  
  // Remove custom ESC handler
  const handler = (window as any).__driverEscHandler;
  if (handler) {
    document.removeEventListener('keydown', handler, true);
    delete (window as any).__driverEscHandler;
  }
  
  console.log('🔧 Restored normal modal interactions');
}

// Error handling wrapper
export class TourError extends Error {
  constructor(
    message: string,
    public tourId?: string,
    public stepId?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'TourError';
  }
}

// Enhanced driver instance with error handling
export function createTourDriver(config: TourConfig): ReturnType<typeof driver> {
  try {
    const mergedConfig: DriverConfig = {
      ...defaultDriverConfig,
      ...config,
      steps: config.steps.map((step, index) => ({
        ...step,
        popover: {
          title: step.title,
          description: step.description,
          showProgress: step.showProgress ?? defaultDriverConfig.showProgress,
          ...step.popover,
        },
      })),
    };

    const driverInstance = driver(mergedConfig);

    // Add error handling to the driver instance
    const originalStart = driverInstance.drive.bind(driverInstance);
    driverInstance.drive = function(stepIndex?: number) {
      try {
        return originalStart(stepIndex);
      } catch (error) {
        throw new TourError(
          `Failed to start tour: ${config.tourId}`,
          config.tourId,
          undefined,
          error as Error
        );
      }
    };

    return driverInstance;
  } catch (error) {
    throw new TourError(
      `Failed to create tour driver: ${config.tourId}`,
      config.tourId,
      undefined,
      error as Error
    );
  }
}

// Utility function to validate tour configuration
export function validateTourConfig(config: TourConfig): string[] {
  const errors: string[] = [];
  
  if (!config.tourId || config.tourId.trim() === '') {
    errors.push('Tour ID is required');
  }
  
  if (!config.steps || config.steps.length === 0) {
    errors.push('At least one step is required');
  }
  
  config.steps?.forEach((step, index) => {
    if (!step.id || step.id.trim() === '') {
      errors.push(`Step ${index + 1}: ID is required`);
    }
    
    if (!step.title || step.title.trim() === '') {
      errors.push(`Step ${index + 1}: Title is required`);
    }
    
    if (!step.description || step.description.trim() === '') {
      errors.push(`Step ${index + 1}: Description is required`);
    }
    
    if (!step.element && !step.popover?.description) {
      errors.push(`Step ${index + 1}: Either element selector or popover description is required`);
    }
  });
  
  return errors;
}

// Storage utilities for tour state persistence
export const tourStorage = {
  getCompletedTours(): string[] {
    try {
      const completed = localStorage.getItem('lawnquote_completed_tours');
      return completed ? JSON.parse(completed) : [];
    } catch {
      return [];
    }
  },
  
  markTourCompleted(tourId: string): void {
    try {
      const completed = this.getCompletedTours();
      if (!completed.includes(tourId)) {
        completed.push(tourId);
        localStorage.setItem('lawnquote_completed_tours', JSON.stringify(completed));
      }
    } catch (error) {
      console.warn('Failed to save tour completion state:', error);
    }
  },
  
  isTourCompleted(tourId: string): boolean {
    return this.getCompletedTours().includes(tourId);
  },
  
  resetTourProgress(tourId?: string): void {
    try {
      if (tourId) {
        const completed = this.getCompletedTours();
        const filtered = completed.filter(id => id !== tourId);
        localStorage.setItem('lawnquote_completed_tours', JSON.stringify(filtered));
      } else {
        localStorage.removeItem('lawnquote_completed_tours');
      }
    } catch (error) {
      console.warn('Failed to reset tour progress:', error);
    }
  }
};