# API Specifications - Edge Functions Cost Optimization

## Edge Functions API Documentation

This document provides comprehensive API specifications for all Supabase Edge Functions implementing the cost optimization strategy for QuoteKit.

---

## Base Configuration

### Authentication
All Edge Functions (except webhook-handler) require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

### Content Type
```
Content-Type: application/json
```

### Base URL Structure
```
https://<project-id>.functions.supabase.co/<function-name>
```

### Common Response Format
```typescript
interface BaseResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta: {
    requestId: string
    timestamp: string
    executionTime: number
  }
}
```

### Common Error Codes
| Code | Description | HTTP Status |
|------|-------------|-------------|
| VALIDATION_ERROR | Input validation failed | 400 |
| UNAUTHORIZED | Authentication required | 401 |
| FORBIDDEN | Insufficient permissions | 403 |
| NOT_FOUND | Resource not found | 404 |
| RATE_LIMITED | Too many requests | 429 |
| INTERNAL_ERROR | Server error | 500 |
| TIMEOUT_ERROR | Operation timed out | 504 |

---

## 1. Subscription Manager Function

### Endpoint
`POST /functions/v1/subscription-manager`

### Purpose
Consolidates subscription-related operations into a single serverless function, reducing API calls from 5-7 to 1.

### Authentication
- **Required**: JWT token
- **Permissions**: `subscription:read`, `subscription:write`

### Actions Supported

#### 1.1 Get Subscription Details

**Request**
```typescript
interface GetSubscriptionRequest {
  action: 'get-subscription'
  userId: string
  includeUsage?: boolean
  includeBilling?: boolean
}
```

**Response**
```typescript
interface GetSubscriptionResponse {
  subscription: {
    id: string
    status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
    plan: {
      id: string
      name: string
      price: number
      currency: string
      interval: 'monthly' | 'yearly'
      features: string[]
    }
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trialEnd?: string
    usage?: {
      quotesGenerated: number
      storageUsed: number
      apiCallsThisMonth: number
      limits: {
        maxQuotes: number
        maxStorage: number
        maxApiCalls: number
      }
    }
    billing?: {
      nextPaymentDate: string
      nextPaymentAmount: number
      paymentMethod: {
        type: 'card' | 'bank'
        last4: string
        brand?: string
      }
    }
  }
  customer: {
    id: string
    email: string
    name?: string
    address?: Address
  }
}
```

#### 1.2 Create Checkout Session

**Request**
```typescript
interface CreateCheckoutRequest {
  action: 'create-checkout-session'
  priceId: string
  successUrl: string
  cancelUrl: string
  customerId?: string
  discountCode?: string
  billingCycle?: 'monthly' | 'yearly'
  metadata?: Record<string, string>
}
```

**Response**
```typescript
interface CreateCheckoutResponse {
  sessionId: string
  url: string
  expiresAt: string
}
```

#### 1.3 Update Subscription

**Request**
```typescript
interface UpdateSubscriptionRequest {
  action: 'update-subscription'
  subscriptionId: string
  priceId: string
  prorationBehavior?: 'none' | 'create_prorations' | 'always_invoice'
  effectiveDate?: string
}
```

**Response**
```typescript
interface UpdateSubscriptionResponse {
  subscription: {
    id: string
    status: string
    newPlan: {
      id: string
      name: string
      price: number
    }
    prorationAmount?: number
    effectiveDate: string
  }
  invoice?: {
    id: string
    amountDue: number
    dueDate: string
  }
}
```

#### 1.4 Cancel Subscription

**Request**
```typescript
interface CancelSubscriptionRequest {
  action: 'cancel-subscription'
  subscriptionId: string
  cancelAtPeriodEnd: boolean
  reason?: string
  feedback?: string
}
```

**Response**
```typescript
interface CancelSubscriptionResponse {
  subscription: {
    id: string
    status: string
    canceledAt: string
    cancelAtPeriodEnd: boolean
    accessUntil: string
  }
  refund?: {
    amount: number
    currency: string
    refundId: string
  }
}
```

### Performance Targets
- **Response Time**: < 400ms (50% improvement from 800ms)
- **API Call Reduction**: 85% (7 calls → 1 call)
- **Cache Hit Rate**: 90% for subscription data
- **Concurrency**: 100 simultaneous requests

### Example Usage

```typescript
// Get subscription with usage details
const response = await fetch('/functions/v1/subscription-manager', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'get-subscription',
    userId: 'user_123',
    includeUsage: true,
    includeBilling: true
  })
})

const result = await response.json()
if (result.success) {
  console.log('Subscription:', result.data.subscription)
}
```

---

## 2. Quote Processor Function

### Endpoint
`POST /functions/v1/quote-processor`

