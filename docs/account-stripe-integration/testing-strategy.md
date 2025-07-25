# Testing Strategy - Account-Stripe Integration

## Comprehensive Testing Approach

This document outlines the complete testing strategy for the Account-Stripe Integration epic, covering unit tests, integration tests, end-to-end testing, performance testing, and security validation.

---

## Testing Philosophy

### Test Pyramid Approach
```
    /\
   /  \
  / E2E \ (20%)
 /______\
/        \
/Integration\ (30%)
/____________\
/              \
/   Unit Tests   \ (50%)
/________________\
```

**Distribution Strategy:**
- **Unit Tests (50%)**: Fast, isolated component testing
- **Integration Tests (30%)**: API and database integration
- **End-to-End Tests (20%)**: Complete user workflows

### Quality Gates
- **Minimum Test Coverage**: 80% for critical subscription paths
- **Performance Benchmarks**: All subscription APIs < 500ms response time
- **Security Validation**: All endpoints pass OWASP security tests
- **Accessibility**: WCAG 2.1 AA compliance for all user interfaces

---

## Unit Testing Strategy

### 1. Service Layer Testing

#### Subscription Service Tests
```typescript
// tests/services/subscription-service.test.ts
import { SubscriptionService } from '@/features/account/api/subscription-service'
import { createMockStripe, createMockRepository } from '@/tests/mocks'

describe('SubscriptionService', () => {
  let service: SubscriptionService
  let mockStripe: jest.Mocked<Stripe>
  let mockRepository: jest.Mocked<ISubscriptionRepository>
  let mockLogger: jest.Mocked<Logger>

  beforeEach(() => {
    mockStripe = createMockStripe()
    mockRepository = createMockRepository()
    mockLogger = createMockLogger()
    service = new SubscriptionService(mockStripe, mockRepository, mockLogger)
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session with correct parameters', async () => {
      // Arrange
      const request = {
        priceId: 'price_test_123',
        successUrl: 'https://app.test.com/success',
        cancelUrl: 'https://app.test.com/cancel',
        customerId: 'cus_test_123'
      }
      
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/cs_test_123'
      }
      
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession as any)

      // Act
      const result = await service.createCheckoutSession(request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.sessionId).toBe('cs_test_123')
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'subscription',
        customer: 'cus_test_123',
        line_items: [{
          price: 'price_test_123',
          quantity: 1
        }],
        success_url: 'https://app.test.com/success',
        cancel_url: 'https://app.test.com/cancel',
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        customer_update: {
          address: 'auto',
          name: 'auto'
        }
      })
    })

    it('should handle Stripe API errors gracefully', async () => {
      // Arrange
      const request = {
        priceId: 'price_invalid',
        successUrl: 'https://app.test.com/success',
        cancelUrl: 'https://app.test.com/cancel'
      }
      
      const stripeError = new Error('No such price: price_invalid')
      mockStripe.checkout.sessions.create.mockRejectedValue(stripeError)

      // Act
      const result = await service.createCheckoutSession(request)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(StripeApiError)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create checkout session',
        expect.objectContaining({ error: stripeError })
      )
    })

    it('should validate input parameters', async () => {
      // Arrange
      const invalidRequest = {
        priceId: '',
        successUrl: 'invalid-url',
        cancelUrl: 'https://app.test.com/cancel'
      }

      // Act
      const result = await service.createCheckoutSession(invalidRequest)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled()
    })
  })

  describe('updateSubscription', () => {
    it('should update subscription plan successfully', async () => {
      // Arrange
      const subscriptionId = 'sub_test_123'
      const changes = { priceId: 'price_new_123' }
      
      const mockUpdatedSubscription = {
        id: subscriptionId,
        status: 'active',
        items: {
          data: [{ price: { id: 'price_new_123' } }]
        }
      }
      
      mockStripe.subscriptions.update.mockResolvedValue(mockUpdatedSubscription as any)
      mockRepository.update.mockResolvedValue({
        id: subscriptionId,
        priceId: 'price_new_123',
        status: 'active'
      } as any)

      // Act
      const result = await service.updateSubscription(subscriptionId, changes)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.priceId).toBe('price_new_123')
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        subscriptionId,
        {
          items: [{
            id: expect.any(String),
            price: 'price_new_123'
          }],
          proration_behavior: 'create_prorations'
        }
      )
    })

    it('should calculate proration preview before update', async () => {
      // Arrange
      const subscriptionId = 'sub_test_123'
      const changes = { priceId: 'price_new_123' }
      
      const mockInvoicePreview = {
        amount_due: 1500,
        lines: {
          data: [
            { amount: 2900, description: 'Pro Plan' },
            { amount: -1400, description: 'Unused time credit' }
          ]
        }
      }
      
      mockStripe.invoices.retrieveUpcoming.mockResolvedValue(mockInvoicePreview as any)

      // Act
      const result = await service.getSubscriptionUpdatePreview(subscriptionId, changes)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.immediateCharge).toBe(1500)
      expect(result.data.lineItems).toHaveLength(2)
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end', async () => {
      // Arrange
      const subscriptionId = 'sub_test_123'
      const cancellationRequest = {
        cancelAtPeriodEnd: true,
        reason: 'customer_request',
        feedback: { reason: 'too_expensive', details: 'Switching to competitor' }
      }
      
      const mockCanceledSubscription = {
        id: subscriptionId,
        cancel_at_period_end: true,
        canceled_at: null,
        current_period_end: new Date('2025-02-01')
      }
      
      mockStripe.subscriptions.update.mockResolvedValue(mockCanceledSubscription as any)

      // Act
      const result = await service.cancelSubscription(subscriptionId, cancellationRequest)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.cancelAtPeriodEnd).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        subscriptionId,
        { cancel_at_period_end: true }
      )
    })

    it('should record cancellation feedback', async () => {
      // Arrange
      const subscriptionId = 'sub_test_123'
      const cancellationRequest = {
        cancelAtPeriodEnd: true,
        feedback: { reason: 'missing_features', details: 'Need better analytics' }
      }

      mockStripe.subscriptions.update.mockResolvedValue({ id: subscriptionId } as any)

      // Act
      await service.cancelSubscription(subscriptionId, cancellationRequest)

      // Assert
      expect(mockRepository.recordCancellationFeedback).toHaveBeenCalledWith(
        subscriptionId,
        cancellationRequest.feedback
      )
    })
  })
})
```

