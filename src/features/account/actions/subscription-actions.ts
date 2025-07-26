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

    // Update subscription in Stripe
    const stripeAdmin = await createStripeAdminClient();
    const updatedSubscription = await stripeAdmin.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: subscription.stripe_subscription_item_id,
            price: priceId,
          },
        ],
        // For downgrades, schedule the change for the end of the period
        proration_behavior: isUpgrade ? 'always_invoice' : 'none',
        billing_cycle_anchor: isUpgrade ? undefined : 'unchanged',
      }
    );

    // Update subscription in database
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('subscriptions')
      .update({
        price_id: priceId,
        status: updatedSubscription.status,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (error) {
      console.error('Database update error:', error);
      throw new Error('Failed to update subscription in database');
    }

    // Log the plan change for audit trail
    await supabase.from('subscription_changes').insert({
      user_id: session.user.id,
      subscription_id: subscription.id,
      old_price_id: subscription.price_id,
      new_price_id: priceId,
      change_type: isUpgrade ? 'upgrade' : 'downgrade',
      effective_date: isUpgrade
        ? new Date().toISOString()
        : new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      stripe_subscription_id: subscription.stripe_subscription_id,
    });

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

    // Cancel subscription in Stripe
    let updatedSubscription;
    if (cancelAtPeriodEnd) {
      const stripeAdmin = await createStripeAdminClient();
      updatedSubscription = await stripeAdmin.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );
    } else {
      const stripeAdmin = await createStripeAdminClient();
      updatedSubscription = await stripeAdmin.subscriptions.cancel(
        subscription.stripe_subscription_id
      );
    }

    // Update subscription in database
    const supabase = await createSupabaseServerClient();
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
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (error) {
      console.error('Database update error:', error);
      throw new Error('Failed to update subscription in database');
    }

    // Log the cancellation for audit trail
    await supabase.from('subscription_changes').insert({
      user_id: session.user.id,
      subscription_id: subscription.id,
      old_price_id: subscription.price_id,
      new_price_id: null,
      change_type: 'cancellation',
      effective_date: cancelAtPeriodEnd
        ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
        : new Date().toISOString(),
      stripe_subscription_id: subscription.stripe_subscription_id,
    });

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

    // Reactivate subscription in Stripe
    const stripeAdmin = await createStripeAdminClient();
    const updatedSubscription = await stripeAdmin.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    // Update subscription in database
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (error) {
      console.error('Database update error:', error);
      throw new Error('Failed to update subscription in database');
    }

    // Log the reactivation for audit trail
    await supabase.from('subscription_changes').insert({
      user_id: session.user.id,
      subscription_id: subscription.id,
      old_price_id: subscription.price_id,
      new_price_id: subscription.price_id,
      change_type: 'reactivation',
      effective_date: new Date().toISOString(),
      stripe_subscription_id: subscription.stripe_subscription_id,
    });

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
      .from('products')
      .select(`
        *,
        prices (*)
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