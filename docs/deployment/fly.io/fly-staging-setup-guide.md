# Fly.io Staging Environment Setup Guide - QuoteKit

## Prerequisites

### Required Accounts & Access
- [ ] Fly.io account with billing enabled
- [ ] GitHub repository access with Actions enabled
- [ ] Supabase account for staging project
- [ ] Stripe account with test mode enabled
- [ ] Resend account for email testing
- [ ] PostHog account for analytics staging

### Local Development Requirements
- [ ] Node.js 18+ and Bun package manager
- [ ] Fly CLI installed (`curl -L https://fly.io/install.sh | sh`)
- [ ] Supabase CLI installed
- [ ] Docker installed (for local testing)
- [ ] Git configured with SSH keys

### Environment Validation
```bash
# Verify installations
fly version
supabase --version
node --version
bun --version
docker --version
```

## Step 1: Fly.io Initial Setup

### 1.1 Authentication and Organization
```bash
# Login to Fly.io
fly auth login

# Create organization (optional, for team management)
fly orgs create quotekit-staging

# List available regions (choose closest to users/database)
fly platform regions
```

### 1.2 Application Initialization
```bash
# Navigate to QuoteKit project root
cd /path/to/QuoteKit

# Initialize Fly app (will create fly.toml)
fly launch --no-deploy --name quotekit-staging --region iad

# Choose configuration options:
# - Do you want to copy configuration from existing app? No
# - Choose an app name: quotekit-staging
# - Choose a region: iad (Washington, D.C.)
# - Would you like to set up a Postgresql database? Yes (staging)
# - Would you like to set up an Upstash Redis database? No
# - Would you like to deploy now? No
```

### 1.3 Database Setup
```bash
# Create dedicated staging Postgres database
fly postgres create --name quotekit-staging-db --region iad --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10

# Get database URL (save this for later)
fly postgres connect --database-url quotekit-staging-db
```

## Step 2: Supabase Staging Configuration

### 2.1 Create Staging Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project: "QuoteKit Staging"
3. Choose region closest to Fly.io deployment (us-east-1)
4. Generate strong database password
5. Wait for project provisioning

### 2.2 Configure Staging Database
```bash
# Link staging Supabase project
supabase link --project-ref YOUR_STAGING_PROJECT_REF

# Apply migrations to staging
supabase db push

# Generate types for staging
npx supabase gen types typescript --project-id YOUR_STAGING_PROJECT_REF --schema public > src/libs/supabase/types-staging.ts
```

### 2.3 Edge Functions Deployment
```bash
# Deploy all edge functions to staging
supabase functions deploy --project-ref YOUR_STAGING_PROJECT_REF

# Test edge functions
supabase functions invoke quote-generator --project-ref YOUR_STAGING_PROJECT_REF
```

## Step 3: Environment Configuration

### 3.1 Staging Environment Variables
Create staging-specific environment configuration:

```bash
# Set Fly.io secrets for sensitive data
fly secrets set NEXT_PUBLIC_SUPABASE_URL="https://YOUR_STAGING_PROJECT.supabase.co" --app quotekit-staging

fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_STAGING_ANON_KEY" --app quotekit-staging

fly secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_STAGING_SERVICE_KEY" --app quotekit-staging

fly secrets set DATABASE_URL="postgres://postgres:password@host:5432/database" --app quotekit-staging

# Stripe staging configuration
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_STRIPE_PK" --app quotekit-staging

fly secrets set STRIPE_SECRET_KEY="sk_test_YOUR_STRIPE_SK" --app quotekit-staging

fly secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_STAGING_WEBHOOK_SECRET" --app quotekit-staging

# Resend staging configuration
fly secrets set RESEND_API_KEY="re_YOUR_STAGING_API_KEY" --app quotekit-staging

# PostHog staging configuration
fly secrets set NEXT_PUBLIC_POSTHOG_KEY="phc_YOUR_STAGING_KEY" --app quotekit-staging
fly secrets set NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com" --app quotekit-staging

# Application configuration
fly secrets set NEXT_PUBLIC_SITE_URL="https://quotekit-staging.fly.dev" --app quotekit-staging
fly secrets set NODE_ENV="staging" --app quotekit-staging
```

