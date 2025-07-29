/**
 * Clean Subscription Helper Functions v2.0
 * 
 * These helper functions work with the new clean subscription schema
 * and provide robust subscription management with proper type safety
 */

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { 
  Subscription, 
  StripeCustomer, 
  StripePrice, 
  StripeProduct, 
  SubscriptionDetails,
  UserActiveSubscription,
  SubscriptionStatus,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
  SubscriptionWithDetails
} from '@/types/clean-supabase';

// ============================================================================
// 1. SUBSCRIPTION RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Get user's active subscription using the clean schema
 * Uses the optimized database function for best performance
 */
export async function getUserActiveSubscription(userId: string): Promise<UserActiveSubscription | null> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    console.log('Getting active subscription for user:', userId);
    
    const { data, error } = await supabaseAdminClient
      .rpc('get_user_active_subscription', { p_user_id: userId });

    if (error) {
      console.error('Failed to get active subscription:', error);
      throw new Error(`Failed to get subscription: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('No active subscription found for user:', userId);
      return null;
    }

    const subscription = data[0];
    console.log('Found active subscription:', {
      subscriptionId: subscription.subscription_id,
      priceId: subscription.stripe_price_id,
      productName: subscription.product_name,
      status: subscription.status
    });

    return subscription;
  } catch (error) {
    console.error('Error in getUserActiveSubscription:', error);
    throw error;
  }
}

/**
 * Get complete subscription details with all related data
 * Uses the subscription_details view for efficient queries
 */
export async function getSubscriptionDetails(userId: string): Promise<SubscriptionDetails | null> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    console.log('Getting subscription details for user:', userId);
    
    const { data, error } = await supabaseAdminClient
      .from('subscription_details')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to get subscription details:', error);
      throw new Error(`Failed to get subscription details: ${error.message}`);
    }

    if (!data) {
      console.log('No subscription details found for user:', userId);
      return null;
    }

    console.log('Found subscription details:', {
      subscriptionId: data.subscription_id,
      productName: data.product_name,
      subscriptionType: data.subscription_type,
      status: data.status
    });

    return data;
  } catch (error) {
    console.error('Error in getSubscriptionDetails:', error);
    throw error;
  }
}

/**
 * Get subscription with full related data (subscription + customer + price + product)
 */
export async function getSubscriptionWithDetails(subscriptionId: string): Promise<SubscriptionWithDetails | null> {
  try {
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      throw new Error('Valid subscription ID is required');
    }

    console.log('Getting subscription with details:', subscriptionId);
    
    // Get the subscription
    const { data: subscription, error: subError } = await supabaseAdminClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError) {
      console.error('Failed to get subscription:', subError);
      throw new Error(`Failed to get subscription: ${subError.message}`);
    }

    // Get related data in parallel
    const [customerResult, priceResult] = await Promise.all([
      // Get customer (optional - may be null for free plans)
      subscription.stripe_customer_id 
        ? supabaseAdminClient
            .from('stripe_customers')
            .select('*')
            .eq('stripe_customer_id', subscription.stripe_customer_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      
      // Get price
      supabaseAdminClient
        .from('stripe_prices')
        .select('*')
        .eq('stripe_price_id', subscription.stripe_price_id)
        .single()
    ]);

    if (priceResult.error) {
      console.error('Failed to get price:', priceResult.error);
      throw new Error(`Failed to get price: ${priceResult.error.message}`);
    }

    // Get product
    const { data: product, error: productError } = await supabaseAdminClient
      .from('stripe_products')
      .select('*')
      .eq('stripe_product_id', priceResult.data.stripe_product_id)
      .single();

    if (productError) {
      console.error('Failed to get product:', productError);
      throw new Error(`Failed to get product: ${productError.message}`);
    }

    console.log('Successfully retrieved complete subscription data:', {
      subscriptionId: subscription.id,
      hasCustomer: !!customerResult.data,
      productName: product.name,
      priceAmount: priceResult.data.unit_amount
    });

    return {
      subscription,
      customer: customerResult.data,
      price: priceResult.data,
      product
    };
  } catch (error) {
    console.error('Error in getSubscriptionWithDetails:', error);
    throw error;
  }
}

// ============================================================================
// 2. SUBSCRIPTION CREATION FUNCTIONS
// ============================================================================

/**
 * Create a free subscription for a new user
 * Uses the database function to ensure proper constraints
 */
export async function createFreeSubscription(userId: string, stripePriceId?: string): Promise<string> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    // If no price ID provided, find the free plan price
    let priceId = stripePriceId;
    if (!priceId) {
      const { data: freePrice, error: priceError } = await supabaseAdminClient
        .from('stripe_prices')
        .select('stripe_price_id')
        .eq('unit_amount', 0)
        .eq('active', true)
        .limit(1)
        .single();

      if (priceError || !freePrice) {
        console.error('Failed to find free plan price:', priceError);
        throw new Error('Free plan price not found');
      }

      priceId = freePrice.stripe_price_id;
    }

    console.log('Creating free subscription for user:', userId, 'with price:', priceId);
    
    const { data, error } = await supabaseAdminClient
      .rpc('create_free_subscription', {
        p_user_id: userId,
        p_stripe_price_id: priceId
      });

    if (error) {
      console.error('Failed to create free subscription:', error);
      throw new Error(`Failed to create free subscription: ${error.message}`);
    }

    console.log('Successfully created free subscription:', data);
    return data as string;
  } catch (error) {
    console.error('Error in createFreeSubscription:', error);
    throw error;
  }
}

/**
 * Create or update a subscription using the database function
 * Primarily used by webhook handlers
 */
export async function upsertSubscription(params: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  quantity?: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: string | null;
  canceledAt?: string | null;
  endedAt?: string | null;
  trialStart?: string | null;
  trialEnd?: string | null;
  metadata?: any;
}): Promise<string> {
  try {
    console.log('Upserting subscription:', {
      userId: params.userId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      status: params.status
    });
    
    const { data, error } = await supabaseAdminClient
      .rpc('upsert_subscription', {
        p_user_id: params.userId,
        p_stripe_subscription_id: params.stripeSubscriptionId,
        p_stripe_customer_id: params.stripeCustomerId,
        p_stripe_price_id: params.stripePriceId,
        p_status: params.status,
        p_quantity: params.quantity || 1,
        p_current_period_start: params.currentPeriodStart,
        p_current_period_end: params.currentPeriodEnd,
        p_cancel_at_period_end: params.cancelAtPeriodEnd || false,
        p_cancel_at: params.cancelAt || null,
        p_canceled_at: params.canceledAt || null,
        p_ended_at: params.endedAt || null,
        p_trial_start: params.trialStart || null,
        p_trial_end: params.trialEnd || null,
        p_metadata: params.metadata || {}
      });

    if (error) {
      console.error('Failed to upsert subscription:', error);
      throw new Error(`Failed to upsert subscription: ${error.message}`);
    }

    console.log('Successfully upserted subscription:', data);
    return data as string;
  } catch (error) {
    console.error('Error in upsertSubscription:', error);
    throw error;
  }
}

// ============================================================================
// 3. SUBSCRIPTION MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<boolean> {
  try {
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      throw new Error('Valid subscription ID is required');
    }

    console.log('Canceling subscription at period end:', subscriptionId);
    
    const { error } = await supabaseAdminClient
      .from('subscriptions')
      .update({ 
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }

    console.log('Successfully canceled subscription at period end:', subscriptionId);
    return true;
  } catch (error) {
    console.error('Error in cancelSubscriptionAtPeriodEnd:', error);
    throw error;
  }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string, 
  status: SubscriptionStatus
): Promise<boolean> {
  try {
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      throw new Error('Valid subscription ID is required');
    }

    console.log('Updating subscription status:', subscriptionId, 'to', status);
    
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    // Set ended_at for canceled/unpaid subscriptions
    if (status === 'canceled' || status === 'unpaid') {
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await supabaseAdminClient
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);

    if (error) {
      console.error('Failed to update subscription status:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    console.log('Successfully updated subscription status:', subscriptionId, 'to', status);
    return true;
  } catch (error) {
    console.error('Error in updateSubscriptionStatus:', error);
    throw error;
  }
}

// ============================================================================
// 4. DATA INTEGRITY AND CLEANUP FUNCTIONS
// ============================================================================

/**
 * Clean up duplicate subscriptions for a user
 * Keeps the most recent paid subscription or most recent free if no paid exists
 */
export async function cleanupDuplicateSubscriptions(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    console.log('Cleaning up duplicate subscriptions for user:', userId);
    
    // Get all active subscriptions for the user
    const { data: subscriptions, error: fetchError } = await supabaseAdminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching subscriptions for cleanup:', fetchError);
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length <= 1) {
      console.log('No duplicate subscriptions found');
      return { success: true, message: 'No duplicates found' };
    }

    // Separate paid and free subscriptions
    const paidSubscriptions = subscriptions.filter(s => s.stripe_subscription_id !== null);
    const freeSubscriptions = subscriptions.filter(s => s.stripe_subscription_id === null);

    console.log('Found subscriptions:', {
      total: subscriptions.length,
      paid: paidSubscriptions.length,
      free: freeSubscriptions.length
    });

    let subscriptionsToCancel: string[] = [];

    if (paidSubscriptions.length > 0) {
      // Keep the most recent paid subscription, cancel all others
      const [keepPaidSubscription, ...cancelPaidSubscriptions] = paidSubscriptions;
      
      // Cancel all other paid subscriptions and all free subscriptions
      subscriptionsToCancel = [
        ...cancelPaidSubscriptions.map(s => s.id),
        ...freeSubscriptions.map(s => s.id)
      ];

      console.log('Keeping paid subscription:', keepPaidSubscription.id);
    } else if (freeSubscriptions.length > 1) {
      // Keep the most recent free subscription, cancel the rest
      const [keepFreeSubscription, ...cancelFreeSubscriptions] = freeSubscriptions;
      subscriptionsToCancel = cancelFreeSubscriptions.map(s => s.id);

      console.log('Keeping free subscription:', keepFreeSubscription.id);
    }

    if (subscriptionsToCancel.length > 0) {
      const { error: updateError } = await supabaseAdminClient
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', subscriptionsToCancel);

      if (updateError) {
        console.error('Error canceling duplicate subscriptions:', updateError);
        throw new Error(`Failed to cancel duplicates: ${updateError.message}`);
      }

      console.log(`Successfully canceled ${subscriptionsToCancel.length} duplicate subscriptions`);
    }

    return {
      success: true,
      message: `Cleaned up ${subscriptionsToCancel.length} duplicate subscriptions`,
      canceledCount: subscriptionsToCancel.length
    };
    
  } catch (error) {
    console.error('Error in cleanupDuplicateSubscriptions:', error);
    throw error;
  }
}

/**
 * Validate subscription data integrity
 */
export async function validateSubscriptionIntegrity(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    console.log('Validating subscription integrity for user:', userId);
    
    // Get subscription details using the view
    const { data: subscriptions, error } = await supabaseAdminClient
      .from('subscription_details')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching subscription details:', error);
      throw new Error(`Failed to fetch subscription details: ${error.message}`);
    }

    const issues: string[] = [];
    const activeSubscriptions = subscriptions?.filter(s => s.is_active) || [];
    
    // Check for multiple active subscriptions
    if (activeSubscriptions.length > 1) {
      issues.push(`User has ${activeSubscriptions.length} active subscriptions`);
    }
    
    // Check for paid subscriptions without customers
    const paidWithoutCustomer = activeSubscriptions.filter(
      s => s.subscription_type === 'paid' && !s.stripe_subscription_id
    );
    if (paidWithoutCustomer.length > 0) {
      issues.push('Paid subscriptions found without Stripe subscription IDs');
    }
    
    // Check for missing price/product data
    const missingPriceData = activeSubscriptions.filter(
      s => !s.product_name || s.unit_amount === undefined
    );
    if (missingPriceData.length > 0) {
      issues.push('Subscriptions found with missing price/product data');
    }
    
    return {
      userId,
      subscriptionCount: subscriptions?.length || 0,
      activeSubscriptionCount: activeSubscriptions.length,
      issues,
      isValid: issues.length === 0,
      subscriptions: subscriptions || []
    };
    
  } catch (error) {
    console.error('Error in validateSubscriptionIntegrity:', error);
    throw error;
  }
}

// ============================================================================
// 5. UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscription = await getUserActiveSubscription(userId);
    return subscription !== null;
  } catch (error) {
    console.error('Error checking active subscription:', error);
    return false;
  }
}

/**
 * Get subscription type (free/paid) for a user
 */
export async function getSubscriptionType(userId: string): Promise<'free' | 'paid' | null> {
  try {
    const details = await getSubscriptionDetails(userId);
    return details?.subscription_type || null;
  } catch (error) {
    console.error('Error getting subscription type:', error);
    return null;
  }
}

/**
 * Ensure user has a subscription (create free if none exists)
 */
export async function ensureUserHasSubscription(userId: string): Promise<void> {
  try {
    const hasSubscription = await hasActiveSubscription(userId);
    if (!hasSubscription) {
      console.log('User has no subscription, creating free plan');
      await createFreeSubscription(userId);
    }
  } catch (error) {
    console.error('Error ensuring user has subscription:', error);
    throw error;
  }
}

/**
 * Migration helper: Convert legacy subscription data to new format
 */
export function convertLegacySubscriptionData(legacyData: any): CreateSubscriptionParams {
  return {
    userId: legacyData.user_id,
    stripePriceId: legacyData.price_id || legacyData.stripe_price_id,
    stripeSubscriptionId: legacyData.stripe_subscription_id || legacyData.id,
    stripeCustomerId: legacyData.stripe_customer_id,
    quantity: legacyData.quantity || 1,
    trialEnd: legacyData.trial_end
  };
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================
export {
  // Retrieval functions
  getUserActiveSubscription,
  getSubscriptionDetails,
  getSubscriptionWithDetails,
  
  // Creation functions
  createFreeSubscription,
  upsertSubscription,
  
  // Management functions
  cancelSubscriptionAtPeriodEnd,
  updateSubscriptionStatus,
  
  // Cleanup functions
  cleanupDuplicateSubscriptions,
  validateSubscriptionIntegrity,
  
  // Utility functions
  hasActiveSubscription,
  getSubscriptionType,
  ensureUserHasSubscription,
  convertLegacySubscriptionData
};

// ============================================================================
// HELPER FUNCTIONS COMPLETE
// ============================================================================
// These functions provide:
// ✅ Clean schema compatibility
// ✅ Proper error handling and logging
// ✅ Type safety with TypeScript
// ✅ Performance optimized queries
// ✅ Data integrity validation
// ✅ Backward compatibility helpers
// ✅ Comprehensive subscription management
// ✅ Migration support utilities
// ============================================================================