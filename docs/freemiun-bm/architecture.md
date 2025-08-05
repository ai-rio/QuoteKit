# FreeMium Technical Architecture

## System Overview

QuoteKit's freemium architecture implements a robust feature gating system with both client-side and server-side enforcement, subscription management through Stripe, and comprehensive usage tracking.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Next.js API   │    │   Supabase DB   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Feature     │ │────┤ │ Feature     │ │────┤ │ Subscriptions│ │
│ │ Gates       │ │    │ │ Middleware  │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │useFeature   │ │────┤ │ Protected   │ │────┤ │ Usage       │ │
│ │Access       │ │    │ │ Routes      │ │    │ │ Tracking    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
              ┌─────────────────────────────────┐
              │         Stripe API              │
              │                                 │
              │ ┌─────────────┐ ┌─────────────┐ │
              │ │ Products &  │ │ Webhooks    │ │
              │ │ Features    │ │             │ │
              │ └─────────────┘ └─────────────┘ │
              └─────────────────────────────────┘
```

## Core Components

### 1. Feature Access System

#### useFeatureAccess Hook
**Location**: `src/hooks/useFeatureAccess.ts`

The central hook that manages feature access across the application:

```typescript
interface FeatureAccessReturn {
  features: PlanFeatures           // Current user's feature configuration
  usage: FeatureUsage             // Current usage counters
  canAccess: (key: FeatureKey) => FeatureAccess  // Check specific feature
  isAtLimit: (key: FeatureKey) => boolean        // Check usage limits
  loading: boolean                // Loading state
  error: Error | null            // Error state
  refresh: () => Promise<void>   // Refresh data
}
```

**Key Responsibilities**:
- Fetch user subscription from Supabase
- Parse Stripe metadata into feature configuration
- Retrieve current usage statistics
- Provide feature access checking functions
- Handle loading and error states

#### Feature Types and Access Patterns

```typescript
// Boolean features (on/off)
type BooleanFeature = 'pdf_export' | 'analytics_access' | 'custom_branding'

// Numeric features (with limits)
type NumericFeature = 'max_quotes'