#### Repository Layer Tests
```typescript
// tests/repositories/subscription-repository.test.ts
import { SupabaseSubscriptionRepository } from '@/features/account/repositories/subscription-repository'
import { createMockSupabase } from '@/tests/mocks'

describe('SupabaseSubscriptionRepository', () => {
  let repository: SupabaseSubscriptionRepository
  let mockSupabase: jest.Mocked<SupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    repository = new SupabaseSubscriptionRepository(mockSupabase)
  })

  describe('findByUserId', () => {
    it('should return subscription with related data', async () => {
      // Arrange
      const userId = 'user_123'
      const mockData = {
        id: 'sub_123',
        user_id: userId,
        stripe_subscription_id: 'sub_stripe_123',
        status: 'active',
        prices: {
          id: 'price_123',
          unit_amount: 2900,
          products: {
            id: 'prod_123',
            name: 'Pro Plan'
          }
        }
      }

      mockSupabase.from.mockReturnThis()
      mockSupabase.select.mockReturnThis()
      mockSupabase.eq.mockReturnThis()
      mockSupabase.maybeSingle.mockResolvedValue({ data: mockData, error: null })

      // Act
      const result = await repository.findByUserId(userId)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.id).toBe('sub_123')
      expect(result!.userId).toBe(userId)
      expect(result!.price.product.name).toBe('Pro Plan')
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSupabase.select).toHaveBeenCalledWith(
        '*, prices(*, products(*))'
      )
    })

    it('should handle database errors', async () => {
      // Arrange
      const userId = 'user_123'
      const mockError = new Error('Database connection failed')

      mockSupabase.from.mockReturnThis()
      mockSupabase.select.mockReturnThis()
      mockSupabase.eq.mockReturnThis()
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: mockError })

      // Act & Assert
      await expect(repository.findByUserId(userId)).rejects.toThrow(DatabaseError)
    })
  })
})
```

### 2. Component Testing (React)

#### Subscription Management Component Tests
```typescript
// tests/components/subscription-management.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SubscriptionManagement } from '@/features/account/components/subscription-management'
import { useSubscription, useUpdateSubscription } from '@/features/account/hooks'

// Mock hooks
jest.mock('@/features/account/hooks')
const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>
const mockUseUpdateSubscription = useUpdateSubscription as jest.MockedFunction<typeof useUpdateSubscription>

describe('SubscriptionManagement', () => {
  const mockSubscription = {
    id: 'sub_123',
    status: 'active',
    currentPeriodEnd: '2025-02-01T00:00:00Z',
    price: {
      id: 'price_pro_monthly',
      unitAmount: 2900,
      currency: 'usd',
      recurringInterval: 'month',
      product: {
        name: 'Pro Plan',
        features: ['Unlimited quotes', 'Advanced analytics']
      }
    }
  }

  beforeEach(() => {
    mockUseSubscription.mockReturnValue({
      subscription: mockSubscription,
      isLoading: false,
      error: null
    })

    mockUseUpdateSubscription.mockReturnValue({
      updateSubscription: jest.fn(),
      isUpdating: false,
      error: null
    })
  })

  it('should display current subscription details', () => {
    render(<SubscriptionManagement userId="user_123" />)

    expect(screen.getByText('Pro Plan')).toBeInTheDocument()
    expect(screen.getByText('$29.00/month')).toBeInTheDocument()
    expect(screen.getByText('Next billing: February 1, 2025')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      isLoading: true,
      error: null
    })

    render(<SubscriptionManagement userId="user_123" />)

    expect(screen.getByTestId('subscription-skeleton')).toBeInTheDocument()
  })

  it('should display error state', () => {
    const mockError = new Error('Failed to load subscription')
    mockUseSubscription.mockReturnValue({
      subscription: null,
      isLoading: false,
      error: mockError
    })

    render(<SubscriptionManagement userId="user_123" />)

    expect(screen.getByText('Failed to load subscription')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('should handle plan upgrade', async () => {
    const mockUpdateSubscription = jest.fn().mockResolvedValue({
      success: true,
      data: { ...mockSubscription, price: { ...mockSubscription.price, id: 'price_pro_yearly' } }
    })

    mockUseUpdateSubscription.mockReturnValue({
      updateSubscription: mockUpdateSubscription,
      isUpdating: false,
      error: null
    })

    render(<SubscriptionManagement userId="user_123" />)

    // Click upgrade button
    fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Yearly' }))

    // Confirm in modal
    await waitFor(() => {
      expect(screen.getByText('Confirm Plan Change')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Upgrade' }))

    // Verify API call
    await waitFor(() => {
      expect(mockUpdateSubscription).toHaveBeenCalledWith('sub_123', {
        priceId: 'price_pro_yearly'
      })
    })
  })

  it('should show cancellation dialog', async () => {
    render(<SubscriptionManagement userId="user_123" />)

    // Click cancel subscription
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }))

    await waitFor(() => {
      expect(screen.getByText('Cancel Subscription')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to cancel?')).toBeInTheDocument()
    })

    // Check that cancellation options are present
    expect(screen.getByLabelText('Cancel at end of billing period')).toBeInTheDocument()
    expect(screen.getByLabelText('Cancel immediately')).toBeInTheDocument()
  })

  it('should be accessible', async () => {
    const { container } = render(<SubscriptionManagement userId="user_123" />)

    // Check for proper headings
    expect(screen.getByRole('heading', { name: 'Current Plan' })).toBeInTheDocument()

    // Check for proper button labels
    expect(screen.getByRole('button', { name: 'Manage Payment Methods' })).toBeInTheDocument()

    // Check for no accessibility violations
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### 3. Hook Testing

#### Custom Hooks Tests
```typescript
// tests/hooks/use-subscription.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useSubscription } from '@/features/account/hooks/useSubscription'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('useSubscription', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should fetch subscription data successfully', async () => {
    // Arrange
    const mockSubscription = {
      id: 'sub_123',
      status: 'active',
      price: { unitAmount: 2900 }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSubscription })
    } as Response)

    // Act
    const { result } = renderHook(() => useSubscription('user_123'))

    // Assert
    expect(result.current.isLoading).toBe(true)
    expect(result.current.subscription).toBeNull()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.subscription).toEqual(mockSubscription)
      expect(result.current.error).toBeNull()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/subscriptions/current?userId=user_123')
  })

  it('should handle fetch errors', async () => {
    // Arrange
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    // Act
    const { result } = renderHook(() => useSubscription('user_123'))

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.subscription).toBeNull()
      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  it('should not fetch when userId is not provided', () => {
    // Act
    renderHook(() => useSubscription(''))

    // Assert
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
```

---

## Integration Testing Strategy

### 1. API Integration Tests

#### Subscription API Tests
```typescript
// tests/integration/api/subscriptions.test.ts
import { testApiHandler } from 'next-test-api-route-handler'
import handler from '@/app/api/subscriptions/current/route'
import { createTestSession, createTestSubscription } from '@/tests/helpers'

describe('/api/subscriptions/current', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  it('should return current subscription for authenticated user', async () => {
    // Arrange
    const user = await createTestUser({ email: 'test@example.com' })
    const subscription = await createTestSubscription({
      userId: user.id,
      status: 'active',
      priceId: 'price_test_pro'
    })
    const session = await createTestSession(user)

    // Act
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'GET',
          headers: {
            'Cookie': `session=${session.id}`
          }
        })

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data.id).toBe(subscription.id)
        expect(data.data.status).toBe('active')
      }
    })
  })

  it('should return 401 for unauthenticated requests', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' })
        expect(response.status).toBe(401)
      }
    })
  })

  it('should return null when user has no subscription', async () => {
    // Arrange
    const user = await createTestUser({ email: 'nosubscription@example.com' })
    const session = await createTestSession(user)

    // Act
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'GET',
          headers: {
            'Cookie': `session=${session.id}`
          }
        })

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data).toBeNull()
      }
    })
  })
})
```

#### Checkout API Tests
```typescript
// tests/integration/api/checkout.test.ts
import { testApiHandler } from 'next-test-api-route-handler'
import handler from '@/app/api/subscriptions/checkout/route'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe')
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn()
    }
  }
} as jest.Mocked<Partial<Stripe>>

