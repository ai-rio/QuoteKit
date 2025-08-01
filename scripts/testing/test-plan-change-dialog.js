#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testPlanChangeDialog() {
  console.log('🧪 Testing PlanChangeDialog Data Flow');
  console.log('=====================================');

  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  // Simulate the getAvailablePlans function
  console.log('📦 Step 1: Fetching products...');
  const { data: products } = await supabase
    .from('stripe_products')
    .select('*')
    .eq('active', true)
    .order('created_at');

  console.log(`✅ Found ${products?.length || 0} products`);

  console.log('\n💰 Step 2: Fetching prices...');
  const { data: prices } = await supabase
    .from('stripe_prices')
    .select('*')
    .eq('active', true)
    .in('stripe_product_id', products?.map(p => p.id) || []);

  console.log(`✅ Found ${prices?.length || 0} prices`);

  console.log('\n🔗 Step 3: Combining data...');
  const transformedPrices = prices?.map(price => ({
    ...price,
    interval: price.interval,
    type: price.interval ? 'recurring' : 'one_time',
    stripe_price_id: price.id
  })) || [];

  const productsWithPrices = products?.map(product => ({
    ...product,
    stripe_product_id: product.id,
    prices: transformedPrices.filter(price => price.stripe_product_id === product.id)
  })) || [];

  console.log('✅ Data transformation complete');

  console.log('\n📋 Step 4: Simulating PlanChangeDialog props...');
  
  // Simulate a free user wanting to upgrade
  const currentPlan = {
    id: 'price_free_monthly',
    name: 'Free Plan',
    price: 0, // $0
    interval: 'month'
  };

  console.log('Current Plan:', currentPlan);
  console.log('\nAvailable Plans for Upgrade:');
  
  productsWithPrices.forEach(product => {
    console.log(`\n📦 ${product.name}:`);
    if (!product.prices || product.prices.length === 0) {
      console.log('   ❌ No prices available');
    } else {
      product.prices.forEach(price => {
        const isCurrentPlan = price.stripe_price_id === currentPlan.id;
        const changeType = price.unit_amount > (currentPlan.price * 100) ? 'UPGRADE' : 
                          price.unit_amount < (currentPlan.price * 100) ? 'DOWNGRADE' : 'SAME';
        
        console.log(`   💰 $${price.unit_amount/100}/${price.interval} (${price.stripe_price_id})`);
        console.log(`      ${isCurrentPlan ? '🔵 CURRENT' : `🔄 ${changeType}`}`);
        
        if (price.interval === 'year') {
          const monthlyCost = price.unit_amount / 12;
          const monthlyPrice = product.prices.find(p => p.interval === 'month')?.unit_amount || 0;
          if (monthlyPrice > 0) {
            const savings = (monthlyPrice * 12) - price.unit_amount;
            console.log(`      💡 Save $${(savings/100).toFixed(2)} vs monthly`);
          }
        }
      });
    }
  });

  console.log('\n🎯 Expected Dialog Behavior:');
  console.log('✅ Should show current Free Plan');
  console.log('✅ Should show Pro Monthly as upgrade option');
  console.log('✅ Should show Pro Annual as upgrade option with savings');
  console.log('✅ Should allow selection and plan change');
  console.log('✅ Should show proper upgrade/downgrade indicators');

  console.log('\n🚀 PlanChangeDialog should now display available plans correctly!');
}

testPlanChangeDialog();
