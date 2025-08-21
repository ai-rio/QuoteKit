#!/usr/bin/env node

/**
 * Corrected survey payloads with proper Formbricks format
 * Based on successful API testing and official documentation
 */

const surveys = [
  {
    name: "Feature Request Feedback - Triggered",
    environmentId: "ENVIRONMENT_ID_PLACEHOLDER",
    type: "app",
    status: "inProgress",
    welcomeCard: {
      enabled: true,
      headline: {
        default: "💡 Feature Request"
      },
      html: {
        default: "<p>We'd love to hear your ideas for improving LawnQuote!</p>"
      }
    },
    questions: [
      {
        id: "feature_category",
        type: "multipleChoiceSingle",
        headline: {
          default: "What type of feature would you like to see?"
        },
        required: true,
        choices: [
          { id: "quote_editing", label: { default: "Quote creation & editing" } },
          { id: "client_mgmt", label: { default: "Client management" } },
          { id: "pricing", label: { default: "Pricing & calculations" } },
          { id: "templates", label: { default: "Templates & designs" } },
          { id: "mobile", label: { default: "Mobile experience" } },
          { id: "integrations", label: { default: "Integrations" } },
          { id: "analytics", label: { default: "Reporting & analytics" } },
          { id: "collaboration", label: { default: "Team collaboration" } },
          { id: "other", label: { default: "Other" } }
        ]
      },
      {
        id: "feature_description",
        type: "openText",
        headline: {
          default: "Describe your feature idea"
        },
        subheader: {
          default: "Please provide as much detail as possible about what you'd like to see."
        },
        required: true,
        placeholder: {
          default: "I would like LawnQuote to..."
        }
      },
      {
        id: "feature_priority",
        type: "rating",
        headline: {
          default: "How important is this feature for your work?"
        },
        required: true,
        range: 5,
        scale: "number",
        lowerLabel: {
          default: "Nice to have"
        },
        upperLabel: {
          default: "Critical need"
        }
      }
    ],
    thankYouCard: {
      enabled: true,
      headline: {
        default: "Thank you! 🚀"
      },
      subheader: {
        default: "Your feature idea has been received and will be reviewed by our product team."
      },
      buttonLabel: {
        default: "Continue using LawnQuote"
      }
    },
    triggers: [
      {
        actionClass: {
          key: "feedback_feature_request_widget"
        }
      }
    ]
  },
  {
    name: "Bug Report Feedback - Triggered",
    environmentId: "ENVIRONMENT_ID_PLACEHOLDER",
    type: "app",
    status: "inProgress",
    welcomeCard: {
      enabled: true,
      headline: {
        default: "🐛 Report an Issue"
      },
      html: {
        default: "<p>Help us fix bugs and improve LawnQuote by reporting the issue you encountered.</p>"
      }
    },
    questions: [
      {
        id: "issue_type",
        type: "multipleChoiceSingle",
        headline: {
          default: "What type of issue are you experiencing?"
        },
        required: true,
        choices: [
          { id: "crash", label: { default: "Page not loading or crashing" } },
          { id: "feature_broken", label: { default: "Feature not working as expected" } },
          { id: "data_issues", label: { default: "Data not saving or loading" } },
          { id: "pdf_problems", label: { default: "PDF generation problems" } },
          { id: "mobile_issues", label: { default: "Mobile/responsive issues" } },
          { id: "performance", label: { default: "Performance/speed issues" } },
          { id: "login_issues", label: { default: "Login or access problems" } },
          { id: "calculation_errors", label: { default: "Calculation errors" } },
          { id: "other_technical", label: { default: "Other technical issue" } }
        ]
      },
      {
        id: "issue_description",
        type: "openText",
        headline: {
          default: "Describe the issue"
        },
        subheader: {
          default: "Please provide as much detail as possible about what happened."
        },
        required: true,
        placeholder: {
          default: "When I tried to..., the system..."
        }
      },
      {
        id: "issue_severity",
        type: "rating",
        headline: {
          default: "How much is this issue affecting your work?"
        },
        required: true,
        range: 5,
        scale: "number",
        lowerLabel: {
          default: "Minor inconvenience"
        },
        upperLabel: {
          default: "Blocking my work"
        }
      }
    ],
    thankYouCard: {
      enabled: true,
      headline: {
        default: "Thank you! 🔧"
      },
      subheader: {
        default: "Your bug report has been received. Our team will investigate and work on a fix."
      },
      buttonLabel: {
        default: "Continue using LawnQuote"
      }
    },
    triggers: [
      {
        actionClass: {
          key: "feedback_bug_report_widget"
        }
      }
    ]
  },
  {
    name: "Love LawnQuote Feedback - Triggered",
    environmentId: "ENVIRONMENT_ID_PLACEHOLDER",
    type: "app",
    status: "inProgress",
    welcomeCard: {
      enabled: true,
      headline: {
        default: "💚 Love LawnQuote"
      },
      html: {
        default: "<p>We're so happy you love LawnQuote! Tell us what makes it special for you.</p>"
      }
    },
    questions: [
      {
        id: "love_reason",
        type: "multipleChoiceMulti",
        headline: {
          default: "What do you love most about LawnQuote?"
        },
        subheader: {
          default: "Select all that apply"
        },
        required: true,
        choices: [
          { id: "easy_quotes", label: { default: "Easy to create professional quotes" } },
          { id: "time_saving", label: { default: "Saves me time" } },
          { id: "templates", label: { default: "Great templates and designs" } },
          { id: "interface", label: { default: "Simple and intuitive interface" } },
          { id: "mobile_friendly", label: { default: "Mobile-friendly" } },
          { id: "reliable", label: { default: "Reliable and stable" } },
          { id: "support", label: { default: "Good customer support" } },
          { id: "pricing", label: { default: "Fair pricing" } },
          { id: "professional", label: { default: "Helps me look professional to clients" } },
          { id: "integrations", label: { default: "Integration with other tools" } }
        ]
      },
      {
        id: "specific_feedback",
        type: "openText",
        headline: {
          default: "Tell us more about your experience"
        },
        subheader: {
          default: "What specific moment or feature made you love LawnQuote?"
        },
        required: false,
        placeholder: {
          default: "I love LawnQuote because..."
        }
      },
      {
        id: "recommendation_likelihood",
        type: "rating",
        headline: {
          default: "How likely are you to recommend LawnQuote to a colleague?"
        },
        required: true,
        range: 10,
        scale: "number",
        lowerLabel: {
          default: "Not likely"
        },
        upperLabel: {
          default: "Extremely likely"
        }
      }
    ],
    thankYouCard: {
      enabled: true,
      headline: {
        default: "Thank you! ❤️"
      },
      subheader: {
        default: "Your kind words mean the world to us. We'll keep working hard to make LawnQuote even better!"
      },
      buttonLabel: {
        default: "Continue using LawnQuote"
      }
    },
    triggers: [
      {
        actionClass: {
          key: "feedback_appreciation_widget"
        }
      }
    ]
  }
];

async function createSurveys() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('🚀 Creating feedback widget surveys with correct format...\n');
  
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
        console.log(`   Survey ID: ${result.data.data.id}`);
      } else {
        console.log(`❌ Failed to create ${survey.name}`);
        console.log(`   Error: ${result.message}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
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