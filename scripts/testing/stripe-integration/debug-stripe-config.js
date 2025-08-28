/**
 * Stripe Configuration Debug Script
 * 
 * This script helps diagnose Stripe configuration issues that might prevent
 * Step 1.1 from working properly.
 * 
 * Usage: Copy and paste into browser console while logged in.
 */

(async function debugStripeConfig() {
  console.log('🔍 Stripe Configuration Debug');
  console.log('=' .repeat(40));
  
  try {
    console.log('\n1. 🔧 Checking Environment...');
    
    // Check if we're in development mode
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log(`Environment: ${isDev ? 'Development' : 'Production'}`);
    console.log(`URL: ${window.location.origin}`);
    
    console.log('\n2. 📡 Testing API Endpoints...');
    
    // Test subscription status API
    try {
      const subResponse = await fetch('/api/subscription-status');
      console.log(`Subscription Status API: ${subResponse.ok ? '✅' : '❌'} (${subResponse.status})`);
      
      if (subResponse.ok) {
        const subData = await subResponse.json();
        console.log('Current user has:', {
          subscriptions: subData.status?.subscriptions?.count || 0,
          stripeCustomer: subData.status?.customer?.hasStripeCustomer || false
        });
      }
    } catch (error) {
      console.log(`Subscription Status API: ❌ (${error.message})`);
    }
    
    // Test a simple API that might reveal Stripe config issues
    try {
      const debugResponse = await fetch('/api/debug-account');
      console.log(`Debug Account API: ${debugResponse.ok ? '✅' : '❌'} (${debugResponse.status})`);
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Debug info available:', !!debugData);
      }
    } catch (error) {
      console.log(`Debug Account API: ❌ (${error.message})`);
    }
    
    console.log('\n3. 🎯 Simulating Plan Upgrade...');
    console.log('To test Step 1.1, we need to trigger a plan upgrade.');
    console.log('This will help us see if the Stripe customer creation is working.');
    
    // Check if there are available plans
    try {
      const plansResponse = await fetch('/api/subscription-status');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        console.log('\nCurrent subscription details:');
        console.log('- Plan:', plansData.status?.subscription?.prices?.products?.name || 'Unknown');
        console.log('- Status:', plansData.status?.subscription?.status || 'Unknown');
        console.log('- Subscription ID:', plansData.status?.subscription?.id || 'None');
      }
    } catch (error) {
      console.log('Could not fetch plan details:', error.message);
    }
    
    console.log('\n4. 🔧 Troubleshooting Steps:');
    console.log('');
    console.log('The Stripe network error suggests a configuration issue.');
    console.log('Here are the most likely causes:');
    console.log('');
    console.log('❌ Issue: ERR_NAME_NOT_RESOLVED for m.stripe.com');
    console.log('🔧 Possible causes:');
    console.log('   1. Stripe publishable key not set or invalid');
    console.log('   2. Network/DNS issue preventing Stripe access');
    console.log('   3. Stripe configuration in admin_settings table missing');
    console.log('   4. Environment variables not loaded properly');
    console.log('');
    console.log('🎯 Recommended actions:');
    console.log('   1. Check your .env.local file for STRIPE_SECRET_KEY');
    console.log('   2. Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set');
    console.log('   3. Check if Stripe keys are for the correct environment (test/live)');
    console.log('   4. Try upgrading your plan to trigger the customer creation');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Fix Stripe configuration');
    console.log('   2. Try upgrading your plan');
    console.log('   3. Run the Step 1.1 test again');
    
    console.log('\n5. 🧪 Manual Test Instructions:');
    console.log('');
    console.log('To manually test Step 1.1:');
    console.log('1. Go to your account settings');
    console.log('2. Try to upgrade/change your plan');
    console.log('3. Watch the browser console for errors');
    console.log('4. Run the Step 1.1 test script again');
    console.log('5. Look for "Has Stripe Customer: true" in the results');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
    console.log('\n🔧 Basic troubleshooting:');
    console.log('1. Make sure you are logged in');
    console.log('2. Check if the application is running properly');
    console.log('3. Look for any error messages in the console');
  }
})();
