'use client';

import type { User } from '@supabase/supabase-js';
import { ReactNode, useEffect, useState } from 'react';

// Default tours configuration
import { TOUR_CONFIGS } from '@/libs/onboarding/tour-configs';
import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client';
import type { Tour } from '@/types/onboarding';

import { OnboardingProvider } from './onboarding-context';

type OnboardingWrapperProps = {
  children: ReactNode;
  initialUserId?: string;
};

// Convert TourConfig to Tour format
function convertTourConfigsToTours(): Tour[] {
  return Object.values(TOUR_CONFIGS).map(tourConfig => ({
    id: tourConfig.id,
    name: tourConfig.name || tourConfig.id,
    description: tourConfig.description || '',
    steps: tourConfig.steps.map(step => ({
      id: step.id,
      element: step.element,
      title: step.title,
      content: step.description,
      position: step.position as any,
      showSkip: step.showButtons?.includes('close') ?? true,
      showPrevious: step.showButtons?.includes('previous') ?? true
    })),
    trigger: 'auto',
    priority: 100
  }));
}

export function OnboardingWrapper({ children, initialUserId }: OnboardingWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseClientClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Don't render anything while loading auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <OnboardingProvider 
      userId={user?.id || initialUserId} 
      tours={convertTourConfigsToTours()}
    >
      {children}
    </OnboardingProvider>
  );
}