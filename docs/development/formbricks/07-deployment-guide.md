# Deployment Guide

## Deployment Overview

This guide covers deploying the Formbricks integration to various environments, from development to production, including configuration management, monitoring setup, and rollback procedures.

## Environment Configuration

### Development Environment

#### 1. Local Development Setup
```bash
# Clone and setup QuoteKit with Formbricks integration
git clone <quotekit-repo>
cd quotekit
pnpm install

# Copy environment template
cp .env.example .env.local

# Add Formbricks configuration
echo "NEXT_PUBLIC_FORMBRICKS_ENV_ID=dev_environment_id" >> .env.local
echo "NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com" >> .env.local
echo "FORMBRICKS_API_KEY=dev_api_key" >> .env.local

# Start development server
pnpm dev
```

#### 2. Development Environment Variables
```bash
# .env.local
NEXT_PUBLIC_FORMBRICKS_ENV_ID=dev_clxxxxx
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
FORMBRICKS_API_KEY=dev_sk_xxxxx
FORMBRICKS_WEBHOOK_SECRET=dev_whsec_xxxxx

# Development flags
FORMBRICKS_DEBUG=true
FORMBRICKS_MOCK_SURVEYS=false
```

### Staging Environment

#### 1. Staging Configuration
```bash
# .env.staging
NEXT_PUBLIC_FORMBRICKS_ENV_ID=staging_clxxxxx
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
FORMBRICKS_API_KEY=staging_sk_xxxxx
FORMBRICKS_WEBHOOK_SECRET=staging_whsec_xxxxx

# Staging specific settings
FORMBRICKS_DEBUG=false
FORMBRICKS_SAMPLE_RATE=0.5  # 50% of users for testing
```

#### 2. Staging Deployment Script
```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "🚀 Deploying Formbricks integration to staging..."

# Build application
pnpm build

# Run integration tests
pnpm test:formbricks:integration

# Deploy to staging
vercel --env .env.staging --target staging

# Run smoke tests
pnpm test:formbricks:smoke --env staging

echo "✅ Staging deployment complete"
```

### Production Environment

#### 1. Production Configuration
```bash
# .env.production (stored in secure environment)
NEXT_PUBLIC_FORMBRICKS_ENV_ID=prod_clxxxxx
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
FORMBRICKS_API_KEY=prod_sk_xxxxx
FORMBRICKS_WEBHOOK_SECRET=prod_whsec_xxxxx

# Production settings
FORMBRICKS_DEBUG=false
FORMBRICKS_SAMPLE_RATE=1.0  # 100% of users
FORMBRICKS_ERROR_REPORTING=true
```

#### 2. Production Deployment Pipeline
```yaml
# .github/workflows/deploy-production.yml
name: Deploy Formbricks Integration to Production

on:
  push:
    branches: [main]
    paths: 
      - 'lib/formbricks/**'
      - 'components/feedback/**'
      - 'hooks/useFormbricksTracking.ts'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:formbricks
      - run: pnpm test:formbricks:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build
      
      # Deploy with feature flag (gradual rollout)
      - name: Deploy with feature flag
        run: |
          vercel --prod \
            --env FORMBRICKS_ENABLED=true \
            --env FORMBRICKS_ROLLOUT_PERCENTAGE=10
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      
      # Monitor deployment
      - name: Monitor deployment
        run: pnpm run monitor:deployment --timeout 300
      
      # Gradually increase rollout
      - name: Increase rollout to 50%
        if: success()
        run: |
          sleep 300  # Wait 5 minutes
          vercel --prod --env FORMBRICKS_ROLLOUT_PERCENTAGE=50
      
      - name: Full rollout
        if: success()
        run: |
          sleep 600  # Wait 10 minutes
          vercel --prod --env FORMBRICKS_ROLLOUT_PERCENTAGE=100
```

## Feature Flag Implementation

