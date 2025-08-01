/**
 * Test to investigate authentication session issues
 */

console.log('🧪 Testing authentication session...');

async function testAuthSession() {
  console.log('\n=== 1. LocalStorage Investigation ===');
  
  // Check all localStorage keys
  const allKeys = Object.keys(localStorage);
  console.log('📦 All localStorage keys:', allKeys);
  
  // Look for Supabase-related keys
  const supabaseKeys = allKeys.filter(key => 
    key.includes('supabase') || 
    key.includes('sb-') || 
    key.includes('auth')
  );
  console.log('🔑 Supabase-related keys:', supabaseKeys);
  
  // Check specific Supabase session keys
  const possibleSessionKeys = [
    'sb-127.0.0.1:54321-auth-token',
    'supabase.auth.token',
    'sb-localhost-auth-token',
    'supabase-auth-token'
  ];
  
  console.log('🔍 Checking possible session keys:');
  possibleSessionKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`   ${key}: ${value ? 'EXISTS' : 'MISSING'}`);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`     Type: ${typeof parsed}, Keys: ${Object.keys(parsed)}`);
      } catch (e) {
        console.log(`     Raw value length: ${value.length}`);
      }
    }
  });

  console.log('\n=== 2. Session Cookie Investigation ===');
  
  // Check document.cookie for session info
  const cookies = document.cookie.split(';').map(c => c.trim());
  const authCookies = cookies.filter(cookie => 
    cookie.includes('supabase') || 
    cookie.includes('auth') ||
    cookie.includes('sb-')
  );
  console.log('🍪 Auth-related cookies:', authCookies);

  console.log('\n=== 3. Current User Check ===');
  
  // Try to check current user via API
  try {
    const userResponse = await fetch('/api/debug-account', {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('👤 Current user from API:', {
        authenticated: !!userData.user,
        userId: userData.user?.id,
        email: userData.user?.email,
        hasSession: !!userData.session
      });
    } else {
      console.log('❌ User API failed:', userResponse.status, userResponse.statusText);
    }
  } catch (error) {
    console.log('💥 User API error:', error.message);
  }

  console.log('\n=== 4. Browser Environment ===');
  
  console.log('🌍 Environment details:', {
    url: window.location.href,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port,
    userAgent: navigator.userAgent.substring(0, 100) + '...',
    cookieEnabled: navigator.cookieEnabled,
    storageAvailable: typeof(Storage) !== "undefined"
  });

  console.log('\n=== 5. Supabase Client Test ===');
  
  // Check if we can access Supabase client directly
  if (window.supabase) {
    console.log('✅ Global Supabase client found');
    try {
      const session = await window.supabase.auth.getSession();
      console.log('📊 Session from global client:', {
        hasSession: !!session.data.session,
        hasUser: !!session.data.session?.user,
        error: session.error?.message
      });
    } catch (error) {
      console.log('💥 Global client error:', error.message);
    }
  } else {
    console.log('❌ No global Supabase client found');
  }

  return true;
}

testAuthSession();
