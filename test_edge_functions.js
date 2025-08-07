#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testEdgeFunctions() {
  console.log('Testing Edge Functions...\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Authenticate as admin user
  console.log('Authenticating as admin user...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'carlos@ai.rio.br',
    password: 'password123'
  });
  
  if (error) {
    console.error('Authentication failed:', error.message);
    return;
  }
  
  console.log('✅ Successfully authenticated as:', data.user.email);
  console.log('Access token:', data.session.access_token.substring(0, 20) + '...\n');
  
  // Test functions that were failing
  const functionsToTest = [
    'quote-processor',
    'webhook-monitor', 
    'batch-processor',
    'monitoring-alerting',
    'performance-optimizer',
    'connection-pool-manager',
    'migration-controller',
    'production-validator',
    'security-hardening',
    'global-deployment-optimizer'
  ];
  
  for (const functionName of functionsToTest) {
    console.log(`Testing ${functionName}...`);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'status' }
      });
      
      if (error) {
        console.error(`❌ ${functionName} failed:`, error.message);
      } else {
        console.log(`✅ ${functionName} responded successfully`);
      }
    } catch (err) {
      console.error(`❌ ${functionName} threw error:`, err.message);
    }
    console.log('---');
  }
}

testEdgeFunctions().catch(console.error);