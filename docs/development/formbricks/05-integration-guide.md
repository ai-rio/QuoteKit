# Integration Guide - Step-by-Step Implementation

## Prerequisites

### System Requirements
- Node.js 18+ and pnpm
- QuoteKit development environment running
- Formbricks Cloud account or self-hosted instance
- Admin access to QuoteKit codebase

### Environment Setup
```bash
# Verify Node.js version
node --version  # Should be 18+

# Verify QuoteKit is running
pnpm dev  # Should start without errors

# Verify database connection
pnpm db:status  # Should show connected
```

---

## Step 1: Formbricks Account Setup

### 1.1 Create Formbricks Cloud Account
```bash
# Visit https://app.formbricks.com/auth/signup
# Or set up self-hosted instance following their docs
```

### 1.2 Get Environment Credentials
1. Navigate to Settings → Setup Checklist
2. Copy your Environment ID
3. Note your API Host URL (usually `https://app.formbricks.com`)

### 1.3 Configure Environment Variables
```bash
# Add to .env.local
NEXT_PUBLIC_FORMBRICKS_ENV_ID=your_environment_id_here
NEXT_PUBLIC_FORMBRICKS_APP_URL=https://app.formbricks.com
FORMBRICKS_API_KEY=your_api_key_here  # For server-side operations
```

---

## Step 2: Install Dependencies

### 2.1 Install Formbricks SDK
```bash
# Install the main SDK with required peer dependency
pnpm add @formbricks/js zod

# Install additional dependencies for TypeScript support
pnpm add -D @types/node
```

### 2.2 Verify Installation
```bash
# Check package.json includes the dependency
grep "@formbricks/js" package.json
```

---

## Step 3: Core Integration Implementation

### 3.1 Create Formbricks Manager Service
```typescript
// lib/formbricks/manager.ts
import formbricks from "@formbricks/js";

export interface FormbricksConfig {
  environmentId: string;
  appUrl: string;
  userId?: string;
}

export class FormbricksManager {
  private static instance: FormbricksManager;
  private initialized = false;
  private config: FormbricksConfig | null = null;

  static getInstance(): FormbricksManager {
    if (!FormbricksManager.instance) {
      FormbricksManager.instance = new FormbricksManager();
    }
    return FormbricksManager.instance;
  }

  async initialize(config: FormbricksConfig): Promise<void> {
    if (this.initialized) {
      console.warn('Formbricks already initialized');
      return;
    }

    try {
      this.config = config;
      
      // Updated initialization method
      formbricks.setup({
        environmentId: config.environmentId,
        appUrl: config.appUrl,
      });

      // Set user attributes separately if needed
      if (config.userId) {
        formbricks.setAttributes({ userId: config.userId });
      }

      this.initialized = true;
      console.log('Formbricks initialized successfully');
    } catch (error) {
      console.error('Formbricks initialization failed:', error);
      throw error;
    }
  }

  setUserAttributes(attributes: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('Formbricks not initialized');
      return;
    }

    try {
      formbricks.setAttributes(attributes);
    } catch (error) {
      console.error('Failed to set user attributes:', error);
    }
  }

  registerRouteChange(): void {
    if (!this.initialized) {
      console.warn('Formbricks not initialized');
      return;
    }

    try {
      formbricks.registerRouteChange();
    } catch (error) {
      console.error('Failed to register route change:', error);
    }
  }

  // Legacy method for backward compatibility
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('Formbricks not initialized');
      return;
    }

    try {
      // Note: Direct event tracking may not be available in latest SDK
      // Consider using user attributes or actions instead
      console.warn('Direct event tracking deprecated. Use setAttributes or actions instead.');
      
      // Alternative: Set attributes that can trigger surveys
      if (properties) {
        this.setUserAttributes({
          lastAction: eventName,
          lastActionTime: new Date().toISOString(),
          ...properties,
        });
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
```

