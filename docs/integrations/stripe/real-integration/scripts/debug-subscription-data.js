/**
 * Debug Subscription Data Structure
 * 
 * This script helps debug what the subscription data looks like
 * to understand why the upgrade is failing.
 * 
 * Usage: Copy and paste into browser console while logged in.
 */

(async function debugSubscriptionData() {
  console.log('🔍 Debug Subscription Data Structure');
  console.log('=' .repeat(45));
  
  try {
    console.log('\n1. 📊 Raw Subscription Status Data...');
    
    const response = await fetch('/api/subscription-status');
    const data = await response.json();
    
    console.log('Full response:', JSON.stringify(data, null, 2));
    
    console.log('\n2. 🔍 Analyzing Subscription Structure...');
    
    const subscription = data.status?.subscription;
    if (subscription) {
      console.log('Subscription details:', {
        id: subscription.id,
        status: subscription.status,
        stripe_subscription_id: subscription.stripe_subscription_id,
        stripe_customer_id: subscription.stripe_customer_id,
        stripe_price_id: subscription.stripe_price_id,
        created: subscription.created,
        user_id: subscription.user_id
      });
      
      console.log('\n3. 🎯 Path Logic Analysis...');
      
      const hasStripeSubscriptionId = !!subscription.stripe_subscription_id;
      const stripeSubIdValue = subscription.stripe_subscription_id;
      
      console.log('Path determination:', {
        hasStripeSubscriptionId,
        stripeSubIdValue,
        pathTaken: hasStripeSubscriptionId ? 'EXISTING_SUBSCRIPTION' : 'NEW_SUBSCRIPTION',
        shouldTakeNewPath: !hasStripeSubscriptionId || stripeSubIdValue === null || stripeSubIdValue?.startsWith('sub_dev_')
      });
      
      if (hasStripeSubscriptionId && stripeSubIdValue?.startsWith('sub_dev_')) {
        console.log('🚨 ISSUE FOUND: Local dev subscription ID detected!');
        console.log(`   stripe_subscription_id: ${stripeSubIdValue}`);
        console.log('   This is causing the code to take the EXISTING_SUBSCRIPTION path');
        console.log('   But it should take the NEW_SUBSCRIPTION path for local dev records');
      }
      
    } else {
      console.log('❌ No subscription found in response');
    }
    
    console.log('\n4. 🔧 Customer Analysis...');
    
    const customer = data.status?.customer;
    if (customer) {
      console.log('Customer details:', {
        hasStripeCustomer: customer.hasStripeCustomer,
        stripeCustomerId: customer.stripeCustomerId
      });
    }
    
    console.log('\n5. 💡 Diagnosis...');
    
    if (subscription?.stripe_subscription_id?.startsWith('sub_dev_')) {
      console.log('🎯 ROOT CAUSE IDENTIFIED:');
      console.log('   Your subscription has a local dev ID (sub_dev_...)');
      console.log('   The code thinks this is a real Stripe subscription');
      console.log('   So it tries to update an existing Stripe subscription');
      console.log('   But there is no real Stripe subscription to update');
      console.log('');
      console.log('🔧 SOLUTION NEEDED:');
      console.log('   Modify the logic to treat sub_dev_* IDs as "new subscription"');
      console.log('   Or clean up the local dev subscription first');
    } else if (!subscription?.stripe_subscription_id) {
      console.log('✅ This should work - no stripe_subscription_id found');
      console.log('   The code should take the NEW_SUBSCRIPTION path');
    } else {
      console.log('🤔 Unexpected subscription state');
      console.log('   Need to investigate further');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
})();
