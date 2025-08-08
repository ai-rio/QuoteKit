#!/usr/bin/env node

/**
 * Frontend Authentication Fix Verification
 * Tests the Supabase client authentication in a Node.js environment
 * to verify our fixes work before testing in the browser
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const ADMIN_CREDENTIALS = {
  email: 'carlos@ai.rio.br',
  password: 'password123'
};

async function testAuthentication() {
  console.log('🔐 Testing Frontend Authentication Fix');
  console.log('=====================================');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 API Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log('');

  try {
    // Test 1: Direct API call (should work)
    console.log('🧪 Test 1: Direct API authentication');
    const directResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password
      })
    });

    if (directResponse.ok) {
      console.log('✅ Direct API authentication: SUCCESS');
      const directData = await directResponse.json();
      console.log(`   User: ${directData.user?.email}`);
    } else {
      console.log('❌ Direct API authentication: FAILED');
      console.log(`   Status: ${directResponse.status} ${directResponse.statusText}`);
      return false;
    }

    // Test 2: Supabase client authentication
    console.log('\n🧪 Test 2: Supabase client authentication');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
      console.log('❌ Supabase client authentication: FAILED');
      console.log(`   Error: ${error.message}`);
      return false;
    } else {
      console.log('✅ Supabase client authentication: SUCCESS');
      console.log(`   User: ${data.user?.email}`);
    }

    console.log('\n🎉 All authentication tests passed!');
    console.log('The frontend authentication fix should work in the browser.');
    return true;

  } catch (error) {
    console.log('❌ Authentication test failed with error:');
    console.log(`   ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

// Run the test
testAuthentication().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});