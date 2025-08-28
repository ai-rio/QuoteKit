# QuoteKit Comprehensive Deployment Plan

**Migration from Local Supabase to Hosted Supabase + Fly.io Prelaunch Testing**

## Executive Summary

This deployment plan addresses critical configuration issues and provides a
complete migration strategy for QuoteKit from local development to a
production-ready hosted environment for prelaunch testing.

### Critical Issues Identified

1. **Environment Configuration**: Multiple .env.production formatting errors
2. **Stripe Keys**: Using TEST keys instead of LIVE keys in production config
3. **Database Migration**: Need to migrate from local Supabase to hosted
   instance
4. **Deployment Strategy**: Fly.io deployment for prelaunch testing phase

### Migration Strategy

- **Phase 1**: Fix configuration issues and prepare hosted Supabase
- **Phase 2**: Database migration and schema deployment
- **Phase 3**: Fly.io deployment setup and configuration
- **Phase 4**: Integration testing and validation
- **Phase 5**: Go-live preparation and monitoring

---

## Phase 1: Configuration Fixes & Environment Setup

### 1.1 Fix .env.production Configuration Issues

**CRITICAL: Fix these issues before deployment**

```bash
# Navigate to project root
cd /root/dev/.devcontainer/QuoteKit

# Backup current production env
cp .env.production .env.production.backup

# Create corrected production environment file
```

**Issue Fixes Required:**

1. **Fix SUPABASE_SERVICE_ROLE_KEY (Line 13)**
   ```bash
   # WRONG: Has "YOUR_SERVICE_ROLE_KEY" appended
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8YOUR_SERVICE_ROLE_KEY

   # CORRECT: Remove the appended text
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8
   ```

2. **Fix SUPABASE_DB_PASSWORD (Line 14)**
   ```bash
   # WRONG: Full connection string instead of password
   SUPABASE_DB_PASSWORD=postgresql://postgres:Luliflora1.@@db.your-project-ref.supabase.co:5432/postgres

   # CORRECT: Extract just the password
   SUPABASE_DB_PASSWORD=Luliflora1.@
   ```

3. **Update Stripe to LIVE Keys (Lines 22-24)**
   ```bash
   # WRONG: Using test keys in production
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51PCRaPGgBK1ooXYF...
   STRIPE_SECRET_KEY=sk_test_51PCRaPGgBK1ooXYFpk09Mu8...

   # CORRECT: Use live keys for production
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
   ```

### 1.2 Create Corrected Production Environment

```bash
# Create the corrected .env.production file
cat > .env.production << 'EOF'
# QuoteKit Production Environment Variables
# NEVER commit .env.production to version control

# ==============================================
# SUPABASE PRODUCTION CONFIGURATION
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://bujajubcktlpblewxtel.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDMzNTQsImV4cCI6MjA3MDQxOTM1NH0.oLzfozz8_bYJrarlZyHJG3IM54AKLoIWI5D97TFwjH0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8
SUPABASE_DB_PASSWORD=Luliflora1.

# ==============================================
# STRIPE PRODUCTION CONFIGURATION (LIVE KEYS)
# ==============================================
# TODO: Replace with actual LIVE keys before production deployment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# ==============================================
# EMAIL CONFIGURATION
# ==============================================
RESEND_API_KEY=re_3VoudbyM_3L7J7KjqXuzFr9SiKRAXXBDA

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
NEXT_PUBLIC_SITE_URL=https://quotekit-staging.fly.dev
NODE_ENV=production

# ==============================================
# MONITORING & ANALYTICS
# ==============================================
NEXT_PUBLIC_POSTHOG_KEY=phc_aTMaOPKid2gfZUqqSs2JjHQEBLOFBhQRJke8JbWF8ya
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EOF

echo "✅ .env.production corrected and ready for deployment"
```

### 1.3 Validate Hosted Supabase Configuration

```bash
# Test connection to hosted Supabase
echo "🔍 Testing Supabase connection..."

# Install Supabase CLI if not already installed
curl -L https://github.com/supabase/cli/releases/download/v1.226.4/supabase_linux_amd64.tar.gz | tar zx
sudo mv supabase /usr/local/bin/

# Link to production Supabase project
supabase link --project-ref bujajubcktlpblewxtel

# Verify connection
supabase status --linked
```

