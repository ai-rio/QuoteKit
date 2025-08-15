'use client';

import { UserContextTracker } from '@/components/tracking/user-context-tracker';

import { FloatingFeedbackWidget } from './floating-feedback-widget';

interface FeedbackIntegrationWrapperProps {
  /** Which features to enable */
  features?: {
    floatingWidget?: boolean;
    contextTracking?: boolean;
  };
  /** Floating widget configuration */
  widgetConfig?: {
    position?: 'bottom-right' | 'bottom-left' | 'right' | 'left';
    showDelay?: number;
    autoHideAfter?: number;
    hideOnPages?: string[];
    showOnPages?: string[];
  };
  /** Context tracking configuration */
  trackingConfig?: {
    syncInterval?: number;
    trackUsageStats?: boolean;
    trackSessionEvents?: boolean;
    customAttributes?: Record<string, any>;
  };
}

/**
 * Comprehensive wrapper for all Formbricks feedback and tracking features
 * Use this component to enable FB-006 (floating widget) and FB-008 (context tracking)
 */
export function FeedbackIntegrationWrapper({
  features = {
    floatingWidget: true,
    contextTracking: true
  },
  widgetConfig = {},
  trackingConfig = {}
}: FeedbackIntegrationWrapperProps) {
  return (
    <>
      {/* User Context Tracking - FB-008 */}
      {features.contextTracking && (
        <UserContextTracker
          syncInterval={trackingConfig.syncInterval}
          trackUsageStats={trackingConfig.trackUsageStats ?? true}
          trackSessionEvents={trackingConfig.trackSessionEvents ?? true}
          customAttributes={trackingConfig.customAttributes}
        />
      )}

      {/* Floating Feedback Widget - FB-006 */}
      {features.floatingWidget && (
        <FloatingFeedbackWidget
          position={widgetConfig.position ?? 'bottom-right'}
          showDelay={widgetConfig.showDelay ?? 5000}
          autoHideAfter={widgetConfig.autoHideAfter}
          hideOnPages={widgetConfig.hideOnPages}
          showOnPages={widgetConfig.showOnPages}
        />
      )}
    </>
  );
}