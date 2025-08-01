/**
 * Debug Post-Upgrade State
 * Run this to analyze the current state after upgrade and get improvement options
 */

console.log('🔍 Analyzing Post-Upgrade State...');

async function debugPostUpgradeState() {
  console.log('\n=== 1. Current User Status ===');
  
  try {
    const subscriptionResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const subscriptionData = await subscriptionResponse.json();
    
    if (subscriptionData.success) {
      const status = subscriptionData.status;
      
      console.log('📊 Post-Upgrade Status:', {
        subscriptionCount: status?.subscriptions?.count || 0,
        hasStripeCustomer: status?.customer?.hasStripeCustomer,
        stripeCustomerId: status?.customer?.stripeCustomerId,
        userType: status?.customer?.hasStripeCustomer ? 'fully-integrated' : 'newly-upgraded'
      });
      
      if (status?.subscriptions?.all?.length > 0) {
        console.log('\n📋 Subscription Details:');
        status.subscriptions.all.forEach((sub, index) => {
          console.log(`   Subscription ${index + 1}:`, {
            id: sub.id,
            status: sub.status,
            priceId: sub.priceId,
            planName: sub.planName || 'Unknown',
            hasStripeSubscriptionId: !!sub.stripe_subscription_id,
            created: sub.created
          });
        });
      }
      
      // Determine the exact scenario
      if (status?.subscriptions?.count > 0 && !status?.customer?.hasStripeCustomer) {
        console.log('🎯 SCENARIO: NEWLY UPGRADED USER');
        console.log('   ✅ Has local subscription records');
        console.log('   ❌ No Stripe customer created yet');
        console.log('   📋 This explains why there are no real invoices');
      } else if (status?.subscriptions?.count > 0 && status?.customer?.hasStripeCustomer) {
        console.log('🎯 SCENARIO: FULLY INTEGRATED USER');
        console.log('   ✅ Has subscription records');
        console.log('   ✅ Has Stripe customer');
        console.log('   📋 Should have real invoices');
      }
    }
  } catch (error) {
    console.error('💥 Status check failed:', error);
  }

  console.log('\n=== 2. Billing History Analysis ===');
  
  try {
    const billingResponse = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const billingData = await billingResponse.json();
    
    console.log('📊 Billing History Response:', {
      success: billingData.success,
      recordCount: billingData.data?.length || 0,
      message: billingData.message
    });
    
    if (billingData.success && billingData.data?.length > 0) {
      console.log('\n📋 Billing Records Analysis:');
      billingData.data.forEach((record, index) => {
        const isStripeInvoice = record.id.startsWith('in_');
        const isLocalSubscription = record.id.startsWith('sub_');
        
        console.log(`   Record ${index + 1}:`, {
          id: record.id,
          type: isStripeInvoice ? 'stripe-invoice' : isLocalSubscription ? 'local-subscription' : 'unknown',
          description: record.description,
          amount: `$${(record.amount / 100).toFixed(2)}`,
          status: record.status,
          hasRealInvoice: record.invoice_url !== '#',
          invoiceUrl: record.invoice_url
        });
      });
      
      // Count types
      const stripeInvoices = billingData.data.filter(r => r.id.startsWith('in_'));
      const localSubscriptions = billingData.data.filter(r => r.id.startsWith('sub_'));
      
      console.log('\n📈 Record Type Summary:', {
        stripeInvoices: stripeInvoices.length,
        localSubscriptions: localSubscriptions.length,
        totalRecords: billingData.data.length
      });
      
      if (localSubscriptions.length > 0 && stripeInvoices.length === 0) {
        console.log('🎯 ANALYSIS: Showing local subscription data (no real invoices)');
        console.log('   ✅ This is why download buttons show "No invoice"');
        console.log('   📋 This is expected for newly upgraded users');
      }
    }
  } catch (error) {
    console.error('💥 Billing history check failed:', error);
  }

  console.log('\n=== 3. DOM Billing Table Analysis ===');
  
  // Check the actual billing table content
  const billingTable = document.querySelector('table');
  if (billingTable) {
    const rows = Array.from(billingTable.querySelectorAll('tbody tr'));
    console.log(`📊 Table Rows Found: ${rows.length}`);
    
    rows.forEach((row, index) => {
      const cells = Array.from(row.querySelectorAll('td'));
      const downloadButton = row.querySelector('button[title*="Download"]');
      const noInvoiceText = row.textContent?.includes('No invoice');
      
      console.log(`   Row ${index + 1}:`, {
        cellCount: cells.length,
        hasDownloadButton: !!downloadButton,
        downloadButtonDisabled: downloadButton?.disabled,
        hasNoInvoiceText: noInvoiceText,
        rowText: row.textContent?.trim().substring(0, 100) + '...'
      });
    });
  } else {
    console.log('❌ No billing table found');
  }

  console.log('\n=== 4. User Experience Analysis ===');
  
  console.log('🎯 CURRENT USER EXPERIENCE:');
  console.log('   ✅ User can see billing section (fix worked!)');
  console.log('   ✅ User can see their subscription in billing history');
  console.log('   ⚠️ User sees "No invoice" for download (confusing)');
  console.log('   ⚠️ User might expect to download something');
  
  console.log('\n💡 IMPROVEMENT OPTIONS:');
  console.log('');
  console.log('🔧 OPTION 1: Create Stripe Customer & Invoice');
  console.log('   - Create Stripe customer for newly upgraded users');
  console.log('   - Generate retroactive invoice for the subscription');
  console.log('   - User gets real downloadable invoice');
  console.log('   - Most complete solution');
  console.log('');
  console.log('🔧 OPTION 2: Better UX for Local Subscriptions');
  console.log('   - Change "No invoice" to "Receipt not available"');
  console.log('   - Add explanation tooltip');
  console.log('   - Show when real invoices will be available');
  console.log('   - Quick UX improvement');
  console.log('');
  console.log('🔧 OPTION 3: Generate PDF Receipt');
  console.log('   - Create PDF receipt for local subscriptions');
  console.log('   - Not a real Stripe invoice, but downloadable');
  console.log('   - Better than "No invoice"');
  console.log('   - Medium complexity solution');

  console.log('\n=== 5. Recommended Next Steps ===');
  
  const hasSubscriptions = subscriptionData?.status?.subscriptions?.count > 0;
  const hasStripeCustomer = subscriptionData?.status?.customer?.hasStripeCustomer;
  const hasBillingData = billingData?.data?.length > 0;
  
  if (hasSubscriptions && !hasStripeCustomer && hasBillingData) {
    console.log('🎯 RECOMMENDED: Implement OPTION 2 (Better UX) first');
    console.log('   ✅ Quick to implement');
    console.log('   ✅ Improves user understanding');
    console.log('   ✅ Sets proper expectations');
    console.log('');
    console.log('🔄 THEN: Consider OPTION 1 (Stripe Integration) for complete solution');
    console.log('   ✅ Provides real invoices');
    console.log('   ✅ Full Stripe integration');
    console.log('   ⚠️ More complex to implement');
  } else {
    console.log('⚠️ Unexpected state - check the analysis above');
  }
  
  console.log('\n✅ Post-Upgrade State Analysis Complete!');
}

// Helper function to show improvement implementation
window.showImprovementOptions = function() {
  console.log('🔧 IMPROVEMENT IMPLEMENTATION GUIDE:');
  console.log('');
  console.log('📋 OPTION 2: Better UX (Recommended First Step)');
  console.log('   1. Update BillingHistoryTable component');
  console.log('   2. Change "No invoice" to "Receipt pending"');
  console.log('   3. Add tooltip: "Invoice will be available after Stripe processing"');
  console.log('   4. Maybe add a "Request Invoice" button');
  console.log('');
  console.log('📋 OPTION 1: Full Stripe Integration (Complete Solution)');
  console.log('   1. Create Stripe customer during upgrade process');
  console.log('   2. Generate Stripe invoice for subscription');
  console.log('   3. Update billing history to show real invoices');
  console.log('   4. Test invoice download functionality');
  console.log('');
  console.log('Which option would you like me to implement?');
};

// Run the analysis
debugPostUpgradeState().catch(error => {
  console.error('💥 Post-upgrade state analysis failed:', error);
});

console.log('\n🔧 Helper function available:');
console.log('   showImprovementOptions() - Show implementation guide for improvements');
