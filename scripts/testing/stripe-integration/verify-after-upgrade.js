/**
 * Post-Upgrade Verification Script
 * 
 * Run this after attempting a plan upgrade to verify if Step 1.1 worked.
 * 
 * Usage: Copy and paste into browser console after upgrade attempt.
 */

(async function verifyAfterUpgrade() {
  console.log('🔍 Post-Upgrade Verification - Step 1.1 Check');
  console.log('=' .repeat(45));
  
  try {
    // Get current status
    const response = await fetch('/api/subscription-status');
    const data = await response.json();
    
    const hasCustomer = data.status?.customer?.hasStripeCustomer || false;
    const customerId = data.status?.customer?.stripeCustomerId || 'none';
    const subscriptions = data.status?.subscriptions?.count || 0;
    const currentPlan = data.status?.subscription?.prices?.products?.name || 'Free';
    
    console.log('\n📊 Current Status:');
    console.log(`Subscriptions: ${subscriptions}`);
    console.log(`Current Plan: ${currentPlan}`);
    console.log(`Has Stripe Customer: ${hasCustomer}`);
    console.log(`Customer ID: ${customerId}`);
    
    console.log('\n🎯 Step 1.1 Verification Result:');
    
    if (subscriptions === 0) {
      console.log('ℹ️  You are still on the free plan');
      console.log('💡 The upgrade might not have completed successfully');
      console.log('❓ Step 1.1 Status: NOT APPLICABLE (free user)');
    } else if (subscriptions > 0 && hasCustomer) {
      console.log('🎉 SUCCESS: Paid user with Stripe customer!');
      console.log(`✅ Customer ID: ${customerId}`);
      console.log('✅ Step 1.1 Status: WORKING CORRECTLY');
      
      // Check if it's a real Stripe customer ID
      if (customerId.startsWith('cus_')) {
        console.log('✅ Customer ID format is correct (starts with "cus_")');
      } else {
        console.log('⚠️  Customer ID format is unusual (should start with "cus_")');
      }
    } else if (subscriptions > 0 && !hasCustomer) {
      console.log('❌ ISSUE: Paid user without Stripe customer');
      console.log('❌ Step 1.1 Status: NOT WORKING');
      console.log('');
      console.log('🔧 This means:');
      console.log('   - The upgrade created a local subscription');
      console.log('   - But failed to create a Stripe customer');
      console.log('   - Step 1.1 implementation needs debugging');
    }
    
    console.log('\n📋 Summary:');
    console.log(`User Type: ${subscriptions > 0 ? 'PAID' : 'FREE'}`);
    console.log(`Stripe Customer: ${hasCustomer ? '✅ YES' : '❌ NO'}`);
    console.log(`Step 1.1: ${subscriptions > 0 ? (hasCustomer ? '✅ WORKING' : '❌ BROKEN') : 'N/A'}`);
    
    if (subscriptions > 0 && !hasCustomer) {
      console.log('\n🔧 Next Steps:');
      console.log('1. Check browser console for errors during upgrade');
      console.log('2. Verify Stripe configuration (keys, etc.)');
      console.log('3. Try upgrading again');
      console.log('4. Check server logs for detailed error messages');
    } else if (subscriptions > 0 && hasCustomer) {
      console.log('\n🎉 Next Steps:');
      console.log('1. Step 1.1 is working correctly!');
      console.log('2. You can now test Step 1.2 (Real Subscription Creation)');
      console.log('3. Check if billing history shows real Stripe invoices');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    console.log('\n🔧 Make sure you are logged in and the app is running');
  }
})();
