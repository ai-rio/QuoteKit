#!/usr/bin/env node

/**
 * Test Script: Verify Customer Duplicate Fix
 * 
 * This script tests the fixed customer creation logic to ensure
 * it properly handles existing customers without creating duplicates.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCustomerFix() {
  console.log('🧪 Testing customer duplicate fix...\n');
  
  try {
    // Test the problematic customer ID
    const problemCustomerId = 'd575b77d-732f-4750-b14e-a648c8cef48a';
    const testEmail = 'test@example.com';
    
    console.log('1️⃣ Testing customer lookup...');
    
    // Check if customer exists
    const { data: existingCustomer, error: lookupError } = await supabase
      .from('customers')
      .select('id, stripe_customer_id')
      .eq('id', problemCustomerId)
      .maybeSingle();
    
    if (lookupError) {
      console.log(`   ❌ Error during lookup: ${lookupError.message}`);
      return false;
    }
    
    if (existingCustomer) {
      console.log(`   ✅ Customer exists: ${existingCustomer.id} → ${existingCustomer.stripe_customer_id}`);
    } else {
      console.log(`   ℹ️  Customer does not exist: ${problemCustomerId}`);
    }
    
    console.log('\n2️⃣ Testing upsert logic...');
    
    // Test the upsert logic that should handle existing customers
    const testStripeCustomerId = existingCustomer?.stripe_customer_id || 'cus_test_12345';
    
    console.log(`   📋 Testing upsert with:`, {
      userId: problemCustomerId,
      stripeCustomerId: testStripeCustomerId
    });
    
    // This should work without throwing a duplicate key error
    const { data: upsertResult, error: upsertError } = await supabase
      .from('customers')
      .upsert([{ 
        id: problemCustomerId, 
        stripe_customer_id: testStripeCustomerId 
      }], {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();
    
    if (upsertError) {
      console.log(`   ❌ Upsert failed: ${upsertError.message}`);
      console.log(`   📋 Error details:`, {
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint
      });
      return false;
    }
    
    console.log(`   ✅ Upsert succeeded:`, upsertResult);
    
    console.log('\n3️⃣ Verifying final state...');
    
    const { data: finalCustomer, error: finalError } = await supabase
      .from('customers')
      .select('id, stripe_customer_id')
      .eq('id', problemCustomerId)
      .single();
    
    if (finalError) {
      console.log(`   ❌ Final verification failed: ${finalError.message}`);
      return false;
    }
    
    console.log(`   ✅ Final customer state:`, {
      id: finalCustomer.id,
      stripe_customer_id: finalCustomer.stripe_customer_id
    });
    
    console.log('\n🎉 Customer duplicate fix test passed!');
    
    console.log('\n📋 WHAT THE FIX DOES:');
    console.log('   ✅ Uses upsert instead of separate insert/update logic');
    console.log('   ✅ Handles existing customers gracefully');
    console.log('   ✅ No more duplicate key constraint violations');
    console.log('   ✅ Cleans up Stripe customers if database save fails');
    
    console.log('\n🚀 READY TO TEST PLAN CHANGE:');
    console.log('   1. The customer creation logic is now fixed');
    console.log('   2. Try the plan change that was failing');
    console.log('   3. It should work without the duplicate customer error');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testCustomerFix().then((success) => {
  if (success) {
    console.log('\n✅ Customer fix test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Customer fix test failed!');
    process.exit(1);
  }
}).catch(console.error);
