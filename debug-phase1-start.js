/**
 * Phase 1 Pre-Implementation Test Script
 * 
 * This script tests the current state of the system before we start Phase 1 implementation.
 * It will help us understand exactly what's broken and verify our fixes work.
 */

console.log('🧪 Phase 1 Pre-Implementation Test - Current State Analysis');
console.log('='.repeat(60));

async function testCurrentState() {
  try {
    console.log('\n📊 1. Testing Subscription Status...');
    const subscriptionResponse = await fetch('/api/subscription-status');
    const subscriptionData = await subscriptionResponse.json();
    
    console.log('Subscription Status Response:', {
      hasData: !!subscriptionData.status,
      subscriptionCount: subscriptionData.status?.subscriptions?.count || 0,
      hasStripeCustomer: subscriptionData.status?.customer?.hasStripeCustomer || false,
      stripeCustomerId: subscriptionData.status?.customer?.stripeCustomerId || 'none',
      currentPlan: subscriptionData.status?.subscription?.prices?.products?.name || 'none'
    });

    console.log('\n💳 2. Testing Payment Methods...');
    const paymentResponse = await fetch('/api/payment-methods');
    const paymentData = await paymentResponse.json();
    
    console.log('Payment Methods Response:', {
      success: paymentData.success,
      methodCount: paymentData.data?.length || 0,
      methods: paymentData.data?.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        isDefault: pm.is_default
      })) || []
    });

    console.log('\n📄 3. Testing Billing History...');
    const billingResponse = await fetch('/api/billing-history');
    const billingData = await billingResponse.json();
    
    console.log('Billing History Response:', {
      success: billingData.success,
      recordCount: billingData.data?.length || 0,
      records: billingData.data?.map(record => ({
        id: record.id,
        idType: record.id.startsWith('in_') ? 'REAL_STRIPE_INVOICE' : 
                record.id.startsWith('sub_') ? 'LOCAL_SUBSCRIPTION' : 'UNKNOWN',
        amount: record.amount,
        status: record.status,
        hasDownload: record.invoice_url !== '#'
      })) || []
    });

    console.log('\n🔍 4. Analysis Summary:');
    
    // Analyze the current state
    const hasStripeCustomer = subscriptionData.status?.customer?.hasStripeCustomer || false;
    const hasSubscriptions = (subscriptionData.status?.subscriptions?.count || 0) > 0;
    const hasRealInvoices = billingData.data?.some(record => record.id.startsWith('in_')) || false;
    const hasLocalSubscriptions = billingData.data?.some(record => record.id.startsWith('sub_')) || false;
    
    console.log('Current State Analysis:', {
      userType: hasSubscriptions ? 'PAID_USER' : 'FREE_USER',
      stripeIntegration: hasStripeCustomer ? 'HAS_CUSTOMER' : 'NO_CUSTOMER',
      billingType: hasRealInvoices ? 'REAL_STRIPE_INVOICES' : 
                   hasLocalSubscriptions ? 'LOCAL_SUBSCRIPTIONS_ONLY' : 'NO_BILLING_DATA',
      needsPhase1Fix: hasSubscriptions && !hasStripeCustomer
    });

    console.log('\n🎯 Phase 1 Implementation Needed:', {
      createStripeCustomer: hasSubscriptions && !hasStripeCustomer,
      fixSubscriptionCreation: hasLocalSubscriptions && !hasRealInvoices,
      updateBillingHistory: hasLocalSubscriptions
    });

    console.log('\n✅ Pre-implementation test complete!');
    console.log('📋 Ready to start Phase 1 implementation.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Debug Information:');
    console.log('- Make sure you are logged in');
    console.log('- Check that the application is running on localhost:3000');
    console.log('- Verify API routes are accessible');
  }
}

// Auto-run the test
testCurrentState();
