'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function changePlan(priceId: string, isUpgrade: boolean) {
  // Check authentication first (outside try-catch)
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!priceId) {
    throw new Error('Price ID is required');
  }

  // Get user's subscription to check if it's a free plan (outside try-catch)
  const supabase = await createSupabaseServerClient();
  
  // First, get the subscription without joins to avoid foreign key issues
  const { data: subscriptions, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created', { ascending: false })
    .limit(1);

  if (subscriptionError) {
    console.error('Subscription query error:', subscriptionError);
    throw new Error(`Failed to query subscription: ${subscriptionError.message}`);
  }

  const subscription = subscriptions?.[0];
  if (!subscription) {
    throw new Error('No active subscription found');
  }

  // Get price data separately if subscription has a price ID
  let priceData = null;
  if (subscription.stripe_price_id || subscription.price_id) {
    const priceId = subscription.stripe_price_id || subscription.price_id;
    const { data: price, error: priceError } = await supabase
      .from('stripe_prices')
      .select(`
        *,
        stripe_products (
          name,
          stripe_product_id
        )
      `)
      .eq('stripe_price_id', priceId)
      .single();

    if (!priceError && price) {
      priceData = price;
    }
  }

  // Enhance subscription with price data
  const enhancedSubscription = {
    ...subscription,
    stripe_prices: priceData
  };

  // Check if this is a free plan user (no Stripe subscription ID) - Handle as new paid subscription
  if (!enhancedSubscription.stripe_subscription_id) {
    console.log('User has free plan, creating new paid subscription');
    
    // First, validate the new price exists and is active
    const { data: newPrice, error: priceError } = await supabase
      .from('stripe_prices')
      .select(`
        *,
        stripe_products!stripe_prices_stripe_product_id_fkey (*)
      `)
      .eq('stripe_price_id', priceId)
      .eq('active', true)
      .single();

    if (priceError || !newPrice) {
      console.error('Price validation failed:', {
        priceId,
        priceError: priceError?.message,
        foundPrice: !!newPrice,
        userId: session.user.id
      });
      throw new Error(`Invalid or inactive price: ${priceId}. Error: ${priceError?.message || 'Price not found'}`);
    }

    // Get Stripe configuration
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');
    
    const { data: stripeConfigRecord, error: configError } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    let stripeConfig: any = null;

    if (!configError && stripeConfigRecord?.value) {
      stripeConfig = stripeConfigRecord.value as any;
    } else {
      // Fallback to environment variables
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        stripeConfig = {
          secret_key: secretKey,
          mode: process.env.STRIPE_MODE || 'test'
        };
      }
    }

    if (!stripeConfig?.secret_key) {
      console.error('Stripe configuration error:', configError);
      throw new Error('Stripe not configured');
    }

    // Initialize Stripe admin client
    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Get or create customer in Stripe
    const { getOrCreateCustomer } = await import('@/features/account/controllers/get-or-create-customer');
    const customerId = await getOrCreateCustomer({
      userId: session.user.id,
      email: session.user.email!,
    });

    // Create checkout session for the upgrade
    const checkoutMode = newPrice.recurring_interval ? 'subscription' : 'payment';
    
    const checkoutSession = await stripeAdmin.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer: customerId,
      customer_update: {
        address: 'auto',
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: checkoutMode,
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?upgrade=cancelled`,
    });

    if (!checkoutSession || !checkoutSession.url) {
      throw new Error('Failed to create checkout session');
    }

    // Cancel the existing free subscription before redirecting
    await supabaseAdminClient
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        ended_at: new Date().toISOString()
      })
      .eq('id', enhancedSubscription.id);

    console.log(`Free plan cancelled for user ${session.user.id}, redirecting to checkout`);
    
    // Use Next.js redirect
    const { redirect } = await import('next/navigation');
    redirect(checkoutSession.url);
  }

  // Handle existing paid subscription changes
  try {
    // Validate the new price exists and is active
    const { data: newPrice, error: priceError } = await supabase
      .from('stripe_prices')
      .select(`
        *,
        stripe_products!stripe_prices_stripe_product_id_fkey (*)
      `)
      .eq('stripe_price_id', priceId)
      .eq('active', true)
      .single();

    if (priceError || !newPrice) {
      console.error('Price validation failed (paid subscription):', {
        priceId,
        priceError: priceError?.message,
        foundPrice: !!newPrice,
        userId: session.user.id
      });
      throw new Error(`Invalid or inactive price: ${priceId}. Error: ${priceError?.message || 'Price not found'}`);
    }

    // Get Stripe configuration
    const { data: stripeConfigRecord, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    let stripeConfig: any = null;

    if (!configError && stripeConfigRecord?.value) {
      stripeConfig = stripeConfigRecord.value as any;
    } else {
      // Fallback to environment variables
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        stripeConfig = {
          secret_key: secretKey,
          mode: process.env.STRIPE_MODE || 'test'
        };
      }
    }

    if (!stripeConfig?.secret_key) {
      console.error('Stripe configuration error:', configError);
      throw new Error('Stripe not configured');
    }

    // Initialize Stripe admin client
    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Validate Stripe subscription ID before making Stripe API call
    if (!enhancedSubscription.stripe_subscription_id || typeof enhancedSubscription.stripe_subscription_id !== 'string') {
      throw new Error('Invalid Stripe subscription ID - cannot update subscription');
    }

    // First, get the current subscription from Stripe to get the subscription item ID
    const currentStripeSubscription = await stripeAdmin.subscriptions.retrieve(enhancedSubscription.stripe_subscription_id);
    const subscriptionItemId = currentStripeSubscription.items.data[0]?.id;
    
    if (!subscriptionItemId) {
      throw new Error('Unable to find subscription item');
    }

    // Ensure customer has a default payment method for billing
    const customer = await stripeAdmin.customers.retrieve(currentStripeSubscription.customer as string);
    
    if (typeof customer === 'string' || customer.deleted) {
      throw new Error('Customer not found');
    }

    // Check if customer has a default payment method
    if (!customer.invoice_settings?.default_payment_method && !customer.default_source) {
      // Get customer's payment methods and set the first one as default
      const paymentMethods = await stripeAdmin.paymentMethods.list({
        customer: customer.id,
        type: 'card',
      });

      if (paymentMethods.data.length === 0) {
        throw new Error('No payment methods found. Please add a payment method before changing plans.');
      }

      // Set the first payment method as default
      await stripeAdmin.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethods.data[0].id,
        },
      });
    }

    // Update subscription in Stripe
    const updatedSubscription = await stripeAdmin.subscriptions.update(
      enhancedSubscription.stripe_subscription_id,
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
    // Note: Stripe is the source of truth. If this fails, the subscription change was still successful in Stripe
    // and will be synced via webhooks. We log the error but don't fail the entire operation.
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        price_id: priceId,
        status: updatedSubscription.status,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', enhancedSubscription.stripe_subscription_id);

    if (updateError) {
      console.error('Database update error (non-critical - will be synced via webhook):', updateError);
      // Don't throw here - Stripe subscription was successfully updated and webhooks will eventually sync
    }

    // Optional: Log the plan change for audit trail
    console.log(`Plan ${isUpgrade ? 'upgraded' : 'downgraded'}: ${enhancedSubscription.stripe_subscription_id} from ${enhancedSubscription.stripe_price_id} to ${priceId} for user ${session.user.id}`);

    // Revalidate the account page to refresh the UI
    revalidatePath('/account');

    return {
      success: true,
      subscription: {
        ...enhancedSubscription,
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

    // Get Stripe configuration - try database first, fallback to environment
    const { data: stripeConfigRecord, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    let stripeConfig: any = null;

    // Check if we got valid config from database
    if (!configError && stripeConfigRecord?.value) {
      stripeConfig = stripeConfigRecord.value as any;
    } else {
      // Fallback to environment variables
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        stripeConfig = {
          secret_key: secretKey,
          mode: process.env.STRIPE_MODE || 'test'
        };
      }
    }

    if (!stripeConfig?.secret_key) {
      console.error('Stripe configuration error:', configError);
      throw new Error('Stripe not configured');
    }

    // Initialize Stripe admin client
    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Check if this is a free plan user (no Stripe subscription ID)
    if (!subscription.stripe_subscription_id) {
      console.log('User has free plan, cancelling local subscription only');
      
      // For free plan users, just update the local database record
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Failed to cancel subscription in database');
      }

      // Revalidate and return
      revalidatePath('/account');
      return {
        success: true,
        subscription: {
          ...subscription,
          status: 'canceled',
          canceled_at: new Date().toISOString()
        }
      };
    }

    // Validate Stripe subscription ID before making Stripe API call
    if (typeof subscription.stripe_subscription_id !== 'string') {
      throw new Error('Invalid Stripe subscription ID - cannot cancel subscription');
    }

    // Cancel subscription in Stripe
    let updatedSubscription;
    if (cancelAtPeriodEnd) {
      updatedSubscription = await stripeAdmin.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );
    } else {
      updatedSubscription = await stripeAdmin.subscriptions.cancel(
        subscription.stripe_subscription_id
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
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

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

    // Get Stripe configuration - try database first, fallback to environment
    const { data: stripeConfigRecord, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    let stripeConfig: any = null;

    // Check if we got valid config from database
    if (!configError && stripeConfigRecord?.value) {
      stripeConfig = stripeConfigRecord.value as any;
    } else {
      // Fallback to environment variables
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        stripeConfig = {
          secret_key: secretKey,
          mode: process.env.STRIPE_MODE || 'test'
        };
      }
    }

    if (!stripeConfig?.secret_key) {
      console.error('Stripe configuration error:', configError);
      throw new Error('Stripe not configured');
    }

      const stripeAdmin = createStripeAdminClient({
        secret_key: stripeConfig.secret_key,
        mode: stripeConfig.mode || 'test'
      });

    // Check if this is a free plan user (no Stripe subscription ID)
    if (!subscription.stripe_subscription_id) {
      console.log('User has free plan, reactivating local subscription only');
      
      // For free plan users, just update the local database record
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Database update error:', error);
        throw new Error('Failed to update subscription in database');
      }

      revalidatePath('/account');
      return { 
        success: true, 
        subscription: {
          ...subscription,
          status: 'active',
          cancel_at_period_end: false,
          canceled_at: null
        }
      };
    }

    // Validate Stripe subscription ID before making Stripe API call
    if (typeof subscription.stripe_subscription_id !== 'string') {
      throw new Error('Invalid Stripe subscription ID - cannot reactivate subscription');
    }

    const updatedSubscription = await stripeAdmin.subscriptions.update(
      subscription.stripe_subscription_id,
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
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (error) {
      console.error('Database update error:', error);
      throw new Error('Failed to update subscription in database');
    }

    // Log the reactivation for audit trail
    // TODO: Re-enable after database types are regenerated
    // await supabase.from('subscription_changes').insert({
    //   user_id: session.user.id,
    //   subscription_id: subscription.id,
    //   old_price_id: subscription.stripe_price_id,
    //   new_price_id: subscription.stripe_price_id,
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

    // Transform prices to match expected Price type
    const transformedPrices = prices.map(price => ({
      ...price,
      // Transform recurring_interval to interval for compatibility
      interval: price.recurring_interval,
      // Add type field based on whether it's recurring or not
      type: price.recurring_interval ? 'recurring' as const : 'one_time' as const
    }));

    // Combine products with their transformed prices
    const productsWithPrices = products.map(product => ({
      ...product,
      prices: transformedPrices.filter(price => price.stripe_product_id === product.stripe_product_id)
    }));

    return productsWithPrices;
  } catch (error) {
    console.error('Get available plans error:', error);
    throw error;
  }
}