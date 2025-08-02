/**
 * Manual Customer Creation Test
 * 
 * This script helps test if the Stripe customer creation is working
 * by simulating what happens during a plan upgrade.
 * 
 * Usage: Copy and paste into browser console while logged in.
 */

(async function testCustomerCreation() {
  console.log('🧪 Manual Customer Creation Test');
  console.log('=' .repeat(40));
  
  try {
    console.log('\n1. 📊 Current Status Check...');
    
    // Get current status
    const statusResponse = await fetch('/api/subscription-status');
    const statusData = await statusResponse.json();
    
    const hasStripeCustomer = statusData.status?.customer?.hasStripeCustomer || false;
    const customerId = statusData.status?.customer?.stripeCustomerId || 'none';
    
    console.log('Before test:', {
      hasStripeCustomer,
      customerId,
      subscriptions: statusData.status?.subscriptions?.count || 0
    });
    
    if (hasStripeCustomer) {
      console.log('✅ You already have a Stripe customer!');
      console.log('🎉 Step 1.1 is working correctly.');
      return;
    }
    
    console.log('\n2. 🔧 Checking Available Plans...');
    
    // This is a bit tricky - we need to find what plans are available
    // Let's check if there's a way to get available plans
    try {
      // Try to get current subscription details to understand the structure
      const currentSub = statusData.status?.subscription;
      if (currentSub) {
        console.log('Current subscription:', {
          id: currentSub.id,
          status: currentSub.status,
          plan: currentSub.prices?.products?.name || 'Unknown'
        });
      }
    } catch (error) {
      console.log('Could not analyze current subscription:', error.message);
    }
    
    console.log('\n3. 🎯 Manual Upgrade Instructions...');
    console.log('');
    console.log('To test Step 1.1, you need to trigger a plan upgrade:');
    console.log('');
    console.log('📋 Steps:');
    console.log('1. Go to your account settings/billing page');
    console.log('2. Click "Upgrade Plan" or "Change Plan"');
    console.log('3. Select a different plan');
    console.log('4. Complete the upgrade process');
    console.log('5. Come back and run the Step 1.1 test again');
    console.log('');
    console.log('🔍 What to watch for:');
    console.log('- Any error messages during upgrade');
    console.log('- Network errors in browser console');
    console.log('- Success/failure notifications');
    console.log('');
    console.log('📊 After upgrade, run this to check:');
    console.log('```javascript');
    console.log('fetch("/api/subscription-status")');
    console.log('  .then(r => r.json())');
    console.log('  .then(d => console.log({');
    console.log('    hasCustomer: d.status?.customer?.hasStripeCustomer,');
    console.log('    customerId: d.status?.customer?.stripeCustomerId');
    console.log('  }));');
    console.log('```');
    
    console.log('\n4. 🐛 Debugging Tips...');
    console.log('');
    console.log('If the upgrade fails or doesn\'t create a customer:');
    console.log('');
    console.log('🔧 Check browser console for errors like:');
    console.log('   - "ERR_NAME_NOT_RESOLVED" (DNS/network issue)');
    console.log('   - "401 Unauthorized" (Stripe key issue)');
    console.log('   - "400 Bad Request" (Invalid request)');
    console.log('');
    console.log('🔧 Check server logs for errors like:');
    console.log('   - "Stripe not configured"');
    console.log('   - "Failed to create customer"');
    console.log('   - Database connection errors');
    console.log('');
    console.log('🔧 Verify configuration:');
    console.log('   - STRIPE_SECRET_KEY is set and valid');
    console.log('   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY matches secret key');
    console.log('   - Keys are for the same environment (test/live)');
    
    console.log('\n5. 🎯 Expected Outcome...');
    console.log('');
    console.log('After a successful upgrade with Step 1.1 working:');
    console.log('✅ hasStripeCustomer: true');
    console.log('✅ customerId: cus_... (starts with "cus_")');
    console.log('✅ Step 1.1 test shows "WORKING"');
    console.log('');
    console.log('If Step 1.1 is not working:');
    console.log('❌ hasStripeCustomer: false');
    console.log('❌ customerId: "none"');
    console.log('❌ Step 1.1 test shows "NOT WORKING"');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Make sure you are logged in and the app is running');
  }
})();
