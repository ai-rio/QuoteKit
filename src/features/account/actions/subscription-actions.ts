'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function changePlan(priceId: string, isUpgrade: boolean) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    if (!priceId) {
      throw new Error('Price ID is required');
    }

    // Get user's subscription - use same pattern as getSubscription()
    const supabase = await createSupabaseServerClient();
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stripe_prices (
          stripe_price_id,
          unit_amount,
          currency,
          recurring_interval,
          stripe_products (
            name,
            stripe_product_id
          )
        )
      `)
      .eq('user_id', session.user.id)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created', { ascending: false })
      .limit(1);

    if (subscriptionError) {
      throw new Error('Failed to query subscription');
    }

    const subscription = subscriptions?.[0];
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Validate the new price exists and is active
    const { data: newPrice, error: priceError } = await supabase
      .from('stripe_prices')
      .select(`
        *,
        stripe_products (*)
      `)
      .eq('stripe_price_id', priceId)
      .eq('active', true)
      .single();

    if (priceError || !newPrice) {
      throw new Error('Invalid or inactive price');
    }

    // Get Stripe configuration using service role
    const { data: stripeConfigRecord, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (configError || !stripeConfigRecord?.value) {
      console.error('Stripe configuration error:', configError);
      throw new Error('Stripe not configured');
    }

    const stripeConfig = stripeConfigRecord.value as any;
    if (!stripeConfig?.secret_key) {
      throw new Error('Stripe not configured');
    }

    // Initialize Stripe admin client
    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // First, get the current subscription from Stripe to get the subscription item ID
    const currentStripeSubscription = await stripeAdmin.subscriptions.retrieve(subscription.id);
    const subscriptionItemId = currentStripeSubscription.items.data[0]?.id;
    
    if (!subscriptionItemId) {
      throw new Error('Unable to find subscription item');
    }

    // Update subscription in Stripe
    const updatedSubscription = await stripeAdmin.subscriptions.update(
      subscription.id,
      {
        items: [
          {
            id: subscriptionItemId,
            price: priceId,
          },
        ],
        // For downgrades, schedule the change for the end of the period
        proration_behavior: isUpgrade ? 'always_invoice' : 'none',
        billing_cycle_anchor: isUpgrade ? undefined : 'unchanged',
      }
    );

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        price_id: priceId,
        status: updatedSubscription.status,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update subscription in database');
    }

    // Optional: Log the plan change for audit trail
    console.log(`Plan ${isUpgrade ? 'upgraded' : 'downgraded'}: ${subscription.id} from ${subscription.price_id} to ${priceId} for user ${session.user.id}`);

    // Revalidate the account page to refresh the UI
    revalidatePath('/account');

    return {
      success: true,
      subscription: {
        ...subscription,
        price_id: priceId,
        status: updatedSubscription.status,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      }
    };

  } catch (error) {
    console.error('Plan change error:', error);
    throw error;
  }
}

export async function cancelSubscription(cancelAtPeriodEnd: boolean = true, reason?: string) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Get user's subscription
    const supabase = await createSupabaseServerClient();
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stripe_prices (
          stripe_price_id,
          unit_amount,
          currency,
          recurring_interval,
          stripe_products (
            name,
            stripe_product_id
          )
        )
      `)
      .eq('user_id', session.user.id)
      .in('status', ['active', 'trialing'])
      .single();

    if (subscriptionError || !subscription) {
      throw new Error('No active subscription found');
    }

    // Get Stripe configuration using service role
    const { data: stripeConfigRecord, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (configError || !stripeConfigRecord?.value) {
      console.error('Stripe configuration error:', configError);
      throw new Error('Stripe not configured');
    }

    const stripeConfig = stripeConfigRecord.value as any;
    if (!stripeConfig?.secret_key) {
      throw new Error('Stripe not configured');
    }

    // Initialize Stripe admin client
    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Cancel subscription in Stripe
    let updatedSubscription;
    if (cancelAtPeriodEnd) {
      updatedSubscription = await stripeAdmin.subscriptions.update(
        subscription.id,
        {
          cancel_at_period_end: true,
        }
      );
    } else {
      updatedSubscription = await stripeAdmin.subscriptions.cancel(
        subscription.id
      );
    }

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        canceled_at: updatedSubscription.canceled_at
          ? new Date(updatedSubscription.canceled_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update subscription in database');
    }

    // Optional: Log the cancellation for audit trail
    // TODO: Implement subscription_changes table if needed
    console.log(`Subscription ${cancelAtPeriodEnd ? 'scheduled for cancellation' : 'canceled immediately'}: ${subscription.id} for user ${session.user.id}${reason ? ` (reason: ${reason})` : ''}`);

    // Revalidate the account page to refresh the UI
    revalidatePath('/account');

    return {
      success: true,
      subscription: {
        ...subscription,
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        canceled_at: updatedSubscription.canceled_at
      }
    };

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    throw error;
  }
}

export async function reactivateSubscription() {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const subscription = await getSubscription();
    if (!subscription) {
      throw new Error('No subscription found');
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Reactivate subscription in Stripe
    // Get Stripe configuration
      const { data: stripeConfigRecord } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'stripe_config')
        .single();

      const stripeConfig = stripeConfigRecord?.value as any;
      if (!stripeConfig?.secret_key) {
        throw new Error('Stripe not configured');
      }

      const stripeAdmin = createStripeAdminClient({
        secret_key: stripeConfig.secret_key,
        mode: stripeConfig.mode || 'test'
      });
    const updatedSubscription = await stripeAdmin.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: false,
      }
    );

    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (error) {
      console.error('Database update error:', error);
      throw new Error('Failed to update subscription in database');
    }

    // Log the reactivation for audit trail
    // TODO: Re-enable after database types are regenerated
    // await supabase.from('subscription_changes').insert({
    //   user_id: session.user.id,
    //   subscription_id: subscription.id,
    //   old_price_id: subscription.price_id,
    //   new_price_id: subscription.price_id,
    //   change_type: 'reactivation',
    //   effective_date: new Date().toISOString(),
    //   stripe_subscription_id: subscription.id,
    // });

    revalidatePath('/account');
    return { success: true, subscription: updatedSubscription };
  } catch (error) {
    console.error('Subscription reactivation error:', error);
    throw error;
  }
}

export async function getAvailablePlans() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // First get products
    const { data: products, error: productsError } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('active', true)
      .order('created_at');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw new Error('Failed to fetch available plans');
    }

    // Then get prices for each product
    const { data: prices, error: pricesError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('active', true)
      .in('stripe_product_id', products.map(p => p.stripe_product_id));

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
      throw new Error('Failed to fetch plan prices');
    }

    // Combine products with their prices
    const productsWithPrices = products.map(product => ({
      ...product,
      prices: prices.filter(price => price.stripe_product_id === product.stripe_product_id)
    }));

    return productsWithPrices;
  } catch (error) {
    console.error('Get available plans error:', error);
    throw error;
  }
}