// Feature access result
interface FeatureAccess {
  hasAccess: boolean      // Can user access this feature?
  limit?: number         // Usage limit (for numeric features)
  current?: number       // Current usage
  isAtLimit?: boolean    // Has user hit the limit?
  upgradeRequired: boolean // Does user need to upgrade?
}
```

### 2. Subscription Management

#### Database Schema

```sql
-- Subscriptions table (managed by Stripe webhooks)
CREATE TABLE subscriptions (
  id text PRIMARY KEY,           -- Stripe subscription ID
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL,          -- active, canceled, etc.
  stripe_price_id text,          -- Links to price
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prices table (synced from Stripe)
CREATE TABLE prices (
  id text PRIMARY KEY,           -- Stripe price ID
  stripe_product_id text,        -- Links to product
  active boolean,
  currency text,
  interval_count integer,
  interval text,                 -- month, year
  unit_amount integer,
  created_at timestamptz DEFAULT now()
);

-- Products table (synced from Stripe)
CREATE TABLE products (
  id text PRIMARY KEY,           -- Stripe product ID
  active boolean,
  name text,
  description text,
  metadata jsonb,                -- Feature configuration stored here
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Feature Metadata Structure

Features are stored in Stripe product metadata:

```json
{
  "max_quotes": "-1",           // -1 = unlimited
  "pdf_export": "true",
  "analytics_access": "true",
  "bulk_operations": "true",
  "custom_branding": "true",
  "email_templates": "true",
  "priority_support": "true",
  "api_access": "true",
  "advanced_reporting": "true",
  "team_collaboration": "true"
}
```

### 3. Usage Tracking System

#### Database Schema

```sql
CREATE TABLE user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year text NOT NULL,      -- 'YYYY-MM' format
  quotes_count integer DEFAULT 0,
  pdf_exports_count integer DEFAULT 0,
  api_calls_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable Row Level Security
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Users can only access their own usage
CREATE POLICY "Users can manage their own usage" ON user_usage
  USING (auth.uid() = user_id);
```

#### Usage Tracking Functions

```sql
-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_usage_type text,
  p_amount integer DEFAULT 1
) RETURNS void AS $$
DECLARE
  current_month text := to_char(now(), 'YYYY-MM');
BEGIN
  INSERT INTO user_usage (user_id, month_year)
  VALUES (p_user_id, current_month)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  UPDATE user_usage SET
    quotes_count = CASE WHEN p_usage_type = 'quotes' 
                   THEN quotes_count + p_amount 
                   ELSE quotes_count END,
    pdf_exports_count = CASE WHEN p_usage_type = 'pdf_exports'
                        THEN pdf_exports_count + p_amount
                        ELSE pdf_exports_count END,
    api_calls_count = CASE WHEN p_usage_type = 'api_calls'
                      THEN api_calls_count + p_amount
                      ELSE api_calls_count END,
    updated_at = now()
  WHERE user_id = p_user_id AND month_year = current_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (for cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage() RETURNS void AS $$
BEGIN
  -- Archive current usage before reset
  INSERT INTO user_usage_history 
  SELECT * FROM user_usage 
  WHERE month_year = to_char(now() - interval '1 month', 'YYYY-MM');
  
  -- Reset current month counters
  UPDATE user_usage SET
    quotes_count = 0,
    pdf_exports_count = 0,
    api_calls_count = 0,
    updated_at = now()
  WHERE month_year = to_char(now(), 'YYYY-MM');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Client-Side Feature Gating

#### Component-Level Gating

```typescript
// Example: PDF Export Button
export function PDFExportButton({ quoteId }: Props) {
  const { canAccess } = useFeatureAccess()
  const pdfAccess = canAccess('pdf_export')
  
  if (!pdfAccess.hasAccess) {
    return <UpgradePrompt feature="PDF Export" />
  }
  
  return <Button onClick={handleExport}>Export PDF</Button>
}
```

#### Usage Limit Enforcement

```typescript
// Example: Quote Creation
export function CreateQuoteButton() {
  const { canAccess } = useFeatureAccess()
  const quotesAccess = canAccess('max_quotes')
  
  if (quotesAccess.isAtLimit) {
    return (
      <UpgradePrompt 
        feature="Quote Limits"
        message={`You've reached your limit of ${quotesAccess.limit} quotes this month`}
      />
    )
  }
  
  return <Button onClick={createQuote}>Create Quote</Button>
}
```

### 5. Server-Side Protection

#### API Route Protection

```typescript
// src/middleware/featureGate.ts
export async function withFeatureGate(
  handler: NextApiHandler,
  requiredFeature: FeatureKey
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get user from request
      const user = await getCurrentUser(req)
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      // Check feature access
      const hasAccess = await checkFeatureAccess(user.id, requiredFeature)
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Feature not available in your plan',
          feature: requiredFeature,
          upgradeRequired: true
        })
      }
      
      // Feature check passed, continue to handler
      return handler(req, res)
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Usage in API routes
export default withFeatureGate(async (req, res) => {
  // PDF generation logic here
}, 'pdf_export')
```

#### Server Action Protection

```typescript
'use server'

