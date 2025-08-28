# QuoteKit Freemium Feature Gating Requirements

## Executive Summary

This document outlines the technical requirements for implementing a comprehensive freemium business model in QuoteKit, including feature gating infrastructure, PDF customization tiers, and migration from the current three-tier to two-tier system.

## Current State Analysis

### ✅ **Already Implemented**
- **Subscription System**: Functional with Stripe integration
- **User Tier Detection**: `get_user_tier()` function returns `free | paid | premium`  
- **Global Items Gating**: Three-tier access system (`free | paid | premium`)
- **Feature Flag System**: Advanced feature flag infrastructure exists
- **PDF Generation**: Professional PDF with company branding (no restrictions)

### ❌ **Missing Infrastructure**
- **Feature Access Control**: No centralized feature gating system
- **Usage Limits**: No quote/client counting or enforcement
- **PDF Differentiation**: No free vs pro PDF variations
- **Dashboard Restrictions**: No analytics gating
- **Template Gating**: Quote templates not subscription-gated

## Requirements

### 1. Core Feature Gating Infrastructure

#### 1.1 Feature Access Manager
Create a centralized system to check user subscription access:

```typescript
interface FeatureAccessManager {
  canAccessFeature(userId: string, feature: FeatureKey): Promise<boolean>;
  getFeatureLimits(userId: string): Promise<FeatureLimits>;
  getUserTier(userId: string): Promise<'free' | 'pro'>;
  enforceLimit(userId: string, feature: LimitedFeature): Promise<boolean>;
}
```

**Implementation Location**: `src/libs/feature-access/`

#### 1.2 Feature Definitions
Define all gateable features:

```typescript
type FeatureKey = 
  | 'unlimited_quotes'
  | 'unlimited_clients' 
  | 'professional_pdf'
  | 'global_items_pro'
  | 'advanced_analytics'
  | 'email_automation'
  | 'quote_templates'
  | 'priority_support'
  | 'custom_branding';

interface FeatureLimits {
  quotes_per_month: number | 'unlimited';
  clients_total: number | 'unlimited';
  global_items_access: 'free' | 'pro';
  pdf_quality: 'basic' | 'professional';
  analytics_level: 'basic' | 'advanced';
}
```

### 2. Database Schema Requirements

#### 2.1 Usage Tracking Tables
```sql
-- Track monthly usage
CREATE TABLE user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2025-01"
  quotes_created INTEGER DEFAULT 0,
  clients_created INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Index for efficient queries
CREATE INDEX idx_user_usage_tracking_user_month ON user_usage_tracking(user_id, month_year);
```

#### 2.2 Feature Access History
```sql
-- Track feature access attempts for analytics
CREATE TABLE feature_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  access_granted BOOLEAN NOT NULL,
  user_tier TEXT NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW()
);
```

#### 2.3 Update User Tier Function
Modify existing `get_user_tier()` to return `free | pro` instead of `free | paid | premium`:

```sql
CREATE OR REPLACE FUNCTION public.get_user_tier(user_id UUID DEFAULT auth.uid()) 
RETURNS TEXT AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN 'free';
  END IF;

  -- Simplified two-tier system: any paid subscription = 'pro'
  RETURN CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.user_id = get_user_tier.user_id 
      AND s.status IN ('active', 'trialing')
      AND s.stripe_price_id IS NOT NULL
      AND s.stripe_price_id != 'price_free_plan'
    ) THEN 'pro'
    ELSE 'free'
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. PDF Customization Requirements

#### 3.1 PDF Templates System
Create separate PDF templates for free vs pro tiers:

**Files to Create:**
- `src/libs/pdf/templates/free-template.tsx` - Basic PDF with watermark
- `src/libs/pdf/templates/pro-template.tsx` - Professional PDF with full branding
- `src/libs/pdf/pdf-generator.ts` - Router to select template based on tier

#### 3.2 Free Tier PDF Requirements
- **Watermark**: "Generated with QuoteKit Free - Upgrade for full customization"
- **Limited Branding**: Company name only, no logo
- **Basic Styling**: Simplified layout, standard fonts
- **Footer Attribution**: "Powered by QuoteKit"

#### 3.3 Pro Tier PDF Requirements  
- **Full Branding**: Company logo, colors, custom styling
- **Professional Layout**: Enhanced typography, spacing
- **No Watermarks**: Clean, professional appearance
- **Custom Footer**: Company contact information

### 4. Feature Implementation Details

#### 4.1 Quote Limits (Free: 25/month, Pro: Unlimited)

**Database Functions Needed:**
```sql
-- Get current month quote count
CREATE FUNCTION get_user_monthly_quotes(user_id UUID, month_year TEXT)
RETURNS INTEGER;

-- Increment quote count
CREATE FUNCTION increment_user_quote_count(user_id UUID)
RETURNS BOOLEAN;
```

**UI Implementation:**
- Progress indicator: "15/25 quotes used this month"
- Upgrade prompt when approaching limit
- Hard block at limit with upgrade CTA

#### 4.2 Client Limits (Free: 50, Pro: Unlimited)

**Implementation:**
- Count total clients per user
- Block new client creation at limit
- Show upgrade prompt in client management

#### 4.3 Global Items Access

**Migration Required:**
```sql
-- Update global items from three-tier to two-tier
UPDATE global_items 
SET access_tier = 'pro' 
WHERE access_tier IN ('paid', 'premium');

UPDATE global_categories 
SET access_tier = 'pro' 
WHERE access_tier IN ('paid', 'premium');

