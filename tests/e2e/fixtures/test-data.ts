/**
 * Test fixtures and data for E2E tests
 */

export const TEST_USERS = {
  ADMIN_USER: {
    email: 'carlos@ai.rio.br',
    password: 'password123',
    subscriptionTier: 'premium',
    stats: { totalQuotes: 25 },
  },
  FREE_USER: {
    email: 'carlos@ai.rio.br', // Using same user for consistency
    password: 'password123',
    subscriptionTier: 'free',
    stats: { totalQuotes: 3 },
  },
  PREMIUM_USER: {
    email: 'carlos@ai.rio.br',
    password: 'password123',
    subscriptionTier: 'premium',
    stats: { totalQuotes: 25 },
  },
  NEW_USER: {
    email: 'carlos@ai.rio.br',
    password: 'password123',
    subscriptionTier: 'free',
    stats: { totalQuotes: 0 },
  },
};

export const TEST_QUOTES = {
  SIMPLE_QUOTE: {
    client_name: 'Simple Client',
    client_contact: 'simple@test.com',
    total: 350,
    tax_rate: 8.5,
    markup_rate: 20,
    lineItems: [
      { description: 'Lawn Mowing', quantity: 1, price: 50 },
      { description: 'Hedge Trimming', quantity: 1, price: 30 }
    ]
  },
  MEDIUM_QUOTE: {
    client_name: 'Medium Client',
    client_contact: 'medium@test.com',
    total: 1800,
    tax_rate: 9.0,
    markup_rate: 25,
    lineItems: [
      { description: 'Lawn Maintenance', quantity: 4, price: 75 },
      { description: 'Shrub Pruning', quantity: 1, price: 150 },
      { description: 'Fertilization', quantity: 1, price: 200 },
      { description: 'Weed Control', quantity: 1, price: 180 },
      { description: 'Aeration', quantity: 1, price: 120 }
    ]
  },
  COMPLEX_QUOTE: {
    client_name: 'Complex Client',
    client_contact: 'complex@test.com',
    total: 7500,
    tax_rate: 10.5,
    markup_rate: 35,
    lineItems: [
      { description: 'Landscape Design', quantity: 1, price: 2000 },
      { description: 'Tree Removal', quantity: 3, price: 800 },
      { description: 'Irrigation System', quantity: 1, price: 1500 },
      { description: 'Hardscaping', quantity: 1, price: 2200 },
      { description: 'Plant Installation', quantity: 25, price: 45 },
      { description: 'Mulching', quantity: 10, price: 35 },
      { description: 'Lighting Installation', quantity: 8, price: 125 },
      { description: 'Custom Pergola', quantity: 1, price: 1800 }
    ]
  }
};

export const MOCK_SURVEYS = {
  DASHBOARD_SURVEY: {
    id: 'dashboard-satisfaction',
    questions: [
      {
        id: 'satisfaction',
        type: 'rating',
        text: 'How satisfied are you with the dashboard?',
        scale: 5
      },
      {
        id: 'improvements',
        type: 'text',
        text: 'What would make the dashboard better?'
      }
    ]
  },
  QUOTE_CREATION_SURVEY: {
    id: 'quote-creation-experience',
    questions: [
      {
        id: 'ease',
        type: 'rating',
        text: 'How easy was it to create this quote?',
        scale: 5
      },
      {
        id: 'features',
        type: 'multipleChoice',
        text: 'Which features were most helpful?',
        options: ['Templates', 'Item Library', 'Pricing Calculator', 'Preview']
      }
    ]
  },
  COMPLEX_QUOTE_SURVEY: {
    id: 'complex-quote-feedback',
    questions: [
      {
        id: 'complexity_handling',
        type: 'rating',
        text: 'How well did QuoteKit handle your complex quote?',
        scale: 5
      },
      {
        id: 'missing_features',
        type: 'text',
        text: 'What features would help with complex quotes?'
      }
    ]
  }
};

export const FORMBRICKS_EVENTS = {
  // Sprint 3 Events
  POST_QUOTE_CREATION_SURVEY: 'post_quote_creation_survey',
  HIGH_VALUE_QUOTE_FEEDBACK: 'high_value_quote_feedback',
  COMPLEX_QUOTE_FEEDBACK: 'complex_quote_feedback',
  NEW_CLIENT_QUOTE_EXPERIENCE: 'new_client_quote_experience',
  
  // Workflow Events
  QUOTE_WORKFLOW_STARTED: 'quote_workflow_started',
  QUOTE_WORKFLOW_CLIENT_SELECTED: 'quote_workflow_client_selected',
  QUOTE_WORKFLOW_FIRST_ITEM_ADDED: 'quote_workflow_first_item_added',
  QUOTE_WORKFLOW_ITEMS_CONFIGURED: 'quote_workflow_items_configured',
  QUOTE_WORKFLOW_PRICING_CONFIGURED: 'quote_workflow_pricing_configured',
  QUOTE_WORKFLOW_PREVIEW_VIEWED: 'quote_workflow_preview_viewed',
  QUOTE_WORKFLOW_FINALIZED: 'quote_workflow_finalized',
  
  // Complexity Events
  QUOTE_COMPLEXITY_ANALYZED: 'quote_complexity_analyzed',
  COMPLEXITY_CACHE_HIT: 'complexity_cache_hit',
  COMPLEXITY_CACHE_MISS: 'complexity_cache_miss'
};
