# Implementation Guide - Account-Stripe Integration

## Development Standards and Guidelines

This document provides comprehensive implementation guidelines for the Account-Stripe Integration epic, ensuring consistent code quality, security practices, and maintainability.

---

## Code Organization Structure

### Directory Structure
```
src/
├── features/
│   ├── account/
│   │   ├── api/
│   │   │   ├── subscription-service.ts
│   │   │   ├── pricing-service.ts
│   │   │   └── customer-service.ts
│   │   ├── components/
│   │   │   ├── subscription-management/
│   │   │   ├── payment-methods/
│   │   │   └── billing-history/
│   │   ├── hooks/
│   │   │   ├── useSubscription.ts
│   │   │   ├── usePricingPlans.ts
│   │   │   └── usePaymentMethods.ts
│   │   └── types/
│   │       └── subscription.types.ts
│   └── admin/
│       ├── customer-management/
│       │   ├── components/
│       │   ├── services/
│       │   └── types/
│       └── analytics/
├── app/
│   ├── api/
│   │   ├── subscriptions/
│   │   ├── pricing/
│   │   └── admin/
│   ├── (account)/
│   │   ├── subscription/
│   │   └── billing/
│   └── (admin)/
│       ├── customers/
│       └── analytics/
└── libs/
    ├── stripe/
    │   ├── stripe-admin.ts
    │   ├── stripe-client.ts
    │   └── webhook-processor.ts
    └── database/
        ├── repositories/
        └── migrations/
```

---

## Coding Standards

### TypeScript Standards

#### Interface Definitions
```typescript
// Use descriptive, domain-specific interface names
interface SubscriptionDetails {
  id: string
  userId: string
  stripeSubscriptionId: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  priceId: string
  price: PriceDetails
  customer: CustomerDetails
}

// Use enums for fixed sets of values
enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  TRIALING = 'trialing'
}
```

#### Error Handling Patterns
```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Service method example
export class SubscriptionService {
  async updateSubscription(id: string, changes: SubscriptionChanges): Promise<Result<Subscription>> {
    try {
      const subscription = await this.stripeClient.subscriptions.update(id, changes)
      await this.repository.update(subscription)
      
      return { success: true, data: this.mapToSubscription(subscription) }
    } catch (error) {
      this.logger.error('Failed to update subscription', { id, error })
      return { 
        success: false, 
        error: new SubscriptionUpdateError('Failed to update subscription', error) 
      }
    }
  }
}
```

#### Validation with Zod
```typescript
import { z } from 'zod'

// Input validation schemas
export const createCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Valid success URL required'),
  cancelUrl: z.string().url('Valid cancel URL required'),
  customerId: z.string().optional(),
  metadata: z.record(z.string()).optional()
})

export type CreateCheckoutRequest = z.infer<typeof createCheckoutSchema>

// API route validation
export async function POST(request: Request) {
  const body = await request.json()
  const validation = createCheckoutSchema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.format() },
      { status: 400 }
    )
  }
  
  // Process validated data
  const result = await subscriptionService.createCheckout(validation.data)
  // ...
}
```

### React Component Standards

#### Component Structure
```typescript
// Use consistent component structure
interface SubscriptionManagementProps {
  userId: string
  initialSubscription?: Subscription
  onSubscriptionChange?: (subscription: Subscription) => void
}

export function SubscriptionManagement({ 
  userId, 
  initialSubscription,
  onSubscriptionChange 
}: SubscriptionManagementProps) {
  // Hooks first
  const { subscription, isLoading, error } = useSubscription(userId, initialSubscription)
  const { updateSubscription, isUpdating } = useUpdateSubscription()
  
  // Event handlers
  const handlePlanChange = useCallback(async (newPriceId: string) => {
    const result = await updateSubscription(subscription.id, { priceId: newPriceId })
    if (result.success) {
      onSubscriptionChange?.(result.data)
    }
  }, [subscription?.id, updateSubscription, onSubscriptionChange])
  
  // Render logic
  if (isLoading) return <SubscriptionSkeleton />
  if (error) return <ErrorDisplay error={error} />
  if (!subscription) return <NoSubscriptionState />
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent>
        <CurrentPlanDisplay subscription={subscription} />
        <AvailablePlans 
          currentPriceId={subscription.priceId}
          onPlanSelect={handlePlanChange}
          disabled={isUpdating}
        />
      </CardContent>
    </Card>
  )
}
```