### 1. Feature Flag Service
```typescript
// lib/feature-flags/formbricks-flags.ts
export class FormbricksFeatureFlags {
  private static instance: FormbricksFeatureFlags;
  private flags: Map<string, boolean> = new Map();

  static getInstance(): FormbricksFeatureFlags {
    if (!FormbricksFeatureFlags.instance) {
      FormbricksFeatureFlags.instance = new FormbricksFeatureFlags();
    }
    return FormbricksFeatureFlags.instance;
  }

  async initialize() {
    // Load feature flags from environment or remote service
    this.flags.set('formbricks_enabled', process.env.FORMBRICKS_ENABLED === 'true');
    this.flags.set('formbricks_dashboard_widget', process.env.FORMBRICKS_DASHBOARD_WIDGET === 'true');
    this.flags.set('formbricks_quote_surveys', process.env.FORMBRICKS_QUOTE_SURVEYS === 'true');
    
    // Check rollout percentage
    const rolloutPercentage = parseInt(process.env.FORMBRICKS_ROLLOUT_PERCENTAGE || '100');
    const userHash = this.getUserHash();
    const isInRollout = (userHash % 100) < rolloutPercentage;
    
    this.flags.set('formbricks_rollout', isInRollout);
  }

  isEnabled(flagName: string): boolean {
    return this.flags.get(flagName) || false;
  }

  private getUserHash(): number {
    // Simple hash function for consistent user assignment
    const userId = typeof window !== 'undefined' 
      ? localStorage.getItem('user_id') || 'anonymous'
      : 'server';
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

### 2. Feature Flag Usage
```typescript
// components/providers/FormbricksProvider.tsx
'use client';

import { useEffect, useState } from 'react';
import { FormbricksFeatureFlags } from '@/lib/feature-flags/formbricks-flags';

export function FormbricksProvider() {
  const [isEnabled, setIsEnabled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const initializeFlags = async () => {
      const flags = FormbricksFeatureFlags.getInstance();
      await flags.initialize();
      
      const enabled = flags.isEnabled('formbricks_enabled') && 
                     flags.isEnabled('formbricks_rollout');
      
      setIsEnabled(enabled);
    };

    initializeFlags();
  }, []);

  useEffect(() => {
    if (!isEnabled || !user) return;

    // Initialize Formbricks only if feature flag is enabled
    const initializeFormbricks = async () => {
      try {
        const manager = FormbricksManager.getInstance();
        await manager.initialize({
          environmentId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID!,
          apiHost: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST!,
          userId: user.id,
        });
      } catch (error) {
        console.error('Formbricks initialization failed:', error);
      }
    };

    initializeFormbricks();
  }, [isEnabled, user]);

  return null;
}
```

## Database Migrations

### 1. User Feedback Table Migration
```sql
-- migrations/001_create_user_feedback_table.sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_id VARCHAR(255) NOT NULL,
  survey_type VARCHAR(100) NOT NULL,
  responses JSONB NOT NULL,
  context JSONB,
  sentiment VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_survey_type ON user_feedback(survey_type);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at);
CREATE INDEX idx_user_feedback_sentiment ON user_feedback(sentiment);

-- GIN index for JSONB columns
CREATE INDEX idx_user_feedback_responses ON user_feedback USING GIN(responses);
CREATE INDEX idx_user_feedback_context ON user_feedback USING GIN(context);
```

### 2. Survey Analytics Table Migration
```sql
-- migrations/002_create_survey_analytics_table.sql
CREATE TABLE survey_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id VARCHAR(255) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  dimensions JSONB,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_survey_analytics_survey_id ON survey_analytics(survey_id);
CREATE INDEX idx_survey_analytics_metric_name ON survey_analytics(metric_name);
CREATE INDEX idx_survey_analytics_date ON survey_analytics(date);
CREATE INDEX idx_survey_analytics_dimensions ON survey_analytics USING GIN(dimensions);

