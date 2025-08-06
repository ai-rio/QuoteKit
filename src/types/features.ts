/**
 * Feature Access Management - Type Definitions
 * 
 * This file defines the core types and configurations for the feature gating system.
 * Features are stored in Stripe product metadata and checked against user subscriptions.
 */

// =====================================================
// CORE FEATURE TYPES
// =====================================================

/**
 * Available features that can be gated by subscription tier
 */
export type FeatureKey = 
  | 'max_quotes'
  | 'pdf_export' 
  | 'analytics_access'
  | 'email_templates'
  | 'bulk_operations'
  | 'custom_branding'
  | 'priority_support'
  | 'api_access'
  | 'advanced_reporting'
  | 'team_collaboration'

/**
 * Feature configuration for a subscription plan
 */
export interface PlanFeatures {
  // Quote Management
  max_quotes: number | -1  // -1 = unlimited
  pdf_export: boolean
  bulk_operations: boolean
  
  // Analytics & Reporting  
  analytics: boolean  // Alias for analytics_access
  analytics_access: boolean
  advanced_reporting: boolean
  
  // Communication
  email_templates: boolean
  
  // Customization
  custom_branding: boolean
  
  // Support & Integration
  priority_support: boolean
  api_access: boolean
  
  // Collaboration
  team_collaboration: boolean
}

/**
 * Feature metadata with display information
 */
export interface FeatureDefinition {
  key: FeatureKey
  name: string
  description: string
  category: FeatureCategory
  type: FeatureType
  defaultValue: boolean | number
  premiumOnly: boolean
}

/**
 * Feature categories for organization in admin UI
 */
export type FeatureCategory = 
  | 'core'
  | 'analytics' 
  | 'communication'
  | 'customization'
  | 'integration'
  | 'collaboration'

/**
 * Feature value types
 */
export type FeatureType = 'boolean' | 'number' | 'unlimited'

/**
 * Feature access result with usage information
 */
export interface FeatureAccess {
  hasAccess: boolean
  limit?: number
  current?: number
  isAtLimit?: boolean
  upgradeRequired: boolean
}

/**
 * User's current feature usage
 */
export interface FeatureUsage {
  quotes_count: number
  pdf_exports_count?: number
  api_calls_count?: number
  bulk_operations_count?: number
}

// =====================================================
// DEFAULT FEATURE CONFIGURATIONS
// =====================================================

/**
 * Free tier feature limitations
 */
export const FREE_PLAN_FEATURES: PlanFeatures = {
  // Core limitations for free tier
  max_quotes: 5,
  pdf_export: false,
  bulk_operations: false,
  
  // No analytics access
  analytics: false,
  analytics_access: false,
  advanced_reporting: false,
  
  // Basic communication only
  email_templates: false,
  
  // No customization
  custom_branding: false,
  
  // Standard support only
  priority_support: false,
  api_access: false,
  
  // No collaboration features
  team_collaboration: false,
}

/**
 * Premium tier feature access
 */
export const PREMIUM_PLAN_FEATURES: PlanFeatures = {
  // Unlimited core features
  max_quotes: -1, // unlimited
  pdf_export: true,
  bulk_operations: true,
  
  // Full analytics access
  analytics: true,
  analytics_access: true,
  advanced_reporting: true,
  
  // Enhanced communication
  email_templates: true,
  
  // Full customization
  custom_branding: true,
  
  // Premium support and integration
  priority_support: true,
  api_access: true,
  
  // Collaboration features
  team_collaboration: true,
}

/**
 * Feature definitions with metadata for admin UI
 */
