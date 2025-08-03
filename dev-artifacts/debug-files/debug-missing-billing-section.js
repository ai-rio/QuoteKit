/**
 * Debug Missing Billing Section
 * Run this to diagnose why BillingHistoryTable is not showing after user upgrade
 */

console.log('🔍 Diagnosing Missing Billing Section...');

async function debugMissingBillingSection() {
  console.log('\n=== 1. Check Account Page Structure ===');
  
  // Check if billing section exists in DOM
  const billingSection = document.querySelector('[class*="billing"]') || 
                        Array.from(document.querySelectorAll('*')).find(el => 
                          el.textContent?.toLowerCase().includes('billing history')
                        );
  
  console.log('🔍 Billing Section Found:', !!billingSection);
  
  if (billingSection) {
    console.log('   Element:', billingSection.tagName);
    console.log('   Classes:', billingSection.className);
    console.log('   Text content preview:', billingSection.textContent?.substring(0, 100) + '...');
  } else {
    console.log('❌ No billing section found in DOM');
  }

  // Check for BillingHistoryTable component specifically
  const billingTable = document.querySelector('table') || 
                      Array.from(document.querySelectorAll('*')).find(el => 
                        el.textContent?.includes('Download your invoices')
                      );
  
  console.log('🔍 Billing Table Component Found:', !!billingTable);

  console.log('\n=== 2. Check Billing History API ===');
  
  let billingData = null;
  try {
    const billingResponse = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    billingData = await billingResponse.json();
    console.log('📊 Billing History API Response:', billingData);
    
    if (billingData.success) {
      console.log(`✅ API Success: ${billingData.data.length} records returned`);
      
      if (billingData.data.length === 0) {
        console.log('⚠️ Empty billing data - this might cause component to not render');
      }
    } else {
      console.log('❌ API Error:', billingData.error);
    }
  } catch (error) {
    console.error('💥 Billing History API failed:', error);
  }

  console.log('\n=== 3. Check User Subscription Status ===');
  
  try {
    const subscriptionResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const subscriptionData = await subscriptionResponse.json();
    
    if (subscriptionData.success) {
      const status = subscriptionData.status;
      
      console.log('📊 User Status Analysis:', {
        hasStripeCustomer: status?.customer?.hasStripeCustomer,
        stripeCustomerId: status?.customer?.stripeCustomerId,
        subscriptionCount: status?.subscriptions?.count,
        activeSubscriptions: status?.subscriptions?.active?.length || 0,
        userType: status?.customer?.hasStripeCustomer ? 'paid-user' : 'free-user'
      });
      
      // Check if user recently upgraded
      if (status?.subscriptions?.count > 0 && !status?.customer?.hasStripeCustomer) {
        console.log('🚨 ISSUE IDENTIFIED: User has subscriptions but no Stripe customer!');
        console.log('🔧 This explains why billing history is empty');
        console.log('💡 User likely upgraded but Stripe customer was not created');
      }
    }
  } catch (error) {
    console.error('💥 Subscription status check failed:', error);
  }

  console.log('\n=== 4. Check Component Rendering Issues ===');
  
  // Check for React errors or loading states
  const errorElements = Array.from(document.querySelectorAll('*')).filter(el =>
    el.textContent?.toLowerCase().includes('error') ||
    el.textContent?.toLowerCase().includes('failed') ||
    el.className?.toLowerCase().includes('error')
  );
  
  console.log(`🔍 Error elements found: ${errorElements.length}`);
  
  const loadingElements = Array.from(document.querySelectorAll('*')).filter(el =>
    el.className?.toLowerCase().includes('loading') ||
    el.className?.toLowerCase().includes('skeleton') ||
    el.textContent?.toLowerCase().includes('loading')
  );
  
  console.log(`🔍 Loading elements found: ${loadingElements.length}`);
  
  if (loadingElements.length > 0) {
    console.log('⚠️ Component might be stuck in loading state');
  }

  console.log('\n=== 5. Check Suspense Boundaries ===');
  
  // The account page uses Suspense for BillingHistoryTable
  // Check if there are any Suspense-related issues
  const suspenseElements = Array.from(document.querySelectorAll('*')).filter(el =>
    el.textContent?.includes('Loading') ||
    el.className?.includes('animate-pulse')
  );
  
  console.log(`🔍 Suspense/Loading indicators: ${suspenseElements.length}`);

  console.log('\n=== 6. Diagnosis Summary ===');
  
  const issues = [];
  const fixes = [];
  
  // Analyze findings
  if (!billingSection) {
    issues.push('Billing section not found in DOM');
    fixes.push('Check if BillingHistoryTable component is being imported and rendered');
  }
  
  if (billingData?.data?.length === 0) {
    issues.push('Billing history API returns empty data');
    fixes.push('Check getBillingHistory function for newly upgraded users');
  }
  
  // Check for the specific issue: user has subscriptions but no Stripe customer
  const hasSubscriptions = subscriptionData?.status?.subscriptions?.count > 0;
  const hasStripeCustomer = subscriptionData?.status?.customer?.hasStripeCustomer;
  
  if (hasSubscriptions && !hasStripeCustomer) {
    issues.push('User has subscriptions but no Stripe customer');
    fixes.push('Create Stripe customer for newly upgraded users');
    fixes.push('Update getBillingHistory to handle this case');
  }
  
  if (loadingElements.length > 0) {
    issues.push('Component appears to be stuck in loading state');
    fixes.push('Check for async data loading issues');
    fixes.push('Verify Suspense boundaries are working correctly');
  }
  
  console.log('🚨 Issues Found:', issues);
  console.log('🔧 Recommended Fixes:', fixes);
  
  console.log('\n✅ Missing Billing Section Diagnosis Complete!');
}

// Helper function to force refresh the page
window.debugRefreshPage = function() {
  console.log('🔄 Refreshing page to check if issue persists...');
  window.location.reload();
};

// Helper function to check specific user scenario
window.debugCheckUserScenario = function() {
  console.log('🔍 Checking user scenario...');
  console.log('💡 Expected scenarios:');
  console.log('   1. Free user: No billing section (expected)');
  console.log('   2. Paid user with Stripe customer: Billing section with data');
  console.log('   3. Newly upgraded user: Billing section with "No billing history" message');
  console.log('   4. Broken case: No billing section at all for paid user');
};

// Run the diagnosis
debugMissingBillingSection().catch(error => {
  console.error('💥 Missing billing section diagnosis failed:', error);
});

console.log('\n🔧 Helper functions available:');
console.log('   debugRefreshPage() - Refresh page to retest');
console.log('   debugCheckUserScenario() - Check expected user scenarios');
