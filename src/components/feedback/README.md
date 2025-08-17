# Feedback Widget System

A comprehensive feedback collection system built with shadcn/ui components and integrated with Formbricks SDK for QuoteKit.

## Overview

The feedback system provides multiple UI components to collect user feedback through surveys, feature requests, and bug reports. All components are production-ready with full TypeScript support, accessibility compliance, and responsive design.

## Components

### 1. FeedbackWidget
The main floating feedback widget that appears in a fixed position on screen.

```tsx
import { FeedbackWidget } from '@/components/feedback';

// Basic usage
<FeedbackWidget />

// With custom configuration
<FeedbackWidget
  position="bottom-right"
  theme="auto"
  defaultMinimized={true}
  showBadge={true}
  badgeContent="New"
/>
```

**Props:**
- `position`: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
- `theme`: 'light' | 'dark' | 'auto'
- `defaultMinimized`: boolean
- `showBadge`: boolean
- `badgeContent`: string | number
- `disabled`: boolean

### 2. SurveyModal
A comprehensive modal for displaying multi-step surveys.

```tsx
import { SurveyModal } from '@/components/feedback';

<SurveyModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onComplete={(responses) => {
    console.log('Survey responses:', responses);
  }}
  survey={customSurvey} // Optional: uses default survey if not provided
/>
```

**Features:**
- Multi-step survey flow with progress indication
- Multiple question types (rating, NPS, multiple choice, open text, email)
- Welcome and thank you cards
- Responsive design for mobile and desktop
- Full keyboard navigation support

### 3. FeedbackTrigger
Versatile trigger buttons with popover menu for different feedback types.

```tsx
import { FeedbackTrigger, FeedbackFAB, InlineFeedbackButton } from '@/components/feedback';

// Standard button trigger
<FeedbackTrigger />

// Floating Action Button
<FeedbackFAB />

// Inline button for menus
<InlineFeedbackButton text="Help & Feedback" />
```

**Variants:**
- `button`: Standard button with popover (default)
- `fab`: Floating Action Button
- `inline`: Inline button for menus and toolbars
- `minimal`: Minimal icon-only trigger

### 4. SegmentSurveyManager (FB-019)
Intelligent survey manager that displays targeted surveys based on user segments and behavior patterns.

```tsx
import { SegmentSurveyManager } from '@/components/feedback';

// Basic usage - automatically determines user segment
<SegmentSurveyManager />

// With custom context
<SegmentSurveyManager
  currentPage="/quotes/create"
  contextData={{ source: 'navigation' }}
  debug={true} // Enable debug logging
  onSurveyTriggered={(surveyId, segment, context) => {
    console.log(`Survey ${surveyId} triggered for ${segment} segment`);
  }}
/>
```

**Features:**
- **Automatic Segmentation**: Users are categorized as free, pro, enterprise, heavy_user, new_user, or light_user
- **Targeted Surveys**: Different surveys for each segment focusing on relevant feedback
- **Smart Frequency Control**: Respects daily/weekly limits and cooldown periods
- **Context Aware**: Considers user activity, tier, and current page
- **Priority Based**: Higher priority surveys are shown first

**User Segments:**
- `free`: Free tier users - focuses on feature discovery and upgrade barriers
- `pro`: Pro users - focuses on feature usage and satisfaction  
- `enterprise`: Enterprise users - focuses on advanced features and scalability
- `heavy_user`: High activity users - focuses on workflow optimization
- `new_user`: Users less than 14 days old - focuses on onboarding experience
- `light_user`: Low activity users - focuses on engagement barriers

### 5. FeedbackIntegrationWrapper
Comprehensive wrapper that enables all feedback features in one component.

```tsx
import { FeedbackIntegrationWrapper } from '@/components/feedback';

// Enable all features (recommended)
<FeedbackIntegrationWrapper />

// Custom configuration
<FeedbackIntegrationWrapper
  features={{
    floatingWidget: true,
    contextTracking: true,
    segmentSurveys: true
  }}
  segmentSurveyConfig={{
    currentPage: router.pathname,
    debug: process.env.NODE_ENV === 'development'
  }}
/>
```

## Integration

### 1. Formbricks Integration
The components automatically integrate with the existing Formbricks infrastructure:

```tsx
// The components use the existing hook
import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';

// All user interactions are tracked automatically
// Events include: feedback opened, survey started, survey completed, etc.
```

### 2. Theme Support
Automatic theme detection with manual override:

```tsx
// Auto-detects system preference
<FeedbackWidget theme="auto" />

// Force light or dark theme
<FeedbackWidget theme="dark" />
```

