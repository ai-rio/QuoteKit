#!/usr/bin/env node

/**
 * Create Formbricks Surveys - FINAL WORKING VERSION
 * This script creates surveys with the correct API format
 */

require('dotenv').config();

const FORMBRICKS_API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY;
const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

console.log('🚀 Creating Formbricks Surveys - FINAL VERSION');
console.log(`📍 Environment: ${ENVIRONMENT_ID}`);
console.log(`🔗 API Host: ${FORMBRICKS_API_HOST}`);
console.log('');

/**
 * Get action classes and create surveys
 */
async function main() {
  try {
    // Step 1: Get action classes
    console.log('📋 Step 1: Getting action classes...');
    const actionResponse = await fetch(`${FORMBRICKS_API_HOST}/api/v1/management/action-classes`, {
      headers: { 'x-api-key': FORMBRICKS_API_KEY }
    });
    
    const actionData = await actionResponse.json();
    const actions = actionData.data;
    
    console.log(`   Found ${actions.length} action classes`);
    
    // Find our specific actions
    const postQuoteAction = actions.find(a => a.name === 'Post Quote Creation Survey');
    const quoteCreatedAction = actions.find(a => a.name === 'Quote Created');
    const workflowStartedAction = actions.find(a => a.name === 'Quote Workflow Started');
    const limitReachedAction = actions.find(a => a.name === 'Monthly Quote Limit Reached');
    
    // Fix date format for action classes
    const fixActionDates = (action) => ({
      ...action,
      createdAt: new Date(action.createdAt),
      updatedAt: new Date(action.updatedAt)
    });

    // Step 2: Create surveys
    console.log('📝 Step 2: Creating surveys...');
    
    const surveys = [
      {
        name: 'Post Quote Creation Feedback',
        actionClass: fixActionDates(postQuoteAction),
        questions: [
          {
            id: 'quote_creation_ease',
            type: 'rating',
            headline: { default: 'How easy was it to create this quote?' },
            subheader: { default: 'Your feedback helps us improve the quote creation experience' },
            required: true,
            scale: 'number',
            range: 5,
            lowerLabel: { default: 'Very Difficult' },
            upperLabel: { default: 'Very Easy' },
            isColorCodingEnabled: false
          },
          {
            id: 'creation_improvement',
            type: 'openText',
            headline: { default: 'What would make quote creation even better?' },
            subheader: { default: 'Optional - Share any suggestions for improvement' },
            required: false,
            placeholder: { default: 'Any ideas to make this process smoother...' },
            longAnswer: false,
            inputType: 'text',
            charLimit: { enabled: false }
          }
        ]
      },
      {
        name: 'Quote Creation Success',
        actionClass: fixActionDates(quoteCreatedAction),
        questions: [
          {
            id: 'creation_satisfaction',
            type: 'rating',
            headline: { default: 'How satisfied are you with this quote?' },
            subheader: { default: 'Quick feedback on your quote creation' },
            required: true,
            scale: 'smiley',
            range: 5,
            lowerLabel: { default: 'Not satisfied' },
            upperLabel: { default: 'Very satisfied' },
            isColorCodingEnabled: false
          }
        ]
      },
      {
        name: 'Quote Creation Assistance',
        actionClass: fixActionDates(workflowStartedAction),
        questions: [
          {
            id: 'need_help',
            type: 'multipleChoiceSingle',
            headline: { default: 'Would you like help creating your quote?' },
            subheader: { default: 'We can guide you through the process' },
            required: true,
            choices: [
              { id: 'yes_guide', label: { default: 'Yes, show me a quick guide' } },
              { id: 'yes_tips', label: { default: 'Yes, give me some tips' } },
              { id: 'no_experienced', label: { default: 'No, I\'m experienced with this' } },
              { id: 'no_explore', label: { default: 'No, I want to explore on my own' } }
            ],
            shuffleOption: 'none'
          }
        ]
      },
      {
        name: 'Upgrade Opportunity - Limit Reached',
        actionClass: fixActionDates(limitReachedAction),
        questions: [
          {
            id: 'limit_impact',
            type: 'multipleChoiceSingle',
            headline: { default: 'You\'ve reached your monthly quote limit. How is this affecting you?' },
            subheader: { default: 'Help us understand your needs' },
            required: true,
            choices: [
              { id: 'blocking_work', label: { default: 'It\'s blocking my work completely' } },
              { id: 'slowing_down', label: { default: 'It\'s slowing me down significantly' } },
              { id: 'minor_inconvenience', label: { default: 'It\'s a minor inconvenience' } },
              { id: 'good_reminder', label: { default: 'It\'s actually a good reminder to upgrade' } },
              { id: 'unexpected', label: { default: 'I didn\'t expect to hit the limit' } }
            ],
            shuffleOption: 'none'
          },
          {
            id: 'upgrade_interest',
            type: 'rating',
            headline: { default: 'How interested are you in upgrading to get unlimited quotes?' },
            subheader: { default: 'Plus advanced features like analytics and priority support' },
            required: true,
            scale: 'number',
            range: 5,
            lowerLabel: { default: 'Not interested' },
            upperLabel: { default: 'Very interested' },
            isColorCodingEnabled: false
          }
        ]
      }
    ];

    const results = [];
    
    for (const surveyConfig of surveys) {
      console.log(`🔄 Creating survey: ${surveyConfig.name}`);
      
      const surveyData = {
        environmentId: ENVIRONMENT_ID,
        name: surveyConfig.name,
        type: 'app',
        status: 'draft',
        displayOption: 'displayOnce',
        autoClose: 8,
        delay: 0,
        displayPercentage: 100,
        questions: surveyConfig.questions,
        triggers: [
          {
            actionClass: surveyConfig.actionClass
          }
        ],
        endings: [],
        hiddenFields: { enabled: false, fieldIds: [] },
        variables: []
      };

      try {
        const response = await fetch(`${FORMBRICKS_API_HOST}/api/v1/management/surveys`, {
          method: 'POST',
          headers: {
            'x-api-key': FORMBRICKS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(surveyData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`   ❌ Failed: ${errorText}`);
          results.push(null);
        } else {
          const result = await response.json();
          console.log(`   ✅ Success! Survey ID: ${result.id}`);
          console.log(`   🔗 Dashboard: ${FORMBRICKS_API_HOST}/environments/${ENVIRONMENT_ID}/surveys/${result.id}`);
          results.push(result);
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.push(null);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    const successCount = results.filter(r => r).length;
    console.log('');
    console.log('📊 Final Summary:');
    console.log(`✅ Surveys Created: ${successCount}/${surveys.length}`);
    
    if (successCount > 0) {
      console.log('');
      console.log('🎉 SUCCESS! Surveys created programmatically!');
      console.log('');
      console.log('📋 Created Surveys:');
      results.filter(r => r).forEach(survey => {
        console.log(`   • ${survey.name} (ID: ${survey.id})`);
      });
      console.log('');
      console.log('🔗 Dashboard URL:');
      console.log(`   ${FORMBRICKS_API_HOST}/environments/${ENVIRONMENT_ID}/surveys`);
      console.log('');
      console.log('📝 Next Steps:');
      console.log('   1. Review surveys in Formbricks dashboard');
      console.log('   2. Publish surveys when ready');
      console.log('   3. Test survey triggers in your app');
      console.log('   4. Monitor completion rates and user feedback');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Execute
main();
