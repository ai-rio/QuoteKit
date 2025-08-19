import Stripe from 'stripe';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/types/supabase';

type StripePrice = Database['public']['Tables']['stripe_prices']['Row'];

export async function upsertPrice(price: Stripe.Price) {
  const priceData = {
    id: price.id, // Use Stripe price ID as the database ID
    stripe_price_id: price.id,
    stripe_product_id: typeof price.product === 'string' ? price.product : '',
    unit_amount: price.unit_amount ?? 0,
    currency: price.currency,
    recurring_interval: price.recurring?.interval ?? null,
    active: price.active,
  };

  const { error } = await supabaseAdminClient.from('stripe_prices').upsert([priceData], {
    onConflict: 'stripe_price_id'
  });

  if (error) {
    throw error;
  } else {
    console.info(`Price inserted/updated: ${price.id}`);
  }
}

/**
 * Sync a specific price status from Stripe to database
 * Useful for fixing individual price sync issues
 */
export async function syncPriceStatus(priceId: string) {
  try {
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');
    
    // Get Stripe configuration
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (!configData?.value) {
      throw new Error('Stripe not configured');
    }

    const stripeConfig = configData.value as { secret_key: string; mode: 'test' | 'live' };
    const stripe = createStripeAdminClient(stripeConfig);
    
    // Fetch the specific price from Stripe
    const stripePrice = await stripe.prices.retrieve(priceId);
    
    // Update the price in database
    await upsertPrice(stripePrice);
    
    console.log(`✅ Price ${priceId} status synced: ${stripePrice.active ? 'active' : 'inactive'}`);
    
    return {
      success: true,
      priceId,
      active: stripePrice.active,
      unit_amount: stripePrice.unit_amount
    };
    
  } catch (error) {
    console.error(`❌ Failed to sync price ${priceId}:`, error);
    throw error;
  }
}

/**
 * Batch sync price statuses for multiple prices
 * Useful for fixing multiple inactive prices at once
 */
