/**
 * Quick test to verify billing-history API fix
 * Run this in browser console after the fix
 */

console.log('🧪 Testing billing-history API fix...');

async function testBillingHistoryFix() {
  try {
    const response = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const data = await response.json();
    console.log('📊 Billing History API Response:', data);
    
    if (data.success === true) {
      console.log('✅ SUCCESS: billing-history API now returns success field');
      console.log(`   Found ${data.data.length} billing records`);
      return true;
    } else {
      console.error('❌ FAILED: billing-history API still missing success field');
      return false;
    }
  } catch (error) {
    console.error('💥 Error testing billing-history API:', error);
    return false;
  }
}

testBillingHistoryFix();