### 3. Responsive Design
All components are fully responsive:

- Mobile-first design with touch-friendly interactions
- Adaptive sizing for different screen sizes
- Proper spacing and accessibility on all devices

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Color contrast compliance
- ✅ Touch target sizing (44px minimum)

## Usage Examples

### 1. Dashboard Integration
```tsx
import { FeedbackWidget } from '@/components/feedback';

export function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
      <FeedbackWidget position="bottom-right" />
    </div>
  );
}
```

### 2. Navigation Menu Integration
```tsx
import { MinimalFeedbackTrigger } from '@/components/feedback';

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuContent>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <MinimalFeedbackTrigger />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3. Page-specific Feedback
```tsx
import { InlineFeedbackButton } from '@/components/feedback';

export function QuotePage() {
  return (
    <div>
      <PageHeader>
        <h1>Create Quote</h1>
        <InlineFeedbackButton text="Feedback on this page" />
      </PageHeader>
      {/* Page content */}
    </div>
  );
}
```

### 4. Segment-Specific Surveys (FB-019)
```tsx
import { SegmentSurveyManager } from '@/components/feedback';

export function AppLayout({ children }) {
  return (
    <div>
      {children}
      {/* Automatically shows relevant surveys based on user segment */}
      <SegmentSurveyManager 
        currentPage={usePathname()}
        contextData={{ 
          section: 'main-app',
          timestamp: Date.now() 
        }}
      />
    </div>
  );
}
```

### 5. Complete Integration
```tsx
import { FeedbackIntegrationWrapper } from '@/components/feedback';

export function RootLayout({ children }) {
  return (
    <div>
      {children}
      {/* All-in-one solution with segment surveys, floating widget, and tracking */}
      <FeedbackIntegrationWrapper
        features={{
          floatingWidget: true,
          contextTracking: true,
          segmentSurveys: true
        }}
        segmentSurveyConfig={{
          currentPage: window?.location?.pathname,
          debug: process.env.NODE_ENV === 'development'
        }}
      />
    </div>
  );
}
```

## Customization

### 1. Custom Surveys
```tsx
const customSurvey = {
  id: 'feature-feedback',
  title: 'Feature Feedback',
  questions: [
    {
      id: 'satisfaction',
      type: 'rating',
      question: 'How satisfied are you with this feature?',
      minRating: 1,
      maxRating: 5,
      required: true
    }
  ]
};

<SurveyModal survey={customSurvey} />
```

### 2. Custom Styling
```tsx
<FeedbackWidget
  className="custom-widget-styles"
  position="bottom-left"
/>
```

### 3. Segment Survey Configuration (FB-019)
Customize surveys for different user segments by modifying the configuration:

```tsx
import { SEGMENT_SURVEY_CONFIGS, getSegmentConfigs } from '@/components/feedback';

// Get all surveys for a specific segment
const freeTierSurveys = getSegmentConfigs('free');

// Custom trigger conditions
const customConfig = {
  segment: 'pro',
  surveyIds: ['custom-pro-survey'],
  triggerConditions: [
    {
      type: 'activity',
      operator: 'greater_than',
      value: 20,
      field: 'quotesCreated'
    }
  ],
  frequency: {
    maxPerDay: 1,
    maxPerWeek: 3,
    cooldownDays: 5,
    respectGlobalLimits: true
  },
  priority: 8,
  enabled: true
};
```

**Trigger Condition Types:**
- `activity`: Based on user activity metrics (quotesCreated, accountAge, etc.)
- `segment`: Based on user segment
- `event`: Based on current page or event
- `time`: Based on time-related conditions

**Frequency Controls:**
- `maxPerDay`: Maximum surveys per day per segment
- `maxPerWeek`: Maximum surveys per week per segment  
- `cooldownDays`: Days to wait between surveys for the same user
- `respectGlobalLimits`: Whether to respect system-wide frequency limits

## Testing

Use the `FeedbackShowcase` component for testing and development:

```tsx
import { FeedbackShowcase } from '@/components/feedback/feedback-showcase';

// In your development/testing page
<FeedbackShowcase />
```

## Technical Architecture

- **State Management**: React hooks with localStorage persistence
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: CSS transitions with proper reduced motion support
- **Accessibility**: Full WCAG 2.1 compliance
- **TypeScript**: Complete type safety with exported interfaces
- **Integration**: Seamless Formbricks SDK integration

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lazy loading for modal components
- Minimal bundle impact (components are tree-shakable)
- Efficient event tracking with queuing
- Optimized animations with hardware acceleration