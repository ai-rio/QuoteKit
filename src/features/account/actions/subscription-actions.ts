'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function changePlan(priceId: string, isUpgrade: boolean) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const subscription = await getSubscription();
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

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

    // Update subscription in Stripe
    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });
    const updatedSubscription = await stripeAdmin.subscriptions.update(
      subscription.id,
      {
        items: [
          {
            price: priceId,
          },
        ],
        // For downgrades, schedule the change for the end of the period
        proration_behavior: isUpgrade ? 'always_invoice' : 'none',
        billing_cycle_anchor: isUpgrade ? undefined : 'unchanged',
      }
    );

    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        price_id: priceId,
        status: updatedSubscription.status,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (error) {
      console.error('Database update error:', error);
      throw new Error('Failed to update subscription in database');
    }

    // Log the plan change for audit trail
    // TODO: Re-enable after database types are regenerated
    // await supabase.from('subscription_changes').insert({
    //   user_id: session.user.id,
    //   subscription_id: subscription.id,
    //   old_price_id: subscription.price_id,
    //   new_price_id: priceId,
    //   change_type: isUpgrade ? 'upgrade' : 'downgrade',
    //   effective_date: isUpgrade
    //     ? new Date().toISOString()
    //     : new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    //   stripe_subscription_id: subscription.id,
    // });

    revalidatePath('/account');
    return { success: true, subscription: updatedSubscription };
  } catch (error) {
    console.error('Plan change error:', error);
    throw error;
  }
}

export async function cancelSubscription(cancelAtPeriodEnd: boolean = true) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const subscription = await getSubscription();
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Cancel subscription in Stripe
    let updatedSubscription;
    if (cancelAtPeriodEnd) {
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
      updatedSubscription = await stripeAdmin.subscriptions.update(
        subscription.id,
        {
          cancel_at_period_end: true,
        }
      );
    } else {
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
      updatedSubscription = await stripeAdmin.subscriptions.cancel(
        subscription.id
      );
    }

    // Update subscription in database
    const { error } = await supabase
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

    if (error) {
      console.error('Database update error:', error);
      throw new Error('Failed to update subscription in database');
    }

    // Log the cancellation for audit trail
    // TODO: Re-enable after database types are regenerated
    // await supabase.from('subscription_changes').insert({
    //   user_id: session.user.id,
    //   subscription_id: subscription.id,
    //   old_price_id: subscription.price_id,
    //   new_price_id: null,
    //   change_type: 'cancellation',
    //   effective_date: cancelAtPeriodEnd
    //     ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
    //     : new Date().toISOString(),
    //   stripe_subscription_id: subscription.id,
    // });

    revalidatePath('/account');
    return { success: true, subscription: updatedSubscription };
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
    const { data: products, error } = await supabase
      .from('stripe_products')
      .select(`
        *,
        stripe_prices (*)
      `)
      .eq('active', true)
      .order('created_at');

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch available plans');
    }

    return products;
  } catch (error) {
    console.error('Get available plans error:', error);
    throw error;
  }
}