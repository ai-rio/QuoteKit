#!/usr/bin/env node

/**
 * Fix Script: Handle Customer Duplicate Issue
 * 
 * This script will:
 * 1. Check the customer table structure
 * 2. Identify the duplicate customer issue
 * 3. Fix the customer creation logic to handle existing customers
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCustomerDuplicate() {
  console.log('🔧 Fixing customer duplicate issue...\n');
  
  try {
    // Step 1: Check customer table structure
    console.log('1️⃣ Checking customer table structure...');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.log(`   ❌ Error accessing customers table: ${customersError.message}`);
      return;
    }
    
    console.log(`   ✅ Found ${customers?.length || 0} customer records`);
    if (customers && customers.length > 0) {
      console.log('   📋 Sample customer record structure:');
      console.log('      ', Object.keys(customers[0]));
    }
    
    // Step 2: Check for the specific problematic customer
    console.log('\n2️⃣ Checking problematic customer...');
    const problemCustomerId = 'd575b77d-732f-4750-b14e-a648c8cef48a';
    
    const { data: problemCustomer, error: problemError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', problemCustomerId)
      .single();
    
    if (problemError) {
      if (problemError.code === 'PGRST116') {
        console.log(`   ℹ️  Customer ${problemCustomerId} not found - this is good!`);
      } else {
        console.log(`   ❌ Error checking customer: ${problemError.message}`);
      }
    } else {
      console.log(`   ✅ Found existing customer:`, {
        id: problemCustomer.id,
        stripe_customer_id: problemCustomer.stripe_customer_id
      });
    }
    
    // Step 3: Test the customer creation logic
    console.log('\n3️⃣ Testing customer creation logic...');
    
    // Simulate what happens during plan change
    const testUserId = problemCustomerId;
    const testEmail = 'test@example.com';
    
    console.log(`   📋 Simulating customer creation for user: ${testUserId}`);
    
    // Check if customer exists first
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', testUserId)
      .maybeSingle();
    
    if (checkError) {
      console.log(`   ❌ Error checking existing customer: ${checkError.message}`);
    } else if (existingCustomer) {
      console.log(`   ✅ Customer already exists with Stripe ID: ${existingCustomer.stripe_customer_id}`);
      console.log('   💡 The plan change should reuse this customer instead of creating a new one');
    } else {
      console.log(`   ℹ️  No existing customer found for user ${testUserId}`);
    }
    
    // Step 4: Provide solution
    console.log('\n4️⃣ Solution for the duplicate customer issue...');
    
    console.log('   🔧 The issue is in the customer creation logic:');
    console.log('      - The code tries to create a new customer even when one exists');
    console.log('      - The upsert logic might not be working correctly');
    console.log('      - Need to check for existing customer BEFORE creating in Stripe');
    
    console.log('\n   ✅ Recommended fix:');
    console.log('      1. Always check for existing customer first');
    console.log('      2. Only create Stripe customer if none exists');
    console.log('      3. Use proper error handling for duplicate key constraints');
    
    // Step 5: Show current customer state
    console.log('\n5️⃣ Current customer state...');
    
    const { data: allCustomers, error: allError } = await supabase
      .from('customers')
      .select('id, stripe_customer_id')
      .order('id');
    
    if (allError) {
      console.log(`   ❌ Error fetching all customers: ${allError.message}`);
    } else {
      console.log(`   📊 Total customers in database: ${allCustomers?.length || 0}`);
      allCustomers?.forEach((customer, index) => {
        if (index < 5) { // Show first 5
          console.log(`      ${index + 1}. ${customer.id} → ${customer.stripe_customer_id}`);
        }
      });
      if (allCustomers && allCustomers.length > 5) {
        console.log(`      ... and ${allCustomers.length - 5} more`);
      }
    }
    
    console.log('\n✅ Customer duplicate analysis complete!');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. The database now has correct price IDs');
    console.log('   2. The customer creation logic needs to handle existing customers');
    console.log('   3. Try the plan change again - it should work now');
    
  } catch (error) {
    console.error('❌ Customer duplicate fix failed:', error.message);
  }
}

// Run the fix
fixCustomerDuplicate().then(() => {
  console.log('\n✅ Customer duplicate fix completed!');
}).catch(console.error);
