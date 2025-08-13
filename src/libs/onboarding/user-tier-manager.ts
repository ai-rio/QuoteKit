/**
 * User Tier Manager - S2.1 Implementation
 * Manages user tier detection and feature access for onboarding tours
 */

import { FREE_PLAN_FEATURES, isFreeplan, isPremiumPlan, PlanFeatures, PREMIUM_PLAN_FEATURES } from '@/types/features'

export type UserTier = 'free' | 'pro' | 'enterprise'

export interface UserTierInfo {
  tier: UserTier
  features: PlanFeatures
  quotesUsed: number
  quotesLimit: number
  isAtLimit: boolean
  daysUntilExpiry?: number
  trialActive?: boolean
}

/**
 * Detects user tier based on subscription and feature access
 */
export async function detectUserTier(): Promise<UserTierInfo> {
  try {
    // In a real implementation, this would fetch from Supabase
    // For now, we'll simulate based on localStorage or default to free
    const mockUserData = getMockUserData()
    
    const features = mockUserData.features || FREE_PLAN_FEATURES
    const tier = determineTierFromFeatures(features)
    
    return {
      tier,
      features,
      quotesUsed: mockUserData.quotesUsed || 0,
      quotesLimit: features.max_quotes === -1 ? Infinity : features.max_quotes,
      isAtLimit: mockUserData.quotesUsed >= features.max_quotes && features.max_quotes !== -1,
      daysUntilExpiry: mockUserData.daysUntilExpiry,
      trialActive: mockUserData.trialActive
    }
  } catch (error) {
    console.warn('Failed to detect user tier, defaulting to free:', error)
    return {
      tier: 'free',
      features: FREE_PLAN_FEATURES,
      quotesUsed: 0,
      quotesLimit: FREE_PLAN_FEATURES.max_quotes,
      isAtLimit: false
    }
  }
}

/**
 * Determines tier from feature configuration
 */
function determineTierFromFeatures(features: PlanFeatures): UserTier {
  if (isFreeplan(features)) return 'free'
  if (isPremiumPlan(features)) {
    // Distinguish between pro and enterprise based on advanced features
    if (features.team_collaboration && features.api_access) {
      return 'enterprise'
    }
    return 'pro'
  }
  return 'free' // Default fallback
}

/**
 * Mock user data for development/testing
 * In production, this would be replaced with actual Supabase queries
 */
function getMockUserData() {
  if (typeof window === 'undefined') {
    return { features: FREE_PLAN_FEATURES, quotesUsed: 0 }
  }
  
  // Check localStorage for mock tier setting (for development)
  const mockTier = localStorage.getItem('mock-user-tier')
  
  switch (mockTier) {
    case 'pro':
      return {
        features: PREMIUM_PLAN_FEATURES,
        quotesUsed: 15,
        trialActive: false
      }
    case 'enterprise':
      return {
        features: {
          ...PREMIUM_PLAN_FEATURES,
          team_collaboration: true,
          api_access: true
        },
        quotesUsed: 50,
        trialActive: false
      }
    case 'free-at-limit':
      return {
        features: FREE_PLAN_FEATURES,
        quotesUsed: 5, // At the free limit
        trialActive: false
      }
    case 'trial':
      return {
        features: PREMIUM_PLAN_FEATURES,
        quotesUsed: 2,
        trialActive: true,
        daysUntilExpiry: 12
      }
    default:
      return {
        features: FREE_PLAN_FEATURES,
        quotesUsed: 2,
        trialActive: false
      }
  }
}

/**
 * Checks if user has access to a specific feature
 */
export function hasFeatureAccess(tierInfo: UserTierInfo, feature: keyof PlanFeatures): boolean {
  return Boolean(tierInfo.features[feature])
}

/**
 * Gets upgrade recommendations based on user tier and usage
 */
export function getUpgradeRecommendations(tierInfo: UserTierInfo): {
  shouldShowUpgrade: boolean
  urgency: 'low' | 'medium' | 'high'
  primaryFeature: string
  benefits: string[]
  ctaText: string
} {
  if (tierInfo.tier !== 'free') {
    return {
      shouldShowUpgrade: false,
      urgency: 'low',
      primaryFeature: '',
      benefits: [],
      ctaText: ''
    }
  }
  
  const urgency = tierInfo.isAtLimit ? 'high' : 
                  tierInfo.quotesUsed >= tierInfo.quotesLimit * 0.8 ? 'medium' : 'low'
  
  const benefits = [
    'Unlimited quotes',
    'Professional PDF export',
    'Business analytics',
    'Custom branding',
    'Priority support'
  ]
  
  return {
    shouldShowUpgrade: true,
    urgency,
    primaryFeature: tierInfo.isAtLimit ? 'Unlimited Quotes' : 'Professional Features',
    benefits,
    ctaText: urgency === 'high' ? 'Upgrade Now' : 'Start Free Trial'
  }
}

