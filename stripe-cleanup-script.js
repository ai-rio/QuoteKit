#!/usr/bin/env node

/**
 * Stripe Pricing Cleanup and Alignment Script
 * 
 * This script will:
 * 1. Archive all existing prices and products
 * 2. Create new clean products and prices according to your intended structure
 * 3. Update your frontend code with the new price IDs
 * 
 * INTENDED STRUCTURE:
 * - Free Plan: $0/month
 * - Premium Plan: $12/month or $115.20/year (20% discount)
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuration for your intended pricing structure
const INTENDED_STRUCTURE = {
  products: [
    {
      name: 'Free Plan',
      description: 'Basic features for new businesses getting started',
      active: true,
      metadata: {
        tier: 'free',
        max_quotes: '5',
        pdf_export: 'true',
        analytics_access: 'false',
        custom_branding: 'false',
        priority_support: 'false'
      }
    },
    {
      name: 'Premium Plan',
      description: 'Advanced features for growing businesses',
      active: true,
      metadata: {
        tier: 'premium',
        max_quotes: '-1', // unlimited
        pdf_export: 'true',
        analytics_access: 'true',
        custom_branding: 'true',
        priority_support: 'true'
      }
    }
  ],
  prices: [
    {
      productName: 'Free Plan',
      amount: 0,
      currency: 'usd',
      recurring: { interval: 'month' },
      active: true
    },
    {
      productName: 'Premium Plan',
      amount: 1200, // $12.00 in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      active: true
    },
    {
      productName: 'Premium Plan',
      amount: 11520, // $115.20 in cents (20% discount)
      currency: 'usd',
      recurring: { interval: 'year' },
      active: true
    }
  ]
};

async function main() {
  console.log('🧹 Starting Stripe cleanup and realignment...\n');

  try {
    // Step 1: Archive all existing products and prices
    await archiveExistingData();

    // Step 2: Create new clean structure
    const newData = await createCleanStructure();

    // Step 3: Update frontend code with new price IDs
    await updateFrontendCode(newData);

    console.log('\n✅ Cleanup and alignment completed successfully!');
    console.log('\nNew Price IDs created:');
    Object.entries(newData.priceIds).forEach(([key, id]) => {
      console.log(`- ${key}: ${id}`);
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

async function archiveExistingData() {
  console.log('📦 Archiving existing products and prices...');
  
  // Get all products
  const products = await stripe.products.list({ limit: 100, active: true });
  
  // Archive all active products
  for (const product of products.data) {
    try {
      await stripe.products.update(product.id, { active: false });
      console.log(`   Archived product: ${product.name} (${product.id})`);
    } catch (error) {
      console.log(`   ⚠️  Could not archive product ${product.name}: ${error.message}`);
    }
  }

  // Get all prices
  const prices = await stripe.prices.list({ limit: 100, active: true });
  
  // Archive all active prices
  for (const price of prices.data) {
    try {
      await stripe.prices.update(price.id, { active: false });
      console.log(`   Archived price: ${price.unit_amount/100} ${price.currency} (${price.id})`);
    } catch (error) {
      console.log(`   ⚠️  Could not archive price ${price.id}: ${error.message}`);
    }
  }
}

async function createCleanStructure() {
  console.log('\n🏗️  Creating new clean structure...');
  
  const newData = {
    products: {},
    priceIds: {}
  };

  // Create products
  for (const productConfig of INTENDED_STRUCTURE.products) {
    try {
      const product = await stripe.products.create(productConfig);
      newData.products[productConfig.name] = product;
      console.log(`   ✅ Created product: ${product.name} (${product.id})`);
    } catch (error) {
      console.error(`   ❌ Failed to create product ${productConfig.name}: ${error.message}`);
      throw error;
    }
  }

  // Create prices
  for (const priceConfig of INTENDED_STRUCTURE.prices) {
    try {
      const product = newData.products[priceConfig.productName];
      if (!product) {
        throw new Error(`Product ${priceConfig.productName} not found`);
      }

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceConfig.amount,
        currency: priceConfig.currency,
        recurring: priceConfig.recurring,
        active: priceConfig.active
      });

      // Create a key for the price ID
      const key = priceConfig.productName === 'Free Plan' 
        ? 'free_monthly'
        : priceConfig.recurring.interval === 'month' 
        ? 'premium_monthly' 
        : 'premium_yearly';

      newData.priceIds[key] = price.id;
      
      console.log(`   ✅ Created price: ${priceConfig.amount/100} ${priceConfig.currency}/${priceConfig.recurring.interval} (${price.id})`);
    } catch (error) {
      console.error(`   ❌ Failed to create price: ${error.message}`);
      throw error;
    }
  }

  return newData;
}

async function updateFrontendCode(newData) {
  console.log('\n🔧 Updating frontend code with new price IDs...');

  // Update LawnQuotePricing component
  const pricingComponentPath = path.join(__dirname, 'src/components/pricing/LawnQuotePricing.tsx');
  
  if (fs.existsSync(pricingComponentPath)) {
    let content = fs.readFileSync(pricingComponentPath, 'utf8');
    
    // Update the price IDs in the onClick handlers
    content = content.replace(
      /onClick=\{\(\) => onSelectPlan\('price_free_monthly', 'Free Plan'\)\}/,
      `onClick={() => onSelectPlan('${newData.priceIds.free_monthly}', 'Free Plan')}`
    );
    
    content = content.replace(
      /onClick=\{\(\) => onSelectPlan\(\s*isYearly \? '[^']+' : '[^']+',\s*'Pro Plan'\s*\)\}/,
      `onClick={() => onSelectPlan(
        isYearly ? '${newData.priceIds.premium_yearly}' : '${newData.priceIds.premium_monthly}', 
        'Pro Plan'
      )}`
    );

    fs.writeFileSync(pricingComponentPath, content);
    console.log('   ✅ Updated LawnQuotePricing.tsx with new price IDs');
  } else {
    console.log('   ⚠️  LawnQuotePricing.tsx not found at expected path');
  }

  // Create a price constants file for easy reference
  const constantsPath = path.join(__dirname, 'src/constants/stripe-prices.ts');
  const constantsContent = `/**
 * Stripe Price IDs - Generated by cleanup script
 * Last updated: ${new Date().toISOString()}
 */

export const STRIPE_PRICE_IDS = {
  FREE_MONTHLY: '${newData.priceIds.free_monthly}',
  PREMIUM_MONTHLY: '${newData.priceIds.premium_monthly}',
  PREMIUM_YEARLY: '${newData.priceIds.premium_yearly}',
} as const;

export const STRIPE_PRODUCT_IDS = {
  FREE_PLAN: '${newData.products['Free Plan'].id}',
  PREMIUM_PLAN: '${newData.products['Premium Plan'].id}',
} as const;

// Helper function to get price by type
export function getStripePrice(type: 'free' | 'premium_monthly' | 'premium_yearly'): string {
  switch (type) {
    case 'free':
      return STRIPE_PRICE_IDS.FREE_MONTHLY;
    case 'premium_monthly':
      return STRIPE_PRICE_IDS.PREMIUM_MONTHLY;
    case 'premium_yearly':
      return STRIPE_PRICE_IDS.PREMIUM_YEARLY;
    default:
      throw new Error(\`Unknown price type: \${type}\`);
  }
}
`;

  fs.writeFileSync(constantsPath, constantsContent);
  console.log('   ✅ Created stripe-prices.ts constants file');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, INTENDED_STRUCTURE };