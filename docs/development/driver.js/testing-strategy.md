# Testing Strategy: Driver.js Onboarding Implementation

## Overview

This document outlines the comprehensive testing strategy for the driver.js onboarding integration in LawnQuote, covering unit tests, integration tests, end-to-end tests, and user acceptance testing.

## Testing Pyramid

```mermaid
graph TD
    A[E2E Tests - 10%] --> B[Integration Tests - 20%]
    B --> C[Unit Tests - 70%]
    
    A1[User Journeys] --> A
    A2[Cross-browser] --> A
    A3[Mobile Testing] --> A
    
    B1[Component Integration] --> B
    B2[API Integration] --> B
    B3[Database Integration] --> B
    
    C1[Pure Functions] --> C
    C2[React Components] --> C
    C3[Hooks & Services] --> C
```

## Unit Testing

### 1. Tour Manager Service Tests

**File**: `src/libs/onboarding/__tests__/tour-manager.test.ts`

```typescript
import { TourManager } from '../tour-manager';
import { TOUR_CONFIGS } from '../tour-configs';
import { createMockDriver } from '../__mocks__/driver-mock';

describe('TourManager', () => {
  let tourManager: TourManager;
  let mockDriver: jest.Mocked<Driver>;

  beforeEach(() => {
    mockDriver = createMockDriver();
    tourManager = new TourManager();
    (tourManager as any).driverInstance = mockDriver;
  });

  describe('initializeTour', () => {
    it('should initialize tour with correct configuration', async () => {
      const tourId = 'welcome';
      const config = TOUR_CONFIGS.WELCOME_TOUR;

      await tourManager.initializeTour(tourId, config);

      expect(tourManager.getCurrentTour()).toBe(tourId);
      expect(mockDriver.setConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: config.steps,
          popoverClass: expect.stringContaining('lawnquote-tour')
        })
      );
    });

    it('should throw error for invalid tour configuration', async () => {
      const invalidConfig = { ...TOUR_CONFIGS.WELCOME_TOUR, steps: [] };

      await expect(
        tourManager.initializeTour('invalid', invalidConfig)
      ).rejects.toThrow('Tour configuration is invalid');
    });
  });

  describe('startTour', () => {
    beforeEach(async () => {
      await tourManager.initializeTour('welcome', TOUR_CONFIGS.WELCOME_TOUR);
    });

    it('should start tour and track analytics', async () => {
      const mockAnalytics = jest.fn();
      (tourManager as any).analytics = { trackTourStart: mockAnalytics };

      await tourManager.startTour('welcome');

      expect(mockDriver.drive).toHaveBeenCalled();
      expect(mockAnalytics).toHaveBeenCalledWith('welcome', expect.any(Object));
    });

    it('should not start tour if already active', async () => {
      mockDriver.isActive.mockReturnValue(true);

      await tourManager.startTour('welcome');

      expect(mockDriver.drive).not.toHaveBeenCalled();
    });
  });

  describe('completeTour', () => {
    it('should complete tour and update progress', async () => {
      const mockUpdateProgress = jest.fn();
      (tourManager as any).updateProgress = mockUpdateProgress;

      await tourManager.completeTour();

      expect(mockDriver.destroy).toHaveBeenCalled();
      expect(mockUpdateProgress).toHaveBeenCalledWith('completed');
    });
  });
});
```

### 2. Onboarding Context Tests

**File**: `src/contexts/onboarding/__tests__/OnboardingProvider.test.tsx`

```typescript
import { render, screen, waitFor, act } from '@testing-library/react';
import { OnboardingProvider, useOnboarding } from '../OnboardingProvider';
import { createMockSupabaseClient } from '@/test-utils/supabase-mock';
import { createMockUser } from '@/test-utils/user-mock';

const TestComponent = () => {
  const { startTour, isActive, currentTour } = useOnboarding();
  
  return (
    <div>
      <div data-testid="is-active">{isActive.toString()}</div>
      <div data-testid="current-tour">{currentTour || 'none'}</div>
      <button onClick={() => startTour('welcome')}>Start Tour</button>
    </div>
  );
};

describe('OnboardingProvider', () => {
  let mockSupabase: any;
  let mockUser: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockUser = createMockUser();
  });

  it('should provide onboarding context', async () => {
    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    expect(screen.getByTestId('is-active')).toHaveTextContent('false');
    expect(screen.getByTestId('current-tour')).toHaveTextContent('none');
  });

  it('should start tour when requested', async () => {
    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    act(() => {
      screen.getByText('Start Tour').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-active')).toHaveTextContent('true');
      expect(screen.getByTestId('current-tour')).toHaveTextContent('welcome');
    });
  });

  it('should load user progress on mount', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { completed_tours: ['welcome'], skipped_tours: [] }
          })
        })
      })
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('user_onboarding_progress');
    });
  });
});
```

### 3. Component Tests

**File**: `src/components/onboarding/__tests__/TourTrigger.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TourTrigger } from '../TourTrigger';
import { OnboardingProvider } from '@/contexts/onboarding/OnboardingProvider';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <OnboardingProvider>
      {component}
    </OnboardingProvider>
  );
};

describe('TourTrigger', () => {
  it('should render children correctly', () => {
    renderWithProvider(
      <TourTrigger tourId="welcome">
        <button>Start Tour</button>
      </TourTrigger>
    );

    expect(screen.getByText('Start Tour')).toBeInTheDocument();
  });

  it('should trigger tour on click', async () => {
    const mockStartTour = jest.fn();
    
    renderWithProvider(
      <TourTrigger tourId="welcome" trigger="click">
        <button>Start Tour</button>
      </TourTrigger>
    );

    fireEvent.click(screen.getByText('Start Tour'));

    await waitFor(() => {
      expect(mockStartTour).toHaveBeenCalledWith('welcome');
    });
  });

  it('should not trigger if tour is already completed', () => {
    const mockStartTour = jest.fn();
    
    renderWithProvider(
      <TourTrigger tourId="completed-tour">
        <button>Start Tour</button>
      </TourTrigger>
    );

    fireEvent.click(screen.getByText('Start Tour'));

    expect(mockStartTour).not.toHaveBeenCalled();
  });

  it('should trigger automatically with delay', async () => {
    jest.useFakeTimers();
    const mockStartTour = jest.fn();

    renderWithProvider(
      <TourTrigger tourId="welcome" trigger="auto" delay={1000}>
        <div>Auto trigger</div>
      </TourTrigger>
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockStartTour).toHaveBeenCalledWith('welcome');
    });

    jest.useRealTimers();
  });
});
```

## Integration Testing

### 1. Tour Flow Integration Tests

**File**: `src/__tests__/integration/tour-flows.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '@/app/App';
import { createMockSupabaseClient } from '@/test-utils/supabase-mock';
import { createMockUser } from '@/test-utils/user-mock';

describe('Tour Flow Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    
    // Mock successful user authentication
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: createMockUser() }
    });
  });

  it('should complete welcome tour flow', async () => {
    render(<App />);

    // Wait for app to load and tour to auto-start
    await waitFor(() => {
      expect(screen.getByText('Welcome to LawnQuote!')).toBeInTheDocument();
    });

    // Step through tour
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Your Command Center')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Main Navigation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Done'));

    // Verify tour completion
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('user_onboarding_progress');
    });
  });

  it('should handle tour skip correctly', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to LawnQuote!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Skip Tour'));

    await waitFor(() => {
      expect(screen.queryByText('Welcome to LawnQuote!')).not.toBeInTheDocument();
    });

    // Verify skip was tracked
    expect(mockSupabase.from).toHaveBeenCalledWith('onboarding_analytics');
  });
});
```

