#!/usr/bin/env node

/**
 * Simple test to create one action class and see detailed response
 */

const simpleAction = {
  name: "Feature Request Feedback Widget",
  description: "User clicked Feature Request in feedback widget",
  type: "code",
  key: "feedback_feature_request_widget"
};

async function testActionCreation() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing single action class creation...\n');
  
  try {
    console.log('Payload being sent:', JSON.stringify(simpleAction, null, 2));
    
    const response = await fetch(`${baseUrl}/api/formbricks/action-classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simpleAction)
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Action class created successfully');
    } else {
      console.log('❌ Failed to create action class');
      console.log('Error details:', result.details);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testActionCreation().catch(console.error);