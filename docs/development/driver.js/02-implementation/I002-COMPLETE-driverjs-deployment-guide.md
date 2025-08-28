# Deployment Guide: Driver.js Onboarding System

## Overview

This guide covers the deployment process for the driver.js onboarding system in LawnQuote, including environment setup, database migrations, feature flags, and production considerations.

## Pre-Deployment Checklist

### 1. Code Quality Verification

```bash
# Run all tests
npm run test:unit
npm run test:integration
npm run test:e2e

# Check TypeScript compilation
npm run type-check

# Lint and format code
npm run lint
npm run format

# Bundle analysis
npm run analyze:bundle

# Performance audit
npm run lighthouse:ci
```

### 2. Database Preparation

**Migration Files Required:**

```sql
-- 001_create_onboarding_tables.sql
CREATE TABLE user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tour_id)
);

-- 002_create_analytics_table.sql
CREATE TABLE onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL,
  step_id TEXT,
  event_type TEXT CHECK (event_type IN ('tour_start', 'step_view', 'step_complete', 'tour_complete', 'tour_skip', 'tour_abandon')) NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 003_create_preferences_table.sql
CREATE TABLE user_onboarding_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_tooltips BOOLEAN DEFAULT true,
  auto_start_tours BOOLEAN DEFAULT true,
  preferred_tour_speed TEXT CHECK (preferred_tour_speed IN ('slow', 'normal', 'fast')) DEFAULT 'normal',
  skip_completed_tours BOOLEAN DEFAULT true,
  enable_animations BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Index Creation:**

```sql
-- 004_create_indexes.sql
CREATE INDEX idx_user_onboarding_progress_user_id ON user_onboarding_progress(user_id);
CREATE INDEX idx_user_onboarding_progress_status ON user_onboarding_progress(status);
CREATE INDEX idx_user_onboarding_progress_tour_id ON user_onboarding_progress(tour_id);

CREATE INDEX idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
CREATE INDEX idx_onboarding_analytics_tour_id ON onboarding_analytics(tour_id);
CREATE INDEX idx_onboarding_analytics_event_type ON onboarding_analytics(event_type);
CREATE INDEX idx_onboarding_analytics_created_at ON onboarding_analytics(created_at);
```

**Row Level Security:**

```sql
-- 005_enable_rls.sql
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own onboarding progress" ON user_onboarding_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON onboarding_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" ON onboarding_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage their own preferences" ON user_onboarding_preferences
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Environment Configuration

**Environment Variables:**

```bash
# .env.production
NEXT_PUBLIC_ONBOARDING_ENABLED=true
NEXT_PUBLIC_ONBOARDING_DEBUG=false
NEXT_PUBLIC_ONBOARDING_AUTO_START=true
NEXT_PUBLIC_ONBOARDING_ANALYTICS_ENABLED=true

# Feature flags
NEXT_PUBLIC_FEATURE_WELCOME_TOUR=true
NEXT_PUBLIC_FEATURE_QUOTE_CREATION_TOUR=true
NEXT_PUBLIC_FEATURE_SETTINGS_TOUR=true
NEXT_PUBLIC_FEATURE_ITEM_LIBRARY_TOUR=true

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Performance
NEXT_PUBLIC_ONBOARDING_LAZY_LOAD=true
NEXT_PUBLIC_ONBOARDING_PRELOAD_TOURS=welcome,quote-creation
```

## Deployment Strategies

### 1. Blue-Green Deployment

**Deployment Script:**

```bash
#!/bin/bash
# deploy-onboarding.sh

set -e

echo "🚀 Starting onboarding system deployment..."

# Build application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npx supabase db push

# Deploy to staging
echo "🧪 Deploying to staging..."
fly deploy --config fly.staging.toml

# Run smoke tests
echo "🧪 Running smoke tests..."
npm run test:smoke -- --env=staging

# Deploy to production
echo "🚀 Deploying to production..."
fly deploy --config fly.production.toml

# Verify deployment
echo "✅ Verifying deployment..."
npm run test:smoke -- --env=production

echo "✅ Deployment completed successfully!"
```