describe('/api/subscriptions/checkout', () => {
  beforeEach(() => {
    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(() => mockStripe as any)
  })

  it('should create checkout session with valid data', async () => {
    // Arrange
    const user = await createTestUser()
    const session = await createTestSession(user)
    
    const mockCheckoutSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/cs_test_123'
    }
    
    mockStripe.checkout!.sessions!.create.mockResolvedValue(mockCheckoutSession as any)

    const requestBody = {
      priceId: 'price_test_pro',
      successUrl: 'https://app.test.com/success',
      cancelUrl: 'https://app.test.com/cancel'
    }

    // Act
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Cookie': `session=${session.id}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data.sessionId).toBe('cs_test_123')
        expect(data.data.url).toBe('https://checkout.stroke.com/cs_test_123')
      }
    })
  })

  it('should validate request body', async () => {
    // Arrange
    const user = await createTestUser()
    const session = await createTestSession(user)

    const invalidRequestBody = {
      priceId: '', // Invalid: empty price ID
      successUrl: 'not-a-url', // Invalid: not a valid URL
      cancelUrl: 'https://app.test.com/cancel'
    }

    // Act
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: {
            'Cookie': `session=${session.id}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(invalidRequestBody)
        })

        // Assert
        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
      }
    })
  })
})
```

### 2. Webhook Integration Tests

#### Stripe Webhook Tests
```typescript
// tests/integration/webhooks/stripe.test.ts
import { testApiHandler } from 'next-test-api-route-handler'
import handler from '@/app/api/webhooks/stripe/route'
import Stripe from 'stripe'

describe('/api/webhooks/stripe', () => {
  const webhookSecret = 'whsec_test_secret'
  
  beforeEach(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret
    await setupTestDatabase()
  })

  it('should process subscription created webhook', async () => {
    // Arrange
    const mockEvent = {
      id: 'evt_test_123',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'active',
          items: {
            data: [{
              price: {
                id: 'price_test_pro'
              }
            }]
          }
        }
      }
    }

    const payload = JSON.stringify(mockEvent)
    const signature = generateStripeSignature(payload, webhookSecret)

    // Act
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: {
            'stripe-signature': signature,
            'content-type': 'application/json'
          },
          body: payload
        })

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.received).toBe(true)
        expect(data.processed).toBe(true)

        // Verify subscription was created in database
        const subscription = await getSubscriptionByStripeId('sub_test_123')
        expect(subscription).not.toBeNull()
        expect(subscription.status).toBe('active')
      }
    })
  })

  it('should reject webhooks with invalid signature', async () => {
    // Arrange
    const mockEvent = { id: 'evt_test', type: 'test' }
    const payload = JSON.stringify(mockEvent)
    const invalidSignature = 'invalid_signature'

    // Act
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: {
            'stripe-signature': invalidSignature,
            'content-type': 'application/json'
          },
          body: payload
        })

        // Assert
        expect(response.status).toBe(400)
      }
    })
  })

  it('should handle idempotent webhook processing', async () => {
    // Arrange
    const mockEvent = {
      id: 'evt_duplicate_123',
      type: 'customer.subscription.updated'
    }

    // Process webhook first time
    await processWebhookEvent(mockEvent)

    const payload = JSON.stringify(mockEvent)
    const signature = generateStripeSignature(payload, webhookSecret)

    // Act - Process same webhook again
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: {
            'stripe-signature': signature,
            'content-type': 'application/json'
          },
          body: payload
        })

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.received).toBe(true)
        expect(data.processed).toBe(false) // Should skip duplicate
      }
    })
  })
})
```

### 3. Database Integration Tests

#### Repository Integration Tests
```typescript
// tests/integration/repositories/subscription-repository.test.ts
import { SupabaseSubscriptionRepository } from '@/features/account/repositories'
import { createSupabaseTestClient } from '@/tests/helpers'

describe('SupabaseSubscriptionRepository Integration', () => {
  let repository: SupabaseSubscriptionRepository
  let supabase: SupabaseClient

  beforeAll(async () => {
    supabase = createSupabaseTestClient()
    repository = new SupabaseSubscriptionRepository(supabase)
    await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should create and retrieve subscription with relationships', async () => {
    // Arrange
    const user = await createTestUser()
    const product = await createTestProduct({ name: 'Test Product' })
    const price = await createTestPrice({ 
      id: 'price_test',
      productId: product.id,
      unitAmount: 2900
    })

    const subscriptionData = {
      userId: user.id,
      stripeSubscriptionId: 'sub_stripe_123',
      stripeCustomerId: 'cus_stripe_123',
      status: 'active' as const,
      priceId: price.id,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    // Act
    const created = await repository.create(subscriptionData)
    const retrieved = await repository.findByUserId(user.id)

    // Assert
    expect(created.id).toBeDefined()
    expect(retrieved).not.toBeNull()
    expect(retrieved!.id).toBe(created.id)
    expect(retrieved!.price.product.name).toBe('Test Product')
    expect(retrieved!.price.unitAmount).toBe(2900)
  })

  it('should update subscription status and track changes', async () => {
    // Arrange
    const subscription = await createTestSubscription({ status: 'active' })

    // Act
    const updated = await repository.update(subscription.id, { 
      status: 'past_due',
      cancelAtPeriodEnd: true
    })

    // Assert
    expect(updated.status).toBe('past_due')
    expect(updated.cancelAtPeriodEnd).toBe(true)

    // Verify audit trail
    const events = await repository.getSubscriptionEvents(subscription.id)
    expect(events).toHaveLength(1)
    expect(events[0].eventType).toBe('subscription_updated')
  })

  it('should handle concurrent updates safely', async () => {
    // Arrange
    const subscription = await createTestSubscription()

    // Act - Simulate concurrent updates
    const updatePromises = [
      repository.update(subscription.id, { status: 'past_due' }),
      repository.update(subscription.id, { cancelAtPeriodEnd: true }),
      repository.update(subscription.id, { status: 'canceled' })
    ]

    const results = await Promise.allSettled(updatePromises)

    // Assert - At least one should succeed
    const successful = results.filter(r => r.status === 'fulfilled')
    expect(successful.length).toBeGreaterThan(0)

    // Final state should be consistent
    const final = await repository.findById(subscription.id)
    expect(final).not.toBeNull()
    expect(['past_due', 'canceled']).toContain(final!.status)
  })
})
```

---

## End-to-End Testing Strategy

### 1. User Subscription Flows

#### Complete Subscription Journey
```typescript
// tests/e2e/subscription-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Subscription Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await login(page, 'testuser@example.com', 'password123')
  })

  test('user can complete full subscription journey', async ({ page }) => {
    // Navigate to pricing
    await page.goto('/pricing')
    await expect(page.locator('[data-testid="pricing-page"]')).toBeVisible()

    // Select Pro plan
    await page.click('[data-testid="pro-plan-select"]')
    await expect(page).toHaveURL(/checkout/)

    // Fill checkout form (using test card)
    await page.fill('[data-testid="email-input"]', 'testuser@example.com')
    await page.fill('[data-testid="card-number-input"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry-input"]', '12/25')
    await page.fill('[data-testid="card-cvc-input"]', '123')
    await page.fill('[data-testid="cardholder-name-input"]', 'Test User')

    // Submit payment
    await page.click('[data-testid="submit-payment-button"]')

    // Verify success page
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('text=Welcome to Pro Plan')).toBeVisible()

    // Navigate to account page
    await page.goto('/account')
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro Plan')
    await expect(page.locator('[data-testid="plan-price"]')).toContainText('$29')
    await expect(page.locator('[data-testid="plan-interval"]')).toContainText('month')

    // Verify billing history
    await page.click('[data-testid="billing-history-tab"]')
    await expect(page.locator('[data-testid="invoice-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="invoice-item"]').first()).toContainText('Pro Plan')
  })

  test('user can upgrade subscription plan', async ({ page }) => {
    // Setup: User already has Basic plan
    await setupUserWithSubscription('basic_monthly')

    await page.goto('/account/subscription')
    
    // Click upgrade button
    await page.click('[data-testid="upgrade-plan-button"]')
    
    // Select Pro plan
    await page.click('[data-testid="pro-plan-option"]')
    
    // Review proration
    await expect(page.locator('[data-testid="proration-preview"]')).toBeVisible()
    const prorationAmount = await page.locator('[data-testid="proration-amount"]').textContent()
    expect(prorationAmount).toMatch(/\$\d+\.\d{2}/)
    
    // Confirm upgrade
    await page.click('[data-testid="confirm-upgrade-button"]')
    
    // Verify success
    await expect(page.locator('[data-testid="upgrade-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro Plan')
  })

  test('user can cancel subscription', async ({ page }) => {
    // Setup: User has active subscription
    await setupUserWithSubscription('pro_monthly')

    await page.goto('/account/subscription')
    
    // Click cancel subscription
    await page.click('[data-testid="cancel-subscription-button"]')
    
    // Fill cancellation form
    await expect(page.locator('[data-testid="cancellation-dialog"]')).toBeVisible()
    await page.check('[data-testid="cancel-at-period-end"]')
    await page.selectOption('[data-testid="cancellation-reason"]', 'too_expensive')
    await page.fill('[data-testid="cancellation-feedback"]', 'Found a cheaper alternative')
    
    // Confirm cancellation
    await page.click('[data-testid="confirm-cancellation-button"]')
    
    // Verify cancellation scheduled
    await expect(page.locator('[data-testid="cancellation-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="access-until"]')).toContainText('Your access will continue until')
    await expect(page.locator('[data-testid="reactivate-button"]')).toBeVisible()
  })

  test('user can manage payment methods', async ({ page }) => {
    await setupUserWithSubscription('pro_monthly')

    await page.goto('/account/billing')
    
    // Add new payment method
    await page.click('[data-testid="add-payment-method-button"]')
    
    // Fill new card details
    await page.fill('[data-testid="new-card-number"]', '5555555555554444')
    await page.fill('[data-testid="new-card-expiry"]', '03/26')
    await page.fill('[data-testid="new-card-cvc"]', '456')
    
    // Save payment method
    await page.click('[data-testid="save-payment-method-button"]')
    
    // Verify new payment method appears
    await expect(page.locator('[data-testid="payment-method-list"]')).toContainText('•••• 4444')
    
    // Set as default
    await page.click('[data-testid="set-default-payment-method"]')
    await expect(page.locator('[data-testid="default-payment-method"]')).toContainText('•••• 4444')
    
    // Remove old payment method
    await page.click('[data-testid="remove-payment-method"]:first-child')
    await page.click('[data-testid="confirm-remove-payment-method"]')
    
    await expect(page.locator('[data-testid="payment-method-list"] [data-testid="payment-method-item"]')).toHaveCount(1)
  })
})
```

### 2. Admin Management Flows

#### Customer Management E2E Tests
```typescript
// tests/e2e/admin-customer-management.spec.ts
test.describe('Admin Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, 'admin@example.com', 'adminpass123')
  })

  test('admin can search and manage customers', async ({ page }) => {
    // Navigate to customer management
    await page.goto('/admin/customers')
    await expect(page.locator('[data-testid="customers-page"]')).toBeVisible()

    // Search for specific customer
    await page.fill('[data-testid="customer-search"]', 'john@example.com')
    await page.keyboard.press('Enter')

    // Verify search results
    await expect(page.locator('[data-testid="customer-list"]')).toContainText('john@example.com')

    // Click on customer details
    await page.click('[data-testid="customer-row"]:first-child')

    // Verify customer detail page
    await expect(page.locator('[data-testid="customer-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="customer-email"]')).toContainText('john@example.com')
    await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="payment-history"]')).toBeVisible()

    // Update customer subscription
    await page.click('[data-testid="modify-subscription-button"]')
    await page.selectOption('[data-testid="subscription-action"]', 'change_plan')
    await page.selectOption('[data-testid="new-plan-select"]', 'pro_yearly')
    await page.fill('[data-testid="admin-note"]', 'Customer requested annual billing')
    
    await page.click('[data-testid="confirm-subscription-change"]')
    
    // Verify success
    await expect(page.locator('[data-testid="modification-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro Plan (Yearly)')
  })

  test('admin can handle failed payments', async ({ page }) => {
    await page.goto('/admin/failed-payments')
    
    // Verify failed payments dashboard
    await expect(page.locator('[data-testid="failed-payments-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="failed-payments-summary"]')).toBeVisible()
    
    // Filter by high priority
    await page.selectOption('[data-testid="priority-filter"]', 'high')
    
    // Select failed payment to retry
    await page.click('[data-testid="failed-payment-row"]:first-child')
    await page.click('[data-testid="retry-payment-button"]')
    
    // Confirm retry
    await page.click('[data-testid="confirm-retry-button"]')
    
    // Verify retry initiated
    await expect(page.locator('[data-testid="retry-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="payment-status"]')).toContainText('Retry in progress')
  })

  test('admin can view subscription analytics', async ({ page }) => {
    await page.goto('/admin/analytics/subscriptions')
    
    // Verify analytics dashboard loads
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
    
    // Check key metrics are displayed
    await expect(page.locator('[data-testid="mrr-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="churn-rate-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="new-subscriptions-metric"]')).toBeVisible()
    
    // Change time period
    await page.selectOption('[data-testid="time-period-select"]', '90d')
    
    // Wait for charts to update
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="subscription-growth-chart"]')).toBeVisible()
    
    // Export report
    await page.click('[data-testid="export-report-button"]')
    
    // Verify download initiated
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-csv-button"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/subscription_analytics_\d{4}-\d{2}-\d{2}\.csv/)
  })
})
```

---

## Performance Testing Strategy

### 1. Load Testing

#### Subscription API Load Tests
```typescript
// tests/performance/subscription-load.test.ts
import { check } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
}

export default function () {
  // Test subscription retrieval
  const response = http.get('https://api.example.com/api/subscriptions/current', {
    headers: {
      'Cookie': `session=${__ENV.TEST_SESSION}`,
    },
  })

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has subscription data': (r) => JSON.parse(r.body).success === true,
  })

  // Test checkout session creation
  const checkoutPayload = {
    priceId: 'price_test_pro',
    successUrl: 'https://app.example.com/success',
    cancelUrl: 'https://app.example.com/cancel',
  }

  const checkoutResponse = http.post(
    'https://api.example.com/api/subscriptions/checkout',
    JSON.stringify(checkoutPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${__ENV.TEST_SESSION}`,
      },
    }
  )

  check(checkoutResponse, {
    'checkout status is 200': (r) => r.status === 200,
    'checkout response time < 1s': (r) => r.timings.duration < 1000,
    'has checkout URL': (r) => JSON.parse(r.body).data.url !== undefined,
  })
}
```

### 2. Database Performance Tests

#### Query Performance Tests
```typescript
// tests/performance/database-performance.test.ts
import { performance } from 'perf_hooks'
import { SupabaseSubscriptionRepository } from '@/features/account/repositories'

