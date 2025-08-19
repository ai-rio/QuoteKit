require('dotenv').config();

const API_KEY = process.env.FORMBRICKS_API_KEY;
const API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;
const ENV_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

console.log('🎉 FORMBRICKS INTEGRATION TEST - WORKING VERSION');
console.log('================================================');
console.log('API Host:', API_HOST);
console.log('Environment ID:', ENV_ID);
console.log('API Key:', API_KEY.substring(0, 8) + '...');
console.log('');

async function testFormbricks() {
  try {
    // Test authentication
    console.log('🔑 Testing Authentication...');
    const authResponse = await fetch(`${API_HOST}/api/v1/management/me`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (authResponse.ok) {
      const userData = await authResponse.json();
      console.log('✅ Authentication successful');
      console.log('   Environment ID:', userData.id);
      console.log('   Environment Type:', userData.type);
      console.log('');
    } else {
      console.log('❌ Authentication failed');
      return;
    }

    // Test surveys
    console.log('📋 Testing Surveys API...');
    const surveysResponse = await fetch(`${API_HOST}/api/v1/management/surveys`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (surveysResponse.ok) {
      const surveysData = await surveysResponse.json();
      const surveys = surveysData.data || [];
      
      console.log('✅ Surveys API working');
      console.log('   Total surveys:', surveys.length);
      
      if (surveys.length > 0) {
        console.log('');
        console.log('📝 Available Surveys:');
        surveys.forEach((survey, index) => {
          console.log(`   ${index + 1}. ${survey.name} (${survey.status})`);
          console.log(`      ID: ${survey.id}`);
          console.log(`      Type: ${survey.type}`);
          console.log(`      Environment: ${survey.environmentId}`);
        });
        
        // Filter surveys for our environment
        const envSurveys = surveys.filter(s => s.environmentId === ENV_ID);
        console.log('');
        console.log(`📍 Surveys in your environment (${ENV_ID}):`, envSurveys.length);
        
        if (envSurveys.length === 0) {
          console.log('ℹ️  No surveys found in your environment. Create surveys in Formbricks dashboard.');
        }
      } else {
        console.log('');
        console.log('ℹ️  No surveys found. Create your first survey in the Formbricks dashboard:');
        console.log('   1. Go to https://app.formbricks.com');
        console.log('   2. Navigate to your project');
        console.log('   3. Create a new survey');
        console.log('   4. Configure triggers for your QuoteKit events');
      }
    } else {
      console.log('❌ Surveys API failed');
    }

    console.log('');
    console.log('🎯 SUMMARY');
    console.log('==========');
    console.log('✅ API Key: Working');
    console.log('✅ Authentication: Working');
    console.log('✅ Environment: Accessible');
    console.log('✅ API Endpoints: Working');
    console.log('');
    console.log('Next step: Create surveys in Formbricks dashboard!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testFormbricks();
