/**
 * Feature Flag System for Gradual Payment System Rollout
 * Enables safe, controlled deployment of payment features
 */

import { createClient } from '@supabase/supabase-js';

import { Database } from '@/libs/supabase/types';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  userSegments: string[];
  conditions: FeatureFlagCondition[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'email' | 'subscription_tier' | 'geographic' | 'custom';
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface FeatureFlagEvaluation {
  enabled: boolean;
  reason: string;
  metadata?: Record<string, any>;
}

export class FeatureFlagManager {
  private supabase: ReturnType<typeof createClient<Database>>;
  private cache: Map<string, FeatureFlag> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Evaluate a feature flag for a specific user
   */
  async isFeatureEnabled(
    flagKey: string,
    userId?: string,
    context?: Record<string, any>
  ): Promise<FeatureFlagEvaluation> {
    try {
      const flag = await this.getFeatureFlag(flagKey);
      
      if (!flag) {
        return {
          enabled: false,
          reason: 'Flag not found'
        };
      }

      if (!flag.enabled) {
        return {
          enabled: false,
          reason: 'Flag disabled globally'
        };
      }

      // Check rollout percentage
      if (flag.rolloutPercentage < 100) {
        const userHash = this.getUserHash(userId || 'anonymous', flagKey);
        if (userHash > flag.rolloutPercentage) {
          return {
            enabled: false,
            reason: `User outside rollout percentage (${flag.rolloutPercentage}%)`
          };
        }
      }

      // Check user segments
      if (flag.userSegments.length > 0 && userId) {
        const userSegment = await this.getUserSegment(userId);
        if (!flag.userSegments.includes(userSegment)) {
          return {
            enabled: false,
            reason: `User segment ${userSegment} not in allowed segments`
          };
        }
      }

      // Check conditions
      if (flag.conditions.length > 0) {
        const conditionResult = await this.evaluateConditions(
          flag.conditions,
          userId,
          context
        );
        
        if (!conditionResult.passed) {
          return {
            enabled: false,
            reason: conditionResult.reason
          };
        }
      }

      return {
        enabled: true,
        reason: 'All conditions met',
        metadata: flag.metadata
      };
    } catch (error) {
      console.error(`Error evaluating feature flag ${flagKey}:`, error);
      return {
        enabled: false,
        reason: 'Evaluation error - defaulting to disabled'
      };
    }
  }

  /**
   * Payment system specific feature flags
   */
  async isPaymentFeatureEnabled(
    feature: PaymentFeature,
    userId?: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const evaluation = await this.isFeatureEnabled(
      `payment_${feature}`,
      userId,
      context
    );
    return evaluation.enabled;
  }

  /**
   * Subscription system specific feature flags
   */
  async isSubscriptionFeatureEnabled(
    feature: SubscriptionFeature,
    userId?: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const evaluation = await this.isFeatureEnabled(
      `subscription_${feature}`,
      userId,
      context
    );
    return evaluation.enabled;
  }

  /**
   * Create or update a feature flag
   */
  async setFeatureFlag(flag: Partial<FeatureFlag> & { key: string }): Promise<void> {
    const existingFlag = await this.getFeatureFlag(flag.key);
    
    const flagData: FeatureFlag = {
      key: flag.key,
      enabled: flag.enabled ?? false,
      rolloutPercentage: flag.rolloutPercentage ?? 0,
      userSegments: flag.userSegments ?? [],
      conditions: flag.conditions ?? [],
      metadata: flag.metadata ?? {},
      createdAt: existingFlag?.createdAt ?? new Date(),
      updatedAt: new Date()
    };

    // Store in database (assuming a feature_flags table exists)
    const { error } = await this.supabase
      .from('feature_flags' as any)
      .upsert(flagData);

    if (error) {
      throw new Error(`Failed to set feature flag: ${error.message}`);
    }

    // Update cache
    this.cache.set(flag.key, flagData);
    this.cacheExpiry.set(flag.key, Date.now() + this.CACHE_TTL);
  }

  /**
   * Progressive rollout management
   */
  async updateRolloutPercentage(flagKey: string, percentage: number): Promise<void> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    const flag = await this.getFeatureFlag(flagKey);
    if (!flag) {
      throw new Error(`Feature flag ${flagKey} not found`);
    }

    await this.setFeatureFlag({
      ...flag,
      rolloutPercentage: percentage
    });

    console.log(`Updated rollout percentage for ${flagKey} to ${percentage}%`);
  }

  /**
   * Emergency flag controls
   */
  async emergencyDisable(flagKey: string, reason: string): Promise<void> {
    const flag = await this.getFeatureFlag(flagKey);
    if (!flag) {
      throw new Error(`Feature flag ${flagKey} not found`);
    }

    await this.setFeatureFlag({
      ...flag,
      enabled: false,
      metadata: {
        ...flag.metadata,
        emergencyDisabled: true,
        emergencyReason: reason,
        emergencyDisabledAt: new Date().toISOString()
      }
    });

    console.log(`Emergency disabled flag ${flagKey}: ${reason}`);
  }

  async emergencyEnable(flagKey: string): Promise<void> {
    const flag = await this.getFeatureFlag(flagKey);
    if (!flag) {
      throw new Error(`Feature flag ${flagKey} not found`);
    }

    const { emergencyDisabled, emergencyReason, emergencyDisabledAt, ...cleanMetadata } = flag.metadata;

    await this.setFeatureFlag({
      ...flag,
      enabled: true,
      metadata: {
        ...cleanMetadata,
        emergencyEnabledAt: new Date().toISOString()
      }
    });

    console.log(`Emergency enabled flag ${flagKey}`);
  }

  /**
   * Batch rollout management
   */
  async createGradualRollout(
    flagKey: string,
    stages: RolloutStage[]
  ): Promise<void> {
    const flag = await this.getFeatureFlag(flagKey) || {
      key: flagKey,
      enabled: false,
      rolloutPercentage: 0,
      userSegments: [],
      conditions: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store rollout plan in metadata
    await this.setFeatureFlag({
      ...flag,
      metadata: {
        ...flag.metadata,
        rolloutPlan: {
          stages,
          currentStage: 0,
          createdAt: new Date().toISOString()
        }
      }
    });

    console.log(`Created gradual rollout plan for ${flagKey} with ${stages.length} stages`);
  }

  async advanceRolloutStage(flagKey: string): Promise<void> {
    const flag = await this.getFeatureFlag(flagKey);
    if (!flag || !flag.metadata.rolloutPlan) {
      throw new Error(`No rollout plan found for ${flagKey}`);
    }

    const rolloutPlan = flag.metadata.rolloutPlan;
    const nextStage = rolloutPlan.currentStage + 1;

    if (nextStage >= rolloutPlan.stages.length) {
      throw new Error(`No more stages in rollout plan for ${flagKey}`);
    }

    const stage = rolloutPlan.stages[nextStage];

    await this.setFeatureFlag({
      ...flag,
      enabled: stage.enabled,
      rolloutPercentage: stage.percentage,
      userSegments: stage.userSegments || flag.userSegments,
      metadata: {
        ...flag.metadata,
        rolloutPlan: {
          ...rolloutPlan,
          currentStage: nextStage,
          lastAdvancedAt: new Date().toISOString()
        }
      }
    });

    console.log(`Advanced ${flagKey} to stage ${nextStage}: ${stage.name}`);
  }

  /**
   * A/B testing support
   */
  async createABTest(
    flagKey: string,
    variants: ABTestVariant[]
  ): Promise<void> {
    if (variants.reduce((sum, v) => sum + v.percentage, 0) !== 100) {
      throw new Error('AB test variant percentages must sum to 100');
    }

    const flag = await this.getFeatureFlag(flagKey) || {
      key: flagKey,
      enabled: true,
      rolloutPercentage: 100,
      userSegments: [],
      conditions: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.setFeatureFlag({
      ...flag,
      metadata: {
        ...flag.metadata,
        abTest: {
          variants,
          createdAt: new Date().toISOString()
        }
      }
    });
  }

  async getABTestVariant(
    flagKey: string,
    userId: string
  ): Promise<string | null> {
    const flag = await this.getFeatureFlag(flagKey);
    if (!flag || !flag.metadata.abTest) {
      return null;
    }

    const userHash = this.getUserHash(userId, flagKey);
    const variants = flag.metadata.abTest.variants;
    
    let cumulativePercentage = 0;
    for (const variant of variants) {
      cumulativePercentage += variant.percentage;
      if (userHash <= cumulativePercentage) {
        return variant.name;
      }
    }

    return variants[variants.length - 1].name;
  }

  // Private helper methods
  private async getFeatureFlag(key: string): Promise<FeatureFlag | null> {
    // Check cache first
    const cached = this.cache.get(key);
    const expiry = this.cacheExpiry.get(key);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await this.supabase
      .from('feature_flags' as any)
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) {
      return null;
    }

    const flag: FeatureFlag = {
      key: data.key,
      enabled: data.enabled,
      rolloutPercentage: data.rollout_percentage || 0,
      userSegments: data.user_segments || [],
      conditions: data.conditions || [],
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    // Cache the result
    this.cache.set(key, flag);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

    return flag;
  }

  private getUserHash(userId: string, flagKey: string): number {
    // Simple hash function for consistent user assignment
    let hash = 0;
    const input = `${userId}_${flagKey}`;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash) % 100;
  }

  private async getUserSegment(userId: string): Promise<string> {
    // Get user subscription tier or other segmentation criteria
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('price_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription?.price_id) {
      return 'free';
    }

    // Map price_id to segment
    if (subscription.price_id.includes('pro')) return 'pro';
    if (subscription.price_id.includes('premium')) return 'premium';
    
    return 'paid';
  }

  private async evaluateConditions(
    conditions: FeatureFlagCondition[],
    userId?: string,
    context?: Record<string, any>
  ): Promise<{ passed: boolean; reason: string }> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, userId, context);
      if (!result.passed) {
        return result;
      }
    }

    return { passed: true, reason: 'All conditions passed' };
  }

  private async evaluateCondition(
    condition: FeatureFlagCondition,
    userId?: string,
    context?: Record<string, any>
  ): Promise<{ passed: boolean; reason: string }> {
    let actualValue: any;

    switch (condition.type) {
      case 'user_id':
        actualValue = userId;
        break;
      case 'email':
        if (userId) {
          const { data: user } = await this.supabase.auth.admin.getUserById(userId);
          actualValue = user.user?.email;
        }
        break;
      case 'subscription_tier':
        actualValue = await this.getUserSegment(userId || '');
        break;
      case 'custom':
        actualValue = context?.[condition.value.key];
        break;
      default:
        return { passed: false, reason: `Unknown condition type: ${condition.type}` };
    }

    const passed = this.evaluateOperator(actualValue, condition.operator, condition.value);
    
    return {
      passed,
      reason: passed ? 'Condition met' : `Condition failed: ${actualValue} ${condition.operator} ${condition.value}`
    };
  }

  private evaluateOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return actual && actual.includes && actual.includes(expected);
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      default:
        return false;
    }
  }
}

