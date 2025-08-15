'use client';

import { ChevronDown,ChevronUp, MessageSquare, X } from 'lucide-react';
import React, { useCallback,useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';
import { cn } from '@/utils/cn';

import { SurveyModal } from './survey-modal';

/**
 * FeedbackWidget Props
 */
interface FeedbackWidgetProps {
  /** Position of the widget on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Theme variant */
  theme?: 'light' | 'dark' | 'auto';
  /** Whether the widget starts minimized */
  defaultMinimized?: boolean;
  /** Custom z-index for layering */
  zIndex?: number;
  /** Custom trigger button text */
  triggerText?: string;
  /** Disable the widget completely */
  disabled?: boolean;
  /** Custom class name for styling */
  className?: string;
  /** Show notification badge */
  showBadge?: boolean;
  /** Badge content text */
  badgeContent?: string;
}

/**
 * Widget state type
 */
type WidgetState = 'minimized' | 'expanded' | 'hidden';

/**
 * Position styles mapping
 */
const POSITION_STYLES = {
  'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
  'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
  'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
  'top-left': 'top-4 left-4 sm:top-6 sm:left-6',
} as const;

/**
 * FeedbackWidget Component
 * 
 * A floating feedback widget that integrates with Formbricks SDK
 * Features:
 * - Fixed positioning with smooth animations
 * - Responsive design for mobile and desktop
 * - Theme support (light/dark/auto)
 * - localStorage persistence for state
 * - Accessibility compliant
 * - Integration with existing Formbricks infrastructure
 */
export function FeedbackWidget({
  position = 'bottom-right',
  theme = 'auto',
  defaultMinimized = true,
  zIndex = 9999,
  triggerText = 'Feedback',
  disabled = false,
  className,
}: FeedbackWidgetProps) {
  // State management
  const [widgetState, setWidgetState] = useState<WidgetState>(
    defaultMinimized ? 'minimized' : 'expanded'
  );
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  // Hooks
  const { trackEvent, trackFeatureUsage, isAvailable } = useFormbricksTracking();

  /**
   * Detect system theme preference
   */
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'auto' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const effectiveTheme = theme === 'auto' ? systemTheme : theme;

  // localStorage key for persistence
  const storageKey = 'quotekit-feedback-widget-state';

  /**
   * Load persisted state from localStorage
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const { state, dismissed } = JSON.parse(stored);
        if (dismissed) {
          setIsVisible(false);
        } else if (state && ['minimized', 'expanded'].includes(state)) {
          setWidgetState(state);
        }
      }
    } catch (error) {
      console.warn('Failed to load feedback widget state:', error);
    }
  }, [storageKey]);

  /**
   * Persist state to localStorage
   */
  const persistState = useCallback((state: WidgetState, dismissed = false) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ 
        state, 
        dismissed,
        timestamp: Date.now() 
      }));
    } catch (error) {
      console.warn('Failed to save feedback widget state:', error);
    }
  }, [storageKey]);

  /**
   * Toggle widget between minimized and expanded
   */
  const toggleWidget = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newState = widgetState === 'minimized' ? 'expanded' : 'minimized';
    
    // Track the interaction
    trackFeatureUsage('feedback-widget', 'used', {
      action: newState === 'expanded' ? 'expand' : 'minimize',
      position,
    });

    setWidgetState(newState);
    persistState(newState);

    // Reset animation flag after transition
    setTimeout(() => setIsAnimating(false), 300);
  }, [widgetState, isAnimating, trackFeatureUsage, position, persistState]);

  /**
   * Dismiss the widget completely
   */
  const dismissWidget = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    
    // Track dismissal
    trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
      featureName: 'feedback-widget',
      action: 'dismissed',
      position,
    });

    setIsVisible(false);
    persistState(widgetState, true);

    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, trackEvent, position, widgetState, persistState]);

  /**
   * Open survey modal
   */
  const openSurvey = useCallback(() => {
    // Track survey initiation
    trackEvent(FORMBRICKS_EVENTS.HELP_REQUESTED, {
      source: 'feedback-widget',
      position,
    });

    setIsSurveyOpen(true);
  }, [trackEvent, position]);

  // Don't render if disabled, not available, or dismissed
  if (disabled || !isAvailable || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed transition-all duration-300 ease-in-out',
        POSITION_STYLES[position],
        className
      )}
      style={{ zIndex }}
    >
      {/* Minimized State - Trigger Button */}
      {widgetState === 'minimized' && (
        <Button
          onClick={toggleWidget}
          className={cn(
            'group relative overflow-hidden',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'shadow-lg hover:shadow-xl transition-all duration-300',
            'rounded-full px-4 py-2 flex items-center gap-2',
            'transform hover:scale-105 active:scale-95',
            // Pulse animation for attention
            'animate-pulse hover:animate-none'
          )}
          disabled={isAnimating}
          aria-label="Open feedback widget"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">{triggerText}</span>
          <ChevronUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
        </Button>
      )}

      {/* Expanded State - Widget Card */}
      {widgetState === 'expanded' && (
        <Card
          className={cn(
            'w-80 max-w-[calc(100vw-2rem)] shadow-xl',
            'transform transition-all duration-300 ease-in-out',
            'animate-in slide-in-from-bottom-2 fade-in-0',
            // Mobile responsiveness
            'sm:w-80 w-[calc(100vw-2rem)]',
            // Theme support
            effectiveTheme === 'dark' && 'dark'
          )}
          role="dialog"
          aria-labelledby="feedback-widget-title"
          aria-describedby="feedback-widget-description"
        >
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 id="feedback-widget-title" className="font-semibold text-sm">Share Your Feedback</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleWidget}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  aria-label="Minimize feedback widget"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissWidget}
                  className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Close feedback widget"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div id="feedback-widget-description" className="text-sm text-muted-foreground">
                Help us improve QuoteKit! Your feedback helps us build better features.
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={openSurvey}
                  className="w-full justify-start h-auto p-3 text-left"
                  variant="outline"
                >
                  <div>
                    <div className="font-medium text-sm">Quick Survey</div>
                    <div className="text-xs text-muted-foreground">
                      2-3 minutes to share your experience
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
                      featureName: 'feedback-widget',
                      action: 'feature-request',
                    });
                    // TODO: Open feature request form
                  }}
                  className="w-full justify-start h-auto p-3 text-left"
                  variant="outline"
                >
                  <div>
                    <div className="font-medium text-sm">Feature Request</div>
                    <div className="text-xs text-muted-foreground">
                      Suggest new features or improvements
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
                      featureName: 'feedback-widget',
                      action: 'bug-report',
                    });
                    // TODO: Open bug report form
                  }}
                  className="w-full justify-start h-auto p-3 text-left"
                  variant="outline"
                >
                  <div>
                    <div className="font-medium text-sm">Report Issue</div>
                    <div className="text-xs text-muted-foreground">
                      Found a bug? Let us know
                    </div>
                  </div>
                </Button>
              </div>

              {/* Footer */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Your feedback is anonymous and secure
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Survey Modal */}
      <SurveyModal
        isOpen={isSurveyOpen}
        onClose={() => setIsSurveyOpen(false)}
        onComplete={(responses) => {
          console.log('Survey completed:', responses);
          setIsSurveyOpen(false);
          
          // Track successful survey completion
          trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
            featureName: 'feedback-widget-survey',
            action: 'completed',
            responseCount: responses.length
          });
        }}
      />
    </div>
  );
}

/**
 * Hook to control the feedback widget visibility
 */
export function useFeedbackWidget() {
  const showWidget = useCallback(() => {
    try {
      localStorage.removeItem('quotekit-feedback-widget-state');
      window.location.reload();
    } catch (error) {
      console.warn('Failed to show feedback widget:', error);
    }
  }, []);

  const hideWidget = useCallback(() => {
    try {
      localStorage.setItem('quotekit-feedback-widget-state', JSON.stringify({
        state: 'minimized',
        dismissed: true,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to hide feedback widget:', error);
    }
  }, []);

  return { showWidget, hideWidget };
}