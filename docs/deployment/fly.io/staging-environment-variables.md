# Staging Environment Variables Configuration - QuoteKit

## Overview

This document provides comprehensive guidance for configuring environment variables in the QuoteKit Fly.io staging environment. Proper environment management is crucial for testing all integrations while maintaining security and cost efficiency.

## Environment Variable Categories

### 1. Application Core Variables

#### Next.js Configuration
```bash
# Required for Next.js application
NODE_ENV=staging
PORT=3000
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_ENV=staging

# Memory optimization for staging
NODE_OPTIONS=--max-old-space-size=512

# Build configuration
NPM_CONFIG_PRODUCTION=false
SKIP_INSTALL_DEPS=false
```

#### Application URLs and Domains
```bash
# Primary application URL
NEXT_PUBLIC_SITE_URL=https://quotekit-staging.fly.dev

# API base URL (usually same as site URL)
NEXT_PUBLIC_API_URL=https://quotekit-staging.fly.dev

# WebSocket URLs (if using real-time features)
NEXT_PUBLIC_WS_URL=wss://quotekit-staging.fly.dev
```

### 2. Database Configuration

#### Supabase Staging Setup
```bash
# Supabase project URL (staging project)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_STAGING_PROJECT.supabase.co

# Supabase anonymous key (public key for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service role key (server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database connection (if using direct Postgres connection)
DATABASE_URL=postgresql://username:password@hostname:port/database?schema=public

# Database password (stored separately for security)
SUPABASE_DB_PASSWORD=your_staging_db_password
```

#### Database Pool Configuration
```bash
# Connection pooling settings for staging
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_TIMEOUT=30000

# Query timeout settings
DATABASE_QUERY_TIMEOUT=15000
```

### 3. Payment Processing (Stripe)

#### Stripe Test Mode Configuration
```bash
# Stripe publishable key (test mode - safe for client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...

# Stripe secret key (test mode - server-side only)
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...

# Webhook endpoint secret (for verifying webhook authenticity)
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...

# Stripe API version (ensure consistency)
STRIPE_API_VERSION=2023-10-16

# Product and price configuration
STRIPE_BASIC_PRICE_ID=price_test_1234567890
STRIPE_PRO_PRICE_ID=price_test_0987654321
STRIPE_ENTERPRISE_PRICE_ID=price_test_1122334455
```

#### Stripe Webhook Configuration
```bash
# Webhook endpoint URL
STRIPE_WEBHOOK_ENDPOINT=https://quotekit-staging.fly.dev/api/webhooks/stripe

# Webhook events to monitor
STRIPE_WEBHOOK_EVENTS=payment_intent.succeeded,payment_intent.payment_failed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted
```

### 4. Email Service (Resend)

#### Resend API Configuration
```bash
# Resend API key for sending emails
RESEND_API_KEY=re_staging_1234567890abcdef

# From email address
RESEND_FROM_EMAIL=noreply@staging.yourdomain.com

# Default sender name
RESEND_FROM_NAME=QuoteKit Staging

# Domain configuration
RESEND_DOMAIN=staging.yourdomain.com
```

#### Email Template Configuration
```bash
# Template IDs (if using Resend templates)
RESEND_WELCOME_TEMPLATE_ID=template_welcome_staging
RESEND_QUOTE_TEMPLATE_ID=template_quote_staging
RESEND_INVOICE_TEMPLATE_ID=template_invoice_staging

# Email testing configuration
EMAIL_TEST_MODE=true
EMAIL_CAPTURE_EMAILS=true
```

### 5. Analytics (PostHog)

#### PostHog Configuration
```bash
# PostHog project API key
NEXT_PUBLIC_POSTHOG_KEY=phc_staging_1234567890abcdef

# PostHog host (usually app.posthog.com for cloud)
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# PostHog options
NEXT_PUBLIC_POSTHOG_DEBUG=true
NEXT_PUBLIC_POSTHOG_CAPTURE_PAGEVIEW=true
NEXT_PUBLIC_POSTHOG_DISABLE_SESSION_RECORDING=false
```

