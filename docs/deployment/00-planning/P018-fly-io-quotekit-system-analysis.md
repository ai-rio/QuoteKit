# QuoteKit System Architecture Analysis

## Overview

This document provides a comprehensive analysis of the actual QuoteKit system architecture, integrations, and configuration requirements based on detailed codebase analysis. This analysis serves as the foundation for verifying alignment with Fly.io deployment documentation.

**Analysis Date**: 2025-01-10  
**Codebase Branch**: feature/edge-functions-implementation  
**Analysis Method**: Comprehensive Serena-based codebase scanning

## Core System Architecture

### Application Framework
- **Framework**: Next.js 15 with App Router
- **React Version**: 19.0.0
- **TypeScript**: v5.7.3 (strict mode enabled)
- **Package Manager**: Bun v1.2.17
- **Build Target**: Node.js with Edge Runtime support

### Database & Backend Services
- **Primary Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with magic links
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage

## External Service Integrations

### 1. Stripe Payment Integration
**Status**: Production-ready with comprehensive webhook handling

**Required Environment Variables**:
```bash
# Client-side (public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (test) or pk_live_... (production)

# Server-side (secret)
STRIPE_SECRET_KEY=sk_test_... (test) or sk_live_... (production)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16
```

**Key Features**:
- Subscription management (trialing, active, canceled, incomplete, past_due, unpaid, paused)
- Payment method storage and management
- Webhook handling with retry logic and dead letter queue
- Product/price synchronization
- Customer mapping and billing history
- Edge case handling (failed payments, disputes, prorations)

**API Endpoints**:
- `/api/webhooks/stripe` - Main webhook handler
- `/api/subscription-status` - Subscription status checks
- `/api/payment-methods/*` - Payment method management
- `/api/billing-history/*` - Billing history access

### 2. Supabase Integration
**Status**: Production-ready with edge functions and comprehensive security

**Required Environment Variables**:
```bash
# Client-side (public)
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Server-side (secret)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

**Database Schema** (Key Tables):
- `users` - User profiles and settings
- `company_settings` - Business configuration
- `line_items` - Service/material catalog
- `quotes` - Quote management
- `clients` - Customer management
- `subscriptions` - Stripe subscription data
- `stripe_customers` - Customer mapping
- `payment_methods` - Stored payment methods
- `admin_settings` - System configuration
- `edge_function_metrics` - Performance monitoring

**Edge Functions**:
- `subscription-status` - Real-time subscription checks
- `quote-processor` - Quote calculation and processing
- `quote-pdf-generator` - PDF generation service
- `webhook-handler` - External webhook processing
- `batch-processor` - Background job processing
- `performance-optimizer` - System optimization
- `security-hardening` - Security enforcement
- `edge-functions-health-check` - System health monitoring

### 3. Resend Email Integration
**Status**: Production-ready with template support

**Required Environment Variables**:
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=QuoteKit
```

**Features**:
- Transactional email sending
- Quote email delivery
- Welcome emails
- SMTP configuration for development

### 4. PostHog Analytics Integration
**Status**: Production-ready with comprehensive event tracking

**Required Environment Variables**:
```bash
# Client-side (public)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Server-side (secret)
POSTHOG_PROJECT_API_KEY=...
POSTHOG_PERSONAL_API_KEY=...
POSTHOG_PROJECT_ID=...
POSTHOG_HOST=https://app.posthog.com
```

**Features**:
- User activity tracking
- Admin action logging
- Quote management analytics
- System metrics collection
- Feature flag management

## Application Architecture

