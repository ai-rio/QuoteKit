import type { Tour } from '@/types/onboarding';

export const defaultTours: Tour[] = [
  {
    id: 'welcome-tour',
    name: 'Welcome to QuoteKit',
    description: 'Get started with QuoteKit and learn the basics',
    priority: 100,
    trigger: 'auto',
    steps: [
      {
        id: 'welcome-step-1',
        title: 'Welcome to QuoteKit!',
        content: 'Welcome to QuoteKit! We\'ll help you create professional landscaping quotes in minutes. Let\'s get you started with a quick tour.',
        position: 'center',
        showSkip: true,
        showPrevious: false,
      },
      {
        id: 'welcome-step-2',
        element: '[data-tour="sidebar"]',
        title: 'Navigation Sidebar',
        content: 'Use this sidebar to navigate between different sections of your account. You can manage quotes, items, clients, and settings from here.',
        position: 'right',
        showSkip: true,
        showPrevious: true,
      },
      {
        id: 'welcome-step-3',
        element: '[data-tour="create-quote"]',
        title: 'Create Your First Quote',
        content: 'Click here to create your first quote. You can add services, materials, and customize the details for your client.',
        position: 'bottom',
        showSkip: true,
        showPrevious: true,
      },
      {
        id: 'welcome-step-4',
        element: '[data-tour="dashboard-stats"]',
        title: 'Track Your Progress',
        content: 'Monitor your business performance with real-time analytics. See your quote acceptance rates, revenue, and client insights.',
        position: 'bottom',
        showSkip: true,
        showPrevious: true,
      },
    ],
  },
  {
    id: 'quote-creation-tour',
    name: 'Creating Your First Quote',
    description: 'Learn how to create professional quotes step by step',
    priority: 90,
    trigger: 'feature-access',
    conditions: {
      hasCompanySettings: true,
    },
    steps: [
      {
        id: 'quote-step-1',
        element: '[data-tour="client-select"]',
        title: 'Select or Add Client',
        content: 'Start by selecting an existing client or adding a new one. Client information will be automatically included in your quote.',
        position: 'bottom',
        showSkip: true,
        showPrevious: false,
      },
      {
        id: 'quote-step-2',
        element: '[data-tour="add-items"]',
        title: 'Add Services & Materials',
        content: 'Add services and materials from your item library. You can also create new items on the fly.',
        position: 'top',
        showSkip: true,
        showPrevious: true,
      },
      {
        id: 'quote-step-3',
        element: '[data-tour="quote-settings"]',
        title: 'Customize Quote Settings',
        content: 'Set markup rates, tax rates, and add notes or terms. These can be customized for each quote.',
        position: 'left',
        showSkip: true,
        showPrevious: true,
      },
      {
        id: 'quote-step-4',
        element: '[data-tour="save-quote"]',
        title: 'Save Your Quote',
        content: 'Save your quote as a draft, or send it directly to your client. You can also save it as a template for future use.',
        position: 'top',
        showSkip: true,
        showPrevious: true,
      },
    ],
  },
  {
    id: 'item-library-tour',
    name: 'Managing Your Item Library',
    description: 'Learn how to organize and manage your services and materials',
    priority: 80,
    trigger: 'feature-access',
    steps: [
      {
        id: 'item-step-1',
        element: '[data-tour="item-categories"]',
        title: 'Organize with Categories',
        content: 'Use categories to organize your services and materials. This makes it easier to find items when creating quotes.',
        position: 'right',
        showSkip: true,
        showPrevious: false,
      },
      {
        id: 'item-step-2',
        element: '[data-tour="item-favorites"]',
        title: 'Mark Favorites',
        content: 'Mark frequently used items as favorites to access them quickly when creating quotes.',
        position: 'bottom',
        showSkip: true,
        showPrevious: true,
      },
      {
        id: 'item-step-3',
        element: '[data-tour="bulk-import"]',
        title: 'Bulk Import Items',
        content: 'Save time by importing multiple items at once using our CSV import feature.',
        position: 'top',
        showSkip: true,
        showPrevious: true,
      },
    ],
  },
  {
    id: 'settings-tour',
    name: 'Company Settings',
    description: 'Configure your company profile and default settings',
    priority: 70,
    trigger: 'manual',
    conditions: {
      hasCompanySettings: false,
    },
    steps: [
      {
        id: 'settings-step-1',
        element: '[data-tour="company-info"]',
        title: 'Company Information',
        content: 'Add your company name, contact information, and logo. This information will appear on all your quotes.',
        position: 'right',
        showSkip: true,
        showPrevious: false,
      },
      {
        id: 'settings-step-2',
        element: '[data-tour="default-rates"]',
        title: 'Default Rates',
        content: 'Set your default markup and tax rates. These will be applied to new quotes automatically, but can be customized per quote.',
        position: 'left',
        showSkip: true,
        showPrevious: true,
      },
      {
        id: 'settings-step-3',
        element: '[data-tour="quote-terms"]',
        title: 'Quote Terms',
        content: 'Add default terms and conditions that will appear on all your quotes. You can customize these for each quote if needed.',
        position: 'top',
        showSkip: true,
        showPrevious: true,
      },
    ],
  },
  {
    id: 'analytics-tour',
    name: 'Understanding Your Analytics',
    description: 'Learn how to interpret your business metrics and insights',
    priority: 60,
    trigger: 'feature-access',
    conditions: {
      minQuotes: 5,
    },
    steps: [
      {
        id: 'analytics-step-1',
        element: '[data-tour="acceptance-rate"]',
        title: 'Quote Acceptance Rate',
        content: 'Track how many of your quotes are being accepted. This helps you understand your pricing and sales effectiveness.',
        position: 'bottom',
        showSkip: true,
        showPrevious: false,
      },
      {
        id: 'analytics-step-2',
        element: '[data-tour="revenue-tracking"]',
        title: 'Revenue Tracking',
        content: 'Monitor your potential and realized revenue. See trends over time to identify your best months.',
        position: 'top',
        showSkip: true,
        showPrevious: true,
      },
      {
        id: 'analytics-step-3',
        element: '[data-tour="client-insights"]',
        title: 'Client Insights',
        content: 'Understand your client relationships better. See which clients are most valuable and which might need attention.',
        position: 'left',
        showSkip: true,
        showPrevious: true,
      },
    ],
  },
];

// Tour recommendations based on user state
export function getRecommendedToursForUser(userState: {
  hasSeenWelcome: boolean;
  quoteCount: number;
  hasCompanySettings: boolean;
  hasItems: boolean;
  sessionCount: number;
}): string[] {
  const recommendations: string[] = [];

  // Always show welcome tour first for new users
  if (!userState.hasSeenWelcome) {
    recommendations.push('welcome-tour');
    return recommendations; // Only show welcome tour initially
  }

  // Settings tour for users without company settings
  if (!userState.hasCompanySettings) {
    recommendations.push('settings-tour');
  }

  // Quote creation tour for users with settings but no quotes
  if (userState.hasCompanySettings && userState.quoteCount === 0) {
    recommendations.push('quote-creation-tour');
  }

  // Item library tour for users with few items
  if (userState.quoteCount > 0 && !userState.hasItems) {
    recommendations.push('item-library-tour');
  }

  // Analytics tour for established users
  if (userState.quoteCount >= 5) {
    recommendations.push('analytics-tour');
  }

  return recommendations;
}