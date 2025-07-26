'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export interface AdminCustomer {
  id: string;
  email: string;
  name: string | null;
  stripe_customer_id: string | null;
  subscription: {
    id: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    price: {
      unit_amount: number;
      currency: string;
      interval: string;
      product: {
        name: string;
      };
    };
  } | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface CustomerFilters {
  status?: 'all' | 'active' | 'trialing' | 'canceled' | 'past_due' | 'no_subscription';
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAdminCustomers(filters: CustomerFilters = {}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();
  
  // Check if user is admin
  const { data: adminCheck } = await supabase.rpc('is_admin');
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  const { 
    status = 'all', 
    search = '', 
    page = 1, 
    limit = 20 
  } = filters;

  let query = supabase
    .from('customers')
    .select(`
      id,
      stripe_customer_id,
      users!inner(
        email,
        raw_user_meta_data,
        created_at,
        last_sign_in_at
      ),
      subscriptions(
        id,
        status,
        current_period_end,
        cancel_at_period_end,
        prices(
          unit_amount,
          currency,
          interval,
          products(name)
        )
      )
    `);

  // Apply search filter
  if (search) {
    query = query.or(`users.email.ilike.%${search}%,users.raw_user_meta_data->>name.ilike.%${search}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: customers, error, count } = await query;

  if (error) {
    console.error('Error fetching admin customers:', error);
    throw new Error('Failed to fetch customers');
  }

  // Transform and filter by subscription status
  const transformedCustomers: AdminCustomer[] = customers?.map(customer => ({
    id: customer.id,
    email: customer.users.email,
    name: customer.users.raw_user_meta_data?.name || null,
    stripe_customer_id: customer.stripe_customer_id,
    subscription: customer.subscriptions?.[0] ? {
      id: customer.subscriptions[0].id,
      status: customer.subscriptions[0].status,
      current_period_end: customer.subscriptions[0].current_period_end,
      cancel_at_period_end: customer.subscriptions[0].cancel_at_period_end,
      price: {
        unit_amount: customer.subscriptions[0].prices?.unit_amount || 0,
        currency: customer.subscriptions[0].prices?.currency || 'usd',
        interval: customer.subscriptions[0].prices?.interval || 'month',
        product: {
          name: customer.subscriptions[0].prices?.products?.name || 'Unknown Product'
        }
      }
    } : null,
    created_at: customer.users.created_at,
    last_sign_in_at: customer.users.last_sign_in_at
  })) || [];

  // Filter by subscription status
  const filteredCustomers = transformedCustomers.filter(customer => {
    if (status === 'all') return true;
    if (status === 'no_subscription') return !customer.subscription;
    return customer.subscription?.status === status;
  });

  return {
    customers: filteredCustomers,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

export async function adminCancelSubscription(subscriptionId: string, reason?: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel in Stripe
    const stripeAdmin = await createStripeAdminClient();
    const updatedSubscription = await stripeAdmin.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        status: updatedSubscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      throw new Error('Failed to update subscription in database');
    }

    // Log the cancellation
    await supabase.from('subscription_changes').insert({
      user_id: subscription.user_id,
      subscription_id: subscriptionId,
      old_price_id: subscription.price_id,
      new_price_id: subscription.price_id,
      change_type: 'cancellation',
      effective_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      stripe_subscription_id: subscriptionId,
      reason: reason || 'Admin cancellation'
    });

    revalidatePath('/admin/customers');
    return { success: true };
  } catch (error) {
    console.error('Admin cancel subscription error:', error);
    throw error;
  }
}

export async function adminReactivateSubscription(subscriptionId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    // Reactivate in Stripe
    const stripeAdmin = await createStripeAdminClient();
    const updatedSubscription = await stripeAdmin.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    // Update in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        status: updatedSubscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      throw new Error('Failed to update subscription in database');
    }

    // Log the reactivation
    await supabase.from('subscription_changes').insert({
      user_id: subscription.user_id,
      subscription_id: subscriptionId,
      old_price_id: subscription.price_id,
      new_price_id: subscription.price_id,
      change_type: 'reactivation',
      effective_date: new Date().toISOString(),
      stripe_subscription_id: subscriptionId,
      reason: 'Admin reactivation'
    });

    revalidatePath('/admin/customers');
    return { success: true };
  } catch (error) {
    console.error('Admin reactivate subscription error:', error);
    throw error;
  }
}

export async function adminChangePlan(subscriptionId: string, newPriceId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    // Update subscription in Stripe
    const stripeAdmin = await createStripeAdminClient();
    const updatedSubscription = await stripeAdmin.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.stripe_subscription_item_id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice',
    });

    // Update in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        price_id: newPriceId,
        status: updatedSubscription.status,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      throw new Error('Failed to update subscription in database');
    }

    // Log the plan change
    await supabase.from('subscription_changes').insert({
      user_id: subscription.user_id,
      subscription_id: subscriptionId,
      old_price_id: subscription.price_id,
      new_price_id: newPriceId,
      change_type: 'upgrade', // You might want to determine this based on price comparison
      effective_date: new Date().toISOString(),
      stripe_subscription_id: subscriptionId,
      reason: 'Admin plan change'
    });

    revalidatePath('/admin/customers');
    return { success: true };
  } catch (error) {
    console.error('Admin change plan error:', error);
    throw error;
  }
}

export async function getFailedPayments() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // Get subscriptions with past_due or unpaid status
    const { data: failedPayments, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        current_period_end,
        user_id,
        users!inner(email, raw_user_meta_data),
        prices(
          unit_amount,
          currency,
          interval,
          products(name)
        )
      `)
      .in('status', ['past_due', 'unpaid'])
      .order('current_period_end', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch failed payments');
    }

    return failedPayments || [];
  } catch (error) {
    console.error('Get failed payments error:', error);
    throw error;
  }
}

export async function retryFailedPayment(subscriptionId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  try {
    const stripeAdmin = await createStripeAdminClient();
    
    // Get the latest invoice for the subscription
    const invoices = await stripeAdmin.invoices.list({
      subscription: subscriptionId,
      status: 'open',
      limit: 1,
    });

    if (invoices.data.length === 0) {
      throw new Error('No open invoice found for this subscription');
    }

    const invoice = invoices.data[0];
    
    // Retry the payment
    const retriedInvoice = await stripeAdmin.invoices.pay(invoice.id);

    revalidatePath('/admin/customers');
    return { success: true, invoice: retriedInvoice };
  } catch (error) {
    console.error('Retry failed payment error:', error);
    throw error;
  }
}