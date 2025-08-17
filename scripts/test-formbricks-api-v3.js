#!/usr/bin/env node

/**
 * Test Formbricks API Connection - Direct Management API Test
 */

require('dotenv').config();

const FORMBRICKS_API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY;
const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

console.log('🔍 Testing Formbricks Management API - Direct Approach...');
console.log(`📍 Environment: ${ENVIRONMENT_ID}`);
console.log(`🔗 API Host: ${FORMBRICKS_API_HOST}`);
console.log(`🔑 API Key: ${FORMBRICKS_API_KEY ? `${FORMBRICKS_API_KEY.substring(0, 8)}...` : 'NOT SET'}`);
console.log('');

async function testDirectAPI() {
  // Test the correct management API endpoint structure
  try {
    console.log('🧪 Test: Direct Management API - Get Surveys...');
    const surveysUrl = `${FORMBRICKS_API_HOST}/api/v1/management/surveys`;
    
    console.log(`   Making request to: ${surveysUrl}`);
    console.log(`   Headers: Authorization: Bearer ${FORMBRICKS_API_KEY.substring(0, 8)}...`);
    
    const response = await fetch(surveysUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    const responseText = await response.text();
    console.log(`   Response length: ${responseText.length} characters`);
    
    if (response.ok) {
      try {
        const surveys = JSON.parse(responseText);
        console.log(`   ✅ Success! Found ${surveys.length || 0} existing surveys`);
        
        if (surveys.length > 0) {
          console.log('   📋 Existing surveys:');
          surveys.slice(0, 3).forEach(survey => {
            console.log(`      - ${survey.name} (${survey.status}) - ID: ${survey.id}`);
          });
        }
        return true;
      } catch (parseError) {
        console.log(`   ✅ Success response but JSON parse failed: ${parseError.message}`);
        console.log(`   Raw response: ${responseText.substring(0, 200)}...`);
        return true;
      }
    } else {
      console.log(`   ❌ Failed: ${responseText.substring(0, 500)}`);
      
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(responseText);
        console.log(`   Error details: ${JSON.stringify(errorJson, null, 2)}`);
      } catch (e) {
        console.log(`   Raw error response: ${responseText.substring(0, 200)}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  console.log('');

  // Test creating a simple survey to verify API key permissions
  try {
    console.log('🧪 Test: Create Simple Survey...');
    const createUrl = `${FORMBRICKS_API_HOST}/api/v1/management/surveys`;
    
    const testSurvey = {
      environmentId: ENVIRONMENT_ID,
      name: "API Test Survey - " + new Date().toISOString(),
      type: "link",
      status: "draft",
      questions: [
        {
          id: "test_question",
          type: "openText",
          headline: "This is a test question",
          required: false
        }
      ]
    };
    
    console.log(`   Creating test survey: ${testSurvey.name}`);
    
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSurvey)
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log(`   ✅ Success! Created survey with ID: ${result.id}`);
        
        // Clean up - delete the test survey
        const deleteUrl = `${FORMBRICKS_API_HOST}/api/v1/management/surveys/${result.id}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (deleteResponse.ok) {
          console.log(`   🧹 Test survey deleted successfully`);
        } else {
          console.log(`   ⚠️  Test survey created but couldn't delete (ID: ${result.id})`);
        }
        
        return true;
      } catch (parseError) {
        console.log(`   ✅ Success response but JSON parse failed: ${parseError.message}`);
        return true;
      }
    } else {
      console.log(`   ❌ Failed to create survey: ${responseText.substring(0, 500)}`);
      
      try {
        const errorJson = JSON.parse(responseText);
        console.log(`   Error details: ${JSON.stringify(errorJson, null, 2)}`);
      } catch (e) {
        console.log(`   Raw error: ${responseText.substring(0, 200)}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  return false;
}

async function main() {
  const success = await testDirectAPI();
  
  console.log('');
  if (success) {
    console.log('🎉 API Connection Successful!');
    console.log('✅ Your API key is working correctly');
    console.log('✅ You can now create surveys programmatically');
    console.log('');
    console.log('🚀 Ready to run: node scripts/create-action-based-surveys.js');
  } else {
    console.log('❌ API Connection Failed');
    console.log('');
    console.log('🔍 Troubleshooting steps:');
    console.log('1. Verify API key is correct in Formbricks dashboard');
    console.log('2. Check API key permissions (needs management access)');
    console.log('3. Ensure environment ID matches your project');
    console.log('4. Try regenerating the API key');
    console.log('');
    console.log('💡 Alternative: Create surveys manually in dashboard');
    console.log(`   Dashboard: ${FORMBRICKS_API_HOST}/environments/${ENVIRONMENT_ID}/surveys`);
  }
}

main().catch(console.error);
