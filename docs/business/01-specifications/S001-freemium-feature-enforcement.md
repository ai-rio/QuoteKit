# Feature Enforcement Guide

## Overview

This guide provides patterns and best practices for implementing feature gating throughout QuoteKit's codebase. All feature enforcement follows a consistent client-side + server-side protection model.

## Core Patterns

### 1. Client-Side Feature Gating

#### Basic Feature Check
```typescript
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

export function FeatureComponent() {
  const { canAccess } = useFeatureAccess()
  const access = canAccess('feature_key')
  
  if (!access.hasAccess) {
    return <UpgradePrompt feature="Feature Name" />
  }
  
  return <ActualFeature />
}
```

#### Usage Limit Check
```typescript
export function QuotaLimitedComponent() {
  const { canAccess } = useFeatureAccess()
  const quotesAccess = canAccess('max_quotes')
  
  if (quotesAccess.isAtLimit) {
    return (
      <div>
        <p>You've used {quotesAccess.current} of {quotesAccess.limit} quotes this month</p>
        <UpgradePrompt feature="Unlimited Quotes" />
      </div>
    )
  }
  
  return <CreateQuoteButton />
}
```

#### Progressive Enhancement Pattern
```typescript
export function EnhancedComponent() {
  const { canAccess, isFreePlan } = useFeatureAccess()
  const hasFeature = canAccess('premium_feature').hasAccess
  
  return (
    <div>
      {/* Basic functionality always available */}
      <BasicFeature />
      
      {/* Enhanced functionality for pro users */}
      {hasFeature && <PremiumFeature />}
      
      {/* Upgrade prompt for free users */}
      {isFreePlan() && (
        <UpgradeHint feature="Premium Feature" />
      )}
    </div>
  )
}
```

### 2. Server-Side Protection

#### API Route Protection
```typescript
// src/app/api/protected-feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkFeatureAccess } from '@/libs/feature-access'

export async function POST(request: NextRequest) {
  try {
    // Check feature access
    const hasAccess = await checkFeatureAccess(request, 'feature_key')
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Feature not available in your plan' },
        { status: 403 }
      )
    }
    
    // Proceed with feature logic
    const result = await performFeatureAction()
    return NextResponse.json(result)
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Server Action Protection
```typescript
'use server'

import { checkFeatureAccess } from '@/libs/feature-access'

export async function protectedServerAction(data: ActionData) {
  const hasAccess = await checkFeatureAccess('feature_key')
  
  if (!hasAccess) {
    throw new Error('Feature not available in your plan')
  }
  
  // Proceed with action
  return await performAction(data)
}
```

#### Middleware Protection
```typescript
// src/middleware/featureGate.ts
import { NextRequest, NextResponse } from 'next/server'

export function withFeatureGate(featureKey: FeatureKey) {
  return async function middleware(request: NextRequest) {
    const hasAccess = await checkFeatureAccess(request, featureKey)
    
    if (!hasAccess) {
      // Redirect to upgrade page or return 403
      return NextResponse.redirect(new URL('/upgrade', request.url))
    }
    
    return NextResponse.next()
  }
}
```

### 3. Page-Level Protection

#### Protected Page Component
```typescript
// src/components/ProtectedPage.tsx
interface ProtectedPageProps {
  feature: FeatureKey
  fallback?: React.ComponentType
  children: React.ReactNode
}