### 3.2 Verify Environment Configuration
```bash
# List all configured secrets
fly secrets list --app quotekit-staging

# Test configuration (will not show values)
fly ssh console --app quotekit-staging -C "printenv | grep NEXT_PUBLIC"
```

## Step 4: Application Deployment Configuration

### 4.1 Configure fly-staging.toml
This file was created in the next step, but here's what it configures:
- Application runtime settings
- Health check configurations  
- Volume mounts (if needed)
- Network and service configurations

### 4.2 Build and Deploy
```bash
# Build the application locally first (for validation)
bun run build

# Deploy to Fly.io staging
fly deploy --config fly-staging.toml --app quotekit-staging

# Monitor deployment
fly logs --app quotekit-staging
```

### 4.3 Verify Deployment
```bash
# Check application status
fly status --app quotekit-staging

# Test application endpoints
curl https://quotekit-staging.fly.dev/api/health
curl https://quotekit-staging.fly.dev

# Check logs for errors
fly logs --app quotekit-staging
```

## Step 5: Service Integrations Setup

### 5.1 Stripe Webhook Configuration
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://quotekit-staging.fly.dev/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to Fly.io secrets

### 5.2 Resend Domain Configuration
1. Go to Resend Dashboard → Domains
2. Add staging subdomain: `staging-mail.yourdomain.com`
3. Configure DNS records as instructed
4. Verify domain ownership

### 5.3 PostHog Project Setup
1. Create new PostHog project: "QuoteKit Staging"
2. Copy project API key
3. Configure feature flags for staging
4. Set up custom events for testing

## Step 6: Database Migration and Seeding

### 6.1 Run Migrations
```bash
# Deploy database migrations
fly ssh console --app quotekit-staging -C "cd /app && npx supabase migration up"

# Verify migration status
fly ssh console --app quotekit-staging -C "cd /app && npx supabase migration list"
```

### 6.2 Seed Staging Data
```bash
# Create staging seed data script
fly ssh console --app quotekit-staging -C "cd /app && npm run db:seed:staging"

# Alternatively, run custom seeding
fly ssh console --app quotekit-staging -C "cd /app && node scripts/seed-staging-data.js"
```

## Step 7: Health Checks and Monitoring

### 7.1 Configure Application Health Checks
The health checks are configured in `fly-staging.toml`, but you can verify them:

```bash
# Test health endpoint
curl https://quotekit-staging.fly.dev/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-01-16T12:00:00.000Z",
  "environment": "staging",
  "database": "connected",
  "services": {
    "supabase": "healthy",
    "stripe": "healthy", 
    "resend": "healthy",
    "posthog": "healthy"
  }
}
```

### 7.2 Set Up Monitoring Alerts
```bash
# Configure basic monitoring (optional)
fly monitor --app quotekit-staging

# Set up log aggregation
fly logs --app quotekit-staging --output logs/staging.log
```

## Step 8: CI/CD Pipeline Setup

### 8.1 GitHub Secrets Configuration
Add the following secrets to your GitHub repository:

1. Go to GitHub Repository → Settings → Secrets and Variables → Actions
2. Add repository secrets:
   - `FLY_API_TOKEN`: Your Fly.io deploy token
   - `SUPABASE_PROJECT_REF_STAGING`: Staging project reference
   - `SUPABASE_ACCESS_TOKEN`: Supabase access token

### 8.2 GitHub Actions Workflow
The workflow file `fly-pr-preview.yml` handles automatic deployments.

### 8.3 Test CI/CD Pipeline
```bash
# Create test branch and PR
git checkout -b test-staging-deployment
git commit --allow-empty -m "test: trigger staging deployment"
git push origin test-staging-deployment

# Create PR via GitHub UI or CLI
gh pr create --title "Test Staging Deployment" --body "Testing automated staging deployment"
```

