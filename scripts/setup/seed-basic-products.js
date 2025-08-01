#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function seedBasicProducts() {
  console.log('🌱 Seeding Basic Stripe Products for Testing');
  console.log('============================================');

  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    // Insert basic products
    console.log('📦 Creating products...');
    
    const products = [
      {
        id: 'prod_free_plan',
        active: true,
        name: 'Free Plan',
        description: 'Basic quote management features',
        metadata: { tier: 'free' }
      },
      {
        id: 'prod_pro_plan',
        active: true,
        name: 'Pro Plan',
        description: 'Advanced features with unlimited quotes',
        metadata: { tier: 'pro' }
      },
      {
        id: 'prod_business_plan',
        active: true,
        name: 'Business Plan',
        description: 'Full business suite with analytics',
        metadata: { tier: 'business' }
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

    // Insert basic prices
    console.log('💰 Creating prices...');
    
    const prices = [
      {
        id: 'price_free',
        stripe_product_id: 'prod_free_plan',
        active: true,
        description: 'Free forever',
        unit_amount: 0,
        currency: 'usd',
        type: 'recurring',
        interval: 'month',
        interval_count: 1,
        metadata: { tier: 'free' }
      },
      {
        id: 'price_pro_monthly',
        stripe_product_id: 'prod_pro_plan',
        active: true,
        description: 'Pro plan monthly',
        unit_amount: 2900, // $29.00
        currency: 'usd',
        type: 'recurring',
        interval: 'month',
        interval_count: 1,
        metadata: { tier: 'pro' }
      },
      {
        id: 'price_business_monthly',
        stripe_product_id: 'prod_business_plan',
        active: true,
        description: 'Business plan monthly',
        unit_amount: 9900, // $99.00
        currency: 'usd',
        type: 'recurring',
        interval: 'month',
        interval_count: 1,
        metadata: { tier: 'business' }
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

    // Verify the data
    console.log('\n🔍 Verifying seeded data...');
    
    const { data: productCount } = await supabase
      .from('stripe_products')
      .select('*', { count: 'exact' });
    
    const { data: priceCount } = await supabase
      .from('stripe_prices')
      .select('*', { count: 'exact' });

    console.log(`✅ Products in database: ${productCount?.length || 0}`);
    console.log(`✅ Prices in database: ${priceCount?.length || 0}`);

    console.log('\n🎉 Basic products seeded successfully!');
    console.log('Now you can test the pricing page and subscription features.');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
}

seedBasicProducts();
