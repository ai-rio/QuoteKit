#!/usr/bin/env node

/**
 * Survey Management Helper Script
 * 
 * Provides utilities for managing Formbricks surveys:
 * - List existing surveys
 * - Create new surveys
 * - Update survey status
 * - Delete surveys
 * 
 * Usage:
 *   node scripts/formbricks/manage-surveys.js list
 *   node scripts/formbricks/manage-surveys.js create-fb017 [--dry-run]
 *   node scripts/formbricks/manage-surveys.js publish <survey-id>
 *   node scripts/formbricks/manage-surveys.js delete <survey-id>
 */

require('dotenv').config();
const { makeFormbricksRequest, createSurvey } = require('./create-fb017-surveys');

const command = process.argv[2];
const args = process.argv.slice(3);
const isDryRun = args.includes('--dry-run');

console.log('🔧 FORMBRICKS SURVEY MANAGEMENT');
console.log('===============================');

/**
 * List all surveys in the environment
 */
async function listSurveys() {
  console.log('📋 Listing all surveys...\n');
  
  const result = await makeFormbricksRequest('/api/v1/management/surveys');
  
  if (!result.success) {
    console.error('❌ Failed to fetch surveys:', result.error);
    return;
  }
  
  const surveys = result.data.data || [];
  
  if (surveys.length === 0) {
    console.log('ℹ️  No surveys found in this environment.');
    return;
  }
  
  console.log(`Found ${surveys.length} surveys:\n`);
  
  surveys.forEach((survey, index) => {
    console.log(`${index + 1}. ${survey.name}`);
    console.log(`   ID: ${survey.id}`);
    console.log(`   Status: ${survey.status}`);
    console.log(`   Type: ${survey.type}`);
    console.log(`   Questions: ${survey.questions?.length || 0}`);
    console.log(`   Created: ${new Date(survey.createdAt).toLocaleDateString()}`);
    console.log('');
  });
}

/**
 * Create all FB-017 surveys
 */
async function createFB017Surveys() {
  console.log('🚀 Creating FB-017 surveys...\n');
  
  try {
    const surveyDefinitions = require('./fb017-survey-definitions');
    
    console.log(`📊 Creating ${surveyDefinitions.length} surveys`);
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No actual surveys will be created\n');
    }
    
    const results = [];
    
    for (const surveyDef of surveyDefinitions) {
      console.log(`\n📋 Creating: "${surveyDef.name}"`);
      
      if (isDryRun) {
        console.log('   🔍 DRY RUN - Survey definition:');
        console.log(`   - Questions: ${surveyDef.questions.length}`);
        console.log(`   - Type: ${surveyDef.type}`);
        console.log(`   - Triggers: ${surveyDef.triggers?.length || 0}`);
        results.push({ name: surveyDef.name, success: true, id: 'dry-run-id' });
      } else {
        const survey = await createSurvey(surveyDef);
        results.push({
          name: surveyDef.name,
          success: !!survey,
          id: survey?.id,
          error: survey ? null : 'Creation failed'
        });
      }
      
      // Add delay to avoid rate limiting
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
    
  } catch (error) {
    console.error('❌ Failed to create surveys:', error.message);
  }
}

/**
 * Publish a survey (change status to 'inProgress')
 */
async function publishSurvey(surveyId) {
  console.log(`📤 Publishing survey: ${surveyId}\n`);
  
  const result = await makeFormbricksRequest(
    `/api/v1/management/surveys/${surveyId}`,
    'PATCH',
    { status: 'inProgress' }
  );
  
  if (result.success) {
    console.log('✅ Survey published successfully');
  } else {
    console.error('❌ Failed to publish survey:', result.error);
  }
}

/**
 * Delete a survey
 */
async function deleteSurvey(surveyId) {
  console.log(`🗑️  Deleting survey: ${surveyId}\n`);
  
  const result = await makeFormbricksRequest(
    `/api/v1/management/surveys/${surveyId}`,
    'DELETE'
  );
  
  if (result.success) {
    console.log('✅ Survey deleted successfully');
  } else {
    console.error('❌ Failed to delete survey:', result.error);
  }
}

/**
 * Show usage information
 */
function showUsage() {
  console.log('Usage:');
  console.log('  node scripts/formbricks/manage-surveys.js <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  list                    List all surveys');
  console.log('  create-fb017 [--dry-run] Create all FB-017 surveys');
  console.log('  publish <survey-id>     Publish a survey');
  console.log('  delete <survey-id>      Delete a survey');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run              Show what would be done without making changes');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/formbricks/manage-surveys.js list');
  console.log('  node scripts/formbricks/manage-surveys.js create-fb017 --dry-run');
  console.log('  node scripts/formbricks/manage-surveys.js publish survey-123');
}

/**
 * Main execution
 */
async function main() {
  try {
    switch (command) {
      case 'list':
        await listSurveys();
        break;
        
      case 'create-fb017':
        await createFB017Surveys();
        break;
        
      case 'publish':
        if (!args[0] || args[0].startsWith('--')) {
          console.error('❌ Survey ID required for publish command');
          showUsage();
          process.exit(1);
        }
        await publishSurvey(args[0]);
        break;
        
      case 'delete':
        if (!args[0] || args[0].startsWith('--')) {
          console.error('❌ Survey ID required for delete command');
          showUsage();
          process.exit(1);
        }
        await deleteSurvey(args[0]);
        break;
        
      default:
        console.error('❌ Unknown command:', command);
        showUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command execution failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}