### 2. Feature Flag Rollout

**Gradual Rollout Strategy:**

```typescript
// src/libs/feature-flags/onboarding-flags.ts
export const OnboardingFeatureFlags = {
  // Phase 1: Internal testing (0% of users)
  WELCOME_TOUR: {
    enabled: false,
    rolloutPercentage: 0,
    allowedUsers: ['admin@lawnquote.com', 'test@lawnquote.com']
  },
  
  // Phase 2: Beta users (10% of users)
  QUOTE_CREATION_TOUR: {
    enabled: true,
    rolloutPercentage: 10,
    userTiers: ['pro', 'enterprise']
  },
  
  // Phase 3: All users (100% rollout)
  SETTINGS_TOUR: {
    enabled: true,
    rolloutPercentage: 100,
    userTiers: ['free', 'pro', 'enterprise']
  }
};

export function shouldShowOnboardingFeature(
  featureKey: string, 
  user: User
): boolean {
  const flag = OnboardingFeatureFlags[featureKey];
  if (!flag || !flag.enabled) return false;
  
  // Check allowed users
  if (flag.allowedUsers?.includes(user.email)) return true;
  
  // Check user tier
  if (flag.userTiers && !flag.userTiers.includes(user.tier)) return false;
  
  // Check rollout percentage
  const userHash = hashString(user.id);
  const userPercentile = userHash % 100;
  
  return userPercentile < flag.rolloutPercentage;
}
```

### 3. Canary Deployment

**Canary Configuration:**

