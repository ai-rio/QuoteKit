import { navigateForTour } from './navigation-helper'
import {
  showValidationMessage
} from './popover-config'
import { SPRINT3_TOUR_CONFIGS } from './sprint3-tour-configs'
import {
  generateCoverageReport,
  markOperationCompleted,
  validateQuoteWorkflow,
  validateStep
} from './step-validation-system'
import { 
  handleMissingElement, 
  showTourError, 
  tourErrorHandler, 
  validateStepContext,
  waitForElement} from './tour-error-handler'
import { TourConfig } from './tour-manager'

// Welcome Tour - Dashboard Overview (M1.3 Specification)
export const WELCOME_TOUR: TourConfig = {
  id: 'welcome',
  name: 'Welcome to LawnQuote',
  description: 'Get started with your quote management system',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'welcome-message',
      title: 'Welcome to LawnQuote! 🌱',
      description: 'Welcome to your new quote management system! Let\'s take a quick tour to help you get started and discover all the powerful features available to grow your landscaping business.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'navigation-sidebar',
      element: '[data-tour="sidebar"]',
      title: 'Main Navigation',
      description: 'This is your main navigation sidebar. Access all features including Dashboard, Quotes, Items, Clients, Settings, and Account management from here.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      onBeforeHighlight: () => {
        // Ensure sidebar is visible on mobile
        const sidebarTrigger = document.querySelector('[data-tour="sidebar-trigger"]')
        if (sidebarTrigger && window.innerWidth < 768) {
          (sidebarTrigger as HTMLElement).click()
        }
      }
    },
    {
      id: 'dashboard-stats',
      element: '[data-tour="stats-cards"]',
      title: 'Dashboard Statistics',
      description: 'These cards show your business metrics at a glance - total quotes, sent quotes, accepted quotes, revenue, and library items. Perfect for tracking your progress!',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'quick-actions',
      element: '[data-tour="quick-actions"]',
      title: 'Quick Actions Panel',
      description: 'Access your most common tasks quickly from this panel. Create new quotes, manage existing ones, update your item library, and configure settings.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'account-menu',
      element: '[data-tour="account-menu"]',
      title: 'Account Menu',
      description: 'Click here to access your account settings, billing information, and subscription details. You can also sign out from this menu.',
      position: 'bottom',
      align: 'end',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'settings-access',
      element: '[data-tour="settings-link"]',
      title: 'Company Settings',
      description: 'Complete your company profile here to create professional quotes. Add your logo, contact information, and default pricing to get started.',
      position: 'left',
      align: 'center',
      showButtons: ['previous', 'close'],
      validation: () => {
        // Check if settings link is visible
        const settingsLink = document.querySelector('[data-tour="settings-link"]')
        return !!settingsLink
      }
    }
  ]
}

