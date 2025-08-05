import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * Sync missing price data from Stripe when it's not found in local database
 * This is used as a fallback when price data is missing during subscription queries
 */
export async function syncMissingPriceData(priceId: string) {
  try {
    console.log(`🔄 Syncing missing price data for: ${priceId}`);
    
    // Get Stripe configuration
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
      throw new Error('Stripe configuration not found');
    }

    const stripe = createStripeAdminClient(stripeConfig);
    
    // Get price data from Stripe with product expansion
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    });
    
    console.log(`📦 Retrieved price from Stripe: ${price.id} (${price.unit_amount} ${price.currency})`);
    
    // Sync product data first if it's expanded
    let productData = null;
    if (price.product && typeof price.product === 'object') {
      const product = price.product;
      
      // Check if product is not deleted and has required properties
      if (product.object === 'product' && 'name' in product && 'active' in product) {
        console.log(`📦 Syncing product ${product.id}: ${product.name}`);
        
        const { data: syncedProduct } = await supabaseAdminClient
          .from('stripe_products')
          .upsert({
            id: product.id, // Use Stripe product ID as the database ID
            stripe_product_id: product.id,
            name: product.name,
            description: product.description || null,
            active: product.active,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_product_id'
          })
          .select()
          .single();
        
        productData = syncedProduct;
        console.log(`✅ Product synced: ${product.name}`);
      } else {
        console.log(`⚠️ Product ${product.id} is deleted or missing required properties, skipping sync`);
      }
    }
    
    // Sync price data
    console.log(`💰 Syncing price ${price.id}`);
    const { data: syncedPrice, error: priceError } = await supabaseAdminClient
      .from('stripe_prices')
      .upsert({
        id: price.id, // Use Stripe price ID as the database ID
        stripe_price_id: price.id,
        stripe_product_id: typeof price.product === 'string' ? price.product : price.product?.id,
        unit_amount: price.unit_amount || 0,
        currency: price.currency,
        recurring_interval: price.recurring?.interval || null,
        active: price.active,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_price_id'
      })
      .select()
      .single();
    
    if (priceError) {
      throw new Error(`Failed to sync price data: ${priceError.message}`);
    }
    
    console.log(`✅ Price synced: ${price.id} (${price.unit_amount} ${price.currency})`);
    
    // Return the synced price data with product information
    return {
      ...syncedPrice,
      product_data: productData
    };
    
  } catch (error) {
    console.error(`❌ Failed to sync missing price data for ${priceId}:`, error);
    throw error;
  }
}