export async function createQuote(data: CreateQuoteData) {
  const user = await getCurrentUser()
  
  // Check quote limits
  const quotesAccess = await checkFeatureAccess(user.id, 'max_quotes')
  if (!quotesAccess.hasAccess) {
    throw new Error('Quote limit exceeded. Please upgrade to create more quotes.')
  }
  
  // Create quote
  const quote = await db.quotes.create(data)
  
  // Increment usage
  await incrementUsage(user.id, 'quotes', 1)
  
  return quote
}
```

### 6. Feature Configuration Pipeline

#### Stripe Product Setup

```javascript
// Stripe product configuration
const products = [
  {
    name: 'QuoteKit Free',
    metadata: {
      max_quotes: '5',
      pdf_export: 'false',
      analytics_access: 'false',
      bulk_operations: 'false',
      custom_branding: 'false',
      // ... other features
    }
  },
  {
    name: 'QuoteKit Pro',
    metadata: {
      max_quotes: '-1',          // unlimited
      pdf_export: 'true',
      analytics_access: 'true',
      bulk_operations: 'true',
      custom_branding: 'true',
      // ... other features
    }
  }
]
```

#### Metadata Parsing

```typescript
// src/types/features.ts
export function parseStripeMetadata(
  metadata: Record<string, string> | null | undefined
): PlanFeatures {
  if (!metadata) return FREE_PLAN_FEATURES
  
  const features: Partial<PlanFeatures> = {}
  
  // Parse max_quotes
  if (metadata.max_quotes) {
    const maxQuotes = parseInt(metadata.max_quotes, 10)
    if (!isNaN(maxQuotes)) {
      features.max_quotes = maxQuotes
    }
  }
  
  // Parse boolean features
  const booleanFeatures: (keyof PlanFeatures)[] = [
    'pdf_export', 'analytics_access', 'bulk_operations',
    'custom_branding', 'email_templates', 'priority_support',
    'api_access', 'advanced_reporting', 'team_collaboration'
  ]
  
  booleanFeatures.forEach(feature => {
    if (metadata[feature]) {
      (features as any)[feature] = metadata[feature] === 'true'
    }
  })
  
  return mergeWithDefaults(features)
}
```

## Data Flow

### 1. User Authentication Flow

```
User Login → Supabase Auth → Set User Context → Trigger useFeatureAccess
```

### 2. Feature Access Check Flow

```
Component Mount → useFeatureAccess Hook → Fetch Subscription → Parse Metadata → Return Features
```

### 3. Usage Tracking Flow

```
User Action → Check Access → Perform Action → Increment Usage → Update Database
```

### 4. Subscription Change Flow

```
Stripe Webhook → Update Database → Refresh User Session → Update Feature Access
```

## Performance Considerations

### 1. Caching Strategy

```typescript
// Feature access caching
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useFeatureAccess() {
  const cacheKey = `features:${userId}`
  const cached = cache.get(cacheKey)
  
  if (cached && !isExpired(cached)) {
    return cached.data
  }
  
  // Fetch fresh data and cache
  const data = await fetchFeatureData()
  cache.set(cacheKey, { data, timestamp: Date.now() })
  
  return data
}
```

### 2. Database Optimization

```sql
-- Indexes for performance
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_user_usage_user_month ON user_usage(user_id, month_year);
CREATE INDEX idx_prices_product ON prices(stripe_product_id);
```

### 3. Bundle Size Optimization

- Feature gating logic in separate chunks
- Lazy load upgrade components
- Tree-shake unused feature definitions

## Security Considerations

### 1. Client-Side Security

- Client-side checks are for UX only
- All enforcement happens server-side
- Feature flags transmitted securely
- No sensitive logic in client code

### 2. Server-Side Security

- All API endpoints protected
- Database queries use RLS
- Feature checks before any action
- Audit logging for access attempts

### 3. Data Protection

- Usage data encrypted at rest
- PII handling compliant
- Subscription data secure
- Regular security audits

## Monitoring and Observability

### 1. Feature Access Metrics

```typescript
// Track feature access patterns
await analytics.track('feature_access', {
  userId,
  feature: featureKey,
  hasAccess: access.hasAccess,
  planType: user.planType,
  upgradeRequired: access.upgradeRequired
})
```

### 2. Usage Analytics

```typescript
// Track usage patterns
await analytics.track('feature_usage', {
  userId,
  feature: 'quotes',
  currentUsage: usage.quotes_count,
  limit: access.limit,
  percentageUsed: (usage.quotes_count / access.limit) * 100
})
```

### 3. Error Monitoring

```typescript
// Monitor feature access errors
if (error) {
  logger.error('Feature access failed', {
    userId,
    feature: featureKey,
    error: error.message,
    subscriptionStatus: subscription?.status
  })
}
```

## Deployment Architecture

### 1. Environment Configuration

```typescript
// Feature flags per environment
const FEATURE_FLAGS = {
  development: {
    bypassFeatureGates: true,  // For testing
    mockStripeData: true
  },
  staging: {
    bypassFeatureGates: false,
    mockStripeData: false
  },
  production: {
    bypassFeatureGates: false,
    mockStripeData: false
  }
}
```

### 2. Database Migrations

```bash
# Migration strategy
supabase migration new add_usage_tracking
supabase migration new add_feature_indexes
supabase migration new add_subscription_tables
```

### 3. Stripe Configuration

```bash
# Webhook endpoints
/api/webhooks/stripe - Handle subscription changes
/api/webhooks/stripe/products - Handle product updates
```

This architecture provides a robust, scalable foundation for QuoteKit's freemium business model with proper separation of concerns, security, and performance optimization.