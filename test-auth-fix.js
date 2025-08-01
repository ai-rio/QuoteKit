/**
 * Test to verify authentication session fix
 */

console.log('🧪 Testing authentication session fix...');

async function testAuthFix() {
  console.log('\n=== 1. Updated Environment Check ===');
  
  const authInfo = {
    hasSupabaseSessionInLocalStorage: !!localStorage.getItem('sb-127.0.0.1:54321-auth-token') || !!localStorage.getItem('supabase.auth.token'),
    hasSupabaseSessionInCookies: document.cookie.includes('sb-127-auth-token') || document.cookie.includes('supabase-auth-token'),
    cookieBasedAuth: document.cookie.split(';').filter(c => c.includes('sb-') || c.includes('supabase')).length > 0,
    totalCookies: document.cookie.split(';').length
  };
  
  console.log('🌍 Client Environment:', {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    authentication: authInfo
  });

  console.log('\n=== 2. Authentication Status Summary ===');
  
  if (authInfo.hasSupabaseSessionInCookies) {
    console.log('✅ SUCCESS: Supabase session found in cookies');
    console.log('   Authentication method: Cookie-based storage');
    console.log('   Session storage: Working correctly');
  } else if (authInfo.hasSupabaseSessionInLocalStorage) {
    console.log('✅ SUCCESS: Supabase session found in localStorage');
    console.log('   Authentication method: LocalStorage-based');
  } else {
    console.log('❌ FAILED: No Supabase session found');
    console.log('   Check: User might not be logged in');
  }

  console.log('\n=== 3. Debug Account API Test ===');
  
  try {
    const userResponse = await fetch('/api/debug-account', {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('👤 Current user from debug API:', {
        hasSession: !!userData.session,
        userId: userData.session?.userId,
        email: userData.session?.email,
        hasSubscription: !!userData.subscription,
        hasPaymentMethods: !!userData.paymentMethods && userData.paymentMethods.length > 0,
        hasStripeKey: !!userData.stripeKey
      });
      
      if (userData.session) {
        console.log('✅ User is properly authenticated');
      } else {
        console.log('❌ Session exists but user data missing');
      }
    } else {
      console.log('❌ Debug account API failed:', userResponse.status, userResponse.statusText);
    }
  } catch (error) {
    console.log('💥 Debug account API error:', error.message);
  }

  return authInfo;
}

testAuthFix();
