import Stripe from 'stripe';

import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';
import { toDateTime } from '@/utils/to-date-time';
import { AddressParam } from '@stripe/stripe-js';

export async function upsertUserSubscription({
  subscriptionId,
  customerId,
  isCreateAction,
}: {
  subscriptionId: string;
  customerId: string;
  isCreateAction?: boolean;
}) {
  console.log(`🔄 Starting upsertUserSubscription for subscription ${subscriptionId}, customer ${customerId}, isCreate: ${isCreateAction}`);
  
  try {
    // Get customer's userId from mapping table.
    console.log(`📋 Looking up user ID for Stripe customer: ${customerId}`);
    const { data: customerData, error: noCustomerError } = await supabaseAdminClient
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();
    
    if (noCustomerError) {
      console.error(`❌ Customer lookup failed for ${customerId}:`, noCustomerError);
      throw noCustomerError;
    }
    
    if (!customerData) {
      console.error(`❌ No customer data found for Stripe customer: ${customerId}`);
      throw new Error(`Customer mapping not found for Stripe customer: ${customerId}`);
    }

    const { id: userId } = customerData;
    console.log(`✅ Found user ID: ${userId} for Stripe customer: ${customerId}`);

    console.log(`📞 Retrieving subscription from Stripe: ${subscriptionId}`);
    const subscription = await stripeAdmin.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });
    
    console.log(`✅ Retrieved subscription from Stripe:`, {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
      priceId: subscription.items.data[0]?.price?.id,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end
    });

    // Upsert the latest status of the subscription object.
    const subscriptionData: Database['public']['Tables']['subscriptions']['Insert'] = {
      id: subscription.id,
      user_id: userId,
      metadata: subscription.metadata,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      // Add the new Stripe-specific fields
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
      canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
      current_period_start: toDateTime(subscription.current_period_start).toISOString(),
      current_period_end: toDateTime(subscription.current_period_end).toISOString(),
      created: toDateTime(subscription.created).toISOString(),
      ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
      trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
      trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
    };

    console.log(`💾 Upserting subscription data to database:`, {
      subscriptionId: subscriptionData.id,
      userId: subscriptionData.user_id,
      status: subscriptionData.status,
      priceId: subscriptionData.price_id,
      stripeSubscriptionId: subscriptionData.stripe_subscription_id,
      stripeCustomerId: subscriptionData.stripe_customer_id
    });

    const { error } = await supabaseAdminClient.from('subscriptions').upsert([subscriptionData]);
    if (error) {
      console.error(`❌ Database upsert failed for subscription ${subscription.id}:`, error);
      throw error;
    }
    console.log(`✅ Successfully upserted subscription [${subscription.id}] for user [${userId}] in database`);

    // For a new subscription copy the billing details to the customer object.
    // NOTE: This is a costly operation and should happen at the very end.
    if (isCreateAction && subscription.default_payment_method && userId) {
      console.log(`💳 Copying billing details for new subscription: ${subscription.id}`);
      try {
        await copyBillingDetailsToCustomer(userId, subscription.default_payment_method as Stripe.PaymentMethod);
        console.log(`✅ Successfully copied billing details for user: ${userId}`);
      } catch (billingError) {
        console.error(`⚠️ Failed to copy billing details (non-critical):`, billingError);
        // Don't throw here as subscription creation is more critical
      }
    }

    console.log(`🎉 Completed upsertUserSubscription successfully for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error(`💥 upsertUserSubscription failed for subscription ${subscriptionId}:`, error);
    throw error;
  }
}

const copyBillingDetailsToCustomer = async (userId: string, paymentMethod: Stripe.PaymentMethod) => {
  const customer = paymentMethod.customer;
  if (typeof customer !== 'string') {
    throw new Error('Customer id not found');
  }

  const { name, phone, address } = paymentMethod.billing_details;
  if (!name || !phone || !address) return;

  await stripeAdmin.customers.update(customer, { name, phone, address: address as AddressParam });

  const { error } = await supabaseAdminClient
    .from('users')
    .update({
      billing_address: { ...address },
      payment_method: { ...paymentMethod[paymentMethod.type] },
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
};