#### Feature Flags Configuration
```bash
# Feature flags for staging testing
POSTHOG_STAGING_FLAGS=new_quote_flow,beta_dashboard,advanced_analytics

# A/B testing configuration
POSTHOG_ENABLE_AB_TESTING=true
```

### 6. File Storage and CDN

#### File Upload Configuration
```bash
# Maximum file upload size
MAX_FILE_UPLOAD_SIZE=10485760  # 10MB

# Allowed file types
ALLOWED_FILE_TYPES=pdf,png,jpg,jpeg,gif

# Storage configuration
STORAGE_PROVIDER=supabase  # or 's3', 'cloudinary', etc.
```

#### Supabase Storage
```bash
# Storage bucket configuration
SUPABASE_STORAGE_BUCKET=quote-attachments-staging
SUPABASE_STORAGE_URL=https://YOUR_PROJECT.supabase.co/storage/v1
```

### 7. Security and Authentication

#### JWT Configuration
```bash
# JWT secret for session management
JWT_SECRET=your_staging_jwt_secret_key_here_make_it_long_and_random

# JWT expiration times
JWT_ACCESS_TOKEN_EXPIRE=15m
JWT_REFRESH_TOKEN_EXPIRE=7d

# Session configuration
SESSION_SECRET=your_staging_session_secret_key_here
```

#### Rate Limiting
```bash
# API rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # per window

# Specific endpoint limits
RATE_LIMIT_QUOTES_PER_HOUR=10
RATE_LIMIT_EMAILS_PER_HOUR=5
```

### 8. Monitoring and Logging

#### Application Monitoring
```bash
# Log level configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Error tracking
SENTRY_DSN=https://your_sentry_dsn_for_staging@sentry.io/project_id
SENTRY_ENVIRONMENT=staging

# Performance monitoring
ENABLE_PERFORMANCE_MONITORING=true
```

#### Health Check Configuration
```bash
# Health check endpoints
HEALTH_CHECK_ENDPOINT=/api/health
HEALTH_CHECK_TIMEOUT=5000

# Monitoring intervals
HEALTH_CHECK_INTERVAL=30000
```

### 9. Third-Party Integrations

#### Google Services (if used)
```bash
# Google Analytics
NEXT_PUBLIC_GA_TRACKING_ID=GA_STAGING_TRACKING_ID

# Google Maps (if needed for address validation)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=google_maps_api_key_staging
```

#### Other Services
```bash
# Captcha service (hCaptcha)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=hcaptcha_staging_site_key
HCAPTCHA_SECRET_KEY=hcaptcha_staging_secret_key

# External API integrations
EXTERNAL_API_KEY=external_service_staging_key
EXTERNAL_API_URL=https://staging-api.external-service.com
```

## Setting Environment Variables in Fly.io

### Using Fly CLI for Secrets (Recommended)
```bash
# Set sensitive environment variables as secrets
fly secrets set STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key" --app quotekit-staging

fly secrets set SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key" --app quotekit-staging

fly secrets set RESEND_API_KEY="re_your_resend_api_key" --app quotekit-staging

fly secrets set JWT_SECRET="your_jwt_secret_key" --app quotekit-staging

fly secrets set DATABASE_URL="postgresql://username:password@host:port/db" --app quotekit-staging
```

### Using Environment Variables in fly.toml (Non-Sensitive)
```toml
[env]
  NODE_ENV = "staging"
  NEXT_PUBLIC_APP_ENV = "staging"
  NEXT_PUBLIC_SITE_URL = "https://quotekit-staging.fly.dev"
  NEXT_PUBLIC_POSTHOG_HOST = "https://app.posthog.com"
  LOG_LEVEL = "info"
  HEALTH_CHECK_INTERVAL = "30000"
```

### Bulk Secret Management
```bash
# Create a staging secrets file (DO NOT commit to git)
cat > staging-secrets.txt << EOF
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=re_your_resend_api_key
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=postgresql://username:password@host:port/db
EOF

# Set all secrets at once
fly secrets set --from-file staging-secrets.txt --app quotekit-staging

# Clean up the file immediately
rm staging-secrets.txt
```