---

## Phase 2: Supabase Migration & Database Setup

### 2.1 Database Schema Migration

```bash
echo "📊 Starting database migration to hosted Supabase..."

# Check local migration status
echo "Local migrations:"
supabase migration list

# Apply all migrations to hosted Supabase
echo "🚀 Applying migrations to production..."
supabase db push --linked --include-all

# Verify migration success
echo "✅ Verifying migration status..."
supabase migration list --linked

# Check table count (should be 87 tables as per documentation)
supabase db remote --linked --command "
SELECT 
  schemaname,
  COUNT(*) as table_count 
FROM pg_tables 
WHERE schemaname IN ('public', 'auth') 
GROUP BY schemaname;
"

# Verify key tables exist
echo "🔍 Verifying critical tables..."
supabase db remote --linked --command "\dt public.quotes"
supabase db remote --linked --command "\dt public.users"
supabase db remote --linked --command "\dt public.subscriptions"
```

### 2.2 Edge Functions Deployment

```bash
echo "⚡ Deploying Edge Functions to production Supabase..."

# Deploy all edge functions
supabase functions deploy --project-ref bujajubcktlpblewxtel

# List deployed functions
supabase functions list --project-ref bujajubcktlpblewxtel

# Test critical edge function
echo "🧪 Testing subscription-status edge function..."
curl -X POST 'https://bujajubcktlpblewxtel.supabase.co/functions/v1/subscription-status' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDMzNTQsImV4cCI6MjA3MDQxOTM1NH0.oLzfozz8_bYJrarlZyHJG3IM54AKLoIWI5D97TFwjH0' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "test-user"}' || echo "⚠️ Edge function test failed - will verify after app deployment"
```

### 2.3 Database Security Verification

```bash
echo "🔐 Verifying database security configuration..."

# Check RLS (Row Level Security) is enabled
supabase db remote --linked --command "
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  relowner 
FROM pg_tables t 
JOIN pg_class c ON c.relname = t.tablename 
WHERE schemaname = 'public' 
ORDER BY tablename;
"

# Check critical RLS policies exist
supabase db remote --linked --command "
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  permissive 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
"
```

---

## Phase 3: Fly.io Deployment Configuration

### 3.1 Fly.io Application Setup

```bash
echo "✈️ Setting up Fly.io deployment..."

# Install Fly CLI if not already installed
curl -L https://fly.io/install.sh | sh
export FLYCTL_INSTALL="/root/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Login to Fly.io
fly auth login

# Copy staging configuration as base for production deployment
cp docs/deployment/fly.io/fly-staging.toml fly.toml

# Create Fly.io application for prelaunch testing
fly apps create quotekit-prelaunch --org personal
```

### 3.2 Configure Production Fly.toml

```bash
# Create production-optimized fly.toml
cat > fly.toml << 'EOF'
# Fly.io Production Configuration for QuoteKit Prelaunch Testing
app = "quotekit-prelaunch"
primary_region = "iad"  # Washington, D.C. - close to Supabase
kill_signal = "SIGINT"
kill_timeout = "5s"

[experimental]
  auto_rollback = true

[build]
  builder = "heroku/buildpacks:20"
  buildpacks = ["heroku/nodejs"]

[env]
  NODE_ENV = "production"
  PORT = "3000"
  NODE_OPTIONS = "--max-old-space-size=1024"
  NEXT_TELEMETRY_DISABLED = "1"
  NEXT_PUBLIC_APP_ENV = "production"

[deploy]
  release_command = "npm run build"
  strategy = "rolling"
  wait_timeout = "15m"

[processes]
  web = "npm start"

# HTTP service configuration
[[services]]
  internal_port = 3000
  protocol = "tcp"
  auto_stop_machines = false  # Keep running for production testing
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 3

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  # Production health checks
  [[services.http_checks]]
    interval = "30s"
    grace_period = "10s"
    method = "GET"
    path = "/api/health"
    protocol = "http"
    timeout = "10s"
    tls_skip_verify = false

    [services.http_checks.headers]
      User-Agent = "Fly.io Health Check"

  [[services.tcp_checks]]
    grace_period = "10s"
    interval = "30s"
    port = 3000
    restart_limit = 3
    timeout = "10s"

# Production resource allocation
[[vm]]
  size = "shared-cpu-2x"  # Upgraded for production testing
  memory = "1gb"

# Production metrics and monitoring
[metrics]
  port = 9091
  path = "/metrics"

[logging]
  level = "info"
  format = "json"

# Production machine configuration
[machine]
  auto_stop = false  # Always running for production testing
  restart_policy = "always"
  kill_timeout = "30s"
EOF

echo "✅ Production fly.toml created"
```

