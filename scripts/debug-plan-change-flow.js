#!/usr/bin/env node

/**
 * Debug Script: Plan Change Flow Analysis
 * 
 * This script will trace what actually happens during a plan change
 * to understand why no upgrade occurs despite no errors.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPlanChangeFlow() {
  console.log('🔍 Debugging plan change flow...\n');
  
  try {
    // Check current state before plan change
    console.log('1️⃣ CURRENT STATE ANALYSIS');
    
    // Check users and their subscriptions
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(5);
    
    if (usersError) {
      console.log(`   ❌ Cannot access users: ${usersError.message}`);
    } else {
      console.log(`   📊 Found ${users?.length || 0} users`);
    }
    
    // Check subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (subsError) {
      console.log(`   ❌ Cannot access subscriptions: ${subsError.message}`);
    } else {
      console.log(`   📊 Found ${subscriptions?.length || 0} subscriptions`);
      
      if (subscriptions && subscriptions.length > 0) {
        console.log('\n   📋 Recent subscriptions:');
        subscriptions.forEach((sub, index) => {
          console.log(`      ${index + 1}. ${sub.id}`);
          console.log(`         User: ${sub.user_id}`);
          console.log(`         Status: ${sub.status}`);
          console.log(`         Price: ${sub.stripe_price_id}`);
          console.log(`         Updated: ${sub.updated_at}`);
          console.log('');
        });
      }
    }
    
    // Check customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.log(`   ❌ Cannot access customers: ${customersError.message}`);
    } else {
      console.log(`   📊 Found ${customers?.length || 0} customers`);
      
      if (customers && customers.length > 0) {
        console.log('\n   📋 Customers:');
        customers.forEach((customer, index) => {
          console.log(`      ${index + 1}. ${customer.id} → ${customer.stripe_customer_id}`);
        });
      }
    }
    
    // Check payment methods table
    console.log('\n2️⃣ PAYMENT METHODS ANALYSIS');
    
    try {
      const { data: paymentMethods, error: pmError } = await supabase
        .from('payment_methods')
        .select('*')
        .limit(5);
      
      if (pmError) {
        console.log(`   ❌ Cannot access payment_methods: ${pmError.message}`);
        console.log('   💡 This might be why no default payment is saved');
      } else {
        console.log(`   📊 Found ${paymentMethods?.length || 0} payment methods`);
        
        if (paymentMethods && paymentMethods.length > 0) {
          console.log('\n   📋 Payment methods:');
          paymentMethods.forEach((pm, index) => {
            console.log(`      ${index + 1}. ${pm.id}`);
            console.log(`         User: ${pm.user_id || 'N/A'}`);
            console.log(`         Stripe PM: ${pm.stripe_payment_method_id || 'N/A'}`);
            console.log(`         Default: ${pm.is_default || false}`);
            console.log('');
          });
        }
      }
    } catch (pmTableError) {
      console.log(`   ❌ Payment methods table error: ${pmTableError.message}`);
    }
    
    // Check billing history table
    console.log('\n3️⃣ BILLING HISTORY ANALYSIS');
    
    try {
      const { data: billingHistory, error: bhError } = await supabase
        .from('billing_history')
        .select('*')
        .limit(5);
      
      if (bhError) {
        console.log(`   ❌ Cannot access billing_history: ${bhError.message}`);
        console.log('   💡 This might be why no billing history appears');
      } else {
        console.log(`   📊 Found ${billingHistory?.length || 0} billing records`);
        
        if (billingHistory && billingHistory.length > 0) {
          console.log('\n   📋 Billing history:');
          billingHistory.forEach((record, index) => {
            console.log(`      ${index + 1}. ${record.id}`);
            console.log(`         User: ${record.user_id || 'N/A'}`);
            console.log(`         Amount: ${record.amount || 'N/A'}`);
            console.log(`         Date: ${record.created_at || 'N/A'}`);
            console.log('');
          });
        }
      }
    } catch (bhTableError) {
      console.log(`   ❌ Billing history table error: ${bhTableError.message}`);
    }
    
    // Check what tables actually exist
    console.log('\n4️⃣ DATABASE SCHEMA ANALYSIS');
    
    // Try to get table information
    const commonTables = [
      'subscriptions',
      'customers', 
      'payment_methods',
      'billing_history',
      'stripe_prices',
      'user_subscriptions',
      'invoices'
    ];
    
    console.log('   📋 Table existence check:');
    for (const tableName of commonTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`      ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`      ✅ ${tableName}: exists (${data?.length || 0} sample records)`);
        }
      } catch (tableError) {
        console.log(`      ❌ ${tableName}: ${tableError.message}`);
      }
    }
    
    // Analyze the plan change logic path
    console.log('\n5️⃣ PLAN CHANGE LOGIC ANALYSIS');
    
    console.log('   🔍 Checking plan change code path...');
    console.log('   📋 Expected flow:');
    console.log('      1. User triggers plan change');
    console.log('      2. Customer created/retrieved');
    console.log('      3. Stripe subscription created/updated');
    console.log('      4. Local subscription record saved');
    console.log('      5. Payment method saved (if provided)');
    console.log('      6. Billing record created');
    
    console.log('\n   🔧 Potential issues:');
    console.log('      • Plan change might be taking development path (no real Stripe calls)');
    console.log('      • Payment method saving might be disabled');
    console.log('      • Billing history might not be implemented');
    console.log('      • Success response might be returned too early');
    
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('   1. Check if plan change is using development/test mode');
    console.log('   2. Verify Stripe subscription is actually created');
    console.log('   3. Check payment method saving logic');
    console.log('   4. Implement billing history creation');
    console.log('   5. Add proper success/failure validation');
    
  } catch (error) {
    console.error('❌ Debug analysis failed:', error.message);
  }
}

// Run the debug
debugPlanChangeFlow().then(() => {
  console.log('\n✅ Plan change flow debug completed!');
}).catch(console.error);
