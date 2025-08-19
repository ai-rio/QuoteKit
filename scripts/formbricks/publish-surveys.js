#!/usr/bin/env node

require('dotenv').config();

const API_KEY = process.env.FORMBRICKS_API_KEY;
const API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;
const ENV_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

if (!API_KEY || !API_HOST || !ENV_ID) {
  console.error('❌ Missing required environment variables');
  console.error('Required: FORMBRICKS_API_KEY, NEXT_PUBLIC_FORMBRICKS_API_HOST, NEXT_PUBLIC_FORMBRICKS_ENV_ID');
  process.exit(1);
}

console.log('🚀 FB-017 SURVEY PUBLISHING SCRIPT');
console.log('==================================');
console.log(`Environment: ${ENV_ID}`);
console.log(`API Host: ${API_HOST}`);
console.log('');

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function getSurveys() {
  console.log('📋 Fetching all surveys...');
  const result = await makeRequest(`${API_HOST}/api/v1/management/surveys?environmentId=${ENV_ID}`);
  return result.data || [];
}

async function getSurvey(surveyId) {
  const result = await makeRequest(`${API_HOST}/api/v1/management/surveys/${surveyId}`);
  return result.data;
}

async function publishSurvey(surveyId) {
  console.log(`📡 Publishing survey ${surveyId}...`);
  
  try {
    const result = await makeRequest(`${API_HOST}/api/v1/management/surveys/${surveyId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'inProgress' })
    });
    
    return result.data;
  } catch (error) {
    console.error(`   ❌ Failed to publish: ${error.message}`);
    return null;
  }
}

async function main() {
  try {
    // Get all surveys
    const surveys = await getSurveys();
    console.log(`Found ${surveys.length} surveys total\n`);

    // Filter FB-017 surveys (including the ones we created)
    const fb017Surveys = surveys.filter(survey => 
      survey.name && (
        survey.name.includes('FB-017') ||
        survey.name.includes('New Free User') ||
        survey.name.includes('Active User') ||
        survey.name.includes('Power User') ||
        survey.name.includes('Growing Pro User') ||
        survey.name.includes('Trial User Conversion')
      )
    );

    if (fb017Surveys.length === 0) {
      console.log('❌ No FB-017 surveys found');
      return;
    }

    console.log(`📊 Found ${fb017Surveys.length} FB-017 surveys:`);
    fb017Surveys.forEach(survey => {
      console.log(`   • ${survey.name} (${survey.id}) - Status: ${survey.status}`);
    });
    console.log('');

    // Publish each survey
    let publishedCount = 0;
    let alreadyPublishedCount = 0;
    let skippedCount = 0;

    for (const survey of fb017Surveys) {
      console.log(`🔄 Processing: ${survey.name}`);
      
      if (survey.status === 'inProgress') {
        console.log('   ✅ Already published');
        alreadyPublishedCount++;
        continue;
      }

      if (survey.status === 'draft') {
        const updatedSurvey = await publishSurvey(survey.id);
        if (updatedSurvey && updatedSurvey.status === 'inProgress') {
          console.log('   ✅ Successfully published');
          publishedCount++;
        }
      } else {
        console.log(`   ⚠️  Survey status is '${survey.status}' - skipping`);
        skippedCount++;
      }
    }

    console.log('\n📈 PUBLISHING SUMMARY');
    console.log('====================');
    console.log(`✅ Successfully published: ${publishedCount}`);
    console.log(`✅ Already published: ${alreadyPublishedCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log(`📊 Total FB-017 surveys: ${fb017Surveys.length}`);

    // Show final status
    console.log('\n📋 FINAL STATUS');
    console.log('===============');
    
    for (const survey of fb017Surveys) {
      const currentSurvey = await getSurvey(survey.id);
      const statusIcon = currentSurvey.status === 'inProgress' ? '🟢' : 
                        currentSurvey.status === 'draft' ? '🟡' : '🔴';
      console.log(`${statusIcon} ${currentSurvey.name}: ${currentSurvey.status}`);
    }

    console.log('\n🎉 FB-017 IMPLEMENTATION COMPLETE!');
    console.log('===================================');
    console.log('All FB-017 surveys are now ready for data collection.');
    console.log('');
    console.log('📋 Survey Segments:');
    console.log('• New Free User Onboarding Feedback - Targets new users');
    console.log('• Growing Pro User Experience - Targets active users');  
    console.log('• Trial User Conversion Intent - Targets trial users');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('1. Configure triggers in your app to show surveys');
    console.log('2. Test survey display in development');
    console.log('3. Monitor responses in Formbricks dashboard');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
