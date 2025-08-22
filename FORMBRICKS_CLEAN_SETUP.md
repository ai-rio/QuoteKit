# 🧹 Formbricks Clean Setup Guide

## 🗑️ Step 1: Delete Everything

### In Formbricks Dashboard:
1. **Delete all existing surveys**:
   - Love LawnQuote Feedback
   - General Feedback for LawnQuote  
   - Feature Request Feedback
   - Bug Report Feedback
   - All others

2. **Delete all custom action classes**:
   - feedback_appreciation_widget
   - feedback_feature_request_widget
   - feedback_bug_report_widget
   - feedback_general
   - All widget-related actions

## 🚀 Step 2: Create ONE Simple Test Survey

### Create a minimal test survey:
1. **Survey Name**: "Test Survey"
2. **Type**: App Survey
3. **Questions**: 
   - Add 1 simple question: "How do you like this app?" (Rating 1-5)
4. **Triggers**:
   - Create new action class: `test_survey_trigger`
   - Link the survey trigger to this action class
5. **Display Settings**:
   - Display Limit: **Unlimited**
   - Recontact Days: **0** (no limit)
   - Display Option: **Multiple responses allowed**

## 🧪 Step 3: Test the Simple Survey

### Update floating widget temporarily:
```typescript
// In defaultFeedbackOptions, replace with ONE test option:
{
  id: 'test',
  label: 'Test Survey',
  icon: MessageCircle,
  description: 'Test if surveys work',
  formbricksEvent: 'test_survey_trigger',
  color: 'blue'
}
```

### Clear browser storage:
```javascript
// Clear all Formbricks data
Object.keys(localStorage).forEach(key => {
  if (key.includes('formbricks')) {
    localStorage.removeItem(key);
  }
});

Object.keys(sessionStorage).forEach(key => {
  if (key.includes('formbricks')) {
    sessionStorage.removeItem(key);
  }
});

// Refresh page
location.reload();
```

### Test:
1. Click the test button in floating widget
2. Survey should appear with content

## ✅ Step 4: If Test Works, Build Incrementally

### Once the test survey works:
1. **Create one real survey at a time**
2. **Test each survey individually**  
3. **Use simple, clean action class names**:
   - `love_lawnquote`
   - `feature_request`
   - `bug_report`
   - `general_feedback`

### For each new survey:
- ✅ Simple name
- ✅ One clear trigger with proper key
- ✅ Unlimited display
- ✅ No recontact limits
- ✅ Test before adding next

## 🎯 Expected Result

After this clean setup:
- ✅ No "pending updates" issues
- ✅ No "NO KEY" trigger problems
- ✅ No display limit conflicts
- ✅ Clean survey display with content

## 🔧 Debugging Commands

If issues persist, use these to debug:

### Check survey data:
```javascript
fetch('https://app.formbricks.com/api/v1/client/cme8xkym4kaievz01ljkfll1q/environment')
  .then(r => r.json())
  .then(d => console.log('Surveys:', d.data?.data?.surveys?.map(s => ({
    name: s.name,
    triggers: s.triggers?.map(t => t.actionClass?.key)
  }))));
```

### Test trigger:
```javascript
window.formbricks.track('test_survey_trigger', { test: true });
```

This clean approach will eliminate all the accumulated issues and give us a working foundation! 🧹✨