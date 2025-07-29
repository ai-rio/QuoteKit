/**
 * Enhanced subscription helper functions that integrate with the new database functions
 * These helpers work with the fixed database schema and provide robust subscription management
 */

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

/**
 * Creates a free plan subscription using the database function
 * This ensures proper database constraints and RLS policy compliance
 */
export async function createFreePlanSubscription(userId: string): Promise<string> {
  try {
    console.log('Creating free plan subscription for user:', userId);
    
    // Create a subscription record for the free plan
    // Free plans have no price_id (null) and status 'active'
    const { data, error } = await supabaseAdminClient
      .from('subscriptions')
      .insert({
        id: `free_${userId}_${Date.now()}`, // Generate unique id for free subscription
        user_id: userId,
        status: 'active',
        price_id: null, // Free plan has no associated price
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        created: new Date().toISOString(),
        metadata: { plan_type: 'free' }
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create free plan subscription:', error);
      throw new Error(`Failed to create free subscription: ${error.message}`);
    }

    console.log('Successfully created free plan subscription:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error in createFreePlanSubscription:', error);
    throw error;
  }
}

/**
 * Upgrades a free plan subscription to a paid subscription
 * This properly handles the transition and cleanup
 */
export async function upgradeSubscriptionToPaid(params: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  priceId: string;
}): Promise<boolean> {
  try {
    console.log('Upgrading free plan to paid subscription:', params);
    
    // First, cancel any existing free subscriptions
    const { error: cancelError } = await supabaseAdminClient
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        ended_at: new Date().toISOString()
      })
      .eq('user_id', params.userId)
      .is('price_id', null) // Free plans have null price_id
      .in('status', ['active', 'trialing']);

    if (cancelError) {
      console.error('Failed to cancel existing free subscriptions:', cancelError);
      // Don't throw here as this might not be critical
    }

    // Create the new paid subscription record
    // Note: The actual Stripe subscription creation should be handled elsewhere
    const { data, error } = await supabaseAdminClient
      .from('subscriptions')
      .insert({
        id: params.stripeSubscriptionId,
        user_id: params.userId,
        price_id: params.priceId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        created: new Date().toISOString(),
        metadata: { 
          upgraded_from: 'free',
          stripe_customer_id: params.stripeCustomerId 
        }
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create paid subscription:', error);
      throw new Error(`Failed to upgrade subscription: ${error.message}`);
    }

    console.log('Successfully upgraded subscription to paid:', data.id);
    return true;
  } catch (error) {
    console.error('Error in upgradeSubscriptionToPaid:', error);
    throw error;
  }
}

/**
 * Ensures a user has a subscription (creates free plan if none exists)
 * Useful for user onboarding and ensuring consistent subscription state
 */
export async function ensureUserHasSubscription(userId: string, userEmail: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if user already has an active subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('internal_id, status, subscription_type:stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', checkError);
      throw new Error(`Failed to check existing subscription: ${checkError.message}`);
    }

    if (existingSubscription) {
      console.log('User already has subscription:', existingSubscription);
      return;
    }

    // User has no subscription, create a free plan
    console.log('User has no subscription, creating free plan');
    
    // Get the free plan price ID
    const { data: freePrice, error: priceError } = await supabase
      .from('stripe_prices')
      .select('stripe_price_id')
      .eq('unit_amount', 0)
      .eq('active', true)
      .single();

    if (priceError || !freePrice) {
      console.error('Failed to find free plan price:', priceError);
      throw new Error('Free plan not available');
    }

    // Create free plan subscription
    await createFreePlanSubscription(userId);
    console.log('Successfully ensured user has subscription (created free plan)');
    
  } catch (error) {
    console.error('Error in ensureUserHasSubscription:', error);
    throw error;
  }
}

/**
 * Gets comprehensive subscription diagnostics for troubleshooting
 * Uses the diagnostic view created in the migration
 */
