import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * Creates a free subscription for a user in the database
 * This ensures users have a subscription record even on the free plan
 */
export async function createFreeSubscription(userId: string) {
  try {
    console.debug('createFreeSubscription: Starting free subscription creation', { userId });

    // Check if user already has an active subscription
    const { data: existingSubscription, error: checkError } = await supabaseAdminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (checkError) {
      console.error('createFreeSubscription: Error checking existing subscription', {
        userId,
        error: checkError.message
      });
      throw checkError;
    }

    if (existingSubscription) {
      console.debug('createFreeSubscription: User already has active subscription', {
        userId,
        subscriptionId: existingSubscription.internal_id,
        status: existingSubscription.status
      });
      return { success: true, subscriptionId: existingSubscription.internal_id };
    }

    // Create free subscription record
    const freeSubscriptionData = {
      user_id: userId,
      id: null, // No Stripe subscription ID for free plans
      stripe_subscription_id: null,
      stripe_customer_id: null,
      stripe_price_id: null,
      status: 'active',
      metadata: {
        plan_type: 'free',
        created_via: 'pricing_page',
        created_at: new Date().toISOString()
      },
      cancel_at_period_end: false,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      created: new Date(),
      updated_at: new Date()
    };

    const { data: newSubscription, error: createError } = await supabaseAdminClient
      .from('subscriptions')
      .insert([freeSubscriptionData])
      .select('internal_id')
      .single();

    if (createError) {
      console.error('createFreeSubscription: Error creating free subscription', {
        userId,
        error: createError.message,
        code: createError.code
      });
      throw createError;
    }

    console.debug('createFreeSubscription: Successfully created free subscription', {
      userId,
      subscriptionId: newSubscription.internal_id
    });

    return { 
      success: true, 
      subscriptionId: newSubscription.internal_id 
    };

  } catch (error) {
    console.error('createFreeSubscription: Unexpected error', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Server action to handle free plan selection from pricing page
 */
export async function handleFreePlanSelection() {
  'use server';
  
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('handleFreePlanSelection: Authentication error', { 
      hasError: !!authError,
      hasUser: !!user 
    });
    throw new Error('User not authenticated');
  }

  console.debug('handleFreePlanSelection: Creating free subscription for user', { userId: user.id });

  // Create free subscription
  const result = await createFreeSubscription(user.id);

  if (!result.success) {
    console.error('handleFreePlanSelection: Failed to create free subscription', {
      userId: user.id,
      error: result.error
    });
    throw new Error(result.error || 'Failed to create free subscription');
  }

  console.debug('handleFreePlanSelection: Free subscription created successfully', {
    userId: user.id,
    subscriptionId: result.subscriptionId
  });

  return { success: true, subscriptionId: result.subscriptionId };
}