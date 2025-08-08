#!/usr/bin/env node

/**
 * Comprehensive Authentication Fix Verification Script
 * Tests the fixes for the "Failed to fetch" error in the Edge Functions test page
 */

const { createClient } = require('@supabase/supabase-js');

const ADMIN_CREDENTIALS = {
  email: 'carlos@ai.rio.br',
  password: 'password123'
};

// Test both localhost and 127.0.0.1 URLs
const TEST_URLS = [
  'http://localhost:54321',
  'http://127.0.0.1:54321'
];

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testDirectAPI(url) {
  try {
    console.log(`\n🧪 Testing direct API authentication: ${url}`);
    
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Direct API test PASSED for ${url}`);
      console.log(`   User: ${data.user?.email}`);
      return true;
    } else {
      console.log(`❌ Direct API test FAILED for ${url}: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Direct API test ERROR for ${url}: ${error.message}`);
    return false;
  }
}

async function testSupabaseClient(url) {
  try {
    console.log(`\n🔧 Testing Supabase client authentication: ${url}`);
    
    const supabase = createClient(url, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    });

    if (error) {
      console.log(`❌ Supabase client test FAILED for ${url}: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Supabase client test PASSED for ${url}`);
      console.log(`   User: ${data.user?.email}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Supabase client test ERROR for ${url}: ${error.message}`);
    return false;
  }
}

async function testBrowserCompatibility() {
  console.log(`\n🌐 Testing browser-compatible URLs...`);
  
  const results = {
    directAPI: {},
    supabaseClient: {}
  };

  for (const url of TEST_URLS) {
    results.directAPI[url] = await testDirectAPI(url);
    results.supabaseClient[url] = await testSupabaseClient(url);
  }

  console.log(`\n📊 Test Results Summary:`);
  console.log(`==========================================`);
  
  for (const url of TEST_URLS) {
    const directResult = results.directAPI[url] ? '✅' : '❌';
    const clientResult = results.supabaseClient[url] ? '✅' : '❌';
    console.log(`${url}:`);
    console.log(`   Direct API: ${directResult}`);
    console.log(`   Supabase Client: ${clientResult}`);
  }

  const allPassed = Object.values(results.directAPI).every(r => r) && 
                   Object.values(results.supabaseClient).every(r => r);

  if (allPassed) {
    console.log(`\n🎉 ALL TESTS PASSED!`);
    console.log(`   The authentication fixes should resolve the "Failed to fetch" error.`);
    console.log(`   You can now test the frontend at: http://localhost:3000/test-edge-functions`);
    return true;
  } else {
    console.log(`\n🚨 Some tests failed. Please check Supabase service status.`);
    return false;
  }
}

async function main() {
  console.log('🔐 Authentication Fix Verification Script');
  console.log('========================================');
  console.log('This script tests the fixes for the "Failed to fetch" error');
  console.log('that was occurring at line 440 in the test page.\n');

  try {
    const success = await testBrowserCompatibility();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    process.exit(1);
  }
}

main();