# LawnQuote Onboarding System

A comprehensive onboarding and user tour system built on driver.js with full TypeScript support and LawnQuote design system integration.

## Features

- ✅ **Type-safe configuration** with full IntelliSense support
- ✅ **Custom error handling** with recovery strategies
- ✅ **LawnQuote design system** integration
- ✅ **Analytics tracking** support
- ✅ **Accessibility compliance** (WCAG 2.1)
- ✅ **Mobile-responsive** design
- ✅ **Local storage** persistence
- ✅ **Tour scheduling** and targeting
- ✅ **Progress tracking** and state management

## Quick Start

```typescript
import { createTourDriver, validateTourConfig } from '@/libs/onboarding';

const tourConfig = {
  tourId: 'welcome-tour',
  steps: [
    {
      id: 'step-1',
      element: '#welcome-button',
      title: 'Welcome to LawnQuote!',
      description: 'Click here to start creating your first quote.',
    },
    {
      id: 'step-2',
      element: '#dashboard-nav',
      title: 'Navigation',
      description: 'Use this menu to navigate between different sections.',
    }
  ]
};

// Validate configuration
const errors = validateTourConfig(tourConfig);
if (errors.length === 0) {
  const driver = createTourDriver(tourConfig);
  driver.drive();
} else {
  console.error('Tour configuration errors:', errors);
}
```

## Installation

The system is already installed and configured. The following components are included:

### Files Created

1. **`src/libs/onboarding/driver-config.ts`** - Core driver configuration and utilities
2. **`src/libs/onboarding/error-handling.ts`** - Error handling and recovery system
3. **`src/libs/onboarding/index.ts`** - Main export file
4. **`src/types/onboarding.ts`** - TypeScript type definitions
5. **`src/styles/onboarding.css`** - LawnQuote design system styles
6. **`src/libs/onboarding/__tests__/driver-config.test.ts`** - Test suite

### Dependencies

- **driver.js@1.3.6** - Core tour functionality
- All styles are integrated with existing LawnQuote design system

## Configuration

### Basic Tour Configuration

```typescript
import { TourConfig } from '@/libs/onboarding';

const tourConfig: TourConfig = {
  tourId: 'unique-tour-id',
  steps: [
    {
      id: 'step-1',
      element: '#target-element',
      title: 'Step Title',
      description: 'Step description with instructions',
      showProgress: true,
      allowClose: true,
      onNextClick: () => {
        console.log('User clicked next');
      }
    }
  ],
  analytics: {
    trackStart: true,
    trackComplete: true,
    trackStepView: true
  }
};
```

### Advanced Features

```typescript
import { OnboardingTour } from '@/types/onboarding';

const advancedTour: OnboardingTour = {
  id: 'advanced-tour',
  name: 'Advanced Feature Tour',
  description: 'Learn about advanced features',
  category: 'feature',
  priority: 10,
  targetRoles: ['admin', 'power-user'],
  requiredFeatures: ['advanced-features'],
  steps: [
    {
      id: 'step-1',
      element: '#advanced-button',
      title: 'Advanced Features',
      description: 'Access powerful tools here',
      validation: async () => {
        // Custom validation logic
        return document.querySelector('#advanced-button')?.getAttribute('aria-disabled') !== 'true';
      },
      prerequisites: ['basic-tour-completed']
    }
  ],
  scheduling: {
    delay: 2000,
    triggerRoutes: ['/dashboard'],
    maxShowCount: 3,
    newUserWindow: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
```

## Error Handling

The system includes comprehensive error handling with automatic recovery:

```typescript
import { 
  OnboardingErrorClass, 
  createOnboardingError, 
  handleOnboardingError 
} from '@/libs/onboarding';

try {
  const driver = createTourDriver(tourConfig);
  driver.drive();
} catch (error) {
  if (error instanceof OnboardingErrorClass) {
    // Handle onboarding-specific errors
    const result = await handleOnboardingError(error);
    if (!result.recovered) {
      console.error('Could not recover from error:', error.toUserMessage());
    }
  }
}
```

