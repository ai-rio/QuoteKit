/**
 * LawnQuote Onboarding System
 * 
 * A comprehensive onboarding and user tour system built on driver.js
 * with full TypeScript support and LawnQuote design system integration.
 * 
 * Features:
 * - Type-safe tour configuration with full IntelliSense
 * - Custom error handling and recovery strategies
 * - LawnQuote design system integration
 * - Analytics tracking support
 * - Accessibility compliance
 * - Mobile-responsive design
 * - Local storage persistence
 * - Tour scheduling and targeting
 */

// Core configuration and driver setup
export {
  createTourDriver,
  defaultDriverConfig,
  type TourConfig,
  TourError,
  type TourState,
  type TourStep,
  tourStorage,
  validateTourConfig,
} from './driver-config';

// Error handling system
export {
  createErrorBoundary,
  createOnboardingError,
  type ErrorRecoveryStrategy,
  handleOnboardingError,
  OnboardingErrorClass,
  type OnboardingErrorCode,
  OnboardingErrorCodes,
  recoveryStrategies,
  validation,
} from './error-handling';

// TypeScript type definitions (exported from the type file when no conflicts exist)
// These types are available in @/types/onboarding.ts for future use
// Currently commented out to avoid conflicts with existing onboarding code
// export type {
//   OnboardingStep,
//   OnboardingTour,
//   OnboardingAnalytics,
//   TourScheduling,
//   OnboardingState,
//   OnboardingPreferences,
//   OnboardingError,
//   OnboardingContext,
//   OnboardingEvents,
//   UseOnboardingReturn,
//   UseTourBuilderReturn,
//   OnboardingProviderProps,
//   OnboardingAnalyticsProvider,
//   TourStatus,
//   StepPosition,
//   TourTrigger,
//   OnboardingAdvancedConfig,
// } from '@/types/onboarding';

// CSS styles are automatically imported via globals.css

/**
 * Quick start example:
 * 
 * ```typescript
 * import { createTourDriver, validateTourConfig } from '@/libs/onboarding';
 * 
 * const tourConfig = {
 *   tourId: 'welcome-tour',
 *   steps: [
 *     {
 *       id: 'step-1',
 *       element: '#welcome-button',
 *       title: 'Welcome to LawnQuote!',
 *       description: 'Click here to start creating your first quote.',
 *     }
 *   ]
 * };
 * 
 * const errors = validateTourConfig(tourConfig);
 * if (errors.length === 0) {
 *   const driver = createTourDriver(tourConfig);
 *   driver.drive();
 * }
 * ```
 */

/**
 * Version information
 */
export const ONBOARDING_VERSION = '1.0.0';
export const DRIVER_JS_VERSION = '1.3.6';

/**
 * Feature flags for optional functionality
 */
export const ONBOARDING_FEATURES = {
  ANALYTICS: true,
  ACCESSIBILITY: true,
  MOBILE_SUPPORT: true,
  DARK_MODE: true,
  HIGH_CONTRAST: true,
  REDUCED_MOTION: true,
  KEYBOARD_NAVIGATION: true,
  SCREEN_READER: true,
  TOUR_SCHEDULING: true,
  ERROR_RECOVERY: true,
  PROGRESS_PERSISTENCE: true,
} as const;

/**
 * Default preferences for new users
 */
export const DEFAULT_ONBOARDING_PREFERENCES = {
  disableOnboarding: false,
  reduceMotion: false,
  popoverPosition: 'auto' as const,
  showProgress: true,
  autoAdvanceSpeed: 'normal' as const,
  soundEffects: false,
} as const;