### Directory Structure
```
src/
├── app/                     # Next.js App Router pages and API routes
│   ├── api/                # API endpoints (150+ routes)
│   ├── (app)/              # Protected application pages
│   ├── (auth)/             # Authentication pages
│   ├── (admin)/            # Admin dashboard
│   └── (account)/          # Account management
├── components/             # Reusable UI components
├── features/               # Feature-based modules
│   ├── account/           # Subscription and billing
│   ├── admin/             # Admin functionality
│   ├── auth/              # Authentication
│   ├── billing/           # Billing edge cases
│   ├── items/             # Item library management
│   ├── quotes/            # Quote management
│   └── settings/          # Company settings
├── libs/                  # External service integrations
│   ├── stripe/           # Stripe client/admin
│   ├── supabase/         # Supabase clients
│   ├── resend/           # Email service
│   ├── posthog/          # Analytics service
│   └── pdf/              # PDF generation
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

### API Routes Analysis
**Total API Endpoints**: 150+ routes across multiple features

**Core API Categories**:
1. **Authentication**: `/api/auth/*`
2. **Quote Management**: `/api/quotes/*` (CRUD, PDF, email, bulk operations)
3. **Subscription Management**: `/api/subscription/*`
4. **Payment Methods**: `/api/payment-methods/*`
5. **Billing**: `/api/billing-history/*`
6. **Admin Operations**: `/api/admin/*` (40+ endpoints)
7. **Webhooks**: `/api/webhooks/*`
8. **Analytics**: `/api/analytics/*`
9. **Global Items**: `/api/global-items/*`
10. **Edge Function Proxies**: `/api/supabase/functions/*`

## Security Configuration

### Content Security Policy
```javascript
const csp = {
  "default-src": "'self'",
  "script-src": "'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
  "style-src": "'self' 'unsafe-inline'",
  "connect-src": [
    "'self'",
    "https://api.stripe.com",
    "https://m.stripe.network", 
    "https://hcaptcha.com",
    "https://*.hcaptcha.com",
    "https://vitals.vercel-insights.com",
    "wss://ws-us3.pusher.com",
    "https://*.supabase.co",
    "https://app.posthog.com",
    "data:"
  ].join(" "),
  "img-src": "'self' data: https: blob:",
  "font-src": "'self' data:",
  "frame-src": "https://js.stripe.com https://hooks.stripe.com"
}
```

### Row Level Security (RLS)
- All database tables have RLS policies
- User-scoped data access
- Admin-only operations protected
- Service role key for server operations

## Build Configuration

### Next.js Configuration
- ESLint disabled during builds (development optimization)
- Bundle analyzer available (`ANALYZE=true`)
- Image optimization for external domains
- Security headers enabled
- Server external packages configuration

### Dependencies Analysis
**Runtime Dependencies**: 60+ packages
**Key Dependencies**:
- `@supabase/supabase-js`: ^2.47.12
- `stripe`: ^14.25.0
- `resend`: ^4.1.1
- `posthog-js`: ^1.257.2
- `@react-pdf/renderer`: ^4.3.0
- `next`: ^15.1.4
- `react`: 19.0.0

## Performance & Monitoring

### Health Check System
- **Edge Function**: `/functions/v1/edge-functions-health-check`
- **Features**:
  - System-wide health monitoring
  - Individual function testing
  - Performance threshold monitoring
  - Database connectivity verification
  - Response time tracking

### Performance Thresholds
```typescript
const PERFORMANCE_THRESHOLDS = {
  response_time_ms: 2000,
  database_query_time_ms: 500,
  memory_usage_mb: 128,
  error_rate_percent: 1
}
```

## Environment Configuration Requirements

### Application Core
```bash
NODE_ENV=staging|production
NEXT_PUBLIC_SITE_URL=https://your-app.fly.dev
NEXT_PUBLIC_APP_ENV=staging|production
PORT=3000
```

### Database Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
```

### Payment Processing
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_|pk_live_...
STRIPE_SECRET_KEY=sk_test_|sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Email Service
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@domain.com
RESEND_FROM_NAME=QuoteKit
```

### Analytics
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
POSTHOG_PROJECT_API_KEY=...
```

## Deployment Requirements

### Runtime Requirements
- Node.js 18+ (Next.js 15 requirement)
- Memory: 512MB minimum, 1GB recommended
- CPU: 1 vCPU minimum
- Storage: Persistent storage not required (stateless)

### Network Requirements
- HTTPS support mandatory
- WebSocket support for Supabase Realtime
- Webhook endpoints for Stripe integration
- Health check endpoint availability

### Build Process
1. Dependency installation with Bun
2. TypeScript compilation
3. Next.js build with bundle optimization
4. Static file generation
5. Supabase types generation (optional)

## Scaling Considerations

### Database Connections
- Connection pooling through Supabase
- Configurable pool sizes
- Edge functions use separate connection pools

### Edge Function Scaling
- Auto-scaling based on demand
- Performance monitoring and optimization
- Connection pool management
- Batch processing capabilities

### External Service Rate Limits
- Stripe: Standard API rate limits
- Resend: Based on plan tier
- PostHog: Based on plan tier
- Supabase: Based on plan tier

## Development vs Production Differences

### Environment Detection
```typescript
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1')
```

### Feature Toggles
- Email capture in development
- Debug logging levels
- Performance monitoring verbosity
- Test vs live payment processing

## Admin Configuration System

The system uses a sophisticated admin configuration approach stored in `admin_settings` table:

**Configuration Keys**:
- `stripe_config`: Complete Stripe configuration
- `resend_config`: Email service configuration  
- `posthog_config`: Analytics configuration

**Benefits**:
- Runtime configuration updates
- Environment-specific settings
- Centralized configuration management
- Admin UI for configuration management

## Conclusion

QuoteKit is a production-ready, feature-complete SaaS application with:
- Comprehensive payment integration
- Real-time database capabilities
- Advanced monitoring and health checks
- Scalable edge function architecture
- Multi-environment support
- Robust security implementation
- Admin configuration management

The system is architected for cloud deployment with clear separation of concerns, comprehensive error handling, and production-grade monitoring capabilities.