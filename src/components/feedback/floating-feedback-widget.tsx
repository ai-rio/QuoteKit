'use client';

import { AlertCircle, ChevronUp, Heart, Lightbulb, MessageCircle, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { FormbricksManager } from '@/libs/formbricks/formbricks-manager';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';
import { cn } from '@/utils/cn';

interface FloatingFeedbackWidgetProps {
  /** Position of the widget on screen */
  position?: 'bottom-right' | 'bottom-left' | 'right' | 'left';
  /** Custom className for styling */
  className?: string;
  /** Hide widget on specific pages (pathname patterns) */
  hideOnPages?: string[];
  /** Show widget only on specific pages (pathname patterns) */
  showOnPages?: string[];
  /** Delay before showing widget (ms) */
  showDelay?: number;
  /** Auto hide after inactivity (ms, 0 to disable) */
  autoHideAfter?: number;
  /** Custom feedback options */
  feedbackOptions?: FeedbackOption[];
}

interface FeedbackOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  formbricksEvent?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const defaultFeedbackOptions: FeedbackOption[] = [
  {
    id: 'general',
    label: 'General Feedback',
    icon: MessageCircle,
    description: 'Share your thoughts about LawnQuote',
    formbricksEvent: 'feedback_general',
    color: 'blue'
  },
  {
    id: 'feature-request',
    label: 'Feature Request',
    icon: Lightbulb,
    description: 'Suggest a new feature or improvement',
    formbricksEvent: 'feedback_feature_request', // Working!
    color: 'yellow'
  },
  {
    id: 'bug-report',
    label: 'Report Issue',
    icon: AlertCircle,
    description: 'Report a bug or technical issue',
    formbricksEvent: 'feedback_bug_report', // New action class key
    color: 'red'
  }
  // Adding incrementally - next will be appreciation survey
];;;;;;

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
};

