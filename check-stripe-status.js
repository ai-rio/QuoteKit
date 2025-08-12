#!/usr/bin/env node

/**
 * Stripe Account Status Checker
 * 
 * This script will analyze your current Stripe account and identify:
 * 1. All products and their status
 * 2. All prices and their relationships
 * 3. What needs to be cleaned up
 */

const Stripe = require('stripe');

// Load environment variables
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function analyzeStripeAccount() {
  console.log('🔍 Analyzing your Stripe account...\n');

  try {
    // Get all products
    const products = await stripe.products.list({ limit: 100 });
    const prices = await stripe.prices.list({ limit: 100 });

    console.log('📦 PRODUCTS ANALYSIS');
    console.log('='.repeat(50));
    
    const productMap = {};
    let activeProducts = 0;
    let archivedProducts = 0;

    products.data.forEach(product => {
      productMap[product.id] = product;
      if (product.active) activeProducts++;
      else archivedProducts++;

      console.log(`${product.active ? '✅' : '📦'} ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Status: ${product.active ? 'ACTIVE' : 'ARCHIVED'}`);
      console.log(`   Description: ${product.description || 'No description'}`);
      if (product.metadata && Object.keys(product.metadata).length > 0) {
        console.log(`   Metadata: ${JSON.stringify(product.metadata)}`);
      }
      console.log('');
    });

    console.log(`Total Products: ${products.data.length} (${activeProducts} active, ${archivedProducts} archived)\n`);

    console.log('💰 PRICES ANALYSIS');
    console.log('='.repeat(50));

    let activePrices = 0;
    let archivedPrices = 0;
    const pricesByProduct = {};

    prices.data.forEach(price => {
      if (price.active) activePrices++;
      else archivedPrices++;

      if (!pricesByProduct[price.product]) {
        pricesByProduct[price.product] = [];
      }
      pricesByProduct[price.product].push(price);

      const product = productMap[price.product];
      const productName = product ? product.name : 'Unknown Product';

      console.log(`${price.active ? '💵' : '📦'} $${(price.unit_amount / 100).toFixed(2)} / ${price.recurring?.interval || 'one-time'}`);
      console.log(`   ID: ${price.id}`);
      console.log(`   Product: ${productName} (${price.product})`);
      console.log(`   Status: ${price.active ? 'ACTIVE' : 'ARCHIVED'}`);
      console.log(`   Currency: ${price.currency.toUpperCase()}`);
      if (price.metadata && Object.keys(price.metadata).length > 0) {
        console.log(`   Metadata: ${JSON.stringify(price.metadata)}`);
      }
      console.log('');
    });

    console.log(`Total Prices: ${prices.data.length} (${activePrices} active, ${archivedPrices} archived)\n`);

    // Analyze what needs cleanup
    console.log('🧹 CLEANUP RECOMMENDATIONS');
    console.log('='.repeat(50));

    const targetStructure = {
      'Free Plan': { count: 0, prices: [] },
      'Premium Plan': { count: 0, prices: [] },
      'Pro Plan': { count: 0, prices: [] }
    };

    const otherProducts = [];

    products.data.forEach(product => {
      const name = product.name;
      if (targetStructure[name]) {
        targetStructure[name].count++;
      } else {
        otherProducts.push(product);
      }
    });

    console.log('Products to keep/consolidate:');
    Object.entries(targetStructure).forEach(([name, data]) => {
      if (data.count > 0) {
        console.log(`   ✅ ${name}: ${data.count} product(s) found`);
      } else {
        console.log(`   ❌ ${name}: NOT FOUND - needs to be created`);
      }
    });

    if (otherProducts.length > 0) {
      console.log('\nProducts to archive/remove:');
      otherProducts.forEach(product => {
        console.log(`   📦 ${product.name} (${product.id}) - ${product.active ? 'ACTIVE' : 'ARCHIVED'}`);
      });
    }

    // Check for problematic prices
    console.log('\nPrice analysis:');
    
    const problematicPrices = prices.data.filter(price => {
      const product = productMap[price.product];
      if (!product) return true;
      
      // Check for unexpected price points
      const amount = price.unit_amount / 100;
      if (amount !== 0 && amount !== 12 && amount !== 115.2) {
        return true;
      }
      
      return false;
    });

    if (problematicPrices.length > 0) {
      console.log('   ⚠️  Prices that don\'t match intended structure:');
      problematicPrices.forEach(price => {
        const product = productMap[price.product];
        console.log(`      - $${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval || 'one-time'} for ${product?.name || 'Unknown'}`);
      });
    }

    // Expected final state
    console.log('\n🎯 INTENDED FINAL STATE');
    console.log('='.repeat(50));
    console.log('Products (2 total):');
    console.log('   - Free Plan (with metadata for features)');
    console.log('   - Premium Plan (with metadata for features)');
    console.log('');
    console.log('Prices (3 total):');
    console.log('   - $0.00/month (Free Plan)');
    console.log('   - $12.00/month (Premium Plan)');
    console.log('   - $115.20/year (Premium Plan - 20% discount)');

    console.log('\n📋 NEXT STEPS');
    console.log('='.repeat(50));
    if (otherProducts.length > 0 || problematicPrices.length > 0) {
      console.log('1. ⚠️  Your account needs cleanup');
      console.log('2. 🔧 Run: node stripe-cleanup-script.js');
      console.log('3. ✅ Verify the results in your Stripe dashboard');
      console.log('4. 🔄 Update your frontend code with new price IDs');
    } else {
      console.log('✅ Your Stripe account structure looks clean!');
      console.log('   Just verify that the price IDs in your frontend match your active prices.');
    }

    // Show current price IDs used in frontend
    console.log('\n🔗 CURRENT FRONTEND PRICE IDs');
    console.log('='.repeat(50));
    console.log('Based on your LawnQuotePricing.tsx file:');
    console.log('   Free Monthly: price_free_monthly');
    console.log('   Premium Monthly: price_1RVyAQGgBK1ooXYF0LokEHtQ');
    console.log('   Premium Yearly: price_1RoUo5GgBK1ooXYF4nMSQooR');
    
    // Check if these exist in Stripe
    const frontendPriceIds = [
      'price_1RVyAQGgBK1ooXYF0LokEHtQ',
      'price_1RoUo5GgBK1ooXYF4nMSQooR'
    ];
    
    console.log('\nVerifying frontend price IDs in Stripe:');
    for (const priceId of frontendPriceIds) {
      const found = prices.data.find(p => p.id === priceId);
      if (found) {
        console.log(`   ✅ ${priceId} - $${(found.unit_amount / 100).toFixed(2)}/${found.recurring?.interval || 'one-time'} (${found.active ? 'ACTIVE' : 'ARCHIVED'})`);
      } else {
        console.log(`   ❌ ${priceId} - NOT FOUND IN STRIPE`);
      }
    }

  } catch (error) {
    console.error('❌ Error analyzing Stripe account:', error.message);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  analyzeStripeAccount().catch(console.error);
}

module.exports = { analyzeStripeAccount };