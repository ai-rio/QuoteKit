# Testing Strategy

## Testing Overview

This document outlines the comprehensive testing strategy for Formbricks integration with QuoteKit, covering unit tests, integration tests, end-to-end tests, and user acceptance testing.

## Testing Pyramid

```
    /\
   /  \     E2E Tests (Few)
  /____\    - User journey testing
 /      \   - Survey flow validation
/________\  Integration Tests (Some)
           - API integration testing
           - Component integration
___________
Unit Tests (Many)
- Service layer testing
- Component testing
- Utility function testing
```

## Unit Testing

### 1. FormbricksManager Service Tests

```typescript
// __tests__/lib/formbricks/manager.test.ts
import { FormbricksManager } from '@/lib/formbricks/manager';

// Mock the Formbricks SDK
jest.mock('@formbricks/js/app', () => ({
  init: jest.fn(),
  setAttributes: jest.fn(),
  track: jest.fn(),
}));

describe('FormbricksManager', () => {
  let manager: FormbricksManager;

  beforeEach(() => {
    manager = FormbricksManager.getInstance();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const config = {
        environmentId: 'test-env-id',
        apiHost: 'https://test.formbricks.com',
        userId: 'user-123',
      };

      await manager.initialize(config);
      
      expect(manager.isInitialized()).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      const mockInit = require('@formbricks/js/app').init;
      mockInit.mockRejectedValueOnce(new Error('Network error'));

      const config = {
        environmentId: 'test-env-id',
        apiHost: 'https://test.formbricks.com',
      };

      await expect(manager.initialize(config)).rejects.toThrow('Network error');
      expect(manager.isInitialized()).toBe(false);
    });

    it('should not reinitialize if already initialized', async () => {
      const config = {
        environmentId: 'test-env-id',
        apiHost: 'https://test.formbricks.com',
      };

      await manager.initialize(config);
      await manager.initialize(config); // Second call

      const mockInit = require('@formbricks/js/app').init;
      expect(mockInit).toHaveBeenCalledTimes(1);
    });
  });

  describe('event tracking', () => {
    beforeEach(async () => {
      await manager.initialize({
        environmentId: 'test-env-id',
        apiHost: 'https://test.formbricks.com',
      });
    });

    it('should track events when initialized', () => {
      const eventName = 'test_event';
      const properties = { key: 'value' };

      manager.trackEvent(eventName, properties);

      const mockTrack = require('@formbricks/js/app').track;
      expect(mockTrack).toHaveBeenCalledWith(eventName, properties);
    });

    it('should not track events when not initialized', () => {
      const uninitializedManager = new (FormbricksManager as any)();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      uninitializedManager.trackEvent('test_event');

      expect(consoleSpy).toHaveBeenCalledWith('Formbricks not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('user attributes', () => {
    beforeEach(async () => {
      await manager.initialize({
        environmentId: 'test-env-id',
        apiHost: 'https://test.formbricks.com',
      });
    });

    it('should set user attributes when initialized', () => {
      const attributes = {
        email: 'test@example.com',
        tier: 'premium',
      };

      manager.setUserAttributes(attributes);

      const mockSetAttributes = require('@formbricks/js/app').setAttributes;
      expect(mockSetAttributes).toHaveBeenCalledWith(attributes);
    });
  });
});
```

### 2. Tracking Hook Tests

```typescript
// __tests__/hooks/useFormbricksTracking.test.ts
import { renderHook } from '@testing-library/react';
import { useFormbricksTracking } from '@/hooks/useFormbricksTracking';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('next/navigation');
jest.mock('@/lib/formbricks/manager');

describe('useFormbricksTracking', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    subscriptionTier: 'premium',
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('should track events with correct context', () => {
    const { result } = renderHook(() => useFormbricksTracking());
    
    const mockManager = {
      isInitialized: jest.fn().mockReturnValue(true),
      trackEvent: jest.fn(),
    };
    
    require('@/lib/formbricks/manager').FormbricksManager.getInstance.mockReturnValue(mockManager);

    result.current.trackEvent('test_event', { custom: 'data' });

    expect(mockManager.trackEvent).toHaveBeenCalledWith('test_event', {
      custom: 'data',
      timestamp: expect.any(String),
      page: '/dashboard',
      userTier: 'premium',
      userId: 'user-123',
    });
  });

  it('should handle uninitialized manager gracefully', () => {
    const { result } = renderHook(() => useFormbricksTracking());
    
    const mockManager = {
      isInitialized: jest.fn().mockReturnValue(false),
      trackEvent: jest.fn(),
    };
    
    require('@/lib/formbricks/manager').FormbricksManager.getInstance.mockReturnValue(mockManager);

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    result.current.trackEvent('test_event');

    expect(consoleSpy).toHaveBeenCalledWith(
      'Formbricks not initialized, skipping event:',
      'test_event'
    );
    expect(mockManager.trackEvent).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
```

