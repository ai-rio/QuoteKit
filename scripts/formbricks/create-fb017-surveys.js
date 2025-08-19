#!/usr/bin/env node

/**
 * FB-017 Survey Creation Script
 * 
 * This script programmatically creates all surveys defined in the FB-017 specification
 * using the Formbricks Management API.
 * 
 * Usage:
 *   node scripts/formbricks/create-fb017-surveys.js [--dry-run] [--environment=dev|prod]
 */

require('dotenv').config();

const API_KEY = process.env.FORMBRICKS_API_KEY;
const API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const ENV_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const environment = args.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'dev';

console.log('🚀 FB-017 SURVEY CREATION SCRIPT');
console.log('================================');
console.log('Environment:', environment);
console.log('API Host:', API_HOST);
console.log('Environment ID:', ENV_ID);
console.log('Dry Run:', isDryRun ? 'YES' : 'NO');
console.log('');

// Validation
if (!API_KEY || !ENV_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   - FORMBRICKS_API_KEY');
  console.error('   - NEXT_PUBLIC_FORMBRICKS_ENV_ID');
  console.error('');
  console.error('Please update your .env file with the correct credentials.');
  process.exit(1);
}

/**
 * Makes authenticated API request to Formbricks
 */
async function makeFormbricksRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_HOST}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  console.log(`📡 ${method} ${endpoint}`);
  
  if (isDryRun && method !== 'GET') {
    console.log('   🔍 DRY RUN - Request would be:', JSON.stringify(data, null, 2));
    return { success: true, data: { id: 'dry-run-id' } };
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`   ✅ Success`);
    return { success: true, data: result };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a survey in Formbricks
 */
async function createSurvey(surveyConfig) {
  console.log(`\n📋 Creating Survey: "${surveyConfig.name}"`);
  console.log(`   Type: ${surveyConfig.type}`);
  console.log(`   Questions: ${surveyConfig.questions.length}`);
  
  const result = await makeFormbricksRequest('/api/v1/management/surveys', 'POST', surveyConfig);
  
  if (result.success) {
    console.log(`   ✅ Survey created with ID: ${result.data.id}`);
    return result.data;
  } else {
    console.error(`   ❌ Failed to create survey: ${result.error}`);
    return null;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Test API connection first
    console.log('🔑 Testing API connection...');
    const authTest = await makeFormbricksRequest('/api/v1/management/me');
    
    if (!authTest.success) {
      console.error('❌ API authentication failed');
      process.exit(1);
    }
    
    console.log('✅ API connection successful');
    console.log(`   Environment: ${authTest.data.type}`);
    console.log('');
    
    // Load survey definitions
    const surveyDefinitions = require('./fb017-survey-definitions');
    
    console.log(`📊 Found ${surveyDefinitions.length} survey definitions to create`);
    console.log('');
    
    const results = [];
    
    // Create each survey
    for (const surveyDef of surveyDefinitions) {
      const survey = await createSurvey(surveyDef);
      results.push({
        name: surveyDef.name,
        success: !!survey,
        id: survey?.id,
        error: survey ? null : 'Creation failed'
      });
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n🎯 CREATION SUMMARY');
    console.log('==================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successfully created: ${successful.length} surveys`);
    console.log(`❌ Failed to create: ${failed.length} surveys`);
    
    if (successful.length > 0) {
      console.log('\n✅ Created Surveys:');
      successful.forEach(s => {
        console.log(`   - ${s.name} (ID: ${s.id})`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Surveys:');
      failed.forEach(s => {
        console.log(`   - ${s.name}: ${s.error}`);
      });
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Review created surveys in Formbricks dashboard');
    console.log('2. Configure survey triggers and targeting');
    console.log('3. Test survey display in QuoteKit application');
    console.log('4. Monitor survey completion rates and responses');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { createSurvey, makeFormbricksRequest };
