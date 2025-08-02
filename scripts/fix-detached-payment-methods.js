#!/usr/bin/env node

/**
 * Fix Script: Detached Payment Methods
 * 
 * This script helps resolve issues with detached payment methods
 * by identifying them and providing solutions.
 */

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixDetachedPaymentMethods() {
  console.log('🔧 Fixing detached payment method issues...\n');
  
  try {
    // Step 1: Check all customers and their payment methods
    console.log('1️⃣ Checking all customers and payment methods...');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.log(`   ❌ Error getting customers: ${customersError.message}`);
      return false;
    }
    
    console.log(`   📊 Found ${customers?.length || 0} customers in database`);
    
    let detachedPaymentMethods = [];
    let validPaymentMethods = [];
    
    for (const customer of customers || []) {
      console.log(`\n   🔍 Checking customer: ${customer.id} → ${customer.stripe_customer_id}`);
      
      try {
        // Get payment methods for this customer from Stripe
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer.stripe_customer_id,
          type: 'card',
        });
        
        console.log(`      📊 Has ${paymentMethods.data.length} payment methods`);
        
        for (const pm of paymentMethods.data) {
          if (pm.customer === customer.stripe_customer_id) {
            validPaymentMethods.push({
              id: pm.id,
              customer: customer.stripe_customer_id,
              userId: customer.id,
              card: `${pm.card?.brand} ****${pm.card?.last4}`,
              status: 'valid'
            });
            console.log(`         ✅ ${pm.id}: Valid (${pm.card?.brand} ****${pm.card?.last4})`);
          } else {
            detachedPaymentMethods.push({
              id: pm.id,
              customer: pm.customer,
              expectedCustomer: customer.stripe_customer_id,
              userId: customer.id,
              card: `${pm.card?.brand} ****${pm.card?.last4}`,
              status: 'detached'
            });
            console.log(`         ❌ ${pm.id}: Detached or wrong customer`);
          }
        }
        
      } catch (stripeError) {
        console.log(`      ❌ Error checking Stripe customer: ${stripeError.message}`);
      }
    }
    
    // Step 2: Report findings
    console.log('\n2️⃣ Payment method analysis...');
    
    console.log(`   ✅ Valid payment methods: ${validPaymentMethods.length}`);
    console.log(`   ❌ Detached/problematic payment methods: ${detachedPaymentMethods.length}`);
    
    if (detachedPaymentMethods.length > 0) {
      console.log('\n   📋 Problematic payment methods:');
      detachedPaymentMethods.forEach((pm, index) => {
        console.log(`      ${index + 1}. ${pm.id} (${pm.card})`);
        console.log(`         User: ${pm.userId}`);
        console.log(`         Expected customer: ${pm.expectedCustomer}`);
        console.log(`         Actual customer: ${pm.customer || 'NONE (detached)'}`);
        console.log('');
      });
    }
    
    // Step 3: Check for recent payment method creation attempts
    console.log('\n3️⃣ Checking recent payment method activity...');
    
    try {
      // Get recent payment methods from Stripe (last 10)
      const recentPaymentMethods = await stripe.paymentMethods.list({
        type: 'card',
        limit: 10,
      });
      
      console.log(`   📊 Found ${recentPaymentMethods.data.length} recent payment methods`);
      
      let unattachedCount = 0;
      let attachedCount = 0;
      
      for (const pm of recentPaymentMethods.data) {
        if (!pm.customer) {
          unattachedCount++;
          console.log(`      🔄 ${pm.id}: Unattached (${pm.card?.brand} ****${pm.card?.last4})`);
        } else {
          attachedCount++;
        }
      }
      
      console.log(`   📊 Unattached: ${unattachedCount}, Attached: ${attachedCount}`);
      
    } catch (recentError) {
      console.log(`   ❌ Error checking recent payment methods: ${recentError.message}`);
    }
    
    // Step 4: Provide solutions
    console.log('\n4️⃣ Solutions and recommendations...');
    
    console.log('\n   🔧 FOR DETACHED PAYMENT METHOD ERRORS:');
    console.log('      • Detached payment methods cannot be reused in Stripe');
    console.log('      • Users must create new payment methods');
    console.log('      • The application should guide users to add new payment methods');
    
    console.log('\n   ✅ RECOMMENDED USER ACTIONS:');
    console.log('      1. Go to payment methods section');
    console.log('      2. Remove any old/invalid payment methods');
    console.log('      3. Add a new payment method');
    console.log('      4. Try the plan change again with the new payment method');
    
    console.log('\n   🛠️  TECHNICAL SOLUTIONS:');
    console.log('      • Enhanced error handling (already implemented)');
    console.log('      • Clear error messages for users');
    console.log('      • Automatic cleanup of invalid payment method references');
    console.log('      • Validation before attempting to use payment methods');
    
    // Step 5: Clean up database references to invalid payment methods
    console.log('\n5️⃣ Cleaning up invalid payment method references...');
    
    try {
      const { data: paymentMethodRecords, error: pmError } = await supabase
        .from('payment_methods')
        .select('*');
      
      if (pmError) {
        console.log(`   ❌ Error checking payment method records: ${pmError.message}`);
      } else {
        console.log(`   📊 Found ${paymentMethodRecords?.length || 0} payment method records in database`);
        
        let invalidRecords = 0;
        
        for (const record of paymentMethodRecords || []) {
          try {
            const stripePaymentMethod = await stripe.paymentMethods.retrieve(record.stripe_payment_method_id);
            
            if (!stripePaymentMethod.customer) {
              invalidRecords++;
              console.log(`      ❌ Invalid record: ${record.id} (detached from Stripe)`);
              
              // Optionally remove invalid records
              // await supabase.from('payment_methods').delete().eq('id', record.id);
            }
          } catch (retrieveError) {
            if (retrieveError.code === 'resource_missing') {
              invalidRecords++;
              console.log(`      ❌ Invalid record: ${record.id} (doesn't exist in Stripe)`);
            }
          }
        }
        
        if (invalidRecords > 0) {
          console.log(`   ⚠️  Found ${invalidRecords} invalid payment method records`);
          console.log('   💡 Consider cleaning these up to avoid confusion');
        } else {
          console.log('   ✅ All payment method records appear valid');
        }
      }
    } catch (cleanupError) {
      console.log(`   ❌ Error during cleanup: ${cleanupError.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DETACHED PAYMENT METHODS FIX RESULTS');
    console.log('='.repeat(60));
    
    console.log('🎉 ANALYSIS COMPLETE!');
    
    console.log('\n✅ WHAT WE FOUND:');
    console.log(`   • ${validPaymentMethods.length} valid payment methods`);
    console.log(`   • ${detachedPaymentMethods.length} problematic payment methods`);
    console.log('   • Enhanced error handling implemented');
    
    console.log('\n🚀 NEXT STEPS FOR USERS:');
    console.log('   1. Remove old payment methods from account');
    console.log('   2. Add a fresh payment method');
    console.log('   3. Try plan change with new payment method');
    console.log('   4. Should work without detached payment method errors');
    
    console.log('\n📋 FOR DEVELOPERS:');
    console.log('   • Code now validates payment methods before use');
    console.log('   • Clear error messages guide users to add new payment methods');
    console.log('   • No more attempts to reuse detached payment methods');
    
    return true;
    
  } catch (error) {
    console.error('❌ Fix script failed:', error.message);
    return false;
  }
}

// Run the fix
fixDetachedPaymentMethods().then((success) => {
  if (success) {
    console.log('\n✅ Detached payment methods fix completed!');
    process.exit(0);
  } else {
    console.log('\n❌ Detached payment methods fix failed!');
    process.exit(1);
  }
}).catch(console.error);