describe('Database Performance Tests', () => {
  let repository: SupabaseSubscriptionRepository

  beforeAll(async () => {
    repository = new SupabaseSubscriptionRepository(supabase)
    
    // Seed performance test data
    await seedPerformanceTestData({
      users: 10000,
      subscriptions: 8000,
      events: 50000,
      invoices: 25000
    })
  })

  it('should retrieve user subscription under 100ms', async () => {
    const userId = 'user_performance_test_1'
    
    const start = performance.now()
    const subscription = await repository.findByUserId(userId)
    const end = performance.now()
    
    const duration = end - start
    expect(duration).toBeLessThan(100) // Under 100ms
    expect(subscription).not.toBeNull()
  })

  it('should handle customer analytics queries efficiently', async () => {
    const start = performance.now()
    
    const customers = await repository.getCustomerAnalytics({
      limit: 25,
      sortBy: 'lifetime_value',
      filters: { status: ['active', 'past_due'] }
    })
    
    const end = performance.now()
    const duration = end - start
    
    expect(duration).toBeLessThan(200) // Under 200ms
    expect(customers.length).toBeLessThanOrEqual(25)
  })

  it('should handle large subscription event queries', async () => {
    const userId = 'user_with_many_events'
    
    const start = performance.now()
    const events = await repository.getSubscriptionEvents(userId, {
      limit: 100,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2025-01-01')
      }
    })
    const end = performance.now()
    
    const duration = end - start
    expect(duration).toBeLessThan(300) // Under 300ms
    expect(events.length).toBeLessThanOrEqual(100)
  })
})
```

---

## Security Testing Strategy

### 1. Authentication and Authorization Tests

#### Security Test Suite
```typescript
// tests/security/auth-security.test.ts
describe('Authentication Security Tests', () => {
  it('should reject requests without valid session', async () => {
    const response = await request(app)
      .get('/api/subscriptions/current')
      .expect(401)

    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED')
  })

  it('should reject expired sessions', async () => {
    const expiredSession = await createExpiredSession()
    
    const response = await request(app)
      .get('/api/subscriptions/current')
      .set('Cookie', `session=${expiredSession.id}`)
      .expect(401)
  })

  it('should prevent subscription access across users', async () => {
    const user1 = await createTestUser()
    const user2 = await createTestUser()
    const subscription = await createTestSubscription({ userId: user1.id })
    const user2Session = await createTestSession(user2)

    // Try to access user1's subscription with user2's session
    const response = await request(app)
      .get(`/api/subscriptions/${subscription.id}`)
      .set('Cookie', `session=${user2Session.id}`)
      .expect(403)

    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
  })

  it('should prevent admin endpoints access by regular users', async () => {
    const regularUser = await createTestUser({ role: 'user' })
    const session = await createTestSession(regularUser)

    const response = await request(app)
      .get('/api/admin/customers')
      .set('Cookie', `session=${session.id}`)
      .expect(403)
  })

  it('should rate limit subscription API calls', async () => {
    const user = await createTestUser()
    const session = await createTestSession(user)

    // Make multiple rapid requests
    const requests = Array(15).fill(null).map(() =>
      request(app)
        .get('/api/subscriptions/current')
        .set('Cookie', `session=${session.id}`)
    )

    const responses = await Promise.all(requests)
    
    // Some requests should be rate limited
    const rateLimited = responses.filter(r => r.status === 429)
    expect(rateLimited.length).toBeGreaterThan(0)
  })
})
```

### 2. Input Validation Security Tests

#### SQL Injection and XSS Tests
```typescript
// tests/security/input-validation.test.ts
describe('Input Validation Security Tests', () => {
  it('should prevent SQL injection in customer search', async () => {
    const adminSession = await createAdminSession()
    
    const maliciousQuery = "'; DROP TABLE customers; --"
    
    const response = await request(app)
      .get(`/api/admin/customers?search=${encodeURIComponent(maliciousQuery)}`)
      .set('Cookie', `session=${adminSession.id}`)
      .expect(400)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    
    // Verify tables still exist
    const customers = await database.customers.findMany()
    expect(customers).toBeDefined()
  })

  it('should sanitize XSS attempts in customer notes', async () => {
    const adminSession = await createAdminSession()
    const customerId = 'cus_test_123'
    
    const maliciousNote = '<script>alert("XSS")</script>Legitimate note'
    
    const response = await request(app)
      .put(`/api/admin/customers/${customerId}/notes`)
      .set('Cookie', `session=${adminSession.id}`)
      .send({ note: maliciousNote })
      .expect(200)

    // Verify script tags are stripped
    const customer = await database.customers.findById(customerId)
    expect(customer.notes).not.toContain('<script>')
    expect(customer.notes).toContain('Legitimate note')
  })

  it('should validate webhook signatures strictly', async () => {
    const invalidSignature = 'invalid_signature'
    const payload = JSON.stringify({ id: 'evt_test', type: 'test' })

    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', invalidSignature)
      .send(payload)
      .expect(400)

    expect(response.body.error).toContain('Invalid signature')
  })
})
```

### 3. Data Protection Tests

#### PII and Payment Data Security
```typescript
// tests/security/data-protection.test.ts
describe('Data Protection Security Tests', () => {
  it('should not expose sensitive payment data in API responses', async () => {
    const user = await createTestUser()
    const session = await createTestSession(user)
    
    // Add payment method with sensitive data
    await createTestPaymentMethod({
      userId: user.id,
      cardNumber: '4242424242424242',
      cvc: '123'
    })

    const response = await request(app)
      .get('/api/payment-methods')
      .set('Cookie', `session=${session.id}`)
      .expect(200)

    const paymentMethods = response.body.data.paymentMethods

    paymentMethods.forEach(pm => {
      // Should not contain full card number
      expect(pm.cardNumber).toBeUndefinedd()
      // Should not contain CVC
      expect(pm.cvc).toBeUndefined()
      // Should only show last 4 digits
      expect(pm.card.last4).toMatch(/^\d{4}$/)
    })
  })

  it('should encrypt sensitive customer data at rest', async () => {
    const customer = await createTestCustomer({
      email: 'sensitive@example.com',
      phone: '+1234567890'
    })

    // Check database directly
    const rawCustomerData = await database.query(
      'SELECT * FROM customer_management WHERE id = $1',
      [customer.id]
    )

    // Phone number should be encrypted
    expect(rawCustomerData.rows[0].phone).not.toBe('+1234567890')
    expect(rawCustomerData.rows[0].phone.length).toBeGreaterThan(15) // Encrypted data is longer
  })

  it('should audit all sensitive data access', async () => {
    const adminSession = await createAdminSession()
    const customerId = 'cus_test_audit'

    // Access customer data
    await request(app)
      .get(`/api/admin/customers/${customerId}`)
      .set('Cookie', `session=${adminSession.id}`)
      .expect(200)

    // Verify audit log entry
    const auditLogs = await database.auditLogs.findByUserId(adminSession.userId)
    const accessLog = auditLogs.find(log => 
      log.action === 'customer_data_access' && 
      log.resourceId === customerId
    )

    expect(accessLog).toBeDefined()
    expect(accessLog.timestamp).toBeDefined()
    expect(accessLog.ipAddress).toBeDefined()
  })
})
```

---

## Test Data Management

### 1. Test Data Factory

#### Data Factory Implementation
```typescript
// tests/helpers/test-data-factory.ts
export class TestDataFactory {
  static async createUser(overrides: Partial<User> = {}): Promise<User> {
    const defaultUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'user' as const,
      emailVerified: true,
      createdAt: new Date(),
      ...overrides
    }

