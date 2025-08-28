/**
 * Comprehensive Phase 1 Debug Script
 * 
 * This script provides detailed debugging information for Phase 1 implementation.
 * It checks all aspects of the Stripe integration and provides actionable feedback.
 * 
 * Usage:
 * 1. Open browser to localhost:3000
 * 2. Make sure you're logged in
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

console.log('🔍 Phase 1 Comprehensive Debug Script');
console.log('='.repeat(60));

async function debugPhase1() {
  const results = {
    apis: {},
    user: {},
    stripe: {},
    billing: {},
    recommendations: []
  };
  
  try {
    console.log('\n📡 1. Testing API Accessibility...');
    
    // Test all relevant APIs
    const apiTests = [
      { name: 'subscription-status', url: '/api/subscription-status' },
      { name: 'payment-methods', url: '/api/payment-methods' },
      { name: 'billing-history', url: '/api/billing-history' }
    ];
    
    for (const api of apiTests) {
      try {
        const response = await fetch(api.url);
        results.apis[api.name] = {
          accessible: response.ok,
          status: response.status,
          error: response.ok ? null : `HTTP ${response.status}`
        };
        console.log(`  ${api.name}: ${response.ok ? '✅' : '❌'} (${response.status})`);
      } catch (error) {
        results.apis[api.name] = {
          accessible: false,
          status: 0,
          error: error.message
        };
        console.log(`  ${api.name}: ❌ (${error.message})`);
      }
    }
    
    console.log('\n👤 2. Analyzing User Status...');
    
    if (results.apis['subscription-status'].accessible) {
      const subscriptionResponse = await fetch('/api/subscription-status');
      const subscriptionData = await subscriptionResponse.json();
      
      results.user = {
        isAuthenticated: !!subscriptionData.status,
        subscriptionCount: subscriptionData.status?.subscriptions?.count || 0,
        hasStripeCustomer: subscriptionData.status?.customer?.hasStripeCustomer || false,
        stripeCustomerId: subscriptionData.status?.customer?.stripeCustomerId || null,
        currentPlan: subscriptionData.status?.subscription?.prices?.products?.name || 'Free',
        subscriptionId: subscriptionData.status?.subscription?.id || null,
        subscriptionStatus: subscriptionData.status?.subscription?.status || null
      };
      
      console.log('User Analysis:', {
        authenticated: results.user.isAuthenticated ? '✅' : '❌',
        subscriptions: results.user.subscriptionCount,
        stripeCustomer: results.user.hasStripeCustomer ? '✅' : '❌',
        plan: results.user.currentPlan
      });
    } else {
      console.log('❌ Cannot analyze user - subscription-status API failed');
    }
    
    console.log('\n💳 3. Analyzing Payment Methods...');
    
    if (results.apis['payment-methods'].accessible) {
      const paymentResponse = await fetch('/api/payment-methods');
      const paymentData = await paymentResponse.json();
      
      results.stripe.paymentMethods = {
        count: paymentData.data?.length || 0,
        hasDefault: paymentData.data?.some(pm => pm.is_default) || false,
        methods: paymentData.data?.map(pm => ({
          id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          isDefault: pm.is_default
        })) || []
      };
      
      console.log('Payment Methods:', {
        count: results.stripe.paymentMethods.count,
        hasDefault: results.stripe.paymentMethods.hasDefault ? '✅' : '❌'
      });
    } else {
      console.log('❌ Cannot analyze payment methods - API failed');
    }
    
    console.log('\n📄 4. Analyzing Billing History...');
    
    if (results.apis['billing-history'].accessible) {
      const billingResponse = await fetch('/api/billing-history');
      const billingData = await billingResponse.json();
      
      results.billing = {
        totalRecords: billingData.data?.length || 0,
        realStripeInvoices: 0,
        localSubscriptions: 0,
        unknownTypes: 0,
        records: []
      };
      
      if (billingData.data) {
        billingData.data.forEach(record => {
          const recordInfo = {
            id: record.id,
            type: 'unknown',
            amount: record.amount,
            status: record.status,
            hasDownload: record.invoice_url !== '#'
          };
          
          if (record.id.startsWith('in_')) {
            recordInfo.type = 'stripe_invoice';
            results.billing.realStripeInvoices++;
          } else if (record.id.startsWith('sub_')) {
            recordInfo.type = 'local_subscription';
            results.billing.localSubscriptions++;
          } else {
            results.billing.unknownTypes++;
          }
          
          results.billing.records.push(recordInfo);
        });
      }
      
      console.log('Billing Analysis:', {
        totalRecords: results.billing.totalRecords,
        stripeInvoices: results.billing.realStripeInvoices,
        localSubscriptions: results.billing.localSubscriptions,
        unknownTypes: results.billing.unknownTypes
      });
    } else {
      console.log('❌ Cannot analyze billing - API failed');
    }
    
    console.log('\n🎯 5. Phase 1 Implementation Analysis...');
    
    // Determine current state and what needs to be done
    const userType = results.user.subscriptionCount > 0 ? 'PAID' : 'FREE';
    const hasCustomer = results.user.hasStripeCustomer;
    const hasRealInvoices = results.billing.realStripeInvoices > 0;
    const hasLocalSubs = results.billing.localSubscriptions > 0;
    
    console.log('Current State:', {
      userType,
      stripeCustomer: hasCustomer ? '✅' : '❌',
      realInvoices: hasRealInvoices ? '✅' : '❌',
      localSubscriptions: hasLocalSubs ? '⚠️' : '✅'
    });
    
    // Generate recommendations
    if (userType === 'FREE') {
      results.recommendations.push('ℹ️  You are on the free plan - Phase 1 testing requires a paid subscription');
      results.recommendations.push('💡 To test Phase 1: Upgrade to a paid plan and run this script again');
    } else if (userType === 'PAID') {
      if (!hasCustomer) {
        results.recommendations.push('❌ STEP 1.1 ISSUE: Paid user without Stripe customer');
        results.recommendations.push('🔧 ACTION: Try upgrading your plan to trigger customer creation');
        results.recommendations.push('🔧 CHECK: Verify FORCE_PRODUCTION_PATH = true in subscription-actions.ts');
      } else {
        results.recommendations.push('✅ STEP 1.1 SUCCESS: Stripe customer exists');
        
        if (!hasRealInvoices && hasLocalSubs) {
          results.recommendations.push('⚠️  STEP 1.2 NEEDED: Still showing local subscriptions instead of real Stripe invoices');
          results.recommendations.push('🔧 ACTION: Need to implement Step 1.2 (Real Subscription Creation)');
        } else if (hasRealInvoices) {
          results.recommendations.push('🎉 STEPS 1.1 & 1.2 SUCCESS: Real Stripe invoices detected!');
          results.recommendations.push('✅ Phase 1 appears to be working correctly');
        }
      }
    }
    
    // Check for common issues
    if (!results.apis['subscription-status'].accessible) {
      results.recommendations.push('🚨 CRITICAL: Subscription Status API not accessible - check authentication');
    }
    
    if (results.user.subscriptionCount > 1) {
      results.recommendations.push('⚠️  WARNING: Multiple subscriptions detected - may need cleanup');
    }
    
    if (results.stripe.paymentMethods.count === 0 && userType === 'PAID') {
      results.recommendations.push('⚠️  WARNING: Paid user with no payment methods - may cause issues');
    }
    
    console.log('\n📋 6. Recommendations:');
    results.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n📊 7. Complete Results Summary:');
    console.log('API Status:', Object.entries(results.apis).map(([name, status]) => 
      `${name}: ${status.accessible ? '✅' : '❌'}`
    ).join(', '));
    
    if (results.user.isAuthenticated) {
      console.log(`User: ${userType} user with ${results.user.subscriptionCount} subscription(s)`);
      console.log(`Stripe Customer: ${hasCustomer ? '✅ ' + results.user.stripeCustomerId : '❌ None'}`);
      console.log(`Billing: ${results.billing.realStripeInvoices} real invoices, ${results.billing.localSubscriptions} local records`);
    }
    
    console.log('\n🎯 Phase 1 Status:');
    if (userType === 'PAID' && hasCustomer && hasRealInvoices) {
      console.log('🎉 PHASE 1 COMPLETE: All steps working correctly!');
    } else if (userType === 'PAID' && hasCustomer && !hasRealInvoices) {
      console.log('🔄 PHASE 1 PARTIAL: Step 1.1 done, need Steps 1.2 & 1.3');
    } else if (userType === 'PAID' && !hasCustomer) {
      console.log('❌ PHASE 1 NOT WORKING: Step 1.1 needs implementation/testing');
    } else {
      console.log('ℹ️  PHASE 1 NOT APPLICABLE: Free user - upgrade to test');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
    console.log('\n🔧 Basic Troubleshooting:');
    console.log('1. Ensure you are logged in to the application');
    console.log('2. Verify the application is running on localhost:3000');
    console.log('3. Check browser Network tab for failed API calls');
    console.log('4. Try refreshing the page and running the script again');
    
    return { error: error.message };
  }
}

// Auto-run the debug script
console.log('🚀 Starting comprehensive Phase 1 debug...');
debugPhase1().then(results => {
  console.log('\n✅ Debug complete! Results stored in window.phase1DebugResults');
  window.phase1DebugResults = results;
});
