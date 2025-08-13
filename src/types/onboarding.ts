// Types for onboarding system

export type TourStep = {
  id: string;
  element?: string; // CSS selector for the target element
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showSkip?: boolean;
  showPrevious?: boolean;
  action?: 'click' | 'highlight' | 'scroll';
  delay?: number; // Delay before showing step in ms
};

export type Tour = {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  trigger?: 'auto' | 'manual' | 'feature-access';
  priority?: number; // Higher priority tours show first
  conditions?: {
    minQuotes?: number;
    hasCompanySettings?: boolean;
    hasItems?: boolean;
    subscriptionStatus?: string[];
    daysSinceSignup?: number;
  };
};

export type TourProgress = {
  tourId: string;
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  startedAt: string;
  completedAt?: string;
  lastActiveAt: string;
};

export type OnboardingProgress = {
  userId: string;
  hasSeenWelcome: boolean;
  completedTours: string[];
  skippedTours: string[];
  activeTour?: TourProgress;
  tourProgresses: Record<string, TourProgress>;
  sessionCount: number;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
};

// Supabase table types (for future database implementation)
export type OnboardingProgressRow = {
  id: string;
  user_id: string;
  has_seen_welcome: boolean;
  completed_tours: string[];
  skipped_tours: string[];
  active_tour_id?: string;
  active_tour_step?: number;
  tour_progresses: Record<string, TourProgress>;
  session_count: number;
  last_active_at: string;
  created_at: string;
  updated_at: string;
};

export type OnboardingProgressInsert = Omit<OnboardingProgressRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type OnboardingProgressUpdate = Partial<OnboardingProgressInsert>;

// Event types for onboarding actions
export type OnboardingEvent = 
  | { type: 'TOUR_STARTED'; tourId: string }
  | { type: 'TOUR_STEP_COMPLETED'; tourId: string; stepId: string }
  | { type: 'TOUR_COMPLETED'; tourId: string }
  | { type: 'TOUR_SKIPPED'; tourId: string }
  | { type: 'TOUR_EXITED'; tourId: string }
  | { type: 'WELCOME_COMPLETED' }
  | { type: 'SESSION_STARTED' };