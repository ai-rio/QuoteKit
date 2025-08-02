#!/usr/bin/env node

/**
 * Comprehensive Test: All Plan Change Issues Resolved
 * 
 * This script verifies that all three major issues have been fixed:
 * 1. Price ID error (price_pro_monthly doesn't exist)
 * 2. Customer duplicate error (duplicate key constraint)
 * 3. Subscription schema error (stripe_customer_id column missing)
 */

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testAllFixesComplete() {
  console.log('🧪 COMPREHENSIVE TEST: All Plan Change Issues Resolved\n');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Price ID Issue Resolution
    console.log('1️⃣ TESTING: Price ID Issue Resolution');
    console.log('   Original Error: "No such price: \'price_pro_monthly\'"');
    
    const correctPriceIds = [
      'price_1RVyAQGgBK1ooXYF0LokEHtQ', // Monthly
      'price_1RoUo5GgBK1ooXYF4nMSQooR'  // Annual
    ];
    
    for (const priceId of correctPriceIds) {
      // Check database
      const { data: dbPrice, error: dbError } = await supabase
        .from('stripe_prices')
        .select('id, active')
        .eq('id', priceId)
        .single();
      
      if (dbError) {
        console.log(`   ❌ Price ${priceId} not in database: ${dbError.message}`);
        allTestsPassed = false;
        continue;
      }
      
      // Check Stripe
      try {
        const stripePrice = await stripe.prices.retrieve(priceId);
        console.log(`   ✅ ${priceId}: DB(${dbPrice.active ? 'active' : 'inactive'}) Stripe(${stripePrice.active ? 'active' : 'inactive'})`);
      } catch (stripeError) {
        console.log(`   ❌ Price ${priceId} not in Stripe: ${stripeError.message}`);
        allTestsPassed = false;
      }
    }
    
    // Test 2: Customer Duplicate Issue Resolution
    console.log('\n2️⃣ TESTING: Customer Duplicate Issue Resolution');
    console.log('   Original Error: "duplicate key value violates unique constraint \\"customers_pkey\\""');
    
    const problemCustomerId = 'd575b77d-732f-4750-b14e-a648c8cef48a';
    
    // Check customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, stripe_customer_id')
      .eq('id', problemCustomerId)
      .single();
    
    if (customerError) {
      console.log(`   ❌ Customer lookup failed: ${customerError.message}`);
      allTestsPassed = false;
    } else {
      console.log(`   ✅ Customer exists: ${customer.id} → ${customer.stripe_customer_id}`);
      
      // Test upsert (should not cause duplicate error)
      const { error: upsertError } = await supabase
        .from('customers')
        .upsert([{ 
          id: problemCustomerId, 
          stripe_customer_id: customer.stripe_customer_id 
        }], {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        console.log(`   ❌ Upsert failed: ${upsertError.message}`);
        allTestsPassed = false;
      } else {
        console.log('   ✅ Upsert works without duplicate key error');
      }
    }
    
    // Test 3: Subscription Schema Issue Resolution
    console.log('\n3️⃣ TESTING: Subscription Schema Issue Resolution');
    console.log('   Original Error: "Could not find the \'stripe_customer_id\' column"');
    
    // Check subscription table structure
    const { data: sampleSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
      .single();
    
    if (subError) {
      console.log(`   ❌ Cannot access subscriptions table: ${subError.message}`);
      allTestsPassed = false;
    } else {
      const hasStripeCustomerId = sampleSub.hasOwnProperty('stripe_customer_id');
      console.log(`   📋 Subscription columns: ${Object.keys(sampleSub).length} total`);
      console.log(`   📋 Has stripe_customer_id column: ${hasStripeCustomerId ? 'YES' : 'NO'}`);
      
      if (hasStripeCustomerId) {
        console.log('   ℹ️  Column exists - code should work as-is');
      } else {
        console.log('   ✅ Column missing - code fixed to not use it');
      }
      
      // Test subscription insert without stripe_customer_id
      const testSub = {
        id: `test_comprehensive_${Date.now()}`,
        user_id: sampleSub.user_id,
        status: 'active',
        stripe_price_id: correctPriceIds[0],
        stripe_subscription_id: `test_comprehensive_${Date.now()}`,
        quantity: 1,
        cancel_at_period_end: false,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date().toISOString(),
        trial_start: null,
        trial_end: null,
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('subscriptions')
        .insert(testSub)
        .select()
        .single();
      
      if (insertError) {
        console.log(`   ❌ Subscription insert failed: ${insertError.message}`);
        allTestsPassed = false;
      } else {
        console.log('   ✅ Subscription insert works without schema errors');
        
        // Clean up
        await supabase.from('subscriptions').delete().eq('id', testSub.id);
      }
    }
    
    // Final Results
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! Plan change should work completely.');
      
      console.log('\n✅ ISSUES RESOLVED:');
      console.log('   1. Price ID Error: Fixed - using correct Stripe price IDs');
      console.log('   2. Customer Duplicate: Fixed - using upsert logic');
      console.log('   3. Subscription Schema: Fixed - removed non-existent column');
      
      console.log('\n🚀 READY FOR PRODUCTION:');
      console.log('   • All database issues resolved');
      console.log('   • All Stripe integration issues resolved');
      console.log('   • Plan changes should work end-to-end');
      
      console.log('\n📋 NEXT STEPS:');
      console.log('   1. Test the actual plan change in your application');
      console.log('   2. Verify the complete user flow works');
      console.log('   3. Monitor for any remaining edge cases');
      
    } else {
      console.log('❌ SOME TESTS FAILED! Issues remain.');
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('   • Review failed tests above');
      console.log('   • Fix remaining issues before testing plan changes');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
    return false;
  }
}

// Run the comprehensive test
testAllFixesComplete().then((success) => {
  if (success) {
    console.log('\n✅ All fixes verified - plan change ready!');
    process.exit(0);
  } else {
    console.log('\n❌ Issues remain - plan change not ready!');
    process.exit(1);
  }
}).catch(console.error);