export function FloatingFeedbackWidget({
  position = 'bottom-right',
  className,
  hideOnPages = [],
  showOnPages = [],
  showDelay = 3000,
  autoHideAfter = 0,
  feedbackOptions = defaultFeedbackOptions
}: FloatingFeedbackWidgetProps) {

  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  const { trackEvent, trackFeatureUsage, isAvailable: formbricksAvailable } = useFormbricksTracking();

  // Track current pathname
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
      
      const handleRouteChange = () => {
        setCurrentPath(window.location.pathname);
      };
      
      // Listen for navigation changes (including Next.js router)
      window.addEventListener('popstate', handleRouteChange);
      
      // Also listen for pushstate/replacestate (for Next.js navigation)
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        handleRouteChange();
      };
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        handleRouteChange();
      };
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      };
    }
  }, []);

  // Determine if widget should be shown on current page
  const shouldShowOnPage = useCallback(() => {
    if (!currentPath) return false;

    // If hideOnPages is specified, check if current path matches any pattern
    if (hideOnPages.length > 0) {
      const shouldHide = hideOnPages.some(pattern => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(currentPath);
      });
      if (shouldHide) return false;
    }

    // If showOnPages is specified, only show on matching pages
    if (showOnPages.length > 0) {
      return showOnPages.some(pattern => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(currentPath);
      });
    }

    // Default: show on all pages unless specifically hidden
    return true;
  }, [currentPath, hideOnPages, showOnPages]);

  // Handle visibility with delay
  useEffect(() => {
    if (!shouldShowOnPage()) {
      setIsVisible(false);
      return;
    }

    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, showDelay);

    return () => clearTimeout(showTimer);
  }, [shouldShowOnPage, showDelay]);

  // Handle auto-hide
  useEffect(() => {
    if (!autoHideAfter || !isVisible) return;

    const hideTimer = setTimeout(() => {
      setIsMinimized(true);
    }, autoHideAfter);

    return () => clearTimeout(hideTimer);
  }, [isVisible, autoHideAfter]);

  // Handle toggle expanded state
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      trackFeatureUsage('floating_feedback_widget', 'used', {
        action: newState ? 'expanded' : 'collapsed',
        page: currentPath
      });
      return newState;
    });
  }, [trackFeatureUsage, currentPath]);

  // Handle feedback option click
  const handleFeedbackOption = useCallback((option: FeedbackOption) => {
    const isDebugMode = typeof window !== 'undefined' && window.location.search.includes('formbricksDebug=true');
    
    if (isDebugMode) {
      // Clear localStorage entries that might prevent survey display
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('formbricks') || key.includes('survey')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Clear sessionStorage entries
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.includes('formbricks') || key.includes('survey')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    }
    
    // Track the feedback option selection
    trackEvent(FORMBRICKS_EVENTS.HELP_REQUESTED, {
      feedbackType: option.id,
      feedbackLabel: option.label,
      page: currentPath,
      widgetPosition: position
    });

    // Track custom Formbricks event if specified
    if (option.formbricksEvent) {
      trackEvent(option.formbricksEvent, {
        optionId: option.id,
        optionLabel: option.label,
        page: currentPath
      });
    }

    // Force Formbricks to check for surveys using FormbricksManager
    const formbricksManager = FormbricksManager.getInstance();
    
    if (formbricksManager.isInitialized()) {
      
      try {
        // In debug mode, reset the user session
        if (isDebugMode) {
          formbricksManager.resetUser();
        }
        
        // Force Formbricks to register route change to trigger surveys
        formbricksManager.registerRouteChange();
        
        // Additional attempt to trigger surveys in debug mode
        if (isDebugMode) {
          setTimeout(() => {
            formbricksManager.registerRouteChange();
          }, 500);
        }
      } catch (error) {
        console.warn('Failed to trigger Formbricks route change:', error);
      }
    } else {
      console.warn('FormbricksManager not initialized - cannot trigger surveys');
    }

    // Wait a moment, then check if survey appeared
    setTimeout(() => {
      // Enhanced survey detection
      const surveySelectors = [
        '[role="dialog"]',
        '.modal',
        '[data-testid*="survey"]',
        '[class*="survey"]',
        '[class*="formbricks"]',
        '[id*="formbricks"]',
        '[data-formbricks]',
        '.fb-survey',
        '#formbricks-modal'
      ];
      
      let possibleSurvey = null;
      for (const selector of surveySelectors) {
        possibleSurvey = document.querySelector(selector);
        if (possibleSurvey) {
          // Check if the container has actual content
          const hasContent = possibleSurvey.children.length > 0 || possibleSurvey.textContent?.trim().length > 0;
          const isVisible = window.getComputedStyle(possibleSurvey).display !== 'none' && 
                           window.getComputedStyle(possibleSurvey).visibility !== 'hidden' &&
                           window.getComputedStyle(possibleSurvey).opacity !== '0';
          
          if (hasContent && isVisible) {
            setIsExpanded(false);
            return;
          }
          break;
        }
      }
      
      if (!possibleSurvey) {
        // Keep widget open for retry - don't close if no survey appeared
        return;
      }
      
    }, 2000);
  }, [trackEvent, currentPath, position]);

  // Handle widget close
  const handleClose = useCallback(() => {
    setIsVisible(false);
    
    trackFeatureUsage('floating_feedback_widget', 'used', {
      action: 'closed',
      page: currentPath
    });
  }, [trackFeatureUsage, currentPath]);

  // Handle minimize/restore
  const handleToggleMinimize = useCallback(() => {
    setIsMinimized(prev => {
      const newState = !prev;
      
      trackFeatureUsage('floating_feedback_widget', 'used', {
        action: newState ? 'minimized' : 'restored',
        page: currentPath
      });

      return newState;
    });
  }, [trackFeatureUsage, currentPath]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6', 
    'right': 'right-6 top-1/2 -translate-y-1/2',
    'left': 'left-6 top-1/2 -translate-y-1/2'
  };

  // Don't render if not visible or Formbricks is not available  
  if (!isVisible || !formbricksAvailable) {
    return null;
  }

  return (
    <div 
      data-widget="floating-feedback"
      className={cn(
        'fixed flex flex-col items-end',
        positionClasses[position],
        className
      )}
      style={{ zIndex: 10020 }}
    >
      {/* Expanded Options Panel */}
      {isExpanded && !isMinimized && (
        <div 
          className="mb-3 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-80 animate-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Share Feedback</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleToggleExpanded}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {feedbackOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFeedbackOption(option);
                  }}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                    colorClasses[option.color]
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{option.label}</h4>
                      <p className="text-sm opacity-80 mt-1">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            Your feedback helps us improve LawnQuote
          </p>
        </div>
      )}

      {/* Main Widget Button */}
      <div className={cn(
        'relative',
        isMinimized && 'opacity-50 hover:opacity-100 transition-opacity'
      )}>
        {/* Minimize/Restore Button */}
        {!isMinimized && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleMinimize}
            className="absolute -top-2 -left-2 h-6 w-6 p-0 bg-white shadow-md rounded-full border hover:bg-gray-50 z-10"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        )}
        
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-white shadow-md rounded-full border hover:bg-gray-50 z-10"
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Main Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMinimized) {
              handleToggleMinimize();
            } else {
              handleToggleExpanded();
            }
          }}
          className={cn(
            'h-14 w-14 rounded-full bg-forest-green hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300',
            'hover:scale-110 active:scale-95',
            isExpanded && 'bg-green-700 shadow-xl scale-110',
            isMinimized && 'h-10 w-10'
          )}
        >
          <MessageCircle className={cn(
            'transition-transform duration-200',
            isMinimized ? 'h-4 w-4' : 'h-6 w-6',
            isExpanded && 'rotate-12'
          )} />
        </Button>

        {/* Pulse Animation Ring */}
        {!isExpanded && !isMinimized && (
          <div className="absolute inset-0 rounded-full bg-forest-green animate-ping opacity-20 pointer-events-none" />
        )}
      </div>
    </div>
  );
}