export const FEATURE_DEFINITIONS: Record<FeatureKey, FeatureDefinition> = {
  max_quotes: {
    key: 'max_quotes',
    name: 'Quote Limit',
    description: 'Maximum number of quotes that can be created',
    category: 'core',
    type: 'unlimited',
    defaultValue: 5,
    premiumOnly: false,
  },
  pdf_export: {
    key: 'pdf_export',
    name: 'PDF Export',
    description: 'Export quotes as professional PDF documents',
    category: 'core',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
  bulk_operations: {
    key: 'bulk_operations',
    name: 'Bulk Operations',
    description: 'Select and manage multiple quotes at once',
    category: 'core',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
  analytics_access: {
    key: 'analytics_access',
    name: 'Analytics Dashboard',
    description: 'Access to business analytics and insights',
    category: 'analytics',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
  advanced_reporting: {
    key: 'advanced_reporting',
    name: 'Advanced Reporting',
    description: 'Detailed reports and data export capabilities',
    category: 'analytics',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
  email_templates: {
    key: 'email_templates',
    name: 'Email Templates',
    description: 'Custom email templates for quote delivery',
    category: 'communication',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
  custom_branding: {
    key: 'custom_branding',
    name: 'Custom Branding',
    description: 'Add your logo and branding to quotes and emails',
    category: 'customization',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
  priority_support: {
    key: 'priority_support',
    name: 'Priority Support',
    description: 'Faster response times and dedicated support',
    category: 'integration',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
  api_access: {
    key: 'api_access',
    name: 'API Access',
    description: 'Programmatic access to your quote data',
    category: 'integration',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
  team_collaboration: {
    key: 'team_collaboration',
    name: 'Team Collaboration',
    description: 'Share quotes and collaborate with team members',
    category: 'collaboration',
    type: 'boolean',
    defaultValue: false,
    premiumOnly: true,
  },
}

// =====================================================
// FEATURE VALIDATION UTILITIES
// =====================================================

/**
 * Validates a feature configuration object
 */
export function validateFeatureConfig(features: Partial<PlanFeatures>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate max_quotes
  if (features.max_quotes !== undefined) {
    if (typeof features.max_quotes !== 'number' || 
        (features.max_quotes < -1 || features.max_quotes === 0)) {
      errors.push('max_quotes must be a positive number or -1 for unlimited')
    }
  }

  // Validate boolean features
  const booleanFeatures: (keyof PlanFeatures)[] = [
    'pdf_export', 'analytics_access', 'email_templates', 'bulk_operations',
    'custom_branding', 'priority_support', 'api_access', 'advanced_reporting',
    'team_collaboration'
  ]

  booleanFeatures.forEach(feature => {
    if (features[feature] !== undefined && typeof features[feature] !== 'boolean') {
      errors.push(`${feature} must be a boolean value`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Merges feature configurations with defaults
 */
export function mergeWithDefaults(
  features: Partial<PlanFeatures>, 
  defaults: PlanFeatures = FREE_PLAN_FEATURES
): PlanFeatures {
  return {
    ...defaults,
    ...features
  }
}

/**
 * Converts Stripe metadata to PlanFeatures
 */
export function parseStripeMetadata(metadata: Record<string, string> | null | undefined): PlanFeatures {
  if (!metadata) {
    return FREE_PLAN_FEATURES
  }

  const features: Partial<PlanFeatures> = {}

  // Parse max_quotes
  if (metadata.max_quotes) {
    const maxQuotes = parseInt(metadata.max_quotes, 10)
    if (!isNaN(maxQuotes)) {
      features.max_quotes = maxQuotes
    }
  }

  // Parse boolean features
  const booleanFeatures: (keyof PlanFeatures)[] = [
    'pdf_export', 'analytics_access', 'email_templates', 'bulk_operations',
    'custom_branding', 'priority_support', 'api_access', 'advanced_reporting',
    'team_collaboration'
  ]

  booleanFeatures.forEach(feature => {
    if (metadata[feature]) {
      (features as any)[feature] = metadata[feature] === 'true'
    }
  })

  return mergeWithDefaults(features)
}

/**
 * Converts PlanFeatures to Stripe metadata format
 */
export function toStripeMetadata(features: PlanFeatures): Record<string, string> {
  const metadata: Record<string, string> = {}

  // Convert all features to string format for Stripe metadata
  Object.entries(features).forEach(([key, value]) => {
    metadata[key] = String(value)
  })

  return metadata
}

/**
 * Gets feature categories for admin UI organization
 */
export function getFeaturesByCategory(): Record<FeatureCategory, FeatureDefinition[]> {
  const categorized: Record<FeatureCategory, FeatureDefinition[]> = {
    core: [],
    analytics: [],
    communication: [],
    customization: [],
    integration: [],
    collaboration: [],
  }

  Object.entries(FEATURE_DEFINITIONS).forEach(([key, feature]) => {
    categorized[feature.category].push(feature)
  })

  return categorized
}

/**
 * Checks if a feature is premium-only
 */
export function isPremiumFeature(featureKey: FeatureKey): boolean {
  return FEATURE_DEFINITIONS[featureKey]?.premiumOnly ?? false
}

/**
 * Gets the display name for a feature
 */
export function getFeatureName(featureKey: FeatureKey): string {
  return FEATURE_DEFINITIONS[featureKey]?.name ?? featureKey
}

/**
 * Gets the description for a feature
 */
export function getFeatureDescription(featureKey: FeatureKey): string {
  return FEATURE_DEFINITIONS[featureKey]?.description ?? ''
}

// =====================================================
// PLAN DETECTION UTILITIES
// =====================================================

/**
 * Determines if a plan is considered "free" based on its features
 */
export function isFreeplan(features: PlanFeatures): boolean {
  // A plan is considered free if it has significant limitations
  return features.max_quotes <= 5 && 
         !features.pdf_export && 
         !features.analytics_access
}

/**
 * Determines if a plan is considered "premium" based on its features
 */
export function isPremiumPlan(features: PlanFeatures): boolean {
  // A plan is premium if it has unlimited quotes or premium features
  return features.max_quotes === -1 || 
         features.pdf_export || 
         features.analytics_access ||
         features.custom_branding
}

/**
 * Gets a human-readable plan tier name
 */
export function getPlanTierName(features: PlanFeatures): string {
  if (isFreeplan(features)) return 'Free'
  if (isPremiumPlan(features)) return 'Premium'
  return 'Custom'
}

// =====================================================
// TYPE GUARDS
// =====================================================

/**
 * Type guard to check if a value is a valid FeatureKey
 */
export function isFeatureKey(key: string): key is FeatureKey {
  return key in FEATURE_DEFINITIONS
}

/**
 * Type guard to check if a value is a valid PlanFeatures object
 */
export function isPlanFeatures(obj: any): obj is PlanFeatures {
  if (!obj || typeof obj !== 'object') return false
  
  const validation = validateFeatureConfig(obj)
  return validation.isValid
}
