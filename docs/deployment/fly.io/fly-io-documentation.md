# Fly.io Documentation for QuoteKit Deployment

## Overview
Comprehensive Fly.io documentation extracted for QuoteKit's pre-release test environment deployment planning.

## Key Deployment Concepts

### 1. Application Launch & Configuration
- `fly launch` - Interactive setup with region selection, database provisioning
- `fly.toml` - Main configuration file for app settings
- Environment-specific configs: `fly.staging.toml`, `fly.production.toml`

### 2. Next.js Deployment Specifics
- Automatic Next.js detection and optimization
- Built-in support for static file serving
- Edge runtime compatibility
- Environment variable management

### 3. Database Integration
- PostgreSQL clusters with `fly pg create`
- SQLite with persistent volumes
- Database URL configuration via secrets
- Automated migrations with release commands

### 4. Environment Management
```toml
[env]
  DATABASE_URL = "postgres://..."
  NODE_OPTIONS = "--max-old-space-size=4096"
  
[deploy]
  release_command = "npx prisma migrate deploy"
```

### 5. Volume Management for Persistence
```toml
[mounts]
  source = "data"
  destination = "/data"
  auto_extend_size_threshold = 80
  auto_extend_size_increment = "1GB"
  auto_extend_size_limit = "10GB"
```

## Staging Environment Setup

### GitHub Actions Integration
```yaml
name: Deploy Review App
on:
  pull_request:
    types: [opened, reopened, synchronize, closed]

env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
  FLY_REGION: iad
  FLY_ORG: personal

jobs:
  review_app:
    runs-on: ubuntu-latest
    concurrency:
      group: pr-${{ github.event.number }}
    environment:
      name: review
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/fly-pr-review-apps@1.2.1
        with:
          config: staging/fly_staging.toml
          postgres: pg-staging-preview
          region: iad
          org: personal
```

### Staging Configuration Structure
```
staging/
├── fly_staging.toml        # Staging-specific config
├── post_deploy.sh         # Post-deployment scripts
└── test_fixtures.json     # Test data
```

### Database Setup for Staging
```bash
# Create dedicated staging Postgres cluster
fly postgres create --name quotekit-staging-db

# Configure staging environment variables
fly secrets set DATABASE_URL="postgres://..." --config staging/fly_staging.toml
```

## Security & Access Control

### API Token Management
```bash
# Generate organization-specific token
fly tokens org <ORG_NAME>

# Create deploy-only token
fly tokens create deploy
```

### Environment Variables & Secrets
```bash
# Set sensitive data as secrets
fly secrets set STRIPE_SECRET_KEY=sk_test_...
fly secrets set RESEND_API_KEY=re_...
fly secrets set SUPABASE_SERVICE_ROLE_KEY=...

# View current environment
fly config env
```

## Deployment Commands

### Basic Deployment
```bash
# Deploy with default config
fly deploy

# Deploy with specific config
fly deploy --config fly.staging.toml

# Deploy specific build target
fly deploy --build-target staging
```

### Advanced Deployment Options
```bash
# Deploy with environment variables
fly deploy -e NODE_ENV=staging -e DEBUG=true

# Deploy with file overrides
fly deploy --file-local="/app/config.json=/local/staging-config.json"

# Deploy without health checks (faster)
fly deploy --no-health-checks
```

## Monitoring & Debugging

### Application Logs
```bash
# View real-time logs
fly logs

# Filter by specific instance
fly logs -i <instance-id>

# Export logs to file
fly logs --output logs.txt
```

### SSH Access
```bash
# Connect to running instance
fly ssh console

# Run specific commands
fly ssh console -C "npm run db:status"
fly ssh console -C "printenv"
```

### Health Checks
```toml
[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.http_checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/api/health"
    timeout = "5s"
```

## Cost Optimization

### Resource Configuration
```toml
# Minimal staging resources
[[vm]]
  size = 'shared-cpu-1x'  # ~$1.94/month
  memory = '256mb'

# Auto-stop for cost savings
[deploy]
  auto_stop = "stop"  # Stop after inactivity
```

### Volume Management
```bash
# Create small volumes for staging
fly volumes create staging_data --region iad --size 1  # 1GB
```

## Integration Points for QuoteKit

### 1. Stripe Integration
- Webhook endpoint configuration
- Test vs live API key management
- Payment processing verification

### 2. Supabase Integration
- Edge Functions deployment
- Database connection pooling
- Real-time subscriptions

### 3. Resend Email Service
- SMTP configuration
- Email template testing
- Delivery monitoring

### 4. PostHog Analytics
- Event tracking configuration
- Feature flag management
- A/B testing setup

## Multi-Environment Strategy

### Production Readiness Checklist
- [ ] Separate organizations for staging/production
- [ ] Dedicated database clusters
- [ ] SSL certificate configuration
- [ ] Custom domain setup (lawnquote.online)
- [ ] Backup and disaster recovery
- [ ] Performance monitoring
- [ ] Security scanning

### Scaling Considerations
- Horizontal scaling with multiple regions
- Database read replicas
- CDN integration
- Load balancing strategies

## Best Practices

1. **Configuration Management**
   - Use environment-specific `fly.toml` files
   - Store secrets in Fly.io secrets, not environment variables
   - Version control configuration files

2. **Database Management**
   - Use dedicated clusters for each environment
   - Implement proper backup strategies
   - Monitor connection pooling

3. **Deployment Safety**
   - Implement health checks
   - Use staged rollouts
   - Monitor deployment metrics
   - Have rollback procedures ready

4. **Cost Management**
   - Use auto-stop for staging environments
   - Right-size resources based on usage
   - Monitor billing alerts

## Troubleshooting Common Issues

### Build Failures
```bash
# Check build logs
fly logs --image

# Build locally for debugging
fly deploy --build-only
```

### Connection Issues
```bash
# Check app status
fly status

# Verify network connectivity
fly ping

# Check DNS resolution
fly dig <domain>
```

### Performance Issues
```bash
# Monitor resource usage
fly metrics

# Scale resources
fly scale vm shared-cpu-2x
fly scale memory 1gb
```

This documentation provides the foundation for implementing a comprehensive Fly.io deployment strategy for QuoteKit's pre-release testing environment.