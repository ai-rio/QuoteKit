# Supabase Local-to-Hosted Migration Guide

**QuoteKit Production Deployment**

## Overview

This guide provides step-by-step instructions for migrating QuoteKit from local
Supabase development to hosted Supabase production, addressing the critical gap
identified in the system audit.

## Prerequisites

- Local QuoteKit development environment running
- Supabase CLI installed and configured
- Access to create Supabase hosted projects
- Production deployment platform ready (Fly.io, Vercel, etc.)

## Migration Process

### Phase 1: Supabase Production Setup

#### 1.1 Create Hosted Supabase Project

```bash
# Login to Supabase (if not already logged in)
supabase login

# Create new project via Supabase Dashboard
# Go to https://supabase.com/dashboard
# Click "New Project"
# Choose organization and region
# Set project name: "quotekit-production"
# Set database password (save securely)
```

#### 1.2 Get Production Credentials

After project creation, collect these values from Project Settings → API:

```bash
# Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://bujajubcktlpblewxtel.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDMzNTQsImV4cCI6MjA3MDQxOTM1NH0.oLzfozz8_bYJrarlZyHJG3IM54AKLoIWI5D97TFwjH0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8

# Project Settings → Database
DATABASE_URL=postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres
```

#### 1.3 Link Local Project to Production

```bash
cd /root/dev/.devcontainer/QuoteKit

# Link to production project
supabase link --project-ref your-project-ref

# Verify connection
supabase status --linked
```

### Phase 2: Schema Migration

#### 2.1 Apply Migrations to Production

```bash
# Apply all 28 local migrations to production
supabase db push --linked

# Verify migration status
supabase migration list --linked
```

#### 2.2 Verify Schema Deployment

```bash
# Check table count (should be 87 tables)
supabase db remote --linked --command "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Verify key tables exist
supabase db remote --linked --command "\dt public.quotes"
supabase db remote --linked --command "\dt public.users"
supabase db remote --linked --command "\dt public.subscriptions"
```

#### 2.3 Verify RLS Policies

```bash
# Check RLS is enabled on key tables
supabase db remote --linked --command "
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true 
ORDER BY tablename;
"
```

### Phase 3: Data Migration (Optional)

#### 3.1 Export Development Data

```bash
# Export users (if needed for testing)
supabase db dump --data-only --table auth.users > users_export.sql

# Export line items
supabase db dump --data-only --table public.line_items > line_items_export.sql

# Export company settings
supabase db dump --data-only --table public.company_settings > company_settings_export.sql
```

#### 3.2 Import to Production (if needed)

```bash
# Import data to production (use carefully)
supabase db remote --linked --file users_export.sql
supabase db remote --linked --file line_items_export.sql
supabase db remote --linked --file company_settings_export.sql
```

### Phase 4: Environment Configuration

#### 4.1 Update Production Environment Variables

Create `.env.production` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-db-password

# Stripe Configuration (use production keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email Configuration
RESEND_API_KEY=re_your-production-api-key

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
NODE_ENV=production
```

#### 4.2 Configure Deployment Platform

**For Fly.io:**

```bash
# Set environment variables
fly secrets set NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# ... set all other production secrets
```

**For Vercel:**

```bash
# Set environment variables in Vercel dashboard
# Or use Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all other production variables
```

### Phase 5: Edge Functions Deployment

#### 5.1 Deploy Edge Functions to Production

```bash
# Deploy all Edge Functions to production Supabase
supabase functions deploy --project-ref your-project-ref

# Verify deployment
supabase functions list --project-ref your-project-ref
```

#### 5.2 Test Edge Functions

```bash
# Test subscription-status function
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/subscription-status' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "test"}'
```

### Phase 6: Validation and Testing

#### 6.1 Database Connectivity Test

```bash
# Test database connection from application
npm run build
npm run start