-- Unique constraint to prevent duplicate metrics
CREATE UNIQUE INDEX idx_survey_analytics_unique 
ON survey_analytics(survey_id, metric_name, date, md5(dimensions::text));
```

### 3. Migration Runner
```typescript
// scripts/run-formbricks-migrations.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
      
      console.log(`✅ Migration ${file} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error);
      process.exit(1);
    }
  }

  console.log('🎉 All migrations completed successfully');
}

runMigrations().catch(console.error);
```

## Monitoring and Alerting

### 1. Health Check Endpoint
```typescript
// app/api/health/formbricks/route.ts
import { NextResponse } from 'next/server';
import { FormbricksManager } from '@/lib/formbricks/manager';

export async function GET() {
  try {
    // Check if Formbricks is reachable
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST}/api/health`,
      { method: 'GET', timeout: 5000 }
    );

    if (!response.ok) {
      throw new Error(`Formbricks API returned ${response.status}`);
    }

    // Check if SDK is properly initialized
    const manager = FormbricksManager.getInstance();
    const isInitialized = manager.isInitialized();

    return NextResponse.json({
      status: 'healthy',
      formbricks: {
        api_reachable: true,
        sdk_initialized: isInitialized,
        environment_id: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID?.substring(0, 8) + '...',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Formbricks health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
```

### 2. Metrics Collection
```typescript
// lib/monitoring/formbricks-metrics.ts
export class FormbricksMetrics {
  private static metrics: Map<string, number> = new Map();

  static increment(metric: string, value: number = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  static gauge(metric: string, value: number) {
    this.metrics.set(metric, value);
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static reset() {
    this.metrics.clear();
  }

  // Track key metrics
  static trackSurveyShown(surveyId: string) {
    this.increment('formbricks.surveys.shown');
    this.increment(`formbricks.surveys.${surveyId}.shown`);
  }

  static trackSurveyCompleted(surveyId: string, completionTime: number) {
    this.increment('formbricks.surveys.completed');
    this.increment(`formbricks.surveys.${surveyId}.completed`);
    this.gauge('formbricks.surveys.completion_time', completionTime);
  }

  static trackError(errorType: string) {
    this.increment('formbricks.errors');
    this.increment(`formbricks.errors.${errorType}`);
  }

  static trackInitialization(success: boolean, duration: number) {
    this.increment(success ? 'formbricks.init.success' : 'formbricks.init.failure');
    this.gauge('formbricks.init.duration', duration);
  }
}
```

### 3. Alerting Configuration
```yaml
# monitoring/alerts.yml
alerts:
  - name: formbricks_high_error_rate
    condition: formbricks.errors > 10 per minute
    severity: warning
    notification:
      slack: "#alerts"
      email: ["team@quotekit.com"]

  - name: formbricks_initialization_failures
    condition: formbricks.init.failure > 5 per minute
    severity: critical
    notification:
      slack: "#critical-alerts"
      email: ["team@quotekit.com"]
      pagerduty: true

  - name: formbricks_low_survey_completion
    condition: formbricks.surveys.completion_rate < 0.05
    severity: warning
    notification:
      slack: "#product-alerts"

  - name: formbricks_api_unreachable
    condition: formbricks.api.health_check.failure > 3 consecutive
    severity: critical
    notification:
      slack: "#critical-alerts"
      email: ["team@quotekit.com"]
```

## Rollback Procedures

### 1. Emergency Rollback Script
```bash
#!/bin/bash
# rollback-formbricks.sh

set -e

echo "🚨 Emergency rollback of Formbricks integration"

# Disable feature flag immediately
vercel env rm FORMBRICKS_ENABLED production
vercel env add FORMBRICKS_ENABLED false production

# Redeploy with feature disabled
vercel --prod --env FORMBRICKS_ENABLED=false

# Verify rollback
sleep 60
curl -f https://app.quotekit.com/api/health/formbricks || {
  echo "❌ Health check failed after rollback"
  exit 1
}

echo "✅ Emergency rollback completed successfully"

# Notify team
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 Formbricks integration has been rolled back due to issues"}' \
  $SLACK_WEBHOOK_URL
```

### 2. Gradual Rollback
```typescript
// scripts/gradual-rollback.ts
async function gradualRollback() {
  const rolloutSteps = [100, 50, 25, 10, 0];
  
  for (const percentage of rolloutSteps) {
    console.log(`Setting rollout to ${percentage}%`);
    
    // Update environment variable
    await updateEnvironmentVariable('FORMBRICKS_ROLLOUT_PERCENTAGE', percentage.toString());
    
    // Wait for deployment
    await sleep(300000); // 5 minutes
    
    // Check error rates
    const errorRate = await checkErrorRate();
    if (errorRate < 0.01) { // Less than 1% error rate
      console.log(`✅ Rollout at ${percentage}% is stable`);
      if (percentage === 0) {
        console.log('🎉 Rollback completed successfully');
        break;
      }
    } else {
      console.log(`❌ High error rate at ${percentage}%, continuing rollback`);
    }
  }
}
```

### 3. Database Rollback
```sql
-- rollback/001_rollback_user_feedback.sql
-- Rollback user feedback table if needed
BEGIN;

-- Backup existing data
CREATE TABLE user_feedback_backup AS SELECT * FROM user_feedback;

-- Drop the table and indexes
DROP INDEX IF EXISTS idx_user_feedback_user_id;
DROP INDEX IF EXISTS idx_user_feedback_survey_type;
DROP INDEX IF EXISTS idx_user_feedback_created_at;
DROP INDEX IF EXISTS idx_user_feedback_sentiment;
DROP INDEX IF EXISTS idx_user_feedback_responses;
DROP INDEX IF EXISTS idx_user_feedback_context;

DROP TABLE IF EXISTS user_feedback;

COMMIT;
```

## Performance Optimization

### 1. Bundle Optimization
```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Optimize Formbricks bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@formbricks/js': '@formbricks/js/dist/index.esm.js',
      };
    }

    // Code splitting for Formbricks
    config.optimization.splitChunks.cacheGroups = {
      ...config.optimization.splitChunks.cacheGroups,
      formbricks: {
        test: /[\\/]node_modules[\\/]@formbricks[\\/]/,
        name: 'formbricks',
        chunks: 'all',
        priority: 10,
      },
    };

    return config;
  },

  // Optimize images and assets
  images: {
    domains: ['app.formbricks.com'],
  },
};

