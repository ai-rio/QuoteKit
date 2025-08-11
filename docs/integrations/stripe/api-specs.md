# API Specifications - Account-Stripe Integration

## API Documentation and Endpoint Specifications

This document provides comprehensive API specifications for all endpoints in the Account-Stripe Integration epic, including request/response schemas, authentication requirements, and error handling.

---

## Authentication & Authorization

### Session-Based Authentication
All user-facing endpoints require valid session authentication:
```http
Cookie: session=<session-token>
```

### Admin Authorization
Admin endpoints require additional role verification:
```http
Cookie: session=<admin-session-token>
X-Admin-Context: customer-management
```

### API Rate Limiting
- **User Endpoints**: 100 requests per minute per user
- **Admin Endpoints**: 200 requests per minute per admin
- **Webhook Endpoints**: 1000 requests per minute (no user limit)

---

## User Subscription Management APIs

### Get Current User Subscription
**Endpoint**: `GET /api/subscriptions/current`  
**Authentication**: Required (User)  
**Rate Limit**: 60 requests/minute  

#### Request
```http
GET /api/subscriptions/current HTTP/1.1
Cookie: session=<session-token>
```

#### Response Schema
```typescript
interface GetSubscriptionResponse {
  success: boolean
  data: {
    id: string
    userId: string
    status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
    currentPeriodStart: string // ISO 8601 date
    currentPeriodEnd: string   // ISO 8601 date
    cancelAtPeriodEnd: boolean
    trialEnd?: string          // ISO 8601 date
    price: {
      id: string
      unitAmount: number       // in cents
      currency: string
      recurringInterval: 'month' | 'year'
      product: {
        id: string
        name: string
        description?: string
        features: string[]
      }
    }
    customer: {
      id: string
      email: string
      name?: string
    }
    upcomingInvoice?: {
      id: string
      amountDue: number        // in cents
      dueDate: string          // ISO 8601 date
    }
  } | null
}
```

#### Response Examples
```json
// Active subscription
{
  "success": true,
  "data": {
    "id": "sub_1234567890",
    "userId": "user_abc123",
    "status": "active",
    "currentPeriodStart": "2025-01-01T00:00:00Z",
    "currentPeriodEnd": "2025-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "price": {
      "id": "price_pro_monthly",
      "unitAmount": 2900,
      "currency": "usd",
      "recurringInterval": "month",
      "product": {
        "id": "prod_pro",
        "name": "Pro Plan",
        "description": "Advanced features for professionals",
        "features": ["Unlimited quotes", "Advanced analytics", "Priority support"]
      }
    },
    "customer": {
      "id": "cus_customer123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "upcomingInvoice": {
      "id": "in_upcoming123",
      "amountDue": 2900,
      "dueDate": "2025-02-01T00:00:00Z"
    }
  }
}

// No subscription
{
  "success": true,
  "data": null
}
```

### Create Checkout Session
**Endpoint**: `POST /api/subscriptions/checkout`  
**Authentication**: Required (User)  
**Rate Limit**: 10 requests/minute  

#### Request Schema
```typescript
interface CreateCheckoutRequest {
  priceId: string
  successUrl: string
  cancelUrl: string
  trialPeriodDays?: number
  metadata?: Record<string, string>
}
```

#### Request Example
```json
{
  "priceId": "price_pro_monthly",
  "successUrl": "https://app.example.com/subscription/success",
  "cancelUrl": "https://app.example.com/pricing",
  "trialPeriodDays": 14,
  "metadata": {
    "source": "pricing_page",
    "campaign": "winter_2025"
  }
}
```

#### Response Schema
```typescript
interface CreateCheckoutResponse {
  success: boolean
  data: {
    sessionId: string
    url: string
    expiresAt: string  // ISO 8601 date
  }
}
```

