#!/usr/bin/env node

require('dotenv').config();

const API_KEY = process.env.FORMBRICKS_API_KEY;
const API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;
const ENV_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

if (!API_KEY || !API_HOST || !ENV_ID) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

console.log('📊 FORMBRICKS SURVEY STATUS REPORT');
console.log('===================================');
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
  const result = await makeRequest(`${API_HOST}/api/v1/management/surveys?environmentId=${ENV_ID}`);
  return result.data || [];
}

async function getSurveyDetails(surveyId) {
  const result = await makeRequest(`${API_HOST}/api/v1/management/surveys/${surveyId}`);
  return result.data;
}

function getStatusIcon(status) {
  switch (status) {
    case 'inProgress': return '🟢';
    case 'draft': return '🟡';
    case 'paused': return '🟠';
    case 'completed': return '🔵';
    default: return '⚪';
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

async function main() {
  try {
    console.log('📋 Fetching surveys...');
    const surveys = await getSurveys();
    
    if (surveys.length === 0) {
      console.log('❌ No surveys found');
      return;
    }

    console.log(`Found ${surveys.length} surveys\n`);

    // Group surveys
    const fb017Surveys = [];
    const otherSurveys = [];

    for (const survey of surveys) {
      if (survey.name && (
        survey.name.includes('FB-017') ||
        survey.name.includes('New Free User') ||
        survey.name.includes('Active User') ||
        survey.name.includes('Power User') ||
        survey.name.includes('Growing Pro User') ||
        survey.name.includes('Trial User Conversion')
      )) {
        fb017Surveys.push(survey);
      } else {
        otherSurveys.push(survey);
      }
    }

    // Show FB-017 surveys in detail
    if (fb017Surveys.length > 0) {
      console.log('🎯 FB-017 SURVEYS (Detailed)');
      console.log('============================');
      
      for (const survey of fb017Surveys) {
        const details = await getSurveyDetails(survey.id);
        const icon = getStatusIcon(details.status);
        
        console.log(`${icon} ${details.name}`);
        console.log(`   ID: ${details.id}`);
        console.log(`   Status: ${details.status}`);
        console.log(`   Type: ${details.type}`);
        console.log(`   Created: ${formatDate(details.createdAt)}`);
        console.log(`   Updated: ${formatDate(details.updatedAt)}`);
        console.log(`   Questions: ${details.questions.length}`);
        console.log(`   Display: ${details.displayOption}`);
        console.log(`   Recontact Days: ${details.recontactDays}`);
        
        if (details.triggers && details.triggers.length > 0) {
          console.log(`   Triggers: ${details.triggers.length}`);
        }
        
        if (details.segment) {
          console.log(`   Segment: ${details.segment.title} (${details.segment.filters.length} filters)`);
        }
        
        console.log('');
      }
    }

    // Show other surveys summary
    if (otherSurveys.length > 0) {
      console.log('📋 OTHER SURVEYS (Summary)');
      console.log('==========================');
      
      for (const survey of otherSurveys) {
        const icon = getStatusIcon(survey.status);
        console.log(`${icon} ${survey.name} (${survey.type}) - ${survey.status}`);
      }
      console.log('');
    }

    // Summary statistics
    const statusCounts = surveys.reduce((acc, survey) => {
      acc[survey.status] = (acc[survey.status] || 0) + 1;
      return acc;
    }, {});

    const typeCounts = surveys.reduce((acc, survey) => {
      acc[survey.type] = (acc[survey.type] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 SUMMARY STATISTICS');
    console.log('=====================');
    console.log(`Total Surveys: ${surveys.length}`);
    console.log(`FB-017 Surveys: ${fb017Surveys.length}`);
    console.log(`Other Surveys: ${otherSurveys.length}`);
    console.log('');
    
    console.log('By Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const icon = getStatusIcon(status);
      console.log(`  ${icon} ${status}: ${count}`);
    });
    console.log('');
    
    console.log('By Type:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  📝 ${type}: ${count}`);
    });

    // Show next steps if there are draft surveys
    const draftSurveys = surveys.filter(s => s.status === 'draft');
    if (draftSurveys.length > 0) {
      console.log('\n🚀 NEXT STEPS');
      console.log('=============');
      console.log(`You have ${draftSurveys.length} draft survey(s) that can be published:`);
      draftSurveys.forEach(survey => {
        console.log(`  • ${survey.name} (${survey.id})`);
      });
      console.log('\nRun: node scripts/formbricks/publish-surveys.js');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
