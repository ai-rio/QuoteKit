# QuoteKit Fly.io Documentation - Discrepancies and Corrections

## Overview

This document details all discrepancies found between the Fly.io deployment documentation and the actual QuoteKit system requirements, along with specific corrections needed for 100% alignment.

**Analysis Date**: 2025-01-10  
**Priority Levels**: 🔴 Critical | 🟡 Important | 🟢 Minor

## Critical Discrepancies (🔴)

### 1. Health Check Endpoint Mismatch
**Issue**: Documentation references non-existent endpoint

**Current Documentation**:
```toml
[[services.http_checks]]
  path = "/api/health"
```

**Problem**: The `/api/health` endpoint does not exist in the QuoteKit codebase.

**Actual System**: Health checks are handled by Supabase Edge Function

**CORRECTION REQUIRED**:
```toml
# Option 1: Use Edge Function health check
[[services.http_checks]]
  path = "/functions/v1/edge-functions-health-check?action=quick"
  
# Option 2: Create simple API health endpoint (recommended for Fly.io)
[[services.http_checks]]
  path = "/api/health"
```

**Action**: Create `/src/app/api/health/route.ts`:
```typescript
export async function GET() {
  // Test database connectivity
  const { createClient } = await import('@/libs/supabase/supabase-server-client');
  
  try {
    const supabase = createClient();
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error) throw error;
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running'
      }
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

### 2. Insufficient Memory Configuration
**Issue**: Memory allocation too low for production workload

**Current Documentation**:
```toml
[[vm]]
  size = 'shared-cpu-1x'  # 256MB RAM
  memory = '256mb'
```

**Problem**: Next.js 15 with TypeScript and comprehensive API routes requires more memory.

**CORRECTION REQUIRED**:
```toml
[[vm]]
  size = 'shared-cpu-1x'
  memory = '512mb'  # Minimum for production
  
# For optimal performance:
[[vm]]
  size = 'shared-cpu-2x'
  memory = '1gb'
```

### 3. Missing Critical Environment Variables
**Issue**: Several required environment variables not documented

**Missing Variables**:
```bash
# PostHog server-side integration
POSTHOG_PROJECT_API_KEY=phc_project_api_key_here
POSTHOG_PERSONAL_API_KEY=phc_personal_api_key_here
POSTHOG_PROJECT_ID=12345

# Database connection string
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Stripe API version specification
STRIPE_API_VERSION=2023-10-16

# Email service configuration
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=QuoteKit

# Application environment
NEXT_PUBLIC_APP_ENV=staging
```

**CORRECTION**: Add to `staging-environment-variables.md` and `fly-staging.toml`

## Important Discrepancies (🟡)

### 4. Content Security Policy Gaps
**Issue**: CSP configuration missing required domains

**Current Documentation**:
```javascript
connect-src 'self' https://api.stripe.com https://m.stripe.network ... https://*.supabase.co https://app.posthog.com;
```

**Missing Domains**:
```javascript
connect-src 'self' 
  https://api.stripe.com 
  https://m.stripe.network 
  https://hcaptcha.com 
  https://*.hcaptcha.com 
  https://vitals.vercel-insights.com 
  wss://ws-us3.pusher.com 
  https://*.supabase.co
  https://app.posthog.com
  data:;
  
frame-src https://js.stripe.com https://hooks.stripe.com;
```

**CORRECTION**: Update CSP in `fly-staging.toml`

### 5. Admin Configuration System Not Documented
**Issue**: No documentation for admin settings management

**Missing Documentation**:
- Admin settings table structure
- Configuration management via database
- Runtime configuration updates
- Multi-environment configuration handling

**CORRECTION REQUIRED**: Add to documentation:

```markdown
## Admin Configuration System

QuoteKit uses a sophisticated admin configuration system stored in the `admin_settings` table:

### Required Admin Settings
```sql
-- Stripe Configuration
INSERT INTO admin_settings (key, value) VALUES (
  'stripe_config',
  '{"secret_key":"sk_test_...","publishable_key":"pk_test_...","webhook_secret":"whsec_...","mode":"test"}'
);

-- Resend Configuration  
INSERT INTO admin_settings (key, value) VALUES (
  'resend_config',
  '{"api_key":"re_...","from_email":"noreply@domain.com","from_name":"QuoteKit"}'
);

-- PostHog Configuration
INSERT INTO admin_settings (key, value) VALUES (
  'posthog_config',
  '{"project_api_key":"phc_...","host":"https://app.posthog.com","project_id":"12345"}'
);
```

### 6. Edge Functions Deployment Process
**Issue**: No documentation for Supabase Edge Functions deployment

**Missing Information**:
- Edge Functions deployment workflow
- Function configuration
- Environment-specific deployment
- Performance monitoring setup

