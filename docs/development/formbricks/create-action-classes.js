#!/usr/bin/env node

/**
 * Create Action Classes for Survey Triggers via Formbricks Management API
 * These actions will allow surveys to be triggered when tracked events occur
 */

const actionClasses = [
  {
    name: "feedback_feature_request",
    description: "User clicked Feature Request in feedback widget",
    type: "code",
    key: "feedback_feature_request"
  },
  {
    name: "feedback_bug_report", 
    description: "User clicked Report Issue in feedback widget",
    type: "code",
    key: "feedback_bug_report"
  },
  {
    name: "feedback_appreciation",
    description: "User clicked Love LawnQuote in feedback widget", 
    type: "code",
    key: "feedback_appreciation"
  }
];

async function createActionClasses() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('🎯 Creating action classes for survey triggers...\n');
  
  for (const actionClass of actionClasses) {
    try {
      console.log(`Creating action class: ${actionClass.name}`);
      
      const response = await fetch(`${baseUrl}/api/formbricks/action-classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionClass)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`✅ ${actionClass.name} created successfully`);
        console.log(`   Action Class ID: ${result.data.id}`);
      } else {
        console.log(`❌ Failed to create ${actionClass.name}`);
        console.log(`   Error: ${result.message || result.error || 'Unknown error'}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error creating ${actionClass.name}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Verify action classes were created
  console.log('🔍 Verifying created action classes...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/formbricks/action-classes`);
    const actionClasses = await response.json();
    
    if (actionClasses.success) {
      console.log(`✅ Found ${actionClasses.data.length} total action classes`);
      actionClasses.data.forEach(actionClass => {
        console.log(`   - ${actionClass.name} (${actionClass.type})`);
      });
    } else {
      console.log('❌ Failed to fetch action classes for verification');
    }
    
  } catch (error) {
    console.log(`❌ Error verifying action classes: ${error.message}`);
  }
}

// Run the script
createActionClasses().catch(console.error);