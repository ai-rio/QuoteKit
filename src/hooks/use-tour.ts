'use client';

import { useCallback } from 'react';

import { useOnboarding } from '@/contexts/onboarding-context';
import type { Tour } from '@/types/onboarding';

export function useTour(tourId?: string) {
  const {
    progress,
    activeTour,
    availableTours,
    startTour,
    completeTour,
    skipTour,
    exitTour,
    nextStep,
    previousStep,
    goToStep,
    shouldShowTour,
    getTourProgress,
  } = useOnboarding();

  const currentTour = tourId 
    ? availableTours.find(t => t.id === tourId)
    : activeTour 
      ? availableTours.find(t => t.id === activeTour.tourId)
      : null;

  const currentTourProgress = tourId ? getTourProgress(tourId) : activeTour;
  const isActive = activeTour?.tourId === tourId;
  const canShow = tourId ? shouldShowTour(tourId) : false;

  const start = useCallback(() => {
    if (tourId) {
      startTour(tourId);
    }
  }, [tourId, startTour]);

  const complete = useCallback(() => {
    if (tourId) {
      completeTour(tourId);
    }
  }, [tourId, completeTour]);

  const skip = useCallback(() => {
    if (tourId) {
      skipTour(tourId);
    }
  }, [tourId, skipTour]);

  const getCurrentStep = useCallback(() => {
    if (!currentTour || !currentTourProgress) return null;
    return currentTour.steps[currentTourProgress.currentStep] || null;
  }, [currentTour, currentTourProgress]);

  const getProgress = useCallback(() => {
    if (!currentTour || !currentTourProgress) return { current: 0, total: 0, percentage: 0 };
    
    const current = currentTourProgress.currentStep + 1;
    const total = currentTour.steps.length;
    const percentage = Math.round((current / total) * 100);
    
    return { current, total, percentage };
  }, [currentTour, currentTourProgress]);

  const isCompleted = useCallback(() => {
    if (!tourId || !progress) return false;
    return progress.completedTours.includes(tourId);
  }, [tourId, progress]);

  const isSkipped = useCallback(() => {
    if (!tourId || !progress) return false;
    return progress.skippedTours.includes(tourId);
  }, [tourId, progress]);

  return {
    // Tour data
    tour: currentTour,
    progress: currentTourProgress,
    currentStep: getCurrentStep(),
    
    // Status
    isActive,
    canShow,
    isCompleted: isCompleted(),
    isSkipped: isSkipped(),
    
    // Progress info
    progressInfo: getProgress(),
    
    // Actions
    start,
    complete,
    skip,
    exit: exitTour,
    nextStep,
    previousStep,
    goToStep,
  };
}

export type UseTourReturn = ReturnType<typeof useTour>;