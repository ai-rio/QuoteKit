#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testAuthAndPlanChange() {
  console.log('🧪 Testing Authentication and Plan Change Flow');
  console.log('==============================================');

  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    console.log('🔍 Step 1: Check if any users exist...');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`✅ Found ${users.users?.length || 0} users in the system`);
    
    if (users.users && users.users.length > 0) {
      const testUser = users.users[0];
      console.log('👤 Test user:', {
        id: testUser.id,
        email: testUser.email,
        created_at: testUser.created_at
      });

      console.log('\n🔍 Step 2: Check user subscriptions...');
      
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', testUser.id);

      if (subError) {
        console.log('❌ Error fetching subscriptions:', subError.message);
      } else {
        console.log(`✅ User has ${subscriptions?.length || 0} subscriptions`);
        subscriptions?.forEach(sub => {
          console.log(`   📋 ${sub.id}: ${sub.status} (${sub.price_id})`);
        });
      }

      console.log('\n🔍 Step 3: Test development subscription creation...');
      
      const testSubscription = {
        id: `sub_test_${Date.now()}`,
        user_id: testUser.id,
        status: 'active',
        price_id: 'price_pro_monthly',
        quantity: 1,
        cancel_at_period_end: false,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date().toISOString(),
        trial_start: null,
        trial_end: null
      };

      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert(testSubscription)
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating test subscription:', {
          code: createError.code,
          message: createError.message,
          details: createError.details
        });
      } else {
        console.log('✅ Test subscription created successfully:', {
          id: newSub.id,
          status: newSub.status,
          price_id: newSub.price_id
        });

        // Clean up
        await supabase.from('subscriptions').delete().eq('id', newSub.id);
        console.log('🧹 Test subscription cleaned up');
      }

    } else {
      console.log('ℹ️ No users found. You may need to sign up a user first.');
      console.log('   Go to http://localhost:3001/auth/sign-up to create a test user');
    }

    console.log('\n🎯 Troubleshooting Tips:');
    console.log('========================');
    console.log('1. Make sure you have signed up a user via the UI');
    console.log('2. Check that the user is authenticated when trying to change plans');
    console.log('3. Verify the price_id exists in the stripe_prices table');
    console.log('4. Check browser console for detailed error messages');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthAndPlanChange();
