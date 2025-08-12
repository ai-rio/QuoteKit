#!/usr/bin/env node

/**
 * Targeted Pricing Alignment Fix
 * 
 * This script will fix the specific $29 vs $12 pricing issue by:
 * 1. Creating a clean Premium Plan with correct $12/$115.20 pricing structure
 * 2. Archiving conflicting products/prices
 * 3. Providing the correct price IDs for your frontend
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixPricingAlignment() {
  console.log('🔧 Fixing pricing alignment issue...\n');

  try {
    // Step 1: Archive the problematic $29 Premium Plan price
    console.log('1. 📦 Archiving problematic $29 Premium Plan price...');
    await stripe.prices.update('price_1RriYXGgBK1ooXYFdbTtapey', { active: false });
    console.log('   ✅ Archived $29 Premium Plan price');

    // Step 2: Update the existing Premium Plan product to have correct pricing
    console.log('\n2. 🏗️  Creating correct pricing structure...');
    
    // Use the existing Premium Plan product but add correct prices
    const premiumProductId = 'prod_premium_plan';
    
    // Create $12/month price for Premium Plan
    const monthlyPrice = await stripe.prices.create({
      product: premiumProductId,
      unit_amount: 1200, // $12.00
      currency: 'usd',
      recurring: { interval: 'month' },
      active: true,
      metadata: {
        tier: 'premium',
        billing_cycle: 'monthly'
      }
    });

    // Create $115.20/year price for Premium Plan (20% discount)
    const yearlyPrice = await stripe.prices.create({
      product: premiumProductId,
      unit_amount: 11520, // $115.20
      currency: 'usd',
      recurring: { interval: 'year' },
      active: true,
      metadata: {
        tier: 'premium',
        billing_cycle: 'yearly',
        discount_percent: '20'
      }
    });

    console.log(`   ✅ Created Premium Monthly: ${monthlyPrice.id} ($12.00/month)`);
    console.log(`   ✅ Created Premium Yearly: ${yearlyPrice.id} ($115.20/year)`);

    // Step 3: Update the Premium Plan product metadata
    await stripe.products.update(premiumProductId, {
      description: 'Advanced features for growing businesses - unlimited quotes and premium features',
      metadata: {
        tier: 'premium',
        max_quotes: '-1',
        pdf_export: 'true',
        analytics_access: 'true',
        custom_branding: 'true',
        priority_support: 'true',
        client_management: 'true'
      }
    });

    console.log('   ✅ Updated Premium Plan product metadata');

    // Step 4: Archive old conflicting prices but keep the ones your frontend uses
    console.log('\n3. 📦 Archiving old conflicting prices...');
    
    const pricesToArchive = [
      'price_1RoUo5GgBK1ooXYF4nMSQooR', // Old $72/year
    ];

    for (const priceId of pricesToArchive) {
      try {
        await stripe.prices.update(priceId, { active: false });
        console.log(`   ✅ Archived ${priceId}`);
      } catch (error) {
        console.log(`   ⚠️  Could not archive ${priceId}: ${error.message}`);
      }
    }

    // Step 5: Update frontend price IDs
    console.log('\n4. 🔄 Updating frontend configuration...');
    
    const newPriceIds = {
      free: 'price_1RriYWGgBK1ooXYFFHN7Jgsq', // Keep existing free price
      premium_monthly: monthlyPrice.id,
      premium_yearly: yearlyPrice.id
    };

    // Update the constants file
    const constantsPath = path.join(__dirname, 'src/constants/stripe-prices.ts');
    const constantsContent = `/**
 * Stripe Price IDs - Updated by pricing alignment fix
 * Last updated: ${new Date().toISOString()}
 */

export const STRIPE_PRICE_IDS = {
  FREE_MONTHLY: '${newPriceIds.free}',
  PREMIUM_MONTHLY: '${newPriceIds.premium_monthly}',
  PREMIUM_YEARLY: '${newPriceIds.premium_yearly}',
} as const;