#### Response Example
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_1234567890",
    "url": "https://checkout.stripe.com/c/pay/cs_test_1234567890",
    "expiresAt": "2025-01-25T01:00:00Z"
  }
}
```

### Update Subscription Plan
**Endpoint**: `PUT /api/subscriptions/{subscriptionId}`  
**Authentication**: Required (User - must own subscription)  
**Rate Limit**: 5 requests/minute  

#### Request Schema
```typescript
interface UpdateSubscriptionRequest {
  priceId: string
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  billingCycleAnchor?: 'now' | 'unchanged'
}
```

#### Request Example
```json
{
  "priceId": "price_pro_yearly",
  "prorationBehavior": "create_prorations",
  "billingCycleAnchor": "unchanged"
}
```

#### Response Schema
```typescript
interface UpdateSubscriptionResponse {
  success: boolean
  data: {
    subscription: SubscriptionDetails
    prorationDetails?: {
      immediateCharge: number  // in cents
      creditApplied: number    // in cents
      nextInvoicePreview: {
        amountDue: number      // in cents
        dueDate: string        // ISO 8601 date
        lineItems: Array<{
          description: string
          amount: number       // in cents
          period: {
            start: string      // ISO 8601 date
            end: string        // ISO 8601 date
          }
        }>
      }
    }
  }
}
```

### Cancel Subscription
**Endpoint**: `DELETE /api/subscriptions/{subscriptionId}`  
**Authentication**: Required (User - must own subscription)  
**Rate Limit**: 2 requests/minute  

#### Request Schema
```typescript
interface CancelSubscriptionRequest {
  cancelAtPeriodEnd: boolean
  cancellationReason?: string
  feedback?: {
    reason: 'too_expensive' | 'missing_features' | 'poor_support' | 'other'
    details?: string
  }
}
```

#### Request Example
```json
{
  "cancelAtPeriodEnd": true,
  "cancellationReason": "Switching to a different solution",
  "feedback": {
    "reason": "missing_features",
    "details": "Need better integration with our existing tools"
  }
}
```

#### Response Schema
```typescript
interface CancelSubscriptionResponse {
  success: boolean
  data: {
    subscription: SubscriptionDetails
    accessUntil: string  // ISO 8601 date
    reactivationDeadline?: string  // ISO 8601 date
  }
}
```

---

## Pricing and Product APIs

### Get Available Pricing Plans
**Endpoint**: `GET /api/pricing/plans`  
**Authentication**: Optional  
**Rate Limit**: 200 requests/minute  
**Cache**: 15 minutes  

#### Query Parameters
```typescript
interface GetPricingPlansQuery {
  interval?: 'month' | 'year' | 'both'
  currency?: string  // Default: 'usd'
  includeFeatures?: boolean  // Default: true
}
```

#### Response Schema
```typescript
interface GetPricingPlansResponse {
  success: boolean
  data: {
    products: Array<{
      id: string
      name: string
      description?: string
      position: number
      metadata: {
        features: string[]
        popular?: boolean
        variant?: 'default' | 'highlight' | 'enterprise'
      }
      prices: Array<{
        id: string
        unitAmount: number
        currency: string
        recurringInterval: 'month' | 'year'
        trialPeriodDays?: number
      }>
    }>
    currency: string
    lastUpdated: string  // ISO 8601 date
  }
}
```

### Get Subscription Preview
**Endpoint**: `POST /api/pricing/preview`  
**Authentication**: Required (User)  
**Rate Limit**: 30 requests/minute  

#### Request Schema
```typescript
interface GetSubscriptionPreviewRequest {
  priceId: string
  customerId?: string
  promotionCode?: string
  trialPeriodDays?: number
}
```

#### Response Schema
```typescript
interface GetSubscriptionPreviewResponse {
  success: boolean
  data: {
    immediateTotal: number    // in cents
    recurringTotal: number    // in cents
    currency: string
    trialEnd?: string         // ISO 8601 date
    nextBillingDate: string   // ISO 8601 date
    taxes?: Array<{
      type: string
      percentage: number
      amount: number          // in cents
      inclusive: boolean
    }>
    discounts?: Array<{
      couponId: string
      name: string
      amountOff?: number      // in cents
      percentOff?: number
      duration: 'once' | 'repeating' | 'forever'
    }>
  }
}
```

---

## Payment Method Management APIs

### Get User Payment Methods
**Endpoint**: `GET /api/payment-methods`  
**Authentication**: Required (User)  
**Rate Limit**: 60 requests/minute  

#### Response Schema
```typescript
interface GetPaymentMethodsResponse {
  success: boolean
  data: {
    paymentMethods: Array<{
      id: string
      type: 'card' | 'bank_account' | 'sepa_debit'
      isDefault: boolean
      card?: {
        brand: string
        last4: string
        expiryMonth: number
        expiryYear: number
        country: string
      }
      bankAccount?: {
        bankName: string
        last4: string
        accountType: 'checking' | 'savings'
      }
      createdAt: string       // ISO 8601 date
    }>
    defaultPaymentMethodId?: string
  }
}
```

### Add Payment Method
**Endpoint**: `POST /api/payment-methods`  
**Authentication**: Required (User)  
**Rate Limit**: 10 requests/minute  

#### Request Schema
```typescript
interface AddPaymentMethodRequest {
  paymentMethodId: string  // From Stripe.js
  setAsDefault?: boolean
}
```

### Update Default Payment Method
**Endpoint**: `PUT /api/payment-methods/default`  
**Authentication**: Required (User)  
**Rate Limit**: 10 requests/minute  

#### Request Schema
```typescript
interface UpdateDefaultPaymentMethodRequest {
  paymentMethodId: string
}
```

---

## Admin Customer Management APIs

### Get Customers List
**Endpoint**: `GET /api/admin/customers`  
**Authentication**: Required (Admin)  
**Rate Limit**: 100 requests/minute  

#### Query Parameters
```typescript
interface GetCustomersQuery {
  search?: string
  status?: Array<'active' | 'past_due' | 'canceled' | 'incomplete'>
  subscriptionStatus?: Array<'active' | 'trialing' | 'past_due' | 'canceled'>
  dateRange?: {
    start: string  // ISO 8601 date
    end: string    // ISO 8601 date
    field: 'created_at' | 'subscription_start' | 'last_payment'
  }
  sortBy?: 'name' | 'email' | 'created_at' | 'lifetime_value' | 'last_payment'
  sortOrder?: 'asc' | 'desc'
  limit?: number     // Max 100, default 25
  cursor?: string    // For pagination
}
```

#### Response Schema
```typescript
interface GetCustomersResponse {
  success: boolean
  data: {
    customers: Array<{
      id: string
      userId: string
      email: string
      name?: string
      status: 'active' | 'past_due' | 'canceled' | 'incomplete'
      subscription?: {
        id: string
        status: string
        currentPeriodEnd: string
        planName: string
        monthlyValue: number
      }
      analytics: {
        lifetimeValue: number
        totalPayments: number
        failedPayments: number
        lastPaymentDate?: string
        churnRisk: 'low' | 'medium' | 'high'
      }
      createdAt: string
    }>
    pagination: {
      hasMore: boolean
      nextCursor?: string
      total: number
    }
  }
}
```

### Get Customer Details
**Endpoint**: `GET /api/admin/customers/{customerId}`  
**Authentication**: Required (Admin)  
**Rate Limit**: 100 requests/minute  

#### Response Schema
```typescript
interface GetCustomerDetailsResponse {
  success: boolean
  data: {
    customer: {
      id: string
      userId: string
      stripeCustomerId: string
      email: string
      name?: string
      phone?: string
      address?: {
        line1: string
        line2?: string
        city: string
        state: string
        postalCode: string
        country: string
      }
      status: 'active' | 'past_due' | 'canceled' | 'incomplete'
      createdAt: string
      lastSeenAt?: string
    }
    subscription?: {
      id: string
      stripeSubscriptionId: string
      status: string
      currentPeriodStart: string
      currentPeriodEnd: string
      cancelAtPeriodEnd: boolean
      trialEnd?: string
      price: {
        id: string
        unitAmount: number
        currency: string
        interval: string
        product: {
          name: string
          description?: string
        }
      }
      discount?: {
        couponId: string
        percentOff?: number
        amountOff?: number
        validUntil?: string
      }
    }
    paymentMethods: Array<{
      id: string
      type: string
      isDefault: boolean
      card?: {
        brand: string
        last4: string
        expiryMonth: number
        expiryYear: number
      }
    }>
    invoices: Array<{
      id: string
      number: string
      status: 'paid' | 'open' | 'void' | 'uncollectible'
      amountPaid: number
      amountDue: number
      currency: string
      created: string
      dueDate?: string
      paidAt?: string
    }>
    analytics: {
      lifetimeValue: number
      monthlyRecurringRevenue: number
      totalPayments: number
      successfulPayments: number
      failedPayments: number
      averagePaymentAmount: number
      firstPaymentDate?: string
      lastPaymentDate?: string
      churnRisk: {
        score: number  // 0-100
        level: 'low' | 'medium' | 'high'
        factors: string[]
      }
      usageMetrics?: {
        quotesCreated: number
        lastActive?: string
        featureUsage: Record<string, number>
      }
    }
    notes: Array<{
      id: string
      text: string
      createdBy: string
      createdAt: string
    }>
  }
}
```

### Update Customer Subscription
**Endpoint**: `PUT /api/admin/customers/{customerId}/subscription`  
**Authentication**: Required (Admin)  
**Rate Limit**: 20 requests/minute  

#### Request Schema
```typescript
interface AdminUpdateSubscriptionRequest {
  action: 'change_plan' | 'cancel' | 'reactivate' | 'add_discount' | 'remove_discount'
  params: {
    // For change_plan
    newPriceId?: string
    prorationBehavior?: 'create_prorations' | 'none'
    
    // For cancel
    cancelAtPeriodEnd?: boolean
    cancellationReason?: string
    
    // For add_discount
    couponId?: string
    discountEnd?: string
    
    // For reactivate
    reactivateImmediately?: boolean
  }
  adminNote?: string
}
```

---

## Analytics and Reporting APIs

### Get Subscription Analytics
**Endpoint**: `GET /api/admin/analytics/subscriptions`  
**Authentication**: Required (Admin)  
**Rate Limit**: 50 requests/minute  
**Cache**: 5 minutes  

#### Query Parameters
```typescript
interface GetSubscriptionAnalyticsQuery {
  period: '7d' | '30d' | '90d' | '1y' | 'custom'
  startDate?: string  // ISO 8601 date (required if period=custom)
  endDate?: string    // ISO 8601 date (required if period=custom)
  metrics?: Array<'mrr' | 'churn' | 'ltv' | 'conversion' | 'revenue'>
  segmentBy?: 'plan' | 'cohort' | 'geography'
}
```

#### Response Schema
```typescript
interface GetSubscriptionAnalyticsResponse {
  success: boolean
  data: {
    summary: {
      totalSubscriptions: number
      activeSubscriptions: number
      monthlyRecurringRevenue: number
      annualRecurringRevenue: number
      averageRevenuePerUser: number
      churnRate: number  // percentage
      conversionRate: number  // percentage
      lifetimeValue: number
    }
    trends: {
      mrr: Array<{
        date: string
        value: number
        change: number  // percentage change from previous period
      }>
      subscriptions: Array<{
        date: string
        new: number
        churned: number
        net: number
      }>
      revenue: Array<{
        date: string
        recurring: number
        oneTime: number
        total: number
      }>
    }
    segmentation?: {
      byPlan: Array<{
        planId: string
        planName: string
        subscribers: number
        revenue: number
        churnRate: number
      }>
      byCohort: Array<{
        cohortMonth: string
        size: number
        retentionRates: number[]  // [month1, month2, month3, ...]
        revenueContribution: number
      }>
    }
    forecasting: {
      nextMonthMrr: number
      confidence: number  // 0-100
      growthRate: number  // percentage
    }
  }
}
```

---

## Webhook Processing APIs

### Stripe Webhook Endpoint
**Endpoint**: `POST /api/webhooks/stripe`  
**Authentication**: Stripe signature verification  
**Rate Limit**: 1000 requests/minute  

#### Headers Required
```http
Stripe-Signature: <stripe-signature>
Content-Type: application/json
```

#### Supported Event Types
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.upcoming`
- `customer.created`
- `customer.updated`
- `customer.deleted`
- `product.created`
- `product.updated`
- `price.created`
- `price.updated`
- `checkout.session.completed`
- `setup_intent.succeeded`

