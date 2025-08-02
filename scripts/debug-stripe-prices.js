#!/usr/bin/env node

/**
 * Debug Script: Check Stripe Products and Prices
 * 
 * This script will:
 * 1. List all products in your Stripe account
 * 2. List all prices for each product
 * 3. Show what price IDs are actually available
 * 4. Compare with what your code expects
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugStripePrices() {
  console.log('🔍 Debugging Stripe Products and Prices...\n');
  
  try {
    // List all products
    console.log('📦 PRODUCTS IN YOUR STRIPE ACCOUNT:');
    const products = await stripe.products.list({ limit: 10 });
    
    if (products.data.length === 0) {
      console.log('❌ No products found in your Stripe account!');
      console.log('   You need to create products first.\n');
      return;
    }
    
    for (const product of products.data) {
      console.log(`\n  Product: ${product.name} (${product.id})`);
      console.log(`  Active: ${product.active}`);
      console.log(`  Description: ${product.description || 'No description'}`);
      
      // List prices for this product
      const prices = await stripe.prices.list({ 
        product: product.id,
        limit: 10 
      });
      
      if (prices.data.length > 0) {
        console.log('  💰 Prices:');
        for (const price of prices.data) {
          const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free';
          const interval = price.recurring ? `/${price.recurring.interval}` : 'one-time';
          console.log(`    - ${price.id}: ${amount}${interval} (${price.active ? 'active' : 'inactive'})`);
        }
      } else {
        console.log('    ❌ No prices found for this product');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 WHAT YOUR CODE EXPECTS:');
    console.log('  - price_pro_monthly (for Pro Monthly plan)');
    console.log('  - price_pro_annual (for Pro Annual plan)');
    
    console.log('\n🔧 SOLUTIONS:');
    console.log('  1. Create missing products/prices in Stripe Dashboard');
    console.log('  2. Update your code to use existing price IDs');
    console.log('  3. Run the setup script to create products automatically');
    
    // Check if the expected prices exist
    console.log('\n🔍 CHECKING FOR EXPECTED PRICES:');
    const expectedPrices = ['price_pro_monthly', 'price_pro_annual'];
    
    for (const expectedPrice of expectedPrices) {
      try {
        const price = await stripe.prices.retrieve(expectedPrice);
        console.log(`  ✅ ${expectedPrice}: Found ($${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval})`);
      } catch (error) {
        console.log(`  ❌ ${expectedPrice}: NOT FOUND`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking Stripe:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('\n🔑 Check your STRIPE_SECRET_KEY in .env.local');
    }
  }
}

// Run the debug
debugStripePrices().then(() => {
  console.log('\n✅ Debug complete!');
}).catch(console.error);
