# QuoteKit Fly.io Technical Specifications

## Overview

This document provides detailed technical requirements for deploying QuoteKit on Fly.io, addressing all gaps identified in the system alignment analysis and incorporating Next.js and PostHog best practices for production deployment.

---

## System Architecture

### Application Profile
- **Framework**: Next.js 15.1.4 with App Router
- **Runtime**: Node.js (latest LTS)
- **Package Manager**: Bun 1.2.17
- **API Routes**: 59 endpoints requiring optimized resource allocation
- **External Integrations**: Supabase, Stripe, PostHog, Resend
- **Deployment Target**: Fly.io staging environment

### Resource Requirements
- **Base Memory**: 512MB (minimum for 59 API routes)
- **Recommended Memory**: 1GB (for production workloads)
- **CPU**: 1 shared CPU minimum
- **Storage**: 1GB for application + logs
- **Network**: HTTPS with HTTP/2 support

---

## Environment Variables Catalog

### Core Application Configuration

```bash
# Environment
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SITE_URL=https://quotekit-staging.fly.dev

# Build Configuration
ANALYZE=false
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
```

### Supabase Configuration

```bash
# Supabase Core
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_PASSWORD=[DB_PASSWORD]
SUPABASE_PROJECT_ID=[PROJECT_REF]

# Supabase Edge Functions (if used)
SUPABASE_EDGE_FUNCTION_URL=https://[PROJECT_REF].functions.supabase.co
```

### Stripe Configuration

```bash
# Stripe Core
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_...
STRIPE_SECRET_KEY=sk_live_... # or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Configuration
STRIPE_API_VERSION=2023-10-16
```

### PostHog Analytics Configuration

```bash
# PostHog Client-Side
NEXT_PUBLIC_POSTHOG_KEY=phc_[PROJECT_KEY]
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# PostHog Server-Side
POSTHOG_PROJECT_API_KEY=[PROJECT_API_KEY]
POSTHOG_PERSONAL_API_KEY=[PERSONAL_API_KEY]

# PostHog Configuration
POSTHOG_CAPTURE_MODE=server
POSTHOG_DISABLE_COMPRESSION=false
POSTHOG_FEATURE_FLAGS_POLL_INTERVAL=30000
```

### Email Configuration

```bash
# Resend
RESEND_API_KEY=re_[API_KEY]

# Email Configuration
FROM_EMAIL=noreply@quotekit.com
SUPPORT_EMAIL=support@quotekit.com
```

### Monitoring and Logging

```bash
# Application Monitoring
ENABLE_METRICS=true
METRICS_ENDPOINT=/api/metrics
HEALTH_CHECK_ENDPOINT=/api/health

# Logging
LOG_FORMAT=json
LOG_TIMESTAMP=true
CONSOLE_LOG_LEVEL=info

# Performance
ENABLE_PROFILING=false # Enable only for debugging
MAX_REQUEST_TIMEOUT=30000
```

### Security Configuration

```bash
# Security Headers
ENABLE_CSP=true
ENABLE_HSTS=true
CSP_REPORT_URI=/api/csp-report

# CORS Configuration
ALLOWED_ORIGINS=https://quotekit-staging.fly.dev
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## API Endpoint Specifications

### Health Check Endpoint: `/api/health`

**Method**: GET  
**Purpose**: System health monitoring for Fly.io health checks  
**Response Time**: < 100ms  
**Timeout**: 5 seconds  

#### Response Schema
```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string; // ISO 8601
  version: string;   // Application version
  environment: string; // NODE_ENV
  uptime: number;    // Process uptime in seconds
  checks: {
    database: 'healthy' | 'unhealthy';
    stripe: 'healthy' | 'unhealthy';
    supabase: 'healthy' | 'unhealthy';
    memory: 'healthy' | 'degraded' | 'critical';
    disk: 'healthy' | 'degraded' | 'critical';
  };
  metrics?: {
    memoryUsage: number; // MB
    cpuUsage: number;    // Percentage
    activeConnections: number;
    responseTime: number; // ms
  };
}
```

#### Health Check Logic
```typescript
// Database Check
try {
  await supabase.from('health_check').select('1').limit(1);
  checks.database = 'healthy';
} catch {
  checks.database = 'unhealthy';
}

// Memory Check
const memUsage = process.memoryUsage();
const memPercent = (memUsage.heapUsed / (512 * 1024 * 1024)) * 100;
if (memPercent > 90) checks.memory = 'critical';
else if (memPercent > 75) checks.memory = 'degraded';
else checks.memory = 'healthy';

