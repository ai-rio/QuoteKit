# Dashboard Satisfaction Survey Setup Guide

This guide provides detailed instructions for setting up the QuoteKit Dashboard Satisfaction Survey in Formbricks Cloud.

## Overview

The Dashboard Satisfaction Survey is designed following UX research best practices:
- **3-5 questions maximum** for completion rates >10%
- **30-second trigger delay** to ensure user engagement
- **Mobile-optimized** question flow
- **Contextual targeting** based on user tier and behavior
- **Actionable insights** focused on usability and feature discovery

## Survey Configuration in Formbricks Cloud

### 1. Create New Survey

1. Log into your Formbricks Cloud account
2. Navigate to your QuoteKit project/environment
3. Click "Create Survey" → "Custom Survey"
4. Use these settings:

**Basic Information:**
- Survey Name: `Dashboard Satisfaction Survey`
- Description: `Measure user satisfaction with QuoteKit dashboard experience`
- Survey ID: `dashboard_satisfaction_v1`

### 2. Survey Questions

Configure exactly 5 questions in this order:

#### Question 1: Overall Satisfaction (Required)
- **Type:** Rating Scale
- **Question:** "How satisfied are you with the QuoteKit dashboard?"
- **Scale:** 1-5 stars
- **Labels:**
  - 1: "Very Unsatisfied"
  - 2: "Unsatisfied"
  - 3: "Neutral"
  - 4: "Satisfied"
  - 5: "Very Satisfied"
- **Required:** Yes
- **Help Text:** "Your overall satisfaction with the dashboard experience"

#### Question 2: Ease of Use (Required)
- **Type:** Rating Scale
- **Question:** "How easy is it to find what you need on the dashboard?"
- **Scale:** 1-5 stars
- **Labels:**
  - 1: "Very Difficult"
  - 2: "Difficult"
  - 3: "Okay"
  - 4: "Easy"
  - 5: "Very Easy"
- **Required:** Yes
- **Help Text:** "Rate the usability and navigation of the dashboard"

#### Question 3: Feature Discovery (Optional)
- **Type:** Multiple Choice (Multiple Selection)
- **Question:** "Which features have you discovered and used from the dashboard?"
- **Options:**
  - "Quick Stats Overview"
  - "Recent Activity"
  - "Quick Actions Panel"
  - "Analytics (Premium)"
  - "Create New Quote"
  - "Item Library Access"
  - "Account Settings"
  - "None of these"
- **Required:** No
- **Help Text:** "Help us understand feature adoption"

#### Question 4: Improvement Priority (Optional)
- **Type:** Multiple Choice (Single Selection)
- **Question:** "What would improve your dashboard experience the most?"
- **Options:**
  - "More detailed analytics"
  - "Faster loading times"
  - "Better mobile experience"
  - "More customization options"
  - "Clearer navigation"
  - "Additional quick actions"
  - "Better visual design"
  - "Everything is great as is"
- **Required:** No
- **Help Text:** "Prioritize improvements based on user needs"

#### Question 5: Open Feedback (Optional)
- **Type:** Long Text
- **Question:** "Any additional thoughts on improving the dashboard?"
- **Placeholder:** "Share any specific suggestions or feedback..."
- **Character Limit:** 500
- **Required:** No
- **Help Text:** "Optional detailed feedback for qualitative insights"

### 3. Survey Triggers

Configure the survey to trigger based on these conditions:

**Event Trigger:**
- **Event Name:** `dashboard_satisfaction_survey_show`
- **Wait for:** User attributes to be set

**Targeting Conditions:**
- **User Attribute:** `subscriptionTier` 
  - Values: `free`, `premium`
- **User Attribute:** `dashboardExperienceLevel`
  - Values: `new_user`, `beginner`, `intermediate`, `advanced`
- **User Attribute:** `timeSpentOnDashboard`
  - Condition: `>= 30` (seconds)

**Frequency Limits:**
- **Max shows per user:** 1
- **Cooldown period:** 30 days
- **Show after:** Event occurs + 2 second delay

### 4. Display Settings

Configure these display options for optimal user experience:

**Placement & Style:**
- **Position:** Center overlay
- **Background:** Semi-transparent overlay (80% opacity)
- **Survey Width:** 500px (desktop), 90% (mobile)
- **Border Radius:** 16px
- **Close Button:** Yes (top-right)

