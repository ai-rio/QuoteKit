#!/usr/bin/env node

/**
 * Create Working Surveys for Formbricks Actions
 * Using the correct API format based on existing survey structure
 */

require('dotenv').config();

const FORMBRICKS_API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY;
const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

// Existing action class IDs from your dashboard
const ACTION_CLASSES = {
  POST_QUOTE_CREATION: "cmefmg1i4ghalrj01uokspil9",
  QUOTE_CREATED: "cmefmhj8sgf5uuk01otkej8a3", 
  QUOTE_WORKFLOW_STARTED: "cmefnawkcgkw0uk01t8m35gzo",
  MONTHLY_LIMIT_REACHED: "cmefnmk0pgmuruk01c7v8w7lb"
};

/**
 * Survey 1: Post Quote Creation Feedback
 */
const POST_QUOTE_CREATION_SURVEY = {
  environmentId: ENVIRONMENT_ID,
  name: "Post Quote Creation Feedback",
  type: "app",
  status: "draft",
  displayOption: "displayOnce",
  autoClose: 8,
  delay: 0,
  displayPercentage: 100,
  questions: [
    {
      id: "quote_creation_ease",
      type: "rating",
      headline: {
        default: "How easy was it to create this quote?"
      },
      subheader: {
        default: "Your feedback helps us improve the quote creation experience"
      },
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: {
        default: "Very Difficult"
      },
      upperLabel: {
        default: "Very Easy"
      },
      isColorCodingEnabled: false
    },
    {
      id: "creation_improvement",
      type: "openText",
      headline: {
        default: "What would make quote creation even better?"
      },
      subheader: {
        default: "Optional - Share any suggestions for improvement"
      },
      required: false,
      placeholder: {
        default: "Any ideas to make this process smoother..."
      },
      longAnswer: false,
      inputType: "text",
      charLimit: {
        enabled: false
      }
    }
  ],
  triggers: [
    {
      actionClassId: ACTION_CLASSES.POST_QUOTE_CREATION
    }
  ],
  endings: [],
  hiddenFields: {
    enabled: false,
    fieldIds: []
  },
  variables: []
};

/**
 * Survey 2: Quote Creation Success
 */
const QUOTE_CREATED_SURVEY = {
  environmentId: ENVIRONMENT_ID,
  name: "Quote Creation Success",
  type: "app",
  status: "draft",
  displayOption: "displayMultiple",
  recontactDays: 7,
  displayLimit: 3,
  autoClose: 5,
  delay: 2,
  displayPercentage: 30,
  questions: [
    {
      id: "creation_satisfaction",
      type: "rating",
      headline: {
        default: "How satisfied are you with this quote?"
      },
      subheader: {
        default: "Quick feedback on your quote creation"
      },
      required: true,
      scale: "smiley",
      range: 5,
      lowerLabel: {
        default: "Not satisfied"
      },
      upperLabel: {
        default: "Very satisfied"
      },
      isColorCodingEnabled: false
    }
  ],
  triggers: [
    {
      actionClassId: ACTION_CLASSES.QUOTE_CREATED
    }
  ],
  endings: [],
  hiddenFields: {
    enabled: false,
    fieldIds: []
  },
  variables: []
};

/**
 * Survey 3: Quote Workflow Started
 */
const QUOTE_WORKFLOW_STARTED_SURVEY = {
  environmentId: ENVIRONMENT_ID,
  name: "Quote Creation Assistance",
  type: "app",
  status: "draft",
  displayOption: "displayOnce",
  autoClose: 15,
  delay: 10,
  displayPercentage: 50,
  questions: [
    {
      id: "need_help",
      type: "multipleChoiceSingle",
      headline: {
        default: "Would you like help creating your quote?"
      },
      subheader: {
        default: "We can guide you through the process"
      },
      required: true,
      choices: [
        {
          id: "yes_guide",
          label: {
            default: "Yes, show me a quick guide"
          }
        },
        {
          id: "yes_tips",
          label: {
            default: "Yes, give me some tips"
          }
        },
        {
          id: "no_experienced",
          label: {
            default: "No, I'm experienced with this"
          }
        },
        {
          id: "no_explore",
          label: {
            default: "No, I want to explore on my own"
          }
        }
      ],
      shuffleOption: "none"
    },
    {
      id: "biggest_concern",
      type: "multipleChoiceSingle",
      headline: {
        default: "What's your biggest concern about creating quotes?"
      },
      subheader: {
        default: "Help us understand how to better support you"
      },
      required: false,
      choices: [
        {
          id: "pricing_accuracy",
          label: {
            default: "Getting pricing right"
          }
        },
        {
          id: "finding_items",
          label: {
            default: "Finding the right items"
          }
        },
        {
          id: "professional_look",
          label: {
            default: "Making it look professional"
          }
        },
        {
          id: "time_consuming",
          label: {
            default: "It takes too much time"
          }
        },
        {
          id: "client_expectations",
          label: {
            default: "Meeting client expectations"
          }
        }
      ],
      shuffleOption: "none"
    }
  ],
  triggers: [
    {
      actionClassId: ACTION_CLASSES.QUOTE_WORKFLOW_STARTED
    }
  ],
  endings: [],
  hiddenFields: {
    enabled: false,
    fieldIds: []
  },
  variables: []
};