### 2. Database Integration Tests

**File**: `src/libs/onboarding/__tests__/onboarding-service.integration.test.ts`

```typescript
import { OnboardingService } from '../onboarding-service';
import { createTestSupabaseClient } from '@/test-utils/supabase-test-client';

describe('OnboardingService Integration', () => {
  let service: OnboardingService;
  let supabase: any;
  let testUserId: string;

  beforeAll(async () => {
    supabase = createTestSupabaseClient();
    service = new OnboardingService(supabase);
    
    // Create test user
    const { data: user } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword'
    });
    testUserId = user.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('user_onboarding_progress').delete().eq('user_id', testUserId);
    await supabase.from('onboarding_analytics').delete().eq('user_id', testUserId);
  });

  it('should create and retrieve user progress', async () => {
    const progress = {
      completedTours: ['welcome'],
      skippedTours: [],
      currentStep: 0,
      lastActiveDate: new Date().toISOString(),
      totalStepsCompleted: 5
    };

    await service.updateProgress(testUserId, progress);
    const retrieved = await service.getUserProgress(testUserId);

    expect(retrieved).toMatchObject(progress);
  });

  it('should track tour completion', async () => {
    await service.markTourCompleted(testUserId, 'quote-creation');
    
    const progress = await service.getUserProgress(testUserId);
    expect(progress.completedTours).toContain('quote-creation');
  });

  it('should track analytics events', async () => {
    await service.trackTourStart(testUserId, 'welcome');
    await service.trackStepCompletion(testUserId, 'welcome', 'step-1');
    await service.trackTourCompletion(testUserId, 'welcome', 120);

    const { data: events } = await supabase
      .from('onboarding_analytics')
      .select('*')
      .eq('user_id', testUserId)
      .eq('tour_id', 'welcome');

    expect(events).toHaveLength(3);
    expect(events.map(e => e.event_type)).toEqual([
      'tour_start',
      'step_complete', 
      'tour_complete'
    ]);
  });
});
```

## End-to-End Testing

### 1. Playwright E2E Tests

**File**: `tests/e2e/onboarding.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Onboarding Tours', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
  });

  test('should complete welcome tour successfully', async ({ page }) => {
    // Tour should auto-start for new users
    await expect(page.locator('.driver-popover')).toBeVisible();
    await expect(page.locator('.driver-popover-title')).toContainText('Welcome to LawnQuote!');

    // Step 1: Welcome message
    await page.click('[data-testid="tour-next-button"]');

    // Step 2: Dashboard overview
    await expect(page.locator('.driver-popover-title')).toContainText('Your Command Center');
    await page.click('[data-testid="tour-next-button"]');

    // Step 3: Navigation
    await expect(page.locator('.driver-popover-title')).toContainText('Main Navigation');
    await page.click('[data-testid="tour-next-button"]');

    // Step 4: Quick actions
    await expect(page.locator('.driver-popover-title')).toContainText('Quick Actions');
    await page.click('[data-testid="tour-next-button"]');

    // Final step
    await expect(page.locator('.driver-popover-title')).toContainText('You\'re All Set!');
    await page.click('[data-testid="tour-done-button"]');

    // Tour should be completed
    await expect(page.locator('.driver-popover')).not.toBeVisible();
    
    // Verify completion was tracked
    const response = await page.request.get('/api/onboarding/progress');
    const progress = await response.json();
    expect(progress.completedTours).toContain('welcome');
  });

  test('should handle tour skip correctly', async ({ page }) => {
    await expect(page.locator('.driver-popover')).toBeVisible();
    
    // Skip the tour
    await page.click('[data-testid="tour-close-button"]');
    
    // Tour should be dismissed
    await expect(page.locator('.driver-popover')).not.toBeVisible();
    
    // Verify skip was tracked
    const response = await page.request.get('/api/onboarding/progress');
    const progress = await response.json();
    expect(progress.skippedTours).toContain('welcome');
  });

  test('should work correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('.driver-popover')).toBeVisible();
    
    // Check mobile-specific styling
    const popover = page.locator('.driver-popover');
    await expect(popover).toHaveCSS('max-width', /calc\(100vw - 2rem\)/);
    
    // Test touch interactions
    await page.tap('[data-testid="tour-next-button"]');
    await expect(page.locator('.driver-popover-title')).toContainText('Your Command Center');
  });

  test('should handle quote creation tour', async ({ page }) => {
    // Navigate to quotes page
    await page.click('[data-testid="nav-quotes"]');
    
    // Click create new quote
    await page.click('[data-testid="create-quote-button"]');
    
    // Tour should start
    await expect(page.locator('.driver-popover')).toBeVisible();
    await expect(page.locator('.driver-popover-title')).toContainText('Choose Your Client');
    
    // Complete the tour interactively
    await page.selectOption('[data-testid="client-selector"]', 'test-client');
    await page.click('[data-testid="tour-next-button"]');
    
    await page.fill('[data-testid="quote-title"]', 'Test Quote');
    await page.click('[data-testid="tour-next-button"]');
    
    await page.click('[data-testid="add-item-button"]');
    await page.click('[data-testid="select-item-lawn-mowing"]');
    await page.click('[data-testid="tour-next-button"]');
    
    await page.click('[data-testid="tour-done-button"]');
    
    // Verify quote was created
    await expect(page.locator('[data-testid="quote-title"]')).toHaveValue('Test Quote');
  });
});
```

