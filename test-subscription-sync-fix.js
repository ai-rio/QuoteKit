#!/usr/bin/env node
/**
 * Test script to verify subscription sync fix
 * Run this after applying the migration to verify everything works
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testSubscriptionSyncFix() {
  console.log('🧪 Testing Subscription Sync Fix');
  console.log('================================');
  
  try {
    // 1. Test the diagnostic function
    console.log('1. Testing diagnostic function...');
    const { data: diagnosticData, error: diagnosticError } = await supabase
      .rpc('debug_subscription_sync');
    
    if (diagnosticError) {
      console.error('❌ Diagnostic function failed:', diagnosticError);
    } else {
      console.log('✅ Diagnostic function works');
      console.log('Current subscriptions:', diagnosticData);
    }
    
    // 2. Test the safe upsert function with a mock subscription
    console.log('\n2. Testing safe upsert function...');
    const mockSubscriptionId = 'test_sub_' + Date.now();
    const mockUserId = '00000000-0000-0000-0000-000000000000'; // Test UUID
    
    const { data: upsertData, error: upsertError } = await supabase
      .rpc('safe_upsert_subscription', {
        p_subscription_id: mockSubscriptionId,
        p_user_id: mockUserId,
        p_stripe_customer_id: 'cus_test_123',
        p_stripe_price_id: 'price_test_123',
        p_status: 'active'
      });
    
    if (upsertError) {
      console.error('❌ Safe upsert function failed:', upsertError);
    } else {
      console.log('✅ Safe upsert function works');
      console.log('Upsert result:', upsertData);
      
      // Clean up test data
      await supabase
        .from('subscriptions')
        .delete()
        .eq('id', mockSubscriptionId);
    }
    
    // 3. Test RLS policies
    console.log('\n3. Testing RLS policies...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('subscriptions')
      .select('count')
      .single();
    
    if (rlsError) {
      console.error('❌ RLS test failed:', rlsError);
    } else {
      console.log('✅ RLS policies allow service role access');
    }
    
    // 4. Check table structure
    console.log('\n4. Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'subscriptions')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Table structure check failed:', tableError);
    } else {
      console.log('✅ Table structure:');
      tableInfo.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`);
      });
    }
    
    console.log('\n🎉 Subscription sync fix verification completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testSubscriptionSyncFix().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test script failed:', error);
  process.exit(1);
});