### 3.2 Create Provider Component
```typescript
// components/providers/FormbricksProvider.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import formbricks from '@formbricks/js';

export function FormbricksProvider() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user) return;

    const initializeFormbricks = async () => {
      try {
        // Updated initialization using setup method
        formbricks.setup({
          environmentId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID!,
          appUrl: process.env.NEXT_PUBLIC_FORMBRICKS_APP_URL!,
        });

        // Set initial user attributes
        formbricks.setAttributes({
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          quotesCreated: user.stats?.totalQuotes || 0,
          signupDate: user.createdAt.toISOString(),
          industry: user.profile?.industry,
          companySize: user.profile?.companySize,
          userId: user.id,
        });

        console.log('Formbricks initialized successfully');

      } catch (error) {
        console.error('Formbricks initialization error:', error);
        // Graceful degradation - app continues to work
      }
    };

    initializeFormbricks();
  }, [user]);

  // Register route changes for survey triggering
  useEffect(() => {
    formbricks?.registerRouteChange();
  }, [pathname, searchParams]);

  return null;
}
```

### 3.3 Add Provider to Layout
```typescript
// app/layout.tsx
import { FormbricksProvider } from '@/components/providers/FormbricksProvider';
import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <FormbricksProvider />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
```

---

## Step 4: Event Tracking Implementation

### 4.1 Create Event Definitions
```typescript
// lib/formbricks/events.ts
export const FORMBRICKS_EVENTS = {
  // Dashboard Events
  DASHBOARD_VISIT: 'dashboard_visit',
  USAGE_STATS_VIEWED: 'usage_stats_viewed',
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  
  // Quote Events
  QUOTE_CREATED: 'quote_created',
  QUOTE_SENT: 'quote_sent',
  QUOTE_ACCEPTED: 'quote_accepted',
  FIRST_QUOTE_CREATED: 'first_quote_created',
  
  // User Journey Events
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FEATURE_DISCOVERED: 'feature_discovered',
  HELP_REQUESTED: 'help_requested',
  
  // Conversion Events
  UPGRADE_INITIATED: 'upgrade_initiated',
  UPGRADE_COMPLETED: 'upgrade_completed',
  UPGRADE_ABANDONED: 'upgrade_abandoned',
  
  // Feedback Events
  FEEDBACK_WIDGET_SHOWN: 'feedback_widget_shown',
  FEEDBACK_WIDGET_CLICKED: 'feedback_widget_clicked',
  SURVEY_STARTED: 'survey_started',
  SURVEY_COMPLETED: 'survey_completed',
} as const;

export type FormbricksEventName = typeof FORMBRICKS_EVENTS[keyof typeof FORMBRICKS_EVENTS];
```

### 4.2 Create Tracking Hook
```typescript
// hooks/useFormbricksTracking.ts
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePathname } from 'next/navigation';
import formbricks from '@formbricks/js';
import { FormbricksEventName } from '@/lib/formbricks/events';

export function useFormbricksTracking() {
  const { user } = useAuth();
  const pathname = usePathname();

  const trackEvent = useCallback((
    eventName: FormbricksEventName,
    properties?: Record<string, any>
  ) => {
    try {
      // Use attributes to trigger surveys instead of direct event tracking
      const eventData = {
        lastAction: eventName,
        lastActionTime: new Date().toISOString(),
        lastActionPage: pathname,
        userTier: user?.subscriptionTier || 'unknown',
        userId: user?.id,
        ...properties,
      };

      formbricks.setAttributes(eventData);
      
      // Log for debugging
      console.log(`Formbricks: Set attributes for ${eventName}`, eventData);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [user, pathname]);

  const updateUserAttributes = useCallback((attributes: Record<string, any>) => {
    try {
      formbricks.setAttributes(attributes);
    } catch (error) {
      console.error('Failed to update user attributes:', error);
    }
  }, []);

  const registerRouteChange = useCallback(() => {
    try {
      formbricks.registerRouteChange();
    } catch (error) {
      console.error('Failed to register route change:', error);
    }
  }, []);

  return {
    trackEvent,
    updateUserAttributes,
    registerRouteChange,
  };
}
```

---

## Step 5: Dashboard Integration

