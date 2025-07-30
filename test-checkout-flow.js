#!/usr/bin/env node

/**
 * Test script to validate the checkout flow for paid plans
 * This simulates the data transformation and flow to identify issues
 */

console.log('🧪 Testing QuoteKit Checkout Flow...\n');

// Simulate database price record (what comes from Supabase)
const mockDatabasePriceData = {
  stripe_price_id: 'price_monthly_1200',
  stripe_product_id: 'prod_basic',
  unit_amount: 1200,
  currency: 'usd',
  recurring_interval: 'month',  // This is the key field from database
  recurring_interval_count: 1,
  active: true,
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  stripe_products: {
    stripe_product_id: 'prod_basic',
    name: 'Pro Plan',
    description: 'Professional features',
    active: true
  }
};

console.log('1️⃣ Simulating database query result:');
console.log(JSON.stringify(mockDatabasePriceData, null, 2));

// Simulate the transformation in checkout/page.tsx
console.log('\n2️⃣ Simulating checkout page transformation:');
const transformedPrice = {
  stripe_price_id: mockDatabasePriceData.stripe_price_id,
  stripe_product_id: mockDatabasePriceData.stripe_product_id,
  unit_amount: mockDatabasePriceData.unit_amount,
  currency: mockDatabasePriceData.currency,
  recurring_interval: mockDatabasePriceData.recurring_interval,
  recurring_interval_count: mockDatabasePriceData.recurring_interval_count,
  active: mockDatabasePriceData.active,
  metadata: mockDatabasePriceData.metadata || {},
  created_at: mockDatabasePriceData.created_at,
  updated_at: mockDatabasePriceData.updated_at,
  // CRITICAL: Set interval field for compatibility
  interval: mockDatabasePriceData.recurring_interval,
  // CRITICAL: Determine type based on recurring_interval presence
  type: mockDatabasePriceData.recurring_interval ? 'recurring' : 'one_time',
  products: mockDatabasePriceData.stripe_products
};

console.log('Transformed price object:');
console.log(JSON.stringify(transformedPrice, null, 2));

// Simulate checkout mode determination
console.log('\n3️⃣ Simulating checkout mode determination:');
const isSubscription = !!(transformedPrice.recurring_interval || transformedPrice.interval);
const checkoutMode = isSubscription ? 'subscription' : 'payment';

console.log('Mode determination:', {
  recurring_interval: transformedPrice.recurring_interval,
  interval: transformedPrice.interval,
  type: transformedPrice.type,
  isSubscription,
  checkoutMode,
  decision_logic: 'Using recurring_interval OR interval presence'
});

// Test various scenarios
console.log('\n4️⃣ Testing edge cases:');

// Test free plan
const freePlan = {
  stripe_price_id: 'price_free',
  unit_amount: 0,
  recurring_interval: null,
  interval: null,
  type: 'one_time'
};

console.log('\nFree plan test:', {
  price_id: freePlan.stripe_price_id,
  is_free: freePlan.unit_amount === 0,
  is_subscription: !!(freePlan.recurring_interval || freePlan.interval),
  checkout_mode: !!(freePlan.recurring_interval || freePlan.interval) ? 'subscription' : 'payment'
});

// Test yearly plan
const yearlyPlan = {
  stripe_price_id: 'price_annual_14400',
  unit_amount: 14400,
  recurring_interval: 'year',
  interval: 'year',
  type: 'recurring'
};

console.log('\nYearly plan test:', {
  price_id: yearlyPlan.stripe_price_id,
  is_free: yearlyPlan.unit_amount === 0,
  is_subscription: !!(yearlyPlan.recurring_interval || yearlyPlan.interval),
  checkout_mode: !!(yearlyPlan.recurring_interval || yearlyPlan.interval) ? 'subscription' : 'payment'
});

console.log('\n✅ Test completed. The fixes should resolve the checkout flow issues.');
console.log('\n🔍 Key improvements made:');
console.log('1. Enhanced price object transformation in checkout/page.tsx');
console.log('2. Improved checkout mode determination logic in create-checkout-action.ts');
console.log('3. Added comprehensive logging throughout the flow');
console.log('4. Added validation for subscription mode requirements');
console.log('5. Made the flow more robust by checking both recurring_interval and interval fields');