/**
 * Survey 4: Monthly Limit Reached
 */
const MONTHLY_LIMIT_REACHED_SURVEY = {
  environmentId: ENVIRONMENT_ID,
  name: "Upgrade Opportunity - Limit Reached",
  type: "app",
  status: "draft",
  displayOption: "displayOnce",
  autoClose: 20,
  delay: 1,
  displayPercentage: 100,
  questions: [
    {
      id: "limit_impact",
      type: "multipleChoiceSingle",
      headline: {
        default: "You've reached your monthly quote limit. How is this affecting you?"
      },
      subheader: {
        default: "Help us understand your needs"
      },
      required: true,
      choices: [
        {
          id: "blocking_work",
          label: {
            default: "It's blocking my work completely"
          }
        },
        {
          id: "slowing_down",
          label: {
            default: "It's slowing me down significantly"
          }
        },
        {
          id: "minor_inconvenience",
          label: {
            default: "It's a minor inconvenience"
          }
        },
        {
          id: "good_reminder",
          label: {
            default: "It's actually a good reminder to upgrade"
          }
        },
        {
          id: "unexpected",
          label: {
            default: "I didn't expect to hit the limit"
          }
        }
      ],
      shuffleOption: "none"
    },
    {
      id: "upgrade_interest",
      type: "rating",
      headline: {
        default: "How interested are you in upgrading to get unlimited quotes?"
      },
      subheader: {
        default: "Plus advanced features like analytics and priority support"
      },
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: {
        default: "Not interested"
      },
      upperLabel: {
        default: "Very interested"
      },
      isColorCodingEnabled: false
    }
  ],
  triggers: [
    {
      actionClassId: ACTION_CLASSES.MONTHLY_LIMIT_REACHED
    }
  ],
  endings: [],
  hiddenFields: {
    enabled: false,
    fieldIds: []
  },
  variables: []
};

/**
 * Create survey function
 */
async function createSurvey(surveyData) {
  const url = `${FORMBRICKS_API_HOST}/api/v1/management/surveys`;
  
  try {
    console.log(`🔄 Creating survey: ${surveyData.name}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': FORMBRICKS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(surveyData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Created survey: ${surveyData.name}`);
    console.log(`   📋 Survey ID: ${result.id}`);
    console.log(`   🔗 Dashboard: ${FORMBRICKS_API_HOST}/environments/${ENVIRONMENT_ID}/surveys/${result.id}`);
    console.log('');
    return result;
  } catch (error) {
    console.error(`❌ Failed to create survey ${surveyData.name}:`, error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Creating Formbricks Surveys Programmatically');
  console.log(`📍 Environment: ${ENVIRONMENT_ID}`);
  console.log(`🔗 API Host: ${FORMBRICKS_API_HOST}`);
  console.log('');

  const surveys = [
    POST_QUOTE_CREATION_SURVEY,
    QUOTE_CREATED_SURVEY,
    QUOTE_WORKFLOW_STARTED_SURVEY,
    MONTHLY_LIMIT_REACHED_SURVEY
  ];

  const results = [];
  
  for (const survey of surveys) {
    const result = await createSurvey(survey);
    results.push(result);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const successCount = results.filter(r => r).length;
  
  console.log('📊 Creation Summary:');
  console.log(`✅ Surveys Created: ${successCount}/${surveys.length}`);
  
  if (successCount > 0) {
    console.log('');
    console.log('🎉 Surveys created successfully!');
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
    console.log('   4. Monitor completion rates');
  }
}

// Execute
main().catch(console.error);