### 3. Component Tests

```typescript
// __tests__/components/feedback/FeedbackWidget.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { useFormbricksTracking } from '@/hooks/useFormbricksTracking';

jest.mock('@/hooks/useFormbricksTracking');

describe('FeedbackWidget', () => {
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    (useFormbricksTracking as jest.Mock).mockReturnValue({
      trackEvent: mockTrackEvent,
    });
    
    // Clear localStorage
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should render widget after delay', async () => {
    render(<FeedbackWidget delay={100} />);

    // Widget should not be visible initially
    expect(screen.queryByLabelText('Provide feedback')).not.toBeInTheDocument();

    // Wait for delay
    await waitFor(() => {
      expect(screen.getByLabelText('Provide feedback')).toBeInTheDocument();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('feedback_widget_shown', {
      position: 'bottom-right',
      context: {},
      autoShow: true,
    });
  });

  it('should track click events', async () => {
    render(<FeedbackWidget delay={0} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Provide feedback')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Provide feedback'));

    expect(mockTrackEvent).toHaveBeenCalledWith('feedback_widget_clicked', {
      position: 'bottom-right',
      context: {},
    });
  });

  it('should handle dismissal correctly', async () => {
    render(<FeedbackWidget delay={0} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Dismiss feedback widget')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Dismiss feedback widget'));

    expect(mockTrackEvent).toHaveBeenCalledWith('feedback_widget_dismissed', {
      position: 'bottom-right',
      context: {},
    });

    expect(screen.queryByLabelText('Provide feedback')).not.toBeInTheDocument();
    expect(localStorage.getItem('feedback-widget-dismissed')).toBeTruthy();
  });

  it('should respect previous dismissal', () => {
    // Set dismissal timestamp to 1 hour ago
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    localStorage.setItem('feedback-widget-dismissed', oneHourAgo.toString());

    render(<FeedbackWidget delay={0} />);

    // Widget should not appear
    expect(screen.queryByLabelText('Provide feedback')).not.toBeInTheDocument();
  });
});
```

## Integration Testing

### 1. Provider Integration Tests

```typescript
// __tests__/integration/formbricks-provider.test.tsx
import { render, waitFor } from '@testing-library/react';
import { FormbricksProvider } from '@/components/providers/FormbricksProvider';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');
jest.mock('@/lib/formbricks/manager');

describe('FormbricksProvider Integration', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    subscriptionTier: 'free',
    stats: { totalQuotes: 5 },
    createdAt: new Date('2023-01-01'),
    profile: {
      industry: 'landscaping',
      companySize: 'small',
    },
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID = 'test-env-id';
    process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST = 'https://test.formbricks.com';
  });

  it('should initialize Formbricks with user data', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });

    const mockManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      setUserAttributes: jest.fn(),
      trackEvent: jest.fn(),
    };

    require('@/lib/formbricks/manager').FormbricksManager.getInstance.mockReturnValue(mockManager);

    render(<FormbricksProvider />);

    await waitFor(() => {
      expect(mockManager.initialize).toHaveBeenCalledWith({
        environmentId: 'test-env-id',
        apiHost: 'https://test.formbricks.com',
        userId: 'user-123',
      });
    });

    expect(mockManager.setUserAttributes).toHaveBeenCalledWith({
      email: 'test@example.com',
      subscriptionTier: 'free',
      quotesCreated: 5,
      signupDate: '2023-01-01T00:00:00.000Z',
      industry: 'landscaping',
      companySize: 'small',
    });

    expect(mockManager.trackEvent).toHaveBeenCalledWith('formbricks_initialized', {
      userId: 'user-123',
      tier: 'free',
    });
  });

  it('should handle initialization errors gracefully', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });

    const mockManager = {
      initialize: jest.fn().mockRejectedValue(new Error('Network error')),
      setUserAttributes: jest.fn(),
      trackEvent: jest.fn(),
    };

    require('@/lib/formbricks/manager').FormbricksManager.getInstance.mockReturnValue(mockManager);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<FormbricksProvider />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Formbricks initialization error:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
```

### 2. Event Flow Integration Tests

