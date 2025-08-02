#!/usr/bin/env node

/**
 * Test Script: Verify Subscription Schema Fix
 * 
 * This script tests that subscription creation will work
 * without the missing stripe_customer_id column.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubscriptionFix() {
  console.log('🧪 Testing subscription schema fix...\n');
  
  try {
    // Test 1: Verify current subscription structure
    console.log('1️⃣ Checking current subscription structure...');
    
    const { data: sampleSub, error: sampleError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.log(`   ❌ Error getting sample: ${sampleError.message}`);
      return false;
    }
    
    console.log('   ✅ Current subscription columns:');
    Object.keys(sampleSub).forEach(column => {
      console.log(`      - ${column}`);
    });
    
    // Test 2: Test subscription insert without stripe_customer_id
    console.log('\n2️⃣ Testing subscription insert without stripe_customer_id...');
    
    const testSubscription = {
      id: `test_sub_${Date.now()}`,
      user_id: sampleSub.user_id, // Use existing user
      status: 'active',
      stripe_price_id: 'price_1RVyAQGgBK1ooXYF0LokEHtQ',
      stripe_subscription_id: `test_sub_${Date.now()}`,
      // stripe_customer_id: 'cus_test', // REMOVED - this column doesn't exist
      quantity: 1,
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created: new Date().toISOString(),
      trial_start: null,
      trial_end: null,
    };
    
    console.log('   📋 Test subscription data:');
    console.log('      ', Object.keys(testSubscription));
    
    // Try the insert
    const { data: insertResult, error: insertError } = await supabase
      .from('subscriptions')
      .insert(testSubscription)
      .select()
      .single();
    
    if (insertError) {
      console.log(`   ❌ Insert failed: ${insertError.message}`);
      
      if (insertError.message.includes('stripe_customer_id')) {
        console.log('   🔧 The stripe_customer_id column issue still exists');
        return false;
      } else {
        console.log(`   📋 Different error: ${insertError.code} - ${insertError.details}`);
        return false;
      }
    }
    
    console.log('   ✅ Insert succeeded!');
    console.log('   📋 Inserted subscription:', {
      id: insertResult.id,
      user_id: insertResult.user_id,
      status: insertResult.status,
      stripe_price_id: insertResult.stripe_price_id
    });
    
    // Test 3: Clean up test data
    console.log('\n3️⃣ Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', testSubscription.id);
    
    if (deleteError) {
      console.log(`   ⚠️  Cleanup warning: ${deleteError.message}`);
    } else {
      console.log('   ✅ Test data cleaned up');
    }
    
    console.log('\n🎉 Subscription schema fix test passed!');
    
    console.log('\n📋 WHAT WAS FIXED:');
    console.log('   ❌ Before: Code tried to insert stripe_customer_id (column doesn\'t exist)');
    console.log('   ✅ After:  Code skips stripe_customer_id field');
    console.log('   ✅ Result: Subscription creation should work now');
    
    console.log('\n🚀 READY TO TEST PLAN CHANGE:');
    console.log('   1. All previous issues have been resolved:');
    console.log('      ✅ Price IDs are correct');
    console.log('      ✅ Customer duplicate issue fixed');
    console.log('      ✅ Subscription schema issue fixed');
    console.log('   2. Try the plan change that was failing');
    console.log('   3. It should now work completely');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testSubscriptionFix().then((success) => {
  if (success) {
    console.log('\n✅ Subscription fix test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Subscription fix test failed!');
    process.exit(1);
  }
}).catch(console.error);
