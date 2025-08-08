#!/usr/bin/env node

/**
 * Debug Edge Functions Connectivity
 * Helps identify common issues with Edge Functions testing
 */

const https = require('https');
const http = require('http');

console.log('🔍 Edge Functions Debug Tool');
console.log('============================\n');

// Test configurations
const tests = [
  {
    name: 'Supabase Local Server',
    url: 'http://localhost:54321',
    path: '/rest/v1/',
    method: 'GET'
  },
  {
    name: 'Edge Functions Server',
    url: 'http://localhost:54321',
    path: '/functions/v1/',
    method: 'GET'
  },
  {
    name: 'Subscription Status Function',
    url: 'http://localhost:54321',
    path: '/functions/v1/subscription-status',
    method: 'POST',
    body: JSON.stringify({ action: 'health-check' }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    }
  }
];

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = new URL(test.path, test.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: test.method,
      headers: test.headers || {},
      timeout: 5000
    };

    if (test.body) {
      options.headers['Content-Length'] = Buffer.byteLength(test.body);
    }

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          responseTime,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        error: err.message,
        responseTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        responseTime: 5000
      });
    });

    if (test.body) {
      req.write(test.body);
    }
    
    req.end();
  });
}

async function runDiagnostics() {
  console.log('Running connectivity tests...\n');
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    console.log(`URL: ${test.url}${test.path}`);
    
    const result = await testEndpoint(test);
    
    if (result.success) {
      console.log(`✅ SUCCESS - Status: ${result.status}, Time: ${result.responseTime}ms`);
      if (result.data) {
        console.log(`Response: ${result.data}`);
      }
    } else {
      console.log(`❌ FAILED - Error: ${result.error}, Time: ${result.responseTime}ms`);
    }
    
    console.log('---\n');
  }
  
  // Additional diagnostics
  console.log('🔧 Additional Diagnostics:');
  console.log('==========================');
  
  // Check if Supabase is running
  console.log('1. Checking if Supabase is running...');
  try {
    const { exec } = require('child_process');
    exec('docker ps | grep supabase', (error, stdout, stderr) => {
      if (stdout) {
        console.log('✅ Supabase Docker containers are running');
        console.log(stdout);
      } else {
        console.log('❌ Supabase Docker containers not found');
        console.log('💡 Try running: supabase start');
      }
    });
  } catch (err) {
    console.log('❌ Could not check Docker containers');
  }
  
  // Check environment variables
  console.log('\n2. Environment Variables:');
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}`);
  
  // Common solutions
  console.log('\n💡 Common Solutions:');
  console.log('===================');
  console.log('1. Ensure Supabase is running: supabase start');
  console.log('2. Check if functions are deployed: supabase functions list');
  console.log('3. Verify .env.local has correct values');
  console.log('4. Try restarting: supabase stop && supabase start');
  console.log('5. Check browser console for CORS errors');
  console.log('6. Verify admin user exists: check Supabase Studio');
}

runDiagnostics().catch(console.error);
