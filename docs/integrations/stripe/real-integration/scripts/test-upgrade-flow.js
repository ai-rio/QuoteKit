/**
 * Upgrade Flow Test Script
 * 
 * This script helps test the actual upgrade flow to see if Step 1.1 
 * (Stripe customer creation) is working during plan changes.
 * 
 * Usage: Copy and paste into browser console while logged in.
 */

(async function testUpgradeFlow() {
  console.log('🧪 Upgrade Flow Test - Step 1.1 Verification');
  console.log('=' .repeat(50));
  
  try {
    console.log('\n1. 📊 Pre-Upgrade Status...');
    
    // Get current status
    const statusResponse = await fetch('/api/subscription-status');
    const statusData = await statusResponse.json();
    
    const beforeUpgrade = {
      hasStripeCustomer: statusData.status?.customer?.hasStripeCustomer || false,
      customerId: statusData.status?.customer?.stripeCustomerId || 'none',
      subscriptions: statusData.status?.subscriptions?.count || 0,
      currentPlan: statusData.status?.subscription?.prices?.products?.name || 'Free'
    };
    
    console.log('Before upgrade:', beforeUpgrade);
    
    if (beforeUpgrade.hasStripeCustomer) {
      console.log('✅ You already have a Stripe customer - Step 1.1 is working!');
      return;
    }
    
    console.log('\n2. 🔍 Analyzing Available Plans...');
    
    // Try to get available plans by checking the current subscription structure
    const currentSub = statusData.status?.subscription;
    if (currentSub) {
      console.log('Current subscription details:', {
        id: currentSub.id,
        status: currentSub.status,
        priceId: currentSub.prices?.stripe_price_id || currentSub.prices?.id,
        planName: currentSub.prices?.products?.name,
        amount: currentSub.prices?.unit_amount
      });
    }
    
    console.log('\n3. 🎯 Manual Upgrade Test Instructions...');
    console.log('');
    console.log('Since you don\'t have a Stripe customer yet, let\'s test Step 1.1:');
    console.log('');
    console.log('📋 Test Steps:');
    console.log('1. Keep this console open to monitor for errors');
    console.log('2. Go to your account/billing page');
    console.log('3. Click "Change Plan" or "Upgrade Plan"');
    console.log('4. Select a different plan');
    console.log('5. Watch this console for any errors during the process');
    console.log('6. Complete the upgrade');
    console.log('7. Run the verification script below');
    console.log('');
    
    console.log('🔍 What to watch for during upgrade:');
    console.log('- Network errors (ERR_NAME_NOT_RESOLVED, etc.)');
    console.log('- Stripe-related errors');
    console.log('- "Failed to create customer" messages');
    console.log('- Any JavaScript errors in this console');
    console.log('');
    
    console.log('📊 After attempting the upgrade, run this verification:');
    console.log('```javascript');
    console.log('// Verification script - copy and paste this after upgrade attempt');
    console.log('(async function verifyUpgrade() {');
    console.log('  const response = await fetch("/api/subscription-status");');
    console.log('  const data = await response.json();');
    console.log('  const hasCustomer = data.status?.customer?.hasStripeCustomer || false;');
    console.log('  const customerId = data.status?.customer?.stripeCustomerId || "none";');
    console.log('  console.log("🎯 Step 1.1 Verification Result:");');
    console.log('  console.log("Has Stripe Customer:", hasCustomer ? "✅ YES" : "❌ NO");');
    console.log('  console.log("Customer ID:", customerId);');
    console.log('  console.log("Step 1.1 Status:", hasCustomer ? "✅ WORKING" : "❌ NOT WORKING");');
    console.log('})();');
    console.log('```');
    
    console.log('\n4. 🐛 Common Issues to Watch For...');
    console.log('');
    console.log('If the upgrade fails, look for these errors:');
    console.log('');
    console.log('❌ "ERR_NAME_NOT_RESOLVED" for m.stripe.com');
    console.log('   → Stripe publishable key issue or network problem');
    console.log('');
    console.log('❌ "Stripe not configured - cannot create customer"');
    console.log('   → Server-side Stripe configuration missing');
    console.log('');
    console.log('❌ "Failed to create subscription"');
    console.log('   → Database or Stripe API issue');
    console.log('');
    console.log('❌ "Payment method is required"');
    console.log('   → Need to add a payment method first');
    console.log('');
    
    console.log('🔧 If you see errors:');
    console.log('1. Note the exact error message');
    console.log('2. Check if you have payment methods added');
    console.log('3. Verify your Stripe keys are correct');
    console.log('4. Try the upgrade again');
    console.log('');
    
    console.log('✅ If upgrade succeeds:');
    console.log('1. Run the verification script above');
    console.log('2. You should see "Has Stripe Customer: ✅ YES"');
    console.log('3. Customer ID should start with "cus_"');
    console.log('4. Step 1.1 is working correctly!');
    
    console.log('\n5. 🎯 Ready to Test!');
    console.log('');
    console.log('Go ahead and try upgrading your plan now.');
    console.log('This console will stay open to catch any errors.');
    console.log('After the upgrade, run the verification script above.');
    
    // Set up error monitoring
    const originalError = console.error;
    console.error = function(...args) {
      originalError.apply(console, ['🚨 ERROR DETECTED:', ...args]);
    };
    
    console.log('');
    console.log('🔍 Error monitoring is now active...');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    console.log('\n🔧 Make sure you are logged in and the app is running');
  }
})();
