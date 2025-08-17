'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useUser } from '@/hooks/use-user';
import { FormbricksManager } from '@/libs/formbricks';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';

/**
 * Specialized hook for tracking upgrade flow events and user behavior
 * Implements FB-020: Upgrade flow feedback tracking
 */
export function useUpgradeFlowTracking() {
  const { data: user } = useUser();
  const sessionRef = useRef<{
    sessionId: string;
    startTime: number;
    exitIntentDetected: boolean;
    hesitationDetected: boolean;
    currentPage: string;
    interactionCount: number;
    timeOnPage: number;
  } | null>(null);

  const trackEvent = useCallback((
    eventName: string, 
    properties?: Record<string, any>
  ) => {
    const manager = FormbricksManager.getInstance();
    
    if (!manager.isInitialized()) {
      return;
    }

    const context = {
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userTier: user?.user_metadata?.subscriptionTier || 'unknown',
      sessionId: user?.id || 'anonymous',
      timestamp: new Date().toISOString(),
      upgradeFlowSession: sessionRef.current?.sessionId,
    };

    manager.track(eventName, {
      ...properties,
      context,
    });
  }, [user]);

  // Initialize upgrade flow session
  const startUpgradeFlowSession = useCallback((page: string) => {
    const sessionId = `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    sessionRef.current = {
      sessionId,
      startTime: Date.now(),
      exitIntentDetected: false,
      hesitationDetected: false,
      currentPage: page,
      interactionCount: 0,
      timeOnPage: 0,
    };

    trackEvent(FORMBRICKS_EVENTS.UPGRADE_FLOW_SESSION_START, {
      sessionId,
      page,
      userTier: user?.user_metadata?.subscriptionTier || 'unknown',
      startTime: new Date().toISOString(),
    });

    trackEvent(FORMBRICKS_EVENTS.UPGRADE_PAGE_VISITED, {
      sessionId,
      page,
      referrer: typeof window !== 'undefined' ? document.referrer : '',
    });
  }, [trackEvent, user]);

  // End upgrade flow session
  const endUpgradeFlowSession = useCallback((reason: 'completed' | 'abandoned' | 'navigation') => {
    if (!sessionRef.current) return;

    const session = sessionRef.current;
    const duration = Date.now() - session.startTime;

    trackEvent(FORMBRICKS_EVENTS.UPGRADE_FLOW_SESSION_END, {
      sessionId: session.sessionId,
      reason,
      duration,
      exitIntentDetected: session.exitIntentDetected,
      hesitationDetected: session.hesitationDetected,
      interactionCount: session.interactionCount,
      endTime: new Date().toISOString(),
    });

    if (reason === 'abandoned') {
      trackEvent(FORMBRICKS_EVENTS.UPGRADE_ABANDONED, {
        sessionId: session.sessionId,
        abandonmentPoint: session.currentPage,
        timeSpent: duration,
        exitIntentDetected: session.exitIntentDetected,
        hesitationDetected: session.hesitationDetected,
      });
    }

    sessionRef.current = null;
  }, [trackEvent]);

  // Track exit intent detection
  const trackExitIntent = useCallback((exitType: 'mouse_movement' | 'tab_switch' | 'navigation_attempt') => {
    if (!sessionRef.current) return;

    sessionRef.current.exitIntentDetected = true;

    trackEvent(FORMBRICKS_EVENTS.UPGRADE_EXIT_INTENT_DETECTED, {
      sessionId: sessionRef.current.sessionId,
      exitType,
      timeOnPage: Date.now() - sessionRef.current.startTime,
      page: sessionRef.current.currentPage,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  // Track hesitation behavior
  const trackHesitation = useCallback((hesitationType: 'extended_time' | 'multiple_comparisons' | 'price_focus' | 'feature_questions') => {
    if (!sessionRef.current) return;

    sessionRef.current.hesitationDetected = true;

    trackEvent(FORMBRICKS_EVENTS.UPGRADE_HESITATION_DETECTED, {
      sessionId: sessionRef.current.sessionId,
      hesitationType,
      timeOnPage: Date.now() - sessionRef.current.startTime,
      page: sessionRef.current.currentPage,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  // Track feature comparison viewing
  const trackFeatureComparison = useCallback((comparisonData: {
    featuresViewed: string[];
    timeSpent: number;
    planComparisons: string[];
  }) => {
    if (!sessionRef.current) return;

    sessionRef.current.interactionCount++;

    trackEvent(FORMBRICKS_EVENTS.FEATURE_COMPARISON_VIEWED, {
      sessionId: sessionRef.current.sessionId,
      ...comparisonData,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  // Track pricing tier comparison
  const trackPricingComparison = useCallback((pricingData: {
    tiersCompared: string[];
    timeSpent: number;
    pricePoints: number[];
    focusedTier?: string;
  }) => {
    if (!sessionRef.current) return;

    sessionRef.current.interactionCount++;

    trackEvent(FORMBRICKS_EVENTS.PRICING_TIER_COMPARED, {
      sessionId: sessionRef.current.sessionId,
      ...pricingData,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  // Track survey completion
  const trackSurveyCompletion = useCallback((surveyData: {
    surveyType: 'abandonment' | 'hesitation' | 'feature_value' | 'price_sensitivity';
    responses: Record<string, any>;
    completionTime: number;
  }) => {
    if (!sessionRef.current) return;

    trackEvent(FORMBRICKS_EVENTS.UPGRADE_SURVEY_COMPLETED, {
      sessionId: sessionRef.current.sessionId,
      ...surveyData,
      timestamp: new Date().toISOString(),
    });

    // Track specific survey types
    const specificEvents = {
      abandonment: FORMBRICKS_EVENTS.UPGRADE_ABANDONMENT_SURVEY,
      hesitation: FORMBRICKS_EVENTS.UPGRADE_HESITATION_SURVEY,
      feature_value: FORMBRICKS_EVENTS.FEATURE_VALUE_ASSESSMENT,
      price_sensitivity: FORMBRICKS_EVENTS.PRICE_SENSITIVITY_FEEDBACK,
    };

    trackEvent(specificEvents[surveyData.surveyType], {
      sessionId: sessionRef.current.sessionId,
      responses: surveyData.responses,
      completionTime: surveyData.completionTime,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  // Track upgrade completion
  const trackUpgradeCompletion = useCallback((upgradeData: {
    selectedPlan: string;
    pricePoint: number;
    paymentMethod: string;
    conversionTime: number;
  }) => {
    if (!sessionRef.current) return;

    trackEvent(FORMBRICKS_EVENTS.UPGRADE_COMPLETED, {
      sessionId: sessionRef.current.sessionId,
      ...upgradeData,
      exitIntentOvercome: sessionRef.current.exitIntentDetected,
      hesitationOvercome: sessionRef.current.hesitationDetected,
      totalTimeToConversion: Date.now() - sessionRef.current.startTime,
      timestamp: new Date().toISOString(),
    });

    endUpgradeFlowSession('completed');
  }, [trackEvent, endUpgradeFlowSession]);

  // Auto-track time-based hesitation
  useEffect(() => {
    if (!sessionRef.current) return;

    const timeThreshold = 30000; // 30 seconds
    const timer = setTimeout(() => {
      if (sessionRef.current && !sessionRef.current.hesitationDetected) {
        trackHesitation('extended_time');
      }
    }, timeThreshold);

    return () => clearTimeout(timer);
  }, [trackHesitation]);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        endUpgradeFlowSession('navigation');
      }
    };
  }, [endUpgradeFlowSession]);

  return {
    // Session management
    startUpgradeFlowSession,
    endUpgradeFlowSession,
    
    // Event tracking
    trackExitIntent,
    trackHesitation,
    trackFeatureComparison,
    trackPricingComparison,
    trackSurveyCompletion,
    trackUpgradeCompletion,
    
    // State
    isSessionActive: !!sessionRef.current,
    sessionId: sessionRef.current?.sessionId,
    
    // Raw tracking
    trackEvent,
  };
}