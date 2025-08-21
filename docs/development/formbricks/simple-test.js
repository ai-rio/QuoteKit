#!/usr/bin/env node

/**
 * Simple test to debug survey creation
 */

const simpleSurvey = {
  name: "Simple Test Survey",
  environmentId: "ENVIRONMENT_ID_PLACEHOLDER",
  type: "app",
  status: "inProgress",
  questions: [
    {
      id: "rating_question",
      type: "multipleChoiceSingle",
      headline: {
        default: "How do you rate our service?"
      },
      required: true,
      choices: [
        { id: "great", label: { default: "Great" } },
        { id: "good", label: { default: "Good" } },
        { id: "okay", label: { default: "Okay" } },
        { id: "poor", label: { default: "Poor" } }
      ]
    }
  ]
};

async function testSurvey() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing simple survey creation...\n');
  
  try {
    console.log('Payload being sent:', JSON.stringify(simpleSurvey, null, 2));
    
    const response = await fetch(`${baseUrl}/api/formbricks/surveys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simpleSurvey)
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Survey created successfully');
    } else {
      console.log('❌ Failed to create survey');
      console.log('Error details:', result.details);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testSurvey().catch(console.error);