// Types
export type PaymentFeature = 
  | 'stripe_checkout'
  | 'payment_methods'
  | 'subscription_management'
  | 'webhook_processing'
  | 'billing_portal'
  | 'invoice_generation'
  | 'tax_calculation'
  | 'dunning_management';

export type SubscriptionFeature =
  | 'plan_changes'
  | 'cancellation'
  | 'trial_management'
  | 'proration'
  | 'addon_management'
  | 'usage_tracking'
  | 'seats_management'
  | 'enterprise_features';

export interface RolloutStage {
  name: string;
  percentage: number;
  enabled: boolean;
  userSegments?: string[];
  duration?: number; // in hours
}

export interface ABTestVariant {
  name: string;
  percentage: number;
  metadata?: Record<string, any>;
}

// Predefined feature flag configurations for payment system
export const PAYMENT_FEATURE_FLAGS = {
  // Core payment features
  STRIPE_CHECKOUT: 'payment_stripe_checkout',
  PAYMENT_METHODS: 'payment_payment_methods',
  SUBSCRIPTION_MANAGEMENT: 'payment_subscription_management',
  WEBHOOK_PROCESSING: 'payment_webhook_processing',
  
  // Advanced payment features
  BILLING_PORTAL: 'payment_billing_portal',
  INVOICE_GENERATION: 'payment_invoice_generation',
  TAX_CALCULATION: 'payment_tax_calculation',
  DUNNING_MANAGEMENT: 'payment_dunning_management',
  
  // Subscription features
  PLAN_CHANGES: 'subscription_plan_changes',
  CANCELLATION: 'subscription_cancellation',
  TRIAL_MANAGEMENT: 'subscription_trial_management',
  PRORATION: 'subscription_proration',
  
  // UI/UX features
  NEW_ACCOUNT_PAGE: 'ui_new_account_page',
  ENHANCED_PRICING_PAGE: 'ui_enhanced_pricing_page',
  PAYMENT_METHOD_UI: 'ui_payment_method_ui',
  SUBSCRIPTION_ANALYTICS: 'ui_subscription_analytics'
} as const;

// Export singleton instance
export const featureFlagManager = new FeatureFlagManager();