    return database.users.create(defaultUser)
  }

  static async createSubscription(overrides: Partial<Subscription> = {}): Promise<Subscription> {
    const user = overrides.userId ? 
      await database.users.findById(overrides.userId) : 
      await this.createUser()

    const defaultSubscription = {
      userId: user.id,
      stripeSubscriptionId: `sub_test_${Date.now()}`,
      stripeCustomerId: `cus_test_${Date.now()}`,
      status: 'active' as const,
      priceId: 'price_test_basic',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...overrides
    }

    return database.subscriptions.create(defaultSubscription)
  }

  static async createCustomerManagement(overrides: Partial<CustomerManagement> = {}): Promise<CustomerManagement> {
    const subscription = await this.createSubscription()
    
    const defaultCustomer = {
      userId: subscription.userId,
      stripeCustomerId: subscription.stripeCustomerId,
      lifetimeValue: 0,
      totalPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      customerStatus: 'active' as const,
      churnRiskScore: 20,
      churnRiskLevel: 'low' as const,
      ...overrides
    }

    return database.customerManagement.create(defaultCustomer)
  }

  static async createSubscriptionEvent(overrides: Partial<SubscriptionEvent> = {}): Promise<SubscriptionEvent> {
    const subscription = await this.createSubscription()
    const customer = await this.createCustomerManagement({ userId: subscription.userId })

    const defaultEvent = {
      userId: subscription.userId,
      customerId: customer.id,
      subscriptionId: subscription.stripeSubscriptionId,
      eventType: 'subscription_created' as const,
      eventSource: 'system' as const,
      occurredAt: new Date(),
      ...overrides
    }

    return database.subscriptionEvents.create(defaultEvent)
  }

  static async seedPerformanceData(config: {
    users: number
    subscriptions: number
    events: number
    invoices: number
  }): Promise<void> {
    console.log('Seeding performance test data...')

    // Create users in batches
    const userBatches = Math.ceil(config.users / 100)
    for (let i = 0; i < userBatches; i++) {
      const batchSize = Math.min(100, config.users - i * 100)
      const users = Array(batchSize).fill(null).map((_, index) => ({
        email: `perf-user-${i * 100 + index}@example.com`,
        name: `Performance User ${i * 100 + index}`,
        role: 'user' as const
      }))
      
      await database.users.createMany(users)
    }

    // Similar batch creation for subscriptions, events, and invoices
    console.log('Performance test data seeded successfully')
  }

  static async cleanup(): Promise<void> {
    // Clean up test data in reverse dependency order
    await database.subscriptionEvents.deleteMany({ userId: { startsWith: 'test-' } })
    await database.invoices.deleteMany({ userEmail: { contains: 'test-' } })
    await database.paymentMethods.deleteMany({ userId: { startsWith: 'test-' } })
    await database.customerManagement.deleteMany({ userId: { startsWith: 'test-' } })
    await database.subscriptions.deleteMany({ userId: { startsWith: 'test-' } })
    await database.users.deleteMany({ email: { contains: 'test-' } })
  }
}
```

### 2. Test Environment Setup

#### Environment Configuration
```typescript
// tests/setup/test-environment.ts
export async function setupTestEnvironment(): Promise<void> {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_TEST_SECRET_KEY
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
  
  // Initialize test database
  await initializeTestDatabase()
  
  // Setup Stripe test fixtures
  await setupStripeTestFixtures()
  
  // Initialize monitoring (disabled in test)
  await initializeTestMonitoring()
}