export const STRIPE_PRODUCT_IDS = {
  FREE_PLAN: 'prod_free_plan',
  PREMIUM_PLAN: 'prod_premium_plan',
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

// Pricing configuration for display
export const PRICING_CONFIG = {
  FREE: {
    name: 'Free Plan',
    monthlyPrice: 0,
    features: ['5 Quotes / Month', 'Unlimited Item Library', 'Real-time Quote Calculator', 'Professional PDF Generation']
  },
  PREMIUM: {
    name: 'Premium Plan', 
    monthlyPrice: 12,
    yearlyDiscount: 0.20,
    get yearlyPrice() {
      return this.monthlyPrice * 12 * (1 - this.yearlyDiscount);
    },
    get monthlyPriceWhenYearly() {
      return this.monthlyPrice * (1 - this.yearlyDiscount);
    },
    features: ['Unlimited Quotes', 'Remove LawnQuote Branding', 'Client Management', 'Quote Templates', 'Business Dashboard & Analytics']
  }
} as const;
`;

    fs.writeFileSync(constantsPath, constantsContent);
    console.log('   ✅ Updated stripe-prices.ts constants file');

    // Step 6: Create updated component file
    console.log('   ✅ Creating updated pricing component template...');
    
    const componentUpdatePath = path.join(__dirname, 'PRICING_COMPONENT_UPDATE.md');
    const componentUpdate = `# Pricing Component Updates Required

## Update LawnQuotePricing.tsx

Replace the hard-coded price IDs in your component with the new ones:

\`\`\`typescript
// Add this import at the top
import { getStripePrice } from '@/constants/stripe-prices';

// Update the Free Plan button (around line 56):
<Button 
  onClick={() => onSelectPlan(getStripePrice('free'), 'Free Plan')}
  className="mt-8 w-full bg-paper-white text-forest-green border-2 border-forest-green font-bold px-6 py-4 rounded-lg hover:bg-forest-green hover:text-paper-white transition-all duration-200"
>
  Start for Free
</Button>

// Update the Premium Plan button (around line 119):
<Button 
  onClick={() => onSelectPlan(
    isYearly ? getStripePrice('premium_yearly') : getStripePrice('premium_monthly'), 
    'Pro Plan'
  )}
  className="mt-8 w-full bg-equipment-yellow text-charcoal font-bold px-6 py-4 rounded-lg hover:brightness-110 transition-all duration-200"
>
  Upgrade to Pro
</Button>
\`\`\`

## New Price IDs Created

- **Free Monthly:** ${newPriceIds.free}
- **Premium Monthly:** ${newPriceIds.premium_monthly}  
- **Premium Yearly:** ${newPriceIds.premium_yearly}

## What This Fixes

- ✅ Account upgrade modal will now show $12/month instead of $29/month
- ✅ Pricing page and account page are now aligned
- ✅ Clean pricing structure: Free ($0), Premium ($12/month, $115.20/year)

## Testing Steps

1. Visit the pricing page - should show $12/month and $9.60/month (yearly)
2. Login and visit account page - upgrade modal should show $12 Premium plan
3. Test free plan signup
4. Test premium plan upgrade (monthly and yearly)
`;

    fs.writeFileSync(componentUpdatePath, componentUpdate);

    console.log('\n✅ Pricing alignment fix completed successfully!\n');
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(50));
    console.log('✅ Archived problematic $29 Premium Plan price');
    console.log('✅ Created new $12/month Premium Plan price');
    console.log('✅ Created new $115.20/year Premium Plan price (20% discount)');  
    console.log('✅ Updated Premium Plan product metadata');
    console.log('✅ Updated price constants file');
    console.log('');
    console.log('🔗 New Price IDs:');
    Object.entries(newPriceIds).forEach(([key, id]) => {
      console.log(`   ${key}: ${id}`);
    });
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Read PRICING_COMPONENT_UPDATE.md for frontend changes');
    console.log('2. Update your LawnQuotePricing.tsx component');  
    console.log('3. Test the pricing flow end-to-end');
    console.log('4. Verify account upgrade modal shows $12 (not $29)');

  } catch (error) {
    console.error('❌ Error during pricing fix:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixPricingAlignment().catch(console.error);
}

module.exports = { fixPricingAlignment };