/**
 * Gets tier-specific tour recommendations
 */
export function getTierSpecificTours(tierInfo: UserTierInfo): string[] {
  const baseTours = ['welcome', 'settings', 'quote-creation', 'item-library']
  
  switch (tierInfo.tier) {
    case 'free':
      return [
        ...baseTours,
        'freemium-highlights', // Show upgrade opportunities
        'contextual-help'
      ]
    case 'pro':
      return [
        ...baseTours,
        'pro-features', // Show pro feature overview
        'interactive-tutorial', // Advanced tutorials
        'contextual-help'
      ]
    case 'enterprise':
      return [
        ...baseTours,
        'pro-features',
        'interactive-tutorial',
        'personalized-onboarding', // Full personalization
        'contextual-help'
      ]
    default:
      return baseTours
  }
}

/**
 * Gets personalized onboarding content based on user tier and usage
 */
export function getPersonalizedContent(tierInfo: UserTierInfo): {
  welcomeMessage: string
  focusAreas: string[]
  recommendedActions: string[]
  tips: string[]
} {
  const baseContent = {
    welcomeMessage: 'Welcome to LawnQuote! Let\'s get you set up for success.',
    focusAreas: ['Quote Creation', 'Client Management', 'Business Growth'],
    recommendedActions: ['Set up company profile', 'Add your services', 'Create first quote'],
    tips: ['Use categories to organize services', 'Set competitive pricing', 'Follow up promptly']
  }
  
  switch (tierInfo.tier) {
    case 'free':
      return {
        ...baseContent,
        welcomeMessage: `Welcome to LawnQuote! You have ${tierInfo.quotesLimit - tierInfo.quotesUsed} quotes remaining on your free plan.`,
        focusAreas: ['Quick Setup', 'First Quote', 'Upgrade Benefits'],
        tips: [
          ...baseContent.tips,
          'Consider upgrading for unlimited quotes',
          'Professional PDFs impress clients'
        ]
      }
    case 'pro':
      return {
        ...baseContent,
        welcomeMessage: 'Welcome to LawnQuote Pro! You have access to all premium features.',
        focusAreas: ['Advanced Features', 'Analytics', 'Branding'],
        recommendedActions: [
          ...baseContent.recommendedActions,
          'Set up custom branding',
          'Explore analytics dashboard'
        ],
        tips: [
          ...baseContent.tips,
          'Use analytics to optimize pricing',
          'Custom branding builds trust'
        ]
      }
    case 'enterprise':
      return {
        ...baseContent,
        welcomeMessage: 'Welcome to LawnQuote Enterprise! Let\'s optimize your team\'s workflow.',
        focusAreas: ['Team Collaboration', 'Advanced Analytics', 'API Integration'],
        recommendedActions: [
          ...baseContent.recommendedActions,
          'Set up team access',
          'Configure API integration',
          'Review advanced analytics'
        ],
        tips: [
          ...baseContent.tips,
          'Use team features for collaboration',
          'API integration streamlines workflow',
          'Advanced analytics drive growth'
        ]
      }
    default:
      return baseContent
  }
}

/**
 * Utility functions for tier management
 */
export const TierUtils = {
  /**
   * Sets mock tier for development/testing
   */
  setMockTier(tier: UserTier | 'free-at-limit' | 'trial') {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock-user-tier', tier)
    }
  },
  
  /**
   * Clears mock tier setting
   */
  clearMockTier() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock-user-tier')
    }
  },
  
  /**
   * Gets tier display name
   */
  getTierDisplayName(tier: UserTier): string {
    const names = {
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise'
    }
    return names[tier]
  },
  
  /**
   * Gets tier color for UI
   */
  getTierColor(tier: UserTier): string {
    const colors = {
      free: '#6b7280', // Gray
      pro: '#3b82f6', // Blue
      enterprise: '#7c3aed' // Purple
    }
    return colors[tier]
  },
  
  /**
   * Checks if tier allows feature
   */
  canAccessFeature(tier: UserTier, feature: keyof PlanFeatures): boolean {
    const features = tier === 'free' ? FREE_PLAN_FEATURES : PREMIUM_PLAN_FEATURES
    return Boolean(features[feature])
  }
}