#### Response Schema
```typescript
interface WebhookResponse {
  received: boolean
  processed: boolean
  eventId: string
  eventType: string
  processedAt?: string
  error?: string
}
```

### Webhook Event Status
**Endpoint**: `GET /api/admin/webhooks/{eventId}`  
**Authentication**: Required (Admin)  
**Rate Limit**: 100 requests/minute  

#### Response Schema
```typescript
interface WebhookEventStatusResponse {
  success: boolean
  data: {
    id: string
    stripeEventId: string
    eventType: string
    status: 'pending' | 'processed' | 'failed' | 'dead_letter'
    retryCount: number
    error?: string
    processedAt?: string
    createdAt: string
    payload: any
  }
}
```

### Retry Failed Webhook
**Endpoint**: `POST /api/admin/webhooks/{eventId}/retry`  
**Authentication**: Required (Admin)  
**Rate Limit**: 10 requests/minute  

#### Response Schema
```typescript
interface RetryWebhookResponse {
  success: boolean
  data: {
    eventId: string
    retryAttempt: number
    status: 'queued' | 'processed' | 'failed'
    processedAt?: string
    error?: string
  }
}
```

---

## Error Response Schema

### Standard Error Response
All API endpoints use consistent error response format:

```typescript
interface ErrorResponse {
  success: false
  error: {
    message: string
    code: string
    statusCode: number
    details?: any
    timestamp: string
    requestId: string
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `RESOURCE_NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `RATE_LIMIT_EXCEEDED` (429)
- `STRIPE_API_ERROR` (502)
- `DATABASE_ERROR` (500)
- `WEBHOOK_VERIFICATION_FAILED` (400)
- `SUBSCRIPTION_NOT_FOUND` (404)
- `PAYMENT_METHOD_INVALID` (400)
- `PLAN_CHANGE_NOT_ALLOWED` (400)