#### Custom Hooks Pattern
```typescript
// Custom hooks for data management
export function useSubscription(userId: string, initialData?: Subscription) {
  const [subscription, setSubscription] = useState<Subscription | null>(initialData ?? null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    if (!userId || initialData) return
    
    const fetchSubscription = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/subscriptions/current?userId=${userId}`)
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch subscription')
        }
        
        setSubscription(result.data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSubscription()
  }, [userId, initialData])
  
  return { subscription, isLoading, error }
}
```

---

## Security Implementation Guidelines

### API Security
```typescript
// Authentication middleware
export async function requireAuth(request: Request) {
  const session = await getSession(request)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  return session
}

// Admin authorization
export async function requireAdmin(request: Request) {
  const session = await requireAuth(request)
  if (session instanceof Response) return session
  
  if (!session.user.role?.includes('admin')) {
    return new Response('Forbidden', { status: 403 })
  }
  return session
}

// Rate limiting
const rateLimiter = new Map()

export async function checkRateLimit(identifier: string, limit: number = 10) {
  const now = Date.now()
  const windowStart = now - (60 * 1000) // 1 minute window
  
  const requests = rateLimiter.get(identifier) || []
  const recentRequests = requests.filter((time: number) => time > windowStart)
  
  if (recentRequests.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  recentRequests.push(now)
  rateLimiter.set(identifier, recentRequests)
}
```

### Webhook Security
```typescript
// Webhook signature verification
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Use Stripe's built-in verification
    const event = stripe.webhooks.constructEvent(payload, signature, secret)
    return true
  } catch (error) {
    logger.error('Webhook signature verification failed', { error })
    return false
  }
}

// Idempotency handling
const processedEvents = new Set<string>()

export async function ensureIdempotent(eventId: string): Promise<boolean> {
  if (processedEvents.has(eventId)) {
    logger.info('Duplicate webhook event ignored', { eventId })
    return false
  }
  
  // Check database for processed events
  const existing = await database.webhookEvents.findByStripeId(eventId)
  if (existing && existing.status === 'processed') {
    return false
  }
  
  processedEvents.add(eventId)
  return true
}
```

### Data Protection
```typescript
// Sensitive data handling
export function sanitizeCustomerData(customer: RawCustomerData): PublicCustomerData {
  return {
    id: customer.id,
    email: maskEmail(customer.email),
    name: customer.name,
    subscriptionStatus: customer.subscriptionStatus,
    // Never expose: payment methods, billing details, etc.
  }
}

function maskEmail(email: string): string {
  const [username, domain] = email.split('@')
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2)
  return `${maskedUsername}@${domain}`
}

// Audit logging
export async function logSubscriptionChange(
  userId: string,
  action: string,
  oldValue: any,
  newValue: any,
  performedBy: string
) {
  await database.auditLogs.create({
    userId,
    action,
    oldValue: JSON.stringify(oldValue),
    newValue: JSON.stringify(newValue),
    performedBy,
    timestamp: new Date(),
    ipAddress: await getClientIP()
  })
}
```

---

## Database Integration Patterns

### Repository Pattern Implementation
```typescript
// Base repository interface
export interface IRepository<T, K = string> {
  findById(id: K): Promise<T | null>
  findMany(filters?: Record<string, any>): Promise<T[]>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: K, data: Partial<T>): Promise<T>
  delete(id: K): Promise<boolean>
}

// Subscription repository implementation
export class SupabaseSubscriptionRepository implements IRepository<Subscription> {
  constructor(private supabase: SupabaseClient) {}
  