### Purpose
Handles complete quote generation pipeline server-side, reducing processing time from 2.5s to 1.2s and API calls from 8-12 to 1.

### Authentication
- **Required**: JWT token  
- **Permissions**: `quote:create`, `quote:read`, `quote:update`

### Actions Supported

#### 2.1 Generate Quote

**Request**
```typescript
interface GenerateQuoteRequest {
  action: 'generate'
  clientData: {
    name: string
    email: string
    company?: string
    phone?: string
    address?: {
      street: string
      city: string
      state: string
      zip: string
      country: string
    }
  }
  lineItems: Array<{
    id?: string
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
    category?: string
  }>
  settings: {
    includesTax: boolean
    taxRate?: number
    discountPercent?: number
    discountAmount?: number
    notes?: string
    validUntil?: string
    template?: 'standard' | 'detailed' | 'minimal'
    branding?: {
      logo?: string
      colors?: {
        primary: string
        accent?: string
      }
    }
  }
  deliveryOptions: {
    generatePDF: boolean
    sendEmail: boolean
    saveToStorage: boolean
    emailTemplate?: 'standard' | 'followup'
  }
}
```

**Response**
```typescript
interface GenerateQuoteResponse {
  quote: {
    id: string
    number: string
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
    createdAt: string
    validUntil?: string
    client: ClientData
    lineItems: LineItemData[]
    calculations: {
      subtotal: number
      discountAmount: number
      taxAmount: number
      total: number
      currency: string
    }
    urls: {
      view: string
      pdf?: string
      edit: string
    }
  }
  pdf?: {
    url: string
    downloadUrl: string
    size: number
    pages: number
  }
  email?: {
    messageId: string
    sentAt: string
    recipient: string
  }
  processing: {
    timeElapsed: number
    steps: Array<{
      name: string
      duration: number
      status: 'completed' | 'failed'
    }>
  }
}
```

#### 2.2 Update Quote

**Request**
```typescript
interface UpdateQuoteRequest {
  action: 'update'
  quoteId: string
  updates: {
    clientData?: Partial<ClientData>
    lineItems?: LineItemData[]
    settings?: Partial<QuoteSettings>
    status?: 'draft' | 'sent' | 'accepted' | 'rejected'
  }
  regeneratePDF?: boolean
  notifyClient?: boolean
}
```

#### 2.3 Duplicate Quote

**Request**
```typescript
interface DuplicateQuoteRequest {
  action: 'duplicate'
  sourceQuoteId: string
  updates?: {
    clientData?: Partial<ClientData>
    settings?: Partial<QuoteSettings>
  }
  generateNew: boolean
}
```

### PDF Generation Features
- **Formats**: A4, Letter, Custom sizes
- **Templates**: Standard, Detailed, Minimal branding
- **Elements**: Logo, custom colors, line items, terms
- **Output**: High-quality PDF with embedded fonts
- **Size Optimization**: Compressed for web delivery

### Email Integration
- **Templates**: Professional HTML templates
- **Attachments**: PDF quotes automatically attached
- **Tracking**: Open/click tracking via PostHog
- **Scheduling**: Delayed sending options
- **Follow-up**: Automated reminder sequences

### Performance Targets
- **Processing Time**: < 1.2s (52% improvement from 2.5s)
- **API Call Reduction**: 92% (12 calls → 1 call)
- **PDF Generation**: < 500ms for standard quotes
- **Concurrency**: 50 simultaneous requests

---

## 3. Admin Analytics Function

### Endpoint  
`POST /functions/v1/admin-analytics`

### Purpose
Pre-aggregates and serves analytics data for admin dashboard, reducing load time from 1.5s to 600ms.

### Authentication
- **Required**: JWT token
- **Permissions**: `analytics:read`, `admin:dashboard`

### Query Types

#### 3.1 Dashboard Overview

**Request**
```typescript
interface DashboardOverviewRequest {
  action: 'dashboard-overview'
  dateRange: {
    start: string // ISO 8601
    end: string
  }
  metrics: Array<'users' | 'revenue' | 'quotes' | 'subscriptions' | 'performance'>
  granularity?: 'hour' | 'day' | 'week' | 'month'
}
```

**Response**
```typescript
interface DashboardOverviewResponse {
  summary: {
    totalUsers: number
    activeUsers: number
    totalRevenue: number
    monthlyRecurringRevenue: number
    quotesGenerated: number
    conversionRate: number
    churnRate: number
  }
  trends: {
    userGrowth: Array<{
      date: string
      newUsers: number
      activeUsers: number
    }>
    revenue: Array<{
      date: string
      amount: number
      currency: string
    }>
    quotes: Array<{
      date: string
      generated: number
      accepted: number
      rejected: number
    }>
  }
  topPerformers: {
    plans: Array<{
      name: string
      subscribers: number
      revenue: number
    }>
    features: Array<{
      name: string
      usage: number
      adoptionRate: number
    }>
  }
}
```

