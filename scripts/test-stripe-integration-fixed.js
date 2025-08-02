#!/usr/bin/env node

/**
 * Test Script: Verify Fixed Stripe Integration
 * 
 * This script tests the Stripe integration after fixing the price ID issues.
 * It will verify that:
 * 1. The correct price IDs are being used
 * 2. Stripe customers can be created
 * 3. Subscriptions can be created with the correct prices
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// The price IDs we're now using (from your actual Stripe account)
const PRICE_IDS = {
  monthly: 'price_1RVyAQGgBK1ooXYF0LokEHtQ', // $12.00/month (Plus plan)
  yearly: 'price_1RoUo5GgBK1ooXYF4nMSQooR',  // $72.00/year (Yearly plan)
};

async function testStripeIntegration() {
  console.log('🧪 Testing Fixed Stripe Integration...\n');
  
  try {
    // Test 1: Verify the price IDs exist and are active
    console.log('1️⃣ Testing Price ID Validation...');
    
    for (const [interval, priceId] of Object.entries(PRICE_IDS)) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free';
        const recurringInterval = price.recurring ? `/${price.recurring.interval}` : 'one-time';
        
        console.log(`   ✅ ${interval}: ${priceId} → ${amount}${recurringInterval} (${price.active ? 'active' : 'inactive'})`);
        
        if (!price.active) {
          console.log(`   ⚠️  Warning: Price ${priceId} is inactive!`);
        }
      } catch (error) {
        console.log(`   ❌ ${interval}: ${priceId} → ERROR: ${error.message}`);
        return false;
      }
    }
    
    // Test 2: Create a test customer
    console.log('\n2️⃣ Testing Customer Creation...');
    const testCustomer = await stripe.customers.create({
      email: `test-${Date.now()}@example.com`,
      name: 'Test Customer',
      metadata: {
        test: 'true',
        created_by: 'integration_test'
      }
    });
    
    console.log(`   ✅ Customer created: ${testCustomer.id}`);
    
    // Test 3: Create a test subscription (but don't activate it)
    console.log('\n3️⃣ Testing Subscription Creation...');
    
    try {
      const subscription = await stripe.subscriptions.create({
        customer: testCustomer.id,
        items: [{ price: PRICE_IDS.monthly }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      console.log(`   ✅ Subscription created: ${subscription.id}`);
      console.log(`   📊 Status: ${subscription.status}`);
      console.log(`   💰 Amount: $${(subscription.items.data[0].price.unit_amount / 100).toFixed(2)}/${subscription.items.data[0].price.recurring.interval}`);
      
      // Clean up: Cancel the test subscription
      await stripe.subscriptions.cancel(subscription.id);
      console.log(`   🧹 Test subscription cancelled`);
      
    } catch (error) {
      console.log(`   ❌ Subscription creation failed: ${error.message}`);
      return false;
    }
    
    // Test 4: Clean up test customer
    console.log('\n4️⃣ Cleaning up test data...');
    await stripe.customers.del(testCustomer.id);
    console.log(`   ✅ Test customer deleted: ${testCustomer.id}`);
    
    console.log('\n🎉 All tests passed! Your Stripe integration is working correctly.');
    
    // Show next steps
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Test the upgrade flow in your application');
    console.log('   2. Go to http://localhost:3000/pricing');
    console.log('   3. Click "Try Pro Plan" to test the real upgrade');
    console.log('   4. Check that a real Stripe customer and subscription are created');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('\n🔑 Check your STRIPE_SECRET_KEY in .env.local');
    }
    
    return false;
  }
}

// Run the test
testStripeIntegration().then((success) => {
  if (success) {
    console.log('\n✅ Integration test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Integration test failed!');
    process.exit(1);
  }
}).catch(console.error);