## Step 9: Testing and Validation

### 9.1 Application Testing Checklist
- [ ] Home page loads correctly
- [ ] User registration/login works
- [ ] Quote generation functionality
- [ ] Payment processing (test mode)
- [ ] Email notifications sent
- [ ] Analytics events tracked

### 9.2 Integration Testing
```bash
# Run test suite against staging
npm run test:staging

# Run integration tests
npm run test:integration:staging

# Performance testing
npm run test:performance:staging
```

### 9.3 Manual Testing Scenarios
1. **User Journey Testing**:
   - Register new user
   - Verify email confirmation
   - Create and customize quote
   - Process payment (test card)
   - Download PDF quote

2. **Error Handling Testing**:
   - Test failed payments
   - Test invalid inputs
   - Test network interruptions
   - Test session expiration

## Step 10: Post-Deployment Optimization

### 10.1 Performance Optimization
```bash
# Monitor performance metrics
fly metrics --app quotekit-staging

# Optimize if needed
fly scale vm shared-cpu-2x --app quotekit-staging  # If performance issues
fly scale memory 512mb --app quotekit-staging      # If memory issues
```

### 10.2 Cost Optimization
```bash
# Enable auto-stop for cost savings
fly config set auto_stop_machines=stop --app quotekit-staging

# Monitor costs
fly billing show
```

### 10.3 Maintenance Automation
```bash
# Set up automated backups
fly postgres backup quotekit-staging-db

# Schedule regular maintenance
# (Add to cron job or GitHub Actions schedule)
```

## Troubleshooting Common Issues

### Deployment Failures
```bash
# Check build logs
fly logs --app quotekit-staging

# Debug locally
fly deploy --build-only --app quotekit-staging

# SSH into instance for debugging
fly ssh console --app quotekit-staging
```

### Database Connection Issues
```bash
# Test database connectivity
fly ssh console --app quotekit-staging -C "pg_isready -h $DATABASE_HOST -p $DATABASE_PORT"

# Check connection pool
fly ssh console --app quotekit-staging -C "netstat -an | grep 5432"
```

### Environment Variable Issues
```bash
# List all environment variables
fly ssh console --app quotekit-staging -C "env | sort"

# Test specific variables
fly ssh console --app quotekit-staging -C "echo \$NEXT_PUBLIC_SUPABASE_URL"
```

### Service Integration Issues
```bash
# Test Supabase connection
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -H "apikey: $SUPABASE_ANON_KEY" \
     "https://YOUR_PROJECT.supabase.co/rest/v1/"

# Test Stripe connection  
curl -u sk_test_YOUR_KEY: https://api.stripe.com/v1/charges

# Test Resend API
curl -X POST 'https://api.resend.com/emails/test' \
     -H 'Authorization: Bearer re_YOUR_KEY'
```

## Security Checklist

### Application Security
- [ ] All secrets stored in Fly.io secrets (not environment variables)
- [ ] HTTPS enforced for all connections
- [ ] Security headers configured
- [ ] Database access restricted
- [ ] API endpoints protected

### Access Control
- [ ] Staging environment access restricted to team
- [ ] Production secrets isolated from staging
- [ ] Database permissions properly configured
- [ ] Service accounts use minimal required permissions

## Maintenance Procedures

### Regular Maintenance Tasks
1. **Weekly**: Review logs and performance metrics
2. **Bi-weekly**: Update dependencies and security patches
3. **Monthly**: Review costs and optimize resources
4. **Quarterly**: Full security audit and penetration testing

### Backup and Recovery
```bash
# Manual database backup
fly postgres backup quotekit-staging-db

# Restore from backup (if needed)
fly postgres restore quotekit-staging-db --from-backup backup_id
```

This completes the comprehensive setup guide for the QuoteKit Fly.io staging environment. Follow each step carefully and validate at each stage to ensure a successful deployment.