#### 3.2 User Analytics

**Request**
```typescript
interface UserAnalyticsRequest {
  action: 'user-analytics'
  dateRange: DateRange
  filters?: {
    plan?: string[]
    status?: string[]
    cohort?: string
  }
  breakdown: 'acquisition' | 'retention' | 'behavior' | 'revenue'
}
```

#### 3.3 Revenue Analytics

**Request**
```typescript
interface RevenueAnalyticsRequest {
  action: 'revenue-analytics'
  dateRange: DateRange
  metrics: Array<'mrr' | 'arr' | 'churn' | 'ltv' | 'cohorts'>
  segmentation?: 'plan' | 'acquisition_channel' | 'geography'
}
```

#### 3.4 Performance Analytics

**Request**
```typescript
interface PerformanceAnalyticsRequest {
  action: 'performance-analytics'
  dateRange: DateRange
  components: Array<'api' | 'functions' | 'database' | 'frontend'>
  aggregation: 'avg' | 'p50' | 'p95' | 'p99'
}
```

### Caching Strategy
- **Real-time Data**: No cache (current day metrics)
- **Historical Data**: 5-minute cache
- **Aggregated Reports**: 1-hour cache
- **Static Reports**: 24-hour cache

### Performance Targets
- **Load Time**: < 600ms (60% improvement from 1.5s)
- **Cache Hit Rate**: 85% for frequently accessed data
- **Data Freshness**: ≤ 5 minutes for key metrics
- **Concurrency**: 25 simultaneous requests

---

## 4. Webhook Handler Function

### Endpoint
`POST /functions/v1/webhook-handler`

### Purpose
Unified processing for all external webhooks with intelligent routing and reliability features.

### Authentication
- **Required**: Signature verification (no JWT)
- **Security**: Webhook signature validation per provider

### Supported Webhook Sources

#### 4.1 Stripe Webhooks

**Endpoint**: `/functions/v1/webhook-handler/stripe`

**Supported Events**:
```typescript
type StripeEventTypes = 
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'checkout.session.completed'
  | 'product.created'
  | 'product.updated'
  | 'price.created'
  | 'price.updated'
```

**Request Format**:
```typescript
interface StripeWebhookRequest {
  id: string
  object: 'event'
  type: StripeEventTypes
  data: {
    object: StripeObject
    previous_attributes?: Record<string, any>
  }
  created: number
  livemode: boolean
  pending_webhooks: number
  request: {
    id?: string
    idempotency_key?: string
  }
}
```

**Response**:
```typescript
interface WebhookResponse {
  received: boolean
  processed: boolean
  processingTime: number
  eventId: string
  actions: Array<{
    type: string
    status: 'completed' | 'failed' | 'skipped'
    details?: any
  }>
}
```

#### 4.2 PostHog Webhooks

**Endpoint**: `/functions/v1/webhook-handler/posthog`

**Event Types**:
- User behavior events
- Feature flag changes
- Experiment results
- Cohort updates

#### 4.3 Custom Application Webhooks

**Endpoint**: `/functions/v1/webhook-handler/app`

**Use Cases**:
- Quote status changes
- User activity notifications
- System health alerts
- Automated workflows

### Security Features
- **Signature Verification**: HMAC-SHA256 validation
- **Replay Protection**: Timestamp verification
- **Rate Limiting**: 1000 requests/minute per source
- **IP Whitelisting**: Configurable IP restrictions

### Reliability Features
- **Retry Logic**: Exponential backoff for failures
- **Dead Letter Queue**: Failed events for manual review
- **Idempotency**: Duplicate event prevention
- **Circuit Breaker**: Automatic failure protection

### Performance Targets
- **Processing Time**: < 200ms (60% improvement from 500ms)
- **Success Rate**: 99.9% with retry logic
- **Throughput**: 1000 webhooks/minute
- **Concurrency**: 200 simultaneous requests

---

## 5. Batch Processor Function

### Endpoint
`POST /functions/v1/batch-processor`

### Purpose
Handles bulk operations server-side to prevent client timeouts and improve efficiency.

### Authentication
- **Required**: JWT token
- **Permissions**: `admin:batch`, specific operation permissions

### Supported Operations

#### 5.1 Bulk Quote Operations

