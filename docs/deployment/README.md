# Deployment Documentation

This directory contains deployment guides, infrastructure configuration, and CI/CD documentation for QuoteKit.

## 📁 Contents

### Infrastructure & Hosting
- `fly.io/` - Fly.io deployment configuration
  - `consolidated-plan/` - Consolidated deployment plan
  - `fly-staging-setup-guide.md` - Staging environment setup
  - `fly-io-documentation.md` - Fly.io specific documentation

### Edge Functions
- `edge-functions/` - Supabase Edge Functions deployment
  - `README.md` - Edge functions overview
  - `implementation-guide.md` - Implementation guide
  - `sprint-*-completion-report.md` - Sprint completion reports
  - `testing-strategy.md` - Testing strategies

### Migration & Setup
- `SUPABASE_MIGRATION_GUIDE.md` - Supabase migration guide
- `MIGRATION_MOSCOW_PLAN.md` - Migration planning (MoSCoW method)
- `environment-setup-guide.md` - Environment setup
- `infrastructure-configuration.md` - Infrastructure config

### Security & Compliance
- `CREDENTIAL_MANAGEMENT.md` - Credential management
- `STRIPE_DEPLOYMENT_STRATEGY.md` - Stripe deployment strategy
- `disaster-recovery-plan.md` - Disaster recovery planning

### CI/CD & Automation
- `ci-cd-pipeline.yml` - CI/CD pipeline configuration
- `deployment-checklist.md` - Pre-deployment checklist
- `COMPREHENSIVE_DEPLOYMENT_PLAN.md` - Complete deployment plan

## 🚀 Deployment Environments

### Production
- **Platform**: Fly.io
- **Database**: Supabase (Production)
- **Domain**: TBD
- **SSL**: Automatic via Fly.io

### Staging
- **Platform**: Fly.io (Staging)
- **Database**: Supabase (Staging)
- **Purpose**: Pre-production testing

## 📋 Deployment Checklist

1. ✅ Environment variables configured
2. ✅ Database migrations applied
3. ✅ Stripe webhooks configured
4. ✅ SSL certificates active
5. ✅ Monitoring and logging setup

## 🔧 Quick Commands

```bash
# Deploy to staging
fly deploy --config fly-staging.toml

# Run database migrations
supabase migration up

# Check deployment status
fly status
```
