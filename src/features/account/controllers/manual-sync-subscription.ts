import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { cleanupDuplicateSubscriptions } from './get-subscription';
import { upsertUserSubscription } from './upsert-user-subscription';

/**
 * Sync product and price data from Stripe to local database
 * This ensures we have the necessary data to display subscription details
 */
async function syncProductAndPriceData(stripe: any, priceId: string) {
  try {
    console.log(`📦 Syncing product and price data for price ${priceId}`);
    
    // Get price data from Stripe
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    });
    
    // Sync product data first
    if (price.product && typeof price.product === 'object') {
      const product = price.product;
      console.log(`📦 Syncing product ${product.id}: ${product.name}`);
      
      await supabaseAdminClient
        .from('stripe_products')
        .upsert({
          stripe_product_id: product.id,
          name: product.name,
          description: product.description || null,
          active: product.active,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'stripe_product_id'
        });
      
      console.log(`✅ Product synced: ${product.name}`);
    }
    
    // Sync price data
    console.log(`💰 Syncing price ${price.id}`);
    await supabaseAdminClient
      .from('stripe_prices')
      .upsert({
        stripe_price_id: price.id,
        stripe_product_id: typeof price.product === 'string' ? price.product : price.product?.id,
        unit_amount: price.unit_amount || 0,
        currency: price.currency,
        recurring_interval: price.recurring?.interval || null,
        active: price.active,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_price_id'
      });
    
    console.log(`✅ Price synced: ${price.id} (${price.unit_amount} ${price.currency})`);
    
  } catch (error) {
    console.error(`❌ Failed to sync product/price data for ${priceId}:`, error);
    // Don't throw - let subscription sync continue even if product/price sync fails
  }
}

/**
 * Manual sync function to retrieve and sync subscription data from Stripe
 * This is a temporary fix for when webhooks fail to create subscription records
 */
export async function manualSyncSubscription(customerStripeId: string) {
  try {
    console.log(`🔄 Starting manual sync for customer: ${customerStripeId}`);
    
    // Get Stripe configuration with environment fallback
    let stripeConfig = {
      secret_key: '',
      mode: 'test' as 'test' | 'live'
    };

    try {
      const { data: configData } = await supabaseAdminClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'stripe_config')
        .single();

      if (configData?.value && typeof configData.value === 'object') {
        stripeConfig = { ...stripeConfig, ...configData.value };
      }
    } catch (dbError) {
      console.log('No database config found, using environment variables');
    }

    // Fallback to environment variables if no database config
    if (!stripeConfig.secret_key) {
      stripeConfig = {
        secret_key: process.env.STRIPE_SECRET_KEY || '',
        mode: (process.env.STRIPE_MODE as 'test' | 'live') || 'test'
      };
    }

    if (!stripeConfig.secret_key) {
      throw new Error('Stripe configuration not found in database or environment variables');
    }
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
        
        // First sync the product and price data for this subscription
        const priceId = subscription.items.data[0]?.price?.id;
        if (priceId) {
          console.log(`📦 Syncing product/price data for subscription ${subscription.id}`);
          await syncProductAndPriceData(stripe, priceId);
          
          // Verify the data was synced correctly
          const { data: verifyPrice } = await supabaseAdminClient
            .from('stripe_prices')
            .select('stripe_price_id, stripe_products!stripe_prices_stripe_product_id_fkey(name)')
            .eq('stripe_price_id', priceId)
            .single();
          
          if (verifyPrice?.stripe_products?.name) {
            console.log(`✅ Verified product data synced: ${verifyPrice.stripe_products.name}`);
          } else {
            console.warn(`⚠️ Product data verification failed for price ${priceId}`);
          }
        }
        
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

    // After syncing, cleanup any duplicate subscriptions for this customer
    try {
      // Get the user ID for this customer
      const { data: customerData } = await supabaseAdminClient
        .from('stripe_customers')
        .select('id')
        .eq('stripe_customer_id', customerStripeId)
        .single();

      if (customerData?.id) {
        console.log(`🧹 Cleaning up duplicate subscriptions for user ${customerData.id}`);
        const cleanupResult = await cleanupDuplicateSubscriptions(customerData.id);
        
        if (cleanupResult.success && cleanupResult.deactivatedCount) {
          console.log(`✨ Cleanup completed: ${cleanupResult.message}`);
        }
        
        // Also verify that the active subscription has plan data
        console.log(`🔍 Verifying active subscription has plan data...`);
        const { data: activeSubscription } = await supabaseAdminClient
          .from('subscriptions')
          .select(`
            id,
            stripe_price_id,
            stripe_prices!subscriptions_stripe_price_id_fkey(
              stripe_price_id,
              stripe_products!stripe_prices_stripe_product_id_fkey(name)
            )
          `)
          .eq('user_id', customerData.id)
          .in('status', ['active', 'trialing'])
          .single();
        
        if (activeSubscription?.stripe_prices?.stripe_products?.name) {
          console.log(`✅ Active subscription has product name: ${activeSubscription.stripe_prices.stripe_products.name}`);
        } else {
          console.warn(`⚠️ Active subscription missing product name - may still show "Unknown Plan"`);
        }
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup failed (non-critical):', cleanupError);
      // Don't fail the sync operation if cleanup fails
    }

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
    
    // Use the imported supabaseAdminClient
    
    // Get all customers from database
    const { data: customers, error } = await supabaseAdminClient
      .from('stripe_customers')
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