  async findById(id: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select(`
        *,
        prices:price_id (
          *,
          products:product_id (*)
        ),
        customers:customer_id (*)
      `)
      .eq('id', id)
      .maybeSingle()
    
    if (error) {
      throw new DatabaseError('Failed to fetch subscription', error)
    }
    
    return data ? this.mapToSubscription(data) : null
  }
  
  private mapToSubscription(data: any): Subscription {
    return {
      id: data.id,
      userId: data.user_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      status: data.status as SubscriptionStatus,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      price: this.mapToPrice(data.prices),
      customer: this.mapToCustomer(data.customers),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}
```

### Migration Strategies
```typescript
// Database migration runner
export class MigrationRunner {
  constructor(private supabase: SupabaseClient) {}
  
  async runMigrations() {
    const migrations = [
      new EnhanceSubscriptionsTable(),
      new AddCustomerManagementTable(),
      new AddWebhookAuditTable(),
      new AddSubscriptionEventsTable()
    ]
    
    for (const migration of migrations) {
      try {
        await migration.up(this.supabase)
        await this.recordMigration(migration.name)
        logger.info(`Migration completed: ${migration.name}`)
      } catch (error) {
        logger.error(`Migration failed: ${migration.name}`, error)
        throw error
      }
    }
  }
  
  private async recordMigration(name: string) {
    await this.supabase
      .from('schema_migrations')
      .insert({ name, applied_at: new Date() })
  }
}

// Individual migration example
export class EnhanceSubscriptionsTable implements Migration {
  name = '2025_01_25_001_enhance_subscriptions'
  
  async up(supabase: SupabaseClient) {
    const { error } = await supabase.rpc('enhance_subscriptions_table')
    if (error) throw error
  }
  
  async down(supabase: SupabaseClient) {
    // Rollback logic if needed
  }
}
```

---

## Testing Implementation Guidelines

### Unit Testing Standards
```typescript
// Service testing with mocks
describe('SubscriptionService', () => {
  let service: SubscriptionService
  let mockStripe: jest.Mocked<Stripe>
  let mockRepository: jest.Mocked<ISubscriptionRepository>
  let mockLogger: jest.Mocked<Logger>
  
  beforeEach(() => {
    mockStripe = {
      subscriptions: {
        create: jest.fn(),
        update: jest.fn(),
        retrieve: jest.fn(),
        cancel: jest.fn()
      }
    } as any
    
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    } as any
    
    service = new SubscriptionService(mockStripe, mockRepository, mockLogger)
  })
  
  describe('updateSubscription', () => {
    it('should successfully update subscription', async () => {
      // Arrange
      const subscriptionId = 'sub_123'
      const changes = { priceId: 'price_456' }
      const mockStripeSubscription = { id: subscriptionId, status: 'active' }
      const mockDbSubscription = { id: subscriptionId, status: 'active' }
      
      mockStripe.subscriptions.update.mockResolvedValue(mockStripeSubscription as any)
      mockRepository.update.mockResolvedValue(mockDbSubscription as any)
      
      // Act
      const result = await service.updateSubscription(subscriptionId, changes)
      
      // Assert
      expect(result.success).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(subscriptionId, changes)
      expect(mockRepository.update).toHaveBeenCalled()
    })
    
    it('should handle Stripe API errors gracefully', async () => {
      // Arrange
      const subscriptionId = 'sub_123'
      const changes = { priceId: 'invalid_price' }
      const stripeError = new Error('Invalid price ID')
      
      mockStripe.subscriptions.update.mockRejectedValue(stripeError)
      
      // Act
      const result = await service.updateSubscription(subscriptionId, changes)
      
      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(SubscriptionUpdateError)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update subscription',
        { id: subscriptionId, error: stripeError }
      )
    })
  })
})
```

### Integration Testing
```typescript
// API route testing
describe('/api/subscriptions/current', () => {
  beforeEach(async () => {
    await setupTestDatabase()
    await seedTestData()
  })
  
  afterEach(async () => {
    await cleanupTestDatabase()
  })
  
  it('should return current subscription for authenticated user', async () => {
    // Arrange
    const user = await createTestUser()
    const subscription = await createTestSubscription(user.id)
    const session = await createTestSession(user)
    
    // Act
    const response = await request(app)
      .get('/api/subscriptions/current')
      .set('Cookie', `session=${session.id}`)
      .expect(200)
    
    // Assert
    expect(response.body.data.id).toBe(subscription.id)
    expect(response.body.data.status).toBe('active')
  })
  
  it('should return 401 for unauthenticated requests', async () => {
    await request(app)
      .get('/api/subscriptions/current')
      .expect(401)
  })
})
```

### E2E Testing Framework
```typescript
// Playwright E2E tests
import { test, expect } from '@playwright/test'

