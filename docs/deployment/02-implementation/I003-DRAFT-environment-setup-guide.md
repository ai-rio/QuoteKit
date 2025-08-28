# QuoteKit Environment Setup Guide
## Production Deployment Configuration for lawnquote.online

**Target Environment:** Production  
**Domain:** lawnquote.online  
**Updated:** 2025-08-10

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Service Account Setup](#service-account-setup)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Service-Specific Setup](#service-specific-setup)
5. [Security Configuration](#security-configuration)
6. [Testing & Validation](#testing--validation)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] **Domain Registrar** (for lawnquote.online)
- [ ] **Vercel Account** (Pro plan recommended)
- [ ] **Supabase Account** (Pro plan required)
- [ ] **Stripe Account** (verified for live transactions)
- [ ] **Resend Account** (Pro plan for production volume)
- [ ] **PostHog Account** (Growth plan recommended)

### Required Tools
```bash
# Install required CLI tools
npm install -g vercel supabase
brew install postgresql  # For database connections
```

---

## Service Account Setup

### 1. Vercel Setup
```bash
# Login to Vercel CLI
vercel login

# Create new project (or import existing)
vercel --name lawnquote

# Link local directory to Vercel project
vercel link
```

**Project Configuration:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node.js Version: 18.x

### 2. Supabase Production Project
```bash
# Create new project via dashboard or CLI
supabase projects create --name "QuoteKit Production" --region us-east-1

# Get project reference
export SUPABASE_PROJECT_REF="your-project-ref"

# Link local project
supabase link --project-ref $SUPABASE_PROJECT_REF
```

**Required Configuration:**
- Plan: Pro ($25/month minimum)
- Region: us-east-1 (or closest to users)
- Database: PostgreSQL 15
- Connection Pooling: Enabled

### 3. Stripe Production Setup
1. **Account Verification:**
   - Complete business verification
   - Add bank account for payouts
   - Enable live mode

2. **Product Setup:**
   - Create products in live mode
   - Configure pricing plans
   - Set up tax settings

3. **Webhook Configuration:**
   - Endpoint URL: `https://lawnquote.online/api/webhooks/stripe`
   - Events to send: Select all subscription and payment events
   - API Version: 2023-10-16 or latest

### 4. Resend Email Setup
```bash
# Domain verification (optional but recommended)
# Add DNS records for your domain
TXT _resend.lawnquote.online "verification_code"
MX lawnquote.online 10 mx.resend.com
```

### 5. PostHog Analytics Setup
1. Create new project in PostHog
2. Configure event tracking settings
3. Set up GDPR compliance features
4. Configure retention policies

---

## Environment Variables Configuration

### Production Environment Variables

Create a secure environment configuration file:

```bash
# .env.production (DO NOT COMMIT)
# Copy this structure for your production environment

#==========================================
# SITE CONFIGURATION
#==========================================
NEXT_PUBLIC_SITE_URL=https://lawnquote.online
NODE_ENV=production

#==========================================
# SUPABASE CONFIGURATION
#==========================================
# Get these from Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_DB_PASSWORD=your-secure-db-password

#==========================================
# STRIPE CONFIGURATION (LIVE MODE)
#==========================================
# Get these from Stripe Dashboard > Developers > API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-live-key]
STRIPE_SECRET_KEY=sk_live_[your-live-key]

# Get from Stripe Dashboard > Developers > Webhooks
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]

#==========================================
# EMAIL SERVICE CONFIGURATION
#==========================================
# Get from Resend Dashboard > API Keys
RESEND_API_KEY=re_[your-api-key]

#==========================================
# ANALYTICS CONFIGURATION
#==========================================
# Get these from PostHog Project Settings
NEXT_PUBLIC_POSTHOG_KEY=phc_[your-project-key]
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

# For server-side admin tracking
POSTHOG_PROJECT_API_KEY=[your-project-api-key]
POSTHOG_PERSONAL_API_KEY=[your-personal-api-key]
POSTHOG_PROJECT_ID=[your-project-id]
POSTHOG_HOST=https://us.posthog.com
```

### Vercel Environment Variables Setup

Add these variables to your Vercel project dashboard:

```bash
# Method 1: Via Vercel CLI
vercel env add NEXT_PUBLIC_SITE_URL production
# Enter: https://lawnquote.online

vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://[your-project-ref].supabase.co

# Continue for all variables...

# Method 2: Via Vercel Dashboard
# 1. Go to your project dashboard
# 2. Navigate to Settings > Environment Variables
# 3. Add each variable with Environment: Production
```

### Environment Variable Validation Script

Create a script to validate all required environment variables:

```typescript
// scripts/validate-env.ts
import { z } from 'zod';

const productionEnvSchema = z.object({
  // Site
  NEXT_PUBLIC_SITE_URL: z.string().url().includes('lawnquote.online'),
  NODE_ENV: z.literal('production'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().includes('.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100),
  SUPABASE_DB_PASSWORD: z.string().min(8),
  
  // Stripe (Live Mode)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_live_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_live_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  
  // Email
  RESEND_API_KEY: z.string().startsWith('re_'),
  
  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith('phc_'),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
  POSTHOG_PROJECT_API_KEY: z.string().min(20),
  POSTHOG_PERSONAL_API_KEY: z.string().min(20),
  POSTHOG_PROJECT_ID: z.string().min(5),
});

export function validateProductionEnv() {
  try {
    productionEnvSchema.parse(process.env);
    console.log('✅ All environment variables are valid for production');
    return true;
  } catch (error) {
    console.error('❌ Environment variable validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    }
    return false;
  }
}

// Run validation
if (require.main === module) {
  process.exit(validateProductionEnv() ? 0 : 1);
}
```

---

## Service-Specific Setup

### Supabase Database Setup

#### 1. Database Migration
```bash
# Apply all migrations to production
supabase db push --linked

# Generate TypeScript types
supabase gen types typescript --linked > src/libs/supabase/types.ts

# Verify migration success
supabase db diff --linked
```

#### 2. Row Level Security Setup
```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Enable RLS on any missing tables
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

#### 3. Edge Functions Deployment
```bash
# Deploy all edge functions
supabase functions deploy quote-processor --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy quote-pdf-generator --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy batch-processor --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy webhook-monitor --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy security-hardening --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy production-validator --project-ref $SUPABASE_PROJECT_REF

# Set environment variables for edge functions
supabase secrets set --project-ref $SUPABASE_PROJECT_REF \
  STRIPE_SECRET_KEY=sk_live_your_key \
  RESEND_API_KEY=re_your_key \
  POSTHOG_API_KEY=your_key
```

### Stripe Configuration

#### 1. Webhook Setup Script
```bash
#!/bin/bash
# setup-stripe-webhook.sh

STRIPE_CLI_PATH=$(which stripe)
if [ -z "$STRIPE_CLI_PATH" ]; then
  echo "Installing Stripe CLI..."
  # Installation varies by OS
fi

# Login to Stripe
stripe login

# Create webhook endpoint
stripe webhooks create \
  --url https://lawnquote.online/api/webhooks/stripe \
  --description "QuoteKit Production Webhook" \
  --enabled-events customer.subscription.created \
  --enabled-events customer.subscription.updated \
  --enabled-events customer.subscription.deleted \
  --enabled-events checkout.session.completed \
  --enabled-events invoice.payment_succeeded \
  --enabled-events invoice.payment_failed \
  --enabled-events setup_intent.succeeded \
  --enabled-events payment_method.attached

echo "Webhook created successfully!"
echo "Don't forget to update STRIPE_WEBHOOK_SECRET in your environment variables"
```

#### 2. Product Setup Script
```typescript
// scripts/setup-stripe-products.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function setupProducts() {
  // Create Starter Plan
  const starterProduct = await stripe.products.create({
    name: 'LawnQuote Starter',
    description: 'Perfect for small lawn care businesses',
  });

  const starterPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  // Create Pro Plan
  const proProduct = await stripe.products.create({
    name: 'LawnQuote Pro',
    description: 'Advanced features for growing businesses',
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log('Products created successfully!');
  console.log('Starter Price ID:', starterPrice.id);
  console.log('Pro Price ID:', proPrice.id);
}

setupProducts().catch(console.error);
```

### PostHog Configuration

#### 1. Project Settings
```typescript
// PostHog configuration for production
const posthogConfig = {
  api_host: 'https://us.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
  disable_session_recording: false, // Enable for user behavior analysis
  session_recording: {
    recordCrossOriginIframe: false,
    maskAllInputs: true, // GDPR compliance
    maskTextSelectors: ['[data-sensitive]'],
  },
  autocapture: true,
  disable_cookie: false, // Set true if GDPR requires it
};
```

#### 2. Custom Events Setup
```typescript
// Define production event taxonomy
const eventTaxonomy = {
  // User Actions
  'user_registered': { user_id: 'string', plan: 'string' },
  'subscription_started': { user_id: 'string', plan: 'string', amount: 'number' },
  'quote_created': { user_id: 'string', quote_value: 'number' },
  'quote_sent': { user_id: 'string', quote_id: 'string' },
  
  // Business Events
  'payment_succeeded': { user_id: 'string', amount: 'number' },
  'payment_failed': { user_id: 'string', reason: 'string' },
  'subscription_cancelled': { user_id: 'string', reason: 'string' },
  
  // Admin Events
  'admin_action': { admin_id: 'string', action: 'string', target: 'string' },
};
```

---

## Security Configuration

### 1. Environment Variable Security
```bash
# Use secure methods to set sensitive variables
# Never commit secrets to version control

# Generate strong passwords
openssl rand -base64 32  # For database passwords
openssl rand -hex 32     # For API keys

# Rotate secrets regularly (quarterly recommended)
```

### 2. Database Security Checklist
- [ ] Strong database password (32+ characters)
- [ ] Connection encryption enforced
- [ ] Row Level Security enabled on all tables
- [ ] Admin users properly configured
- [ ] Backup encryption enabled
- [ ] Regular security updates applied

### 3. API Security Configuration
```typescript
// Rate limiting configuration
const rateLimiting = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
    });
  },
};

