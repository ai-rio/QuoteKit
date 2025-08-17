'use client';

import { useCallback, useEffect, useState } from 'react';

import { useUpgradeFlowTracking } from '@/hooks/use-upgrade-flow-tracking';

import { ExitIntentDetector } from './exit-intent-detector';
import { FeatureValueResponses,FeatureValueSurvey } from './feature-value-survey';
import { UpgradeAbandonmentResponses,UpgradeAbandonmentSurvey } from './upgrade-abandonment-survey';

interface UpgradeFlowTrackerProps {
  page: 'pricing' | 'checkout';
  isActive?: boolean;
  children?: React.ReactNode;
}

type SurveyState = {
  abandonment: {
    visible: boolean;
    type: 'exit_intent' | 'extended_time' | 'navigation_attempt' | 'mouse_movement' | 'tab_switch';
  };
  featureValue: {
    visible: boolean;
    context: 'feature_interaction' | 'time_based' | 'pricing_page';
  };
};

/**
 * Main orchestrator for upgrade flow feedback collection
 * Implements FB-020: Comprehensive upgrade flow tracking with intelligent survey triggers
 */
export function UpgradeFlowTracker({ 
  page, 
  isActive = true,
  children 
}: UpgradeFlowTrackerProps) {
  const {
    startUpgradeFlowSession,
    endUpgradeFlowSession,
    trackExitIntent,
    trackHesitation,
    trackFeatureComparison,
    trackPricingComparison,
    trackSurveyCompletion,
    isSessionActive,
  } = useUpgradeFlowTracking();

  const [surveyState, setSurveyState] = useState<SurveyState>({
    abandonment: { visible: false, type: 'exit_intent' },
    featureValue: { visible: false, context: 'time_based' },
  });

  const [interactionData, setInteractionData] = useState({
    timeOnPage: 0,
    scrollDepth: 0,
    featureInteractions: 0,
    pricingComparisons: 0,
    lastActivity: Date.now(),
  });

  const [timers, setTimers] = useState<{
    hesitationTimer?: NodeJS.Timeout;
    featureValueTimer?: NodeJS.Timeout;
    activityTracker?: NodeJS.Timeout;
  }>({});

  // Initialize session when component mounts
  useEffect(() => {
    if (isActive && !isSessionActive) {
      startUpgradeFlowSession(page);
    }

    return () => {
      if (isSessionActive) {
        endUpgradeFlowSession('navigation');
      }
    };
  }, [isActive, page, isSessionActive, startUpgradeFlowSession, endUpgradeFlowSession]);

  // Track time on page and set up hesitation detection
  useEffect(() => {
    if (!isActive) return;

    const activityTracker = setInterval(() => {
      setInteractionData(prev => ({
        ...prev,
        timeOnPage: prev.timeOnPage + 1000,
      }));
    }, 1000);

    // Set up hesitation timer (30 seconds without action)
    const hesitationTimer = setTimeout(() => {
      trackHesitation('extended_time');
      
      // Show feature value survey after extended time
      if (page === 'pricing' && !surveyState.featureValue.visible) {
        setSurveyState(prev => ({
          ...prev,
          featureValue: { visible: true, context: 'time_based' },
        }));
      }
    }, 30000);

    // Set up feature value survey timer for pricing page
    let featureValueTimer: NodeJS.Timeout | undefined;
    if (page === 'pricing') {
      featureValueTimer = setTimeout(() => {
        if (!surveyState.featureValue.visible && !surveyState.abandonment.visible) {
          setSurveyState(prev => ({
            ...prev,
            featureValue: { visible: true, context: 'pricing_page' },
          }));
        }
      }, 45000); // 45 seconds
    }

    setTimers({ activityTracker, hesitationTimer, featureValueTimer });

    return () => {
      clearInterval(activityTracker);
      clearTimeout(hesitationTimer);
      if (featureValueTimer) clearTimeout(featureValueTimer);
    };
  }, [isActive, page, trackHesitation, surveyState]);

  // Track scroll depth for engagement measurement
  useEffect(() => {
    if (!isActive) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      
      setInteractionData(prev => ({
        ...prev,
        scrollDepth: Math.max(prev.scrollDepth, scrollPercentage),
        lastActivity: Date.now(),
      }));

      // Reset hesitation timer on scroll
      if (timers.hesitationTimer) {
        clearTimeout(timers.hesitationTimer);
        const newHesitationTimer = setTimeout(() => {
          trackHesitation('extended_time');
        }, 30000);
        setTimers(prev => ({ ...prev, hesitationTimer: newHesitationTimer }));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isActive, timers.hesitationTimer, trackHesitation]);

  // Track user interactions for engagement analysis
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      setInteractionData(prev => ({ ...prev, lastActivity: Date.now() }));

      // Track feature-related interactions
      if (target.closest('[data-feature-section]')) {
        setInteractionData(prev => ({
          ...prev,
          featureInteractions: prev.featureInteractions + 1,
        }));
        
        // Track feature comparison viewing
        const featureSection = target.closest('[data-feature-section]');
        const sectionName = featureSection?.getAttribute('data-feature-section');
        if (sectionName) {
          trackFeatureComparison({
            featuresViewed: [sectionName],
            timeSpent: 1000, // Approximate viewing time
            planComparisons: [],
          });
        }
      }

      // Track pricing-related interactions
      if (target.closest('[data-pricing-tier]') || target.closest('.pricing-card')) {
        setInteractionData(prev => ({
          ...prev,
          pricingComparisons: prev.pricingComparisons + 1,
        }));

        const pricingElement = target.closest('[data-pricing-tier]');
        const tierName = pricingElement?.getAttribute('data-pricing-tier');
        if (tierName) {
          trackPricingComparison({
            tiersCompared: [tierName],
            timeSpent: 1000,
            pricePoints: [],
            focusedTier: tierName,
          });
        }
      }

      // Trigger feature value survey on feature interactions
      if (target.closest('[data-feature-section]') && interactionData.featureInteractions >= 2) {
        if (!surveyState.featureValue.visible && !surveyState.abandonment.visible) {
          setSurveyState(prev => ({
            ...prev,
            featureValue: { visible: true, context: 'feature_interaction' },
          }));
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [
    isActive,
    interactionData.featureInteractions,
    surveyState,
    trackFeatureComparison,
    trackPricingComparison,
  ]);

  // Handle exit intent detection
  const handleExitIntent = useCallback((type: 'mouse_movement' | 'tab_switch' | 'navigation_attempt') => {
    trackExitIntent(type);

    // Map exit intent types to abandonment survey types
    const abandonmentType = type === 'mouse_movement' ? 'exit_intent' : 
                          type === 'tab_switch' ? 'extended_time' : 
                          'navigation_attempt';

    // Show abandonment survey on exit intent
    if (!surveyState.abandonment.visible && !surveyState.featureValue.visible) {
      setSurveyState(prev => ({
        ...prev,
        abandonment: { visible: true, type: abandonmentType },
      }));
    }
  }, [trackExitIntent, surveyState]);

  // Handle abandonment survey completion
  const handleAbandonmentSurveyComplete = useCallback((responses: UpgradeAbandonmentResponses) => {
    trackSurveyCompletion({
      surveyType: 'abandonment',
      responses,
      completionTime: responses.completionTime,
    });

    setSurveyState(prev => ({
      ...prev,
      abandonment: { ...prev.abandonment, visible: false },
    }));

    // End session after abandonment survey
    endUpgradeFlowSession('abandoned');
  }, [trackSurveyCompletion, endUpgradeFlowSession]);

  // Handle feature value survey completion
  const handleFeatureValueSurveyComplete = useCallback((responses: FeatureValueResponses) => {
    trackSurveyCompletion({
      surveyType: 'feature_value',
      responses,
      completionTime: responses.completionTime,
    });

    setSurveyState(prev => ({
      ...prev,
      featureValue: { ...prev.featureValue, visible: false },
    }));
  }, [trackSurveyCompletion]);

  // Handle survey dismissal
  const handleSurveyDismiss = useCallback((surveyType: 'abandonment' | 'featureValue') => {
    setSurveyState(prev => ({
      ...prev,
      [surveyType]: { ...prev[surveyType], visible: false },
    }));

    // If abandonment survey is dismissed, still end session as abandoned
    if (surveyType === 'abandonment') {
      endUpgradeFlowSession('abandoned');
    }
  }, [endUpgradeFlowSession]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [timers]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <>
      <ExitIntentDetector
        onExitIntent={handleExitIntent}
        isActive={isActive}
        sensitivity="medium"
      >
        {children}
      </ExitIntentDetector>

      <UpgradeAbandonmentSurvey
        isVisible={surveyState.abandonment.visible}
        abandonmentType={
          surveyState.abandonment.type === 'mouse_movement' || surveyState.abandonment.type === 'tab_switch' 
            ? 'exit_intent' 
            : surveyState.abandonment.type
        }
        onComplete={handleAbandonmentSurveyComplete}
        onDismiss={() => handleSurveyDismiss('abandonment')}
      />

      <FeatureValueSurvey
        isVisible={surveyState.featureValue.visible}
        triggerContext={surveyState.featureValue.context}
        onComplete={handleFeatureValueSurveyComplete}
        onDismiss={() => handleSurveyDismiss('featureValue')}
      />
    </>
  );
}