export async function teardownTestEnvironment(): Promise<void> {
  await TestDataFactory.cleanup()
  await closeTestDatabaseConnections()
  await cleanupTestFiles()
}

// Global test setup
beforeAll(async () => {
  await setupTestEnvironment()
})

afterAll(async () => {
  await teardownTestEnvironment()
})
```

---

## Continuous Integration Testing

### 1. GitHub Actions Workflow

#### CI/CD Testing Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: quotekit_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/quotekit_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/quotekit_test
          REDIS_URL: redis://localhost:6379
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start application
        run: npm run start:test &
        env:
          NODE_ENV: test
          PORT: 3001
      
      - name: Wait for application
        run: npx wait-on http://localhost:3001
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3001
      
      - name: Upload E2E artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run OWASP ZAP security scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'http://localhost:3001'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

### 2. Test Quality Gates

#### Quality Metrics Configuration
```json
// package.json test scripts
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --config=jest.unit.config.js --coverage",
    "test:integration": "jest --config=jest.integration.config.js",
    "test:e2e": "playwright test",
    "test:performance": "k6 run tests/performance/load-test.js",
    "test:security": "npm run test:audit && npm run test:owasp",
    "test:audit": "npm audit --audit-level high",
    "test:owasp": "zap-baseline.py -t http://localhost:3001",
    "test:coverage": "jest --coverage --coverageThreshold '{\"global\":{\"branches\":80,\"functions\":80,\"lines\":80,\"statements\":80}}'",
    "test:watch": "jest --watch",
    "test:ci": "npm run test:coverage && npm run test:integration && npm run test:e2e"
  }
}
```

---

## Test Monitoring and Reporting

### 1. Test Results Dashboard

#### Test Metrics Collection
```typescript
// tests/utils/test-metrics.ts
export class TestMetricsCollector {
  private static metrics: TestMetrics[] = []

