'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { useSegmentSurveys } from '@/hooks/use-segment-surveys';
import { useUser } from '@/hooks/use-user';
import { useUserTier } from '@/hooks/use-user-tier';

import { SurveySelector } from './survey-selector';
import { 
  SegmentSurveyConfig,
  SurveyContext, 
  UserActivity, 
  UserSegment} from './types';

interface SegmentSurveyManagerProps {
  /** Current page context for survey targeting */
  currentPage?: string;
  /** Additional context data */
  contextData?: Record<string, any>;
  /** Callback when a survey is triggered */
  onSurveyTriggered?: (surveyId: string, segment: UserSegment, context: SurveyContext) => void;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Manages segment-specific surveys for QuoteKit users
 * Determines user segment and triggers appropriate surveys based on:
 * - User tier (free, pro, enterprise)
 * - User activity patterns (heavy, light, new users)
 * - Context and behavior
 */
export function SegmentSurveyManager({ 
  currentPage = 'unknown',
  contextData = {},
  onSurveyTriggered,
  debug = false
}: SegmentSurveyManagerProps) {
  const { data: user } = useUser();
  const { tier, isLoading: tierLoading, subscription } = useUserTier();
  const { trackSegmentSurvey } = useFormbricksTracking();
  const { 
    getUserSegment, 
    getUserActivity, 
    getSegmentConfigs,
    shouldTriggerSurvey,
    isLoading: segmentLoading
  } = useSegmentSurveys();

  const [userSegment, setUserSegment] = useState<UserSegment | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [activeSurveyConfigs, setActiveSurveyConfigs] = useState<SegmentSurveyConfig[]>([]);

  // Determine user segment based on tier and activity
  const determineUserSegment = useCallback(async (): Promise<UserSegment | null> => {
    if (!user?.id || tierLoading) return null;

    try {
      // Get user activity data
      const activity = await getUserActivity(user.id);
      if (!activity) return null;

      setUserActivity(activity);

      // Get segment based on tier and activity patterns
      const segment = await getUserSegment(user.id, tier, activity);
      
      if (debug) {
        console.log('🎯 Segment determination:', {
          userId: user.id,
          tier,
          activity: {
            quotesCreated: activity.quotesCreated,
            accountAge: activity.accountAge,
            loginFrequency: activity.loginFrequency
          },
          determinedSegment: segment
        });
      }

      return segment;
    } catch (error) {
      console.error('Error determining user segment:', error);
      return null;
    }
  }, [user?.id, tier, tierLoading, getUserActivity, getUserSegment, debug]);

  // Load segment-specific survey configurations
  const loadSegmentConfigs = useCallback(async (segment: UserSegment) => {
    try {
      const configs = await getSegmentConfigs(segment);
      const enabledConfigs = configs.filter(config => config.enabled);
      
      if (debug) {
        console.log('📋 Loaded segment configs:', {
          segment,
          totalConfigs: configs.length,
          enabledConfigs: enabledConfigs.length,
          configs: enabledConfigs.map(c => ({
            surveyIds: c.surveyIds,
            priority: c.priority
          }))
        });
      }

      setActiveSurveyConfigs(enabledConfigs);
    } catch (error) {
      console.error('Error loading segment configs:', error);
      setActiveSurveyConfigs([]);
    }
  }, [getSegmentConfigs, debug]);

  // Initialize user segment and configs
  useEffect(() => {
    async function initializeSegment() {
      const segment = await determineUserSegment();
      if (segment) {
        setUserSegment(segment);
        await loadSegmentConfigs(segment);
      }
    }

    if (user?.id && !tierLoading && !segmentLoading) {
      initializeSegment();
    }
  }, [user?.id, tierLoading, segmentLoading, determineUserSegment, loadSegmentConfigs]);

  // Handle survey trigger
  const handleSurveyTriggered = useCallback((
    surveyId: string, 
    config: SegmentSurveyConfig
  ) => {
    if (!userSegment || !userActivity || !user?.id) return;

    const context: SurveyContext = {
      userId: user.id,
      userSegment,
      userActivity,
      currentPage,
      sessionData: {
        ...contextData,
        tier,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status
        } : null
      },
      timestamp: Date.now()
    };

    // Track the survey trigger
    trackSegmentSurvey(surveyId, userSegment, context);

    // Call external callback
    onSurveyTriggered?.(surveyId, userSegment, context);

    if (debug) {
      console.log('🚀 Survey triggered:', {
        surveyId,
        segment: userSegment,
        config: {
          priority: config.priority,
          frequency: config.frequency
        },
        context
      });
    }
  }, [
    userSegment, 
    userActivity, 
    user?.id, 
    currentPage, 
    contextData, 
    tier, 
    subscription, 
    trackSegmentSurvey, 
    onSurveyTriggered, 
    debug
  ]);

  // Check if we should trigger surveys
  const checkSurveyTriggers = useCallback(async () => {
    if (!userSegment || !userActivity || !user?.id || activeSurveyConfigs.length === 0) {
      return;
    }

    // Sort configs by priority (highest first)
    const sortedConfigs = [...activeSurveyConfigs].sort((a, b) => b.priority - a.priority);

    for (const config of sortedConfigs) {
      // Check if we should trigger any surveys from this config
      const shouldTrigger = await shouldTriggerSurvey(
        user.id,
        config,
        userActivity,
        currentPage
      );

      if (shouldTrigger && config.surveyIds.length > 0) {
        // Select the most appropriate survey from this config
        const selectedSurveyId = config.surveyIds[0]; // Simple selection for now
        handleSurveyTriggered(selectedSurveyId, config);
        break; // Only trigger one survey at a time
      }
    }
  }, [
    userSegment, 
    userActivity, 
    user?.id, 
    activeSurveyConfigs, 
    shouldTriggerSurvey, 
    currentPage, 
    handleSurveyTriggered
  ]);

  // Check triggers when context changes
  useEffect(() => {
    if (userSegment && userActivity && activeSurveyConfigs.length > 0) {
      // Small delay to ensure everything is initialized
      const timeoutId = setTimeout(checkSurveyTriggers, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [userSegment, userActivity, activeSurveyConfigs, checkSurveyTriggers]);

  // Don't render anything if not ready
  if (tierLoading || segmentLoading || !userSegment || !userActivity) {
    return null;
  }

  return (
    <>
      {activeSurveyConfigs.map((config, index) => (
        <SurveySelector
          key={`${userSegment}-${config.segment}-${index}`}
          userSegment={userSegment}
          userActivity={userActivity}
          context={{
            userId: user?.id || '',
            userSegment,
            userActivity,
            currentPage,
            sessionData: contextData,
            timestamp: Date.now()
          }}
          onSurveyTriggered={(surveyId: string) => handleSurveyTriggered(surveyId, config)}
          debug={debug}
        />
      ))}
    </>
  );
}

export default SegmentSurveyManager;