test.describe('Subscription Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupE2EEnvironment()
    await page.goto('/account/subscription')
  })
  
  test('user can upgrade subscription plan', async ({ page }) => {
    // Arrange - Login and navigate
    await login(page, 'test@example.com', 'password')
    await page.goto('/pricing')
    
    // Act - Select plan and complete checkout
    await page.click('[data-testid="pro-plan-button"]')
    await page.fill('[data-testid="checkout-email"]', 'test@example.com')
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')
    await page.click('[data-testid="confirm-payment"]')
    
    // Assert - Verify subscription upgrade
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await page.goto('/account/subscription')
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro Plan')
  })
})
```

---

## Performance Optimization Guidelines

### Caching Strategies
```typescript
// Redis caching implementation
export class CacheService {
  constructor(private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}

// Usage in services
export class PricingService {
  constructor(
    private stripeClient: Stripe,
    private cache: CacheService
  ) {}
  
  async getActivePrices(): Promise<PriceWithProduct[]> {
    const cacheKey = 'pricing:active-prices'
    const cached = await this.cache.get<PriceWithProduct[]>(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const prices = await this.fetchActivePricesFromStripe()
    await this.cache.set(cacheKey, prices, 900) // 15 minutes
    
    return prices
  }
}
```

### Database Optimization
```typescript
// Query optimization patterns
export class OptimizedSubscriptionRepository {
  async findSubscriptionsWithAnalytics(
    filters: SubscriptionFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<SubscriptionWithAnalytics>> {
    const query = this.supabase
      .from('subscriptions_with_analytics') // Use materialized view
      .select(`
        id,
        user_id,
        status,
        current_period_start,
        current_period_end,
        monthly_revenue,
        lifetime_value,
        churn_risk_score
      `)
    
    // Apply filters efficiently
    if (filters.status) {
      query.in('status', filters.status)
    }
    
    if (filters.dateRange) {
      query.gte('current_period_start', filters.dateRange.start)
      query.lte('current_period_end', filters.dateRange.end)
    }
    
    // Use cursor-based pagination for large datasets
    if (pagination.cursor) {
      query.gt('id', pagination.cursor)
    }
    
    const { data, error, count } = await query
      .order('id', { ascending: true })
      .limit(pagination.limit)
    
    if (error) throw new DatabaseError('Query failed', error)
    
    const nextCursor = data.length === pagination.limit 
      ? data[data.length - 1].id 
      : null
    
    return {
      data,
      pagination: {
        cursor: nextCursor,
        hasMore: nextCursor !== null,
        total: count
      }
    }
  }
}
```

---

## Error Handling and Monitoring

### Structured Error Handling
```typescript
// Custom error classes
export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public cause?: Error
  ) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

export class StripeApiError extends SubscriptionError {
  constructor(message: string, public stripeError: Stripe.StripeError) {
    super(message, 'STRIPE_API_ERROR', 502, stripeError)
  }
}

// Global error handler
export function handleApiError(error: Error): Response {
  if (error instanceof SubscriptionError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: error.statusCode }
    )
  }
  
