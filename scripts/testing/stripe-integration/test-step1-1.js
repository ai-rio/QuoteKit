/**
 * Step 1.1 Test Script - Stripe Customer Creation
 * 
 * This script tests whether Step 1.1 (Fix Stripe Customer Creation) is working correctly.
 * Run this in the browser console while logged into the application.
 * 
 * Usage:
 * 1. Open your browser to localhost:3000
 * 2. Make sure you're logged in
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

console.log('🧪 Step 1.1 Test - Stripe Customer Creation');
console.log('='.repeat(50));

async function testStep1_1() {
  try {
    console.log('\n📊 1. Testing Current Subscription Status...');
    
    const subscriptionResponse = await fetch('/api/subscription-status');
    if (!subscriptionResponse.ok) {
      throw new Error(`Subscription API failed: ${subscriptionResponse.status}`);
    }
    
    const subscriptionData = await subscriptionResponse.json();
    
    const hasStripeCustomer = subscriptionData.status?.customer?.hasStripeCustomer || false;
    const subscriptionCount = subscriptionData.status?.subscriptions?.count || 0;
    const stripeCustomerId = subscriptionData.status?.customer?.stripeCustomerId || 'none';
    const currentPlan = subscriptionData.status?.subscription?.prices?.products?.name || 'none';
    
    console.log('Current Status:', {
      subscriptionCount,
      hasStripeCustomer,
      stripeCustomerId,
      currentPlan
    });
    
    console.log('\n💳 2. Testing Payment Methods...');
    
    const paymentResponse = await fetch('/api/payment-methods');
    if (!paymentResponse.ok) {
      throw new Error(`Payment Methods API failed: ${paymentResponse.status}`);
    }
    
    const paymentData = await paymentResponse.json();
    const methodCount = paymentData.data?.length || 0;
    
    console.log('Payment Methods:', {
      success: paymentData.success,
      methodCount,
      hasPaymentMethods: methodCount > 0
    });
    
    console.log('\n📄 3. Testing Billing History...');
    
    const billingResponse = await fetch('/api/billing-history');
    if (!billingResponse.ok) {
      throw new Error(`Billing History API failed: ${billingResponse.status}`);
    }
    
    const billingData = await billingResponse.json();
    const recordCount = billingData.data?.length || 0;
    
    // Analyze billing record types
    const billingAnalysis = {
      totalRecords: recordCount,
      realStripeInvoices: 0,
      localSubscriptions: 0,
      unknownTypes: 0
    };
    
    if (billingData.data) {
      billingData.data.forEach(record => {
        if (record.id.startsWith('in_')) {
          billingAnalysis.realStripeInvoices++;
        } else if (record.id.startsWith('sub_')) {
          billingAnalysis.localSubscriptions++;
        } else {
          billingAnalysis.unknownTypes++;
        }
      });
    }
    
    console.log('Billing History:', billingAnalysis);
    
    console.log('\n🔍 4. Step 1.1 Analysis...');
    
    // Determine user type and integration status
    const userType = subscriptionCount > 0 ? 'PAID_USER' : 'FREE_USER';
    const stripeIntegration = hasStripeCustomer ? 'HAS_CUSTOMER' : 'NO_CUSTOMER';
    const billingType = billingAnalysis.realStripeInvoices > 0 ? 'REAL_STRIPE_INVOICES' : 
                       billingAnalysis.localSubscriptions > 0 ? 'LOCAL_SUBSCRIPTIONS_ONLY' : 'NO_BILLING_DATA';
    
    console.log('Analysis Results:', {
      userType,
      stripeIntegration,
      billingType,
      needsStep1_1Fix: subscriptionCount > 0 && !hasStripeCustomer
    });
    
    console.log('\n🎯 Step 1.1 Test Results:');
    
    if (userType === 'FREE_USER') {
      console.log('✅ FREE USER: Step 1.1 not applicable - no subscriptions to test');
      console.log('💡 To test Step 1.1, upgrade to a paid plan first');
      return;
    }
    
    if (userType === 'PAID_USER' && stripeIntegration === 'HAS_CUSTOMER') {
      console.log('✅ STEP 1.1 SUCCESS: Paid user has Stripe customer!');
      console.log(`✅ Customer ID: ${stripeCustomerId}`);
      
      if (billingType === 'REAL_STRIPE_INVOICES') {
        console.log('🎉 BONUS: You also have real Stripe invoices (Steps 1.2 & 1.3 working too!)');
      } else if (billingType === 'LOCAL_SUBSCRIPTIONS_ONLY') {
        console.log('⚠️  PARTIAL: Customer exists but still showing local subscriptions');
        console.log('📋 Next: Need to implement Step 1.2 (Real Subscription Creation)');
      }
    } else if (userType === 'PAID_USER' && stripeIntegration === 'NO_CUSTOMER') {
      console.log('❌ STEP 1.1 NOT WORKING: Paid user still has no Stripe customer');
      console.log('🔧 TROUBLESHOOTING:');
      console.log('   1. Try upgrading your plan to trigger customer creation');
      console.log('   2. Check if FORCE_PRODUCTION_PATH is set to true');
      console.log('   3. Verify Stripe configuration is correct');
      console.log('   4. Check browser console for errors during upgrade');
    }
    
    console.log('\n📋 Summary:');
    console.log(`User Type: ${userType}`);
    console.log(`Stripe Customer: ${hasStripeCustomer ? '✅ YES' : '❌ NO'}`);
    console.log(`Customer ID: ${stripeCustomerId}`);
    console.log(`Billing Type: ${billingType}`);
    
    if (subscriptionCount > 0 && !hasStripeCustomer) {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log('Step 1.1 implementation needs testing. Try upgrading your plan.');
    } else if (subscriptionCount > 0 && hasStripeCustomer) {
      console.log('\n🎉 STEP 1.1 WORKING:');
      console.log('Stripe customer creation is functioning correctly!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you are logged in');
    console.log('2. Verify the application is running on localhost:3000');
    console.log('3. Check that API routes are accessible');
    console.log('4. Open Network tab to see if API calls are failing');
  }
}

// Auto-run the test
console.log('🚀 Starting Step 1.1 test...');
testStep1_1();
