#!/usr/bin/env node

/**
 * Test script to create the three feedback widget surveys
 * Run with: node test-survey-creation.js
 */

const surveys = [
  {
    name: "Feature Request Feedback",
    environmentId: "ENVIRONMENT_ID_PLACEHOLDER",
    type: "web",
    status: "inProgress",
    welcomeCard: {
      enabled: true,
      headline: "💡 Feature Request",
      html: "<p>We'd love to hear your ideas for improving LawnQuote!</p>"
    },
    questions: [
      {
        id: "feature_category",
        type: "multipleChoiceSingle",
        headline: "What type of feature would you like to see?",
        required: true,
        choices: [
          "Quote creation & editing",
          "Client management",
          "Pricing & calculations", 
          "Templates & designs",
          "Mobile experience",
          "Integrations",
          "Reporting & analytics",
          "Team collaboration",
          "Other"
        ]
      },
      {
        id: "feature_description",
        type: "openText",
        headline: "Describe your feature idea",
        subheader: "Please provide as much detail as possible about what you'd like to see.",
        required: true,
        placeholder: "I would like LawnQuote to..."
      },
      {
        id: "feature_priority",
        type: "rating",
        headline: "How important is this feature for your work?",
        required: true,
        scale: {
          min: 1,
          max: 5,
          minLabel: "Nice to have",
          maxLabel: "Critical need"
        }
      }
    ],
    thankYouCard: {
      enabled: true,
      headline: "Thank you! 🚀",
      subheader: "Your feature idea has been received and will be reviewed by our product team.",
      buttonLabel: "Continue using LawnQuote"
    },
    triggers: [
      {
        actionClass: {
          name: "feedback_feature_request",
          description: "User clicked Feature Request in feedback widget"
        }
      }
    ],
    displayOption: "displayOnce",
    autoClose: 30,
    delay: 0,
    displayPercentage: 100
  },
  {
    name: "Bug Report Feedback",
    environmentId: "ENVIRONMENT_ID_PLACEHOLDER",
    type: "web",
    status: "inProgress",
    welcomeCard: {
      enabled: true,
      headline: "🐛 Report an Issue",
      html: "<p>Help us fix bugs and improve LawnQuote by reporting the issue you encountered.</p>"
    },
    questions: [
      {
        id: "issue_type",
        type: "multipleChoiceSingle",
        headline: "What type of issue are you experiencing?",
        required: true,
        choices: [
          "Page not loading or crashing",
          "Feature not working as expected",
          "Data not saving or loading",
          "PDF generation problems",
          "Mobile/responsive issues",
          "Performance/speed issues",
          "Login or access problems",
          "Calculation errors",
          "Other technical issue"
        ]
      },
      {
        id: "issue_description",
        type: "openText",
        headline: "Describe the issue",
        subheader: "Please provide as much detail as possible about what happened.",
        required: true,
        placeholder: "When I tried to..., the system..."
      },
      {
        id: "issue_severity",
        type: "rating",
        headline: "How much is this issue affecting your work?",
        required: true,
        scale: {
          min: 1,
          max: 5,
          minLabel: "Minor inconvenience",
          maxLabel: "Blocking my work"
        }
      }
    ],
    thankYouCard: {
      enabled: true,
      headline: "Thank you! 🔧",
      subheader: "Your bug report has been received. Our team will investigate and work on a fix.",
      buttonLabel: "Continue using LawnQuote"
    },
    triggers: [
      {
        actionClass: {
          name: "feedback_bug_report",
          description: "User clicked Report Issue in feedback widget"
        }
      }
    ],
    displayOption: "displayOnce",
    autoClose: 30,
    closeOnDate: null,
    delay: 0,
    displayPercentage: 100
  },
  {
    name: "Love LawnQuote Feedback",
    environmentId: "ENVIRONMENT_ID_PLACEHOLDER",
    type: "web",
    status: "inProgress",
    welcomeCard: {
      enabled: true,
      headline: "💚 Love LawnQuote",
      html: "<p>We're so happy you love LawnQuote! Tell us what makes it special for you.</p>"
    },
    questions: [
      {
        id: "love_reason",
        type: "multipleChoiceMulti",
        headline: "What do you love most about LawnQuote?",
        subheader: "Select all that apply",
        required: true,
        choices: [
          "Easy to create professional quotes",
          "Saves me time",
          "Great templates and designs",
          "Simple and intuitive interface",
          "Mobile-friendly",
          "Reliable and stable",
          "Good customer support",
          "Fair pricing",
          "Helps me look professional to clients",
          "Integration with other tools"
        ]
      },
      {
        id: "specific_feedback",
        type: "openText",
        headline: "Tell us more about your experience",
        subheader: "What specific moment or feature made you love LawnQuote?",
        required: false,
        placeholder: "I love LawnQuote because..."
      },
      {
        id: "recommendation_likelihood",
        type: "rating",
        headline: "How likely are you to recommend LawnQuote to a colleague?",
        required: true,
        scale: {
          min: 0,
          max: 10,
          minLabel: "Not likely",
          maxLabel: "Extremely likely"
        }
      }
    ],
    thankYouCard: {
      enabled: true,
      headline: "Thank you! ❤️",
      subheader: "Your kind words mean the world to us. We'll keep working hard to make LawnQuote even better!",
      buttonLabel: "Continue using LawnQuote"
    },
    triggers: [
      {
        actionClass: {
          name: "feedback_appreciation",
          description: "User clicked Love LawnQuote in feedback widget"
        }
      }
    ],
    displayOption: "displayOnce",
    autoClose: 30,
    closeOnDate: null,
    delay: 0,
    displayPercentage: 100
  }
];

async function createSurveys() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('🚀 Creating feedback widget surveys...\n');
  
  for (const survey of surveys) {
    try {
      console.log(`Creating: ${survey.name}`);
      
      const response = await fetch(`${baseUrl}/api/formbricks/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(survey)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${survey.name} created successfully`);
        console.log(`   Survey ID: ${result.data.id}`);
      } else {
        console.log(`❌ Failed to create ${survey.name}`);
        console.log(`   Error: ${result.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Error creating ${survey.name}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Verify surveys were created
  console.log('🔍 Verifying created surveys...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/formbricks/surveys`);
    const surveys = await response.json();
    
    if (surveys.success) {
      console.log(`✅ Found ${surveys.data.length} total surveys`);
      surveys.data.forEach(survey => {
        console.log(`   - ${survey.name} (${survey.status})`);
      });
    } else {
      console.log('❌ Failed to fetch surveys for verification');
    }
    
  } catch (error) {
    console.log(`❌ Error verifying surveys: ${error.message}`);
  }
}

// Run the script
createSurveys().catch(console.error);