// CORS configuration
const corsOptions = {
  origin: ['https://lawnquote.online', 'https://www.lawnquote.online'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

---

## Testing & Validation

### 1. Environment Validation Script
```bash
#!/bin/bash
# validate-production-env.sh

echo "🔍 Validating production environment..."

# Test site accessibility
if curl -s --head https://lawnquote.online | head -n 1 | grep -q "200 OK"; then
  echo "✅ Site is accessible"
else
  echo "❌ Site is not accessible"
fi

# Test database connection
if npx tsx scripts/test-db-connection.ts; then
  echo "✅ Database connection successful"
else
  echo "❌ Database connection failed"
fi

# Test Stripe webhook
if curl -s -X POST https://lawnquote.online/api/health | grep -q "ok"; then
  echo "✅ Health check endpoint working"
else
  echo "❌ Health check endpoint failed"
fi

# Test email service
if npx tsx scripts/test-email-service.ts; then
  echo "✅ Email service working"
else
  echo "❌ Email service failed"
fi

echo "🎉 Validation complete!"
```

### 2. Database Connection Test
```typescript
// scripts/test-db-connection.ts
import { supabaseAdminClient } from '../src/libs/supabase/supabase-admin';

async function testDatabaseConnection() {
  try {
    const { data, error } = await supabaseAdminClient
      .from('users')
      .select('count(*)')
      .single();

    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }

    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
}

testDatabaseConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(() => process.exit(1));
```

### 3. Service Integration Tests
```typescript
// scripts/test-integrations.ts
import { stripeAdmin } from '../src/libs/stripe/stripe-admin';
import { resendClient } from '../src/libs/resend/resend-client';

async function testStripeConnection() {
  try {
    const account = await stripeAdmin.accounts.retrieve();
    console.log('✅ Stripe connection successful:', account.id);
    return true;
  } catch (error) {
    console.error('❌ Stripe connection failed:', error);
    return false;
  }
}

async function testResendConnection() {
  try {
    // Test with a simple API call
    const domains = await resendClient.domains.list();
    console.log('✅ Resend connection successful');
    return true;
  } catch (error) {
    console.error('❌ Resend connection failed:', error);
    return false;
  }
}

async function runAllTests() {
  const results = await Promise.all([
    testStripeConnection(),
    testResendConnection(),
  ]);

  const success = results.every(result => result);
  console.log(success ? '🎉 All integrations working' : '❌ Some integrations failed');
  process.exit(success ? 0 : 1);
}

runAllTests();
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Environment Variable Issues
```bash
# Issue: Variables not loading in Vercel
# Solution: Check environment variable scope (Production vs Preview vs Development)

# Verify variables are set correctly
vercel env ls

# Check for typos in variable names
grep -r "process.env" src/ | grep -v node_modules
```

#### 2. Database Connection Issues
```bash
# Issue: Database connection timeouts
# Solution: Check connection pooling settings

# Test direct connection
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Check connection pool status
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

#### 3. Stripe Webhook Issues
```bash
# Issue: Webhook signature verification failures
# Solution: Verify webhook secret and endpoint URL

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check webhook logs in Stripe Dashboard
# Verify STRIPE_WEBHOOK_SECRET matches dashboard
```

#### 4. Email Delivery Issues
```bash
# Issue: Emails not being delivered
# Solution: Check domain verification and API limits

# Test email sending
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@lawnquote.online",
    "to": ["test@example.com"],
    "subject": "Test Email",
    "html": "<p>Test message</p>"
  }'
```

### Debug Mode Configuration

```typescript
// Enable debug mode for production troubleshooting
const debugConfig = {
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  enableConsoleLogging: false, // Disable in production
  enableFileLogging: true,
  logRetention: '30d',
  sensitiveDataMasking: true,
};

// Conditional debugging
if (process.env.DEBUG_MODE === 'true') {
  console.log('Debug mode enabled for production troubleshooting');
  // Enable additional logging temporarily
}
```

### Health Check Endpoints

```typescript
// /api/health-detailed
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: await checkDatabase(),
    stripe: await checkStripe(),
    email: await checkEmail(),
    analytics: await checkPostHog(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      hasRequiredEnvVars: validateRequiredEnvVars(),
    }
  };

  const isHealthy = Object.values(checks).every(check => 
    typeof check === 'object' && check.status === 'ok'
  );

  return Response.json(checks, { 
    status: isHealthy ? 200 : 503 
  });
}
```

---

## Deployment Preparation Checklist

### Pre-Deployment
- [ ] All service accounts created and verified
- [ ] Environment variables configured and validated
- [ ] Database migrations ready
- [ ] Webhook endpoints configured
- [ ] Domain DNS configured
- [ ] SSL certificates ready

### During Deployment
- [ ] Environment validation script passes
- [ ] Database connection successful
- [ ] All service integrations tested
- [ ] Health checks returning 200
- [ ] Critical user flows tested

### Post-Deployment
- [ ] Monitor error rates for first 24 hours
- [ ] Verify all webhooks processing correctly
- [ ] Check email delivery rates
- [ ] Monitor database performance
- [ ] Validate analytics data collection

---

**Guide Updated:** 2025-08-10  
**Version:** 1.0  
**Next Review:** Post-deployment + 7 days