```yaml
# fly.canary.toml
app = "lawnquote-canary"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NEXT_PUBLIC_ONBOARDING_ENABLED = "true"
  NEXT_PUBLIC_ONBOARDING_CANARY = "true"
  NEXT_PUBLIC_CANARY_PERCENTAGE = "5"

[[services]]
  http_checks = []
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

## Monitoring and Observability

### 1. Health Checks

**Health Check Endpoint:**

```typescript
// src/app/api/health/onboarding/route.ts
export async function GET() {
  try {
    const healthChecks = await Promise.all([
      checkDatabaseConnection(),
      checkAnalyticsService(),
      checkTourConfigurations(),
      checkFeatureFlags()
    ]);

    const isHealthy = healthChecks.every(check => check.status === 'healthy');

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: healthChecks
    }, {
      status: isHealthy ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function checkDatabaseConnection() {
  try {
    const supabase = createServerClient();
    await supabase.from('user_onboarding_progress').select('count').limit(1);
    
    return { service: 'database', status: 'healthy' };
  } catch (error) {
    return { service: 'database', status: 'unhealthy', error: error.message };
  }
}

async function checkTourConfigurations() {
  try {
    const tourIds = Object.keys(TOUR_CONFIGS);
    const invalidTours = tourIds.filter(id => {
      const config = TOUR_CONFIGS[id];
      return !config.steps || config.steps.length === 0;
    });

    return {
      service: 'tour-configs',
      status: invalidTours.length === 0 ? 'healthy' : 'unhealthy',
      details: { totalTours: tourIds.length, invalidTours }
    };
  } catch (error) {
    return { service: 'tour-configs', status: 'unhealthy', error: error.message };
  }
}
```

### 2. Metrics and Alerts

**Monitoring Dashboard:**

```typescript
// src/components/admin/OnboardingMonitoring.tsx
export function OnboardingMonitoring() {
  const { data: metrics } = useOnboardingMetrics('hour', undefined, 60000);
  const { data: alerts } = useOnboardingAlerts();

  return (
    <div className="onboarding-monitoring space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Tours Started (1h)"
          value={metrics?.toursStarted || 0}
          threshold={{ min: 10, max: 1000 }}
          status={getMetricStatus(metrics?.toursStarted, { min: 10, max: 1000 })}
        />
        
        <MetricCard
          title="Completion Rate"
          value={`${metrics?.completionRate || 0}%`}
          threshold={{ min: 70, max: 100 }}
          status={getMetricStatus(metrics?.completionRate, { min: 70, max: 100 })}
        />
        
        <MetricCard
          title="Error Rate"
          value={`${metrics?.errorRate || 0}%`}
          threshold={{ min: 0, max: 5 }}
          status={getMetricStatus(metrics?.errorRate, { min: 0, max: 5 }, true)}
        />
        
        <MetricCard
          title="Avg Duration"
          value={`${metrics?.avgDuration || 0}s`}
          threshold={{ min: 60, max: 300 }}
          status={getMetricStatus(metrics?.avgDuration, { min: 60, max: 300 })}
        />
      </div>

      {alerts && alerts.length > 0 && (
        <AlertPanel alerts={alerts} />
      )}

      <TourPerformanceChart timeframe="day" />
      <ErrorAnalysisChart timeframe="day" />
    </div>
  );
}
```

**Alert Configuration:**

```typescript
// src/libs/monitoring/onboarding-alerts.ts
export const OnboardingAlerts = {
  LOW_COMPLETION_RATE: {
    metric: 'completion_rate',
    threshold: 70,
    operator: 'less_than',
    severity: 'critical',
    message: 'Onboarding completion rate has dropped below 70%'
  },
  
  HIGH_ERROR_RATE: {
    metric: 'error_rate',
    threshold: 5,
    operator: 'greater_than',
    severity: 'warning',
    message: 'Onboarding error rate has exceeded 5%'
  },
  
  LONG_TOUR_DURATION: {
    metric: 'avg_duration',
    threshold: 300,
    operator: 'greater_than',
    severity: 'info',
    message: 'Average tour duration is longer than 5 minutes'
  },
  
  DATABASE_CONNECTION_FAILURE: {
    metric: 'database_health',
    threshold: 1,
    operator: 'equals',
    severity: 'critical',
    message: 'Onboarding database connection failed'
  }
};
```

### 3. Error Tracking

**Error Boundary with Reporting:**

```typescript
// src/components/onboarding/OnboardingErrorBoundary.tsx
export class OnboardingErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  { hasError: boolean; error?: Error }
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to error tracking service
    this.reportError(error, errorInfo);
    
    // Log to analytics
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('onboarding_error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await fetch('/api/errors/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
    } catch (reportingError) {
      console.error('Failed to report onboarding error:', reportingError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="onboarding-error-fallback p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-medium">Onboarding Error</h3>
          <p className="text-red-600 text-sm mt-1">
            Something went wrong with the tour system. You can continue using the application normally.
          </p>
          <details className="mt-2">
            <summary className="text-sm text-red-600 cursor-pointer">Error Details</summary>
            <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-auto">
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-sm text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Performance Optimization

### 1. Bundle Optimization

**Webpack Configuration:**

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizePackageImports: ['driver.js']
  },
  
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Split onboarding code into separate chunks
      config.optimization.splitChunks.cacheGroups.onboarding = {
        name: 'onboarding',
        test: /[\\/]src[\\/](libs|components)[\\/]onboarding[\\/]/,
        chunks: 'all',
        priority: 10
      };
      
      // Split tour definitions into individual chunks
      config.optimization.splitChunks.cacheGroups.tours = {
        name: 'tours',
        test: /[\\/]src[\\/]libs[\\/]onboarding[\\/]tours[\\/]/,
        chunks: 'async',
        priority: 15
      };
    }
    
    return config;
  }
};
```

### 2. Lazy Loading Strategy

**Dynamic Tour Loading:**

```typescript
// src/libs/onboarding/tour-loader.ts
const tourModules = {
  welcome: () => import('./tours/welcome-tour'),
  'quote-creation': () => import('./tours/quote-creation-tour'),
  'item-library': () => import('./tours/item-library-tour'),
  settings: () => import('./tours/settings-tour')
};

export async function loadTour(tourId: string): Promise<TourConfig> {
  const loader = tourModules[tourId as keyof typeof tourModules];
  
  if (!loader) {
    throw new Error(`Tour "${tourId}" not found`);
  }
  
  try {
    const module = await loader();
    return module.default;
  } catch (error) {
    console.error(`Failed to load tour "${tourId}":`, error);
    throw new Error(`Failed to load tour "${tourId}"`);
  }
}

