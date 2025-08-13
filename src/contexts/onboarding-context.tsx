'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client';
import type { 
  OnboardingEvent,
  OnboardingProgress, 
  OnboardingProgressInsert,
  OnboardingProgressRow,
  OnboardingProgressUpdate,
  Tour, 
  TourProgress} from '@/types/onboarding';

type OnboardingContextType = {
  // State
  progress: OnboardingProgress | null;
  activeTour: TourProgress | null;
  isLoading: boolean;
  availableTours: Tour[];
  
  // Tour control methods
  startTour: (tourId: string) => Promise<void>;
  completeTour: (tourId: string) => Promise<void>;
  skipTour: (tourId: string) => Promise<void>;
  exitTour: () => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  goToStep: (stepIndex: number) => Promise<void>;
  
  // Progress methods
  markWelcomeCompleted: () => Promise<void>;
  resetProgress: () => Promise<void>;
  syncProgress: () => Promise<void>;
  clearPhantomActiveTour: () => Promise<void>;
  
  // Utility methods
  shouldShowTour: (tourId: string) => boolean;
  getNextRecommendedTour: () => Tour | null;
  getTourProgress: (tourId: string) => TourProgress | null;
  
  // Event tracking
  trackEvent: (event: OnboardingEvent) => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'quotekit-onboarding';
const SESSION_STORAGE_KEY = 'quotekit-onboarding-session';

// Default onboarding progress
const createDefaultProgress = (userId: string): OnboardingProgress => ({
  userId,
  hasSeenWelcome: false,
  completedTours: [],
  skippedTours: [],
  activeTour: undefined,
  tourProgresses: {},
  sessionCount: 0,
  lastActiveAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function OnboardingProvider({ 
  children, 
  tours = [],
  userId 
}: { 
  children: ReactNode;
  tours?: Tour[];
  userId?: string;
}) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [activeTour, setActiveTour] = useState<TourProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTours] = useState<Tour[]>(tours);
  
  const supabase = createSupabaseClientClient(undefined, undefined);
  const syncTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize progress when userId changes
  useEffect(() => {
    if (!userId) {
      setProgress(null);
      setActiveTour(null);
      setIsLoading(false);
      return;
    }

    initializeProgress(userId);
  }, [userId]);

  // Sync progress to database periodically
  useEffect(() => {
    if (!progress || !userId) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set up delayed sync (debounce)
    syncTimeoutRef.current = setTimeout(() => {
      syncToDatabase();
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [progress]);

  // Initialize session tracking
  useEffect(() => {
    if (!progress || !userId) return;

    const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) {
      // New session
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        startedAt: new Date().toISOString(),
        sessionId: Math.random().toString(36).substring(7)
      }));
      
      updateProgress({
        sessionCount: progress.sessionCount + 1,
        lastActiveAt: new Date().toISOString()
      });
    }
  }, [progress, userId]);

  const initializeProgress = useCallback(async (currentUserId: string) => {
    setIsLoading(true);
    try {
      // Try to load from localStorage first
      const localData = localStorage.getItem(STORAGE_KEY);
      let localProgress: OnboardingProgress | null = null;
      
      if (localData) {
        try {
          localProgress = JSON.parse(localData);
          if (localProgress?.userId !== currentUserId) {
            localProgress = null; // Different user
          }
        } catch (error) {
          console.error('Error parsing local onboarding data:', error);
        }
      }

      // Try to load from database (when table exists)
      let dbProgress: OnboardingProgress | null = null;
      try {
        const { data, error } = await supabase
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', currentUserId)
          .single();

        if (data && !error) {
          dbProgress = {
            userId: data.user_id,
            hasSeenWelcome: data.has_seen_welcome,
            completedTours: data.completed_tours,
            skippedTours: data.skipped_tours,
            activeTour: data.active_tour_id ? {
              tourId: data.active_tour_id,
              currentStep: data.active_tour_step || 0,
              completed: false,
              skipped: false,
              startedAt: data.tour_progresses[data.active_tour_id]?.startedAt || new Date().toISOString(),
              lastActiveAt: data.last_active_at
            } : undefined,
            tourProgresses: data.tour_progresses,
            sessionCount: data.session_count,
            lastActiveAt: data.last_active_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (error) {
        // Database table might not exist yet, that's okay
        console.log('Onboarding table not available, using localStorage only');
      }

      // Use the most recent data or create default
      let finalProgress = dbProgress || localProgress || createDefaultProgress(currentUserId);
      
      // CRITICAL FIX: Clear any phantom active tour that shouldn't exist
      // This prevents the isActive: true issue that blocks auto-start
      if (finalProgress.activeTour && !finalProgress.activeTour.tourId) {
        console.log('🔧 OnboardingManager: Clearing phantom active tour with no tourId');
        finalProgress = {
          ...finalProgress,
          activeTour: undefined
        };
      }
      
      // Also validate that activeTour has valid data structure
      if (finalProgress.activeTour && (!finalProgress.activeTour.startedAt || !finalProgress.activeTour.lastActiveAt)) {
        console.log('🔧 OnboardingManager: Clearing corrupted active tour missing required fields');
        finalProgress = {
          ...finalProgress,
          activeTour: undefined
        };
      }
      
      // CRITICAL FIX: Clear phantom tours when Driver.js tour manager isn't actually active
      // This handles cases where localStorage has activeTour but Driver.js isn't running
      if (finalProgress.activeTour && typeof window !== 'undefined') {
        // Dynamic import to avoid SSR issues
        import('@/libs/onboarding/tour-manager').then(({ tourManager }) => {
          if (!tourManager.isActive()) {
            console.log('🔧 OnboardingManager: Clearing phantom active tour - Driver.js not active');
            setProgress(prev => prev ? {
              ...prev,
              activeTour: undefined
            } : null);
            setActiveTour(null);
            
            // Also clear localStorage immediately
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                if (parsed.activeTour) {
                  parsed.activeTour = undefined;
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                }
              } catch (error) {
                console.error('Error clearing localStorage activeTour:', error);
              }
            }
          }
        });
      }
      
      setProgress(finalProgress);
      setActiveTour(finalProgress.activeTour || null);
      
      // Save to localStorage if we got data from database
      if (dbProgress) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbProgress));
      }
    } catch (error) {
      console.error('Error initializing onboarding progress:', error);
      // Fallback to default progress
      const defaultProgress = createDefaultProgress(currentUserId);
      setProgress(defaultProgress);
      setActiveTour(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const updateProgress = useCallback((updates: Partial<OnboardingProgress>) => {
    setProgress(current => {
      if (!current) return null;
      
      const updated = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  const syncToDatabase = useCallback(async () => {
    if (!progress || !userId) return;

    try {
      const dbData: OnboardingProgressInsert = {
        user_id: userId,
        has_seen_welcome: progress.hasSeenWelcome,
        completed_tours: progress.completedTours,
        skipped_tours: progress.skippedTours,
        active_tour_id: progress.activeTour?.tourId,
        active_tour_step: progress.activeTour?.currentStep,
        tour_progresses: progress.tourProgresses,
        session_count: progress.sessionCount,
        last_active_at: progress.lastActiveAt,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('onboarding_progress')
        .upsert(dbData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.log('Database sync not available:', error.message);
      }
    } catch (error) {
      console.log('Database sync failed, continuing with localStorage only');
    }
  }, [progress, userId, supabase]);

  const startTour = useCallback(async (tourId: string) => {
    const tour = availableTours.find(t => t.id === tourId);
    if (!tour || !progress) return;

    const tourProgress: TourProgress = {
      tourId,
      currentStep: 0,
      completed: false,
      skipped: false,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    const updatedProgresses = {
      ...progress.tourProgresses,
      [tourId]: tourProgress
    };

    setActiveTour(tourProgress);
    updateProgress({
      activeTour: tourProgress,
      tourProgresses: updatedProgresses
    });

    trackEvent({ type: 'TOUR_STARTED', tourId });
  }, [availableTours, progress, updateProgress]);

  const completeTour = useCallback(async (tourId: string) => {
    if (!progress) return;

    const tourProgress = progress.tourProgresses[tourId];
    if (!tourProgress) return;

    const completedProgress: TourProgress = {
      ...tourProgress,
      completed: true,
      completedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    const updatedProgresses = {
      ...progress.tourProgresses,
      [tourId]: completedProgress
    };

    setActiveTour(null);
    updateProgress({
      completedTours: [...progress.completedTours, tourId],
      activeTour: undefined,
      tourProgresses: updatedProgresses
    });

    trackEvent({ type: 'TOUR_COMPLETED', tourId });
  }, [progress, updateProgress]);

  const skipTour = useCallback(async (tourId: string) => {
    if (!progress) return;

    const tourProgress = progress.tourProgresses[tourId];
    if (tourProgress) {
      const skippedProgress: TourProgress = {
        ...tourProgress,
        skipped: true,
        lastActiveAt: new Date().toISOString()
      };

      const updatedProgresses = {
        ...progress.tourProgresses,
        [tourId]: skippedProgress
      };

      updateProgress({
        tourProgresses: updatedProgresses
      });
    }

    setActiveTour(null);
    updateProgress({
      skippedTours: [...progress.skippedTours, tourId],
      activeTour: undefined
    });

    trackEvent({ type: 'TOUR_SKIPPED', tourId });
  }, [progress, updateProgress]);

  const exitTour = useCallback(async () => {
    if (!activeTour || !progress) return;

    const tourProgress = progress.tourProgresses[activeTour.tourId];
    if (tourProgress) {
      const updatedProgress: TourProgress = {
        ...tourProgress,
        lastActiveAt: new Date().toISOString()
      };

      const updatedProgresses = {
        ...progress.tourProgresses,
        [activeTour.tourId]: updatedProgress
      };

      updateProgress({
        tourProgresses: updatedProgresses
      });
    }

    setActiveTour(null);
    updateProgress({
      activeTour: undefined
    });

    trackEvent({ type: 'TOUR_EXITED', tourId: activeTour.tourId });
  }, [activeTour, progress, updateProgress]);

  const nextStep = useCallback(async () => {
    if (!activeTour || !progress) return;

    const tour = availableTours.find(t => t.id === activeTour.tourId);
    if (!tour) return;

    const nextStepIndex = activeTour.currentStep + 1;
    
    if (nextStepIndex >= tour.steps.length) {
      // Tour completed
      await completeTour(activeTour.tourId);
      return;
    }

    const updatedTour: TourProgress = {
      ...activeTour,
      currentStep: nextStepIndex,
      lastActiveAt: new Date().toISOString()
    };

    const updatedProgresses = {
      ...progress.tourProgresses,
      [activeTour.tourId]: updatedTour
    };

    setActiveTour(updatedTour);
    updateProgress({
      activeTour: updatedTour,
      tourProgresses: updatedProgresses
    });

    trackEvent({ 
      type: 'TOUR_STEP_COMPLETED', 
      tourId: activeTour.tourId, 
      stepId: tour.steps[activeTour.currentStep].id 
    });
  }, [activeTour, progress, availableTours, completeTour, updateProgress]);

  const previousStep = useCallback(async () => {
    if (!activeTour || !progress || activeTour.currentStep <= 0) return;

    const updatedTour: TourProgress = {
      ...activeTour,
      currentStep: activeTour.currentStep - 1,
      lastActiveAt: new Date().toISOString()
    };

    const updatedProgresses = {
      ...progress.tourProgresses,
      [activeTour.tourId]: updatedTour
    };

    setActiveTour(updatedTour);
    updateProgress({
      activeTour: updatedTour,
      tourProgresses: updatedProgresses
    });
  }, [activeTour, progress, updateProgress]);

  const goToStep = useCallback(async (stepIndex: number) => {
    if (!activeTour || !progress) return;

    const tour = availableTours.find(t => t.id === activeTour.tourId);
    if (!tour || stepIndex < 0 || stepIndex >= tour.steps.length) return;

    const updatedTour: TourProgress = {
      ...activeTour,
      currentStep: stepIndex,
      lastActiveAt: new Date().toISOString()
    };

    const updatedProgresses = {
      ...progress.tourProgresses,
      [activeTour.tourId]: updatedTour
    };

    setActiveTour(updatedTour);
    updateProgress({
      activeTour: updatedTour,
      tourProgresses: updatedProgresses
    });
  }, [activeTour, progress, availableTours, updateProgress]);

  const markWelcomeCompleted = useCallback(async () => {
    if (!progress) return;

    updateProgress({
      hasSeenWelcome: true
    });

    trackEvent({ type: 'WELCOME_COMPLETED' });
  }, [progress, updateProgress]);

  const resetProgress = useCallback(async () => {
    if (!userId) return;

    const defaultProgress = createDefaultProgress(userId);
    setProgress(defaultProgress);
    setActiveTour(null);
    
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);

    try {
      await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('Database reset not available');
    }
  }, [userId, supabase]);

  const clearPhantomActiveTour = useCallback(async () => {
    console.log('🔧 OnboardingManager: Manually clearing phantom active tour');
    setActiveTour(null);
    if (progress) {
      updateProgress({
        activeTour: undefined
      });
    }
    // Also clear localStorage to prevent reload issues
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed.activeTour) {
          parsed.activeTour = undefined;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          console.log('🔧 OnboardingManager: Cleared activeTour from localStorage');
        }
      } catch (error) {
        console.error('Error clearing localStorage activeTour:', error);
      }
    }
  }, [progress, updateProgress]);

  const syncProgress = useCallback(async () => {
    await syncToDatabase();
  }, [syncToDatabase]);

  const shouldShowTour = useCallback((tourId: string): boolean => {
    if (!progress) return false;
    
    // Don't show if already completed or skipped
    if (progress.completedTours.includes(tourId) || progress.skippedTours.includes(tourId)) {
      return false;
    }

    // Don't show if there's already an active tour
    if (progress.activeTour && progress.activeTour.tourId !== tourId) {
      return false;
    }

    return true;
  }, [progress]);

  const getNextRecommendedTour = useCallback((): Tour | null => {
    if (!progress) return null;

    // Filter available tours based on conditions and status
    const eligibleTours = availableTours.filter(tour => {
      if (!shouldShowTour(tour.id)) return false;
      
      // Check conditions if specified
      if (tour.conditions) {
        // Add condition checking logic here based on user data
        // This would need to be connected to actual user data
        return true;
      }
      
      return true;
    });

    // Sort by priority (higher first)
    eligibleTours.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return eligibleTours[0] || null;
  }, [progress, availableTours, shouldShowTour]);

  const getTourProgress = useCallback((tourId: string): TourProgress | null => {
    return progress?.tourProgresses[tourId] || null;
  }, [progress]);

  const trackEvent = useCallback((event: OnboardingEvent) => {
    // Track onboarding events for analytics
    console.log('Onboarding event:', event);
    
    // This could be connected to analytics services like PostHog, Google Analytics, etc.
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_action', {
        action_type: event.type,
        tour_id: 'tourId' in event ? event.tourId : undefined,
        step_id: 'stepId' in event ? event.stepId : undefined,
      });
    }
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        progress,
        activeTour,
        isLoading,
        availableTours,
        startTour,
        completeTour,
        skipTour,
        exitTour,
        nextStep,
        previousStep,
        goToStep,
        markWelcomeCompleted,
        resetProgress,
        syncProgress,
        clearPhantomActiveTour,
        shouldShowTour,
        getNextRecommendedTour,
        getTourProgress,
        trackEvent,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

// Re-export types for convenience
export type { OnboardingEvent,OnboardingProgress, Tour, TourProgress } from '@/types/onboarding';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}