## Storage and Persistence

The system automatically manages tour progress:

```typescript
import { tourStorage } from '@/libs/onboarding';

// Check if user has completed a tour
if (tourStorage.isTourCompleted('welcome-tour')) {
  console.log('User has already seen the welcome tour');
}

// Mark a tour as completed
tourStorage.markTourCompleted('welcome-tour');

// Reset progress for a specific tour
tourStorage.resetTourProgress('welcome-tour');

// Reset all progress
tourStorage.resetTourProgress();
```

## Styling and Theming

The system uses LawnQuote design tokens and supports:

- **Light/dark mode** automatic switching
- **High contrast** mode support
- **Reduced motion** preferences
- **Mobile-responsive** design
- **Custom CSS variables** from LawnQuote design system

### Custom Styling

```css
/* Override specific tour styles */
.lawnquote-driver-popover[data-tour-category="onboarding"] {
  border-left: 4px solid hsl(var(--equipment-yellow));
}

.lawnquote-driver-popover[data-tour-category="feature"] {
  border-left: 4px solid hsl(var(--info-blue));
}
```

## Accessibility

The system is fully accessible and includes:

- **Keyboard navigation** support
- **Screen reader** announcements
- **Focus management** during tours
- **High contrast** mode support
- **Reduced motion** preferences
- **ARIA attributes** for all interactive elements

## Testing

Run the test suite:

```bash
npm test src/libs/onboarding/__tests__/
```

### Test Coverage

- ✅ Configuration validation
- ✅ Error handling and recovery
- ✅ Storage functionality
- ✅ Integration workflows

## API Reference

### Core Functions

#### `createTourDriver(config: TourConfig)`

Creates a new tour driver instance with error handling.

#### `validateTourConfig(config: TourConfig): string[]`

Validates tour configuration and returns array of errors.

#### `tourStorage`

Utilities for managing tour completion state:
- `getCompletedTours(): string[]`
- `markTourCompleted(tourId: string): void`
- `isTourCompleted(tourId: string): boolean`
- `resetTourProgress(tourId?: string): void`

### Error Handling

#### `OnboardingErrorClass`

Custom error class with recovery support.

#### `handleOnboardingError(error: OnboardingErrorClass)`

Attempts to recover from errors using built-in strategies.

#### `createOnboardingError`

Factory functions for creating common error types.

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  OnboardingTour,
  OnboardingStep,
  OnboardingState,
  OnboardingPreferences,
  UseOnboardingReturn
} from '@/types/onboarding';
```

## Integration with React

While this is the core infrastructure, React hooks and components can be built on top:

```typescript
// Future implementation
import { useOnboarding } from '@/hooks/useOnboarding';

function MyComponent() {
  const { startTour, state } = useOnboarding();
  
  return (
    <button onClick={() => startTour('welcome-tour')}>
      Start Tour
    </button>
  );
}
```

## Performance

The system is optimized for performance:

- **Lazy loading** of tour configurations
- **Minimal bundle impact** (driver.js is ~20KB gzipped)
- **Efficient DOM queries** with caching
- **Memory leak prevention** with proper cleanup
- **Storage optimization** with compression

## Browser Support

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When adding new features:

1. **Update TypeScript types** in `src/types/onboarding.ts`
2. **Add error codes** in `error-handling.ts`
3. **Update styles** in `src/styles/onboarding.css`
4. **Add tests** for new functionality
5. **Update documentation**

## Troubleshooting

### Common Issues

#### Tour not appearing
- Check if element selectors are correct
- Verify tour hasn't been completed already
- Check browser console for errors

#### Styling issues
- Ensure `src/styles/onboarding.css` is imported
- Check for CSS conflicts with existing styles
- Verify design tokens are available

#### Performance issues
- Check for memory leaks with browser dev tools
- Verify tours are being destroyed properly
- Monitor localStorage usage

### Debug Mode

Enable debug logging:

```typescript
localStorage.setItem('onboarding_debug', 'true');
```

This will enable verbose logging for troubleshooting.