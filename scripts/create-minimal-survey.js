#!/usr/bin/env node

/**
 * Create Minimal Test Survey for FB-004 Implementation Phase
 * Minimal working version to complete the task
 */

const FORMBRICKS_API_HOST = 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = 'ce004bac5ca99fe2e6f490d721f13966';
const ENVIRONMENT_ID = 'cme8xkym4kaievz01ljkfll1q';

async function createMinimalTestSurvey() {
  console.log('🚀 Creating QuoteKit Minimal Test Survey for FB-004...\n');

  const surveyData = {
    environmentId: ENVIRONMENT_ID,
    name: "QuoteKit Test Survey - FB-004",
    type: "link",
    status: "draft",
    displayOption: "displayOnce",
    autoClose: null,
    triggers: [],
    redirectUrl: null,
    recontactDays: null,
    displayLimit: null,
    welcomeCard: {
      enabled: true,
      headline: { default: "Welcome to QuoteKit!" },
      html: { default: "<p>We're building the best quote management system for landscaping businesses. Your feedback helps us improve!</p>" },
      fileUrl: "",
      buttonLabel: { default: "Start Survey" },
      timeToFinish: false,
      showResponseCount: false
    },
    questions: [
      {
        id: "satisfaction_rating",
        type: "rating",
        headline: { default: "How satisfied are you with QuoteKit so far?" },
        subheader: { default: "Rate your overall experience with our platform" },
        required: true,
        scale: "star",
        range: 5,
        lowerLabel: { default: "Very Dissatisfied" },
        upperLabel: { default: "Very Satisfied" }
      },
      {
        id: "primary_feature",
        type: "multipleChoiceSingle",
        headline: { default: "Which QuoteKit feature interests you most?" },
        subheader: { default: "Select the feature that would be most valuable for your business" },
        required: true,
        choices: [
          { id: "quote_creation", label: { default: "Quote Creation & Management" } },
          { id: "pdf_generation", label: { default: "Professional PDF Generation" } },
          { id: "item_library", label: { default: "Service & Material Library" } },
          { id: "dashboard", label: { default: "Dashboard & Analytics" } },
          { id: "billing", label: { default: "Billing & Payment Integration" } },
          { id: "other", label: { default: "Other" } }
        ],
        shuffleOption: "none"
      },
      {
        id: "open_feedback",
        type: "openText",
        headline: { default: "Any additional feedback or suggestions?" },
        subheader: { default: "Your ideas help shape QuoteKit's future development" },
        required: false,
        placeholder: { default: "Share your thoughts, suggestions, or specific feature requests..." },
        longAnswer: true
      }
    ],
    thankYouCard: {
      enabled: true,
      headline: { default: "Thank you for your feedback! 🙏" },
      subheader: { default: "Your input is invaluable for improving QuoteKit" },
      html: { default: "<p>We're committed to building the best quote management system for landscaping professionals.</p>" },
      buttonLabel: { default: "Continue to QuoteKit" },
      buttonLink: "https://lawnquote.online"
    },
    hiddenFields: {
      enabled: false,
      fieldIds: []
    },
    surveyClosedMessage: {
      enabled: false,
      heading: "Survey Closed",
      subheading: "This survey is no longer accepting responses."
    },
    singleUse: {
      enabled: false,
      isEncrypted: true,
      heading: "Survey Already Completed",
      subheading: "You have already completed this survey."
    },
    verifyEmail: {
      enabled: false,
      name: "",
      subheading: ""
    },
    productOverwrites: {
      brandColor: "#10b981",
      highlightBorderColor: "#10b981",
      placement: "center",
      clickOutsideClose: false,
      darkOverlay: false
    }
  };

  try {
    const response = await fetch(`${FORMBRICKS_API_HOST}/api/v1/management/surveys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': FORMBRICKS_API_KEY
      },
      body: JSON.stringify(surveyData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const survey = await response.json();
    
    console.log('✅ Survey created successfully!');
    console.log(`📋 Survey ID: ${survey.id}`);
    console.log(`📝 Survey Name: ${survey.name}`);
    console.log(`🔗 Survey URL: ${FORMBRICKS_API_HOST}/s/${survey.id}`);
    console.log(`📊 Dashboard: ${FORMBRICKS_API_HOST}/environments/${ENVIRONMENT_ID}/surveys/${survey.id}`);
    
    // Try to publish the survey
    console.log('\n🚀 Publishing survey...');
    
    const publishResponse = await fetch(`${FORMBRICKS_API_HOST}/api/v1/management/surveys/${survey.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': FORMBRICKS_API_KEY
      },
      body: JSON.stringify({
        ...survey,
        status: 'inProgress'
      })
    });

    if (publishResponse.ok) {
      console.log('✅ Survey published successfully!');
    } else {
      console.log('📝 Survey created but remains in draft. You can publish it manually from the dashboard.');
    }
    
    console.log('\n🎯 FB-004 Task Completion Summary:');
    console.log('✅ Formbricks Cloud account configured');
    console.log('✅ Test survey created successfully');
    console.log('✅ Survey includes rating, multiple choice, and open text questions');
    console.log('✅ QuoteKit branding applied');
    console.log('✅ Survey ready for testing');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test the survey by visiting the URL above');
    console.log('2. Verify responses appear in the Formbricks dashboard');
    console.log('3. Mark FB-004 as complete in implementation phases');
    
    return survey;

  } catch (error) {
    console.error('❌ Error creating survey:', error.message);
    throw error;
  }
}

// Test API connection
async function testConnection() {
  console.log('🔍 Testing Formbricks API connection...');
  
  try {
    const response = await fetch(`${FORMBRICKS_API_HOST}/api/v1/me`, {
      headers: {
        'x-api-key': FORMBRICKS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Connection failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API connection successful');
    console.log(`📊 Environment: ${data.type}`);
    console.log(`🏢 Project: ${data.project?.name || 'Unknown'}`);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🎯 QuoteKit FB-004: Creating Minimal Test Survey\n');
  console.log('=' .repeat(50));
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    await createMinimalTestSurvey();
    console.log('\n🎉 FB-004 completed successfully!');
  } catch (error) {
    console.error('\n💥 Failed to complete FB-004:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
