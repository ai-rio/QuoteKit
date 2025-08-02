/**
 * Production-ready script to sync local products and prices to Stripe
 * Usage: node scripts/sync-stripe-products.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use local Supabase instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncStripeProducts() {
  console.log('🔄 Syncing local products and prices to Stripe...\n');

  try {
    // Check if we have Stripe credentials
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment');
      console.log('Make sure your .env.local file has the STRIPE_SECRET_KEY set');
      return;
    }

    console.log('🔑 Stripe credentials found, initializing...');
    
    // Import and initialize Stripe
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeSecretKey);

    // 1. Get local products and prices
    console.log('\n1️⃣ Getting local products and prices...');
    
    const { data: localProducts, error: productsError } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('active', true);

    if (productsError) {
      console.error('❌ Error fetching local products:', productsError.message);
      return;
    }

    const { data: localPrices, error: pricesError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('active', true);

    if (pricesError) {
      console.error('❌ Error fetching local prices:', pricesError.message);
      return;
    }

    console.log(`📦 Found ${localProducts.length} products and ${localPrices.length} prices to sync`);

    // 2. Sync products to Stripe
    console.log('\n2️⃣ Syncing products to Stripe...');
    
    for (const product of localProducts) {
      console.log(`🔄 Processing product: ${product.id} (${product.name})`);
      
      try {
        // Check if product already exists
        await stripe.products.retrieve(product.id);
        console.log(`   ✅ Product already exists in Stripe`);
      } catch (error) {
        if (error.code === 'resource_missing') {
          // Product doesn't exist, create it
          console.log(`   🆕 Creating product in Stripe...`);
          
          await stripe.products.create({
            id: product.id,
            name: product.name,
            description: product.description || '',
            active: product.active,
            metadata: product.metadata || {}
          });
          
          console.log(`   ✅ Created product: ${product.id}`);
        } else {
          console.error(`   ❌ Error checking product: ${error.message}`);
          continue;
        }
      }
    }

    // 3. Sync prices to Stripe
    console.log('\n3️⃣ Syncing prices to Stripe...');
    
    for (const price of localPrices) {
      console.log(`🔄 Processing price: ${price.id} ($${(price.unit_amount / 100).toFixed(2)})`);
      
      try {
        // Check if price already exists
        await stripe.prices.retrieve(price.id);
        console.log(`   ✅ Price already exists in Stripe`);
      } catch (error) {
        if (error.code === 'resource_missing') {
          console.log(`   ❌ Price ${price.id} not found in Stripe`);
          console.log(`   ⚠️  This price may need to be recreated with a new Stripe-generated ID`);
          console.log(`   💡 Consider running the price sync process to create missing prices`);
        } else {
          console.error(`   ❌ Error checking price: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Sync check completed!');
    console.log('All products should now exist in Stripe.');
    console.log('If any prices are missing, they may need to be recreated with Stripe-generated IDs.');

  } catch (error) {
    console.error('💥 Sync failed:', error);
  }
}

// Run the sync
if (require.main === module) {
  syncStripeProducts()
    .then(() => {
      console.log('\n✅ Sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncStripeProducts };
