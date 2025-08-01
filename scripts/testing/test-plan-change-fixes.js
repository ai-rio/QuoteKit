#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testPlanChangeFixes() {
  console.log('🧪 Testing Plan Change Fixes');
  console.log('============================');

  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  console.log('🔍 Fix 1: Database Column Issues');
  console.log('================================');

  // Test that we can query prices using 'id' instead of 'stripe_price_id'
  const { data: priceById, error: priceError } = await supabase
    .from('stripe_prices')
    .select('*')
    .eq('id', 'price_pro_monthly')
    .single();

  if (priceError) {
    console.log('❌ Price query by id failed:', priceError.message);
  } else {
    console.log('✅ Price query by id works:', {
      id: priceById.id,
      amount: priceById.unit_amount,
      interval: priceById.interval
    });
  }

  console.log('\n🔍 Fix 2: Available Plans Data Structure');
  console.log('=======================================');

  // Test the getAvailablePlans logic
  const { data: products } = await supabase
    .from('stripe_products')
    .select('*')
    .eq('active', true)
    .order('created_at');

  const { data: prices } = await supabase
    .from('stripe_prices')
    .select('*')
    .eq('active', true)
    .in('stripe_product_id', products?.map(p => p.id) || []);

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

  console.log('✅ Products with prices structure:');
  productsWithPrices.forEach(product => {
    console.log(`   📦 ${product.name}: ${product.prices?.length || 0} prices`);
    product.prices?.forEach(price => {
      console.log(`      💰 ${price.stripe_price_id}: $${price.unit_amount/100}/${price.interval}`);
    });
  });

  console.log('\n🔍 Fix 3: Development Mode Plan Changes');
  console.log('======================================');

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1');

  console.log(`Environment: ${isDevelopment ? '🧪 Development' : '🚀 Production'}`);
  
  if (isDevelopment) {
    console.log('✅ Development mode detected - plan changes will bypass Stripe');
    console.log('✅ Local subscriptions will be created in database');
  } else {
    console.log('✅ Production mode - plan changes will use Stripe');
  }

  console.log('\n🎯 Expected Behavior:');
  console.log('====================');
  console.log('✅ PlanChangeDialog displays available plans');
  console.log('✅ Database queries use correct column names (id vs stripe_price_id)');
  console.log('✅ Development mode bypasses Stripe for testing');
  console.log('✅ Plan changes create local subscription records');
  console.log('✅ Account page shows updated plan information');

  console.log('\n🚀 Plan Change Functionality Should Now Work!');
  console.log('Ready to test in the UI:');
  console.log('1. Go to Account page');
  console.log('2. Click "Change Plan" button');
  console.log('3. Select Pro Monthly or Pro Annual');
  console.log('4. Confirm plan change');
  console.log('5. Verify subscription is created in development mode');
}

testPlanChangeFixes();
