/**
 * Test to see actual subscription-status API response structure
 */

console.log('🧪 Testing subscription-status API structure...');

async function testSubscriptionStructure() {
  try {
    const response = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const data = await response.json();
    console.log('📊 Full Subscription Status API Response:', JSON.stringify(data, null, 2));
    
    // Test the paths the debug script expects
    console.log('\n🔍 Testing expected paths:');
    console.log('   subscriptionData.subscription:', data.subscription);
    console.log('   subscriptionData.status:', data.status);
    console.log('   subscriptionData.status.subscriptions:', data.status?.subscriptions);
    console.log('   subscriptionData.status.customer:', data.status?.customer);
    
    return data;
  } catch (error) {
    console.error('💥 Error testing subscription-status API:', error);
    return null;
  }
}

testSubscriptionStructure();
