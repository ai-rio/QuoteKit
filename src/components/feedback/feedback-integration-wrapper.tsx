'use client';

import { UserContextTracker } from '@/components/tracking/user-context-tracker';

import { FloatingFeedbackWidget } from './floating-feedback-widget';
import { SegmentSurveyManager } from './segment-specific-survey-manager';

interface FeedbackIntegrationWrapperProps {
  /** Which features to enable */
  features?: {
    floatingWidget?: boolean;
    contextTracking?: boolean;
    segmentSurveys?: boolean; // FB-019: Segment-specific surveys
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
  /** Segment survey configuration - FB-019 */
  segmentSurveyConfig?: {
    currentPage?: string;
    contextData?: Record<string, any>;
    debug?: boolean;
  };
}

/**
 * Comprehensive wrapper for all Formbricks feedback and tracking features
 * Use this component to enable FB-006 (floating widget), FB-008 (context tracking),
 * and FB-019 (segment-specific surveys)
 */
export function FeedbackIntegrationWrapper({
  features = {
    floatingWidget: true,
    contextTracking: true,
    segmentSurveys: true // Enable by default
  },
  widgetConfig = {},
  trackingConfig = {},
  segmentSurveyConfig = {}
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

      {/* Segment-Specific Surveys - FB-019 */}
      {features.segmentSurveys && (
        <SegmentSurveyManager
          currentPage={segmentSurveyConfig.currentPage}
          contextData={segmentSurveyConfig.contextData}
          debug={segmentSurveyConfig.debug}
        />
      )}
    </>
  );
}