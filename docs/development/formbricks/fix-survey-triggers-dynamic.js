#!/usr/bin/env node

/**
 * Fix survey triggers by fetching action classes dynamically and creating surveys with proper triggers
 */

async function fixSurveyTriggers() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('🔧 Fetching action classes and creating fixed surveys...\n');
  
  try {
    // First, fetch all action classes
    console.log('📥 Fetching action classes...');
    const actionClassResponse = await fetch(`${baseUrl}/api/formbricks/action-classes`);
    const actionClassResult = await actionClassResponse.json();
    
    if (!actionClassResult.success) {
      console.log('❌ Failed to fetch action classes');
      return;
    }
    
    // Find the widget action classes and convert dates
    const actionClasses = {};
    actionClassResult.data.forEach(ac => {
      // Convert string dates to Date objects
      const actionClass = {
        ...ac,
        createdAt: new Date(ac.createdAt),
        updatedAt: new Date(ac.updatedAt)
      };
      
      if (ac.key === 'feedback_feature_request_widget') {
        actionClasses.feature_request = actionClass;
      } else if (ac.key === 'feedback_bug_report_widget') {
        actionClasses.bug_report = actionClass;
      } else if (ac.key === 'feedback_appreciation_widget') {
        actionClasses.appreciation = actionClass;
      }
    });
    
    console.log(`✅ Found ${Object.keys(actionClasses).length} widget action classes`);
    
    // Define surveys with proper action class objects
    const surveys = [
      {
        name: "Feature Request Feedback - Working",
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
            actionClass: actionClasses.feature_request
          }
        ]
      },
      {
        name: "Bug Report Feedback - Working",
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
            actionClass: actionClasses.bug_report
          }
        ]
      },
      {
        name: "Love LawnQuote Feedback - Working",
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
            actionClass: actionClasses.appreciation
          }
        ]
      }
    ];
    
    // Create surveys
    for (const survey of surveys) {
      try {
        console.log(`\nCreating: ${survey.name}`);
        
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
          console.log(`   Triggers: ${result.data.data.triggers.length > 0 ? 'Connected' : 'Not connected'}`);
          if (result.data.data.triggers.length > 0) {
            console.log(`   Trigger Key: ${result.data.data.triggers[0].actionClass.key}`);
          }
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
    }
    
    // Verify working surveys
    console.log('\n🔍 Verifying working surveys...\n');
    
    const verifyResponse = await fetch(`${baseUrl}/api/formbricks/surveys`);
    const surveysResult = await verifyResponse.json();
    
    if (surveysResult.success) {
      const workingSurveys = surveysResult.data.filter(s => s.name.includes('Working'));
      console.log(`✅ Found ${workingSurveys.length} working surveys`);
      
      workingSurveys.forEach(survey => {
        console.log(`   - ${survey.name}`);
        console.log(`     ID: ${survey.id}`);
        console.log(`     Triggers: ${survey.triggers.length > 0 ? `Connected to ${survey.triggers[0].actionClass.key}` : 'Not connected'}`);
        console.log('');
      });
    } else {
      console.log('❌ Failed to fetch surveys for verification');
    }
    
  } catch (error) {
    console.log(`❌ Error in script: ${error.message}`);
  }
}

// Run the script
fixSurveyTriggers().catch(console.error);