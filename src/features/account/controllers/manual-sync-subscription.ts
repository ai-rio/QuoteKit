import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { upsertUserSubscription } from './upsert-user-subscription';

/**
 * Manual sync function to retrieve and sync subscription data from Stripe
 * This is a temporary fix for when webhooks fail to create subscription records
 */
export async function manualSyncSubscription(customerStripeId: string) {
  try {
    console.log(`🔄 Starting manual sync for customer: ${customerStripeId}`);
    
    // Get Stripe configuration
    const supabaseAdminClient = supabaseAdminClient();
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (!configData?.value) {
      throw new Error('Stripe configuration not found');
    }

    const stripeConfig = configData.value as { secret_key: string; mode: 'test' | 'live' };
    const stripe = createStripeAdminClient(stripeConfig);

    // Fetch all subscriptions for this customer from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerStripeId,
      status: 'all', // Get all statuses to ensure we don't miss any
      limit: 100
    });

    console.log(`📋 Found ${subscriptions.data.length} subscriptions for customer ${customerStripeId}`);

    if (subscriptions.data.length === 0) {
      console.log(`⚠️  No subscriptions found in Stripe for customer ${customerStripeId}`);
      return { synced: 0, message: 'No subscriptions found in Stripe' };
    }

    let syncedCount = 0;
    const syncResults = [];

    // Sync each subscription
    for (const subscription of subscriptions.data) {
      try {
        console.log(`🔗 Syncing subscription ${subscription.id} (status: ${subscription.status})`);
        
        await upsertUserSubscription({
          subscriptionId: subscription.id,
          customerId: customerStripeId,
          isCreateAction: false // This is a sync operation, not a new creation
        });

        syncedCount++;
        syncResults.push({
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price?.id,
          success: true
        });

        console.log(`✅ Successfully synced subscription ${subscription.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync subscription ${subscription.id}:`, error);
        syncResults.push({
          subscriptionId: subscription.id,
          status: subscription.status,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 Manual sync completed: ${syncedCount}/${subscriptions.data.length} subscriptions synced`);

    return {
      synced: syncedCount,
      total: subscriptions.data.length,
      results: syncResults,
      message: `Successfully synced ${syncedCount} of ${subscriptions.data.length} subscriptions`
    };

  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    throw new Error(`Manual sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sync all subscriptions for all customers (admin function)
 */
export async function manualSyncAllSubscriptions() {
  try {
    console.log('🚀 Starting manual sync for all customers...');
    
    const supabaseAdminClient = supabaseAdminClient();
    
    // Get all customers from database
    const { data: customers, error } = await supabaseAdminClient
      .from('customers')
      .select('id, stripe_customer_id');

    if (error) {
      throw error;
    }

    if (!customers || customers.length === 0) {
      return { message: 'No customers found', totalSynced: 0 };
    }

    console.log(`📋 Found ${customers.length} customers to sync`);

    let totalSynced = 0;
    const customerResults = [];

    for (const customer of customers) {
      if (!customer.stripe_customer_id) {
        console.log(`⚠️  Skipping customer ${customer.id} - no Stripe customer ID`);
        continue;
      }

      try {
        const result = await manualSyncSubscription(customer.stripe_customer_id);
        totalSynced += result.synced;
        customerResults.push({
          customerId: customer.id,
          stripeCustomerId: customer.stripe_customer_id,
          ...result
        });
      } catch (error) {
        console.error(`❌ Failed to sync customer ${customer.stripe_customer_id}:`, error);
        customerResults.push({
          customerId: customer.id,
          stripeCustomerId: customer.stripe_customer_id,
          synced: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 Bulk sync completed: ${totalSynced} total subscriptions synced across ${customers.length} customers`);

    return {
      totalCustomers: customers.length,
      totalSynced,
      results: customerResults,
      message: `Synced ${totalSynced} subscriptions across ${customers.length} customers`
    };

  } catch (error) {
    console.error('❌ Bulk sync failed:', error);
    throw new Error(`Bulk sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}