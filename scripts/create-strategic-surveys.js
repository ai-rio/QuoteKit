#!/usr/bin/env node

/**
 * Strategic Survey Creation Script for QuoteKit
 * 
 * This script creates a comprehensive set of user journey surveys
 * designed to gather insights without overwhelming users.
 * 
 * Usage: node scripts/create-strategic-surveys.js
 */

const FORMBRICKS_API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY;
const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

if (!FORMBRICKS_API_KEY || !ENVIRONMENT_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   FORMBRICKS_API_KEY');
  console.error('   NEXT_PUBLIC_FORMBRICKS_ENV_ID');
  process.exit(1);
}

/**
 * Survey Definitions - Strategic User Journey Surveys
 */

// Survey 1: First Quote Completion Feedback
const FIRST_QUOTE_COMPLETION_SURVEY = {
  name: "First Quote Completion Feedback",
  type: "app", // In-app survey
  status: "inProgress", // Start as draft
  displayOption: "displayOnce",
  recontactDays: null,
  displayLimit: 1,
  autoClose: 5,
  delay: 0,
  displayPercentage: 100,
  placement: "center",
  clickOutsideClose: true,
  darkOverlay: true,
  questions: [
    {
      id: "ease_of_first_quote",
      type: "rating",
      headline: "How easy was it to create your first quote?",
      subheader: "Your feedback helps us improve the experience for new users",
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: "Very Difficult",
      upperLabel: "Very Easy"
    },
    {
      id: "challenging_part",
      type: "multipleChoiceSingle",
      headline: "What was the most challenging part?",
      subheader: "Help us identify areas for improvement",
      required: true,
      choices: [
        { id: "finding_items", label: "Finding the right items" },
        { id: "setting_pricing", label: "Setting up pricing" },
        { id: "understanding_interface", label: "Understanding the interface" },
        { id: "client_info", label: "Adding client information" },
        { id: "nothing_challenging", label: "Nothing was challenging" }
      ]
    },
    {
      id: "improvement_suggestions",
      type: "openText",
      headline: "What would have made this process easier?",
      subheader: "Optional - Share any specific suggestions",
      required: false,
      placeholder: "Your suggestions help us improve...",
      longAnswer: false
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thank you for your feedback! 🎉",
    subheader: "Your insights help us make QuoteKit better for everyone. We'll use this feedback to improve the quote creation experience."
  },
  triggers: [
    {
      actionClass: {
        name: "first_quote_completed",
        description: "Triggered when user completes their first quote",
        type: "code"
      }
    }
  ]
};

// Survey 2: Feature Discovery Survey (Week 1)
const FEATURE_DISCOVERY_SURVEY = {
  name: "Feature Discovery - Week 1",
  type: "app",
  status: "inProgress",
  displayOption: "displayOnce", 
  recontactDays: null,
  displayLimit: 1,
  autoClose: 7,
  delay: 2,
  displayPercentage: 100,
  placement: "center",
  clickOutsideClose: true,
  darkOverlay: true,
  questions: [
    {
      id: "discovered_features",
      type: "multipleChoiceMulti",
      headline: "Which QuoteKit features have you discovered?",
      subheader: "Help us understand feature adoption",
      required: true,
      choices: [
        { id: "quote_templates", label: "Quote Templates" },
        { id: "item_library", label: "Item Library" },
        { id: "pdf_generation", label: "PDF Generation" },
        { id: "status_tracking", label: "Quote Status Tracking" },
        { id: "bulk_operations", label: "Bulk Operations" },
        { id: "analytics", label: "Analytics Dashboard" },
        { id: "mobile_access", label: "Mobile Access" }
      ]
    },
    {
      id: "nps_score",
      type: "rating",
      headline: "How likely are you to recommend QuoteKit to a colleague?",
      subheader: "0 = Not at all likely, 10 = Extremely likely",
      required: true,
      scale: "number",
      range: 10,
      lowerLabel: "Not likely",
      upperLabel: "Very likely"
    },
    {
      id: "next_valuable_feature",
      type: "multipleChoiceSingle",
      headline: "What feature would be most valuable to add next?",
      subheader: "Help us prioritize development",
      required: true,
      choices: [
        { id: "client_management", label: "Client Management System" },
        { id: "automated_followups", label: "Automated Follow-ups" },
        { id: "accounting_integration", label: "Integration with Accounting Software" },
        { id: "team_collaboration", label: "Team Collaboration Tools" },
        { id: "advanced_reporting", label: "Advanced Reporting" },
        { id: "mobile_app", label: "Mobile App" }
      ]
    },
    {
      id: "biggest_challenge",
      type: "openText",
      headline: "What's your biggest challenge with quote management?",
      subheader: "Optional - Help us understand your workflow",
      required: false,
      placeholder: "Describe your main challenge...",
      longAnswer: true
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thanks for sharing your experience! 🚀",
    subheader: "Your feedback directly influences our product roadmap. We're committed to building features that make your work easier."
  },
  triggers: [
    {
      actionClass: {
        name: "week_one_milestone",
        description: "Triggered after user has been active for 7 days",
        type: "code"
      }
    }
  ]
};

// Survey 3: Quote Abandonment Recovery
const QUOTE_ABANDONMENT_SURVEY = {
  name: "Quote Abandonment Recovery",
  type: "app",
  status: "inProgress",
  displayOption: "displayOnce",
  recontactDays: null,
  displayLimit: 1,
  autoClose: 3,
  delay: 1,
  displayPercentage: 100,
  placement: "center",
  clickOutsideClose: true,
  darkOverlay: true,
  questions: [
    {
      id: "abandonment_reason",
      type: "multipleChoiceSingle",
      headline: "What prevented you from completing this quote?",
      subheader: "Help us identify and fix common issues",
      required: true,
      choices: [
        { id: "missing_items", label: "Missing item information" },
        { id: "unclear_pricing", label: "Unclear pricing structure" },
        { id: "technical_issues", label: "Technical issues" },
        { id: "interrupted", label: "Interrupted by other tasks" },
        { id: "decided_not_to_send", label: "Decided not to send quote" },
        { id: "other", label: "Other" }
      ]
    },
    {
      id: "completion_help",
      type: "openText",
      headline: "How can we help you complete this quote?",
      subheader: "Optional - Let us know if you need assistance",
      required: false,
      placeholder: "Describe what would help...",
      longAnswer: false
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "We're here to help! 💪",
    subheader: "Thanks for the feedback. If you need assistance completing your quote, our support team is ready to help."
  },
  triggers: [
    {
      actionClass: {
        name: "quote_abandoned_24h",
        description: "Triggered when quote is abandoned for 24 hours",
        type: "code"
      }
    }
  ]
};

// Survey 4: Premium Value Assessment
const PREMIUM_VALUE_SURVEY = {
  name: "Premium Value Assessment",
  type: "app",
  status: "inProgress",
  displayOption: "displayOnce",
  recontactDays: null,
  displayLimit: 1,
  autoClose: 10,
  delay: 3,
  displayPercentage: 100,
  placement: "center",
  clickOutsideClose: true,
  darkOverlay: true,
  questions: [
    {
      id: "premium_analytics_value",
      type: "rating",
      headline: "How valuable are the premium analytics features?",
      subheader: "Help us understand the value of premium features",
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: "Not Valuable",
      upperLabel: "Extremely Valuable"
    },
    {
      id: "most_used_premium_features",
      type: "multipleChoiceMulti",
      headline: "Which premium features do you use most?",
      subheader: "Select all that apply",
      required: true,
      choices: [
        { id: "advanced_analytics", label: "Advanced Analytics" },
        { id: "unlimited_quotes", label: "Unlimited Quotes" },
        { id: "priority_support", label: "Priority Support" },
        { id: "custom_branding", label: "Custom Branding" },
        { id: "team_features", label: "Team Features" },
        { id: "api_access", label: "API Access" }
      ]
    },
    {
      id: "subscription_likelihood",
      type: "rating",
      headline: "How likely are you to continue your premium subscription?",
      subheader: "Your honest feedback helps us improve",
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: "Very Unlikely",
      upperLabel: "Very Likely"
    },
    {
      id: "premium_improvements",
      type: "multipleChoiceSingle",
      headline: "What would make premium even more valuable?",
      subheader: "Help us prioritize premium enhancements",
      required: true,
      choices: [
        { id: "more_integrations", label: "More integrations" },
        { id: "advanced_automation", label: "Advanced automation" },
        { id: "better_mobile", label: "Better mobile experience" },
        { id: "more_customization", label: "More customization options" },
        { id: "enhanced_reporting", label: "Enhanced reporting" },
        { id: "team_collaboration", label: "Team collaboration tools" }
      ]
    },
    {
      id: "premium_suggestions",
      type: "openText",
      headline: "Any suggestions for improving premium features?",
      subheader: "Optional - Share your ideas",
      required: false,
      placeholder: "Your suggestions for premium improvements...",
      longAnswer: true
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thank you for being a premium user! ⭐",
    subheader: "Your feedback helps us continuously improve the premium experience. We're committed to delivering exceptional value."
  },
  triggers: [
    {
      actionClass: {
        name: "premium_30_day_milestone",
        description: "Triggered after 30 days of premium subscription",
        type: "code"
      }
    }
  ]
};

// Survey 5: Monthly Satisfaction Pulse
const MONTHLY_SATISFACTION_SURVEY = {
  name: "Monthly Satisfaction Pulse",
  type: "app",
  status: "inProgress",
  displayOption: "displayMultiple",
  recontactDays: 30,
  displayLimit: null,
  autoClose: 5,
  delay: 2,
  displayPercentage: 100,
  placement: "center",
  clickOutsideClose: true,
  darkOverlay: true,
  questions: [
    {
      id: "overall_satisfaction",
      type: "rating",
      headline: "Overall, how satisfied are you with QuoteKit?",
      subheader: "Your monthly feedback helps us stay on track",
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: "Very Unsatisfied",
      upperLabel: "Very Satisfied"
    },
    {
      id: "whats_working_best",
      type: "multipleChoiceMulti",
      headline: "What's working best for your business?",
      subheader: "Select all that apply",
      required: true,
      choices: [
        { id: "faster_creation", label: "Faster quote creation" },
        { id: "professional_appearance", label: "Professional appearance" },
        { id: "better_organization", label: "Better organization" },
        { id: "time_savings", label: "Time savings" },
        { id: "client_communication", label: "Improved client communication" },
        { id: "revenue_tracking", label: "Revenue tracking" }
      ]
    },
    {
      id: "biggest_impact_improvement",
      type: "openText",
      headline: "What one improvement would have the biggest impact?",
      subheader: "Optional - Help us prioritize",
      required: false,
      placeholder: "The one thing that would make the biggest difference...",
      longAnswer: false
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thanks for your continued feedback! 📈",
    subheader: "Your monthly insights help us continuously improve QuoteKit. We appreciate your partnership in making it better."
  },
  triggers: [
    {
      actionClass: {
        name: "monthly_active_check",
        description: "Triggered for monthly active users",
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
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
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
    console.log(`✅ Created survey: ${surveyData.name} (ID: ${result.id})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create survey ${surveyData.name}:`, error.message);
    return null;
  }
}

async function createActionClass(actionData) {
  const url = `${FORMBRICKS_API_HOST}/api/v1/management/action-classes`;
  
  try {
    console.log(`🔄 Creating action class: ${actionData.name}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        environmentId: ENVIRONMENT_ID,
        ...actionData
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Created action class: ${actionData.name} (ID: ${result.id})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create action class ${actionData.name}:`, error.message);
    return null;
  }
}

/**
 * Action Classes for Survey Triggers
 */
const ACTION_CLASSES = [
  {
    name: "first_quote_completed",
    description: "Triggered when user completes their first quote successfully",
    type: "code"
  },
  {
    name: "week_one_milestone", 
    description: "Triggered after user has been active for 7 days with 2+ quotes",
    type: "code"
  },
  {
    name: "quote_abandoned_24h",
    description: "Triggered when quote draft is abandoned for 24+ hours",
    type: "code"
  },
  {
    name: "premium_30_day_milestone",
    description: "Triggered after 30 days of premium subscription",
    type: "code"
  },
  {
    name: "monthly_active_check",
    description: "Triggered monthly for users with recent activity",
    type: "code"
  }
];

/**
 * Main Execution
 */
async function main() {
  console.log('🚀 Starting Strategic Survey Creation for QuoteKit');
  console.log(`📊 Environment: ${ENVIRONMENT_ID}`);
  console.log(`🌐 API Host: ${FORMBRICKS_API_HOST}`);
  console.log('');

  // Step 1: Create Action Classes
  console.log('📋 Step 1: Creating Action Classes...');
  const actionResults = [];
  for (const actionClass of ACTION_CLASSES) {
    const result = await createActionClass(actionClass);
    actionResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  console.log('');

  // Step 2: Create Surveys
  console.log('📝 Step 2: Creating Strategic Surveys...');
  const surveys = [
    FIRST_QUOTE_COMPLETION_SURVEY,
    FEATURE_DISCOVERY_SURVEY,
    QUOTE_ABANDONMENT_SURVEY,
    PREMIUM_VALUE_SURVEY,
    MONTHLY_SATISFACTION_SURVEY
  ];

  const surveyResults = [];
  for (const survey of surveys) {
    const result = await createSurvey(survey);
    surveyResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
  }
  console.log('');

  // Step 3: Summary
  console.log('📊 Creation Summary:');
  console.log(`✅ Action Classes Created: ${actionResults.filter(r => r).length}/${ACTION_CLASSES.length}`);
  console.log(`✅ Surveys Created: ${surveyResults.filter(r => r).length}/${surveys.length}`);
  console.log('');

  if (surveyResults.filter(r => r).length > 0) {
    console.log('🎉 Strategic surveys created successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Review surveys in Formbricks dashboard');
    console.log('2. Test survey triggers in development');
    console.log('3. Publish surveys when ready');
    console.log('4. Monitor completion rates and feedback');
    console.log('');
    console.log('🔗 Dashboard URL:');
    console.log(`   ${FORMBRICKS_API_HOST}/environments/${ENVIRONMENT_ID}/surveys`);
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
  createActionClass,
  FIRST_QUOTE_COMPLETION_SURVEY,
  FEATURE_DISCOVERY_SURVEY,
  QUOTE_ABANDONMENT_SURVEY,
  PREMIUM_VALUE_SURVEY,
  MONTHLY_SATISFACTION_SURVEY,
  ACTION_CLASSES
};
