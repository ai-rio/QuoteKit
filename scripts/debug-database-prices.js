#!/usr/bin/env node

/**
 * Debug Script: Check Database for Old Price IDs
 * 
 * This script will check the database for any references to the old price IDs
 * that might be causing the error.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDatabasePrices() {
  console.log('🔍 Checking database for old price IDs...\n');
  
  try {
    // Check all tables that might contain price IDs
    const tablesToCheck = [
      'stripe_prices',
      'subscriptions', 
      'products',
      'user_subscriptions',
      'billing_history'
    ];
    
    for (const table of tablesToCheck) {
      console.log(`📋 Checking table: ${table}`);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(5);
        
        if (error) {
          console.log(`   ❌ Error accessing ${table}: ${error.message}`);
          continue;
        }
        
        if (!data || data.length === 0) {
          console.log(`   ℹ️  Table ${table} is empty or doesn't exist`);
          continue;
        }
        
        console.log(`   ✅ Found ${data.length} records in ${table}`);
        
        // Check for old price IDs in the data
        const dataStr = JSON.stringify(data);
        if (dataStr.includes('price_pro_monthly') || dataStr.includes('price_pro_annual')) {
          console.log(`   🚨 FOUND OLD PRICE IDs in ${table}:`);
          data.forEach((record, index) => {
            const recordStr = JSON.stringify(record);
            if (recordStr.includes('price_pro_monthly') || recordStr.includes('price_pro_annual')) {
              console.log(`      Record ${index + 1}:`, record);
            }
          });
        } else {
          console.log(`   ✅ No old price IDs found in ${table}`);
        }
        
      } catch (tableError) {
        console.log(`   ❌ Error checking ${table}: ${tableError.message}`);
      }
    }
    
    // Check for the specific customer ID from the error
    console.log('\n🔍 Checking for duplicate customer ID...');
    const customerId = 'd575b77d-732f-4750-b14e-a648c8cef48a';
    
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId);
    
    if (customerError) {
      console.log(`   ❌ Error checking customer: ${customerError.message}`);
    } else if (customerData && customerData.length > 0) {
      console.log(`   🚨 FOUND EXISTING CUSTOMER:`, customerData[0]);
    } else {
      console.log(`   ℹ️  Customer ${customerId} not found in database`);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

// Run the debug
debugDatabasePrices().then(() => {
  console.log('\n✅ Database debug complete!');
}).catch(console.error);
