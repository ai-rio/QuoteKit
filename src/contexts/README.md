# Onboarding Context System

This document describes the React Context system for managing onboarding state in QuoteKit.

## Overview

The onboarding system provides a comprehensive solution for user onboarding with:
- User progress tracking
- Tour completion persistence in Supabase (with localStorage fallback)
- Session-based tour management
- Tour control methods (start, complete, skip, etc.)
- Automatic tour recommendations

## Architecture

### Core Components

1. **OnboardingProvider**: Main context provider with state management
2. **OnboardingWrapper**: Client-side wrapper that handles authentication
3. **Tours Configuration**: Predefined tours and recommendation logic

### Data Flow

```
User Authentication → OnboardingWrapper → OnboardingProvider → Tour Components
                                              ↓
                                        Supabase/localStorage
```

## Usage

### Basic Setup

The onboarding system is automatically available in the app layout:

```tsx
// Already set up in src/app/(app)/layout.tsx
<OnboardingWrapper>
  <SidebarProvider>
    {/* Your app content */}
  </SidebarProvider>
</OnboardingWrapper>
```

### Using the Hook

```tsx
import { useOnboarding } from '@/contexts/onboarding-context';

function MyComponent() {
  const {
    progress,
    activeTour,
    startTour,
    completeTour,
    skipTour,
    shouldShowTour
  } = useOnboarding();

  // Start a tour
  const handleStartTour = () => {
    startTour('welcome-tour');
  };

  // Check if tour should be shown
  if (shouldShowTour('welcome-tour')) {
    return <TourTrigger tourId="welcome-tour" />;
  }

  return null;
}
```

### Using the Simplified Hook

```tsx
import { useTour } from '@/hooks/use-tour';

function WelcomeTour() {
  const { 
    tour, 
    isActive, 
    canShow, 
    currentStep, 
    progressInfo,
    start, 
    nextStep, 
    skip 
  } = useTour('welcome-tour');

  if (!canShow || !tour) return null;

  return (
    <div>
      <h2>{tour.name}</h2>
      {isActive && currentStep && (
        <div>
          <h3>{currentStep.title}</h3>
          <p>{currentStep.content}</p>
          <div>Step {progressInfo.current} of {progressInfo.total}</div>
          <button onClick={nextStep}>Next</button>
          <button onClick={skip}>Skip Tour</button>
        </div>
      )}
      {!isActive && (
        <button onClick={start}>Start Tour</button>
      )}
    </div>
  );
}
```

## Tour Configuration

Tours are defined in `src/contexts/tours-config.ts`:

```tsx
const tour: Tour = {
  id: 'my-tour',
  name: 'My Feature Tour',
  description: 'Learn how to use this feature',
  priority: 80,
  trigger: 'auto', // 'auto' | 'manual' | 'feature-access'
  conditions: {
    minQuotes: 5,
    hasCompanySettings: true,
  },
  steps: [
    {
      id: 'step-1',
      element: '[data-tour="my-element"]', // CSS selector
      title: 'Step Title',
      content: 'Step description',
      position: 'bottom', // 'top' | 'bottom' | 'left' | 'right' | 'center'
      showSkip: true,
      showPrevious: false,
    }
  ]
};
```

### Tour Targeting

Use data attributes to target elements:

```tsx
<button data-tour="create-quote">Create Quote</button>
```

## Components

### TourTrigger

Button component that starts a tour:

```tsx
import { TourTrigger } from '@/components/onboarding';

<TourTrigger tourId="welcome-tour" variant="outline">
  Start Welcome Tour
</TourTrigger>
```

### OnboardingDebug

Debug panel for development (shows all onboarding state):

```tsx
import { OnboardingDebug } from '@/components/onboarding';

// Only show in development or for admins
{process.env.NODE_ENV === 'development' && <OnboardingDebug />}
```

## Database Schema

The system works with localStorage by default but can sync to a Supabase table:

```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_seen_welcome BOOLEAN DEFAULT FALSE,
  completed_tours TEXT[] DEFAULT '{}',
  skipped_tours TEXT[] DEFAULT '{}',
  active_tour_id TEXT,
  active_tour_step INTEGER DEFAULT 0,
  tour_progresses JSONB DEFAULT '{}',
  session_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Row Level Security
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own onboarding progress" 
ON onboarding_progress FOR ALL 
USING (auth.uid() = user_id);
```

## Persistence Strategy

1. **Primary**: localStorage for immediate persistence
2. **Secondary**: Supabase database for cross-device sync (when available)
3. **Fallback**: In-memory state for anonymous users

The system automatically:
- Loads from database on initialization
- Syncs changes to database (debounced)
- Falls back to localStorage if database is unavailable

## Session Management

- Session tracking via sessionStorage
- Increments session count on new sessions
- Tracks last activity timestamps
- Prevents duplicate tour triggers in same session

## Event Tracking

The system fires events for analytics:

```tsx
// Events are automatically tracked
trackEvent({ type: 'TOUR_STARTED', tourId: 'welcome-tour' });
trackEvent({ type: 'TOUR_COMPLETED', tourId: 'welcome-tour' });
trackEvent({ type: 'TOUR_SKIPPED', tourId: 'welcome-tour' });
```

Connect to your analytics service:

```tsx
// In the trackEvent function
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'onboarding_action', {
    action_type: event.type,
    tour_id: 'tourId' in event ? event.tourId : undefined,
  });
}
```

## Best Practices

### Tour Design
- Keep tours short (3-5 steps max)
- Use clear, actionable copy
- Target specific UI elements with data attributes
- Set appropriate conditions to avoid overwhelming users

### Implementation
- Use `shouldShowTour()` before rendering tour triggers
- Handle loading states appropriately
- Test tours with different user states
- Use the debug panel during development

### Performance
- Tours are lazy-loaded and only initialize when needed
- Database syncing is debounced to avoid excessive requests
- Session tracking uses efficient storage mechanisms

## Troubleshooting

### Tours Not Showing
1. Check if user is authenticated (`userId` prop)
2. Verify tour conditions are met
3. Ensure `shouldShowTour()` returns true
4. Check if tour was already completed/skipped

### Database Sync Issues
- System gracefully falls back to localStorage
- Check Supabase table exists and RLS policies are correct
- Monitor console for sync error messages

### Development Tools
- Use `<OnboardingDebug />` component
- Check localStorage: `quotekit-onboarding`
- Monitor console for onboarding events