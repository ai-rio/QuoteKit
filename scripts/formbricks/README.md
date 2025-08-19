# FB-017 Survey Creation Scripts

This directory contains scripts to programmatically create and manage the surveys defined in the FB-017 specification using the Formbricks Management API.

## 📋 Survey Overview

The FB-017 specification defines 7 segment-specific surveys:

1. **New Free User Onboarding Feedback** - For new users after 3rd dashboard visit
2. **Trial User Conversion Intent** - For trial users on day 7 or after 5th quote
3. **Growing Pro User Experience** - For active Pro users after 25th quote
4. **Power Enterprise User Strategic Feedback** - Quarterly for power users
5. **Dormant High-Value User Reactivation** - For inactive high-value users
6. **Template Power User Advanced Needs** - After 10th template creation
7. **Mobile-First User Experience** - For users with 60%+ mobile usage

## 🚀 Quick Start

### Prerequisites

1. **Environment Setup**: Ensure your `.env` file has the correct Formbricks credentials:
   ```bash
   FORMBRICKS_API_KEY=your_api_key_here
   NEXT_PUBLIC_FORMBRICKS_ENV_ID=your_environment_id_here
   NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
   ```

2. **API Access**: Verify your API connection:
   ```bash
   node scripts/formbricks/test-formbricks-working.js
   ```

### Create All FB-017 Surveys

```bash
# Dry run (preview what will be created)
node scripts/formbricks/manage-surveys.js create-fb017 --dry-run

# Create all surveys
node scripts/formbricks/manage-surveys.js create-fb017
```

## 📚 Available Scripts

### 1. Survey Management (`manage-surveys.js`)

Main script for managing surveys:

```bash
# List all existing surveys
node scripts/formbricks/manage-surveys.js list

# Create all FB-017 surveys
node scripts/formbricks/manage-surveys.js create-fb017

# Publish a survey (make it live)
node scripts/formbricks/manage-surveys.js publish <survey-id>

# Delete a survey
node scripts/formbricks/manage-surveys.js delete <survey-id>
```

### 2. Direct Survey Creation (`create-fb017-surveys.js`)

Direct script for creating surveys:

```bash
# Create surveys with dry run
node scripts/formbricks/create-fb017-surveys.js --dry-run

# Create surveys for development environment
node scripts/formbricks/create-fb017-surveys.js --environment=dev

# Create surveys for production environment
node scripts/formbricks/create-fb017-surveys.js --environment=prod
```

### 3. API Testing (`test-formbricks-working.js`)

Test your Formbricks API connection:

```bash
node scripts/formbricks/test-formbricks-working.js
```

### 4. Development Setup (`setup-dev-formbricks.js`)

Set up and test development environment:

```bash
node scripts/formbricks/setup-dev-formbricks.js
```

## 📊 Survey Definitions

### File Structure

- `fb017-survey-definitions.js` - Main survey definitions (surveys 1-3)
- `fb017-survey-definitions-part2.js` - Additional surveys (surveys 4-7)

### Survey Configuration

Each survey includes:

- **Basic Configuration**: Name, type, status, timing
- **Questions**: Detailed question definitions with types and options
- **Triggers**: Event-based triggers for survey display
- **Targeting**: Segment-specific targeting rules
- **Branding**: Welcome and thank you cards

### Question Types Supported

- `multipleChoiceSingle` - Single selection multiple choice
- `multipleChoiceMulti` - Multi-selection multiple choice
- `openText` - Free text input
- `rating` - Star or numeric rating
- `nps` - Net Promoter Score (0-10)
- `matrix` - Matrix/grid questions
- `ranking` - Drag-and-drop ranking

## 🎯 Survey Targeting

### Segment-Based Triggers

Each survey is configured with specific triggers:

1. **New Users**: Dashboard visits, signup events
2. **Trial Users**: Trial day milestones, quote creation counts
3. **Active Users**: Quote creation milestones, monthly intervals
4. **Power Users**: Quarterly intervals, advanced feature usage
5. **Dormant Users**: Inactivity periods, historical value
6. **Template Users**: Template creation milestones
7. **Mobile Users**: Mobile usage percentage detection

### Implementation in QuoteKit

To implement these triggers in your QuoteKit application:

```javascript
// Example: Track dashboard visit for new users
import { formbricks } from '@formbricks/js';

// Track dashboard visit
formbricks.track('Dashboard Visit', {
  userId: user.id,
  userSegment: 'new_user',
  visitCount: user.dashboardVisits
});

// Track quote creation
formbricks.track('Quote Created', {
  userId: user.id,
  quoteCount: user.totalQuotes,
  userTier: user.subscriptionTier
});
```

## 🔧 Customization

### Modifying Survey Questions

1. Edit the survey definitions in `fb017-survey-definitions.js`
2. Update question types, options, or add new questions
3. Re-run the creation script to update surveys

### Adding New Surveys

1. Create new survey object following the existing pattern
2. Add to the exports array in the definitions file
3. Run the creation script

### Environment-Specific Configuration

The scripts support different environments:

```javascript
// Development environment
const devConfig = {
  displayPercentage: 100, // Show to all users
  recontactDays: 7,       // Shorter recontact period
  autoComplete: 3         // Shorter auto-complete time
};

// Production environment
const prodConfig = {
  displayPercentage: 20,  // Show to 20% of users
  recontactDays: 30,      // Standard recontact period
  autoComplete: 7         // Standard auto-complete time
};
```

## 📈 Monitoring & Analytics

### Survey Performance Metrics

Monitor these key metrics for each survey:

- **Completion Rate**: Target 25-50% depending on segment
- **Response Quality**: Detailed vs. brief responses
- **Trigger Accuracy**: Correct segment targeting
- **Time to Complete**: Should match estimates (2-6 minutes)

### Accessing Survey Data

Use the Formbricks API to retrieve survey responses:

```javascript
// Get survey responses
const responses = await fetch(`${API_HOST}/api/v1/management/surveys/${surveyId}/responses`, {
  headers: { 'X-API-Key': API_KEY }
});
```

## 🚨 Troubleshooting

### Common Issues

1. **API Authentication Failed**
   ```bash
   # Test your API connection
   node scripts/formbricks/test-formbricks-working.js
   ```

2. **Survey Creation Failed**
   ```bash
   # Check survey definition syntax
   node scripts/formbricks/manage-surveys.js create-fb017 --dry-run
   ```

3. **Surveys Not Displaying**
   - Verify survey status is 'inProgress'
   - Check trigger conditions are met
   - Confirm user segment targeting

### Debug Mode

Enable debug logging by setting:

```bash
FORMBRICKS_DEBUG=true
```

### API Rate Limits

The scripts include automatic delays between requests to avoid rate limiting. If you encounter rate limit errors:

1. Increase delay between requests
2. Reduce batch size
3. Use `--dry-run` to test without making API calls

## 📝 Best Practices

### Survey Creation

1. **Start with Dry Run**: Always test with `--dry-run` first
2. **Development First**: Create and test in development environment
3. **Gradual Rollout**: Start with low display percentages
4. **Monitor Performance**: Track completion rates and adjust

### Question Design

1. **Keep It Short**: 3-6 questions per survey
2. **Clear Language**: Use simple, direct questions
3. **Logical Flow**: Order questions from general to specific
4. **Optional Follow-ups**: Use conditional logic for detailed feedback

### Targeting Accuracy

1. **Test Triggers**: Verify trigger conditions work correctly
2. **Segment Validation**: Ensure users are correctly segmented
3. **Frequency Control**: Avoid survey fatigue with proper timing
4. **A/B Testing**: Test different versions for optimization

## 🔗 Related Documentation

- [FB-017 User Segmentation Strategy](../../docs/development/formbricks/FB-017-USER-SEGMENTATION-STRATEGY.md)
- [FB-017 Survey Templates](../../docs/development/formbricks/FB-017-SEGMENT-SURVEY-TEMPLATES.md)
- [FB-017 Targeting Logic](../../docs/development/formbricks/FB-017-TARGETING-LOGIC-SPECIFICATION.md)
- [Formbricks API Documentation](https://formbricks.com/docs/api)

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the Formbricks API documentation
3. Test with the provided debugging scripts
4. Verify your environment configuration

---

**Last Updated**: 2025-08-19  
**Version**: 1.0.0  
**Status**: Ready for implementation