// Quote Creation Tour
export const QUOTE_CREATION_TOUR: TourConfig = {
  id: 'quote-creation',
  name: 'Create Your First Quote',
  description: 'Learn how to create professional quotes step by step',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  
  // Enhanced progress configuration
  progressText: 'Step {{current}} of {{total}} • {{percent}}% complete',
  popoverClass: 'enhanced-tour-popover tour-popover-with-progress',
  
  // Tour-level error recovery configuration
  onDestroyed: () => {
    try {
      // Clean up any tour-specific state
      document.querySelectorAll('[data-tour-active]').forEach(el => {
        el.removeAttribute('data-tour-active');
        el.removeAttribute('data-tour-hint');
        el.removeAttribute('aria-describedby');
      });
      
      // Clear any error notifications
      document.querySelectorAll('.tour-error-notification').forEach(notification => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
      
      console.log('Quote creation tour destroyed and cleaned up');
      
    } catch (error) {
      console.error('Error during tour cleanup:', error);
    }
  },
  
  onDestroyStarted: () => {
    try {
      // Log tour completion/cancellation
      const errorStats = tourErrorHandler.getErrorStats();
      console.log('Tour ending with error stats:', errorStats);
      
      // Track tour completion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'tour_ended', {
          tour_id: 'quote-creation',
          total_errors: errorStats.totalErrors,
          completed: true
        });
      }
      
    } catch (error) {
      console.error('Error during tour destroy start:', error);
    }
  },
  
  // Global lifecycle hooks for enhanced reliability
  onHighlightStarted: (element?: Element, step?: any, options?: any) => {
    try {
      if (!element) {
        // Use comprehensive error handling system
        const stepId = step?.id || 'unknown';
        const selectors = step?.element ? step.element.split(', ') : [];
        
        console.warn(`Tour step element not found: ${stepId}`);
        
        // Try to find element using error handler
        const foundElement = handleMissingElement(
          stepId,
          'quote-creation',
          selectors,
          {
            skipStep: false,
            retryCount: 2,
            showUserMessage: true,
            continueOnError: true
          }
        );

        if (!foundElement) {
          showTourError(
            `Step "${stepId}" is not available right now. The tour will continue with the next step.`,
            { type: 'warning', duration: 4000 }
          );
          return;
        }

        // Track missing element for analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'tour_element_missing', {
            step_id: stepId,
            tour_id: 'quote-creation',
            recovered: !!foundElement
          });
        }
        return;
      }

      // Validate step context
      const validation = validateStepContext(step?.id || 'unknown');
      if (!validation.isValid) {
        console.warn('Step context validation failed:', validation);
        if (validation.suggestions.length > 0) {
          showTourError(
            `${validation.suggestions[0]}`,
            { type: 'info', duration: 3000 }
          );
        }
      }

      // Ensure element is visible and properly positioned
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });

      // Add visual emphasis for better UX
      (element as HTMLElement).style.transition = 'all 0.3s ease';
      
      // Track successful step start
      console.log(`Tour step started: ${step?.id || 'unknown'}`);
      
    } catch (error) {
      console.error('Tour highlight error:', error);
      // Use error handler for user notification
      showTourError(
        'There was an issue with the tour. Please try refreshing the page.',
        { type: 'error', duration: 5000 }
      );
    }
  },

  onHighlighted: (element?: Element, step?: any, options?: any) => {
    try {
      // Confirm element is properly highlighted
      if (element) {
        // Add accessibility attributes
        element.setAttribute('aria-describedby', 'driver-popover');
        element.setAttribute('data-tour-active', 'true');
        
        // Validate element is interactive if required
        const stepId = step?.id || 'unknown';
        if (step?.interactive) {
          const isInteractive = element.matches('button, input, select, textarea, [role="button"], [tabindex]');
          if (!isInteractive) {
            console.warn(`Step ${stepId} marked as interactive but element is not interactive`);
            showTourError(
              'This element may not be ready for interaction yet.',
              { type: 'warning', duration: 2000 }
            );
          }
        }
        
        // Track step completion for analytics
        console.log(`Tour step highlighted: ${stepId}`);
        
        // Track successful highlight
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'tour_step_highlighted', {
            step_id: stepId,
            tour_id: 'quote-creation'
          });
        }
      } else {
        console.warn('Element is null in onHighlighted hook');
      }
    } catch (error) {
      console.error('Tour highlighted error:', error);
      showTourError(
        'There was an issue highlighting this step.',
        { type: 'warning', duration: 2000 }
      );
    }
  },

  onDeselected: (element?: Element, step?: any, options?: any) => {
    try {
      // Cleanup when leaving step
      if (element) {
        // Remove accessibility attributes
        element.removeAttribute('aria-describedby');
        element.removeAttribute('data-tour-active');
        element.removeAttribute('data-tour-hint');
        
        // Reset any visual changes
        (element as HTMLElement).style.transition = '';
        
        const stepId = step?.id || 'unknown';
        console.log(`Tour step deselected: ${stepId}`);
        
        // Track step completion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'tour_step_completed', {
            step_id: stepId,
            tour_id: 'quote-creation'
          });
        }
      }
      
      // Perform any step-specific cleanup
      const stepId = step?.id;
      if (stepId === 'client-selector-interaction') {
        // Ensure client selector is properly reset
        const clientInput = document.querySelector('[data-testid="client-selector"] input');
        if (clientInput && 'blur' in clientInput) {
          (clientInput as HTMLInputElement).blur();
        }
      }
      
    } catch (error) {
      console.error('Tour deselected error:', error);
      // Don't show user error for cleanup issues - just log
    }
  },
  steps: [
    {
      id: 'welcome-overview',
      title: 'Welcome to Quote Creation! 🎯',
      description: 'Let\'s walk through the complete quote creation process. This comprehensive tour will show you every step from client selection to final PDF generation. You\'ll learn best practices and time-saving tips along the way.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        await navigateForTour('/quotes/new');
      }
    },
    {
      id: 'page-overview-autosave',
      title: 'Smart Auto-Save System 💾',
      description: 'This quote creation page features intelligent auto-save every 30 seconds once you select a client. Your work is automatically preserved as drafts so you never lose progress, even if you close the browser.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        // Ensure we're on the quote creation page
        return window.location.pathname === '/quotes/new';
      }
    },
    {
      id: 'client-selection-intro',
      title: 'Client Information is Essential 👤',
      description: 'Every professional quote starts with client information. This appears on your final PDF and enables auto-save functionality. You can search existing clients or create new ones seamlessly.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'client-selector-interaction',
      element: '[data-testid="client-selector"], [data-tour="client-selector"], .client-selector-container, input[placeholder*="client"]',
      title: 'Smart Client Selector',
      description: 'Click here to search your client database or add a new client. Start typing to find existing clients, or select "Add New Client" to create one.',
      position: 'bottom',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      
      // Enhanced popover configuration with responsive design
      popover: {
        title: 'Smart Client Selector 👤',
        description: 'Click here to search your client database or add a new client. Start typing to find existing clients, or select "Add New Client" to create one. Client data is automatically saved for future quotes.',
        side: 'auto',
        align: 'start',
        showProgress: true,
        showEstimatedTime: true,
        estimatedTimeMinutes: 5,
        
        // Responsive configuration
        responsive: {
          mobile: {
            side: 'bottom',
            align: 'center',
            description: 'Tap to search clients or add new ones. Client data saves automatically for future quotes.'
          },
          tablet: {
            side: 'right',
            align: 'start'
          },
          desktop: {
            side: 'bottom',
            align: 'start'
          }
        },
        
        // Enhanced system validation with comprehensive coverage
        onNextClick: (element?: Element, step?: any, options?: any) => {
          // Use comprehensive step validation system
          const stepValidation = validateStep('client-selector-interaction');
          
          if (!stepValidation.isValid || !stepValidation.canProceed) {
            // Show specific validation messages
            if (stepValidation.missingOperations.length > 0) {
              const missingOps = stepValidation.missingOperations.map(op => op.name).join(', ');
              showValidationMessage(
                `Please complete these steps first: ${missingOps}`,
                'warning'
              );
            } else {
              showValidationMessage(
                'Please select or add a client before continuing. This is essential for creating a professional quote.',
                'warning'
              );
            }
            
            // Highlight the client selector to guide user
            const clientSelector = document.querySelector('[data-testid="client-selector"]');
            if (clientSelector) {
              (clientSelector as HTMLElement).style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.3)';
              setTimeout(() => {
                (clientSelector as HTMLElement).style.boxShadow = '';
              }, 2000);
            }
            
            return false; // Don't proceed
          }
          
          // Mark operation as completed
          markOperationCompleted('client_selection');
          
          // Show progress feedback
          const workflow = validateQuoteWorkflow();
          if (workflow.overallCompletion > 0) {
            showValidationMessage(
              `Great! Quote is ${Math.round(workflow.overallCompletion)}% complete. ${workflow.canCreateQuote ? 'Ready to create quote!' : 'Keep going!'}`,
              'info'
            );
          }
          
          return true; // Proceed to next step
        },
        
        className: 'client-selector-popover'
      },
      validation: () => {
        // Check multiple fallback selectors
        const clientSelector = document.querySelector('[data-testid="client-selector"]') ||
                              document.querySelector('[data-tour="client-selector"]') ||
                              document.querySelector('.client-selector-container') ||
                              document.querySelector('input[placeholder*="client"]');
        return !!clientSelector;
      },
      
      // Step-specific lifecycle hooks with enhanced error handling
      onHighlightStarted: async (element?: Element, step?: any, options?: any) => {
        try {
          if (!element) {
            console.warn('Client selector element not found, using dynamic content support...');
            
            // Use error handler's dynamic content support
            const selectors = [
              '[data-testid="client-selector"]',
              '[data-tour="client-selector"]',
              '.client-selector-container',
              'input[placeholder*="client"]'
            ];
            
            const foundElement = await waitForElement(selectors, 3000, 200);
            
            if (foundElement) {
              console.log('Client selector found with dynamic loading support');
              // Refresh the tour to use the found element
              if (options?.driver?.refresh) {
                options.driver.refresh();
              }
              return;
            } else {
              // Show helpful error message
              showTourError(
                'The client selector is not available yet. Make sure you\'re on the quote creation page.',
                { type: 'warning', duration: 4000 }
              );
              return;
            }
          }
          
          // Validate that client selector is functional
          const validation = validateStepContext('client-selector-interaction', [
            '[data-testid="client-selector"]'
          ]);
          
          if (!validation.isValid) {
            showTourError(
              validation.suggestions[0] || 'Client selector may not be ready yet.',
              { type: 'info', duration: 3000 }
            );
          }
          
          // Ensure client selector is ready for interaction
          const input = element.querySelector('input') || element;
          if (input && 'focus' in input) {
            // Briefly focus to show it's interactive (then blur to avoid keyboard on mobile)
            (input as HTMLInputElement).focus();
            setTimeout(() => (input as HTMLInputElement).blur(), 100);
          }
          
          // Add visual hint
          element.setAttribute('data-tour-hint', 'Click to search or add clients');
          
        } catch (error) {
          console.error('Client selector highlight error:', error);
          showTourError(
            'There was an issue with the client selector step.',
            { type: 'error', duration: 3000 }
          );
        }
      },
      
      onHighlighted: (element?: Element, step?: any, options?: any) => {
        try {
          // Add helpful visual cues
          if (element) {
            element.setAttribute('data-tour-hint', 'Click to search or add clients');
            
            // Track that user reached client selection step
            console.log('User reached client selection step');
          }
        } catch (error) {
          console.error('Client selector highlighted error:', error);
        }
      },
      
      onDeselected: (element?: Element, step?: any, options?: any) => {
        try {
          if (element) {
            element.removeAttribute('data-tour-hint');
          }
        } catch (error) {
          console.error('Client selector deselected error:', error);
        }
      }
    },
    {
      id: 'client-management-tips',
      element: '[data-tour="client-selector"]',
      title: 'New vs Existing Clients 💡',
      description: 'Pro tip: Building a client database saves time on repeat customers. New clients are automatically saved when you complete the quote. Existing clients can be quickly selected with auto-complete search.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'line-items-introduction',
      element: '[data-testid="line-items-card"], [data-tour="add-items"], .line-items-section',
      title: 'Your Service & Materials Hub 🛠️',
      description: 'This is where the magic happens! Add services and materials from your personal library. Each item can be customized with quantities, descriptions, and pricing specific to this quote.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close'],
      
      // Enhanced error handling for line items section
      onHighlightStarted: async (element?: Element, step?: any, options?: any) => {
        try {
          if (!element) {
            console.warn('Line items section not found, checking for dynamic loading...');
            
            const selectors = [
              '[data-testid="line-items-card"]',
              '[data-tour="add-items"]',
              '.line-items-section',
              '.quote-line-items'
            ];
            
            const foundElement = await waitForElement(selectors, 4000, 300);
            
            if (foundElement) {
              console.log('Line items section found with dynamic loading');
              if (options?.driver?.refresh) {
                options.driver.refresh();
              }
              return;
            } else {
              showTourError(
                'The line items section is not available. Make sure you\'re on the quote creation page and it has fully loaded.',
                { type: 'warning', duration: 5000 }
              );
              return;
            }
          }
          
          // Validate line items context
          const validation = validateStepContext('line-items-introduction', [
            '[data-testid="line-items-card"]'
          ]);
          
          if (!validation.isValid) {
            showTourError(
              'The line items section may not be fully loaded yet.',
              { type: 'info', duration: 3000 }
            );
          }
          
          // Ensure section is visible
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
        } catch (error) {
          console.error('Line items introduction error:', error);
          showTourError(
            'There was an issue with the line items section.',
            { type: 'error', duration: 3000 }
          );
        }
      }
    },
    {
      id: 'add-items-process',
      element: '[data-testid="item-search-add"], [data-tour="item-search-add"], button:has-text("Add Item"), .add-item-button',
      title: 'Enhanced Item Addition Process 🔍',
      description: 'Click "Add Item" to browse your complete library. Use search and category filters to quickly find what you need.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close'],
      
      // Enhanced popover with interactive guidance
      popover: {
        title: 'Add Items to Your Quote 🔍',
        description: 'Click "Add Item" to browse your complete library. Use search and category filters to quickly find what you need. Items are organized by categories like "Lawn Care", "Hardscaping", and "Materials" for easy navigation.',
        side: 'auto',
        align: 'center',
        showProgress: true,
        showEstimatedTime: true,
        estimatedTimeMinutes: 5,
        
        // Responsive configuration
        responsive: {
          mobile: {
            side: 'top',
            align: 'center',
            description: 'Tap "Add Item" to browse your library. Use search to find items quickly.'
          },
          tablet: {
            side: 'bottom',
            align: 'center'
          },
          desktop: {
            side: 'bottom',
            align: 'center'
          }
        },
        
        // Comprehensive system validation for line items
        onNextClick: (element?: Element, step?: any, options?: any) => {
          // Use comprehensive step validation system
          const stepValidation = validateStep('add-items-process');
          
          if (!stepValidation.isValid || !stepValidation.canProceed) {
            // Check if this is a dependency issue
            if (stepValidation.missingOperations.length > 0) {
              const missingOps = stepValidation.missingOperations.map(op => op.name).join(', ');
              showValidationMessage(
                `Please complete these steps first: ${missingOps}`,
                'warning'
              );
              return false;
            }
            
            // Check if items have been added
            const hasItems = document.querySelectorAll('[data-testid="line-item-row"]').length > 0;
            const itemDialog = document.querySelector('[role="dialog"]');
            
            if (!hasItems && !itemDialog) {
              showValidationMessage(
                'Try clicking "Add Item" to see how easy it is to add services and materials to your quote!',
                'info'
              );
              
              // Highlight the add button with a gentle pulse
              const addButton = document.querySelector('[data-testid="item-search-add"]');
              if (addButton) {
                (addButton as HTMLElement).style.animation = 'pulse 1s ease-in-out 3';
                (addButton as HTMLElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3)';
                
                setTimeout(() => {
                  (addButton as HTMLElement).style.animation = '';
                  (addButton as HTMLElement).style.boxShadow = '';
                }, 3000);
              }
              
              return false;
            }
          }
          
          // Mark operation as completed if items exist
          const hasItems = document.querySelectorAll('[data-testid="line-item-row"]').length > 0;
          if (hasItems) {
            markOperationCompleted('line_items_addition');
            
            // Show progress feedback
            const workflow = validateQuoteWorkflow();
            showValidationMessage(
              `Excellent! Quote is ${Math.round(workflow.overallCompletion)}% complete. ${workflow.canCreateQuote ? '✅ Ready to create quote!' : 'Keep adding details!'}`,
              'info'
            );
          }
          
          return true; // Proceed to next step
        },
        
        className: 'add-items-popover'
      },
      
      validation: () => {
        // Check multiple fallback selectors
        const addButton = document.querySelector('[data-testid="item-search-add"]') ||
                          document.querySelector('[data-tour="item-search-add"]') ||
                          document.querySelector('button:has-text("Add Item")') ||
                          document.querySelector('[data-testid="line-items-card"]');
        return !!addButton;
      }
    },
    {
      id: 'item-library-search',
      element: '[data-testid="item-library-search"], [data-tour="item-library-search"], input[placeholder*="Search items"]',
      title: 'Search & Filter Your Library 📚',
      description: 'When the item selector opens, you\'ll see search and category filters. This becomes invaluable as your library grows. You can also preview item details before adding them to your quote.',
      position: 'top',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        // This element might not be visible until dialog opens - that's okay
        return true;
      }
    },
    {
      id: 'quantity-price-adjustments',
      element: '[data-tour="line-items-table"]',
      title: 'Real-Time Quantity & Price Control ⚡',
      description: 'Once items are added, adjust quantities and modify prices directly in the table. Everything updates in real-time! You can also edit item descriptions to customize them for this specific client.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'item-management-features',
      element: '[data-tour="item-actions"]',
      title: 'Complete Item Management 📝',
      description: 'Each line item has actions for editing quantities, updating prices, and removal. The enhanced table supports inline editing and provides instant feedback on all changes. Watch the totals update automatically!',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        // Check if we have any line items or fallback to table area
        const itemActions = document.querySelector('[data-tour="item-actions"]') ||
                           document.querySelector('[data-tour="line-items-table"]');
        return !!itemActions;
      }
    },
    {
      id: 'financial-settings-intro',
      element: '[data-testid="financial-settings"], [data-tour="financial-settings"], .financial-settings-section',
      title: 'Professional Financial Configuration 💰',
      description: 'Set your tax and markup rates here. These settings determine your profit margins and ensure compliance with local tax requirements. You can set defaults in company settings to save time.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'tax-rate-setup',
      element: '[data-tour="tax-rate-input"]',
      title: 'Tax Rate Configuration 📊',
      description: 'Enter your local tax rate as a percentage (e.g., 8.25 for 8.25%). This varies by location, so check your local requirements. Tax is calculated on the subtotal and clearly shown to clients.',
      position: 'bottom',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        // Look for tax rate input or fallback to financial settings
        const taxInput = document.querySelector('[data-testid="tax-rate-input"]') ||
                        document.querySelector('[data-tour="tax-rate-input"]') ||
                        document.querySelector('input[id="tax-rate"]') ||
                        document.querySelector('[data-testid="financial-settings"]');
        return !!taxInput;
      }
    },
    {
      id: 'markup-strategy',
      element: '[data-tour="markup-rate-input"]',
      title: 'Profit Margin Strategy 🎯',
      description: 'Your markup percentage covers overhead, profit, and business expenses. Typical ranges: 15-30% for services, 20-50% for products. This is your business growth engine - price appropriately!',
      position: 'bottom',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        // Look for markup rate input or fallback to financial settings
        const markupInput = document.querySelector('[data-testid="markup-rate-input"]') ||
                           document.querySelector('[data-tour="markup-rate-input"]') ||
                           document.querySelector('input[id="markup-rate"]') ||
                           document.querySelector('[data-testid="financial-settings"]');
        return !!markupInput;
      }
    },
    {
      id: 'quote-calculations',
      element: '[data-testid="quote-totals"], [data-tour="quote-totals"], .quote-totals-section',
      title: 'Transparent Quote Calculations 🧮',
      description: 'Watch your quote totals update in real-time! The breakdown shows subtotal, tax amount, markup amount, and final total. This transparency builds trust with clients and ensures accurate pricing.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'save-generate-actions',
      element: '[data-testid="save-send-actions"], [data-tour="save-send-actions"], .save-actions-section',
      title: 'Professional Quote Completion 🚀',
      description: 'You have three options: Save as Draft (continue later), Generate PDF (create final quote), or both! Final quotes get automatic numbering and can be emailed directly to clients.',
      position: 'top',
      align: 'center',
      showButtons: ['previous', 'close'],
      
      // Comprehensive system validation on final step
      popover: {
        title: 'Quote Completion & System Readiness ✅',
        description: 'Let\'s verify your quote is ready for professional use. We\'ll check all essential components and provide recommendations.',
        side: 'auto',
        align: 'center',
        showProgress: true,
        showEstimatedTime: false,
        
        // Final validation before completion
        onCloseClick: (element?: Element, step?: any, options?: any) => {
          // Perform comprehensive system validation
          const workflow = validateQuoteWorkflow();
          // const coverage = getSystemCoverage(); // Available for future use
          
          // Generate completion report
          let message = '';
          let messageType: 'info' | 'warning' | 'error' = 'info';
          
          if (workflow.canCreateQuote) {
            message = `🎉 Excellent! Your quote system is ${Math.round(workflow.overallCompletion)}% ready. You can now create professional quotes!`;
            messageType = 'info';
            
            // Mark final operations as completed
            markOperationCompleted('quote_calculation');
            
          } else {
            const essentialMissing = workflow.missingEssentials.map(op => op.name).join(', ');
            message = `⚠️ Almost there! Please complete these essential steps: ${essentialMissing}`;
            messageType = 'warning';
          }
          
          // Add recommendations if any
          if (workflow.recommendations.length > 0) {
            message += `

💡 Recommendations: ${workflow.recommendations.slice(0, 2).join(', ')}`;
          }
          
          showValidationMessage(message, messageType);
          
          // Log coverage report for debugging
          console.log('System Coverage Report:', generateCoverageReport());
          
          return true; // Allow tour to close
        }
      },
      
      onBeforeHighlight: () => {
        // Scroll to make sure save actions are visible
        const saveActions = document.querySelector('[data-testid="save-send-actions"]') ||
                           document.querySelector('[data-tour="save-send-actions"]');
        if (saveActions) {
          saveActions.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Perform pre-completion validation
        const workflow = validateQuoteWorkflow();
        console.log('Pre-completion validation:', workflow);
      }
    }
  ]
}

