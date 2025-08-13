import { navigateForTour, validatePageForTour } from './navigation-helper'
import { TourConfig } from './tour-manager'

// S2.1: Freemium Feature Highlights Tour (Sprint 3)
export const FREEMIUM_HIGHLIGHTS_TOUR: TourConfig = {
  id: 'freemium-highlights',
  name: 'Discover Premium Features',
  description: 'Learn about advanced features available with premium plans',
  userTiers: ['free'], // Only show to free users
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'freemium-intro',
      title: 'Unlock More with Premium 🚀',
      description: 'You\'re currently on the Free plan with 5 quotes limit. Discover powerful features available with our Premium plan to grow your business faster.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'unlimited-quotes-highlight',
      element: '[data-tour="quote-limit-indicator"]',
      title: 'Unlimited Quotes 📈',
      description: 'Premium users can create unlimited quotes without restrictions. Perfect for growing businesses that need to send multiple quotes daily.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'pdf-export-highlight',
      element: '[data-tour="pdf-export-locked"]',
      title: 'Professional PDF Export 📄',
      description: 'Generate professional PDF quotes with your branding. Impress clients with polished, branded documents that stand out from the competition.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'analytics-highlight',
      element: '[data-tour="analytics-locked"]',
      title: 'Business Analytics 📊',
      description: 'Track your quote conversion rates, revenue trends, and client insights. Make data-driven decisions to grow your landscaping business.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'custom-branding-highlight',
      element: '[data-tour="branding-locked"]',
      title: 'Custom Branding 🎨',
      description: 'Add your logo, colors, and custom styling to quotes and emails. Build brand recognition and look more professional to clients.',
      position: 'right',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'upgrade-call-to-action',
      element: '[data-tour="upgrade-button"]',
      title: 'Ready to Upgrade? 💎',
      description: 'Start your free trial today and unlock all premium features. No commitment required - cancel anytime. Your business growth is worth the investment.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// S2.2: Mobile-Optimized Tours (Sprint 3)
export const MOBILE_OPTIMIZED_WELCOME_TOUR: TourConfig = {
  id: 'mobile-welcome',
  name: 'Mobile Welcome Tour',
  description: 'Mobile-optimized welcome experience',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['mobile', 'tablet'], // Mobile-specific
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'mobile-welcome-message',
      title: 'Welcome to LawnQuote Mobile! 📱',
      description: 'Manage your landscaping quotes on the go! This mobile-optimized tour will show you the key features designed for your phone or tablet.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'mobile-navigation',
      element: '[data-tour="mobile-menu-trigger"]',
      title: 'Mobile Navigation 📋',
      description: 'Tap the menu button to access all features. The mobile menu is optimized for touch interactions and easy one-handed use.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close'],
      onBeforeHighlight: () => {
        // Ensure mobile menu is accessible
        const menuTrigger = document.querySelector('[data-tour="mobile-menu-trigger"]')
        if (menuTrigger && window.innerWidth < 768) {
          (menuTrigger as HTMLElement).focus()
        }
      }
    },
    {
      id: 'mobile-quick-actions',
      element: '[data-tour="mobile-quick-actions"]',
      title: 'Quick Actions 🚀',
      description: 'Access your most common tasks with large, touch-friendly buttons. Create quotes, manage clients, and update settings with ease.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'mobile-swipe-gestures',
      title: 'Touch Gestures 👆',
      description: 'Use swipe gestures to navigate between quote steps, dismiss notifications, and browse your item library. Designed for natural mobile interaction.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'mobile-offline-support',
      title: 'Work Offline 📶',
      description: 'Continue working even with poor signal. Your changes sync automatically when connection is restored. Perfect for on-site quote creation.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// C1.1: Interactive Tutorial Tour (Sprint 3)
export const INTERACTIVE_TUTORIAL_TOUR: TourConfig = {
  id: 'interactive-tutorial',
  name: 'Hands-On Practice',
  description: 'Practice with real features in a safe environment',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'tutorial-intro',
      title: 'Interactive Learning Mode 🎯',
      description: 'This tutorial lets you practice with real features safely. All actions can be undone, so feel free to experiment and learn by doing.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'practice-client-creation',
      element: '[data-tour="client-selector"]',
      title: 'Practice: Add a Client 👤',
      description: 'Try adding a practice client. Click "Add New Client" and fill in some sample information. This won\'t affect your real client database.',
      position: 'bottom',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      onBeforeHighlight: async () => {
        await navigateForTour('/quotes/new');
      }
    },
    {
      id: 'practice-item-selection',
      element: '[data-tour="add-items"]',
      title: 'Practice: Add Line Items 🛠️',
      description: 'Now try adding some services or materials. Browse your item library and add a few items to see how pricing calculations work.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'practice-calculations',
      element: '[data-tour="quote-totals"]',
      title: 'Practice: Watch Calculations 💰',
      description: 'Notice how totals update automatically as you add items and adjust quantities. Try changing some quantities to see real-time calculations.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'practice-save-draft',
      element: '[data-tour="save-send-actions"]',
      title: 'Practice: Save as Draft 💾',
      description: 'Save this practice quote as a draft. You can always delete it later or use it as a template for real quotes.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'tutorial-cleanup',
      title: 'Practice Complete! ✅',
      description: 'Great job! You can now delete this practice quote or keep it as a template. All the skills you practiced apply to creating real quotes.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// C1.2: Personalized Onboarding Tour (Sprint 3)
export const PERSONALIZED_ONBOARDING_TOUR: TourConfig = {
  id: 'personalized-onboarding',
  name: 'Tailored Experience',
  description: 'Customized onboarding based on your business type and goals',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'personalization-intro',
      title: 'Welcome to Your Personalized Tour 🎯',
      description: 'Based on your business profile, we\'ve customized this experience to focus on features most relevant to your landscaping business.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'business-type-focus',
      title: 'Your Business Focus 🌱',
      description: 'We\'ve identified you as a landscaping professional. This tour will emphasize quote management, client communication, and business growth features.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'recommended-workflow',
      element: '[data-tour="quick-actions"]',
      title: 'Your Recommended Workflow 📋',
      description: 'For landscaping businesses, we recommend this workflow: 1) Set up your item library, 2) Configure company settings, 3) Create your first quote.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'industry-specific-tips',
      title: 'Landscaping Pro Tips 💡',
      description: 'Tip: Create categories like "Lawn Care", "Hardscaping", "Seasonal Services", and "Materials" to organize your services effectively.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'seasonal-considerations',
      title: 'Seasonal Business Planning 🍂',
      description: 'Consider creating seasonal service packages. Spring cleanup, summer maintenance, fall preparation, and winter services can be pre-configured for quick quoting.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'growth-recommendations',
      title: 'Business Growth Features 📈',
      description: 'As your business grows, consider using analytics to track conversion rates and client preferences. This helps optimize your pricing and services.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Feature-Specific Mini Tours (S1.3 - completing S1 requirements)
export const QUOTE_MANAGEMENT_MINI_TOUR: TourConfig = {
  id: 'quote-management-mini',
  name: 'Quote Management Tips',
  description: 'Quick tips for managing your quotes effectively',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: false,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'quote-status-management',
      element: '[data-tour="quote-status"]',
      title: 'Quote Status Tracking 📊',
      description: 'Track your quotes through Draft → Sent → Accepted/Declined. This helps you follow up at the right time and measure your success rate.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'quote-templates',
      element: '[data-tour="quote-templates"]',
      title: 'Save Time with Templates 📋',
      description: 'Create templates for common services like "Basic Lawn Care", "Spring Cleanup", or "Hardscape Installation" to speed up quote creation.',
      position: 'top',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

export const CLIENT_MANAGEMENT_MINI_TOUR: TourConfig = {
  id: 'client-management-mini',
  name: 'Client Management Tips',
  description: 'Best practices for managing client relationships',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: false,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'client-notes',
      element: '[data-tour="client-notes"]',
      title: 'Client Notes & History 📝',
      description: 'Keep detailed notes about client preferences, property details, and past conversations. This personal touch helps win more business.',
      position: 'right',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'client-communication',
      element: '[data-tour="client-communication"]',
      title: 'Professional Communication 💬',
      description: 'Use professional email templates and follow up promptly. Good communication is often the difference between winning and losing a job.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Export Sprint 3 tour configurations
export const SPRINT3_TOUR_CONFIGS: Record<string, TourConfig> = {
  'freemium-highlights': FREEMIUM_HIGHLIGHTS_TOUR,
  'mobile-welcome': MOBILE_OPTIMIZED_WELCOME_TOUR,
  'interactive-tutorial': INTERACTIVE_TUTORIAL_TOUR,
  'personalized-onboarding': PERSONALIZED_ONBOARDING_TOUR,
  'quote-management-mini': QUOTE_MANAGEMENT_MINI_TOUR,
  'client-management-mini': CLIENT_MANAGEMENT_MINI_TOUR
}