  // Log unexpected errors
  logger.error('Unexpected API error', { error })
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### Monitoring and Alerting
```typescript
// Custom metrics collection
export class MetricsCollector {
  private static instance: MetricsCollector
  
  static getInstance(): MetricsCollector {
    if (!this.instance) {
      this.instance = new MetricsCollector()
    }
    return this.instance
  }
  
  async recordSubscriptionEvent(event: SubscriptionEvent): Promise<void> {
    // Send to PostHog
    await posthog.capture('subscription_event', {
      event_type: event.type,
      user_id: event.userId,
      subscription_id: event.subscriptionId,
      plan_id: event.planId,
      revenue_change: event.revenueChange
    })
    
    // Send to monitoring service
    await monitoring.gauge('subscription.active_count', await this.getActiveSubscriptionCount())
    await monitoring.increment('subscription.events', 1, {
      event_type: event.type,
      plan_id: event.planId
    })
  }
  
  async recordApiCall(endpoint: string, duration: number, success: boolean): Promise<void> {
    await monitoring.histogram('api.request_duration', duration, {
      endpoint,
      success: success.toString()
    })
  }
}

// Usage in API routes
export async function POST(request: Request) {
  const startTime = Date.now()
  const metrics = MetricsCollector.getInstance()
  
  try {
    // Process request
    const result = await processSubscriptionUpdate(request)
    
    await metrics.recordApiCall('/api/subscriptions/update', Date.now() - startTime, true)
    return NextResponse.json(result)
  } catch (error) {
    await metrics.recordApiCall('/api/subscriptions/update', Date.now() - startTime, false)
    throw error
  }
}
```

---

## Deployment Guidelines

### Environment Configuration
```typescript
// Environment validation
const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  POSTHOG_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'staging', 'production'])
})

export const env = envSchema.parse(process.env)

// Feature flags
export const featureFlags = {
  ENHANCED_WEBHOOKS: env.NODE_ENV === 'production' || process.env.ENABLE_ENHANCED_WEBHOOKS === 'true',
  ADMIN_CUSTOMER_MANAGEMENT: process.env.ENABLE_ADMIN_FEATURES === 'true',
  SUBSCRIPTION_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true'
}
```

### Deployment Checklist
- [x] Environment variables configured ✅ **P2 Complete**
- [x] Database migrations applied ✅ **P2 Complete**
- [x] Feature flags set appropriately ✅ **P2 Complete**
- [ ] Monitoring and alerting configured - *Pending P3*
- [x] SSL certificates valid ✅ **P2 Complete**
- [x] Webhook endpoints accessible ✅ **P2 Complete**
- [x] Stripe webhook signatures verified ✅ **P2 Complete**
- [ ] Performance monitoring enabled - *Pending P3*
- [ ] Error tracking configured - *Pending P3*
- [ ] Backup and recovery tested - *Pending P3*

### ✅ **P2 Implementation Status (2025-01-26)**

#### **Build Verification**
- **TypeScript Compilation**: ✅ 100% error-free 
- **Next.js Build**: ✅ Successfully generated 28 pages
- **Bundle Optimization**: ✅ Largest route 650kb (within acceptable limits)
- **Code Quality**: ✅ ESLint passing, enhanced type safety

#### **Technical Debt Resolution**
- **Systematic Error Fixing**: Applied typescript-error-fixer agent
- **Pattern-Based Corrections**: Fixed nullable access patterns across codebase
- **Database Type Safety**: Enhanced null handling for DB responses
- **Library Compatibility**: Resolved React/PDF integration issues

#### **Deployment Readiness**
- **Build Process**: ✅ Stable and reproducible
- **Type Safety**: ✅ Enhanced without breaking changes
- **Performance**: ✅ No impact on bundle size or build times
- **Code Quality**: ✅ Maintained high standards throughout

---

**Document Version**: 1.1  
**Last Updated**: 2025-01-26  
**Next Review**: Before P3 implementation begins  
**Document Owner**: Technical Lead  
**P2 Implementation**: ✅ Complete with Build Verification

---

## Related Documents
- [Technical Architecture](./technical-architecture.md)
- [Sprint Breakdown](./sprint-breakdown.md)
- [API Specifications](./api-specs.md) *(Next)*
- [Testing Strategy](./testing-strategy.md) *(Pending)*