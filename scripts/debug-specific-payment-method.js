#!/usr/bin/env node

/**
 * Debug Script: Specific Payment Method Issue
 * 
 * This script investigates the specific payment method error:
 * "The customer does not have a payment method with the ID pm_1RrT0OGgBK1ooXYFOkqbQgiA"
 */

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugSpecificPaymentMethod() {
  console.log('🔍 Debugging specific payment method issue...\n');
  
  const problemPaymentMethodId = 'pm_1RrT0OGgBK1ooXYFOkqbQgiA';
  const problemUserId = 'd575b77d-732f-4750-b14e-a648c8cef48a';
  
  try {
    // Step 1: Check the payment method in Stripe
    console.log('1️⃣ Checking payment method in Stripe...');
    console.log(`   🎯 Payment Method ID: ${problemPaymentMethodId}`);
    
    const paymentMethod = await stripe.paymentMethods.retrieve(problemPaymentMethodId);
    
    console.log('   📋 Payment method details:');
    console.log(`      ID: ${paymentMethod.id}`);
    console.log(`      Type: ${paymentMethod.type}`);
    console.log(`      Customer: ${paymentMethod.customer || 'NOT ATTACHED'}`);
    console.log(`      Card: ${paymentMethod.card?.brand} ****${paymentMethod.card?.last4}`);
    console.log(`      Created: ${new Date(paymentMethod.created * 1000).toISOString()}`);
    
    // Step 2: Check the user's customer record
    console.log('\n2️⃣ Checking user\'s customer record...');
    console.log(`   🎯 User ID: ${problemUserId}`);
    
    const { data: customerRecord, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', problemUserId)
      .single();
    
    if (customerError) {
      console.log(`   ❌ Error getting customer record: ${customerError.message}`);
      return false;
    }
    
    console.log('   📋 Customer record:');
    console.log(`      User ID: ${customerRecord.id}`);
    console.log(`      Stripe Customer ID: ${customerRecord.stripe_customer_id}`);
    
    // Step 3: Compare payment method customer vs user's customer
    console.log('\n3️⃣ Comparing customer IDs...');
    
    const paymentMethodCustomer = paymentMethod.customer;
    const userStripeCustomer = customerRecord.stripe_customer_id;
    
    console.log(`   📋 Payment method attached to: ${paymentMethodCustomer}`);
    console.log(`   📋 User's Stripe customer ID:  ${userStripeCustomer}`);
    
    if (paymentMethodCustomer === userStripeCustomer) {
      console.log('   ✅ Payment method is attached to the correct customer');
    } else {
      console.log('   ❌ MISMATCH: Payment method is attached to wrong customer!');
      console.log('   🔧 This is the root cause of the error');
      
      // Check who owns the payment method's customer
      if (paymentMethodCustomer) {
        try {
          const pmCustomer = await stripe.customers.retrieve(paymentMethodCustomer);
          console.log(`   📋 Payment method's customer: ${pmCustomer.id} (${pmCustomer.email})`);
          
          // Check if this customer belongs to a different user
          const { data: pmCustomerRecord, error: pmCustomerError } = await supabase
            .from('customers')
            .select('*')
            .eq('stripe_customer_id', paymentMethodCustomer)
            .single();
          
          if (!pmCustomerError && pmCustomerRecord) {
            console.log(`   📋 Payment method belongs to user: ${pmCustomerRecord.id}`);
            
            if (pmCustomerRecord.id !== problemUserId) {
              console.log('   🚨 SECURITY ISSUE: Payment method belongs to different user!');
            }
          }
        } catch (pmCustomerError) {
          console.log(`   ❌ Error checking payment method's customer: ${pmCustomerError.message}`);
        }
      }
    }
    
    // Step 4: Check user's actual payment methods
    console.log('\n4️⃣ Checking user\'s actual payment methods...');
    
    if (userStripeCustomer) {
      const userPaymentMethods = await stripe.paymentMethods.list({
        customer: userStripeCustomer,
        type: 'card',
      });
      
      console.log(`   📊 User has ${userPaymentMethods.data.length} payment methods`);
      
      if (userPaymentMethods.data.length > 0) {
        console.log('   📋 User\'s payment methods:');
        userPaymentMethods.data.forEach((pm, index) => {
          console.log(`      ${index + 1}. ${pm.id} (${pm.card?.brand} ****${pm.card?.last4})`);
        });
      }
    }
    
    // Step 5: Provide solution
    console.log('\n5️⃣ Solution analysis...');
    
    if (paymentMethodCustomer !== userStripeCustomer) {
      console.log('   🔧 SOLUTION NEEDED:');
      console.log('      The payment method is attached to the wrong customer.');
      console.log('      This could happen if:');
      console.log('      • User has multiple customer records');
      console.log('      • Payment method was created for different customer');
      console.log('      • Customer ID changed but payment method wasn\'t updated');
      
      console.log('\n   ✅ RECOMMENDED FIXES:');
      console.log('      1. Detach payment method from wrong customer');
      console.log('      2. Attach payment method to correct customer');
      console.log('      3. Or use a different payment method for this customer');
      console.log('      4. Add validation to prevent cross-customer payment method use');
      
      // Offer to fix it
      console.log('\n   🛠️  AUTOMATIC FIX AVAILABLE:');
      console.log('      We can detach the payment method and reattach it to the correct customer');
      console.log('      This would resolve the immediate issue');
      
    } else {
      console.log('   ✅ Customer IDs match - investigating other causes...');
      
      // Check if there might be a timing issue
      console.log('   🔍 Checking for timing or cache issues...');
      console.log('      • Payment method might have been recently attached');
      console.log('      • Stripe API might have propagation delay');
      console.log('      • Local cache might be outdated');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PAYMENT METHOD DEBUG RESULTS');
    console.log('='.repeat(60));
    
    if (paymentMethodCustomer !== userStripeCustomer) {
      console.log('🚨 ISSUE IDENTIFIED: Payment method attached to wrong customer');
      
      console.log('\n❌ PROBLEM:');
      console.log(`   • Payment method ${problemPaymentMethodId} is attached to ${paymentMethodCustomer}`);
      console.log(`   • But user ${problemUserId} has customer ${userStripeCustomer}`);
      console.log('   • This causes the "customer does not have payment method" error');
      
      console.log('\n🔧 IMMEDIATE FIX:');
      console.log('   1. The payment method attachment logic in the code will handle this');
      console.log('   2. It will detach from wrong customer and attach to correct customer');
      console.log('   3. Or it will handle the "already attached" error gracefully');
      
    } else {
      console.log('✅ Customer IDs match - issue might be elsewhere');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return false;
  }
}

// Run the debug
debugSpecificPaymentMethod().then((success) => {
  if (success) {
    console.log('\n✅ Payment method debug completed!');
    process.exit(0);
  } else {
    console.log('\n❌ Payment method debug failed!');
    process.exit(1);
  }
}).catch(console.error);