**Request**:
```typescript
interface BulkQuoteRequest {
  action: 'bulk-quotes'
  operation: 'create' | 'update' | 'delete' | 'send'
  data: Array<{
    id?: string // For update/delete operations
    clientData?: ClientData
    lineItems?: LineItemData[]
    settings?: QuoteSettings
  }>
  options: {
    batchSize?: number // Default: 50
    parallel?: boolean // Default: false
    stopOnError?: boolean // Default: false
    notifyProgress?: boolean // Default: true
  }
}
```

#### 5.2 User Management Batch

**Request**:
```typescript
interface BulkUserRequest {
  action: 'bulk-users'
  operation: 'create' | 'update' | 'deactivate' | 'export'
  data: Array<{
    id?: string
    email?: string
    name?: string
    role?: string
    metadata?: Record<string, any>
  }>
  options: BatchOptions
}
```

#### 5.3 Data Export

**Request**:
```typescript
interface DataExportRequest {
  action: 'export'
  exportType: 'quotes' | 'users' | 'analytics' | 'full'
  format: 'csv' | 'json' | 'xlsx'
  dateRange?: DateRange
  filters?: Record<string, any>
  includeRelated?: boolean
}
```

### Batch Processing Features

#### Progress Tracking
```typescript
interface BatchProgress {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: {
    total: number
    processed: number
    succeeded: number
    failed: number
    percentage: number
  }
  timing: {
    startedAt: string
    estimatedCompletion?: string
    completedAt?: string
  }
  results?: {
    successIds: string[]
    failures: Array<{
      id: string
      error: string
      details?: any
    }>
  }
}
```

#### Real-time Updates
- **WebSocket Connection**: Real-time progress updates
- **Polling Endpoint**: GET `/functions/v1/batch-processor/status/{jobId}`
- **Webhooks**: Completion notifications

### Performance Targets
- **Batch Size**: Up to 1000 items per request
- **Processing Rate**: 100 items/second
- **Memory Efficiency**: Streaming processing for large datasets
- **Fault Tolerance**: Graceful handling of partial failures

---

## Rate Limiting & Usage Quotas

### Global Rate Limits
| Function | Requests/Minute | Burst Limit |
|----------|-----------------|-------------|
| subscription-manager | 300 | 500 |
| quote-processor | 100 | 200 |
| admin-analytics | 60 | 100 |
| webhook-handler | 1000 | 2000 |
| batch-processor | 10 | 20 |

### Usage Quotas by Plan
| Plan | Quotes/Month | API Calls/Month | Batch Jobs/Month |
|------|--------------|-----------------|------------------|
| Free | 50 | 1,000 | 5 |
| Pro | 500 | 10,000 | 50 |
| Enterprise | Unlimited | Unlimited | Unlimited |

---

## Error Handling Examples

### Validation Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "clientData.email",
        "message": "Invalid email format"
      },
      {
        "field": "lineItems[0].quantity",
        "message": "Quantity must be positive"
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-01-25T10:30:00Z",
    "executionTime": 45
  }
}
```

### Rate Limit Error Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retryAfter": 60
    }
  },
  "meta": {
    "requestId": "req_def456",
    "timestamp": "2025-01-25T10:30:00Z",
    "executionTime": 12
  }
}
```

---

## Testing Endpoints

Each function provides health check and testing endpoints:

### Health Check
`GET /functions/v1/{function-name}/health`

Response:
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: 'pass' | 'fail'
    cache: 'pass' | 'fail'
    external_apis: 'pass' | 'fail'
  }
  performance: {
    avgResponseTime: number
    p95ResponseTime: number
    errorRate: number
  }
}
```

### Test Mode
Add header `X-Test-Mode: true` for test operations that don't affect production data.

---

## SDK Integration Examples

### JavaScript/TypeScript Client
```typescript
class EdgeFunctionsClient {
  constructor(
    private baseUrl: string,
    private authToken: string
  ) {}

  async subscriptionManager(request: SubscriptionRequest) {
    return this.post('/subscription-manager', request)
  }

  async quoteProcessor(request: QuoteRequest) {
    return this.post('/quote-processor', request)
  }

  private async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}
```

### React Hook Example
```typescript
function useQuoteGeneration() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateQuote = async (quoteData: GenerateQuoteRequest) => {
    setLoading(true)
    setError(null)

    try {
      const response = await edgeFunctions.quoteProcessor(quoteData)
      if (!response.success) {
        throw new Error(response.error.message)
      }
      return response.data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { generateQuote, loading, error }
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-25  
**Next Review**: During implementation phase  
**Document Owner**: API Team Lead

---

## Related Documents
- [Epic Overview](./README.md)
- [User Stories](./user-stories.md)
- [Technical Architecture](./technical-architecture.md)
- [Sprint Breakdown](./sprint-breakdown.md)
- [Implementation Guide](./implementation-guide.md)