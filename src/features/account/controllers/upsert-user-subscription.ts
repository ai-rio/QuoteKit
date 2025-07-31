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
  
  // Validate required parameters
  if (!subscriptionId || typeof subscriptionId !== 'string') {
    throw new Error('Invalid subscription ID provided to upsertUserSubscription');
  }
  
  if (!customerId || typeof customerId !== 'string') {
    throw new Error('Invalid customer ID provided to upsertUserSubscription');
  }
  
  try {
    // Get customer's userId from mapping table.
    console.log(`📋 Looking up user ID for Stripe customer: ${customerId}`);
    const { data: customerData, error: noCustomerError } = await supabaseAdminClient
      .from('stripe_customers')
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
    const priceId = subscription.items.data[0].price.id;
    console.log(`💾 Preparing subscription data for database upsert:`, {
      subscriptionId: subscription.id,
      userId: userId,
      status: subscription.status,
      priceId: priceId,
      customerId: customerId
    });

    // CRITICAL FIX: Use the safe upsert function based on stripe_subscription_id
    const { data: upsertResult, error: upsertError } = await supabaseAdminClient.rpc('upsert_subscription_by_stripe_id', {
      p_stripe_subscription_id: subscription.id,
      p_user_id: userId,
      p_stripe_customer_id: customerId,
      p_stripe_price_id: priceId,
      p_status: subscription.status,
      p_metadata: subscription.metadata || {},
      p_cancel_at_period_end: subscription.cancel_at_period_end,
      p_current_period_start: toDateTime(subscription.current_period_start).toISOString(),
      p_current_period_end: toDateTime(subscription.current_period_end).toISOString(),
      p_trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
      p_trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
      p_cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
      p_canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
      p_ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null
    });

    if (upsertError) {
      console.error(`❌ CRITICAL: Database upsert failed for subscription ${subscription.id}:`, {
        error: upsertError,
        userId,
        customerId,
        priceId,
        subscriptionStatus: subscription.status
      });
      
      // Log additional diagnostic info
      console.error(`💥 Upsert Error Details:`, {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint
      });
      
      // Try fallback direct insert/update
      console.log(`🔄 Attempting fallback direct upsert for subscription ${subscription.id}`);
      
      const subscriptionData: Database['public']['Tables']['subscriptions']['Insert'] = {
        id: subscription.id,
        user_id: userId,
        metadata: subscription.metadata || {},
        status: subscription.status,
        stripe_price_id: priceId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
        canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
        current_period_start: toDateTime(subscription.current_period_start).toISOString(),
        current_period_end: toDateTime(subscription.current_period_end).toISOString(),
        ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
        trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
        trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
        created: new Date().toISOString()
      };

      const { error: fallbackError } = await supabaseAdminClient.from('subscriptions').upsert([subscriptionData]);
      if (fallbackError) {
        console.error(`❌ FALLBACK FAILED: Direct upsert also failed for subscription ${subscription.id}:`, fallbackError);
        throw new Error(`Both safe_upsert_subscription and direct upsert failed: ${fallbackError.message}`);
      }
      
      console.log(`✅ Fallback successful: Direct upsert worked for subscription [${subscription.id}]`);
    } else {
      console.log(`✅ Safe upsert successful: subscription [${subscription.id}] upserted with result: ${upsertResult}`);
    }
    
    // Verify the subscription was actually created/updated
    const { data: verifyData, error: verifyError } = await supabaseAdminClient
      .from('subscriptions')
      .select('id, user_id, status, stripe_price_id, stripe_subscription_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (verifyError || !verifyData) {
      console.error(`❌ VERIFICATION FAILED: Could not find subscription ${subscription.id} after upsert:`, verifyError);
      throw new Error(`Subscription upsert verification failed: ${verifyError?.message || 'Record not found'}`);
    }
    
    console.log(`✅ VERIFICATION SUCCESS: Subscription [${subscription.id}] confirmed in database:`, {
      id: verifyData.id,
      stripeSubscriptionId: verifyData.stripe_subscription_id,
      userId: verifyData.user_id,
      status: verifyData.status,
      priceId: verifyData.stripe_price_id
    });

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