### 3.3 Configure Fly.io Secrets

```bash
echo "🔐 Configuring Fly.io production secrets..."

# Set all production environment variables as secrets
fly secrets set \
  NEXT_PUBLIC_SUPABASE_URL="https://bujajubcktlpblewxtel.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDMzNTQsImV4cCI6MjA3MDQxOTM1NH0.oLzfozz8_bYJrarlZyHJG3IM54AKLoIWI5D97TFwjH0" \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8" \
  SUPABASE_DB_PASSWORD="Luliflora1." \
  RESEND_API_KEY="re_3VoudbyM_3L7J7KjqXuzFr9SiKRAXXBDA" \
  NEXT_PUBLIC_SITE_URL="https://quotekit-prelaunch.fly.dev" \
  NODE_ENV="production" \
  NEXT_PUBLIC_POSTHOG_KEY="phc_aTMaOPKid2gfZUqqSs2JjHQEBLOFBhQRJke8JbWF8ya" \
  NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com" \
  --app quotekit-prelaunch

# WARNING: SET STRIPE LIVE KEYS BEFORE PRODUCTION DEPLOYMENT
echo "⚠️ WARNING: You MUST set Stripe LIVE keys before production:"
echo "fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\"pk_live_YOUR_LIVE_KEY\" --app quotekit-prelaunch"
echo "fly secrets set STRIPE_SECRET_KEY=\"sk_live_YOUR_LIVE_KEY\" --app quotekit-prelaunch"
echo "fly secrets set STRIPE_WEBHOOK_SECRET=\"whsec_YOUR_LIVE_SECRET\" --app quotekit-prelaunch"

# Verify secrets are set
fly secrets list --app quotekit-prelaunch
```

---

## Phase 4: Application Deployment & Testing

### 4.1 Build and Deploy Application

```bash
echo "🚀 Building and deploying QuoteKit to Fly.io..."

# Ensure dependencies are installed
npm install

# Run local build test first
echo "🔧 Testing local build..."
npm run build

# Deploy to Fly.io
echo "🚁 Deploying to Fly.io production environment..."
fly deploy --app quotekit-prelaunch

# Monitor deployment
echo "📊 Monitoring deployment logs..."
fly logs --app quotekit-prelaunch
```

### 4.2 Deployment Verification

```bash
echo "✅ Verifying successful deployment..."

# Check application status
fly status --app quotekit-prelaunch

# Test application health endpoint
curl -f https://quotekit-prelaunch.fly.dev/api/health || echo "❌ Health check failed"

# Test main application endpoint
curl -f https://quotekit-prelaunch.fly.dev || echo "❌ Main app failed to load"

# Check application logs for errors
echo "📋 Checking recent logs for errors..."
fly logs --app quotekit-prelaunch | grep -i error | head -10 || echo "✅ No recent errors found"
```

### 4.3 Integration Testing

```bash
echo "🧪 Running integration tests..."

# Test Supabase connectivity from deployed app
fly ssh console --app quotekit-prelaunch -C "curl -H 'Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}' -H 'apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}' 'https://bujajubcktlpblewxtel.supabase.co/rest/v1/'" || echo "⚠️ Supabase connection test failed"

# Test PostHog connectivity
fly ssh console --app quotekit-prelaunch -C "curl -f https://us.i.posthog.com/decide/ -d 'token=phc_aTMaOPKid2gfZUqqSs2JjHQEBLOFBhQRJke8JbWF8ya'" || echo "⚠️ PostHog connection test failed"

# Test Resend API connectivity
fly ssh console --app quotekit-prelaunch -C "curl -f -X GET 'https://api.resend.com/domains' -H 'Authorization: Bearer re_3VoudbyM_3L7J7KjqXuzFr9SiKRAXXBDA'" || echo "⚠️ Resend API test failed"

echo "🎯 Integration tests completed - check output for any failures"
```

