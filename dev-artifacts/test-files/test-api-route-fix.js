/**
 * Test API Route Fix
 * Run this to verify the invoice download API route is now accessible
 */

console.log('🧪 Testing API Route Fix...');

async function testApiRouteFix() {
  console.log('\n=== Testing Invoice Download API Route ===');
  
  // Test with the actual invoice ID from the debug results
  const testInvoiceId = 'sub_sub_dev_1754079800405';
  
  try {
    const response = await fetch(`/api/billing-history/${testInvoiceId}/invoice`, {
      method: 'GET',
      cache: 'no-store'
    });
    
    console.log('📊 API Response Status:', response.status);
    console.log('📊 API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 404) {
      console.log('❌ API route still returns 404');
      console.log('🔧 The route file might not be compiled yet - try restarting the dev server');
      return false;
    } else if (response.status === 401) {
      console.log('✅ API route exists (returns 401 - authentication required)');
      console.log('🔧 This is expected - the route is working but needs authentication');
      return true;
    } else if (response.status === 500) {
      console.log('⚠️ API route exists but has server error');
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return true; // Route exists, just has an error
    } else {
      console.log('✅ API route exists and responds');
      
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonResponse = await response.json();
        console.log('📊 JSON Response:', jsonResponse);
      }
      return true;
    }
  } catch (error) {
    console.error('💥 API route test failed:', error);
    return false;
  }
}

// Test the route
testApiRouteFix().then(success => {
  if (success) {
    console.log('\n🎉 API Route Fix: SUCCESS');
    console.log('✅ The invoice download API route is now accessible');
    console.log('🔧 Next step: Fix the invoice URL generation in billing data');
  } else {
    console.log('\n❌ API Route Fix: FAILED');
    console.log('🔧 The API route is still not accessible');
    console.log('💡 Try restarting the development server');
  }
});

console.log('\n📋 Current Issues Identified:');
console.log('1. ✅ Download buttons are visible');
console.log('2. 🔧 API route needs to be accessible (testing...)');
console.log('3. ❌ Invoice URLs are placeholders (#) instead of real Stripe URLs');
console.log('4. ❌ User has no Stripe customer record (hasStripeCustomer: false)');

console.log('\n🎯 Next Steps After API Route Fix:');
console.log('1. Fix Stripe customer creation for existing users');
console.log('2. Generate proper invoice URLs from Stripe data');
console.log('3. Test actual invoice download functionality');