**Colors (Match QuoteKit Brand):**
- **Background:** #ffffff (white)
- **Primary Color:** #2A3D2F (forest-green)
- **Text Color:** #2A3D2F (charcoal)
- **Border Color:** #E5E7EB (light gray)
- **Button Color:** #2A3D2F (forest-green)

**Typography:**
- **Font Size:** 16px
- **Font Weight:** 400 (normal), 600 (questions)
- **Line Height:** 1.5

**Mobile Optimization:**
- **Responsive:** Yes
- **Touch-friendly buttons:** Yes
- **Readable font size:** 16px minimum
- **Easy scrolling:** Yes

### 5. Advanced Settings

#### Segment Targeting
Create these segments for better targeting:

1. **New Users Segment:**
   - `dashboardExperienceLevel = "new_user"`
   - `quotesCreated = 0`

2. **Active Users Segment:**
   - `dashboardExperienceLevel IN ["intermediate", "advanced"]`
   - `quotesCreated > 5`

3. **Premium Users Segment:**
   - `subscriptionTier = "premium"`
   - `isPremiumUser = true`

#### A/B Testing (Optional)
- **Test Variable:** Question order
- **Variant A:** Current order (satisfaction → ease → features → improvements → feedback)
- **Variant B:** Reverse order (feedback → improvements → features → ease → satisfaction)
- **Traffic Split:** 50/50
- **Success Metric:** Completion rate

### 6. Analytics & Reporting

Set up these key metrics to track:

**Primary Metrics:**
- **Completion Rate:** Target >15%
- **Average Response Time:** Target <2 minutes
- **Satisfaction Score:** Average rating for Q1
- **Usability Score:** Average rating for Q2

**Secondary Metrics:**
- **Feature Adoption Rate:** % who selected features in Q3
- **Improvement Priorities:** Distribution of Q4 responses
- **Qualitative Insights:** Themes from Q5 responses

**Segmentation Analysis:**
- Satisfaction by user tier (free vs premium)
- Completion rates by experience level
- Feature adoption by user segment
- Improvement requests by user type

### 7. Testing Checklist

Before launching, test these scenarios:

**Functional Testing:**
- [ ] Survey triggers after 30 seconds on dashboard
- [ ] All questions display properly
- [ ] Required validation works
- [ ] Survey can be closed/dismissed
- [ ] Mobile display is optimized
- [ ] Responses are recorded correctly

**User Experience Testing:**
- [ ] Survey doesn't interfere with dashboard usage
- [ ] Questions are clear and easy to understand
- [ ] Rating scales work smoothly
- [ ] Multiple choice selections save properly
- [ ] Text input accepts feedback

**Integration Testing:**
- [ ] Tracking events fire correctly
- [ ] User attributes are set properly
- [ ] Survey only shows once per user
- [ ] Cooldown period is respected
- [ ] Different user segments see appropriate targeting

## Implementation Timeline

**Phase 1: Setup (Day 1)**
- Create survey in Formbricks Cloud
- Configure questions and targeting
- Set up display options

**Phase 2: Testing (Days 2-3)**
- Test with development environment
- Verify tracking integration
- Run user acceptance testing

**Phase 3: Launch (Days 4-6)**
- Deploy to production
- Monitor completion rates
- Track initial responses

**Phase 4: Analysis (Day 7)**
- Generate initial insights
- Create action plan from feedback
- Plan iteration improvements

## Success Metrics

**Target KPIs:**
- **Completion Rate:** >15%
- **Response Quality:** >90% meaningful responses
- **User Satisfaction:** Average >3.5/5.0
- **Actionable Insights:** 3+ improvement priorities identified

**Red Flags:**
- Completion rate <10%
- High dismissal rate >80%
- Technical errors in responses
- User complaints about survey frequency

## Troubleshooting

### Survey Not Triggering
1. Check Formbricks SDK initialization
2. Verify event tracking is working
3. Confirm user attributes are set
4. Review targeting conditions

### Low Completion Rates
1. Reduce number of questions
2. Simplify question wording
3. Adjust timing (trigger earlier/later)
4. Improve mobile experience

### Poor Response Quality
1. Add question help text
2. Provide better examples
3. Adjust question types
4. Review targeting segments

## Next Steps

After initial launch:
1. Monitor response data for 2 weeks
2. Analyze satisfaction trends
3. Implement high-priority improvements
4. Plan follow-up surveys for specific features
5. Create quarterly dashboard satisfaction reports

This survey is designed to provide actionable insights for improving the QuoteKit dashboard experience while respecting user time and attention.