# Survey Creation via POST API

## Overview
This document provides the exact POST commands to create the three feedback widget surveys using the Formbricks Management API through our local endpoint.

## API Endpoint
`POST /api/formbricks/surveys`

## 1. Feature Request Survey

```bash
curl -X POST http://localhost:3000/api/formbricks/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Feature Request Feedback",
    "type": "web",
    "status": "inProgress",
    "welcomeCard": {
      "enabled": true,
      "headline": "💡 Feature Request",
      "html": "<p>We'\''d love to hear your ideas for improving LawnQuote!</p>"
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
        "subheader": "Please provide as much detail as possible about what you'\''d like to see.",
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
          "ASAP - it'\''s blocking my work",
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
        "html": "<p>We may want to ask follow-up questions or update you on the feature'\''s progress.</p>",
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
  }'
```

## 2. Report Issue Survey

```bash
curl -X POST http://localhost:3000/api/formbricks/surveys \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## 3. Love LawnQuote Survey

```bash
curl -X POST http://localhost:3000/api/formbricks/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Love LawnQuote Feedback",
    "type": "web",
    "status": "inProgress", 
    "welcomeCard": {
      "enabled": true,
      "headline": "💚 Love LawnQuote",
      "html": "<p>We'\''re so happy you love LawnQuote! Tell us what makes it special for you.</p>"
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
      "subheader": "Your kind words mean the world to us. We'\''ll keep working hard to make LawnQuote even better!",
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
  }'
```

## Alternative: JavaScript/Fetch Approach

If you prefer to use JavaScript instead of curl:

### Feature Request Survey
```javascript
const featureRequestSurvey = {
  name: "Feature Request Feedback",
  type: "web",
  status: "inProgress",
  // ... (same payload as curl above)
};

const response = await fetch('/api/formbricks/surveys', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(featureRequestSurvey)
});

const result = await response.json();
console.log('Survey created:', result);
```

## Verification Steps

After creating the surveys:

1. **Check if surveys were created:**
```bash
curl http://localhost:3000/api/formbricks/surveys
```

2. **Test the feedback widget:**
   - Click each feedback option in the widget
   - Verify the correct survey appears
   - Complete a test survey

3. **Check survey responses:**
```bash
curl http://localhost:3000/api/formbricks/responses
```

4. **Monitor analytics:**
   - Visit `/analytics/surveys` 
   - Check survey performance metrics

## Notes

- All surveys are configured to trigger on their respective events (`feedback_feature_request`, `feedback_bug_report`, `feedback_appreciation`)
- Surveys are set to `displayOnce` to prevent spam
- Each survey has contextual questions designed for 3-4 minute completion time
- Thank you cards reinforce the LawnQuote branding
- Surveys collect actionable feedback for product improvement