**CORRECTION**: Add Edge Functions deployment section to documentation

### 7. Build Process Complexity
**Issue**: Documentation oversimplifies build requirements

**Missing Details**:
- Bun as package manager
- TypeScript strict mode configuration
- Bundle analyzer integration
- Supabase types generation

**CORRECTION**: Update build documentation:

```toml
[build]
  builder = "heroku/buildpacks:20"
  buildpacks = ["heroku/nodejs"]

[build.env]
  NPM_CONFIG_PRODUCTION = "false"
  SKIP_INSTALL_DEPS = "false"
  # Use Bun for faster installs in production
  NPM_CONFIG_PREFER_BUN = "true"
```

## Minor Discrepancies (🟢)

### 8. Development Environment Configuration
**Issue**: Development-specific configurations not fully documented

**Missing**:
- Local development setup
- Environment detection logic
- Debug feature toggles

### 9. Monitoring and Alerting
**Issue**: Advanced monitoring capabilities not documented

**Actual System Features**:
- Performance threshold monitoring
- Edge function health checks
- Database query optimization
- Error rate tracking

## Specific File Corrections Required

### 1. Update `fly-staging.toml`

**Add missing environment variables**:
```toml
[env]
  # Existing variables...
  STRIPE_API_VERSION = "2023-10-16"
  RESEND_FROM_EMAIL = "noreply@staging.yourdomain.com"  
  RESEND_FROM_NAME = "QuoteKit Staging"
  NEXT_PUBLIC_APP_ENV = "staging"
```

**Update resource allocation**:
```toml
[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"  # Updated from 256mb
```

**Fix health check**:
```toml
[[services.http_checks]]
  path = "/api/health"  # Must create this endpoint
```

**Update CSP headers**:
```toml
Content-Security-Policy = """
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' 
              https://api.stripe.com 
              https://m.stripe.network 
              https://hcaptcha.com 
              https://*.hcaptcha.com 
              https://vitals.vercel-insights.com 
              wss://ws-us3.pusher.com
              https://*.supabase.co
              https://app.posthog.com
              data:;
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  media-src 'self' blob:;
  worker-src 'self' blob:;
  frame-src https://js.stripe.com https://hooks.stripe.com;
"""
```

### 2. Update `staging-environment-variables.md`

**Add PostHog server-side section**:
```markdown
#### PostHog Server-Side Configuration
```bash
# PostHog project API key for server-side operations
POSTHOG_PROJECT_API_KEY=phc_project_api_key_here

# PostHog personal API key for admin operations
POSTHOG_PERSONAL_API_KEY=phc_personal_api_key_here

# PostHog project ID
POSTHOG_PROJECT_ID=12345

# PostHog host (usually app.posthog.com for cloud)
POSTHOG_HOST=https://app.posthog.com
```

### 3. Create Missing Files

**Required new files**:
1. `src/app/api/health/route.ts` - Health check endpoint
2. `docs/deployment/fly.io/admin-configuration-guide.md` - Admin system docs
3. `docs/deployment/fly.io/edge-functions-deployment.md` - Edge functions guide

### 4. Update `fly-io-documentation.md`

**Add sections**:
- Admin configuration system
- Edge functions deployment
- Performance monitoring
- Advanced environment variables

## Implementation Priority

### Phase 1 (Critical - Deploy Blockers)
1. ✅ Create `/api/health` endpoint
2. ✅ Update memory allocation to 512MB minimum
3. ✅ Add missing environment variables to secrets

### Phase 2 (Important - Performance & Security)
1. ✅ Update CSP configuration
2. ✅ Document admin configuration system  
3. ✅ Add Edge functions deployment guide

### Phase 3 (Enhancement - Documentation Complete)
1. ✅ Update build process documentation
2. ✅ Add monitoring and alerting documentation
3. ✅ Create comprehensive troubleshooting guide

## Validation Checklist

After implementing corrections, verify:

- [ ] Health check endpoint responds correctly
- [ ] Application starts with 512MB memory allocation
- [ ] All environment variables are properly configured
- [ ] CSP allows all required external resources
- [ ] Admin configuration system is properly initialized
- [ ] Edge functions deploy and function correctly
- [ ] Performance monitoring is operational
- [ ] All integrations (Stripe, Supabase, Resend, PostHog) work correctly

## Post-Correction Verification

Once corrections are implemented:

1. Deploy to staging environment
2. Run comprehensive integration tests
3. Verify all external services connectivity
4. Test performance under load
5. Validate security headers and CSP
6. Confirm monitoring and alerting functionality

**Estimated Implementation Time**: 4-6 hours for all corrections

**Risk Level After Corrections**: Low - All critical deployment blockers addressed