// Overall Status
if (checks.database === 'unhealthy') status = 'unhealthy';
else if (checks.memory === 'critical') status = 'unhealthy';
else if (checks.memory === 'degraded') status = 'degraded';
else status = 'healthy';
```

### Metrics Endpoint: `/api/metrics`

**Method**: GET  
**Purpose**: Application metrics for monitoring  
**Authentication**: API key required  
**Rate Limit**: 10 requests/minute  

#### Response Schema
```typescript
interface MetricsResponse {
  timestamp: string;
  application: {
    version: string;
    uptime: number;
    environment: string;
  };
  performance: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    activeUsers: number;
  };
  resources: {
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: number;
    diskUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  database: {
    connectionCount: number;
    avgQueryTime: number;
    slowQueries: number;
  };
  errors: {
    total: number;
    by_type: Record<string, number>;
    recent: string[];
  };
}
```

---

## Fly.io Configuration Requirements

### Application Configuration

```toml
# fly.toml
app = 'quotekit-staging'
primary_region = 'ord' # Chicago - optimal for US coverage

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"
  BLINK_DATABASE_PATH = "/app/.blink"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 3
  processes = ["app"]

  # Health Check Configuration
  [http_service.checks]
    method = "GET"
    path = "/api/health"
    interval = "30s"
    timeout = "5s"
    grace_period = "10s"
    restart_limit = 3
    headers = { "User-Agent" = "fly-health-check" }

  # HTTP Request Configuration
  [[http_service.http_options]]
    h2_backend = true
    response.headers = { "fly-request-id" = "add" }

# Virtual Machine Configuration
[[vm]]
  memory = '512mb'  # Minimum for 59 API routes
  cpu_kind = 'shared'
  cpus = 1

[deploy]
  release_command = "npm run build"
  kill_timeout = "30s"
  
[processes]
  app = "npm start"

# Persistent Volume (if needed)
[[mounts]]
  destination = "/app/data"
  source = "quotekit_data"
  size_gb = 1
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install bun
RUN npm install -g bun@1.2.17

# Copy package files
COPY package.json bun.lockb ./
COPY package-lock.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build application
RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start application
CMD ["node", "server.js"]
```

---

## Memory and CPU Specifications

### Memory Allocation Strategy

#### Minimum Configuration (512MB)
- **Heap Size**: ~350MB
- **Buffer for OS**: ~50MB
- **Application overhead**: ~100MB
- **Safety margin**: ~12MB

#### Recommended Configuration (1GB)
- **Heap Size**: ~700MB
- **Buffer for OS**: ~100MB
- **Application overhead**: ~150MB
- **Safety margin**: ~50MB

#### Memory Monitoring Thresholds
```typescript
const MEMORY_THRESHOLDS = {
  WARNING: 75,    // 75% of allocated memory
  CRITICAL: 90,   // 90% of allocated memory
  RESTART: 95     // Auto-restart at 95%
};
```

### CPU Specifications

#### Shared CPU (Recommended for Staging)
- **Type**: Shared CPU
- **Count**: 1 CPU
- **Performance**: Sufficient for staging workloads
- **Cost**: Most economical option

#### Dedicated CPU (Production Alternative)
- **Type**: Performance CPU
- **Count**: 1-2 CPUs
- **Performance**: Consistent performance
- **Cost**: Higher, justified for production

### Performance Targets

```typescript
const PERFORMANCE_TARGETS = {
  API_RESPONSE_TIME: {
    P50: 100,  // 50th percentile: 100ms
    P95: 200,  // 95th percentile: 200ms
    P99: 500   // 99th percentile: 500ms
  },
  HEALTH_CHECK_RESPONSE: {
    TARGET: 50,    // Target: 50ms
    MAXIMUM: 100   // Maximum: 100ms
  },
  APPLICATION_STARTUP: {
    TARGET: 20,    // Target: 20 seconds
    MAXIMUM: 30    // Maximum: 30 seconds
  },
  MEMORY_EFFICIENCY: {
    BASELINE: 60,  // Baseline: 60% utilization
    MAXIMUM: 85    // Maximum: 85% utilization
  }
};
```

---

## Security Configuration

### HTTPS and TLS

```typescript
// Security headers configuration
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.posthog.com;
    style-src 'self' 'unsafe-inline';
    connect-src 'self' https://api.stripe.com https://m.stripe.network https://app.posthog.com ${process.env.NEXT_PUBLIC_SUPABASE_URL};
    img-src 'self' data: https:;
    font-src 'self' data:;
  `.replace(/\s+/g, ' ').trim()
};
```

### Environment Variable Security

```bash
# Secrets Management
FLY_SECRET_STRIPE_SECRET_KEY=sk_live_...
FLY_SECRET_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
FLY_SECRET_POSTHOG_PROJECT_API_KEY=[API_KEY]
FLY_SECRET_RESEND_API_KEY=re_[API_KEY]

# Public Variables (safe to expose)
NEXT_PUBLIC_SITE_URL=https://quotekit-staging.fly.dev
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... # Anon key is safe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # Publishable key is safe
NEXT_PUBLIC_POSTHOG_KEY=phc_[KEY] # Public key is safe
```

### API Security Middleware

```typescript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.round(rateLimitConfig.windowMs / 1000)
    });
  }
};
```

---

## Monitoring and Observability

### Application Metrics

