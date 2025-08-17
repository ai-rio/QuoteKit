#!/usr/bin/env node

/**
 * Create Surveys for Existing Formbricks Actions
 * 
 * This script creates surveys that correspond to the actions already
 * configured in your Formbricks dashboard:
 * 1. Post Quote Creation Survey (5s delay)
 * 2. Quote Created (immediate feedback)
 * 3. Quote Workflow Started (onboarding help)
 * 4. Monthly Quote Limit Reached (upgrade opportunity)
 */

require('dotenv').config();

const FORMBRICKS_API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY;
const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

if (!FORMBRICKS_API_KEY || !ENVIRONMENT_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   FORMBRICKS_API_KEY');
  console.error('   NEXT_PUBLIC_FORMBRICKS_ENV_ID');
  process.exit(1);
}

console.log('🎯 Creating surveys for existing Formbricks actions...');
console.log(`📍 Environment: ${ENVIRONMENT_ID}`);
console.log(`🔗 API Host: ${FORMBRICKS_API_HOST}`);
console.log('');

/**
 * Survey 1: Post Quote Creation Survey
 * Triggered 5 seconds after quote creation for user feedback
 */
const POST_QUOTE_CREATION_SURVEY = {
  name: "Post Quote Creation Feedback",
  type: "app",
  status: "inProgress", // Start as draft
  displayOption: "displayOnce",
  recontactDays: null,
  displayLimit: 1,
  autoClose: 8,
  delay: 0, // Action already has 5s delay
  displayPercentage: 100,
  placement: "center",
  clickOutsideClose: true,
  darkOverlay: true,
  questions: [
    {
      id: "quote_creation_ease",
      type: "rating",
      headline: "How easy was it to create this quote?",
      subheader: "Your feedback helps us improve the quote creation experience",
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: "Very Difficult",
      upperLabel: "Very Easy"
    },
    {
      id: "creation_improvement",
      type: "openText",
      headline: "What would make quote creation even better?",
      subheader: "Optional - Share any suggestions for improvement",
      required: false,
      placeholder: "Any ideas to make this process smoother...",
      longAnswer: false
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thank you for your feedback! 🎉",
    subheader: "Your insights help us make QuoteKit better for everyone. We're constantly improving based on user feedback like yours."
  },
  triggers: [
    {
      actionClass: {
        name: "Post Quote Creation Survey",
        description: "Triggered 5 seconds after quote creation for user feedback",
        type: "code"
      }
    }
  ]
};

/**
 * Survey 2: Quote Created - Immediate Success Feedback
 * Quick satisfaction check right after quote save
 */
const QUOTE_CREATED_SURVEY = {
  name: "Quote Creation Success",
  type: "app", 
  status: "inProgress",
  displayOption: "displayMultiple",
  recontactDays: 7, // Can show again after a week
  displayLimit: 3, // Max 3 times per user
  autoClose: 5,
  delay: 2, // 2 second delay after save
  displayPercentage: 30, // Show to 30% of users to avoid overwhelming
  placement: "bottomRight",
  clickOutsideClose: true,
  darkOverlay: false,
  questions: [
    {
      id: "creation_satisfaction",
      type: "rating",
      headline: "How satisfied are you with this quote?",
      subheader: "Quick feedback on your quote creation",
      required: true,
      scale: "smiley",
      range: 5,
      lowerLabel: "Not satisfied",
      upperLabel: "Very satisfied"
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thanks! 👍",
    subheader: "Your feedback helps us improve QuoteKit."
  },
  triggers: [
    {
      actionClass: {
        name: "Quote Created",
        description: "Fired when a new quote is successfully saved to database",
        type: "code"
      }
    }
  ]
};

/**
 * Survey 3: Quote Workflow Started - Onboarding Help
 * Offer assistance when users start creating quotes
 */
const QUOTE_WORKFLOW_STARTED_SURVEY = {
  name: "Quote Creation Assistance",
  type: "app",
  status: "inProgress", 
  displayOption: "displayOnce",
  recontactDays: null,
  displayLimit: 1,
  autoClose: 15,
  delay: 10, // 10 seconds after starting workflow
  displayPercentage: 50, // Show to 50% of users
  placement: "center",
  clickOutsideClose: true,
  darkOverlay: true,
  questions: [
    {
      id: "need_help",
      type: "multipleChoiceSingle",
      headline: "Would you like help creating your quote?",
      subheader: "We can guide you through the process",
      required: true,
      choices: [
        { id: "yes_guide", label: "Yes, show me a quick guide" },
        { id: "yes_tips", label: "Yes, give me some tips" },
        { id: "no_experienced", label: "No, I'm experienced with this" },
        { id: "no_explore", label: "No, I want to explore on my own" }
      ]
    },
    {
      id: "biggest_concern",
      type: "multipleChoiceSingle",
      headline: "What's your biggest concern about creating quotes?",
      subheader: "Help us understand how to better support you",
      required: false,
      logic: [
        {
          condition: {
            questionId: "need_help",
            operator: "equals",
            value: "yes_guide"
          }
        },
        {
          condition: {
            questionId: "need_help", 
            operator: "equals",
            value: "yes_tips"
          }
        }
      ],
      choices: [
        { id: "pricing_accuracy", label: "Getting pricing right" },
        { id: "finding_items", label: "Finding the right items" },
        { id: "professional_look", label: "Making it look professional" },
        { id: "time_consuming", label: "It takes too much time" },
        { id: "client_expectations", label: "Meeting client expectations" }
      ]
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "We're here to help! 🚀",
    subheader: "Check out our help section for guides and tips. You've got this!"
  },
  triggers: [
    {
      actionClass: {
        name: "Quote Workflow Started",
        description: "User begins the quote creation process",
        type: "code"
      }
    }
  ]
};

/**
 * Survey 4: Monthly Quote Limit Reached - Upgrade Opportunity
 * Strategic conversion survey when users hit limits
 */
const MONTHLY_LIMIT_REACHED_SURVEY = {
  name: "Upgrade Opportunity - Limit Reached",
  type: "app",
  status: "inProgress",
  displayOption: "displayOnce",
  recontactDays: null,
  displayLimit: 1,
  autoClose: 20,
  delay: 1,
  displayPercentage: 100,
  placement: "center", 
  clickOutsideClose: false, // Important conversion moment
  darkOverlay: true,
  questions: [
    {
      id: "limit_impact",
      type: "multipleChoiceSingle",
      headline: "You've reached your monthly quote limit. How is this affecting you?",
      subheader: "Help us understand your needs",
      required: true,
      choices: [
        { id: "blocking_work", label: "It's blocking my work completely" },
        { id: "slowing_down", label: "It's slowing me down significantly" },
        { id: "minor_inconvenience", label: "It's a minor inconvenience" },
        { id: "good_reminder", label: "It's actually a good reminder to upgrade" },
        { id: "unexpected", label: "I didn't expect to hit the limit" }
      ]
    },
    {
      id: "upgrade_interest",
      type: "rating",
      headline: "How interested are you in upgrading to get unlimited quotes?",
      subheader: "Plus advanced features like analytics and priority support",
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: "Not interested",
      upperLabel: "Very interested"
    },
    {
      id: "upgrade_barrier",
      type: "multipleChoiceSingle",
      headline: "What's the main thing holding you back from upgrading?",
      subheader: "Understanding barriers helps us serve you better",
      required: false,
      logic: [
        {
          condition: {
            questionId: "upgrade_interest",
            operator: "lessThan",
            value: 4
          }
        }
      ],
      choices: [
        { id: "price_too_high", label: "Price is too high" },
        { id: "need_approval", label: "Need approval from team/boss" },
        { id: "unclear_value", label: "Not sure about the value" },
        { id: "timing", label: "Bad timing right now" },
        { id: "features", label: "Don't need the extra features" },
        { id: "trial_first", label: "Want to try it first" }
      ]
    },
    {
      id: "most_valuable_feature",
      type: "multipleChoiceSingle",
      headline: "Which premium feature would be most valuable to you?",
      subheader: "Help us highlight what matters most",
      required: false,
      logic: [
        {
          condition: {
            questionId: "upgrade_interest",
            operator: "greaterThanEqual",
            value: 3
          }
        }
      ],
      choices: [
        { id: "unlimited_quotes", label: "Unlimited quotes" },
        { id: "advanced_analytics", label: "Advanced analytics & reporting" },
        { id: "priority_support", label: "Priority customer support" },
        { id: "custom_branding", label: "Custom branding & logos" },
        { id: "team_features", label: "Team collaboration features" },
        { id: "integrations", label: "Third-party integrations" }
      ]
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thanks for your feedback! 💼",
    subheader: "We're working hard to provide the best value for growing businesses. Check out our upgrade options to keep your momentum going!",
    buttonText: "View Upgrade Options",
    buttonLink: "/pricing"
  },
  triggers: [
    {
      actionClass: {
        name: "Monthly Quote Limit Reached", 
        description: "Triggered when user hits their monthly quote limit - upgrade opportunity",
        type: "code"
      }
    }
  ]
};

/**
 * API Helper Functions
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
      body: JSON.stringify({
        environmentId: ENVIRONMENT_ID,
        ...surveyData
      })
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
 * Main Execution
 */
async function main() {
  console.log('🚀 Creating surveys for existing Formbricks actions...');
  console.log('');

  const surveys = [
    { data: POST_QUOTE_CREATION_SURVEY, description: "Post-quote creation feedback (5s delay)" },
    { data: QUOTE_CREATED_SURVEY, description: "Immediate quote creation success feedback" },
    { data: QUOTE_WORKFLOW_STARTED_SURVEY, description: "Quote workflow assistance and onboarding" },
    { data: MONTHLY_LIMIT_REACHED_SURVEY, description: "Upgrade opportunity when limit reached" }
  ];

  const results = [];
  
  for (const survey of surveys) {
    console.log(`📝 Creating: ${survey.description}`);
    const result = await createSurvey(survey.data);
    results.push(result);
    
    // Rate limiting - wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('📊 Creation Summary:');
  console.log(`✅ Surveys Created: ${results.filter(r => r).length}/${surveys.length}`);
  console.log('');

  if (results.filter(r => r).length > 0) {
    console.log('🎉 Surveys created successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Review surveys in Formbricks dashboard');
    console.log('2. Adjust targeting and display settings as needed');
    console.log('3. Test survey triggers in development environment');
    console.log('4. Publish surveys when ready for production');
    console.log('5. Monitor completion rates and user feedback');
    console.log('');
    console.log('🔗 Dashboard URL:');
    console.log(`   ${FORMBRICKS_API_HOST}/environments/${ENVIRONMENT_ID}/surveys`);
    console.log('');
    console.log('🎯 Survey Strategy:');
    console.log('   • Post-creation feedback: Immediate experience insights');
    console.log('   • Quote success: Quick satisfaction tracking');
    console.log('   • Workflow assistance: Onboarding and help');
    console.log('   • Upgrade opportunity: Strategic conversion at limit');
  } else {
    console.log('❌ No surveys were created successfully');
    console.log('Please check the error messages above and try again');
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createSurvey,
  POST_QUOTE_CREATION_SURVEY,
  QUOTE_CREATED_SURVEY,
  QUOTE_WORKFLOW_STARTED_SURVEY,
  MONTHLY_LIMIT_REACHED_SURVEY
};
