/**
 * Simple Step 1.1 Test Runner
 * 
 * Quick test to verify if Step 1.1 (Stripe Customer Creation) is working.
 * 
 * Usage: Copy and paste this into browser console while logged in.
 */

(async function testStep1_1() {
  console.log('🧪 Step 1.1 Quick Test - Stripe Customer Creation');
  console.log('=' .repeat(50));
  
  try {
    // Get subscription status
    const response = await fetch('/api/subscription-status');
    const data = await response.json();
    
    const hasSubscriptions = (data.status?.subscriptions?.count || 0) > 0;
    const hasStripeCustomer = data.status?.customer?.hasStripeCustomer || false;
    const customerId = data.status?.customer?.stripeCustomerId || 'none';
    
    console.log('\n📊 Current Status:');
    console.log(`Subscriptions: ${data.status?.subscriptions?.count || 0}`);
    console.log(`Has Stripe Customer: ${hasStripeCustomer}`);
    console.log(`Customer ID: ${customerId}`);
    
    console.log('\n🎯 Step 1.1 Test Result:');
    
    if (!hasSubscriptions) {
      console.log('ℹ️  FREE USER: You are on the free plan');
      console.log('💡 To test Step 1.1, upgrade to a paid plan first');
      console.log('✅ Test Result: N/A (free user)');
    } else if (hasSubscriptions && hasStripeCustomer) {
      console.log('🎉 SUCCESS: Paid user has Stripe customer!');
      console.log(`✅ Customer ID: ${customerId}`);
      console.log('✅ Test Result: STEP 1.1 WORKING');
    } else if (hasSubscriptions && !hasStripeCustomer) {
      console.log('❌ ISSUE: Paid user without Stripe customer');
      console.log('🔧 Try upgrading your plan to trigger customer creation');
      console.log('❌ Test Result: STEP 1.1 NOT WORKING');
    }
    
    console.log('\n📋 Summary:');
    console.log(`User Type: ${hasSubscriptions ? 'PAID' : 'FREE'}`);
    console.log(`Step 1.1 Status: ${hasSubscriptions ? (hasStripeCustomer ? '✅ WORKING' : '❌ BROKEN') : 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('🔧 Make sure you are logged in and the app is running');
  }
})();
