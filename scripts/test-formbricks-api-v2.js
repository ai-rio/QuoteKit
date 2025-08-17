#!/usr/bin/env node

/**
 * Test Formbricks API Connection - Alternative approaches
 */

require('dotenv').config();

const FORMBRICKS_API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY;
const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

console.log('🔍 Testing Formbricks API Connection - Alternative Methods...');
console.log(`📍 Environment: ${ENVIRONMENT_ID}`);
console.log(`🔗 API Host: ${FORMBRICKS_API_HOST}`);
console.log(`🔑 API Key: ${FORMBRICKS_API_KEY ? `${FORMBRICKS_API_KEY.substring(0, 8)}...` : 'NOT SET'}`);
console.log('');

async function testAPIConnection() {
  // Test different API endpoints and header formats
  
  // Test 1: Try with environment ID in URL
  try {
    console.log('🧪 Test 1: Environment-specific surveys endpoint...');
    const surveysUrl = `${FORMBRICKS_API_HOST}/api/v1/management/environments/${ENVIRONMENT_ID}/surveys`;
    
    const response = await fetch(surveysUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const surveys = await response.json();
      console.log(`   ✅ Success! Found ${surveys.length || 0} existing surveys`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Try with x-api-key header instead of Authorization
  try {
    console.log('🧪 Test 2: Using x-api-key header...');
    const surveysUrl = `${FORMBRICKS_API_HOST}/api/v1/management/surveys`;
    
    const response = await fetch(surveysUrl, {
      method: 'GET',
      headers: {
        'x-api-key': FORMBRICKS_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const surveys = await response.json();
      console.log(`   ✅ Success! Found ${surveys.length || 0} existing surveys`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 3: Try API v2
  try {
    console.log('🧪 Test 3: Trying API v2...');
    const surveysUrl = `${FORMBRICKS_API_HOST}/api/v2/management/surveys`;
    
    const response = await fetch(surveysUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const surveys = await response.json();
      console.log(`   ✅ Success! Found ${surveys.length || 0} existing surveys`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 4: Check if we can access public endpoints
  try {
    console.log('🧪 Test 4: Testing public client endpoint...');
    const clientUrl = `${FORMBRICKS_API_HOST}/api/v1/client/${ENVIRONMENT_ID}/displays`;
    
    const response = await fetch(clientUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        surveyId: 'test',
        userId: 'test'
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status !== 401) {
      console.log(`   ✅ Public endpoint accessible (expected different error)`);
    } else {
      console.log(`   ❌ Public endpoint also returns 401`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 5: Check API documentation endpoint
  try {
    console.log('🧪 Test 5: Checking API documentation...');
    const docsUrl = `${FORMBRICKS_API_HOST}/api`;
    
    const response = await fetch(docsUrl, {
      method: 'GET',
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`   ✅ API documentation accessible`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  return false;
}

async function main() {
  const success = await testAPIConnection();
  
  if (!success) {
    console.log('');
    console.log('🔍 Troubleshooting suggestions:');
    console.log('1. Verify the API key was copied correctly (no extra spaces)');
    console.log('2. Check if the API key has the right permissions in Formbricks dashboard');
    console.log('3. Ensure the environment ID matches your Formbricks project');
    console.log('4. Try regenerating the API key in Formbricks dashboard');
    console.log('5. Check if there are any IP restrictions on the API key');
    console.log('');
    console.log('💡 Alternative: Create surveys manually in Formbricks dashboard');
    console.log('   Dashboard URL: https://app.formbricks.com/environments/' + ENVIRONMENT_ID + '/surveys');
  }
}

main().catch(console.error);
