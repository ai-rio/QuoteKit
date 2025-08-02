import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'
import { 
  type FeatureKey, 
  type PlanFeatures,
  parseStripeMetadata,
  FREE_PLAN_FEATURES 
} from '@/types/features'

/**
 * Server-side feature access validation
 */
export async function validateFeatureAccess(
  featureKey: FeatureKey,
  userId?: string
): Promise<{
  hasAccess: boolean
  features: PlanFeatures
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get user if not provided
    let user_id = userId
    if (!user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return {
          hasAccess: false,
          features: FREE_PLAN_FEATURES,
          error: 'Unauthorized'
        }
      }
      user_id = user.id
    }

    // Get user's subscription and features
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        prices:stripe_price_id (
          *,
          products:stripe_product_id (
            *
          )
        )
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      // User has no active subscription, use free plan features
      const features = FREE_PLAN_FEATURES
      const hasAccess = checkFeatureAccess(features, featureKey, user_id)
      
      return {
        hasAccess,
        features,
        error: subError ? 'Subscription error' : undefined
      }
    }

    // Parse features from subscription metadata
    const features = parseStripeMetadata(subscription.prices?.products?.metadata)
    const hasAccess = await checkFeatureAccess(features, featureKey, user_id)

    return {
      hasAccess,
      features
    }

  } catch (error) {
    console.error('Error validating feature access:', error)
    return {
      hasAccess: false,
      features: FREE_PLAN_FEATURES,
      error: 'Internal server error'
    }
  }
}

/**
 * Check if user has access to a specific feature
 */
async function checkFeatureAccess(
  features: PlanFeatures,
  featureKey: FeatureKey,
  userId: string
): Promise<boolean> {
  const featureValue = features[featureKey]

  // Handle boolean features
  if (typeof featureValue === 'boolean') {
    return featureValue
  }

  // Handle numeric features (like max_quotes)
  if (typeof featureValue === 'number') {
    if (featureKey === 'max_quotes') {
      // Unlimited access
      if (featureValue === -1) {
        return true
      }

      // Check current usage
      const supabase = createSupabaseServerClient()
      const { count: currentUsage, error } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_template', false)

      if (error) {
        console.error('Error checking quote usage:', error)
        return false
      }

      return (currentUsage || 0) < featureValue
    }
  }

  // Default to no access
  return false
}

/**
 * Middleware function to protect API routes with feature gating
 */
export function withFeatureGate(featureKey: FeatureKey) {
  return async function featureGateMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Validate feature access
      const validation = await validateFeatureAccess(featureKey)
      
      if (!validation.hasAccess) {
        return NextResponse.json(
          { 
            error: 'Feature access denied',
            feature: featureKey,
            message: `This feature requires a premium subscription. Current plan does not include ${featureKey}.`,
            upgradeRequired: true
          },
          { status: 403 }
        )
      }

      // Feature access granted, proceed with handler
      return handler(request)

    } catch (error) {
      console.error('Error in feature gate middleware:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to create feature-gated API route handlers
 */
export function createFeatureGatedHandler(
  featureKey: FeatureKey,
  handlers: {
    GET?: (request: NextRequest) => Promise<NextResponse>
    POST?: (request: NextRequest) => Promise<NextResponse>
    PUT?: (request: NextRequest) => Promise<NextResponse>
    DELETE?: (request: NextRequest) => Promise<NextResponse>
  }
) {
  const gatedHandlers: any = {}

  Object.entries(handlers).forEach(([method, handler]) => {
    if (handler) {
      gatedHandlers[method] = withFeatureGate(featureKey)(handler)
    }
  })

  return gatedHandlers
}

/**
 * Validate multiple features at once
 */
export async function validateMultipleFeatures(
  features: FeatureKey[],
  userId?: string
): Promise<{
  hasAccess: boolean
  accessMap: Record<FeatureKey, boolean>
  features: PlanFeatures
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get user if not provided
    let user_id = userId
    if (!user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return {
          hasAccess: false,
          accessMap: features.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<FeatureKey, boolean>),
          features: FREE_PLAN_FEATURES,
          error: 'Unauthorized'
        }
      }
      user_id = user.id
    }

    // Get user's subscription and features
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        prices:stripe_price_id (
          *,
          products:stripe_product_id (
            *
          )
        )
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    const planFeatures = subscription?.prices?.products?.metadata 
      ? parseStripeMetadata(subscription.prices.products.metadata)
      : FREE_PLAN_FEATURES

    // Check access for each feature
    const accessMap: Record<FeatureKey, boolean> = {} as Record<FeatureKey, boolean>
    let hasOverallAccess = true

    for (const featureKey of features) {
      const hasAccess = await checkFeatureAccess(planFeatures, featureKey, user_id)
      accessMap[featureKey] = hasAccess
      if (!hasAccess) {
        hasOverallAccess = false
      }
    }

    return {
      hasAccess: hasOverallAccess,
      accessMap,
      features: planFeatures
    }

  } catch (error) {
    console.error('Error validating multiple features:', error)
    return {
      hasAccess: false,
      accessMap: features.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<FeatureKey, boolean>),
      features: FREE_PLAN_FEATURES,
      error: 'Internal server error'
    }
  }
}
