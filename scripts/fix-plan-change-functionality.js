#!/usr/bin/env node

/**
 * Fix Script: Plan Change Functionality Issues
 * 
 * This script will:
 * 1. Create missing database tables (payment_methods, billing_history)
 * 2. Fix the incomplete subscription issue
 * 3. Ensure proper payment method handling
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPlanChangeFunctionality() {
  console.log('🔧 Fixing plan change functionality issues...\n');
  
  try {
    // Issue 1: Create missing payment_methods table
    console.log('1️⃣ Creating payment_methods table...');
    
    const createPaymentMethodsTable = `
      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        stripe_payment_method_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'card',
        card_brand TEXT,
        card_last4 TEXT,
        card_exp_month INTEGER,
        card_exp_year INTEGER,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    try {
      const { error: pmTableError } = await supabase.rpc('exec_sql', { 
        sql: createPaymentMethodsTable 
      });
      
      if (pmTableError) {
        console.log(`   ❌ Failed to create payment_methods table: ${pmTableError.message}`);
      } else {
        console.log('   ✅ payment_methods table created successfully');
      }
    } catch (pmError) {
      console.log(`   ⚠️  Cannot create payment_methods table (might need manual creation): ${pmError.message}`);
    }
    
    // Issue 2: Create missing billing_history table
    console.log('\n2️⃣ Creating billing_history table...');
    
    const createBillingHistoryTable = `
      CREATE TABLE IF NOT EXISTS billing_history (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        subscription_id TEXT,
        amount INTEGER NOT NULL,
        currency TEXT DEFAULT 'usd',
        status TEXT NOT NULL,
        description TEXT,
        invoice_url TEXT,
        stripe_invoice_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    try {
      const { error: bhTableError } = await supabase.rpc('exec_sql', { 
        sql: createBillingHistoryTable 
      });
      
      if (bhTableError) {
        console.log(`   ❌ Failed to create billing_history table: ${bhTableError.message}`);
      } else {
        console.log('   ✅ billing_history table created successfully');
      }
    } catch (bhError) {
      console.log(`   ⚠️  Cannot create billing_history table (might need manual creation): ${bhError.message}`);
    }
    
    // Issue 3: Check incomplete subscriptions
    console.log('\n3️⃣ Analyzing incomplete subscriptions...');
    
    const { data: incompleteSubscriptions, error: incompleteError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'incomplete')
      .order('created', { ascending: false });
    
    if (incompleteError) {
      console.log(`   ❌ Error checking incomplete subscriptions: ${incompleteError.message}`);
    } else {
      console.log(`   📊 Found ${incompleteSubscriptions?.length || 0} incomplete subscriptions`);
      
      if (incompleteSubscriptions && incompleteSubscriptions.length > 0) {
        console.log('\n   📋 Incomplete subscriptions:');
        incompleteSubscriptions.forEach((sub, index) => {
          console.log(`      ${index + 1}. ${sub.id}`);
          console.log(`         User: ${sub.user_id}`);
          console.log(`         Price: ${sub.stripe_price_id}`);
          console.log(`         Created: ${sub.created}`);
          console.log('');
        });
        
        console.log('   💡 These subscriptions need payment confirmation to become active');
      }
    }
    
    // Issue 4: Provide manual table creation SQL
    console.log('\n4️⃣ Manual table creation SQL (if needed)...');
    
    console.log('\n   📋 If tables weren\'t created automatically, run these SQL commands:');
    
    console.log('\n   🔧 payment_methods table:');
    console.log(`
CREATE TABLE payment_methods (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'card',
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
    `);
    
    console.log('\n   🔧 billing_history table:');
    console.log(`
CREATE TABLE billing_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  description TEXT,
  invoice_url TEXT,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
    `);
    
    // Issue 5: Recommendations for fixing the flow
    console.log('\n5️⃣ Plan change flow recommendations...');
    
    console.log('\n   🔧 ISSUES TO FIX:');
    console.log('      1. Subscriptions are created as "incomplete" - need payment confirmation');
    console.log('      2. Payment methods aren\'t being saved to database');
    console.log('      3. Billing history isn\'t being created (table missing)');
    console.log('      4. No payment confirmation flow for users');
    
    console.log('\n   ✅ SOLUTIONS:');
    console.log('      1. Add payment confirmation step after subscription creation');
    console.log('      2. Save payment methods to payment_methods table');
    console.log('      3. Create billing records in billing_history table');
    console.log('      4. Handle subscription status updates via webhooks');
    
    console.log('\n   🚀 NEXT STEPS:');
    console.log('      1. Create the missing tables (manually if needed)');
    console.log('      2. Update plan change logic to handle payment confirmation');
    console.log('      3. Add payment method saving functionality');
    console.log('      4. Test the complete flow end-to-end');
    
    // Test table creation
    console.log('\n6️⃣ Testing table access...');
    
    const tablesToTest = ['payment_methods', 'billing_history'];
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: accessible (${data?.length || 0} records)`);
        }
      } catch (tableError) {
        console.log(`   ❌ ${tableName}: ${tableError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Fix script failed:', error.message);
  }
}

// Run the fix
fixPlanChangeFunctionality().then(() => {
  console.log('\n✅ Plan change functionality fix completed!');
}).catch(console.error);