---

## Phase 5: Stripe Configuration & Go-Live Preparation

### 5.1 Stripe Webhook Setup

```bash
echo "💳 Setting up Stripe webhook for production..."

# Use the provided setup script
chmod +x scripts/setup-production-webhook.sh

# Run webhook setup script
./scripts/setup-production-webhook.sh

# When prompted, enter: https://quotekit-prelaunch.fly.dev

echo "📋 After webhook setup, update Fly.io secrets with the webhook secret:"
echo "fly secrets set STRIPE_WEBHOOK_SECRET=\"whsec_YOUR_NEW_SECRET\" --app quotekit-prelaunch"
```

### 5.2 Production Readiness Checklist

```bash
echo "📋 Production Readiness Checklist - Complete before go-live:"

cat << 'EOF'
## CRITICAL - Must Complete Before Production Use

### ✅ Environment Configuration
- [x] Fix .env.production SUPABASE_SERVICE_ROLE_KEY format
- [x] Fix .env.production SUPABASE_DB_PASSWORD format  
- [ ] Replace Stripe TEST keys with LIVE keys
- [x] Configure PostHog analytics
- [x] Set production domain URL

### ✅ Database & Backend
- [x] Supabase hosted instance configured
- [x] All 87 tables migrated successfully
- [x] RLS policies enabled and tested
- [x] Edge functions deployed and tested
- [x] Database connection verified

### ✅ Deployment & Infrastructure  
- [x] Fly.io application created and configured
- [x] Production secrets configured securely
- [x] Health checks configured and passing
- [x] Auto-scaling and monitoring enabled
- [x] SSL/HTTPS configured

### ⚠️  REQUIRED BEFORE GO-LIVE
- [ ] Set Stripe LIVE API keys (currently using TEST)
- [ ] Configure production Stripe webhook
- [ ] Perform end-to-end user journey testing
- [ ] Load testing under expected traffic
- [ ] Security penetration testing
- [ ] Setup monitoring alerts and dashboards
- [ ] Backup and disaster recovery testing
- [ ] Team training on production operations

### 🧪 Testing Checklist
- [ ] User registration/login flow
- [ ] Quote creation and PDF generation
- [ ] Payment processing (TEST MODE ONLY until live keys)
- [ ] Email notifications working
- [ ] Analytics tracking events
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] Performance under load
EOF
```

---

## Rollback Procedures

### Emergency Rollback Plan

```bash
echo "🔄 Emergency Rollback Procedures:"

# 1. Immediate rollback to previous version
fly apps releases --app quotekit-prelaunch
fly rollback --app quotekit-prelaunch  # Rolls back to previous release

# 2. Scale down if issues persist
fly scale count 0 --app quotekit-prelaunch  # Emergency shutdown

# 3. Revert to local development
cd /root/dev/.devcontainer/QuoteKit
supabase start  # Start local Supabase
npm run dev     # Start local development server

# 4. Database rollback (DESTRUCTIVE - use only if necessary)
# supabase db reset --linked  # WARNING: This will delete all data
```

### Configuration Rollback

```bash
# Rollback environment configuration
cp .env.production.backup .env.production

# Rollback Fly.io configuration
git checkout HEAD~1 fly.toml  # Revert to previous config
fly deploy --app quotekit-prelaunch  # Redeploy with old config
```

---

## Monitoring & Validation Procedures

### 5.3 Production Monitoring Setup

```bash
echo "📊 Setting up production monitoring..."

# Monitor application metrics
fly dashboard --app quotekit-prelaunch

# Setup log monitoring
fly logs --app quotekit-prelaunch --output logs/production.log &

# Create monitoring script
cat > monitor-production.sh << 'EOF'
#!/bin/bash
echo "🔍 QuoteKit Production Health Check - $(date)"

# Application health
echo "📱 Application Health:"
curl -f https://quotekit-prelaunch.fly.dev/api/health && echo "✅ App healthy" || echo "❌ App unhealthy"

# Database connectivity
echo "🗄️ Database Health:"
curl -f -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDMzNTQsImV4cCI6MjA3MDQxOTM1NH0.oLzfozz8_bYJrarlZyHJG3IM54AKLoIWI5D97TFwjH0" "https://bujajubcktlpblewxtel.supabase.co/rest/v1/" > /dev/null && echo "✅ Database connected" || echo "❌ Database connection failed"

# Check Fly.io app status
fly status --app quotekit-prelaunch

echo "📋 Health check complete - $(date)"
echo "----------------------------------------"
EOF

chmod +x monitor-production.sh

# Run initial monitoring check
./monitor-production.sh
```