  static recordTestExecution(test: TestMetrics): void {
    this.metrics.push({
      ...test,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'test'
    })
  }

  static generateReport(): TestReport {
    const totalTests = this.metrics.length
    const passedTests = this.metrics.filter(m => m.status === 'passed').length
    const failedTests = this.metrics.filter(m => m.status === 'failed').length
    const skippedTests = this.metrics.filter(m => m.status === 'skipped').length

    const averageExecutionTime = this.metrics
      .reduce((sum, m) => sum + m.executionTime, 0) / totalTests

    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        passRate: (passedTests / totalTests) * 100,
        averageExecutionTime
      },
      categories: this.groupByCategory(),
      slowestTests: this.getSlowestTests(10),
      flakiestTests: this.getFlakiestTests(5)
    }
  }

  private static groupByCategory(): Record<string, CategoryMetrics> {
    const categories = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = []
      }
      acc[metric.category].push(metric)
      return acc
    }, {} as Record<string, TestMetrics[]>)

    return Object.entries(categories).reduce((acc, [category, tests]) => {
      acc[category] = {
        total: tests.length,
        passed: tests.filter(t => t.status === 'passed').length,
        failed: tests.filter(t => t.status === 'failed').length,
        averageTime: tests.reduce((sum, t) => sum + t.executionTime, 0) / tests.length
      }
      return acc
    }, {} as Record<string, CategoryMetrics>)
  }
}
```

### 2. Performance Benchmarking

#### Performance Test Reporting
```typescript
// tests/performance/performance-reporter.ts
export class PerformanceReporter {
  static async generatePerformanceReport(): Promise<PerformanceReport> {
    const benchmarks = await this.runPerformanceBenchmarks()
    
    return {
      timestamp: new Date(),
      benchmarks: benchmarks.map(b => ({
        name: b.name,
        metric: b.metric,
        value: b.value,
        threshold: b.threshold,
        status: b.value <= b.threshold ? 'pass' : 'fail',
        trend: await this.calculateTrend(b.name, b.value)
      })),
      summary: {
        totalBenchmarks: benchmarks.length,
        passed: benchmarks.filter(b => b.value <= b.threshold).length,
        failed: benchmarks.filter(b => b.value > b.threshold).length
      }
    }
  }

  private static async runPerformanceBenchmarks(): Promise<PerformanceBenchmark[]> {
    return [
      {
        name: 'Subscription API Response Time',
        metric: 'response_time_ms',
        value: await this.measureSubscriptionApiResponseTime(),
        threshold: 500
      },
      {
        name: 'Database Query Performance',
        metric: 'query_time_ms',
        value: await this.measureDatabaseQueryTime(),
        threshold: 100
      },
      {
        name: 'Checkout Session Creation',
        metric: 'creation_time_ms',
        value: await this.measureCheckoutCreationTime(),
        threshold: 1000
      }
    ]
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-25  
**Next Review**: During implementation sprints  
**Document Owner**: QA Team Lead

---

## Related Documents
- [Technical Architecture](./technical-architecture.md)
- [Implementation Guide](./implementation-guide.md)
- [API Specifications](./api-specs.md)
- [Database Design](./database-design.md)
- [Sprint Breakdown](./sprint-breakdown.md)
- [Epic Overview](./README.md)