export async function getSubscriptionDiagnostics(userId: string) {
  try {
    // Query subscriptions directly and compute diagnostic fields
    const { data, error } = await supabaseAdminClient
      .from('subscriptions')
      .select(`
        *,
        prices:price_id (
          *,
          stripe_products:stripe_product_id (*)
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to get subscription diagnostics:', error);
      throw new Error(`Failed to get diagnostics: ${error.message}`);
    }

    // Transform data to include computed diagnostic fields
    const diagnostics = data.map(subscription => ({
      ...subscription,
      // Compute subscription_type: paid if has price_id, free otherwise
      subscription_type: subscription.price_id ? 'paid' : 'free',
      // For customer_stripe_id, we would need to look it up from the users table
      // For now, set to null as it's not directly available in subscriptions
      customer_stripe_id: null
    }));

    return diagnostics;
  } catch (error) {
    console.error('Error in getSubscriptionDiagnostics:', error);
    throw error;
  }
}

/**
 * Validates user subscription integrity
 * Checks for common issues like duplicate subscriptions, missing customer records, etc.
 */
export async function validateUserSubscriptionIntegrity(userId: string) {
  try {
    const diagnostics = await getSubscriptionDiagnostics(userId);
    
    const issues: string[] = [];
    const activeSubscriptions = diagnostics.filter(d => ['active', 'trialing'].includes(d.status));
    
    // Check for multiple active subscriptions
    if (activeSubscriptions.length > 1) {
      issues.push(`User has ${activeSubscriptions.length} active subscriptions`);
    }
    
    // Check for paid subscriptions without customer records
    const paidWithoutCustomer = activeSubscriptions.filter(
      d => d.subscription_type === 'paid' && !(d as any).customer_stripe_id
    );
    if (paidWithoutCustomer.length > 0) {
      issues.push('Paid subscriptions found without customer records');
    }
    
    // Check for free subscriptions with customer records (not necessarily an issue, but worth noting)
    const freeWithCustomer = activeSubscriptions.filter(
      d => d.subscription_type === 'free' && (d as any).customer_stripe_id
    );
    if (freeWithCustomer.length > 0) {
      issues.push('Free subscriptions found with customer records (upgradeable)');
    }
    
    return {
      userId,
      subscriptionCount: diagnostics.length,
      activeSubscriptionCount: activeSubscriptions.length,
      issues,
      diagnostics
    };
    
  } catch (error) {
    console.error('Error in validateUserSubscriptionIntegrity:', error);
    throw error;
  }
}

/**
 * Cleans up duplicate subscriptions for a user
 * Uses the new internal_id primary key for proper cleanup
 */
export async function cleanupDuplicateSubscriptions(userId: string) {
  try {
    console.log('Cleaning up duplicate subscriptions for user:', userId);
    
    const { data: subscriptions, error: fetchError } = await supabaseAdminClient
      .from('subscriptions')
      .select('id, price_id, status, created')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created', { ascending: false });

    if (fetchError) {
      console.error('Error fetching subscriptions for cleanup:', fetchError);
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length <= 1) {
      console.log('No duplicate subscriptions found');
      return { success: true, message: 'No duplicates found' };
    }

    // Keep the most recent subscription, cancel the rest
    const [keepSubscription, ...cancelSubscriptions] = subscriptions;
    
    if (cancelSubscriptions.length > 0) {
      const idsToCancel = cancelSubscriptions.map(s => s.id);
      
      const { error: updateError } = await supabaseAdminClient
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          ended_at: new Date().toISOString()
        })
        .in('id', idsToCancel);

      if (updateError) {
        console.error('Error updating duplicate subscriptions:', updateError);
        throw new Error(`Failed to cancel duplicates: ${updateError.message}`);
      }

      console.log(`Successfully canceled ${cancelSubscriptions.length} duplicate subscriptions`);
    }

    return {
      success: true,
      message: `Kept subscription ${keepSubscription.id}, canceled ${cancelSubscriptions.length} duplicates`,
      keptSubscription: keepSubscription.id,
      canceledCount: cancelSubscriptions.length
    };
    
  } catch (error) {
    console.error('Error in cleanupDuplicateSubscriptions:', error);
    throw error;
  }
}