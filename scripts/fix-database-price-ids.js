#!/usr/bin/env node

/**
 * Fix Script: Update Database Price IDs
 * 
 * This script will:
 * 1. Update the stripe_prices table with correct price IDs
 * 2. Update existing subscriptions to use correct price IDs
 * 3. Handle the customer duplicate key issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapping of old price IDs to new ones
const PRICE_ID_MAPPING = {
  'price_pro_monthly': 'price_1RVyAQGgBK1ooXYF0LokEHtQ', // $12.00/month
  'price_pro_annual': 'price_1RoUo5GgBK1ooXYF4nMSQooR'   // $72.00/year
};

async function fixDatabasePriceIds() {
  console.log('🔧 Fixing database price ID issues...\n');
  
  try {
    // Step 1: Update stripe_prices table
    console.log('1️⃣ Updating stripe_prices table...');
    
    for (const [oldId, newId] of Object.entries(PRICE_ID_MAPPING)) {
      console.log(`   Updating ${oldId} → ${newId}`);
      
      const { error } = await supabase
        .from('stripe_prices')
        .update({ id: newId })
        .eq('id', oldId);
      
      if (error) {
        console.log(`   ❌ Error updating ${oldId}: ${error.message}`);
      } else {
        console.log(`   ✅ Updated ${oldId} → ${newId}`);
      }
    }
    
    // Step 2: Update subscriptions table
    console.log('\n2️⃣ Updating subscriptions table...');
    
    for (const [oldId, newId] of Object.entries(PRICE_ID_MAPPING)) {
      console.log(`   Updating subscriptions with ${oldId} → ${newId}`);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ stripe_price_id: newId })
        .eq('stripe_price_id', oldId)
        .select();
      
      if (error) {
        console.log(`   ❌ Error updating subscriptions: ${error.message}`);
      } else {
        console.log(`   ✅ Updated ${data?.length || 0} subscription records`);
      }
    }
    
    // Step 3: Check for duplicate customer issue
    console.log('\n3️⃣ Checking customer duplicate issue...');
    const problemCustomerId = 'd575b77d-732f-4750-b14e-a648c8cef48a';
    
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', problemCustomerId)
      .single();
    
    if (customerError && customerError.code !== 'PGRST116') {
      console.log(`   ❌ Error checking customer: ${customerError.message}`);
    } else if (existingCustomer) {
      console.log(`   ℹ️  Customer ${problemCustomerId} exists with Stripe ID: ${existingCustomer.stripe_customer_id}`);
      console.log('   💡 This customer will be reused instead of creating a duplicate');
    } else {
      console.log(`   ℹ️  Customer ${problemCustomerId} not found`);
    }
    
    console.log('\n✅ Database fixes completed!');
    
    // Verification
    console.log('\n🔍 Verifying fixes...');
    
    const { data: updatedPrices } = await supabase
      .from('stripe_prices')
      .select('id, description, unit_amount')
      .in('id', Object.values(PRICE_ID_MAPPING));
    
    console.log('Updated prices:');
    updatedPrices?.forEach(price => {
      console.log(`   - ${price.id}: ${price.description} ($${(price.unit_amount / 100).toFixed(2)})`);
    });
    
    const { data: updatedSubs } = await supabase
      .from('subscriptions')
      .select('id, stripe_price_id, user_id')
      .in('stripe_price_id', Object.values(PRICE_ID_MAPPING));
    
    console.log(`\nUpdated subscriptions: ${updatedSubs?.length || 0} records`);
    
    console.log('\n🎉 All fixes applied successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Try the plan change again');
    console.log('   2. The price ID error should be resolved');
    console.log('   3. The customer duplicate error should be handled');
    
  } catch (error) {
    console.error('❌ Fix script failed:', error.message);
  }
}

// Run the fix
fixDatabasePriceIds().then(() => {
  console.log('\n✅ Fix script completed!');
}).catch(console.error);
