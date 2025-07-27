import Stripe from 'stripe';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';

type StripePrice = Database['public']['Tables']['stripe_prices']['Row'];

export async function upsertPrice(price: Stripe.Price) {
  const priceData = {
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
 * Sync all products and prices from Stripe to local database
 * Useful for local development setup
 */
export async function upsertProduct(product: Stripe.Product) {
  const productData = {
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
    
    // Fetch all active products from Stripe
    const products = await stripe.products.list({
      active: true,
      limit: 100
    });
    
    console.log(`Found ${products.data.length} products`);
    
    // Sync each product
    for (const product of products.data) {
      await upsertProduct(product);
    }
    
    console.log('Fetching prices from Stripe...');
    
    // Fetch all active prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      limit: 100
    });
    
    console.log(`Found ${prices.data.length} prices`);
    
    // Sync each price
    for (const price of prices.data) {
      await upsertPrice(price);
    }
    
    console.log('✅ Stripe sync completed successfully!');
    return { success: true, productsCount: products.data.length, pricesCount: prices.data.length };
    
  } catch (error) {
    console.error('❌ Stripe sync failed:', error);
    throw error;
  }
}
