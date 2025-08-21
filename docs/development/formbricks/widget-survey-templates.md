# Widget Survey Templates Configuration

## Overview
This document provides the exact survey configurations for the three missing feedback widget surveys that need to be created in Formbricks.

## 1. Feature Request Survey

**Survey ID:** `feedback_feature_request`
**Trigger Event:** `feedback_feature_request`
**Target Audience:** All users

### Survey Configuration:
```json
{
  "name": "Feature Request Feedback",
  "type": "web",
  "status": "inProgress",
  "welcomeCard": {
    "enabled": true,
    "headline": "💡 Feature Request",
    "html": "<p>We'd love to hear your ideas for improving LawnQuote!</p>"
  },
  "questions": [
    {
      "id": "feature_category",
      "type": "multipleChoiceSingle",
      "headline": "What type of feature would you like to see?",
      "required": true,
      "choices": [
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
      "id": "feature_description",
      "type": "openText",
      "headline": "Describe your feature idea",
      "subheader": "Please provide as much detail as possible about what you'd like to see.",
      "required": true,
      "placeholder": "I would like LawnQuote to..."
    },
    {
      "id": "feature_priority",
      "type": "rating",
      "headline": "How important is this feature for your work?",
      "required": true,
      "scale": {
        "min": 1,
        "max": 5,
        "minLabel": "Nice to have",
        "maxLabel": "Critical need"
      }
    },
    {
      "id": "feature_urgency",
      "type": "multipleChoiceSingle",
      "headline": "When would you like to see this feature?",
      "choices": [
        "ASAP - it's blocking my work",
        "Within the next month",
        "Within the next quarter",
        "Sometime this year",
        "No rush, when you get to it"
      ]
    },
    {
      "id": "contact_followup",
      "type": "consent",
      "headline": "Can we contact you about this feature request?",
      "html": "<p>We may want to ask follow-up questions or update you on the feature's progress.</p>",
      "required": false
    }
  ],
  "thankYouCard": {
    "enabled": true,
    "headline": "Thank you! 🚀",
    "subheader": "Your feature idea has been received and will be reviewed by our product team.",
    "buttonLabel": "Continue using LawnQuote"
  },
  "triggers": [
    {
      "actionClass": {
        "name": "feedback_feature_request",
        "description": "User clicked Feature Request in feedback widget"
      }
    }
  ],
  "displayOption": "displayOnce",
  "autoClose": 30,
  "closeOnDate": null,
  "delay": 0,
  "displayPercentage": 100
}
```

## 2. Report Issue Survey

**Survey ID:** `feedback_bug_report`
**Trigger Event:** `feedback_bug_report`
**Target Audience:** All users

### Survey Configuration:
```json
{
  "name": "Bug Report Feedback",
  "type": "web", 
  "status": "inProgress",
  "welcomeCard": {
    "enabled": true,
    "headline": "🐛 Report an Issue",
    "html": "<p>Help us fix bugs and improve LawnQuote by reporting the issue you encountered.</p>"
  },
  "questions": [
    {
      "id": "issue_type",
      "type": "multipleChoiceSingle",
      "headline": "What type of issue are you experiencing?",
      "required": true,
      "choices": [
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
      "id": "issue_description",
      "type": "openText",
      "headline": "Describe the issue",
      "subheader": "Please provide as much detail as possible about what happened.",
      "required": true,
      "placeholder": "When I tried to..., the system..."
    },
    {
      "id": "steps_to_reproduce",
      "type": "openText",
      "headline": "Steps to reproduce (optional)",
      "subheader": "Help us recreate the issue by listing the steps you took.",
      "required": false,
      "placeholder": "1. Go to...\n2. Click on...\n3. Then..."
    },
    {
      "id": "issue_frequency",
      "type": "multipleChoiceSingle",
      "headline": "How often does this happen?",
      "choices": [
        "Every time I try",
        "Most of the time",
        "Sometimes",
        "Rarely",
        "This was the first time"
      ]
    },
    {
      "id": "issue_severity",
      "type": "rating",
      "headline": "How much is this issue affecting your work?",
      "required": true,
      "scale": {
        "min": 1,
        "max": 5,
        "minLabel": "Minor inconvenience",
        "maxLabel": "Blocking my work"
      }
    },
    {
      "id": "user_environment",
      "type": "multipleChoiceSingle",
      "headline": "What device/browser are you using?",
      "choices": [
        "Desktop - Chrome",
        "Desktop - Firefox", 
        "Desktop - Safari",
        "Desktop - Edge",
        "Mobile - iPhone Safari",
        "Mobile - Android Chrome",
        "Tablet",
        "Other"
      ]
    }
  ],
  "thankYouCard": {
    "enabled": true,
    "headline": "Thank you! 🔧",
    "subheader": "Your bug report has been received. Our team will investigate and work on a fix.",
    "buttonLabel": "Continue using LawnQuote"
  },
  "triggers": [
    {
      "actionClass": {
        "name": "feedback_bug_report",
        "description": "User clicked Report Issue in feedback widget"
      }
    }
  ],
  "displayOption": "displayOnce",
  "autoClose": 30,
  "closeOnDate": null,
  "delay": 0,
  "displayPercentage": 100
}
```

