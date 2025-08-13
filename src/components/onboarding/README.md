# Welcome Tour Implementation

This document describes the complete welcome tour implementation for LawnQuote following M1.3 specifications.

## Overview

The welcome tour system provides an interactive onboarding experience for new users with the following features:

- **6-step dashboard overview tour** covering main navigation, statistics, quick actions, account menu, and settings
- **Tier-aware tours** that adapt based on user subscription level (Free vs Pro)
- **Progress persistence** that saves tour progress between sessions
- **Auto-triggering** for first-time users
- **Skip/complete functionality** with user control
- **Analytics tracking** through PostHog integration

## Architecture

### Core Components

1. **OnboardingProvider** (`src/contexts/onboarding-context.tsx`)
   - Manages global onboarding state
   - Handles database persistence
   - Tracks analytics events

2. **TourManager** (`src/libs/onboarding/tour-manager.ts`)
   - Integrates with driver.js library
   - Manages tour lifecycle and step navigation
   - Provides theme configuration

3. **Tour Configurations** (`src/libs/onboarding/tour-configs.ts`)
   - Defines all available tours
   - Includes welcome, quote creation, settings, and pro features tours
   - Tier-based tour filtering

4. **OnboardingManager** (`src/components/onboarding/OnboardingManager.tsx`)
   - Orchestrates tour flow and sequencing
   - Handles tier-aware logic
   - Auto-starts appropriate tours

5. **TourTrigger** (`src/components/onboarding/TourTrigger.tsx`)
   - Provides various trigger mechanisms (auto, click, hover)
   - Prevents duplicate tour starts
   - Handles error states

## Database Schema

The system uses three main tables:

- `user_onboarding_progress` - Tracks tour completion status
- `onboarding_analytics` - Stores interaction events
- `user_onboarding_preferences` - User settings and preferences

See migration: `supabase/migrations/20250812130000_create_onboarding_system.sql`

## Implementation Details

### Welcome Tour Steps (M1.3)

1. **Welcome Message** - Overview introduction
2. **Main Navigation Sidebar** - Navigation explanation with `data-tour="sidebar"`
3. **Dashboard Statistics** - Stats cards overview with `data-tour="stats-cards"`
4. **Quick Actions Panel** - Action buttons with `data-tour="quick-actions"`
5. **Account Menu** - User menu access with `data-tour="account-menu"`
6. **Settings Access** - Company settings link with `data-tour="settings-link"`

### Tour Triggers

Tours can be triggered in several ways:

```typescript
// Auto-trigger (used for welcome tour)
<TourTrigger tourId="welcome" trigger="auto" delay={2000} />

// Click trigger
<TourTrigger tourId="quote-creation" trigger="click">
  <Button>Start Tutorial</Button>
</TourTrigger>

// Manual trigger via hook
const { triggerTour } = useOnboardingTours()
await triggerTour('settings')
```

### Tier-Aware Logic

Tours adapt based on user subscription tier:

- **Free users**: Welcome → Settings → Quote Creation → Item Library
- **Pro users**: Same as free + Pro Features tour
- **Enterprise users**: Full access to all tours

### Progress Persistence

Tour progress is automatically saved:
- Database persistence for cross-session continuity
- Local state updates for immediate responsiveness
- Step-level progress tracking

### Styling

Custom CSS provides LawnQuote brand integration:
- Uses design system colors (forest-green, equipment-yellow)
- Responsive design for mobile/tablet
- Accessibility features (high contrast, reduced motion)
- Dark mode support

## Usage

### Basic Setup

The system is already integrated into the app layout:

```typescript
// src/app/(app)/layout.tsx
<OnboardingProvider autoStart={true} enableAnalytics={true}>
  {/* App content */}
  <OnboardingManager autoStartWelcome={true} enableTierBasedTours={true} />
</OnboardingProvider>
```

### Manual Tour Control

```typescript
import { useOnboardingTours } from '@/components/onboarding'

function MyComponent() {
  const { triggerTour, stopTour, resetAllProgress } = useOnboardingTours()
  
  return (
    <div>
      <button onClick={() => triggerTour('welcome')}>
        Start Welcome Tour
      </button>
      <button onClick={resetAllProgress}>
        Reset All Progress
      </button>
    </div>
  )
}
```

### Adding Tour Data Attributes

To make elements targetable by tours, add data attributes:

```jsx
<div data-tour="my-element">
  This element can be highlighted in tours
</div>
```

## Configuration

### Environment Variables

No additional environment variables required. The system uses existing:
- Supabase configuration for persistence
- PostHog configuration for analytics

### Customization

Tour configurations can be modified in `src/libs/onboarding/tour-configs.ts`:

```typescript
export const CUSTOM_TOUR: TourConfig = {
  id: 'custom',
  name: 'Custom Tour',
  description: 'My custom tour',
  userTiers: ['free', 'pro'],
  steps: [
    {
      id: 'step-1',
      element: '[data-tour="my-element"]',
      title: 'Step Title',
      description: 'Step description',
      position: 'bottom'
    }
  ]
}
```

## Analytics

The system tracks:
- Tour starts and completions
- Step progression and drop-offs
- Skip events and abandonment
- User engagement patterns

Events are sent to PostHog and stored in the database for admin analysis.

## Testing

Run the migration to set up database tables:

```bash
npm run db:migrate
```

Test the implementation:
1. Navigate to `/dashboard` as a new user
2. Welcome tour should auto-start after 2 seconds
3. Complete or skip the tour
4. Progress should persist across page reloads

## Troubleshooting

### Tour Not Starting
- Check console for JavaScript errors
- Verify data attributes are present on target elements
- Ensure user is authenticated and has proper tier access

### Progress Not Saving
- Check Supabase connection and permissions
- Verify migration was applied successfully
- Check browser console for database errors

### Styling Issues
- Ensure `@/styles/onboarding.css` is imported
- Check for CSS conflicts with driver.js styles
- Verify responsive breakpoints

## Future Enhancements

Potential improvements:
- Video-embedded tour steps
- Interactive tutorials with real data
- Gamified progress tracking
- Multi-language support
- AI-powered tour customization

---

For questions or issues, refer to the driver.js documentation: https://driverjs.com/