### 5.1 Add Dashboard Tracking
```typescript
// app/(app)/dashboard/page.tsx
import { useEffect } from 'react';
import { useFormbricksTracking } from '@/hooks/useFormbricksTracking';
import { FORMBRICKS_EVENTS } from '@/lib/formbricks/events';

export default function DashboardPage() {
  const { trackEvent } = useFormbricksTracking();
  const dashboardData = await getDashboardData();

  useEffect(() => {
    // Track dashboard visit
    trackEvent(FORMBRICKS_EVENTS.DASHBOARD_VISIT, {
      quotesThisMonth: dashboardData.stats.totalQuotes,
      totalRevenue: dashboardData.stats.totalRevenue,
      visitTime: new Date().toISOString(),
    });

    // Track if user is approaching limits
    if (dashboardData.stats.totalQuotes >= 4) {
      trackEvent(FORMBRICKS_EVENTS.USAGE_LIMIT_APPROACHING, {
        quotesUsed: dashboardData.stats.totalQuotes,
        quotesRemaining: 5 - dashboardData.stats.totalQuotes,
      });
    }
  }, [trackEvent, dashboardData]);

  return (
    <div className="dashboard">
      {/* Existing dashboard content */}
      <FeedbackWidget 
        position="bottom-right"
        context={{
          page: 'dashboard',
          userStats: dashboardData.stats,
        }}
      />
    </div>
  );
}
```

### 5.2 Create Feedback Widget
```typescript
// components/feedback/FeedbackWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useFormbricksTracking } from '@/hooks/useFormbricksTracking';
import { FORMBRICKS_EVENTS } from '@/lib/formbricks/events';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  context?: Record<string, any>;
  autoShow?: boolean;
  delay?: number;
}

export function FeedbackWidget({ 
  position = 'bottom-right',
  context = {},
  autoShow = true,
  delay = 5000
}: FeedbackWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { trackEvent } = useFormbricksTracking();

  useEffect(() => {
    if (!autoShow || isDismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      trackEvent(FORMBRICKS_EVENTS.FEEDBACK_WIDGET_SHOWN, {
        position,
        context,
        autoShow,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [autoShow, isDismissed, delay, position, context, trackEvent]);

  const handleClick = () => {
    trackEvent(FORMBRICKS_EVENTS.FEEDBACK_WIDGET_CLICKED, {
      position,
      context,
    });

    // Trigger Formbricks survey
    trackEvent('feedback_requested', {
      source: 'widget',
      ...context,
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    
    // Store dismissal in localStorage
    localStorage.setItem('feedback-widget-dismissed', Date.now().toString());
    
    trackEvent('feedback_widget_dismissed', {
      position,
      context,
    });
  };

  // Check if previously dismissed (within 24 hours)
  useEffect(() => {
    const dismissed = localStorage.getItem('feedback-widget-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursSinceDismissal < 24) {
        setIsDismissed(true);
      }
    }
  }, []);

  if (!isVisible || isDismissed) return null;

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 animate-fade-in`}>
      <div className="relative bg-forest-green text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
        <button
          onClick={handleClick}
          className="flex items-center space-x-2"
          aria-label="Provide feedback"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="hidden group-hover:block text-sm font-medium whitespace-nowrap">
            Quick Feedback
          </span>
        </button>
        
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          aria-label="Dismiss feedback widget"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
```

---

## Step 6: Quote Creation Integration

### 6.1 Add Quote Creation Tracking
```typescript
// app/(app)/quotes/new/page.tsx
import { useFormbricksTracking } from '@/hooks/useFormbricksTracking';
import { FORMBRICKS_EVENTS } from '@/lib/formbricks/events';

