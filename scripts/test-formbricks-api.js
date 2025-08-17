#!/usr/bin/env node

/**
 * Test Formbricks API Connection
 */

require('dotenv').config();

const FORMBRICKS_API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY;
const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

console.log('🔍 Testing Formbricks API Connection...');
console.log(`📍 Environment: ${ENVIRONMENT_ID}`);
console.log(`🔗 API Host: ${FORMBRICKS_API_HOST}`);
console.log(`🔑 API Key: ${FORMBRICKS_API_KEY ? `${FORMBRICKS_API_KEY.substring(0, 8)}...` : 'NOT SET'}`);
console.log('');

async function testAPIConnection() {
  // Test 1: Get surveys (should work with valid API key)
  try {
    console.log('🧪 Test 1: Getting existing surveys...');
    const surveysUrl = `${FORMBRICKS_API_HOST}/api/v1/management/surveys`;
    
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
      
      if (surveys.length > 0) {
        console.log('   📋 Existing surveys:');
        surveys.slice(0, 3).forEach(survey => {
          console.log(`      - ${survey.name} (${survey.status})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Get action classes
  try {
    console.log('🧪 Test 2: Getting action classes...');
    const actionsUrl = `${FORMBRICKS_API_HOST}/api/v1/management/action-classes`;
    
    const response = await fetch(actionsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const actions = await response.json();
      console.log(`   ✅ Success! Found ${actions.length || 0} action classes`);
      
      if (actions.length > 0) {
        console.log('   📋 Existing actions:');
        actions.forEach(action => {
          console.log(`      - ${action.name} (${action.type})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 3: Check environment info
  try {
    console.log('🧪 Test 3: Getting environment info...');
    const envUrl = `${FORMBRICKS_API_HOST}/api/v1/management/me`;
    
    const response = await fetch(envUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const me = await response.json();
      console.log(`   ✅ Success! Connected as: ${me.name || me.email || 'Unknown'}`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

testAPIConnection().catch(console.error);
