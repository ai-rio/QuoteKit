import { Config as DriverConfig,driver, DriveStep } from 'driver.js';

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

// UPDATED: Enhanced configuration with close button removed for cleaner UX
// Tour exit: ESC key, outside clicks | Tour completion: Done button on final step
export const defaultDriverConfig: Partial<DriverConfig> = {
  animate: true,
  smoothScroll: true,
  showButtons: ['next', 'previous'], // Remove close button from default buttons
  allowClose: true,
  allowKeyboardControl: true, // Enable ESC key to close tour
  disableActiveInteraction: false,
  overlayClickBehavior: 'close' as 'close', // Allow clicking overlay to close tour
  
  // Enhanced popover configuration for better positioning
  popoverClass: 'lawnquote-driver-popover enhanced-positioning',
  popoverOffset: 12, // Slightly larger offset for better visibility
  stagePadding: 8, // Consistent padding around highlighted elements
  stageRadius: 8, // Smooth rounded corners
  
  // Progress configuration
  showProgress: true,
  progressText: 'Step {{current}} of {{total}}',
  
  // Navigation buttons with better UX text
  nextBtnText: 'Next',
  prevBtnText: 'Previous', 
  doneBtnText: 'Done',
  // Close button removed - using ESC key and outside clicks instead
  
  // Enhanced callbacks for smooth positioning and proper cleanup
  onHighlightStarted: (element?: Element, step?: any) => {
    console.log('🎯 Step highlighting started:', step?.element || 'no element');
    
    // Ensure element is optimally positioned
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  },
  
  onHighlighted: (element?: Element, step?: any) => {
    console.log('✅ Step highlighted:', step?.element || 'no element');
    
    // Apply positioning enhancements after highlight
    setTimeout(() => {
      const popover = document.querySelector('.driver-popover');
      if (popover) {
        enhancePopoverPositioning(popover as HTMLElement);
      }
    }, 50);
  },
  
  onDeselected: (element?: Element) => {
    console.log('⬅️ Step deselected');
  },
  
  onDestroyed: () => {
    console.log('🏁 Tour completed/closed');
    // Clean up any positioning enhancements
    cleanupPositioningEnhancements();
  },
};

// Enhanced positioning functions for smooth modal follow behavior
function enhancePopoverPositioning(popover: HTMLElement) {
  // CRITICAL FIX: Add null checks to prevent crashes
  if (!popover || !popover.classList || !popover.style) {
    console.warn('⚠️ Popover element is null or missing properties - skipping positioning');
    return;
  }
  
  try {
    // Add smooth positioning class
    popover.classList.add('enhanced-tour-positioning');
    
    // Ensure popover follows highlighted element smoothly
    popover.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    popover.style.willChange = 'transform';
  
  // Apply responsive positioning logic
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  // Adjust positioning based on viewport size
  if (viewport.width < 768) {
    // Mobile: prefer bottom positioning with center align
    popover.style.maxWidth = 'calc(100vw - 2rem)';
    popover.style.margin = '1rem';
  } else if (viewport.width < 1024) {
    // Tablet: balanced positioning
    popover.style.maxWidth = '400px';
  } else {
    // Desktop: full positioning options
    popover.style.maxWidth = '450px';
  }
  
  // Ensure popover doesn't get cut off
  const popoverRect = popover.getBoundingClientRect();
  const padding = 16;
  
  // Adjust horizontal position if needed
  if (popoverRect.left < padding) {
    popover.style.left = `${padding}px`;
  } else if (popoverRect.right > viewport.width - padding) {
    popover.style.right = `${padding}px`;
    popover.style.left = 'auto';
  }
  
  // Adjust vertical position if needed
  if (popoverRect.top < padding) {
    popover.style.top = `${padding}px`;
  } else if (popoverRect.bottom > viewport.height - padding) {
    popover.style.bottom = `${padding}px`;
    popover.style.top = 'auto';
  }
  
    console.log('✨ Enhanced popover positioning applied');
  } catch (error) {
    console.error('❌ Error enhancing popover positioning:', error);
    // Continue without positioning enhancements to prevent crash
  }
}

function cleanupPositioningEnhancements() {
  // Remove enhanced positioning classes
  document.querySelectorAll('.enhanced-tour-positioning').forEach(el => {
    el.classList.remove('enhanced-tour-positioning');
  });
  
  console.log('🧹 Cleaned up positioning enhancements');
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