#!/usr/bin/env node

/**
 * Formbricks Survey Creation Script
 * Creates the strategic surveys for QuoteKit via Formbricks API
 */

const https = require('https');
const fs = require('fs');
require('dotenv').config();

const FORMBRICKS_API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY;
const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

if (!FORMBRICKS_API_KEY || !ENVIRONMENT_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   FORMBRICKS_API_KEY:', !!FORMBRICKS_API_KEY);
  console.error('   NEXT_PUBLIC_FORMBRICKS_ENV_ID:', !!ENVIRONMENT_ID);
  process.exit(1);
}

console.log('🚀 Creating Formbricks surveys...');
console.log('📍 Environment ID:', ENVIRONMENT_ID);
console.log('🔗 API Host:', FORMBRICKS_API_HOST);

/**
 * Make API request to Formbricks
 */
async function makeFormbricksRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${FORMBRICKS_API_HOST}/api/v1/${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORMBRICKS_API_KEY}`,
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Survey 1: Post-Quote Creation Survey (FB-010)
 */
const postQuoteCreationSurvey = {
  name: "Post-Quote Creation Feedback",
  type: "app", // or "website" depending on your setup
  environmentId: ENVIRONMENT_ID,
  status: "inProgress",
  displayOption: "displayOnce",
  autoClose: 10, // Auto-close after 10 seconds of inactivity
  delay: 5, // 5-second delay (FB-010 requirement)
  triggers: [
    {
      actionClass: {
        environmentId: ENVIRONMENT_ID,
        name: "post_quote_creation_survey"
      }
    }
  ],
  questions: [
    {
      id: "ease_of_creation",
      type: "rating",
      headline: "How easy was it to create this quote?",
      subheader: "Your feedback helps us improve the quote creation experience",
      required: true,
      scale: "number",
      range: 5,
      lowerLabel: "Very Hard",
      upperLabel: "Very Easy"
    },
    {
      id: "improvement_suggestions",
      type: "openText",
      headline: "What would make quote creation even better?",
      subheader: "Any suggestions to improve the experience... (optional)",
      required: false,
      placeholder: "Share your ideas for improvement..."
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thank you for your feedback! 🎉",
    subheader: "Your input helps us make QuoteKit better for everyone."
  },
  styling: {
    brandColor: "#10B981", // QuoteKit green
    questionColor: "#1F2937",
    inputColor: "#374151",
    inputBorderColor: "#D1D5DB",
    cardBackgroundColor: "#FFFFFF",
    highlightBorderColor: "#10B981"
  }
};

/**
 * Survey 2: Monthly Quote Limit Reached (Upgrade Opportunity)
 */
const upgradeSurvey = {
  name: "Upgrade Opportunity - Quote Limit Reached",
  type: "app",
  environmentId: ENVIRONMENT_ID,
  status: "inProgress",
  displayOption: "displayOnce",
  autoClose: 15, // Longer time for upgrade decision
  delay: 0, // Immediate - user needs to know about limit
  triggers: [
    {
      actionClass: {
        environmentId: ENVIRONMENT_ID,
        name: "monthly_quote_limit_reached"
      }
    }
  ],
  questions: [
    {
      id: "biggest_need",
      type: "multipleChoiceSingle",
      headline: "You've reached your monthly quote limit. What's your biggest need?",
      subheader: "Help us understand how to better serve you",
      required: true,
      choices: [
        { id: "more_quotes", label: "More quotes per month" },
        { id: "advanced_features", label: "Advanced features" },
        { id: "better_organization", label: "Better organization tools" },
        { id: "premium_support", label: "Premium support" },
        { id: "other", label: "Other" }
      ]
    },
    {
      id: "upgrade_barrier",
      type: "multipleChoiceSingle",
      headline: "What's the main reason you haven't upgraded yet?",
      subheader: "Understanding barriers helps us improve our offering",
      required: false,
      choices: [
        { id: "price_concerns", label: "Price concerns" },
        { id: "dont_need_features", label: "Don't need more features" },
        { id: "still_evaluating", label: "Still evaluating" },
        { id: "need_approval", label: "Need approval from team/boss" },
        { id: "other", label: "Other" }
      ]
    }
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thanks for your feedback! 💼",
    subheader: "We're working on making QuoteKit even better for growing businesses like yours.",
    buttonLabel: "Explore Upgrade Options",
    buttonLink: "/pricing" // Link to your pricing page
  },
  styling: {
    brandColor: "#F59E0B", // Upgrade opportunity - amber color
    questionColor: "#1F2937",
    inputColor: "#374151",
    inputBorderColor: "#D1D5DB",
    cardBackgroundColor: "#FFFFFF",
    highlightBorderColor: "#F59E0B"
  }
};

/**
 * Create surveys
 */
async function createSurveys() {
  try {
    console.log('\n📋 Creating Survey 1: Post-Quote Creation Feedback...');
    const survey1 = await makeFormbricksRequest(
      `management/surveys`,
      'POST',
      postQuoteCreationSurvey
    );
    console.log('✅ Survey 1 created successfully!');
    console.log('   Survey ID:', survey1.id);
    console.log('   Name:', survey1.name);

    console.log('\n📋 Creating Survey 2: Upgrade Opportunity...');
    const survey2 = await makeFormbricksRequest(
      `environments/${ENVIRONMENT_ID}/surveys`,
      'POST',
      upgradeSurvey
    );
    console.log('✅ Survey 2 created successfully!');
    console.log('   Survey ID:', survey2.id);
    console.log('   Name:', survey2.name);

    // Save survey IDs for reference
    const surveyInfo = {
      created: new Date().toISOString(),
      environment: ENVIRONMENT_ID,
      surveys: {
        postQuoteCreation: {
          id: survey1.id,
          name: survey1.name,
          trigger: 'post_quote_creation_survey'
        },
        upgradeOpportunity: {
          id: survey2.id,
          name: survey2.name,
          trigger: 'monthly_quote_limit_reached'
        }
      }
    };

    fs.writeFileSync(
      './scripts/created-surveys.json',
      JSON.stringify(surveyInfo, null, 2)
    );

    console.log('\n🎉 All surveys created successfully!');
    console.log('📄 Survey details saved to: ./scripts/created-surveys.json');
    console.log('\n🧪 Next steps:');
    console.log('1. Restart your Next.js server: npm run dev');
    console.log('2. Create a quote to test the FB-010 survey (5-second delay)');
    console.log('3. Check Formbricks dashboard for survey responses');

  } catch (error) {
    console.error('❌ Error creating surveys:', error.message);
    
    if (error.message.includes('401')) {
      console.error('🔑 Check your FORMBRICKS_API_KEY - it may be invalid or expired');
    } else if (error.message.includes('404')) {
      console.error('🎯 Check your NEXT_PUBLIC_FORMBRICKS_ENV_ID - environment may not exist');
    }
    
    process.exit(1);
  }
}

// Run the script
createSurveys();
