#!/usr/bin/env node

/**
 * Complete Formbricks setup test script
 * This script will test the SDK initialization and help complete the widget setup
 */

console.log('🧪 Testing Complete Formbricks Setup...\n');

// Load environment variables
require('dotenv').config({ path: '.env' });

const environmentId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;
const apiKey = process.env.FORMBRICKS_API_KEY;

console.log('📋 Configuration Check:');
console.log('Environment ID:', environmentId || '❌ NOT SET');
console.log('API Host:', apiHost || '❌ NOT SET');
console.log('API Key:', apiKey ? '✅ SET' : '❌ NOT SET');

if (!environmentId || !apiHost || !apiKey) {
  console.log('\n❌ CRITICAL: Missing required configuration');
  process.exit(1);
}

const https = require('https');
const url = require('url');

// Test 1: Check environment status
async function checkEnvironmentStatus() {
  console.log('\n🔍 Test 1: Checking Environment Status...');
  
  return new Promise((resolve) => {
    const testUrl = `${apiHost}/api/v1/me`;
    const parsedUrl = url.parse(testUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const envData = JSON.parse(data);
            console.log('✅ Environment Status Check Passed');
            console.log('📊 Environment Details:');
            console.log('  - ID:', envData.id);
            console.log('  - Type:', envData.type);
            console.log('  - Project:', envData.project?.name);
            console.log('  - Widget Setup Completed:', envData.widgetSetupCompleted ? '✅ YES' : '❌ NO');
            console.log('  - Created:', envData.createdAt);
            resolve({ success: true, data: envData });
          } catch (e) {
            console.log('❌ Failed to parse environment data:', e.message);
            resolve({ success: false });
          }
        } else {
          console.log(`❌ Environment check failed: ${res.statusCode}`);
          resolve({ success: false });
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Environment check error:', err.message);
      resolve({ success: false });
    });

    req.end();
  });
}

// Test 2: Check surveys
async function checkSurveys() {
  console.log('\n📋 Test 2: Checking Surveys...');
  
  return new Promise((resolve) => {
    const testUrl = `${apiHost}/api/v1/management/surveys`;
    const parsedUrl = url.parse(testUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const surveyData = JSON.parse(data);
            console.log('✅ Survey Check Passed');
            console.log(`📊 Found ${surveyData.data.length} surveys`);
            
            surveyData.data.forEach((survey, index) => {
              console.log(`  Survey ${index + 1}:`);
              console.log(`    - Name: ${survey.name}`);
              console.log(`    - Type: ${survey.type}`);
              console.log(`    - Status: ${survey.status}`);
              console.log(`    - Triggers: ${survey.triggers.length}`);
              
              if (survey.status !== 'published') {
                console.log(`    ⚠️ WARNING: Survey is not published (status: ${survey.status})`);
              }
              
              if (survey.triggers.length === 0 && survey.type !== 'link') {
                console.log(`    ⚠️ WARNING: Survey has no triggers configured`);
              }
            });
            
            resolve({ success: true, data: surveyData });
          } catch (e) {
            console.log('❌ Failed to parse survey data:', e.message);
            resolve({ success: false });
          }
        } else {
          console.log(`❌ Survey check failed: ${res.statusCode}`);
          resolve({ success: false });
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Survey check error:', err.message);
      resolve({ success: false });
    });

    req.end();
  });
}

// Test 3: Simulate SDK connection test
async function simulateSDKConnection() {
  console.log('\n🔌 Test 3: Simulating SDK Connection...');
  
  // Test the endpoint that the SDK would use
  return new Promise((resolve) => {
    const testUrl = `${apiHost}/api/v1/environments/${environmentId}`;
    const parsedUrl = url.parse(testUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Formbricks-SDK/4.1.0',
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 SDK Endpoint Response: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ SDK endpoint accessible');
          console.log('✅ This suggests the SDK should be able to connect');
          resolve({ success: true });
        } else if (res.statusCode === 404) {
          console.log('❌ SDK endpoint not found (404)');
          console.log('❌ This explains why SDK initialization is failing');
          resolve({ success: false });
        } else {
          console.log(`⚠️ SDK endpoint returned ${res.statusCode}`);
          console.log('⚠️ This might cause SDK initialization issues');
          resolve({ success: false });
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ SDK connection test error:', err.message);
      resolve({ success: false });
    });

    req.end();
  });
}

// Run all tests
async function runAllTests() {
  const envResult = await checkEnvironmentStatus();
  const surveyResult = await checkSurveys();
  const sdkResult = await simulateSDKConnection();
  
  console.log('\n🏁 Test Summary:');
  console.log('===============================================');
  console.log(`Environment Status: ${envResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Survey Configuration: ${surveyResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SDK Connection: ${sdkResult.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (envResult.success && surveyResult.success && sdkResult.success) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('The Formbricks configuration appears to be correct.');
    console.log('If the SDK is still failing, it might be a client-side issue.');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('Please review the issues above before proceeding.');
  }
  
  // Provide specific recommendations
  console.log('\n💡 Recommendations:');
  
  if (envResult.data && !envResult.data.widgetSetupCompleted) {
    console.log('1. ⚠️ Widget setup is not completed');
    console.log('   - The SDK needs to successfully initialize and send at least one event');
    console.log('   - Try running your Next.js app and check the browser console for errors');
  }
  
  if (surveyResult.data) {
    const unpublishedSurveys = surveyResult.data.data.filter(s => s.status !== 'published');
    if (unpublishedSurveys.length > 0) {
      console.log('2. ⚠️ You have unpublished surveys');
      console.log('   - Go to your Formbricks dashboard');
      console.log('   - Publish your surveys to make them active');
      console.log('   - Consider creating app surveys with triggers for automatic display');
    }
  }
  
  if (!sdkResult.success) {
    console.log('3. ❌ SDK endpoint issues detected');
    console.log('   - The environment ID might not be accessible via the public API');
    console.log('   - Check your Formbricks account settings');
    console.log('   - Verify the environment ID is correct and active');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Start your Next.js development server: npm run dev');
  console.log('2. Open browser developer tools and check console for Formbricks logs');
  console.log('3. Look for detailed debug information with the enhanced error handling');
  console.log('4. If needed, create an app survey with triggers in your Formbricks dashboard');
}

// Execute the tests
runAllTests().catch(console.error);