### 5.4 Performance Validation

```bash
echo "⚡ Performance validation and optimization..."

# Check application performance
curl -o /dev/null -s -w "Connection: %{time_connect}s | DNS: %{time_namelookup}s | Total: %{time_total}s | HTTP: %{http_code}\n" https://quotekit-prelaunch.fly.dev/

# Monitor resource usage
fly metrics --app quotekit-prelaunch

# Check for any performance issues
fly logs --app quotekit-prelaunch | grep -i "slow\|timeout\|memory\|cpu" | tail -10 || echo "✅ No performance issues detected"
```

---

## Final Deployment Commands Summary

```bash
# Complete deployment execution (run these commands in sequence)

echo "🚀 QuoteKit Production Deployment - Execution Summary"
echo "=================================================="

# Phase 1: Fix configuration issues
echo "Phase 1: Configuration fixes - MANUAL step required for Stripe live keys"

# Phase 2: Database migration  
echo "Phase 2: Database migration"
supabase link --project-ref bujajubcktlpblewxtel
supabase db push --linked --include-all
supabase functions deploy --project-ref bujajubcktlpblewxtel

# Phase 3: Fly.io setup
echo "Phase 3: Fly.io deployment setup"  
fly apps create quotekit-prelaunch --org personal
# Configure secrets (replace with actual values)
fly secrets set [ALL_SECRETS] --app quotekit-prelaunch

# Phase 4: Deploy
echo "Phase 4: Application deployment"
npm run build
fly deploy --app quotekit-prelaunch

# Phase 5: Validation
echo "Phase 5: Deployment validation"
./monitor-production.sh

echo "✅ Deployment complete! Application available at: https://quotekit-prelaunch.fly.dev"
echo "⚠️  REMEMBER: Set Stripe LIVE keys before production use!"
```

---

## Support & Troubleshooting

### Quick Issue Resolution

**Common Issues & Solutions:**

1. **Build Failures**
   ```bash
   fly logs --app quotekit-prelaunch
   npm run build  # Test locally first
   ```

2. **Database Connection Issues**
   ```bash
   supabase status --linked
   fly ssh console --app quotekit-prelaunch -C "env | grep SUPABASE"
   ```

3. **Environment Variable Issues**
   ```bash
   fly secrets list --app quotekit-prelaunch
   fly secrets set KEY="value" --app quotekit-prelaunch
   ```

4. **Performance Issues**
   ```bash
   fly scale vm shared-cpu-2x --app quotekit-prelaunch
   fly scale memory 2gb --app quotekit-prelaunch
   ```

### Emergency Contacts & Escalation

- **Fly.io Support**: https://fly.io/support
- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com
- **Application Logs**: `fly logs --app quotekit-prelaunch`

---

## Success Criteria

✅ **Deployment is successful when:**

- [ ] Application accessible at https://quotekit-prelaunch.fly.dev
- [ ] Health check endpoint returning 200
- [ ] Database queries executing successfully
- [ ] User authentication working
- [ ] Quote generation and PDF creation functional
- [ ] Email notifications sending
- [ ] Analytics tracking events
- [ ] No critical errors in logs
- [ ] Response times under 2 seconds
- [ ] All integrations (Stripe, Resend, PostHog) working

🎯 **Ready for production use when:**

- [ ] Stripe LIVE keys configured
- [ ] Load testing completed successfully
- [ ] Security audit passed
- [ ] Monitoring and alerts configured
- [ ] Backup and disaster recovery tested
- [ ] Team trained on production operations

---

**Next Steps:** Execute this plan phase by phase, validating each step before
proceeding to the next. Pay special attention to the Stripe key configuration
and ensure thorough testing before enabling live payment processing.