export async function batchSyncPriceStatuses(priceIds: string[]) {
  const results = [];
  
  for (const priceId of priceIds) {
    try {
      const result = await syncPriceStatus(priceId);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        priceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

/**
 * Reactivate a price in Stripe (useful for free plans that became inactive)
 * Note: Stripe doesn't allow updating price.active directly, so this creates a new active price
 */
export async function reactivatePrice(oldPriceId: string) {
  try {
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');
    
    // Get Stripe configuration
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (!configData?.value) {
      throw new Error('Stripe not configured');
    }

    const stripeConfig = configData.value as { secret_key: string; mode: 'test' | 'live' };
    const stripe = createStripeAdminClient(stripeConfig);
    
    // Get the inactive price details
    const oldPrice = await stripe.prices.retrieve(oldPriceId);
    
    if (oldPrice.active) {
      console.log(`ℹ️ Price ${oldPriceId} is already active`);
      return {
        success: true,
        priceId: oldPriceId,
        action: 'already_active',
        message: 'Price was already active'
      };
    }
    
    // Create a new active price with the same configuration
    const newPrice = await stripe.prices.create({
      unit_amount: oldPrice.unit_amount ?? 0,
      currency: oldPrice.currency,
      product: typeof oldPrice.product === 'string' ? oldPrice.product : oldPrice.product.id,
      recurring: oldPrice.recurring ? {
        interval: oldPrice.recurring.interval,
        interval_count: oldPrice.recurring.interval_count,
        usage_type: oldPrice.recurring.usage_type
      } : undefined,
      active: true,
      nickname: oldPrice.nickname ? `${oldPrice.nickname} (reactivated)` : undefined,
      metadata: {
        ...oldPrice.metadata,
        reactivated_from: oldPriceId,
        reactivated_at: new Date().toISOString()
      }
    });
    
    // Update database with the new price
    await upsertPrice(newPrice);
    
    // Mark the old price as replaced in database
    await supabaseAdminClient
      .from('stripe_prices')
      .update({ active: false })
      .eq('stripe_price_id', oldPriceId);
    
    console.log(`✅ Price reactivated: ${oldPriceId} → ${newPrice.id}`);
    
    return {
      success: true,
      oldPriceId,
      newPriceId: newPrice.id,
      action: 'reactivated',
      message: `Price reactivated with new ID: ${newPrice.id}`
    };
    
  } catch (error) {
    console.error(`❌ Failed to reactivate price ${oldPriceId}:`, error);
    throw error;
  }
}

/**
 * Fix free plan pricing issues by ensuring an active free price exists
 */
export async function ensureFreePlanActive() {
  try {
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    
    // Find free prices (unit_amount = 0)
    const { data: freePrices } = await supabaseAdminClient
      .from('stripe_prices')
      .select('*')
      .eq('unit_amount', 0)
      .order('created_at', { ascending: false });
    
    if (!freePrices || freePrices.length === 0) {
      throw new Error('No free prices found in database');
    }
    
    // Check if any free price is already active
    const activeFreePrice = freePrices.find(p => p.active === true);
    
    if (activeFreePrice) {
      console.log(`✅ Active free price already exists: ${activeFreePrice.stripe_price_id}`);
      return {
        success: true,
        priceId: activeFreePrice.stripe_price_id,
        action: 'already_active'
      };
    }
    
    // Try to reactivate the most recent free price
    const mostRecentFreePrice = freePrices[0];
    console.log(`🔄 Attempting to reactivate free price: ${mostRecentFreePrice.stripe_price_id}`);
    
    return await reactivatePrice(mostRecentFreePrice.stripe_price_id);
    
  } catch (error) {
    console.error('❌ Failed to ensure free plan is active:', error);
    throw error;
  }
}

/**
 * Sync all products and prices from Stripe to local database
 * Useful for local development setup
 */
export async function upsertProduct(product: Stripe.Product) {
  const productData = {
    id: product.id, // Use Stripe product ID as the database ID
    stripe_product_id: product.id,
    name: product.name,
    description: product.description ?? null,
    active: product.active,
  };

  const { error } = await supabaseAdminClient.from('stripe_products').upsert([productData], {
    onConflict: 'stripe_product_id'
  });

  if (error) {
    throw error;
  } else {
    console.info(`Product inserted/updated: ${product.id}`);
  }
}

export async function syncStripeProductsAndPrices() {
  try {
    // Get Stripe configuration from admin settings (same as API endpoints)
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');
    
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (!configData?.value) {
      throw new Error('Stripe not configured. Please configure Stripe first in admin settings.');
    }

    const stripeConfig = configData.value as { secret_key: string; mode: 'test' | 'live' };
    const stripe = createStripeAdminClient(stripeConfig);
    
    console.log('Fetching products from Stripe...');
    
    // Fetch all products from Stripe (both active and inactive to sync status)
    const products = await stripe.products.list({
      limit: 100
    });
    
    console.log(`Found ${products.data.length} products`);
    
    // Sync each product
    for (const product of products.data) {
      await upsertProduct(product);
    }
    
    console.log('Fetching prices from Stripe...');
    
    // Fetch all prices from Stripe (both active and inactive to sync status)
    const prices = await stripe.prices.list({
      limit: 100
    });
    
    console.log(`Found ${prices.data.length} prices (active: ${prices.data.filter(p => p.active).length}, inactive: ${prices.data.filter(p => !p.active).length})`);
    
    // Sync each price (this will update the active status in database)
    for (const price of prices.data) {
      await upsertPrice(price);
    }
    
    // Get count of active prices after sync
    const { data: activePrices } = await supabaseAdminClient
      .from('stripe_prices')
      .select('stripe_price_id')
      .eq('active', true);
    
    console.log('✅ Stripe sync completed successfully!');
    console.log(`📊 Sync summary: ${products.data.length} products, ${prices.data.length} total prices, ${activePrices?.length || 0} active prices in database`);
    
    return { 
      success: true, 
      productsCount: products.data.length, 
      pricesCount: prices.data.length,
      activePricesCount: activePrices?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Stripe sync failed:', error);
    throw error;
  }
}