```typescript
interface ApplicationMetrics {
  http: {
    requests_total: Counter;
    request_duration_seconds: Histogram;
    response_size_bytes: Histogram;
  };
  database: {
    connections_active: Gauge;
    query_duration_seconds: Histogram;
    queries_total: Counter;
  };
  business: {
    quotes_generated: Counter;
    users_active: Gauge;
    revenue_total: Counter;
  };
  system: {
    memory_usage_bytes: Gauge;
    cpu_usage_percent: Gauge;
    disk_usage_bytes: Gauge;
  };
}
```

### Logging Configuration

```typescript
const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  timestamp: true,
  colorize: false, // Disable colors in production
  transports: [
    {
      type: 'console',
      level: 'info'
    },
    {
      type: 'file',
      filename: '/app/logs/application.log',
      maxSize: '10m',
      maxFiles: 5,
      level: 'info'
    },
    {
      type: 'file',
      filename: '/app/logs/error.log',
      level: 'error'
    }
  ]
};
```

### Health Check Integration

```typescript
// Fly.io health check integration
export async function healthCheck(): Promise<HealthCheckResponse> {
  const startTime = Date.now();
  
  const checks = await Promise.all([
    checkDatabase(),
    checkMemory(),
    checkDisk(),
    checkExternalServices()
  ]);
  
  const responseTime = Date.now() - startTime;
  
  return {
    status: determineOverallStatus(checks),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.2.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    responseTime,
    checks: {
      database: checks[0].status,
      memory: checks[1].status,
      disk: checks[2].status,
      external: checks[3].status
    }
  };
}
```

---

## Backup and Recovery Specifications

### Backup Strategy

```yaml
# Backup Configuration
backup:
  database:
    frequency: "0 2 * * *" # Daily at 2 AM UTC
    retention: "30d"
    compression: true
    encryption: true
  
  configuration:
    frequency: "0 */6 * * *" # Every 6 hours
    retention: "7d"
    include:
      - fly.toml
      - Dockerfile
      - .env.production
  
  application_data:
    frequency: "0 4 * * *" # Daily at 4 AM UTC
    retention: "14d"
    include:
      - logs/
      - temp/
      - uploads/ # If any
```

### Recovery Procedures

```bash
# Database Recovery
supabase db reset --linked
supabase db push --linked
npm run generate-types

# Application Deployment Recovery
fly deploy --config fly.toml
fly status
fly logs

# Configuration Recovery
fly secrets import < backup/secrets.txt
fly deploy --config backup/fly.toml
```

### Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

- **RTO**: 1 hour (Maximum downtime)
- **RPO**: 15 minutes (Maximum data loss)
- **Mean Time to Recovery (MTTR)**: 15 minutes
- **Mean Time Between Failures (MTBF)**: 30 days

---

## Testing Specifications

### Performance Testing

```bash
# Load Testing Commands
artillery run performance-tests/api-load-test.yml
ab -n 1000 -c 10 https://quotekit-staging.fly.dev/api/health
wrk -t12 -c400 -d30s --timeout 10s https://quotekit-staging.fly.dev/
```

### Health Check Testing

```bash
# Health Check Validation
curl -f https://quotekit-staging.fly.dev/api/health || exit 1
curl -w "%{http_code}" -s -o /dev/null https://quotekit-staging.fly.dev/api/health

# Response Time Testing
curl -w "Response Time: %{time_total}s\n" -o /dev/null -s https://quotekit-staging.fly.dev/api/health
```

### Integration Testing

```typescript
// API Integration Tests
describe('API Integration Tests', () => {
  test('Health check endpoint returns 200', async () => {
    const response = await fetch('/api/health');
    expect(response.status).toBe(200);
    
    const health = await response.json();
    expect(health.status).toBe('healthy');
    expect(health.checks.database).toBe('healthy');
  });
  
  test('All 59 API routes respond correctly', async () => {
    const routes = await getApiRoutes();
    expect(routes).toHaveLength(59);
    
    for (const route of routes) {
      const response = await fetch(route);
      expect(response.status).toBeLessThan(500);
    }
  });
});
```

---

## Deployment Validation Checklist

### Pre-Deployment Validation

- [ ] All environment variables configured
- [ ] Health check endpoint functional
- [ ] Memory allocation optimized (512MB+)
- [ ] PostHog integration tested
- [ ] All 59 API routes tested
- [ ] Security headers configured
- [ ] SSL certificate valid
- [ ] Database connections tested

### Post-Deployment Validation

- [ ] Health checks passing (5 consecutive checks)
- [ ] Application startup < 30 seconds
- [ ] API response times < 200ms (P95)
- [ ] Memory usage < 85%
- [ ] PostHog events recording
- [ ] All external integrations functional
- [ ] Error rates < 0.1%
- [ ] Monitoring dashboards operational

### Production Readiness Certification

- [ ] 99.9% uptime achieved over 24 hours
- [ ] Performance targets met consistently
- [ ] Security scan passed
- [ ] Backup procedures validated
- [ ] Recovery procedures tested
- [ ] Documentation complete
- [ ] Team handover completed

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-10  
**Next Review**: Post-deployment analysis