### Error Response Examples
```json
// Validation error
{
  "success": false,
  "error": {
    "message": "Invalid request data",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": {
      "priceId": ["Price ID is required"],
      "successUrl": ["Must be a valid URL"]
    },
    "timestamp": "2025-01-25T12:00:00Z",
    "requestId": "req_abc123"
  }
}

// Stripe API error
{
  "success": false,
  "error": {
    "message": "Invalid price ID provided",
    "code": "STRIPE_API_ERROR",
    "statusCode": 502,
    "details": {
      "stripeError": {
        "type": "invalid_request_error",
        "code": "resource_missing",
        "param": "price"
      }
    },
    "timestamp": "2025-01-25T12:00:00Z",
    "requestId": "req_def456"
  }
}
```

---

## API Testing Examples

### cURL Examples

#### Get Current Subscription
```bash
curl -X GET "https://api.example.com/api/subscriptions/current" \
  -H "Cookie: session=<session-token>" \
  -H "Accept: application/json"
```

#### Create Checkout Session
```bash
curl -X POST "https://api.example.com/api/subscriptions/checkout" \
  -H "Cookie: session=<session-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_pro_monthly",
    "successUrl": "https://app.example.com/success",
    "cancelUrl": "https://app.example.com/pricing"
  }'
```

#### Admin Customer Search
```bash
curl -X GET "https://api.example.com/api/admin/customers?search=john@example.com&limit=10" \
  -H "Cookie: session=<admin-session-token>" \
  -H "Accept: application/json"
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-25  
**Next Review**: During implementation phase  
**Document Owner**: API Team Lead

---

## Related Documents
- [Technical Architecture](./technical-architecture.md)
- [Implementation Guide](./implementation-guide.md)
- [Database Design](./database-design.md) *(Next)*
- [Testing Strategy](./testing-strategy.md) *(Pending)*