module.exports = nextConfig;
```

### 2. Lazy Loading Implementation
```typescript
// lib/formbricks/lazy-loader.ts
export class FormbricksLazyLoader {
  private static loadPromise: Promise<void> | null = null;

  static async loadWhenNeeded(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadSDK();
    return this.loadPromise;
  }

  private static async loadSDK(): Promise<void> {
    // Only load when user interacts or after delay
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        setTimeout(resolve, 2000); // 2 second delay
      } else {
        window.addEventListener('load', () => {
          setTimeout(resolve, 2000);
        });
      }
    });

    // Dynamic import
    await import('@formbricks/js/app');
  }
}
```

## Security Considerations

### 1. Environment Variable Security
```bash
# Use encrypted environment variables
# Never commit these to version control

# Development
FORMBRICKS_API_KEY_DEV=$(echo "dev_key" | base64)

# Staging  
FORMBRICKS_API_KEY_STAGING=$(echo "staging_key" | base64)

# Production
FORMBRICKS_API_KEY_PROD=$(echo "prod_key" | base64)
```

### 2. Content Security Policy
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.formbricks.com;
              connect-src 'self' https://app.formbricks.com wss://app.formbricks.com;
              img-src 'self' data: https://app.formbricks.com;
              style-src 'self' 'unsafe-inline';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
};
```

### 3. API Key Rotation
```typescript
// scripts/rotate-api-keys.ts
async function rotateFormbricksApiKeys() {
  console.log('🔄 Rotating Formbricks API keys...');

  // Generate new API key in Formbricks
  const newApiKey = await generateNewApiKey();

  // Update environment variables
  await updateEnvironmentVariable('FORMBRICKS_API_KEY', newApiKey);

  // Deploy with new key
  await deployWithNewKey();

  // Verify new key works
  await verifyApiKeyWorks(newApiKey);

  // Revoke old key
  await revokeOldApiKey();

  console.log('✅ API key rotation completed successfully');
}
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (unit, integration, e2e)
- [ ] Feature flags configured correctly
- [ ] Environment variables set in target environment
- [ ] Database migrations ready (if needed)
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented and tested

### During Deployment
- [ ] Deploy with feature flag disabled initially
- [ ] Run smoke tests
- [ ] Enable feature flag for small percentage of users
- [ ] Monitor error rates and performance metrics
- [ ] Gradually increase rollout percentage
- [ ] Monitor user feedback and completion rates

### Post-Deployment
- [ ] Verify all surveys are working correctly
- [ ] Check analytics dashboard for data flow
- [ ] Monitor error rates and performance
- [ ] Validate user feedback is being collected
- [ ] Document any issues and resolutions
- [ ] Update team on deployment status

This deployment guide ensures a safe, monitored, and reversible deployment of the Formbricks integration with proper safeguards and monitoring in place.