-- Update type definitions
ALTER TYPE item_access_tier DROP VALUE 'paid';
ALTER TYPE item_access_tier DROP VALUE 'premium';
-- Note: PostgreSQL doesn't support dropping enum values directly
-- Will need to recreate the enum or use string type
```

#### 4.4 Analytics Dashboard Restrictions

**Free Tier Analytics:**
- Basic metrics: Total quotes, clients, revenue
- Last 30 days data only
- No export functionality

**Pro Tier Analytics:**
- Advanced metrics: Conversion rates, client lifetime value
- Historical data (all time)
- CSV/PDF export functionality
- Custom date ranges

#### 4.5 Email Integration Limits

**Free Tier:**
- Manual email sending only
- Basic email templates

**Pro Tier:**
- Automated follow-up sequences
- Custom email templates
- Email scheduling
- Email analytics

### 5. UI/UX Requirements

#### 5.1 Feature Access Indicators
- **Badges**: "PRO" badges on premium features
- **Tooltips**: "Upgrade to Pro to unlock this feature"
- **Progress Bars**: Usage limit indicators
- **Upgrade CTAs**: Contextual upgrade prompts

#### 5.2 Upgrade Flow
- **In-context Upgrades**: Upgrade buttons within features
- **Limit Reached Modals**: Block usage with upgrade option
- **Feature Comparison**: Side-by-side free vs pro comparison

#### 5.3 Settings Page Updates
- **Plan Information**: Current tier, usage stats
- **Billing Section**: Subscription management
- **Usage Dashboard**: Current month usage vs limits

### 6. API Requirements

#### 6.1 Feature Access Endpoints
```typescript
// GET /api/user/feature-access
interface FeatureAccessResponse {
  tier: 'free' | 'pro';
  features: Record<FeatureKey, boolean>;
  limits: FeatureLimits;
  usage: CurrentUsage;
}

// POST /api/user/check-limit
interface LimitCheckRequest {
  feature: LimitedFeature;
}

interface LimitCheckResponse {
  allowed: boolean;
  current: number;
  limit: number | 'unlimited';
  upgradeRequired: boolean;
}
```

#### 6.2 Usage Tracking Endpoints
```typescript
// POST /api/user/track-usage
interface UsageTrackingRequest {
  action: 'quote_created' | 'client_created' | 'pdf_generated';
  metadata?: Record<string, any>;
}
```

### 7. Migration Requirements

#### 7.1 Three-Tier to Two-Tier Migration
1. **Database Migration**: Update all `paid | premium` → `pro`
2. **Code Updates**: Update all tier checks 
3. **UI Updates**: Remove enterprise/premium references
4. **Global Items**: Consolidate paid+premium → pro

#### 7.2 Existing User Migration
```sql
-- Migrate existing users based on their current subscription
UPDATE subscriptions 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'), 
  '{migrated_from_tier}', 
  to_jsonb(CASE 
    WHEN stripe_price_id = 'price_premium_plan' THEN 'premium'
    WHEN stripe_price_id IS NOT NULL AND stripe_price_id != 'price_free_plan' THEN 'paid'
    ELSE 'free'
  END)
)
WHERE metadata->'migrated_from_tier' IS NULL;
```

### 8. Testing Requirements

#### 8.1 Feature Access Testing
- Unit tests for feature access logic
- Integration tests for subscription tier detection
- E2E tests for upgrade flows

#### 8.2 Usage Limit Testing
- Test quote/client limit enforcement
- Test usage counter accuracy
- Test limit reset behavior

#### 8.3 PDF Generation Testing
- Test free tier watermark appearance
- Test pro tier branding customization
- Test template selection logic

### 9. Performance Requirements

#### 9.1 Feature Access Caching
- Cache user tier for 5 minutes
- Cache feature access results
- Invalidate cache on subscription changes

#### 9.2 Usage Tracking Optimization
- Batch usage updates
- Optimize monthly usage queries
- Index frequently accessed data

### 10. Monitoring & Analytics

#### 10.1 Feature Access Metrics
- Track feature access attempts vs grants
- Monitor upgrade conversion rates
- Measure feature adoption by tier

#### 10.2 Usage Pattern Analysis
- Monitor limit hit rates
- Track upgrade triggers
- Analyze feature utilization

## Implementation Priority

### Phase 1: Core Infrastructure (Week 1-2)
1. Feature Access Manager implementation
2. Database schema updates
3. User tier migration to two-tier system

### Phase 2: PDF Differentiation (Week 3)
1. Free tier PDF template with watermark
2. PDF generation tier selection logic
3. PDF customization UI updates

### Phase 3: Usage Limits (Week 4-5)
1. Quote limit implementation
2. Client limit implementation
3. Usage tracking and enforcement

### Phase 4: Advanced Features (Week 6-7)
1. Analytics dashboard restrictions
2. Email integration limits
3. Global items migration

### Phase 5: Polish & Testing (Week 8)
1. UI/UX enhancements
2. Comprehensive testing
3. Performance optimization


## Success Metrics

- **Conversion Rate**: % of free users who upgrade to pro
- **Feature Adoption**: Usage of pro-only features
- **Limit Hit Rate**: % of free users who hit limits
- **Churn Reduction**: Pro user retention improvements

## Risk Assessment

### Technical Risks
- **Database Performance**: Usage tracking queries may impact performance
- **Cache Invalidation**: Stale tier data could cause access issues
- **Migration Complexity**: Three-tier to two-tier migration risks

### Business Risks
- **User Experience**: Overly restrictive limits may hurt adoption
- **Feature Parity**: Pro features must justify price point
- **Grandfathering**: Existing premium users need migration path

## Conclusion

This implementation will establish a robust freemium model with clear value differentiation between free and pro tiers, driving subscription conversions while maintaining a positive free user experience.