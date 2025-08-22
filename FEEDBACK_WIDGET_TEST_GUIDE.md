# Feedback Widget Test Guide

## Issue Fixed
The floating feedback widget was not triggering surveys because the event names didn't match the survey triggers in Formbricks.

## Fix Applied
Updated the event names in `src/components/feedback/floating-feedback-widget.tsx`:

- ✅ `feedback_feature_request_widget` (was: `feedback_feature_request`)
- ✅ `feedback_bug_report_widget` (was: `feedback_bug_report`) 
- ✅ `feedback_appreciation_widget` (was: `feedback_appreciation`)
- ✅ `feedback_general` (unchanged - already correct)

## Manual Testing Steps

### 1. Login to the Application
- Navigate to: `http://localhost:3000/login`
- Email: `carlos@ai.rio.br`
- Password: `password123`

### 2. Navigate to Dashboard
- Go to: `http://localhost:3000/dashboard`
- Wait for the page to fully load

### 3. Test the Feedback Widget
1. **Wait for widget to appear** (bottom-right corner, green circular button)
2. **Click the main green button** to expand the options
3. **Verify 4 options appear:**
   - 💬 General Feedback (blue)
   - 💡 Feature Request (yellow)  
   - ⚠️ Report Issue (red)
   - ❤️ Love LawnQuote (green)

### 4. Test Each Option
Click each option and verify that:
- ✅ A Formbricks survey modal appears
- ✅ The widget collapses after clicking
- ✅ The survey contains relevant questions
- ✅ The survey can be completed or closed

### 5. Expected Survey Content

#### Feature Request Survey
- Title: "💡 Feature Request"
- Questions about feature categories, descriptions, priority

#### Bug Report Survey  
- Title: "🐛 Report an Issue"
- Questions about issue types, descriptions, severity

#### Love LawnQuote Survey
- Title: "💚 Love LawnQuote" 
- Questions about what users love, recommendations

#### General Feedback Survey
- Title: "Help us improve LawnQuote! 🌱"
- General experience and improvement questions

## Troubleshooting

### If surveys don't appear:
1. Check browser console for Formbricks errors
2. Verify Formbricks SDK is loaded: `window.formbricks`
3. Check network tab for API calls to Formbricks
4. Verify environment variables are set correctly

### If widget doesn't appear:
1. Check if user is logged in
2. Verify the page allows the widget (not in hideOnPages)
3. Check console for JavaScript errors

## Browser Console Test
Run this in the browser console to test programmatically:

```javascript
// Load the test script
fetch('/test-feedback-widget.js').then(r => r.text()).then(eval);

// Then run individual tests:
testFeedbackWidget.testFeatureRequest();
testFeedbackWidget.testBugReport();
testFeedbackWidget.testAppreciation();
testFeedbackWidget.testGeneral();
```

## Success Criteria
- ✅ All 4 feedback options trigger their respective surveys
- ✅ Surveys appear as modal overlays
- ✅ Widget behavior is smooth and responsive
- ✅ No TypeScript errors in the codebase
- ✅ No console errors during widget interaction
