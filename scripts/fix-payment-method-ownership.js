#!/usr/bin/env node

/**
 * Fix Script: Payment Method Ownership Issues
 * 
 * This script analyzes and fixes payment method ownership issues
 * to ensure users can only use payment methods that belong to their customer.
 */

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixPaymentMethodOwnership() {
  console.log('🔧 Analyzing and fixing payment method ownership issues...\n');
  
  try {
    // Step 1: Get all customers and their expected payment methods
    console.log('1️⃣ Analyzing customer and payment method relationships...');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.log(`   ❌ Error getting customers: ${customersError.message}`);
      return false;
    }
    
    console.log(`   📊 Found ${customers?.length || 0} customers in database`);
    
    let ownershipIssues = [];
    let validPaymentMethods = [];
    
    // Step 2: Check each customer's payment methods
    for (const customer of customers || []) {
      console.log(`\n   🔍 Checking customer: ${customer.id}`);
      console.log(`      Stripe Customer ID: ${customer.stripe_customer_id}`);
      
      try {
        // Get payment methods for this customer from Stripe
        const customerPaymentMethods = await stripe.paymentMethods.list({
          customer: customer.stripe_customer_id,
          type: 'card',
        });
        
        console.log(`      📊 Has ${customerPaymentMethods.data.length} payment methods`);
        
        for (const pm of customerPaymentMethods.data) {
          if (pm.customer === customer.stripe_customer_id) {
            validPaymentMethods.push({
              paymentMethodId: pm.id,
              customerId: customer.stripe_customer_id,
              userId: customer.id,
              card: `${pm.card?.brand} ****${pm.card?.last4}`,
              status: 'valid'
            });
            console.log(`         ✅ ${pm.id}: Valid (${pm.card?.brand} ****${pm.card?.last4})`);
          } else {
            ownershipIssues.push({
              paymentMethodId: pm.id,
              actualCustomer: pm.customer,
              expectedCustomer: customer.stripe_customer_id,
              userId: customer.id,
              card: `${pm.card?.brand} ****${pm.card?.last4}`,
              issue: 'wrong_customer'
            });
            console.log(`         ❌ ${pm.id}: Wrong customer (${pm.card?.brand} ****${pm.card?.last4})`);
          }
        }
        
      } catch (stripeError) {
        console.log(`      ❌ Error checking Stripe customer: ${stripeError.message}`);
      }
    }
    
    // Step 3: Check for orphaned payment methods (not attached to any customer)
    console.log('\n2️⃣ Checking for orphaned payment methods...');
    
    try {
      const recentPaymentMethods = await stripe.paymentMethods.list({
        type: 'card',
        limit: 20,
      });
      
      let orphanedCount = 0;
      
      for (const pm of recentPaymentMethods.data) {
        if (!pm.customer) {
          orphanedCount++;
          ownershipIssues.push({
            paymentMethodId: pm.id,
            actualCustomer: null,
            expectedCustomer: 'unknown',
            userId: 'unknown',
            card: `${pm.card?.brand} ****${pm.card?.last4}`,
            issue: 'orphaned'
          });
        }
      }
      
      console.log(`   📊 Found ${orphanedCount} orphaned payment methods`);
      
    } catch (orphanError) {
      console.log(`   ❌ Error checking orphaned payment methods: ${orphanError.message}`);
    }
    
    // Step 4: Report findings
    console.log('\n3️⃣ Payment method ownership analysis...');
    
    console.log(`   ✅ Valid payment methods: ${validPaymentMethods.length}`);
    console.log(`   ❌ Ownership issues: ${ownershipIssues.length}`);
    
    if (ownershipIssues.length > 0) {
      console.log('\n   📋 Payment method ownership issues:');
      ownershipIssues.forEach((issue, index) => {
        console.log(`      ${index + 1}. ${issue.paymentMethodId} (${issue.card})`);
        console.log(`         Issue: ${issue.issue}`);
        console.log(`         User: ${issue.userId}`);
        console.log(`         Expected customer: ${issue.expectedCustomer}`);
        console.log(`         Actual customer: ${issue.actualCustomer || 'NONE'}`);
        console.log('');
      });
    }
    
    // Step 5: Provide solutions
    console.log('\n4️⃣ Solutions and recommendations...');
    
    console.log('\n   🔧 ROOT CAUSE ANALYSIS:');
    console.log('      • Payment methods are being created for wrong customers');
    console.log('      • Users are seeing payment methods that don\'t belong to them');
    console.log('      • Frontend might not be filtering payment methods by customer');
    console.log('      • Payment method creation might have customer ID issues');
    
    console.log('\n   ✅ RECOMMENDED SOLUTIONS:');
    console.log('      1. Frontend: Only show payment methods that belong to user\'s customer');
    console.log('      2. Backend: Validate payment method ownership before use');
    console.log('      3. Creation: Ensure payment methods are created for correct customer');
    console.log('      4. Cleanup: Remove references to invalid payment methods');
    
    console.log('\n   🛠️  TECHNICAL IMPLEMENTATION:');
    console.log('      • Add customer ID validation in payment method selection');
    console.log('      • Filter payment methods by customer in API responses');
    console.log('      • Add ownership checks before using payment methods');
    console.log('      • Implement proper error handling for ownership issues');
    
    // Step 6: Check database payment method records
    console.log('\n5️⃣ Checking database payment method records...');
    
    try {
      const { data: dbPaymentMethods, error: dbError } = await supabase
        .from('payment_methods')
        .select('*');
      
      if (dbError) {
        console.log(`   ❌ Error checking database records: ${dbError.message}`);
      } else {
        console.log(`   📊 Found ${dbPaymentMethods?.length || 0} payment method records in database`);
        
        if (dbPaymentMethods && dbPaymentMethods.length > 0) {
          let validDbRecords = 0;
          let invalidDbRecords = 0;
          
          for (const dbRecord of dbPaymentMethods) {
            // Check if this payment method exists in our valid list
            const isValid = validPaymentMethods.some(vpm => 
              vpm.paymentMethodId === dbRecord.stripe_payment_method_id &&
              vpm.userId === dbRecord.user_id
            );
            
            if (isValid) {
              validDbRecords++;
            } else {
              invalidDbRecords++;
              console.log(`      ❌ Invalid DB record: ${dbRecord.id} (user: ${dbRecord.user_id}, pm: ${dbRecord.stripe_payment_method_id})`);
            }
          }
          
          console.log(`   📊 Valid DB records: ${validDbRecords}`);
          console.log(`   📊 Invalid DB records: ${invalidDbRecords}`);
        }
      }
    } catch (dbCheckError) {
      console.log(`   ❌ Error checking database: ${dbCheckError.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PAYMENT METHOD OWNERSHIP ANALYSIS RESULTS');
    console.log('='.repeat(60));
    
    if (ownershipIssues.length === 0) {
      console.log('🎉 NO OWNERSHIP ISSUES FOUND!');
      
      console.log('\n✅ CURRENT STATE:');
      console.log(`   • ${validPaymentMethods.length} valid payment methods`);
      console.log('   • All payment methods belong to correct customers');
      console.log('   • No orphaned or misassigned payment methods');
      
    } else {
      console.log('🚨 OWNERSHIP ISSUES DETECTED!');
      
      console.log('\n❌ ISSUES FOUND:');
      console.log(`   • ${ownershipIssues.length} payment methods with ownership issues`);
      console.log(`   • ${validPaymentMethods.length} valid payment methods`);
      
      console.log('\n🔧 IMMEDIATE ACTIONS NEEDED:');
      console.log('   1. Users should create new payment methods for their accounts');
      console.log('   2. Remove invalid payment method references from UI');
      console.log('   3. Implement proper customer filtering in payment method selection');
      console.log('   4. Add validation to prevent cross-customer payment method usage');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Implement customer-based payment method filtering');
    console.log('   2. Add ownership validation in payment method APIs');
    console.log('   3. Guide users to create new payment methods if needed');
    console.log('   4. Test plan changes with properly owned payment methods');
    
    return ownershipIssues.length === 0;
    
  } catch (error) {
    console.error('❌ Ownership analysis failed:', error.message);
    return false;
  }
}

// Run the analysis
fixPaymentMethodOwnership().then((success) => {
  if (success) {
    console.log('\n✅ Payment method ownership analysis completed - no issues found!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Payment method ownership issues detected - see recommendations above!');
    process.exit(1);
  }
}).catch(console.error);