# Check application logs for database connection
```

#### 6.2 Authentication Test

```bash
# Test authentication flow
# 1. Go to production URL
# 2. Try to sign up/sign in
# 3. Verify user creation in Supabase dashboard
```

#### 6.3 Core Functionality Test

```bash
# Test core features:
# 1. User registration/login
# 2. Company settings creation
# 3. Line item management
# 4. Quote creation
# 5. PDF generation
# 6. Email sending
```

### Phase 7: Production Deployment

#### 7.1 Deploy Application

```bash
# Build and deploy application
npm run build

# Deploy to chosen platform
# Fly.io: fly deploy
# Vercel: vercel --prod
# Other: follow platform-specific deployment
```

#### 7.2 Configure Custom Domain (Optional)

```bash
# Configure custom domain in deployment platform
# Update NEXT_PUBLIC_SITE_URL to custom domain
# Configure DNS records
```

#### 7.3 Configure Webhooks

```bash
# Update Stripe webhook endpoint to production URL
# https://your-production-domain.com/api/webhooks

# Test webhook delivery in Stripe dashboard
```

## Rollback Procedures

### Emergency Rollback

If issues occur during migration:

```bash
# 1. Revert to local development
cd /root/dev/.devcontainer/QuoteKit
supabase start

# 2. Unlink from production (if needed)
supabase unlink

# 3. Continue local development
npm run dev
```

### Schema Rollback

If schema issues occur:

```bash
# Reset production database (DESTRUCTIVE)
supabase db reset --linked

# Re-apply specific migration
supabase migration up --linked --to 20250808190000
```

## Monitoring and Maintenance

### Production Monitoring

1. **Supabase Dashboard**: Monitor database performance, API usage
2. **Application Logs**: Monitor application errors and performance
3. **Stripe Dashboard**: Monitor payment processing
4. **Email Delivery**: Monitor email sending via Resend

### Regular Maintenance

```bash
# Weekly: Check database performance
supabase db remote --linked --command "
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC LIMIT 10;
"

# Monthly: Review and apply new migrations
supabase migration list --linked
supabase db push --linked
```

## Troubleshooting

### Common Issues

#### Migration Fails

```bash
# Check migration status
supabase migration list --linked

# Check specific migration
supabase db remote --linked --command "\d+ table_name"

# Manual fix if needed
supabase db remote --linked --command "ALTER TABLE ..."
```

#### Connection Issues

```bash
# Verify credentials
supabase status --linked

# Test connection
supabase db remote --linked --command "SELECT version();"
```

#### RLS Policy Issues

```bash
# Check RLS policies
supabase db remote --linked --command "
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
"
```

## Security Considerations

### Production Security Checklist

- [ ] Use production Stripe keys (not test keys)
- [ ] Secure environment variables (not in code)
- [ ] Enable RLS on all tables
- [ ] Configure proper CORS settings
- [ ] Use HTTPS for all endpoints
- [ ] Secure webhook endpoints
- [ ] Monitor for security incidents
- [ ] Regular security updates

### Access Control

- [ ] Limit Supabase project access
- [ ] Use service role key only in server-side code
- [ ] Rotate API keys regularly
- [ ] Monitor API usage for anomalies

## Success Criteria

Migration is successful when:

- [ ] All 87 tables exist in production database
- [ ] All 28 migrations applied successfully
- [ ] RLS policies active on all tables
- [ ] Edge Functions deployed and functional
- [ ] Application connects to production database
- [ ] Authentication works end-to-end
- [ ] Core features functional (quotes, PDF, email)
- [ ] Stripe integration working
- [ ] No data loss from migration
- [ ] Performance meets expectations

## Support and Resources

- **Supabase Documentation**: https://supabase.com/docs
- **QuoteKit System Audit**: See `SYSTEM_AUDIT_REPORT.md`
- **Edge Functions Guide**: See `docs/edge-functions/`
- **Deployment Troubleshooting**: See deployment platform documentation

---

**Note**: This migration guide addresses the critical gap identified in the
system audit. Follow each phase carefully and test thoroughly before proceeding
to the next phase.
