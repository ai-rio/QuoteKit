#!/usr/bin/env node

/**
 * Create the remaining action classes for feedback widget
 */

const actionClasses = [
  {
    name: "Bug Report Feedback Widget",
    description: "User clicked Report Issue in feedback widget",
    type: "code",
    key: "feedback_bug_report_widget"
  },
  {
    name: "Love LawnQuote Feedback Widget",
    description: "User clicked Love LawnQuote in feedback widget", 
    type: "code",
    key: "feedback_appreciation_widget"
  }
];

async function createActionClasses() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('🎯 Creating remaining action classes for feedback widget...\n');
  
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
        console.log(`   Action Class ID: ${result.data.data.id}`);
        console.log(`   Key: ${result.data.data.key}`);
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
  
  // Verify all feedback action classes
  console.log('🔍 Verifying all feedback action classes...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/formbricks/action-classes`);
    const actionClasses = await response.json();
    
    if (actionClasses.success) {
      const feedbackActions = actionClasses.data.filter(ac => 
        ac.key.includes('feedback_') || ac.name.includes('Feedback')
      );
      
      console.log(`✅ Found ${feedbackActions.length} feedback-related action classes:`);
      feedbackActions.forEach(actionClass => {
        console.log(`   - ${actionClass.name} (key: ${actionClass.key})`);
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