// Settings Configuration Tour
export const SETTINGS_TOUR: TourConfig = {
  id: 'settings',
  name: 'Company Setup',
  description: 'Configure your company information for professional quotes',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'settings-navigation',
      title: 'Company Settings Setup 🏢',
      description: 'Let\'s configure your company information to create professional, branded quotes. This is essential for making a great first impression with clients.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        // Navigate to settings page if not already there
        await navigateForTour('/settings');
      }
    },
    {
      id: 'company-profile',
      element: '[data-tour="company-profile"]',
      title: 'Company Profile Information',
      description: 'Add your business name, address, phone, and email. This information appears on all your quotes and helps establish credibility.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        const companyProfile = document.querySelector('[data-tour="company-profile"]')
        return !!companyProfile
      }
    },
    {
      id: 'logo-upload',
      element: '[data-tour="logo-upload"]',
      title: 'Upload Your Company Logo 🎨',
      description: 'Upload your company logo to brand your quotes professionally. Supports PNG, JPG, and SVG formats. A good logo builds trust with clients.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'financial-defaults',
      element: '[data-tour="financial-defaults"]',
      title: 'Financial Settings 💰',
      description: 'Set your default tax rate, markup percentage, and preferred currency. These will be automatically applied to new quotes, saving you time.',
      position: 'right',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'quote-terms',
      element: '[data-tour="quote-terms"]',
      title: 'Terms & Conditions 📋',
      description: 'Add your standard terms and conditions that will appear on all quotes. Include warranty information, payment terms, and service details.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'save-settings',
      element: '[data-tour="save-settings"]',
      title: 'Save Your Configuration ✅',
      description: 'Don\'t forget to save your settings! Once saved, these defaults will be applied to all new quotes, making quote creation much faster.',
      position: 'top',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Item Library Tour
export const ITEM_LIBRARY_TOUR: TourConfig = {
  id: 'item-library',
  name: 'Item Library Management',
  description: 'Learn how to manage your services and materials library',
  prerequisites: ['welcome'],
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'item-library-intro',
      title: 'Item Library Overview 📚',
      description: 'Your item library is the foundation of quick quote creation. Store all your services and materials here with default prices and descriptions.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close'],
      onBeforeHighlight: async () => {
        // Navigate to items page if not already there
        await navigateForTour('/items');
      }
    },
    {
      id: 'add-item',
      element: '[data-tour="add-item"]',
      title: 'Add New Items ➕',
      description: 'Click here to add your services and materials. Set default prices, descriptions, units, and categories for quick quote creation.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close'],
      validation: () => {
        const addButton = document.querySelector('[data-tour="add-item"]')
        return !!addButton
      }
    },
    {
      id: 'item-categories',
      element: '[data-tour="categories"]',
      title: 'Organize with Categories 🗂️',
      description: 'Use categories to organize your items efficiently. Create categories like "Lawn Care", "Hardscaping", "Materials", "Equipment", etc.',
      position: 'right',
      align: 'start',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'item-list',
      element: '[data-tour="items-list"]',
      title: 'Your Item Collection',
      description: 'All your items are displayed here. You can edit prices, update descriptions, and manage availability. Items marked as favorites appear first in quote creation.',
      position: 'top',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'item-search-filter',
      element: '[data-tour="search-filter"]',
      title: 'Search & Filter Tools 🔍',
      description: 'Use search and category filters to quickly find items when creating quotes. This becomes very useful as your library grows.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'global-library',
      element: '[data-tour="global-library"]',
      title: 'Global Item Library 🌍',
      description: 'Browse our pre-built library of common landscaping services and materials. Copy items to your personal library to save time on setup.',
      position: 'top',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Pro Features Tour (for Pro users only)
export const PRO_FEATURES_TOUR: TourConfig = {
  id: 'pro-features',
  name: 'Pro Features Overview',
  description: 'Discover advanced features available with your Pro subscription',
  userTiers: ['pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  steps: [
    {
      id: 'unlimited-quotes',
      title: 'Unlimited Quotes',
      description: 'As a Pro user, you can create unlimited quotes without any restrictions. Perfect for growing businesses!',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'advanced-analytics',
      element: '[data-tour="analytics-link"]',
      title: 'Advanced Analytics',
      description: 'Access detailed business analytics including conversion rates, revenue trends, and client insights.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'custom-branding',
      title: 'Custom Branding',
      description: 'Customize your quote templates with your brand colors, fonts, and layout preferences.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'priority-support',
      title: 'Priority Support',
      description: 'Get priority email support and access to our knowledge base for any questions or issues.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Contextual Help Tour (S1.1 - Should Have)
export const CONTEXTUAL_HELP_TOUR: TourConfig = {
  id: 'contextual-help',
  name: 'Contextual Help System',
  description: 'Learn how to get help when you need it',
  userTiers: ['free', 'pro', 'enterprise'],
  deviceTypes: ['desktop', 'mobile', 'tablet'],
  showProgress: true,
  allowClose: true,
  overlayClickBehavior: 'ignore',
  steps: [
    {
      id: 'help-introduction',
      title: 'Getting Help When You Need It 🆘',
      description: 'QuoteKit provides contextual help throughout the application. Look for help icons and tooltips to get assistance with any feature.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'close']
    },
    {
      id: 'help-tooltips',
      element: '[data-tour="help-tooltip"]',
      title: 'Interactive Tooltips',
      description: 'Hover over or click these help icons to get detailed explanations about specific features and best practices.',
      position: 'bottom',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'help-buttons',
      element: '[data-tour="help-button"]',
      title: 'Help Buttons',
      description: 'Click these help buttons to launch specific mini-tours or get detailed guidance for complex workflows.',
      position: 'left',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

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
      element: '[data-testid="quote-totals"], [data-tour="quote-totals"], .quote-totals-section',
      title: 'Practice: Watch Calculations 💰',
      description: 'Notice how totals update automatically as you add items and adjust quantities. Try changing some quantities to see real-time calculations.',
      position: 'left',
      align: 'center',
      showButtons: ['next', 'previous', 'close']
    },
    {
      id: 'practice-save-draft',
      element: '[data-testid="save-send-actions"], [data-tour="save-send-actions"], .save-actions-section',
      title: 'Practice: Save as Draft 💾',
      description: 'Save this practice quote as a draft. You can always delete it later or use it as a template for real quotes.',
      position: 'top',
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
      id: 'growth-recommendations',
      title: 'Business Growth Features 📈',
      description: 'As your business grows, consider using analytics to track conversion rates and client preferences. This helps optimize your pricing and services.',
      position: 'bottom',
      align: 'center',
      showButtons: ['previous', 'close']
    }
  ]
}

// Export all tour configurations
export const TOUR_CONFIGS: Record<string, TourConfig> = {
  welcome: WELCOME_TOUR,
  'quote-creation': QUOTE_CREATION_TOUR,
  settings: SETTINGS_TOUR,
  'item-library': ITEM_LIBRARY_TOUR,
  'pro-features': PRO_FEATURES_TOUR,
  'contextual-help': CONTEXTUAL_HELP_TOUR,
  'freemium-highlights': FREEMIUM_HIGHLIGHTS_TOUR,
  'interactive-tutorial': INTERACTIVE_TUTORIAL_TOUR,
  'personalized-onboarding': PERSONALIZED_ONBOARDING_TOUR,
  ...SPRINT3_TOUR_CONFIGS
}

// Helper function to get tour config by ID
export function getTourConfig(tourId: string): TourConfig | undefined {
  return TOUR_CONFIGS[tourId]
}

// Helper function to get tours available for user tier
export function getToursForTier(userTier: 'free' | 'pro' | 'enterprise'): TourConfig[] {
  return Object.values(TOUR_CONFIGS).filter(tour => 
    tour.userTiers?.includes(userTier) ?? true
  )
}

// Helper function to get prerequisite chain
export function getTourPrerequisites(tourId: string): string[] {
  const tour = getTourConfig(tourId)
  if (!tour?.prerequisites) return []
  
  const chain: string[] = []
  const visited = new Set<string>()
  
  function buildChain(id: string) {
    if (visited.has(id)) return // Prevent circular dependencies
    visited.add(id)
    
    const config = getTourConfig(id)
    if (config?.prerequisites) {
      for (const prereq of config.prerequisites) {
        buildChain(prereq)
        if (!chain.includes(prereq)) {
          chain.push(prereq)
        }
      }
    }
  }
  
  buildChain(tourId)
  return chain
}