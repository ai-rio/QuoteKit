#!/usr/bin/env node

/**
 * Fix Script: Handle Database Constraints Properly
 * 
 * This script will:
 * 1. Add new price records with correct IDs
 * 2. Update subscriptions to reference new prices
 * 3. Remove old price records
 * 4. Handle customer duplicate issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapping of old price IDs to new ones
const PRICE_UPDATES = [
  {
    oldId: 'price_pro_monthly',
    newId: 'price_1RVyAQGgBK1ooXYF0LokEHtQ',
    description: 'Pro plan billed monthly',
    unit_amount: 1200
  },
  {
    oldId: 'price_pro_annual', 
    newId: 'price_1RoUo5GgBK1ooXYF4nMSQooR',
    description: 'Pro plan billed annually (20% savings)',
    unit_amount: 11520
  }
];

async function fixDatabaseConstraints() {
  console.log('🔧 Fixing database constraints properly...\n');
  
  try {
    // Step 1: Add new price records
    console.log('1️⃣ Adding new price records...');
    
    for (const update of PRICE_UPDATES) {
      console.log(`   Adding new price: ${update.newId}`);
      
      // First get the old record to copy its data
      const { data: oldPrice, error: fetchError } = await supabase
        .from('stripe_prices')
        .select('*')
        .eq('id', update.oldId)
        .single();
      
      if (fetchError) {
        console.log(`   ❌ Error fetching old price ${update.oldId}: ${fetchError.message}`);
        continue;
      }
      
      // Create new record with correct ID
      const { error: insertError } = await supabase
        .from('stripe_prices')
        .insert({
          ...oldPrice,
          id: update.newId,
          description: update.description,
          unit_amount: update.unit_amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`   ℹ️  Price ${update.newId} already exists, skipping`);
        } else {
          console.log(`   ❌ Error inserting new price: ${insertError.message}`);
        }
      } else {
        console.log(`   ✅ Added new price: ${update.newId}`);
      }
    }
    
    // Step 2: Update subscriptions to use new price IDs
    console.log('\n2️⃣ Updating subscriptions...');
    
    for (const update of PRICE_UPDATES) {
      console.log(`   Updating subscriptions: ${update.oldId} → ${update.newId}`);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ stripe_price_id: update.newId })
        .eq('stripe_price_id', update.oldId)
        .select();
      
      if (error) {
        console.log(`   ❌ Error updating subscriptions: ${error.message}`);
      } else {
        console.log(`   ✅ Updated ${data?.length || 0} subscription records`);
      }
    }
    
    // Step 3: Remove old price records (now that nothing references them)
    console.log('\n3️⃣ Removing old price records...');
    
    for (const update of PRICE_UPDATES) {
      console.log(`   Removing old price: ${update.oldId}`);
      
      const { error } = await supabase
        .from('stripe_prices')
        .delete()
        .eq('id', update.oldId);
      
      if (error) {
        console.log(`   ❌ Error removing old price: ${error.message}`);
      } else {
        console.log(`   ✅ Removed old price: ${update.oldId}`);
      }
    }
    
    // Step 4: Handle customer duplicate issue
    console.log('\n4️⃣ Checking customer handling...');
    const problemCustomerId = 'd575b77d-732f-4750-b14e-a648c8cef48a';
    
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', problemCustomerId)
      .single();
    
    if (existingCustomer) {
      console.log(`   ✅ Customer ${problemCustomerId} exists and will be reused`);
      console.log(`   📋 Stripe Customer ID: ${existingCustomer.stripe_customer_id}`);
    }
    
    console.log('\n✅ All database fixes completed!');
    
    // Final verification
    console.log('\n🔍 Final verification...');
    
    const { data: allPrices } = await supabase
      .from('stripe_prices')
      .select('id, description, unit_amount, active')
      .order('created_at', { ascending: false });
    
    console.log('Current prices in database:');
    allPrices?.forEach(price => {
      const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free';
      console.log(`   - ${price.id}: ${amount} (${price.active ? 'active' : 'inactive'})`);
    });
    
    const { data: allSubs } = await supabase
      .from('subscriptions')
      .select('id, stripe_price_id, status')
      .order('created', { ascending: false });
    
    console.log(`\nCurrent subscriptions: ${allSubs?.length || 0} records`);
    allSubs?.slice(0, 3).forEach(sub => {
      console.log(`   - ${sub.id}: ${sub.stripe_price_id} (${sub.status})`);
    });
    
    console.log('\n🎉 Database is now ready for plan changes!');
    
  } catch (error) {
    console.error('❌ Fix script failed:', error.message);
  }
}

// Run the fix
fixDatabaseConstraints().then(() => {
  console.log('\n✅ Database constraint fix completed!');
}).catch(console.error);
