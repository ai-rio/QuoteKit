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
  created_at: string;
  last_sign_in_at: string | null;
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
      stripe_customer_id
    `);

  // Apply search filter will be handled after fetching user data

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: customers, error, count } = await query;

  if (error) {
    console.error('Error fetching admin customers:', error);
    throw new Error('Failed to fetch customers');
  }

  // Get user data and subscriptions separately for each customer
  const transformedCustomers: AdminCustomer[] = [];
  
  if (customers) {
    for (const customer of customers) {
      // Get user data
      const { data: userData } = await supabase.auth.admin.getUserById(customer.id);
      
      // Get subscription data
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select(`
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
        `)
        .eq('user_id', customer.id)
        .in('status', ['active', 'trialing', 'canceled', 'past_due'])
        .order('created', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      transformedCustomers.push({
        id: customer.id,
        email: userData.user?.email || 'N/A',
        name: userData.user?.user_metadata?.name || null,
        stripe_customer_id: customer.stripe_customer_id,
        created_at: userData.user?.created_at || '',
        last_sign_in_at: userData.user?.last_sign_in_at || null,
        subscription: subscriptionData ? {
          id: subscriptionData.id,
          status: subscriptionData.status || 'unknown',
          current_period_end: subscriptionData.current_period_end,
          cancel_at_period_end: subscriptionData.cancel_at_period_end || false,
          price: {
            unit_amount: subscriptionData.prices?.unit_amount || 0,
            currency: subscriptionData.prices?.currency || 'usd',
            interval: subscriptionData.prices?.interval || 'month',
            product: {
              name: subscriptionData.prices?.products?.name || 'Unknown Product'
            }
          }
        } : null
      });
    }
  }

  // Apply search filter
  let searchFilteredCustomers = transformedCustomers;
  if (search) {
    const searchLower = search.toLowerCase();
    searchFilteredCustomers = transformedCustomers.filter(customer => 
      customer.email.toLowerCase().includes(searchLower) ||
      (customer.name && customer.name.toLowerCase().includes(searchLower))
    );
  }

  // Filter by subscription status
  const filteredCustomers = searchFilteredCustomers.filter(customer => {
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

    // Cancel in Stripe
    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });
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
    // TODO: Re-enable after database types are regenerated
    // await supabase.from('subscription_changes').insert({
    //   user_id: subscription.user_id,
    //   subscription_id: subscriptionId,
    //   old_price_id: subscription.price_id,
    //   new_price_id: subscription.price_id,
    //   change_type: 'cancellation',
    //   effective_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    //   stripe_subscription_id: subscriptionId,
    //   reason: reason || 'Admin cancellation'
    // });

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

    // Reactivate in Stripe
    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });
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
    // TODO: Re-enable after database types are regenerated
    // await supabase.from('subscription_changes').insert({
    //   user_id: subscription.user_id,
    //   subscription_id: subscriptionId,
    //   old_price_id: subscription.price_id,
    //   new_price_id: subscription.price_id,
    //   change_type: 'reactivation',
    //   effective_date: new Date().toISOString(),
    //   stripe_subscription_id: subscriptionId,
    //   reason: 'Admin reactivation'
    // });

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
    const updatedSubscription = await stripeAdmin.subscriptions.update(subscriptionId, {
      items: [{
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
    // TODO: Re-enable after database types are regenerated
    // await supabase.from('subscription_changes').insert({
    //   user_id: subscription.user_id,
    //   subscription_id: subscriptionId,
    //   old_price_id: subscription.price_id,
    //   new_price_id: newPriceId,
    //   change_type: 'upgrade', // You might want to determine this based on price comparison
    //   effective_date: new Date().toISOString(),
    //   stripe_subscription_id: subscriptionId,
    //   reason: 'Admin plan change'
    // });

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

    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });
    
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