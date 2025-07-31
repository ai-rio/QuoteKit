import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { manualSyncSubscription } from './manual-sync-subscription';

/**
 * Enhanced subscription sync with automatic fallbacks and real-time verification
 * This function ensures subscription plan data is available for UI display
 */
export async function enhancedSubscriptionSync(userId: string, userEmail: string) {
  try {
    console.log(`🚀 Starting enhanced subscription sync for user ${userId}`);
    
    const supabase = await createSupabaseServerClient();
    
    // Step 1: Check if user has a subscription with complete plan data
    const { data: currentSubscription } = await supabase
      .from('subscriptions')
      .select(`
        id,
        stripe_price_id,
        status,
        stripe_prices!subscriptions_stripe_price_id_fkey(
          stripe_price_id,
          stripe_products!stripe_prices_stripe_product_id_fkey(name)
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();
    
    // Step 2: If subscription exists but missing plan data, sync from Stripe
    if (currentSubscription && (!currentSubscription.stripe_prices?.stripe_products?.name)) {
      console.log(`🔄 Subscription exists but missing plan data, syncing from Stripe...`);
      
      // Get customer ID for sync
      const { getOrCreateCustomerForUser } = await import('./get-or-create-customer');
      const stripeCustomerId = await getOrCreateCustomerForUser({
        userId,
        email: userEmail,
        supabaseClient: supabase
      });
      
      // Perform manual sync
      const syncResult = await manualSyncSubscription(stripeCustomerId);
      console.log(`✅ Sync completed: ${syncResult.message}`);
      
      return {
        success: true,
        action: 'synced_existing',
        message: `Synced ${syncResult.synced} subscription(s)`,
        details: syncResult
      };
    }
    
    // Step 3: If subscription has complete data, return success
    if (currentSubscription?.stripe_prices?.stripe_products?.name) {
      console.log(`✅ Subscription already has complete plan data: ${currentSubscription.stripe_prices.stripe_products.name}`);
      return {
        success: true,
        action: 'already_complete',
        message: 'Subscription data is complete',
        planName: currentSubscription.stripe_prices.stripe_products.name
      };
    }
    
    // Step 4: No subscription found, check if user recently made a payment
    console.log(`🔍 No subscription found, checking for recent Stripe activity...`);
    
    const { getOrCreateCustomerForUser } = await import('./get-or-create-customer');
    const stripeCustomerId = await getOrCreateCustomerForUser({
      userId,
      email: userEmail,
      supabaseClient: supabase
    });
    
    // Sync any subscriptions from Stripe
    const syncResult = await manualSyncSubscription(stripeCustomerId);
    
    if (syncResult.synced > 0) {
      console.log(`✅ Found and synced ${syncResult.synced} subscription(s) from Stripe`);
      return {
        success: true,
        action: 'synced_new',
        message: `Found and synced ${syncResult.synced} subscription(s)`,
        details: syncResult
      };
    }
    
    // Step 5: No subscriptions found anywhere
    console.log(`ℹ️ No subscriptions found for user ${userId}`);
    return {
      success: true,
      action: 'no_subscription',
      message: 'No active subscriptions found'
    };
    
  } catch (error) {
    console.error('❌ Enhanced subscription sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'error'
    };
  }
}

/**
 * Verify subscription plan data completeness
 */
export async function verifySubscriptionPlanData(userId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        id,
        stripe_price_id,
        status,
        stripe_prices!subscriptions_stripe_price_id_fkey(
          stripe_price_id,
          unit_amount,
          currency,
          recurring_interval,
          stripe_products!stripe_prices_stripe_product_id_fkey(
            name,
            description,
            active
          )
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();
    
    if (!subscription) {
      return {
        hasSubscription: false,
        hasPriceData: false,
        hasProductData: false,
        isComplete: false
      };
    }
    
    const hasPriceData = !!subscription.stripe_prices;
    const hasProductData = !!subscription.stripe_prices?.stripe_products;
    const isComplete = hasProductData && !!subscription.stripe_prices?.stripe_products?.name;
    
    return {
      hasSubscription: true,
      hasPriceData,
      hasProductData,
      isComplete,
      planName: subscription.stripe_prices?.stripe_products?.name,
      priceId: subscription.stripe_price_id,
      subscriptionId: subscription.id
    };
    
  } catch (error) {
    console.error('Failed to verify subscription plan data:', error);
    return {
      hasSubscription: false,
      hasPriceData: false,
      hasProductData: false,
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}