export function ProtectedPage({ feature, fallback: Fallback, children }: ProtectedPageProps) {
  const { canAccess, loading } = useFeatureAccess()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  const access = canAccess(feature)
  if (!access.hasAccess) {
    if (Fallback) {
      return <Fallback />
    }
    return <UpgradePrompt feature={feature} />
  }
  
  return <>{children}</>
}
```

#### Usage in Page
```typescript
// src/app/(app)/analytics/page.tsx
import { ProtectedPage } from '@/components/ProtectedPage'
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <ProtectedPage feature="analytics_access">
      <AnalyticsDashboard />
    </ProtectedPage>
  )
}
```

## Feature-Specific Implementation Patterns

### 1. PDF Export Feature

#### Client-Side (Button Component)
```typescript
// src/features/quotes/components/PDFExportButton.tsx
export function PDFExportButton({ quoteId }: Props) {
  const { canAccess } = useFeatureAccess()
  const pdfAccess = canAccess('pdf_export')
  
  if (!pdfAccess.hasAccess) {
    return (
      <CompactUpgradePrompt 
        feature="PDF Export"
        message="Export professional PDFs with custom branding"
      />
    )
  }
  
  return (
    <Button onClick={() => handlePDFExport(quoteId)}>
      <Download className="w-4 h-4 mr-2" />
      Export PDF
    </Button>
  )
}
```

#### Server-Side (API Route)
```typescript
// src/app/api/quotes/[id]/pdf/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const hasAccess = await checkFeatureAccess(request, 'pdf_export')
  
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'PDF export requires a pro subscription' },
      { status: 403 }
    )
  }
  
  // Generate PDF with feature-based customization
  const features = await getUserFeatures(request)
  const pdf = await generatePDF(params.id, {
    showWatermark: !features.custom_branding,
    includeLogo: features.custom_branding
  })
  
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quote-${params.id}.pdf"`
    }
  })
}
```

### 2. Usage-Limited Features (Quotes)

#### Client-Side with Usage Display
```typescript
// src/features/quotes/components/CreateQuoteButton.tsx
export function CreateQuoteButton() {
  const { canAccess, getUsagePercentage } = useFeatureAccess()
  const quotesAccess = canAccess('max_quotes')
  const usagePercent = getUsagePercentage('max_quotes')
  
  if (quotesAccess.isAtLimit) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-red-600">
          Quote limit reached ({quotesAccess.current}/{quotesAccess.limit})
        </div>
        <UpgradePrompt 
          feature="Unlimited Quotes"
          message="Create unlimited quotes with a pro subscription"
        />
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {quotesAccess.limit && (
        <div className="text-xs text-gray-500">
          {quotesAccess.current}/{quotesAccess.limit} quotes this month
          <Progress value={usagePercent} className="mt-1" />
        </div>
      )}
      <Button onClick={handleCreateQuote}>
        Create New Quote
      </Button>
    </div>
  )
}
```

#### Server-Side with Usage Tracking
```typescript
// src/features/quotes/actions/createQuote.ts
export async function createQuote(data: CreateQuoteData) {
  // Check quota before creation
  const quotesAccess = await checkFeatureAccess('max_quotes')
  if (!quotesAccess.hasAccess) {
    throw new Error(`Quote limit exceeded. You've used ${quotesAccess.current} of ${quotesAccess.limit} quotes this month.`)
  }
  
  // Create the quote
  const quote = await db.quotes.create(data)
  
  // Increment usage counter
  await incrementUsage(quote.user_id, 'quotes', 1)
  
  // Check if user is approaching limit
  const newUsage = await getCurrentUsage(quote.user_id, 'quotes')
  if (newUsage.current >= newUsage.limit * 0.8) {
    // Trigger approaching limit notification
    await sendLimitWarning(quote.user_id, newUsage)
  }
  
  return quote
}
```

### 3. Analytics Feature

#### Client-Side Dashboard
```typescript
// src/features/analytics/components/AnalyticsDashboard.tsx
export function AnalyticsDashboard() {
  const { canAccess } = useFeatureAccess()
  const analyticsAccess = canAccess('analytics_access')
  
  if (!analyticsAccess.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <LockedAnalyticsPreview />
        <UpgradePrompt 
          feature="Analytics Dashboard"
          benefits={[
            'Detailed quote performance metrics',
            'Client relationship analytics', 
            'Revenue tracking and forecasting',
            'Custom date range analysis'
          ]}
        />
      </div>
    )
  }
  
  return <FullAnalyticsDashboard />
}
```

#### Server-Side Data Access
```typescript
// src/app/(app)/analytics/page.tsx
export default async function AnalyticsPage() {
  const hasAccess = await checkFeatureAccess('analytics_access')
  
  if (!hasAccess) {
    return <AnalyticsDashboard hasAccess={false} data={null} />
  }
  
  // Fetch real analytics data
  const analyticsData = await getAnalyticsData()
  
  return <AnalyticsDashboard hasAccess={true} data={analyticsData} />
}
```

## Upgrade Prompt Components

### 1. Compact Upgrade Prompt
```typescript
// src/components/UpgradePrompt/CompactUpgradePrompt.tsx
interface CompactUpgradePromptProps {
  feature: string
  message?: string
  className?: string
}

