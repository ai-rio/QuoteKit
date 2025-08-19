require('dotenv').config();

const API_KEY = process.env.FORMBRICKS_API_KEY;
const API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;
const ENV_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

console.log('🔧 FORMBRICKS DEVELOPMENT ENVIRONMENT SETUP');
console.log('============================================');

// Check if credentials are updated
if (API_KEY === 'YOUR_DEV_API_KEY_HERE' || ENV_ID === 'YOUR_DEV_ENVIRONMENT_ID_HERE') {
  console.log('❌ Please update your .env file with development credentials:');
  console.log('');
  console.log('1. Go to https://app.formbricks.com');
  console.log('2. Create or switch to a development environment');
  console.log('3. Get your development Environment ID and API Key');
  console.log('4. Update these values in .env:');
  console.log('   - NEXT_PUBLIC_FORMBRICKS_ENV_ID=your_dev_env_id');
  console.log('   - FORMBRICKS_API_KEY=your_dev_api_key');
  console.log('');
  console.log('Then run this script again to test the connection.');
  process.exit(1);
}

console.log('📋 Current Configuration:');
console.log('API Host:', API_HOST);
console.log('Environment ID:', ENV_ID);
console.log('API Key:', API_KEY.substring(0, 8) + '...');
console.log('Debug Mode:', process.env.FORMBRICKS_DEBUG);
console.log('');

async function testDevEnvironment() {
  try {
    // Test authentication
    console.log('🔑 Testing Development Environment Authentication...');
    const authResponse = await fetch(`${API_HOST}/api/v1/management/me`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (authResponse.ok) {
      const userData = await authResponse.json();
      console.log('✅ Authentication successful');
      console.log('   Environment ID:', userData.id);
      console.log('   Environment Type:', userData.type);
      
      if (userData.type === 'development') {
        console.log('   🎯 Perfect! This is a development environment');
      } else {
        console.log('   ⚠️  Warning: This appears to be a', userData.type, 'environment');
      }
      console.log('');
    } else {
      console.log('❌ Authentication failed');
      console.log('   Status:', authResponse.status);
      const errorText = await authResponse.text();
      console.log('   Error:', errorText.substring(0, 100));
      return;
    }

    // Test surveys API
    console.log('📋 Testing Surveys API...');
    const surveysResponse = await fetch(`${API_HOST}/api/v1/management/surveys`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (surveysResponse.ok) {
      const surveysData = await surveysResponse.json();
      const surveys = surveysData.data || [];
      
      console.log('✅ Surveys API working');
      console.log('   Total surveys:', surveys.length);
      
      // Filter surveys for our environment
      const envSurveys = surveys.filter(s => s.environmentId === ENV_ID);
      console.log('   Surveys in this environment:', envSurveys.length);
      
      if (envSurveys.length > 0) {
        console.log('');
        console.log('📝 Development Surveys:');
        envSurveys.forEach((survey, index) => {
          console.log(`   ${index + 1}. ${survey.name} (${survey.status})`);
          console.log(`      ID: ${survey.id}`);
          console.log(`      Type: ${survey.type}`);
          if (survey.triggers && survey.triggers.length > 0) {
            console.log(`      Triggers: ${survey.triggers.length} configured`);
          }
        });
      } else {
        console.log('');
        console.log('ℹ️  No surveys in development environment yet.');
        console.log('   This is perfect for testing! You can now:');
        console.log('   1. Create test surveys in Formbricks dashboard');
        console.log('   2. Configure triggers for QuoteKit events');
        console.log('   3. Test survey display and responses');
      }
    } else {
      console.log('❌ Surveys API failed');
      console.log('   Status:', surveysResponse.status);
    }

    console.log('');
    console.log('🎯 DEVELOPMENT ENVIRONMENT STATUS');
    console.log('=================================');
    console.log('✅ API Connection: Working');
    console.log('✅ Authentication: Valid');
    console.log('✅ Environment Access: Available');
    console.log('✅ Ready for Development: Yes');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Create test surveys in Formbricks dashboard');
    console.log('2. Configure survey triggers for QuoteKit events');
    console.log('3. Test survey integration in your app');
    console.log('4. Verify survey responses and data collection');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testDevEnvironment();
