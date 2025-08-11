/**
 * Debug Upgrade Process
 * Run this to check if the user upgrade process completed properly
 */

console.log('🔍 Debugging Upgrade Process...');

async function debugUpgradeProcess() {
  console.log('\n=== 1. Current User Status ===');
  
  try {
    const subscriptionResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const subscriptionData = await subscriptionResponse.json();
    
    if (subscriptionData.success) {
      const status = subscriptionData.status;
      
      console.log('📊 Current User Status:', {
        hasStripeCustomer: status?.customer?.hasStripeCustomer,
        stripeCustomerId: status?.customer?.stripeCustomerId,
        subscriptionCount: status?.subscriptions?.count,
        activeSubscriptions: status?.subscriptions?.active?.length || 0,
        allSubscriptions: status?.subscriptions?.all?.length || 0,
        userType: status?.customer?.hasStripeCustomer ? 'paid-user' : 'free-user'
      });
      
      // Show detailed subscription info
      if (status?.subscriptions?.all?.length > 0) {
        console.log('\n📋 Subscription Details:');
        status.subscriptions.all.forEach((sub, index) => {
          console.log(`   Subscription ${index + 1}:`, {
            id: sub.id,
            status: sub.status,
            priceId: sub.priceId,
            created: sub.created,
            hasStripeSubscriptionId: !!sub.stripe_subscription_id
          });
        });
      } else {
        console.log('⚠️ No subscriptions found - user appears to be on free plan');
      }
    }
  } catch (error) {
    console.error('💥 Subscription status check failed:', error);
  }

  console.log('\n=== 2. Check Recent Plan Changes ===');
  
  // Check URL parameters for upgrade success/failure
  const urlParams = new URLSearchParams(window.location.search);
  const hasUpgradeParams = urlParams.has('upgrade') || urlParams.has('success') || urlParams.has('plan_change');
  
  console.log('🔍 URL Parameters:', {
    hasUpgradeParams,
    allParams: Object.fromEntries(urlParams.entries())
  });
  
  if (hasUpgradeParams) {
    console.log('✅ Found upgrade-related URL parameters');
  } else {
    console.log('⚠️ No upgrade-related URL parameters found');
  }

  console.log('\n=== 3. Check Local Storage for Upgrade State ===');
  
  // Check for any upgrade-related data in localStorage
  const upgradeKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.toLowerCase().includes('upgrade') || 
        key?.toLowerCase().includes('plan') || 
        key?.toLowerCase().includes('subscription')) {
      upgradeKeys.push({
        key,
        value: localStorage.getItem(key)
      });
    }
  }
  
  console.log('🔍 Upgrade-related localStorage:', upgradeKeys);

  console.log('\n=== 4. Test Plan Change Functionality ===');
  
  // Check if plan change buttons are available
  const planChangeButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.toLowerCase().includes('change') ||
    btn.textContent?.toLowerCase().includes('upgrade') ||
    btn.textContent?.toLowerCase().includes('plan')
  );
  
  console.log(`🔍 Plan change buttons found: ${planChangeButtons.length}`);
  
  if (planChangeButtons.length > 0) {
    planChangeButtons.forEach((btn, index) => {
      console.log(`   Button ${index + 1}: "${btn.textContent?.trim()}" (${btn.disabled ? 'disabled' : 'enabled'})`);
    });
  }

  console.log('\n=== 5. Check Database Sync Issues ===');
  
  // Check if there might be a timing issue with database sync
  console.log('🔍 Checking for potential sync issues...');
  
  // Force refresh subscription data
  try {
    console.log('🔄 Force refreshing subscription data...');
    
    // Try to refresh the page data
    const refreshResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const refreshedData = await refreshResponse.json();
    
    if (refreshedData.success) {
      const refreshedStatus = refreshedData.status;
      
      console.log('📊 Refreshed Status:', {
        subscriptionCount: refreshedStatus?.subscriptions?.count,
        hasStripeCustomer: refreshedStatus?.customer?.hasStripeCustomer,
        changed: refreshedStatus?.subscriptions?.count !== subscriptionData?.status?.subscriptions?.count
      });
      
      if (refreshedStatus?.subscriptions?.count !== subscriptionData?.status?.subscriptions?.count) {
        console.log('🔄 Data changed after refresh - there was a sync delay');
      }
    }
  } catch (error) {
    console.error('💥 Refresh failed:', error);
  }

  console.log('\n=== 6. Diagnosis & Recommendations ===');
  
  const currentSubscriptionCount = subscriptionData?.status?.subscriptions?.count || 0;
  const hasStripeCustomer = subscriptionData?.status?.customer?.hasStripeCustomer;
  
  if (currentSubscriptionCount === 0) {
    console.log('🎯 DIAGNOSIS: User is currently on FREE PLAN');
    console.log('💡 Possible reasons:');
    console.log('   1. Upgrade process was not completed');
    console.log('   2. Payment failed during upgrade');
    console.log('   3. User cancelled the upgrade');
    console.log('   4. Database sync issue (check after refresh)');
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('   1. Try the upgrade process again');
    console.log('   2. Check browser console for payment errors');
    console.log('   3. Verify Stripe webhook processing');
    console.log('   4. Check server logs for upgrade failures');
  } else if (currentSubscriptionCount > 0 && !hasStripeCustomer) {
    console.log('🎯 DIAGNOSIS: User has subscriptions but no Stripe customer');
    console.log('💡 This is the original issue - upgrade partially completed');
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('   1. Create Stripe customer for the user');
    console.log('   2. Sync subscription with Stripe');
    console.log('   3. Update getBillingHistory to show local subscription data');
  } else if (currentSubscriptionCount > 0 && hasStripeCustomer) {
    console.log('🎯 DIAGNOSIS: User is properly upgraded');
    console.log('💡 Billing section should be showing - check component rendering');
  }
  
  console.log('\n✅ Upgrade Process Debug Complete!');
}

// Helper function to simulate upgrade for testing
window.debugSimulateUpgrade = function() {
  console.log('🧪 To test upgrade process:');
  console.log('1. Click a "Change Plan" or "Upgrade" button');
  console.log('2. Complete the upgrade flow');
  console.log('3. Run this debug script again to check results');
  console.log('4. Check if billing section appears after upgrade');
};

// Helper function to check specific upgrade scenario
window.debugCheckUpgradeScenario = function() {
  console.log('🔍 Upgrade Scenarios:');
  console.log('✅ Scenario 1: Free user (subscriptionCount: 0) - No billing section');
  console.log('⚠️ Scenario 2: Partial upgrade (subscriptionCount: >0, no Stripe customer) - Empty billing section');
  console.log('✅ Scenario 3: Complete upgrade (subscriptionCount: >0, has Stripe customer) - Billing section with data');
  console.log('❌ Scenario 4: Broken upgrade - No billing section for paid user');
};

// Run the debug
debugUpgradeProcess().catch(error => {
  console.error('💥 Upgrade process debug failed:', error);
});

console.log('\n🔧 Helper functions available:');
console.log('   debugSimulateUpgrade() - Instructions for testing upgrade');
console.log('   debugCheckUpgradeScenario() - Check upgrade scenarios');