// Preload critical tours
export function preloadCriticalTours() {
  if (typeof window !== 'undefined') {
    const criticalTours = ['welcome', 'quote-creation'];
    
    criticalTours.forEach(tourId => {
      const loader = tourModules[tourId as keyof typeof tourModules];
      if (loader) {
        // Preload with low priority
        requestIdleCallback(() => {
          loader().catch(() => {
            // Ignore preload errors
          });
        });
      }
    });
  }
}
```

### 3. Caching Strategy

**Service Worker for Tour Caching:**

```javascript
// public/sw.js
const TOUR_CACHE_NAME = 'lawnquote-tours-v1';
const TOUR_URLS = [
  '/api/tours/welcome',
  '/api/tours/quote-creation',
  '/api/tours/item-library',
  '/api/tours/settings'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(TOUR_CACHE_NAME)
      .then((cache) => cache.addAll(TOUR_URLS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/tours/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            // Serve from cache
            return response;
          }
          
          // Fetch and cache
          return fetch(event.request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(TOUR_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
              return response;
            });
        })
    );
  }
});
```

## Rollback Strategy

### 1. Feature Flag Rollback

**Emergency Rollback Script:**

```bash
#!/bin/bash
# rollback-onboarding.sh

echo "🚨 Emergency rollback of onboarding system..."

# Disable all onboarding features
curl -X POST "https://api.lawnquote.com/admin/feature-flags" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "NEXT_PUBLIC_ONBOARDING_ENABLED": false,
    "NEXT_PUBLIC_FEATURE_WELCOME_TOUR": false,
    "NEXT_PUBLIC_FEATURE_QUOTE_CREATION_TOUR": false,
    "NEXT_PUBLIC_FEATURE_SETTINGS_TOUR": false,
    "NEXT_PUBLIC_FEATURE_ITEM_LIBRARY_TOUR": false
  }'

echo "✅ Onboarding features disabled"

# Optionally revert to previous deployment
if [ "$1" = "--full-rollback" ]; then
  echo "🔄 Rolling back to previous deployment..."
  fly releases rollback --app lawnquote-production
  echo "✅ Deployment rolled back"
fi

echo "🎉 Rollback completed"
```

### 2. Database Rollback

**Migration Rollback:**

```sql
-- rollback_onboarding_tables.sql
DROP TABLE IF EXISTS onboarding_analytics;
DROP TABLE IF EXISTS user_onboarding_preferences;
DROP TABLE IF EXISTS user_onboarding_progress;

-- Remove columns from existing tables if added
ALTER TABLE user_profiles DROP COLUMN IF EXISTS onboarding_progress;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS onboarding_completed_at;
```

## Post-Deployment Verification

### 1. Smoke Tests

**Automated Verification:**

```typescript
// tests/smoke/onboarding-smoke.test.ts
describe('Onboarding Smoke Tests', () => {
  test('should load welcome tour successfully', async () => {
    const response = await fetch('/api/tours/welcome');
    expect(response.status).toBe(200);
    
    const tour = await response.json();
    expect(tour).toHaveProperty('steps');
    expect(tour.steps.length).toBeGreaterThan(0);
  });

  test('should track analytics events', async () => {
    const response = await fetch('/api/analytics/onboarding/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'tour_start',
        tourId: 'welcome'
      })
    });
    
    expect(response.status).toBe(200);
  });

  test('should handle database operations', async () => {
    const response = await fetch('/api/health/onboarding');
    expect(response.status).toBe(200);
    
    const health = await response.json();
    expect(health.status).toBe('healthy');
  });
});
```

### 2. User Acceptance Verification

**Production Checklist:**

- [ ] Welcome tour loads for new users
- [ ] Tour completion is tracked correctly
- [ ] Analytics events are being recorded
- [ ] Mobile experience works properly
- [ ] Error handling functions correctly
- [ ] Performance metrics are within acceptable ranges
- [ ] Feature flags are working as expected
- [ ] Rollback procedures are tested and ready

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: After production deployment