export default function NewQuotePage() {
  const { trackEvent } = useFormbricksTracking();

  const handleQuoteCreated = async (quote: Quote) => {
    // Save quote to database
    const savedQuote = await saveQuote(quote);

    // Calculate quote complexity
    const complexity = calculateQuoteComplexity(quote);
    
    // Track quote creation
    trackEvent(FORMBRICKS_EVENTS.QUOTE_CREATED, {
      quoteId: savedQuote.id,
      quoteValue: quote.total,
      lineItemCount: quote.lineItems.length,
      complexity: complexity.level, // 'simple', 'medium', 'complex'
      timeToComplete: complexity.timeSpent,
      clientType: quote.clientType,
    });

    // Trigger post-creation survey after a delay
    setTimeout(() => {
      trackEvent('quote_creation_feedback_eligible', {
        quoteId: savedQuote.id,
        complexity: complexity.level,
      });
    }, 3000); // 3 second delay
  };

  return (
    <div className="quote-creation">
      <QuoteCreator onQuoteCreated={handleQuoteCreated} />
      
      {/* Survey trigger component */}
      <SurveyTrigger 
        eventName="quote_creation_survey"
        condition={true} // Will be triggered by the event above
        context={{
          page: 'quote-creation',
          step: 'completion',
        }}
      />
    </div>
  );
}
```

### 6.2 Create Survey Trigger Component
```typescript
// components/feedback/SurveyTrigger.tsx
'use client';

import { useEffect } from 'react';
import { useFormbricksTracking } from '@/hooks/useFormbricksTracking';

interface SurveyTriggerProps {
  eventName: string;
  condition: boolean;
  context?: Record<string, any>;
  delay?: number;
}