### 2. Cross-Browser Testing

**File**: `tests/e2e/cross-browser.spec.ts`

```typescript
import { test, expect, devices } from '@playwright/test';

const browsers = ['chromium', 'firefox', 'webkit'];
const devices_list = [
  devices['Desktop Chrome'],
  devices['Desktop Firefox'],
  devices['Desktop Safari'],
  devices['iPhone 12'],
  devices['iPad Pro'],
  devices['Pixel 5']
];

for (const device of devices_list) {
  test.describe(`Onboarding on ${device.name}`, () => {
    test.use({ ...device });

    test('should display tours correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Wait for tour to appear
      await expect(page.locator('.driver-popover')).toBeVisible({ timeout: 10000 });
      
      // Check popover is properly positioned
      const popover = page.locator('.driver-popover');
      const boundingBox = await popover.boundingBox();
      
      expect(boundingBox).toBeTruthy();
      expect(boundingBox!.width).toBeGreaterThan(200);
      expect(boundingBox!.height).toBeGreaterThan(100);
      
      // Check text is readable
      const title = page.locator('.driver-popover-title');
      await expect(title).toBeVisible();
      await expect(title).toHaveCSS('font-size', /\d+px/);
    });

    test('should handle interactions correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('.driver-popover')).toBeVisible();
      
      // Test button interactions
      const nextButton = page.locator('[data-testid="tour-next-button"]');
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled();
      
      await nextButton.click();
      
      // Verify step progression
      await expect(page.locator('.driver-popover-title')).not.toContainText('Welcome to LawnQuote!');
    });
  });
}
```

## Performance Testing

### 1. Bundle Size Testing

**File**: `tests/performance/bundle-size.test.ts`

```typescript
import { analyzeBundle } from '@/test-utils/bundle-analyzer';

describe('Bundle Size Impact', () => {
  it('should not increase bundle size significantly', async () => {
    const analysis = await analyzeBundle();
    
    // Driver.js should be under 50KB gzipped
    const driverSize = analysis.packages.find(p => p.name === 'driver.js');
    expect(driverSize?.gzippedSize).toBeLessThan(50 * 1024);
    
    // Total onboarding code should be under 100KB
    const onboardingSize = analysis.chunks
      .filter(c => c.name.includes('onboarding'))
      .reduce((total, chunk) => total + chunk.gzippedSize, 0);
    
    expect(onboardingSize).toBeLessThan(100 * 1024);
  });

  it('should lazy load tour definitions', async () => {
    const analysis = await analyzeBundle();
    
    // Tour definitions should be in separate chunks
    const tourChunks = analysis.chunks.filter(c => c.name.includes('tour-'));
    expect(tourChunks.length).toBeGreaterThan(0);
    
    // Each tour chunk should be reasonably sized
    tourChunks.forEach(chunk => {
      expect(chunk.gzippedSize).toBeLessThan(20 * 1024);
    });
  });
});
```