```typescript
// __tests__/integration/event-flow.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useFormbricksTracking } from '@/hooks/useFormbricksTracking';
import { FORMBRICKS_EVENTS } from '@/lib/formbricks/events';

// Test component that uses tracking
function TestComponent() {
  const { trackEvent } = useFormbricksTracking();

  const handleQuoteCreated = () => {
    trackEvent(FORMBRICKS_EVENTS.QUOTE_CREATED, {
      quoteId: 'quote-123',
      quoteValue: 1500,
      complexity: 'medium',
    });
  };

  return (
    <button onClick={handleQuoteCreated}>
      Create Quote
    </button>
  );
}

describe('Event Flow Integration', () => {
  it('should track quote creation with correct data', async () => {
    const mockManager = {
      isInitialized: jest.fn().mockReturnValue(true),
      trackEvent: jest.fn(),
    };

    require('@/lib/formbricks/manager').FormbricksManager.getInstance.mockReturnValue(mockManager);

    render(<TestComponent />);

    fireEvent.click(screen.getByText('Create Quote'));

    expect(mockManager.trackEvent).toHaveBeenCalledWith(
      'quote_created',
      expect.objectContaining({
        quoteId: 'quote-123',
        quoteValue: 1500,
        complexity: 'medium',
        timestamp: expect.any(String),
      })
    );
  });
});
```

## End-to-End Testing

### 1. Survey Flow E2E Tests

```typescript
// __tests__/e2e/survey-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Formbricks Survey Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Formbricks API responses
    await page.route('**/api/v1/**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        route.continue();
      }
    });

    // Login as test user
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should show feedback widget on dashboard', async ({ page }) => {
    // Wait for widget to appear
    await expect(page.locator('[aria-label="Provide feedback"]')).toBeVisible({
      timeout: 10000,
    });

    // Click feedback widget
    await page.click('[aria-label="Provide feedback"]');

    // Verify tracking event was sent
    const requests = page.context().requests;
    const trackingRequest = requests.find(req => 
      req.url().includes('formbricks') && req.method() === 'POST'
    );
    
    expect(trackingRequest).toBeTruthy();
  });

  test('should trigger survey after quote creation', async ({ page }) => {
    // Navigate to quote creation
    await page.click('[data-testid="create-quote-button"]');
    await page.waitForURL('/quotes/new');

    // Fill out quote form
    await page.fill('[data-testid="client-name"]', 'Test Client');
    await page.fill('[data-testid="quote-total"]', '1500');
    await page.click('[data-testid="save-quote"]');

    // Wait for success message
    await expect(page.locator('[data-testid="quote-success"]')).toBeVisible();

    // Survey should appear after delay
    await expect(page.locator('[data-testid="formbricks-survey"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should handle widget dismissal', async ({ page }) => {
    // Wait for widget to appear
    await expect(page.locator('[aria-label="Provide feedback"]')).toBeVisible();

    // Dismiss widget
    await page.click('[aria-label="Dismiss feedback widget"]');

    // Widget should disappear
    await expect(page.locator('[aria-label="Provide feedback"]')).not.toBeVisible();

    // Refresh page
    await page.reload();

    // Widget should not reappear
    await page.waitForTimeout(6000); // Wait longer than auto-show delay
    await expect(page.locator('[aria-label="Provide feedback"]')).not.toBeVisible();
  });
});
```

### 2. Performance E2E Tests

```typescript
// __tests__/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Formbricks Performance', () => {
  test('should not significantly impact page load time', async ({ page }) => {
    // Measure page load time without Formbricks
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const startTime = Date.now();
    await page.reload({ waitUntil: 'networkidle' });
    const loadTimeWithFormbricks = Date.now() - startTime;

    // Load time should be reasonable (under 3 seconds)
    expect(loadTimeWithFormbricks).toBeLessThan(3000);

    // Check for JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Block Formbricks API requests
    await page.route('**/formbricks**', route => {
      route.abort('failed');
    });

    await page.goto('/dashboard');

    // Page should still load and function
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();

    // Check that fallback feedback is shown
    await expect(page.locator('a[href*="mailto:feedback"]')).toBeVisible({
      timeout: 10000,
    });
  });
});
```

## User Acceptance Testing

### 1. UAT Test Scenarios

```markdown
# User Acceptance Test Scenarios

## Scenario 1: Dashboard Feedback Collection
**Objective**: Verify users can provide feedback from the dashboard

**Steps**:
1. Login to QuoteKit
2. Navigate to dashboard
3. Wait for feedback widget to appear (should be within 5 seconds)
4. Click on feedback widget
5. Complete the survey that appears
6. Verify survey completion confirmation

**Expected Results**:
- Feedback widget appears automatically
- Survey is relevant to dashboard experience
- Survey completion is confirmed
- User can dismiss widget if not interested

## Scenario 2: Quote Creation Feedback
**Objective**: Verify feedback collection after quote creation

**Steps**:
1. Create a new quote with multiple line items
2. Save the quote successfully
3. Wait for post-creation survey (should appear within 3 seconds)
4. Complete the survey about quote creation experience
5. Verify feedback is recorded

**Expected Results**:
- Survey appears after quote creation
- Questions are relevant to quote creation experience
- Survey adapts based on quote complexity
- Completion doesn't interfere with next actions

## Scenario 3: Upgrade Flow Feedback
**Objective**: Verify feedback collection during upgrade hesitation

**Steps**:
1. As a free tier user, reach the 5 quote limit
2. Navigate to upgrade page
3. Start to leave the page without upgrading
4. Complete the exit-intent survey
5. Verify reasons for not upgrading are captured

**Expected Results**:
- Exit-intent survey appears when leaving upgrade page
- Survey captures specific reasons for upgrade hesitation
- Feedback helps identify conversion barriers
- User can still complete upgrade after survey
```

