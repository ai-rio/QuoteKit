/**
 * FB-017 Survey Definitions - CORRECTED FORMAT
 * 
 * Complete survey configurations matching Formbricks API format
 */

function getSurveyDefinitions() {
  const ENV_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
  
  if (!ENV_ID) {
    throw new Error('NEXT_PUBLIC_FORMBRICKS_ENV_ID environment variable is required');
  }

  // Survey 1: New Free User Onboarding Feedback
  const newUserOnboardingSurvey = {
    name: 'New Free User Onboarding Feedback',
    type: 'app',
    environmentId: ENV_ID,
    status: 'draft',
    welcomeCard: {
      enabled: true,
      headline: { default: 'Help us improve QuoteKit' },
      html: { default: '<p>Your feedback helps us build better features for your business.</p>' },
      buttonLabel: { default: 'Start Survey' },
      timeToFinish: false,
      showResponseCount: false
    },
    questions: [
      {
        id: 'initial_motivation',
        type: 'multipleChoiceSingle',
        headline: { default: 'What brought you to QuoteKit today?' },
        required: true,
        choices: [
          { id: 'first_quote', label: { default: 'Need to create my first professional quote' } },
          { id: 'replace_process', label: { default: 'Replace my current quoting process' } },
          { id: 'recommended', label: { default: 'Recommended by a colleague/friend' } },
          { id: 'online_search', label: { default: 'Found through online search' } },
          { id: 'integration_partner', label: { default: 'Existing customer of integration partner' } },
          { id: 'other', label: { default: 'Other (please specify)' } }
        ],
        shuffleOption: 'none'
      },
      {
        id: 'primary_challenge',
        type: 'multipleChoiceMulti',
        headline: { default: 'What\'s your biggest challenge with creating quotes right now?' },
        required: true,
        choices: [
          { id: 'professional_look', label: { default: 'Making quotes look professional' } },
          { id: 'accurate_pricing', label: { default: 'Calculating pricing accurately' } },
          { id: 'finding_products', label: { default: 'Finding the right products/services' } },
          { id: 'client_info', label: { default: 'Organizing client information' } },
          { id: 'follow_up', label: { default: 'Following up on sent quotes' } },
          { id: 'new_to_quoting', label: { default: 'I\'m new to business quoting' } },
          { id: 'other', label: { default: 'Other (please specify)' } }
        ],
        shuffleOption: 'none'
      },
      {
        id: 'nps_score',
        type: 'nps',
        headline: { default: 'Based on your experience so far, how likely are you to recommend QuoteKit to a colleague?' },
        required: true,
        lowerLabel: { default: 'Not likely' },
        upperLabel: { default: 'Very likely' }
      },
      {
        id: 'additional_feedback',
        type: 'openText',
        headline: { default: 'Any additional feedback to help us improve?' },
        required: false,
        placeholder: { default: 'Share your thoughts or suggestions...' },
        longAnswer: true
      }
    ],
    displayOption: 'displayMultiple',
    recontactDays: 30,
    autoComplete: 7,
    delay: 0,
    displayPercentage: 100
  };

  // Survey 2: Trial User Conversion Intent
  const trialConversionSurvey = {
    name: 'Trial User Conversion Intent',
    type: 'app',
    environmentId: ENV_ID,
    status: 'draft',
    welcomeCard: {
      enabled: true,
      headline: { default: 'Help us understand your trial experience' },
      html: { default: '<p>Your feedback helps us improve QuoteKit for trial users.</p>' },
      buttonLabel: { default: 'Start Survey' },
      timeToFinish: false,
      showResponseCount: false
    },
    questions: [
      {
        id: 'feature_experience',
        type: 'multipleChoiceMulti',
        headline: { default: 'Which Pro features have you tried during your trial?' },
        required: true,
        choices: [
          { id: 'advanced_templates', label: { default: 'Advanced quote templates' } },
          { id: 'custom_branding', label: { default: 'Custom branding' } },
          { id: 'pdf_custom', label: { default: 'PDF customization' } },
          { id: 'client_portal', label: { default: 'Client portal access' } },
          { id: 'reporting', label: { default: 'Advanced reporting' } },
          { id: 'team_collab', label: { default: 'Team collaboration' } },
          { id: 'api_integrations', label: { default: 'API integrations' } },
          { id: 'priority_support', label: { default: 'Priority support' } },
          { id: 'none_yet', label: { default: 'Haven\'t tried Pro features yet' } }
        ],
        shuffleOption: 'none'
      },
      {
        id: 'conversion_barriers',
        type: 'multipleChoiceMulti',
        headline: { default: 'What\'s holding you back from upgrading to Pro?' },
        required: true,
        choices: [
          { id: 'price_high', label: { default: 'Price is too high for my budget' } },
          { id: 'unsure_value', label: { default: 'Not sure about the value yet' } },
          { id: 'need_approval', label: { default: 'Need approval from someone else' } },
          { id: 'evaluating_others', label: { default: 'Still evaluating other options' } },
          { id: 'missing_features', label: { default: 'Missing features I need' } },
          { id: 'technical_concerns', label: { default: 'Technical integration concerns' } },
          { id: 'dont_need_pro', label: { default: 'Don\'t need Pro features yet' } },
          { id: 'other', label: { default: 'Other (please specify)' } }
        ],
        shuffleOption: 'none'
      },
      {
        id: 'value_rating',
        type: 'rating',
        headline: { default: 'How valuable would Pro features be for your business?' },
        required: true,
        scale: 'star',
        range: 5,
        lowerLabel: { default: 'Not Valuable' },
        upperLabel: { default: 'Very Valuable' }
      },
      {
        id: 'investment_justification',
        type: 'openText',
        headline: { default: 'What would make Pro worth the investment for your business?' },
        required: false,
        placeholder: { default: 'Share what would justify the Pro upgrade for you...' },
        longAnswer: true
      }
    ],
    displayOption: 'displayMultiple',
    recontactDays: 30,
    autoComplete: 7,
    delay: 0,
    displayPercentage: 100
  };

  // Survey 3: Growing Pro User Experience
  const growingProUserSurvey = {
    name: 'Growing Pro User Experience',
    type: 'app',
    environmentId: ENV_ID,
    status: 'draft',
    welcomeCard: {
      enabled: true,
      headline: { default: 'Share your Pro user experience' },
      html: { default: '<p>Help us improve QuoteKit for growing businesses like yours.</p>' },
      buttonLabel: { default: 'Start Survey' },
      timeToFinish: false,
      showResponseCount: false
    },
    questions: [
      {
        id: 'business_impact',
        type: 'openText',
        headline: { default: 'How has QuoteKit impacted your business over the past month?' },
        required: true,
        placeholder: { default: 'Tell us about the impact on your business...' },
        longAnswer: true
      },
      {
        id: 'workflow_friction',
        type: 'multipleChoiceMulti',
        headline: { default: 'Which parts of your quoting process still take too long?' },
        required: true,
        choices: [
          { id: 'finding_products', label: { default: 'Finding and adding products/services' } },
          { id: 'complex_pricing', label: { default: 'Calculating complex pricing' } },
          { id: 'customizing_appearance', label: { default: 'Customizing quote appearance' } },
          { id: 'client_approval', label: { default: 'Getting client approval' } },
          { id: 'follow_up', label: { default: 'Following up on quotes' } },
          { id: 'convert_invoice', label: { default: 'Converting quotes to invoices' } },
          { id: 'client_comms', label: { default: 'Managing client communications' } },
          { id: 'quote_variations', label: { default: 'Creating quote variations' } },
          { id: 'other', label: { default: 'Other (please specify)' } }
        ],
        shuffleOption: 'none'
      },
      {
        id: 'speed_satisfaction',
        type: 'rating',
        headline: { default: 'How would you rate the speed of creating quotes with QuoteKit?' },
        required: true,
        scale: 'star',
        range: 5,
        lowerLabel: { default: 'Very Slow' },
        upperLabel: { default: 'Very Fast' }
      },
      {
        id: 'missing_features',
        type: 'openText',
        headline: { default: 'What\'s the one feature you wish QuoteKit had that would save you the most time?' },
        required: true,
        placeholder: { default: 'Describe the feature that would save you the most time...' },
        longAnswer: true
      }
    ],
    displayOption: 'displayMultiple',
    recontactDays: 30,
    autoComplete: 7,
    delay: 0,
    displayPercentage: 100
  };

  return [
    newUserOnboardingSurvey,
    trialConversionSurvey,
    growingProUserSurvey
  ];
}

module.exports = getSurveyDefinitions();
