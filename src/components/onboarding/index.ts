// Main onboarding components
export { OnboardingManager } from './OnboardingManager'
export { TourTrigger } from './TourTrigger'
export { OnboardingProvider } from '@/contexts/onboarding-context'

// Tour configuration and management
export { 
  getTourConfig,
  getTourPrerequisites,
  getToursForTier,
  ITEM_LIBRARY_TOUR,
  PRO_FEATURES_TOUR,
  QUOTE_CREATION_TOUR,
  SETTINGS_TOUR,
  TOUR_CONFIGS,
  WELCOME_TOUR} from '@/libs/onboarding/tour-configs'
export { type TourConfig, tourManager, type TourStep } from '@/libs/onboarding/tour-manager'

// Hooks
export { useTourTrigger } from './TourTrigger'
export { useOnboarding } from '@/contexts/onboarding-context'
export { useOnboardingTours } from '@/hooks/use-onboarding-tours'
export { useUserTier } from '@/hooks/use-user-tier'

// Types
export type { OnboardingProgress, TourProgress } from '@/contexts/onboarding-context'
export type { UserTier } from '@/hooks/use-user-tier'