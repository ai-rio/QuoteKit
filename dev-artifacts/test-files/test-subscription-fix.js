/**
 * Test to verify subscription-status debug script fix
 */

console.log('🧪 Testing subscription-status debug fix...');

async function testSubscriptionFix() {
  try {
    const subscriptionResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const subscriptionData = await subscriptionResponse.json();
    console.log('📊 Subscription Status API Response:', subscriptionData);
    
    if (subscriptionData.success) {
      console.log('✅ Subscription status retrieved');
      
      // Get the active subscription (first one if multiple)
      const activeSubscription = subscriptionData.status?.subscriptions?.active?.[0];
      const customerInfo = subscriptionData.status?.customer;
      
      // Extract plan information from price_id
      const priceId = activeSubscription?.stripe_price_id || subscriptionData.status?.subscriptions?.all?.[0]?.priceId;
      let planName = 'Unknown Plan';
      if (priceId) {
        if (priceId.includes('free')) planName = 'Free Plan';
        else if (priceId.includes('basic')) planName = 'Basic Plan';
        else if (priceId.includes('pro')) planName = 'Pro Plan';
        else if (priceId.includes('premium')) planName = 'Premium Plan';
        else planName = `Plan (${priceId})`;
      }
      
      console.log('   Current Plan:', planName);
      console.log('   Status:', activeSubscription?.status || subscriptionData.status?.subscriptions?.all?.[0]?.status || 'Unknown');
      console.log('   Stripe Customer ID:', customerInfo?.stripeCustomerId ? customerInfo.stripeCustomerId.substring(0, 8) + '...' : 'Missing');
      console.log('   Stripe Subscription ID:', activeSubscription?.stripe_subscription_id ? activeSubscription.stripe_subscription_id.substring(0, 8) + '...' : 'Missing');
      console.log('   Subscription Count:', subscriptionData.status?.subscriptions?.count || 0);
      console.log('   Has Stripe Customer:', customerInfo?.hasStripeCustomer || false);
      
      // Show diagnostics if any
      if (subscriptionData.diagnostics?.length > 0) {
        console.log('   Diagnostics:');
        subscriptionData.diagnostics.forEach(diag => {
          console.log(`     ${diag.level.toUpperCase()}: ${diag.issue} - ${diag.description}`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Subscription Status API failed:', subscriptionData.error);
      return false;
    }
  } catch (error) {
    console.error('💥 Subscription Status API error:', error);
    return false;
  }
}

testSubscriptionFix();
