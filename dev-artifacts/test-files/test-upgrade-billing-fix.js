/**
 * Test Upgrade Billing Fix
 * Run this to test the billing section behavior for newly upgraded users
 */

console.log('🧪 Testing Upgrade Billing Fix...');

async function testUpgradeBillingFix() {
  console.log('\n=== 1. Current State Check ===');
  
  // Check current user status
  try {
    const subscriptionResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const subscriptionData = await subscriptionResponse.json();
    
    if (subscriptionData.success) {
      const status = subscriptionData.status;
      
      console.log('📊 Current User Status:', {
        subscriptionCount: status?.subscriptions?.count || 0,
        hasStripeCustomer: status?.customer?.hasStripeCustomer,
        userType: status?.customer?.hasStripeCustomer ? 'paid-user' : 'free-user'
      });
      
      // Test different scenarios
      if (status?.subscriptions?.count === 0) {
        console.log('✅ Scenario: FREE USER');
        console.log('   Expected: No billing section (or empty billing section)');
        console.log('   This is the current state - user needs to upgrade to test the fix');
      } else if (status?.subscriptions?.count > 0 && !status?.customer?.hasStripeCustomer) {
        console.log('🎯 Scenario: NEWLY UPGRADED USER (No Stripe Customer)');
        console.log('   Expected: Billing section with local subscription data');
        console.log('   This is the scenario the fix addresses');
      } else if (status?.subscriptions?.count > 0 && status?.customer?.hasStripeCustomer) {
        console.log('✅ Scenario: FULLY INTEGRATED USER');
        console.log('   Expected: Billing section with Stripe invoice data');
      }
    }
  } catch (error) {
    console.error('💥 Status check failed:', error);
  }

  console.log('\n=== 2. Test Billing History API ===');
  
  try {
    const billingResponse = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const billingData = await billingResponse.json();
    
    console.log('📊 Billing History API Response:', {
      success: billingData.success,
      recordCount: billingData.data?.length || 0,
      message: billingData.message,
      hasData: billingData.data && billingData.data.length > 0
    });
    
    if (billingData.success && billingData.data?.length > 0) {
      console.log('✅ Billing data found - billing section should show');
      
      // Show first record as example
      const firstRecord = billingData.data[0];
      console.log('   Sample record:', {
        id: firstRecord.id,
        description: firstRecord.description,
        amount: `$${(firstRecord.amount / 100).toFixed(2)}`,
        status: firstRecord.status,
        hasInvoiceUrl: firstRecord.invoice_url !== '#'
      });
    } else {
      console.log('⚠️ No billing data - billing section will show "No billing history available"');
    }
  } catch (error) {
    console.error('💥 Billing history API failed:', error);
  }

  console.log('\n=== 3. Check DOM Billing Section ===');
  
  // Check if billing section exists
  const billingSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.toLowerCase().includes('billing history')
  );
  
  console.log('🔍 Billing Section in DOM:', !!billingSection);
  
  if (billingSection) {
    // Check what's showing in the billing section
    const hasTable = billingSection.querySelector('table');
    const hasNoDataMessage = billingSection.textContent?.includes('No billing history available');
    const hasInvoiceData = billingSection.textContent?.includes('$');
    
    console.log('   Content Analysis:', {
      hasTable: !!hasTable,
      hasNoDataMessage,
      hasInvoiceData,
      contentPreview: billingSection.textContent?.substring(0, 200) + '...'
    });
    
    if (hasInvoiceData) {
      console.log('✅ Billing section shows invoice data');
    } else if (hasNoDataMessage) {
      console.log('✅ Billing section shows "No billing history available" message');
    } else {
      console.log('⚠️ Billing section content unclear');
    }
  } else {
    console.log('❌ Billing section not found in DOM');
  }

  console.log('\n=== 4. Simulate Upgrade Scenario ===');
  
  console.log('🧪 To test the fix for newly upgraded users:');
  console.log('');
  console.log('📋 STEP 1: Upgrade Process');
  console.log('   1. Click the "Upgrade Plan" button');
  console.log('   2. Complete the payment process');
  console.log('   3. Wait for redirect back to account page');
  console.log('');
  console.log('📋 STEP 2: Check Results');
  console.log('   1. Run this test script again');
  console.log('   2. Verify billing section appears');
  console.log('   3. Check if it shows subscription data or "No billing history"');
  console.log('');
  console.log('📋 EXPECTED BEHAVIOR AFTER FIX:');
  console.log('   ✅ Billing section always visible for paid users');
  console.log('   ✅ Shows local subscription data if no Stripe invoices');
  console.log('   ✅ Shows "No invoice" for download buttons on local subscriptions');
  console.log('   ✅ Shows real invoices when Stripe customer is created');

  console.log('\n=== 5. Fix Verification ===');
  
  // Check if the fix is working by looking at the current behavior
  const currentBehavior = {
    billingApiWorks: billingData?.success || false,
    billingDataExists: billingData?.data?.length > 0 || false,
    billingSectionExists: !!billingSection,
    userHasSubscriptions: subscriptionData?.status?.subscriptions?.count > 0 || false
  };
  
  console.log('📊 Current Behavior Analysis:', currentBehavior);
  
  if (currentBehavior.userHasSubscriptions && currentBehavior.billingDataExists && currentBehavior.billingSectionExists) {
    console.log('🎉 SUCCESS: Fix appears to be working!');
    console.log('   ✅ User has subscriptions');
    console.log('   ✅ Billing API returns data');
    console.log('   ✅ Billing section is visible');
  } else if (!currentBehavior.userHasSubscriptions) {
    console.log('⏳ PENDING: User is on free plan - upgrade to test the fix');
  } else {
    console.log('⚠️ ISSUE: Fix may not be working correctly');
    console.log('   Check the analysis above for specific problems');
  }
  
  console.log('\n✅ Upgrade Billing Fix Test Complete!');
}

// Helper function to guide through upgrade testing
window.testUpgradeFlow = function() {
  console.log('🧪 UPGRADE TESTING GUIDE:');
  console.log('');
  console.log('1. 📊 BEFORE UPGRADE:');
  console.log('   - Run: testUpgradeBillingFix()');
  console.log('   - Should show: Free user, no billing section');
  console.log('');
  console.log('2. 🚀 PERFORM UPGRADE:');
  console.log('   - Click "Upgrade Plan" button');
  console.log('   - Complete payment process');
  console.log('   - Wait for redirect');
  console.log('');
  console.log('3. ✅ AFTER UPGRADE:');
  console.log('   - Run: testUpgradeBillingFix()');
  console.log('   - Should show: Paid user, billing section visible');
  console.log('   - Should show: Local subscription data or "No billing history"');
  console.log('');
  console.log('4. 🔧 IF BILLING SECTION MISSING:');
  console.log('   - The fix needs to be applied');
  console.log('   - Check server logs for errors');
  console.log('   - Verify getBillingHistory function is updated');
};

// Run the test
testUpgradeBillingFix().catch(error => {
  console.error('💥 Upgrade billing fix test failed:', error);
});

console.log('\n🔧 Helper function available:');
console.log('   testUpgradeFlow() - Guide for testing the upgrade process');
