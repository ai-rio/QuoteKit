#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function seedCleanPricing() {
  console.log('🌱 Seeding Clean 2-Tier Pricing Structure');
  console.log('=========================================');

  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    // Step 1: Clear existing products and prices
    console.log('🧹 Clearing existing products and prices...');
    
    await supabase.from('stripe_prices').delete().neq('id', 'dummy');
    await supabase.from('stripe_products').delete().neq('id', 'dummy');
    
    console.log('✅ Cleared existing data');

    // Step 2: Create new products
    console.log('📦 Creating new products...');
    
    const products = [
      {
        id: 'prod_free_plan',
        active: true,
        name: 'Free Plan',
        description: 'Perfect for getting started with basic quote management',
        metadata: { 
          tier: 'free',
          features: JSON.stringify([
            'Unlimited quotes',
            'Basic PDF generation', 
            'Client management',
            'Item catalog'
          ])
        }
      },
      {
        id: 'prod_pro_plan',
        active: true,
        name: 'Pro Plan',
        description: 'Advanced features for growing businesses',
        metadata: { 
          tier: 'pro',
          features: JSON.stringify([
            'Everything in Free',
            'Advanced analytics',
            'Email integration',
            'Quote templates',
            'Priority support'
          ])
        }
      }
    ];

    const { error: productsError } = await supabase
      .from('stripe_products')
      .insert(products);

    if (productsError) {
      console.error('❌ Error inserting products:', productsError);
      return;
    }
    console.log('✅ Products created successfully');

    // Step 3: Create new prices
    console.log('💰 Creating new prices...');
    
    const prices = [
      // Free Plan
      {
        id: 'price_free_monthly',
        stripe_product_id: 'prod_free_plan',
        active: true,
        description: 'Free forever',
        unit_amount: 0,
        currency: 'usd',
        type: 'recurring',
        interval: 'month',
        interval_count: 1,
        metadata: { 
          tier: 'free',
          billing_period: 'monthly'
        }
      },
      // Pro Plan - Monthly
      {
        id: 'price_pro_monthly',
        stripe_product_id: 'prod_pro_plan',
        active: true,
        description: 'Pro plan billed monthly',
        unit_amount: 1200, // $12.00
        currency: 'usd',
        type: 'recurring',
        interval: 'month',
        interval_count: 1,
        metadata: { 
          tier: 'pro',
          billing_period: 'monthly'
        }
      },
      // Pro Plan - Annual (20% discount)
      {
        id: 'price_pro_annual',
        stripe_product_id: 'prod_pro_plan',
        active: true,
        description: 'Pro plan billed annually (20% savings)',
        unit_amount: 11520, // $115.20 ($12*12*0.8)
        currency: 'usd',
        type: 'recurring',
        interval: 'year',
        interval_count: 1,
        metadata: { 
          tier: 'pro',
          billing_period: 'annual',
          savings_percent: '20',
          monthly_equivalent: '1200'
        }
      }
    ];

    const { error: pricesError } = await supabase
      .from('stripe_prices')
      .insert(prices);

    if (pricesError) {
      console.error('❌ Error inserting prices:', pricesError);
      return;
    }
    console.log('✅ Prices created successfully');

    // Step 4: Verify the data
    console.log('\n🔍 Verifying seeded data...');
    
    const { data: productCount } = await supabase
      .from('stripe_products')
      .select('*', { count: 'exact' });
    
    const { data: priceCount } = await supabase
      .from('stripe_prices')
      .select('*', { count: 'exact' });

    console.log(`✅ Products in database: ${productCount?.length || 0}`);
    console.log(`✅ Prices in database: ${priceCount?.length || 0}`);

    // Step 5: Display pricing structure
    console.log('\n💎 New Pricing Structure:');
    console.log('========================');
    console.log('🆓 Free Plan: $0/month');
    console.log('   • Unlimited quotes');
    console.log('   • Basic PDF generation');
    console.log('   • Client management');
    console.log('   • Item catalog');
    console.log('');
    console.log('⭐ Pro Plan:');
    console.log('   • Monthly: $12/month');
    console.log('   • Annual: $115.20/year (save $28.80!)');
    console.log('   • Everything in Free +');
    console.log('   • Advanced analytics');
    console.log('   • Email integration');
    console.log('   • Quote templates');
    console.log('   • Priority support');

    console.log('\n🎉 Clean 2-tier pricing structure seeded successfully!');
    console.log('Ready for Step 2: Update Pricing Page');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
}

seedCleanPricing();