export function CompactUpgradePrompt({ feature, message, className }: CompactUpgradePromptProps) {
  return (
    <div className={`border border-yellow-200 bg-yellow-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center">
        <Crown className="w-4 h-4 text-yellow-600 mr-2" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">{feature}</p>
          {message && <p className="text-xs text-yellow-600">{message}</p>}
        </div>
        <Button size="sm" variant="outline" className="ml-2">
          Upgrade
        </Button>
      </div>
    </div>
  )
}
```

### 2. Full Upgrade Modal
```typescript
// src/components/UpgradePrompt/UpgradeModal.tsx
interface UpgradeModalProps {
  feature: string
  open: boolean
  onClose: () => void
  benefits: string[]
}

export function UpgradeModal({ feature, open, onClose, benefits }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Unlock {feature} and more premium features
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center text-sm">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                {benefit}
              </li>
            ))}
          </ul>
          
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleUpgrade}>
              Upgrade Now - $29/month
            </Button>
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Testing Patterns

### 1. Feature Access Testing
```typescript
// tests/hooks/useFeatureAccess.test.ts
describe('useFeatureAccess', () => {
  it('should return free features for users without subscription', async () => {
    mockSupabaseQuery({ data: null, error: null })
    
    const { result } = renderHook(() => useFeatureAccess())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.canAccess('pdf_export').hasAccess).toBe(false)
    expect(result.current.canAccess('max_quotes').limit).toBe(5)
  })
  
  it('should return pro features for subscribed users', async () => {
    mockSupabaseQuery({
      data: {
        prices: {
          products: {
            metadata: {
              pdf_export: 'true',
              max_quotes: '-1'
            }
          }
        }
      }
    })
    
    const { result } = renderHook(() => useFeatureAccess())
    
    await waitFor(() => {
      expect(result.current.canAccess('pdf_export').hasAccess).toBe(true)
      expect(result.current.canAccess('max_quotes').limit).toBeUndefined()
    })
  })
})
```

### 2. Component Testing
```typescript
// tests/components/PDFExportButton.test.tsx
describe('PDFExportButton', () => {
  it('shows upgrade prompt for free users', () => {
    mockFeatureAccess({ pdf_export: false })
    
    render(<PDFExportButton quoteId="123" />)
    
    expect(screen.getByText(/upgrade/i)).toBeInTheDocument()
    expect(screen.queryByText(/export pdf/i)).not.toBeInTheDocument()
  })
  
  it('shows export button for pro users', () => {
    mockFeatureAccess({ pdf_export: true })
    
    render(<PDFExportButton quoteId="123" />)
    
    expect(screen.getByText(/export pdf/i)).toBeInTheDocument()
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument()
  })
})
```

### 3. API Testing
```typescript
// tests/api/pdf.test.ts
describe('/api/quotes/[id]/pdf', () => {
  it('returns 403 for users without pdf_export feature', async () => {
    mockUserSubscription({ pdf_export: 'false' })
    
    const response = await POST(mockRequest)
    
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      error: 'PDF export requires a pro subscription'
    })
  })
  
  it('generates PDF for users with pdf_export feature', async () => {
    mockUserSubscription({ pdf_export: 'true' })
    
    const response = await POST(mockRequest)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
  })
})
```

## Error Handling

### 1. Graceful Degradation
```typescript
export function FeatureComponent() {
  const { canAccess, loading, error } = useFeatureAccess()
  
  if (loading) {
    return <FeatureSkeleton />
  }
  
  if (error) {
    // Fallback to free tier on error
    console.error('Feature access check failed:', error)
    return <FreeVersionComponent />
  }
  
  const access = canAccess('feature_key')
  return access.hasAccess ? <PremiumComponent /> : <FreeVersionComponent />
}
```

### 2. Error Boundaries
```typescript
// src/components/FeatureErrorBoundary.tsx
export class FeatureErrorBoundary extends React.Component {
  state = { hasError: false }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Feature access error:', error, errorInfo)
    // Log to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">Feature temporarily unavailable</p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

## Performance Optimization

### 1. Feature Access Caching
```typescript
// src/hooks/useFeatureAccess.ts
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useFeatureAccess() {
  const cacheKey = `features:${userId}`
  
  // Check cache first
  const cached = featureCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  // Fetch and cache
  const data = fetchFeatureData()
  featureCache.set(cacheKey, { data, timestamp: Date.now() })
  
  return data
}
```

### 2. Lazy Loading Premium Components
```typescript
// src/components/LazyPremiumFeature.tsx
const PremiumComponent = lazy(() => import('./PremiumComponent'))

export function LazyPremiumFeature() {
  const { canAccess } = useFeatureAccess()
  
  if (!canAccess('premium_feature').hasAccess) {
    return <UpgradePrompt />
  }
  
  return (
    <Suspense fallback={<FeatureSkeleton />}>
      <PremiumComponent />
    </Suspense>
  )
}
```

This guide provides comprehensive patterns for implementing consistent, testable, and performant feature gating throughout QuoteKit.