export function SurveyTrigger({ 
  eventName, 
  condition, 
  context = {},
  delay = 0 
}: SurveyTriggerProps) {
  const { trackEvent } = useFormbricksTracking();

  useEffect(() => {
    if (!condition) return;

    const timer = setTimeout(() => {
      trackEvent(eventName, {
        triggeredAt: new Date().toISOString(),
        ...context,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [condition, eventName, context, delay, trackEvent]);

  return null; // This component doesn't render anything
}
```

---

## Step 7: Create Surveys in Formbricks

### 7.1 Dashboard Satisfaction Survey
1. Log into Formbricks dashboard
2. Create new survey: "Dashboard Experience"
3. Add questions:
   ```
   Question 1: "How satisfied are you with the QuoteKit dashboard?"
   Type: Rating (1-5 stars)
   
   Question 2: "What would make the dashboard more useful for you?"
   Type: Open text (optional)
   ```
4. Set trigger: Event-based → `dashboard_visit`
5. Add targeting: Users who have visited dashboard 3+ times

### 7.2 Quote Creation Survey
1. Create new survey: "Quote Creation Experience"
2. Add questions:
   ```
   Question 1: "How easy was it to create this quote?"
   Type: Rating (1-5 stars)
   
   Question 2: "Did you find all the features you needed?"
   Type: Yes/No with follow-up
   
   Question 3 (if No): "What was missing?"
   Type: Open text
   ```
3. Set trigger: Event-based → `quote_creation_feedback_eligible`
4. Add logic: Show different questions based on quote complexity

---

## Step 8: Testing and Validation

### 8.1 Local Testing
```bash
# Start development server
pnpm dev

# Open browser and check:
# 1. No JavaScript errors in console
# 2. Formbricks initialization message appears
# 3. Events are tracked (check Network tab)
```

### 8.2 Event Tracking Verification
```typescript
// Add to any component for testing
const { trackEvent } = useFormbricksTracking();

// Test event tracking
const testTracking = () => {
  trackEvent('test_event', {
    testData: 'This is a test',
    timestamp: new Date().toISOString(),
  });
};

// Call testTracking() and verify event appears in Formbricks dashboard
```

### 8.3 Survey Testing
1. Trigger events that should show surveys
2. Verify surveys appear at correct times
3. Complete surveys and check responses in dashboard
4. Test survey dismissal and re-appearance logic

---

## Step 9: Performance Optimization

### 9.1 Lazy Loading Implementation
```typescript
// lib/formbricks/lazy-loader.ts
export class FormbricksLazyLoader {
  private static loaded = false;
  private static loading = false;

  static async loadSDK(): Promise<void> {
    if (this.loaded || this.loading) return;
    
    this.loading = true;

    try {
      // Dynamic import for code splitting
      await import('@formbricks/js/app');
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load Formbricks SDK:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  static isLoaded(): boolean {
    return this.loaded;
  }
}
```

### 9.2 Performance Monitoring
```typescript
// lib/formbricks/performance-monitor.ts
export class FormbricksPerformanceMonitor {
  static trackInitializationTime() {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        console.log(`Formbricks initialization took ${duration.toFixed(2)}ms`);
        
        // Track performance metric
        if (window.gtag) {
          window.gtag('event', 'formbricks_init_time', {
            value: Math.round(duration),
          });
        }
      }
    };
  }

  static trackSurveyLoadTime(surveyId: string) {
    const startTime = performance.now();
    
    return {
      complete: () => {
        const duration = performance.now() - startTime;
        console.log(`Survey ${surveyId} loaded in ${duration.toFixed(2)}ms`);
      }
    };
  }
}
```

---

## Step 10: Error Handling and Fallbacks

### 10.1 Error Boundary for Formbricks
```typescript
// components/providers/FormbricksErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class FormbricksErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Formbricks Error Boundary caught an error:', error, errorInfo);
    
    // Report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to your error tracking service
      this.reportError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: any) {
    // Implementation depends on your error tracking service
    console.error('Reporting Formbricks error:', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI or nothing
      return null; // Graceful degradation
    }

    return this.props.children;
  }
}
```

### 10.2 Graceful Degradation
```typescript
// lib/formbricks/fallback-handler.ts
export class FormbricksFallbackHandler {
  static enableFallbackMode() {
    console.warn('Formbricks unavailable, enabling fallback mode');
    
    // Set global flag
    window.formbricksDisabled = true;
    
    // Show alternative feedback collection
    this.showFallbackFeedback();
  }

  private static showFallbackFeedback() {
    // Create simple feedback link
    const fallbackElement = document.createElement('div');
    fallbackElement.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
        <a href="mailto:feedback@quotekit.com?subject=QuoteKit Feedback" 
           style="background: #0D9373; color: white; padding: 12px 16px; 
                  border-radius: 50px; text-decoration: none; font-size: 14px;">
          📧 Send Feedback
        </a>
      </div>
    `;
    
    document.body.appendChild(fallbackElement);
  }

  static checkServiceHealth(): Promise<boolean> {
    return fetch(`${process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST}/api/health`)
      .then(response => response.ok)
      .catch(() => false);
  }
}
```

---

## Step 11: Deployment Checklist

### 11.1 Pre-deployment Verification
- [ ] All environment variables configured in production
- [ ] Formbricks surveys created and published
- [ ] Error handling and fallbacks tested
- [ ] Performance impact measured and acceptable
- [ ] No console errors in production build

### 11.2 Production Environment Variables
```bash
# Add to production environment
NEXT_PUBLIC_FORMBRICKS_ENV_ID=prod_environment_id
NEXT_PUBLIC_FORMBRICKS_APP_URL=https://app.formbricks.com
FORMBRICKS_API_KEY=prod_api_key

# For multi-domain setup (optional)
NEXT_PUBLIC_FORMBRICKS_PUBLIC_URL=https://surveys.yourdomain.com
```

### 11.3 Monitoring Setup
- [ ] Error tracking configured for Formbricks errors
- [ ] Performance monitoring for SDK load time
- [ ] Survey completion rate tracking
- [ ] User feedback response monitoring

---

## Troubleshooting Common Issues

### Issue 1: SDK Not Loading
**Symptoms**: No events tracked, console errors about formbricks undefined
**Solutions**:
- Check environment variables are set correctly
- Verify network connectivity to Formbricks API
- Check browser console for specific error messages

### Issue 2: Surveys Not Appearing
**Symptoms**: Events tracked but surveys don't show
**Solutions**:
- Verify survey is published in Formbricks dashboard
- Check event names match exactly between code and dashboard
- Verify user meets survey targeting criteria

### Issue 3: Performance Issues
**Symptoms**: Slow page loads, high bundle size
**Solutions**:
- Implement lazy loading for Formbricks SDK
- Use dynamic imports for survey components
- Monitor and optimize event tracking frequency

### Issue 4: User Attributes Not Syncing
**Symptoms**: Survey targeting not working correctly
**Solutions**:
- Verify setUserAttributes is called after initialization
- Check attribute names match targeting rules
- Ensure user data is available when setting attributes

This integration guide provides a complete implementation path for adding Formbricks to QuoteKit with proper error handling, performance optimization, and testing procedures.
