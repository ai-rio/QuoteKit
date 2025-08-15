'use client';

import { Bug, ChevronDown,Lightbulb, MessageSquare, Star } from 'lucide-react';
import React, { useCallback, useRef,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';
import { cn } from '@/utils/cn';

import { SurveyModal } from './survey-modal';

/**
 * Feedback trigger variants
 */
type TriggerVariant = 'button' | 'fab' | 'inline' | 'minimal';

/**
 * Feedback types
 */
type FeedbackType = 'survey' | 'feature-request' | 'bug-report' | 'general';

/**
 * FeedbackTrigger Props
 */
interface FeedbackTriggerProps {
  /** Visual variant of the trigger */
  variant?: TriggerVariant;
  /** Size of the trigger */
  size?: 'sm' | 'md' | 'lg';
  /** Custom text for the trigger */
  text?: string;
  /** Show a notification badge */
  showBadge?: boolean;
  /** Badge text/number */
  badgeContent?: string | number;
  /** Default feedback type to show */
  defaultType?: FeedbackType;
  /** Position for popover triggers */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom icon */
  icon?: React.ReactNode;
}

/**
 * Feedback option configuration
 */
interface FeedbackOption {
  type: FeedbackType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

/**
 * FeedbackTrigger Component
 * 
 * A versatile trigger button for collecting user feedback
 * Features:
 * - Multiple visual variants (button, FAB, inline, minimal)
 * - Popover with different feedback types
 * - Integration with SurveyModal
 * - Hover and focus states
 * - Accessibility compliant
 * - Badge notifications
 */
export function FeedbackTrigger({
  variant = 'button',
  size = 'md',
  text = 'Feedback',
  showBadge = false,
  badgeContent,
  defaultType = 'survey',
  position = 'bottom',
  disabled = false,
  className,
  icon
}: FeedbackTriggerProps) {
  // State management
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  // Refs
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Hooks
  const { trackEvent, trackFeatureUsage } = useFormbricksTracking();

  /**
   * Handle opening different feedback types
   */
  const handleFeedbackType = useCallback((type: FeedbackType) => {
    setSelectedFeedbackType(type);
    setIsPopoverOpen(false);

    // Track the interaction
    trackFeatureUsage('feedback-trigger', 'used', {
      feedbackType: type,
      variant,
      triggerSource: 'popover'
    });

    switch (type) {
      case 'survey':
        setIsSurveyOpen(true);
        break;
      case 'feature-request':
        trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
          featureName: 'feedback-trigger',
          action: 'feature-request-clicked'
        });
        // TODO: Open feature request form
        console.log('Opening feature request form...');
        break;
      case 'bug-report':
        trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
          featureName: 'feedback-trigger',
          action: 'bug-report-clicked'
        });
        // TODO: Open bug report form
        console.log('Opening bug report form...');
        break;
      case 'general':
        trackEvent(FORMBRICKS_EVENTS.HELP_REQUESTED, {
          source: 'feedback-trigger',
          type: 'general-feedback'
        });
        // TODO: Open general feedback form
        console.log('Opening general feedback form...');
        break;
    }
  }, [variant, trackEvent, trackFeatureUsage]);

  /**
   * Feedback options configuration
   */
  const feedbackOptions: FeedbackOption[] = [
    {
      type: 'survey',
      title: 'Quick Survey',
      description: 'Help us improve with a short survey',
      icon: <Star className="h-4 w-4" />,
      color: 'text-yellow-600',
      action: () => handleFeedbackType('survey')
    },
    {
      type: 'feature-request',
      title: 'Feature Request',
      description: 'Suggest new features or improvements',
      icon: <Lightbulb className="h-4 w-4" />,
      color: 'text-blue-600',
      action: () => handleFeedbackType('feature-request')
    },
    {
      type: 'bug-report',
      title: 'Report Bug',
      description: 'Found something broken? Let us know',
      icon: <Bug className="h-4 w-4" />,
      color: 'text-red-600',
      action: () => handleFeedbackType('bug-report')
    },
    {
      type: 'general',
      title: 'General Feedback',
      description: 'Share your thoughts and suggestions',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'text-green-600',
      action: () => handleFeedbackType('general')
    }
  ];

  /**
   * Handle direct trigger click (for simple variants)
   */
  const handleDirectTrigger = useCallback(() => {
    if (variant === 'minimal' || variant === 'inline') {
      handleFeedbackType(defaultType);
    } else {
      setIsPopoverOpen(true);
    }
  }, [variant, defaultType, handleFeedbackType]);

  /**
   * Size mappings
   */
  const sizeClasses = {
    sm: {
      button: 'h-8 px-3 text-sm',
      fab: 'h-10 w-10',
      text: 'text-sm'
    },
    md: {
      button: 'h-9 px-4 text-sm',
      fab: 'h-12 w-12',
      text: 'text-sm'
    },
    lg: {
      button: 'h-10 px-6 text-base',
      fab: 'h-14 w-14',
      text: 'text-base'
    }
  };

  /**
   * Render trigger based on variant
   */
  const renderTrigger = () => {
    const defaultIcon = icon || <MessageSquare className={cn('h-4 w-4', variant === 'fab' && size === 'lg' && 'h-5 w-5')} />;

    switch (variant) {
      case 'fab':
        return (
          <Button
            ref={triggerRef}
            onClick={handleDirectTrigger}
            disabled={disabled}
            className={cn(
              'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full shadow-lg hover:shadow-xl',
              'transition-all duration-300 transform hover:scale-105 active:scale-95',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'group relative overflow-hidden',
              sizeClasses[size].fab,
              className
            )}
            aria-label={`Open ${text.toLowerCase()}`}
          >
            {defaultIcon}
            {showBadge && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground"
              >
                {badgeContent || '!'}
              </Badge>
            )}
          </Button>
        );

      case 'inline':
        return (
          <Button
            ref={triggerRef}
            variant="outline"
            onClick={handleDirectTrigger}
            disabled={disabled}
            className={cn(
              'justify-start gap-2 relative',
              sizeClasses[size].button,
              className
            )}
          >
            {defaultIcon}
            <span>{text}</span>
            {showBadge && (
              <Badge variant="destructive" className="ml-auto">
                {badgeContent || '!'}
              </Badge>
            )}
          </Button>
        );

      case 'minimal':
        return (
          <Button
            ref={triggerRef}
            variant="ghost"
            size="sm"
            onClick={handleDirectTrigger}
            disabled={disabled}
            className={cn(
              'text-muted-foreground hover:text-foreground relative',
              sizeClasses[size].text,
              className
            )}
          >
            {defaultIcon}
            {showBadge && (
              <Badge 
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full p-0 bg-destructive"
              />
            )}
          </Button>
        );

      default: // button
        return (
          <Button
            ref={triggerRef}
            onClick={handleDirectTrigger}
            disabled={disabled}
            className={cn(
              'gap-2 relative transition-all duration-200',
              'hover:shadow-md active:scale-[0.98]',
              sizeClasses[size].button,
              className
            )}
          >
            {defaultIcon}
            <span>{text}</span>
            {variant === 'button' && <ChevronDown className="h-3 w-3 opacity-50" />}
            {showBadge && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {badgeContent || '!'}
              </Badge>
            )}
          </Button>
        );
    }
  };

  if (disabled) {
    return renderTrigger();
  }

  return (
    <>
      {/* Trigger with Popover */}
      {(variant === 'button' || variant === 'fab') ? (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            {renderTrigger()}
          </PopoverTrigger>
          <PopoverContent 
            side={position}
            className="w-80 p-0"
            sideOffset={8}
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-4">
                <div className="space-y-1 mb-4">
                  <h4 className="font-semibold text-sm">How can we help?</h4>
                  <p className="text-xs text-muted-foreground">
                    Choose the type of feedback you&apos;d like to share
                  </p>
                </div>
                
                <div className="space-y-2">
                  {feedbackOptions.map((option) => (
                    <Button
                      key={option.type}
                      variant="ghost"
                      onClick={option.action}
                      className={cn(
                        'w-full justify-start h-auto p-3 text-left',
                        'hover:bg-muted transition-colors duration-200'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5', option.color)}>
                          {option.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{option.title}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      ) : (
        renderTrigger()
      )}

      {/* Survey Modal */}
      <SurveyModal
        isOpen={isSurveyOpen}
        onClose={() => setIsSurveyOpen(false)}
        onComplete={(responses) => {
          console.log('Survey completed:', responses);
          setIsSurveyOpen(false);
        }}
      />
    </>
  );
}

/**
 * Pre-configured feedback triggers for common use cases
 */

/**
 * Floating Action Button trigger
 */
export function FeedbackFAB(props: Omit<FeedbackTriggerProps, 'variant'>) {
  return <FeedbackTrigger {...props} variant="fab" />;
}

/**
 * Inline feedback button
 */
export function InlineFeedbackButton(props: Omit<FeedbackTriggerProps, 'variant'>) {
  return <FeedbackTrigger {...props} variant="inline" />;
}

/**
 * Minimal feedback trigger
 */
export function MinimalFeedbackTrigger(props: Omit<FeedbackTriggerProps, 'variant'>) {
  return <FeedbackTrigger {...props} variant="minimal" />;
}

export default FeedbackTrigger;