### 2. UAT Checklist

```markdown
# User Acceptance Testing Checklist

## Functionality Testing
- [ ] Formbricks SDK initializes without errors
- [ ] User identification works correctly
- [ ] Event tracking captures user actions
- [ ] Surveys appear at appropriate times
- [ ] Survey responses are recorded accurately
- [ ] Widget dismissal works and persists
- [ ] Fallback feedback works when Formbricks unavailable

## User Experience Testing
- [ ] Surveys are contextually relevant
- [ ] Survey timing doesn't interrupt workflows
- [ ] Questions are clear and easy to understand
- [ ] Survey completion time is reasonable (<2 minutes)
- [ ] Visual design matches QuoteKit branding
- [ ] Mobile experience is optimized

## Performance Testing
- [ ] Page load time impact is minimal (<100ms)
- [ ] No JavaScript errors in browser console
- [ ] Memory usage remains stable
- [ ] Network requests are optimized
- [ ] Graceful degradation when service unavailable

## Data Quality Testing
- [ ] User attributes sync correctly
- [ ] Event data includes proper context
- [ ] Survey responses include user metadata
- [ ] Data export functionality works
- [ ] Analytics dashboard shows accurate data

## Security Testing
- [ ] No sensitive data exposed in client-side code
- [ ] API keys are properly secured
- [ ] User consent is properly managed
- [ ] Data transmission is encrypted
- [ ] Privacy preferences are respected
```

## Test Data Management

### 1. Test User Accounts

```typescript
// __tests__/fixtures/test-users.ts
export const TEST_USERS = {
  FREE_USER: {
    id: 'test-free-user',
    email: 'free@test.com',
    subscriptionTier: 'free',
    stats: { totalQuotes: 3 },
  },
  PREMIUM_USER: {
    id: 'test-premium-user',
    email: 'premium@test.com',
    subscriptionTier: 'premium',
    stats: { totalQuotes: 25 },
  },
  NEW_USER: {
    id: 'test-new-user',
    email: 'new@test.com',
    subscriptionTier: 'free',
    stats: { totalQuotes: 0 },
    createdAt: new Date(),
  },
};
```

### 2. Mock Survey Data

```typescript
// __tests__/fixtures/survey-data.ts
export const MOCK_SURVEYS = {
  DASHBOARD_SURVEY: {
    id: 'dashboard-satisfaction',
    questions: [
      {
        id: 'satisfaction',
        type: 'rating',
        text: 'How satisfied are you with the dashboard?',
      },
      {
        id: 'improvements',
        type: 'text',
        text: 'What would make the dashboard better?',
      },
    ],
  },
  QUOTE_CREATION_SURVEY: {
    id: 'quote-creation-experience',
    questions: [
      {
        id: 'ease',
        type: 'rating',
        text: 'How easy was it to create this quote?',
      },
    ],
  },
};
```

## Continuous Testing

### 1. Automated Test Pipeline

```yaml
# .github/workflows/formbricks-tests.yml
name: Formbricks Integration Tests

on:
  push:
    branches: [main, develop]
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
      - run: pnpm install
      - run: pnpm test:formbricks:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:formbricks:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm test:formbricks:e2e
```

### 2. Test Scripts

```json
{
  "scripts": {
    "test:formbricks": "jest --testPathPattern=formbricks",
    "test:formbricks:unit": "jest --testPathPattern=formbricks --testPathIgnorePatterns=integration,e2e",
    "test:formbricks:integration": "jest --testPathPattern=formbricks/integration",
    "test:formbricks:e2e": "playwright test --grep=formbricks",
    "test:formbricks:watch": "jest --testPathPattern=formbricks --watch",
    "test:formbricks:coverage": "jest --testPathPattern=formbricks --coverage"
  }
}
```

This comprehensive testing strategy ensures the Formbricks integration is reliable, performant, and provides a great user experience while maintaining QuoteKit's quality standards.