### 2. Runtime Performance Testing

**File**: `tests/performance/runtime-performance.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Runtime Performance', () => {
  test('should not impact page load performance', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      };
    });
    
    // Performance thresholds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
    expect(performanceMetrics.loadComplete).toBeLessThan(3000); // 3 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
  });

  test('should not cause memory leaks', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Start and complete multiple tours
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="start-tour-button"]');
      await page.click('[data-testid="tour-close-button"]');
      await page.waitForTimeout(100);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory increase should be minimal (less than 5MB)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
  });
});
```

## User Acceptance Testing

### 1. UAT Test Cases

**File**: `tests/uat/onboarding-uat.md`

```markdown
# User Acceptance Test Cases

## Test Case 1: First-Time User Experience
**Objective**: Verify new users can complete onboarding successfully
**Preconditions**: New user account, first login
**Steps**:
1. Login to application
2. Observe welcome tour auto-start
3. Complete all tour steps
4. Verify understanding of key features
**Expected Results**:
- Tour starts automatically
- All steps are clear and helpful
- User can navigate application confidently after tour

## Test Case 2: Tour Skip and Resume
**Objective**: Verify users can skip and resume tours
**Steps**:
1. Start welcome tour
2. Skip tour midway
3. Access tour again from help menu
4. Resume from beginning
**Expected Results**:
- Skip option is clearly available
- Tour can be restarted
- Progress is handled correctly

## Test Case 3: Mobile Experience
**Objective**: Verify tours work well on mobile devices
**Steps**:
1. Access application on mobile device
2. Complete welcome tour
3. Test touch interactions
4. Verify readability and usability
**Expected Results**:
- Tours are mobile-optimized
- Touch interactions work smoothly
- Text is readable on small screens
```

### 2. Accessibility Testing

**File**: `tests/accessibility/onboarding-a11y.test.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Onboarding Accessibility', () => {
  test('should be accessible with screen readers', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for tour to appear
    await expect(page.locator('.driver-popover')).toBeVisible();
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.driver-popover')).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="tour-next-button"]')).toBeFocused();
    
    await page.keyboard.press('Enter');
    await expect(page.locator('.driver-popover-title')).not.toContainText('Welcome');
    
    // Test escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('.driver-popover')).not.toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.driver-popover')).toBeVisible();
    
    // Check ARIA attributes
    const popover = page.locator('.driver-popover');
    await expect(popover).toHaveAttribute('role', 'dialog');
    await expect(popover).toHaveAttribute('aria-labelledby');
    await expect(popover).toHaveAttribute('aria-describedby');
    
    // Check button labels
    const nextButton = page.locator('[data-testid="tour-next-button"]');
    await expect(nextButton).toHaveAttribute('aria-label');
  });
});
```

## Test Automation and CI/CD

### 1. GitHub Actions Workflow

**File**: `.github/workflows/onboarding-tests.yml`

```yaml
name: Onboarding Tests

on:
  push:
    branches: [main, develop]
    paths: ['src/libs/onboarding/**', 'src/components/onboarding/**']
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit -- --coverage --testPathPattern=onboarding
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration -- --testPathPattern=onboarding
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e -- tests/e2e/onboarding.spec.ts
        env:
          CI: true

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:performance
      - run: npm run analyze:bundle
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: After testing implementation
