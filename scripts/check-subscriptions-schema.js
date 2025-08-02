#!/usr/bin/env node

/**
 * Debug Script: Check Subscriptions Table Schema
 * 
 * This script will check the actual structure of the subscriptions table
 * to understand what columns exist and what's missing.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubscriptionsSchema() {
  console.log('🔍 Checking subscriptions table schema...\n');
  
  try {
    // Get a sample record to see the actual columns
    console.log('1️⃣ Getting sample subscription record...');
    
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.log(`   ❌ Error getting sample record: ${sampleError.message}`);
      return;
    }
    
    if (sampleRecord) {
      console.log('   ✅ Sample record found');
      console.log('   📋 Available columns:');
      Object.keys(sampleRecord).forEach((column, index) => {
        console.log(`      ${index + 1}. ${column}: ${typeof sampleRecord[column]} = ${sampleRecord[column]}`);
      });
    } else {
      console.log('   ℹ️  No records found in subscriptions table');
    }
    
    // Check if stripe_customer_id column exists
    console.log('\n2️⃣ Checking for stripe_customer_id column...');
    
    try {
      const { data: customerIdTest, error: customerIdError } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .limit(1);
      
      if (customerIdError) {
        if (customerIdError.message.includes('stripe_customer_id')) {
          console.log('   ❌ stripe_customer_id column does NOT exist');
          console.log(`   📋 Error: ${customerIdError.message}`);
        } else {
          console.log(`   ❌ Other error: ${customerIdError.message}`);
        }
      } else {
        console.log('   ✅ stripe_customer_id column exists');
        console.log(`   📊 Found ${customerIdTest?.length || 0} records`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing column: ${error.message}`);
    }
    
    // Check all subscription records
    console.log('\n3️⃣ Checking all subscription records...');
    
    const { data: allSubscriptions, error: allError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created', { ascending: false });
    
    if (allError) {
      console.log(`   ❌ Error getting all subscriptions: ${allError.message}`);
    } else {
      console.log(`   ✅ Found ${allSubscriptions?.length || 0} subscription records`);
      
      if (allSubscriptions && allSubscriptions.length > 0) {
        console.log('\n   📋 Recent subscriptions:');
        allSubscriptions.slice(0, 3).forEach((sub, index) => {
          console.log(`      ${index + 1}. ID: ${sub.id}`);
          console.log(`         User: ${sub.user_id}`);
          console.log(`         Status: ${sub.status}`);
          console.log(`         Price: ${sub.stripe_price_id}`);
          console.log(`         Stripe Sub: ${sub.stripe_subscription_id}`);
          console.log('');
        });
      }
    }
    
    // Provide solution
    console.log('4️⃣ Schema analysis and solution...');
    
    if (sampleRecord && !sampleRecord.hasOwnProperty('stripe_customer_id')) {
      console.log('   🔧 ISSUE IDENTIFIED:');
      console.log('      - subscriptions table is missing stripe_customer_id column');
      console.log('      - Code is trying to access this column but it doesn\'t exist');
      
      console.log('\n   ✅ SOLUTIONS:');
      console.log('      1. Add stripe_customer_id column to subscriptions table');
      console.log('      2. OR modify code to not require this column');
      console.log('      3. OR use a different approach to link customers and subscriptions');
      
      console.log('\n   🛠️  RECOMMENDED FIX:');
      console.log('      Add the missing column with a migration:');
      console.log('      ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT;');
    } else {
      console.log('   ✅ Schema appears to be correct');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

// Run the check
checkSubscriptionsSchema().then(() => {
  console.log('\n✅ Schema check completed!');
}).catch(console.error);
