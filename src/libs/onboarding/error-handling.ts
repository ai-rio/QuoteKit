// Import types that we'll define inline to avoid conflicts
// import { OnboardingError, OnboardingContext } from '@/types/onboarding';

// Define types inline to avoid conflicts
interface OnboardingError {
  code: string;
  message: string;
  tourId?: string;
  stepId?: string;
  originalError?: Error;
  timestamp: Date;
  recoverable: boolean;
}

interface OnboardingContext {
  user: { id: string; role: string; registeredAt: Date; isNewUser: boolean };
  app: { route: string; features: string[]; theme: 'light' | 'dark'; isMobile: boolean };
  session: { sessionId: string; startedAt: Date; pageViews: number; interactions: number };
}

/**
 * Custom error class for onboarding-related errors
 */
export class OnboardingErrorClass extends Error {
  public readonly code: string;
  public readonly tourId?: string;
  public readonly stepId?: string;
  public readonly originalError?: Error;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;
  public readonly context?: OnboardingContext;

  constructor(
    code: string,
    message: string,
    options: {
      tourId?: string;
      stepId?: string;
      originalError?: Error;
      recoverable?: boolean;
      context?: OnboardingContext;
    } = {}
  ) {
    super(message);
    this.name = 'OnboardingError';
    this.code = code;
    this.tourId = options.tourId;
    this.stepId = options.stepId;
    this.originalError = options.originalError;
    this.timestamp = new Date();
    this.recoverable = options.recoverable ?? true;
    this.context = options.context;

    // Maintain proper stack trace for where the error was thrown (Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OnboardingErrorClass);
    }
  }

  /**
   * Convert to serializable OnboardingError interface
   */
  toSerializable(): OnboardingError {
    return {
      code: this.code,
      message: this.message,
      tourId: this.tourId,
      stepId: this.stepId,
      originalError: this.originalError,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
    };
  }

  /**
   * Create a user-friendly error message
   */
  toUserMessage(): string {
    switch (this.code) {
      case 'TOUR_NOT_FOUND':
        return 'The requested tour could not be found. Please try again or contact support.';
      case 'STEP_NOT_FOUND':
        return 'Unable to load the next step. Please try restarting the tour.';
      case 'ELEMENT_NOT_FOUND':
        return 'Cannot find the element to highlight. The page may have changed.';
      case 'VALIDATION_FAILED':
        return 'Please complete the required action before continuing.';
      case 'PERMISSION_DENIED':
        return 'You do not have permission to access this tour.';
      case 'TOUR_ALREADY_COMPLETED':
        return 'This tour has already been completed.';
      case 'BROWSER_NOT_SUPPORTED':
        return 'Your browser does not support this feature. Please update your browser.';
      case 'NETWORK_ERROR':
        return 'Network connection error. Please check your internet connection.';
      case 'STORAGE_ERROR':
        return 'Unable to save your progress. Please ensure local storage is enabled.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

/**
 * Error codes for different types of onboarding errors
 */
export const OnboardingErrorCodes = {
  // Configuration errors
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_STEP_CONFIGURATION: 'INVALID_STEP_CONFIGURATION',

  // Runtime errors
  TOUR_NOT_FOUND: 'TOUR_NOT_FOUND',
  STEP_NOT_FOUND: 'STEP_NOT_FOUND',
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // Permission errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FEATURE_NOT_ENABLED: 'FEATURE_NOT_ENABLED',
  TOUR_ALREADY_COMPLETED: 'TOUR_ALREADY_COMPLETED',

  // Browser/environment errors
  BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
  STORAGE_NOT_AVAILABLE: 'STORAGE_NOT_AVAILABLE',
  DOM_NOT_READY: 'DOM_NOT_READY',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',

  // Analytics errors
  ANALYTICS_ERROR: 'ANALYTICS_ERROR',
  TRACKING_FAILED: 'TRACKING_FAILED',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
} as const;

export type OnboardingErrorCode = keyof typeof OnboardingErrorCodes;

/**
 * Error recovery strategies
 */
export interface ErrorRecoveryStrategy {
  canRecover: (error: OnboardingErrorClass) => boolean;
  recover: (error: OnboardingErrorClass) => Promise<boolean>;
  description: string;
}

/**
 * Built-in recovery strategies
 */
export const recoveryStrategies: Record<string, ErrorRecoveryStrategy> = {
  retryAfterDelay: {
    canRecover: (error) => 
      [OnboardingErrorCodes.NETWORK_ERROR, OnboardingErrorCodes.TIMEOUT_ERROR].includes(error.code as any),
    recover: async (error) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    },
    description: 'Retry after a short delay'
  },

  waitForElement: {
    canRecover: (error) => error.code === OnboardingErrorCodes.ELEMENT_NOT_FOUND,
    recover: async (error) => {
      if (!error.stepId) return false;
      
      // Wait up to 5 seconds for element to appear
      const maxWait = 5000;
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWait) {
        const element = document.querySelector(`[data-tour-step="${error.stepId}"]`);
        if (element) return true;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return false;
    },
    description: 'Wait for element to appear in the DOM'
  },

  skipStep: {
    canRecover: (error) => 
      [OnboardingErrorCodes.ELEMENT_NOT_FOUND, OnboardingErrorCodes.VALIDATION_FAILED].includes(error.code as any),
    recover: async () => {
      // This will be handled by the tour manager
      return true;
    },
    description: 'Skip the problematic step'
  },

  restartTour: {
    canRecover: (error) => error.recoverable && error.tourId !== undefined,
    recover: async () => {
      // This will be handled by the tour manager
      return true;
    },
    description: 'Restart the entire tour'
  }
};

/**
 * Error handler that attempts recovery
 */
export async function handleOnboardingError(
  error: OnboardingErrorClass,
  strategies: ErrorRecoveryStrategy[] = Object.values(recoveryStrategies)
): Promise<{ recovered: boolean; strategy?: string; newError?: OnboardingErrorClass }> {
  console.error('Onboarding error occurred:', error);

  // Try each recovery strategy
  for (const strategy of strategies) {
    if (strategy.canRecover(error)) {
      try {
        const recovered = await strategy.recover(error);
        if (recovered) {
          console.log(`Error recovered using strategy: ${strategy.description}`);
          return { recovered: true, strategy: strategy.description };
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy failed: ${strategy.description}`, recoveryError);
        return {
          recovered: false,
          newError: new OnboardingErrorClass(
            OnboardingErrorCodes.UNKNOWN_ERROR,
            `Recovery failed: ${strategy.description}`,
            {
              originalError: recoveryError as Error,
              recoverable: false,
              tourId: error.tourId,
              stepId: error.stepId,
            }
          )
        };
      }
    }
  }

  return { recovered: false };
}

/**
 * Utility to create common onboarding errors
 */
export const createOnboardingError = {
  tourNotFound: (tourId: string) =>
    new OnboardingErrorClass(
      OnboardingErrorCodes.TOUR_NOT_FOUND,
      `Tour not found: ${tourId}`,
      { tourId, recoverable: false }
    ),

  stepNotFound: (tourId: string, stepId: string) =>
    new OnboardingErrorClass(
      OnboardingErrorCodes.STEP_NOT_FOUND,
      `Step not found: ${stepId} in tour ${tourId}`,
      { tourId, stepId, recoverable: true }
    ),

  elementNotFound: (tourId: string, stepId: string, selector: string) =>
    new OnboardingErrorClass(
      OnboardingErrorCodes.ELEMENT_NOT_FOUND,
      `Element not found: ${selector} for step ${stepId}`,
      { tourId, stepId, recoverable: true }
    ),

  validationFailed: (tourId: string, stepId: string, reason: string) =>
    new OnboardingErrorClass(
      OnboardingErrorCodes.VALIDATION_FAILED,
      `Validation failed for step ${stepId}: ${reason}`,
      { tourId, stepId, recoverable: true }
    ),

  permissionDenied: (tourId: string, reason: string) =>
    new OnboardingErrorClass(
      OnboardingErrorCodes.PERMISSION_DENIED,
      `Permission denied for tour ${tourId}: ${reason}`,
      { tourId, recoverable: false }
    ),

  storageError: (operation: string, originalError: Error) =>
    new OnboardingErrorClass(
      OnboardingErrorCodes.STORAGE_ERROR,
      `Storage operation failed: ${operation}`,
      { originalError, recoverable: true }
    ),

  networkError: (operation: string, originalError: Error) =>
    new OnboardingErrorClass(
      OnboardingErrorCodes.NETWORK_ERROR,
      `Network operation failed: ${operation}`,
      { originalError, recoverable: true }
    ),

  configError: (field: string, value: any) =>
    new OnboardingErrorClass(
      OnboardingErrorCodes.INVALID_CONFIG,
      `Invalid configuration: ${field} = ${JSON.stringify(value)}`,
      { recoverable: false }
    ),
};

/**
 * Global error boundary for onboarding errors
 */
export function createErrorBoundary() {
  const originalConsoleError = console.error;
  
  return {
    install: () => {
      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason instanceof OnboardingErrorClass) {
          console.warn('Unhandled onboarding error:', event.reason);
          handleOnboardingError(event.reason);
          event.preventDefault();
        }
      });

      // Override console.error to catch driver.js errors
      console.error = (...args) => {
        const errorMessage = args.join(' ');
        if (errorMessage.includes('driver') || errorMessage.includes('popover')) {
          const error = new OnboardingErrorClass(
            OnboardingErrorCodes.UNKNOWN_ERROR,
            errorMessage,
            { recoverable: true }
          );
          handleOnboardingError(error);
        }
        originalConsoleError.apply(console, args);
      };
    },

    uninstall: () => {
      console.error = originalConsoleError;
      // Note: removeEventListener for unhandledrejection would need reference to the handler
    }
  };
}

/**
 * Validation utilities for error prevention
 */
export const validation = {
  isValidTourId: (tourId: string): boolean => {
    return typeof tourId === 'string' && tourId.length > 0 && /^[a-zA-Z0-9_-]+$/.test(tourId);
  },

  isValidStepId: (stepId: string): boolean => {
    return typeof stepId === 'string' && stepId.length > 0 && /^[a-zA-Z0-9_-]+$/.test(stepId);
  },

  isElementVisible: (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0;
  },

  hasRequiredPermissions: (tourId: string, userRoles: string[], requiredRoles?: string[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.some(role => userRoles.includes(role));
  },

  isStorageAvailable: (): boolean => {
    try {
      const test = 'onboarding_storage_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  isBrowserSupported: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(
      window.localStorage &&
      typeof window.addEventListener === 'function' &&
      typeof document?.querySelector === 'function' &&
      window.Promise
    );
  }
};