## Environment Variable Validation

### Creating a Validation Script
```typescript
// scripts/validate-staging-env.ts
import { z } from 'zod';

const stagingEnvSchema = z.object({
  // Application
  NODE_ENV: z.literal('staging'),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  
  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().startsWith('eyJ'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().startsWith('eyJ'),
  
  // Payment
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_test_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_test_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  
  // Email
  RESEND_API_KEY: z.string().startsWith('re_'),
  
  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith('phc_'),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
});

export function validateStagingEnvironment() {
  try {
    stagingEnvSchema.parse(process.env);
    console.log('✅ All staging environment variables are valid');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}
```

### Health Check Integration
```typescript
// pages/api/health.ts or app/api/health/route.ts
export async function GET() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'RESEND_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    return Response.json({
      status: 'unhealthy',
      error: `Missing environment variables: ${missingVars.join(', ')}`
    }, { status: 500 });
  }

  // Test external service connectivity
  const services = await Promise.allSettled([
    testSupabaseConnection(),
    testStripeConnection(),
    testResendConnection(),
    testPostHogConnection(),
  ]);

  const healthyServices = services.filter(s => s.status === 'fulfilled');
  
  return Response.json({
    status: 'healthy',
    environment: 'staging',
    timestamp: new Date().toISOString(),
    services: {
      total: services.length,
      healthy: healthyServices.length,
      unhealthy: services.length - healthyServices.length
    }
  });
}
```

## Security Best Practices

### 1. Secret Management
- **Never** commit secrets to version control
- Use Fly.io secrets for all sensitive data
- Rotate secrets regularly (quarterly for staging)
- Use different secrets for each environment

### 2. Access Control
- Limit who can access staging environment variables
- Use principle of least privilege
- Monitor secret access logs
- Implement secret rotation policies

### 3. Environment Isolation
- Use completely separate accounts for staging vs production
- Never mix staging and production secrets
- Use clear naming conventions (e.g., `_STAGING`, `_TEST` suffixes)
- Implement environment-specific validation

## Troubleshooting

### Common Issues and Solutions

#### 1. Missing Environment Variables
```bash
# Check which variables are set
fly ssh console --app quotekit-staging -C "env | grep -E '(NEXT_PUBLIC_|STRIPE_|SUPABASE_)' | sort"

# Verify specific variable
fly ssh console --app quotekit-staging -C "echo \$STRIPE_SECRET_KEY"
```

#### 2. Invalid Stripe Keys
```bash
# Test Stripe connection
fly ssh console --app quotekit-staging -C "curl -u \$STRIPE_SECRET_KEY: https://api.stripe.com/v1/charges"
```

#### 3. Supabase Connection Issues
```bash
# Test Supabase API
fly ssh console --app quotekit-staging -C "curl -H 'Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY' \$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
```

#### 4. Environment Variable Updates Not Applied
```bash
# Restart application after setting secrets
fly apps restart quotekit-staging

# Force deployment to pick up new environment
fly deploy --app quotekit-staging --no-cache
```

### Debugging Environment Issues
```bash
# Run environment validation script
fly ssh console --app quotekit-staging -C "cd /app && npm run validate:env:staging"

# Check application logs for environment-related errors
fly logs --app quotekit-staging | grep -i "env\|secret\|key"

# Test all integrations
fly ssh console --app quotekit-staging -C "cd /app && npm run test:integrations"
```

## Environment Checklist

### Pre-Deployment Checklist
- [ ] All required environment variables configured
- [ ] Test mode keys used for all services
- [ ] No production secrets in staging
- [ ] Environment validation script passes
- [ ] Health check endpoint responds correctly

### Post-Deployment Verification
- [ ] Application starts successfully
- [ ] All integrations responding
- [ ] No environment-related errors in logs
- [ ] Health check returns all services healthy
- [ ] Test transactions work end-to-end

This comprehensive environment configuration ensures that the QuoteKit staging environment mirrors production functionality while maintaining proper security and isolation.