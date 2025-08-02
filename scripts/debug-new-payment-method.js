#!/usr/bin/env node

/**
 * Debug Script: New Payment Method Issue
 * 
 * This script debugs why a newly added payment method is still
 * showing as belonging to a different account.
 */

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugNewPaymentMethod() {
  console.log('🔍 Debugging newly added payment method issue...\n');
  
  const problemUserId = 'd575b77d-732f-4750-b14e-a648c8cef48a';
  
  try {
    // Step 1: Get user's current customer record
    console.log('1️⃣ Checking user\'s current customer record...');
    
    const { data: userCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', problemUserId)
      .single();
    
    if (customerError) {
      console.log(`   ❌ Error getting customer: ${customerError.message}`);
      return false;
    }
    
    console.log(`   📋 User ID: ${userCustomer.id}`);
    console.log(`   📋 Stripe Customer ID: ${userCustomer.stripe_customer_id}`);
    
    // Step 2: Get ALL payment methods for this customer from Stripe
    console.log('\n2️⃣ Checking payment methods in Stripe...');
    
    const customerPaymentMethods = await stripe.paymentMethods.list({
      customer: userCustomer.stripe_customer_id,
      type: 'card',
    });
    
    console.log(`   📊 Customer has ${customerPaymentMethods.data.length} payment methods in Stripe`);
    
    if (customerPaymentMethods.data.length > 0) {
      console.log('\n   📋 Payment methods attached to this customer:');
      customerPaymentMethods.data.forEach((pm, index) => {
        console.log(`      ${index + 1}. ${pm.id}`);
        console.log(`         Card: ${pm.card?.brand} ****${pm.card?.last4}`);
        console.log(`         Customer: ${pm.customer}`);
        console.log(`         Created: ${new Date(pm.created * 1000).toISOString()}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No payment methods found attached to this customer!');
    }
    
    // Step 3: Check recent payment methods that might not be attached
    console.log('3️⃣ Checking recent unattached payment methods...');
    
    const recentPaymentMethods = await stripe.paymentMethods.list({
      type: 'card',
      limit: 10,
    });
    
    const unattachedMethods = recentPaymentMethods.data.filter(pm => !pm.customer);
    
    console.log(`   📊 Found ${unattachedMethods.length} unattached payment methods`);
    
    if (unattachedMethods.length > 0) {
      console.log('\n   📋 Recent unattached payment methods:');
      unattachedMethods.forEach((pm, index) => {
        console.log(`      ${index + 1}. ${pm.id}`);
        console.log(`         Card: ${pm.card?.brand} ****${pm.card?.last4}`);
        console.log(`         Customer: ${pm.customer || 'NONE'}`);
        console.log(`         Created: ${new Date(pm.created * 1000).toISOString()}`);
        console.log('');
      });
    }
    
    // Step 4: Check payment methods attached to OTHER customers
    console.log('4️⃣ Checking payment methods attached to other customers...');
    
    const { data: allCustomers, error: allCustomersError } = await supabase
      .from('customers')
      .select('*');
    
    if (allCustomersError) {
      console.log(`   ❌ Error getting all customers: ${allCustomersError.message}`);
    } else {
      console.log(`   📊 Checking ${allCustomers?.length || 0} customers for payment methods`);
      
      for (const customer of allCustomers || []) {
        if (customer.id !== problemUserId) {
          try {
            const otherCustomerPMs = await stripe.paymentMethods.list({
              customer: customer.stripe_customer_id,
              type: 'card',
            });
            
            if (otherCustomerPMs.data.length > 0) {
              console.log(`\n   📋 Customer ${customer.id} (${customer.stripe_customer_id}) has ${otherCustomerPMs.data.length} payment methods:`);
              otherCustomerPMs.data.forEach((pm, index) => {
                console.log(`      ${index + 1}. ${pm.id} (${pm.card?.brand} ****${pm.card?.last4})`);
              });
            }
          } catch (otherError) {
            console.log(`   ❌ Error checking customer ${customer.stripe_customer_id}: ${otherError.message}`);
          }
        }
      }
    }
    
    // Step 5: Check database payment method records
    console.log('\n5️⃣ Checking database payment method records...');
    
    const { data: dbPaymentMethods, error: dbError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', problemUserId);
    
    if (dbError) {
      console.log(`   ❌ Error checking database: ${dbError.message}`);
    } else {
      console.log(`   📊 User has ${dbPaymentMethods?.length || 0} payment method records in database`);
      
      if (dbPaymentMethods && dbPaymentMethods.length > 0) {
        console.log('\n   📋 Database payment method records:');
        dbPaymentMethods.forEach((pm, index) => {
          console.log(`      ${index + 1}. ${pm.id}`);
          console.log(`         Stripe PM ID: ${pm.stripe_payment_method_id}`);
          console.log(`         User ID: ${pm.user_id}`);
          console.log(`         Is Default: ${pm.is_default}`);
          console.log(`         Created: ${pm.created_at}`);
          console.log('');
        });
      }
    }
    
    // Step 6: Analyze the issue
    console.log('6️⃣ Issue analysis...');
    
    if (customerPaymentMethods.data.length === 0 && unattachedMethods.length > 0) {
      console.log('\n   🚨 ISSUE IDENTIFIED: Payment method was created but not attached to customer');
      console.log('   💡 This happens when payment method creation doesn\'t specify the customer');
      
      console.log('\n   🔧 POTENTIAL CAUSES:');
      console.log('      • Payment method creation API not using correct customer ID');
      console.log('      • Frontend not passing customer ID during creation');
      console.log('      • Payment method created for wrong customer');
      console.log('      • Attachment step failed after creation');
      
    } else if (customerPaymentMethods.data.length === 0) {
      console.log('\n   🚨 ISSUE IDENTIFIED: No payment methods found for user');
      console.log('   💡 Payment method creation might have failed completely');
      
    } else {
      console.log('\n   ✅ User has valid payment methods attached');
      console.log('   💡 The issue might be in payment method selection or validation logic');
    }
    
    // Step 7: Provide specific solution
    console.log('\n7️⃣ Specific solution based on findings...');
    
    if (customerPaymentMethods.data.length > 0) {
      console.log('\n   ✅ GOOD NEWS: User has valid payment methods!');
      console.log('\n   🔧 SOLUTION: Use one of these valid payment method IDs:');
      customerPaymentMethods.data.forEach((pm, index) => {
        console.log(`      ${index + 1}. ${pm.id} (${pm.card?.brand} ****${pm.card?.last4})`);
      });
      
      console.log('\n   💡 The issue might be:');
      console.log('      • Frontend is passing wrong payment method ID');
      console.log('      • User is selecting payment method from wrong list');
      console.log('      • Payment method selection UI showing invalid options');
      
    } else if (unattachedMethods.length > 0) {
      console.log('\n   🔧 SOLUTION: Attach unattached payment methods to customer');
      console.log('\n   📋 Commands to fix unattached payment methods:');
      unattachedMethods.forEach((pm, index) => {
        console.log(`      ${index + 1}. stripe.paymentMethods.attach('${pm.id}', { customer: '${userCustomer.stripe_customer_id}' })`);
      });
      
    } else {
      console.log('\n   🔧 SOLUTION: User needs to create a NEW payment method');
      console.log('      • Ensure payment method creation uses correct customer ID');
      console.log('      • Verify payment method is attached during creation');
      console.log('      • Check payment method creation API implementation');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 NEW PAYMENT METHOD DEBUG RESULTS');
    console.log('='.repeat(60));
    
    const hasValidPMs = customerPaymentMethods.data.length > 0;
    const hasUnattachedPMs = unattachedMethods.length > 0;
    
    if (hasValidPMs) {
      console.log('🎉 USER HAS VALID PAYMENT METHODS!');
      
      console.log('\n✅ NEXT STEPS:');
      console.log('   1. Check why frontend is not using these valid payment methods');
      console.log('   2. Verify payment method selection logic');
      console.log('   3. Ensure correct payment method ID is being passed');
      
    } else if (hasUnattachedPMs) {
      console.log('🔧 PAYMENT METHODS NEED ATTACHMENT!');
      
      console.log('\n✅ NEXT STEPS:');
      console.log('   1. Attach unattached payment methods to customer');
      console.log('   2. Fix payment method creation to attach automatically');
      console.log('   3. Test plan change with attached payment methods');
      
    } else {
      console.log('❌ NO PAYMENT METHODS FOUND!');
      
      console.log('\n✅ NEXT STEPS:');
      console.log('   1. Debug payment method creation process');
      console.log('   2. Ensure payment methods are created with correct customer');
      console.log('   3. Verify payment method creation API is working');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return false;
  }
}

// Run the debug
debugNewPaymentMethod().then((success) => {
  if (success) {
    console.log('\n✅ New payment method debug completed!');
    process.exit(0);
  } else {
    console.log('\n❌ New payment method debug failed!');
    process.exit(1);
  }
}).catch(console.error);