## 3. Love LawnQuote Survey

**Survey ID:** `feedback_appreciation`
**Trigger Event:** `feedback_appreciation`
**Target Audience:** All users

### Survey Configuration:
```json
{
  "name": "Love LawnQuote Feedback",
  "type": "web",
  "status": "inProgress", 
  "welcomeCard": {
    "enabled": true,
    "headline": "💚 Love LawnQuote",
    "html": "<p>We're so happy you love LawnQuote! Tell us what makes it special for you.</p>"
  },
  "questions": [
    {
      "id": "love_reason",
      "type": "multipleChoiceMulti",
      "headline": "What do you love most about LawnQuote?",
      "subheader": "Select all that apply",
      "required": true,
      "choices": [
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
      "id": "specific_feedback",
      "type": "openText",
      "headline": "Tell us more about your experience",
      "subheader": "What specific moment or feature made you love LawnQuote?",
      "required": false,
      "placeholder": "I love LawnQuote because..."
    },
    {
      "id": "business_impact",
      "type": "multipleChoiceSingle",
      "headline": "How has LawnQuote impacted your business?",
      "choices": [
        "Significantly improved my quote process",
        "Moderately improved my workflow",
        "Slightly improved how I work",
        "Made my work easier but no major change",
        "Too early to tell",
        "No noticeable impact yet"
      ]
    },
    {
      "id": "recommendation_likelihood",
      "type": "rating",
      "headline": "How likely are you to recommend LawnQuote to a colleague?",
      "required": true,
      "scale": {
        "min": 0,
        "max": 10,
        "minLabel": "Not likely",
        "maxLabel": "Extremely likely"
      }
    },
    {
      "id": "success_story",
      "type": "openText",
      "headline": "Share a success story (optional)",
      "subheader": "Has LawnQuote helped you win a client or complete a project successfully?",
      "required": false,
      "placeholder": "LawnQuote helped me..."
    },
    {
      "id": "testimonial_permission",
      "type": "consent",
      "headline": "Can we use your feedback as a testimonial?",
      "html": "<p>We may want to share your positive feedback to help other users discover LawnQuote.</p>",
      "required": false
    }
  ],
  "thankYouCard": {
    "enabled": true,
    "headline": "Thank you! ❤️",
    "subheader": "Your kind words mean the world to us. We'll keep working hard to make LawnQuote even better!",
    "buttonLabel": "Continue using LawnQuote"
  },
  "triggers": [
    {
      "actionClass": {
        "name": "feedback_appreciation",
        "description": "User clicked Love LawnQuote in feedback widget"
      }
    }
  ],
  "displayOption": "displayOnce", 
  "autoClose": 30,
  "closeOnDate": null,
  "delay": 0,
  "displayPercentage": 100
}
```

## API Deployment Instructions

### Using Formbricks Management API

To deploy these surveys, use the existing API infrastructure:

1. **Create surveys via POST requests to Formbricks Management API**
2. **Each survey should be triggered by its respective event**
3. **The events are already configured in the widget:**
   - `feedback_feature_request`
   - `feedback_bug_report` 
   - `feedback_appreciation`

### Test the Integration

After creating the surveys in Formbricks:

1. Test each widget option triggers the correct survey
2. Verify survey responses are collected properly
3. Check analytics dashboard shows survey performance
4. Confirm the updated LawnQuote branding appears correctly

## Notes

- All surveys are configured for single display to avoid spam
- Questions are designed to be completed in 2-4 minutes
- Response data will be available via `/api/formbricks/responses`
- Survey performance can be monitored at `/analytics/surveys`