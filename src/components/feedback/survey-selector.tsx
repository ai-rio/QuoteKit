'use client';

import React, { useCallback } from 'react';

import { SEGMENT_SURVEY_CONFIGS } from './segment-survey-configs';
import { QuoteContext,SurveyTrigger } from './survey-trigger';
import { 
  SegmentSurveyConfig,
  SurveyContext,
  TriggerCondition,
  UserActivity,
  UserSegment} from './types';

interface SurveySelectorProps {
  /** User's current segment */
  userSegment: UserSegment;
  /** User's activity data */
  userActivity: UserActivity;
  /** Survey context */
  context: SurveyContext;
  /** Callback when a survey is triggered */
  onSurveyTriggered?: (surveyId: string, segment: UserSegment, context: any) => void;
  /** Enable debug logging */
  debug?: boolean;
}

// Hook for frequency limiting
function useFrequencyLimiting() {
  const shouldShowSurvey = (surveyKey: string, frequency: { maxPerDay?: number; maxPerWeek?: number; cooldownHours?: number }) => {
    const now = Date.now();
    const stored = localStorage.getItem(`survey_frequency_${surveyKey}`);
    
    if (!stored) return true;
    
    const data = JSON.parse(stored);
    
    // Check cooldown
    if (frequency.cooldownHours && now - data.lastShown < frequency.cooldownHours * 60 * 60 * 1000) {
      return false;
    }
    
    // Check daily limit
    if (frequency.maxPerDay) {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayCount = data.showHistory.filter((time: number) => time >= todayStart).length;
      if (todayCount >= frequency.maxPerDay) return false;
    }
    
    // Check weekly limit
    if (frequency.maxPerWeek) {
      const weekStart = now - 7 * 24 * 60 * 60 * 1000;
      const weekCount = data.showHistory.filter((time: number) => time >= weekStart).length;
      if (weekCount >= frequency.maxPerWeek) return false;
    }
    
    return true;
  };
  
  const trackFrequency = (surveyKey: string) => {
    const now = Date.now();
    const stored = localStorage.getItem(`survey_frequency_${surveyKey}`);
    const data = stored ? JSON.parse(stored) : { showHistory: [], lastShown: 0 };
    
    data.showHistory.push(now);
    data.lastShown = now;
    
    // Keep only last 30 days of history
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    data.showHistory = data.showHistory.filter((time: number) => time >= thirtyDaysAgo);
    
    localStorage.setItem(`survey_frequency_${surveyKey}`, JSON.stringify(data));
  };
  
  return { shouldShowSurvey, trackFrequency };
}

// Function to evaluate trigger conditions
function evaluateTriggerConditions(
  conditions: TriggerCondition[], 
  context: SurveyContext, 
  userActivity: UserActivity
): boolean {
  return conditions.every(condition => {
    switch (condition.type) {
      case 'page_context':
        return condition.value === 'any' || context.currentPage.includes(String(condition.value));
      case 'user_activity':
        if (condition.operator === 'gte') {
          return userActivity.quotesCreated >= Number(condition.value);
        } else if (condition.operator === 'lt') {
          return userActivity.quotesCreated < Number(condition.value);
        }
        return true;
      case 'time_based':
        return (context.timeOnPage || 0) >= Number(condition.value);
      default:
        return true;
    }
  });
}

// Function to select survey from config
function selectSurveyFromConfig(config: SegmentSurveyConfig, context: SurveyContext): string {
  // Simple round-robin selection for now
  const index = Math.floor(Math.random() * config.surveyIds.length);
  return config.surveyIds[index];
}

/**
 * Selects and triggers the most appropriate survey based on:
 * - User segment
 * - Current context
 * - Activity patterns
 * - Trigger conditions
 */
function SurveySelector({ 
  userSegment, 
  context, 
  userActivity, 
  debug = false,
  onSurveyTriggered 
}: SurveySelectorProps): React.JSX.Element | null {
  const { shouldShowSurvey, trackFrequency } = useFrequencyLimiting();
  
  // Move useCallback outside of conditional logic
  const handleSurveyTriggered = useCallback((selectedSurveyId: string, quoteContext: QuoteContext) => {
    if (onSurveyTriggered) {
      onSurveyTriggered(selectedSurveyId, userSegment, quoteContext);
    }
  }, [onSurveyTriggered, userSegment]);
  
  // Get configurations for this segment
  const segmentConfigs = SEGMENT_SURVEY_CONFIGS[userSegment] || [];
  
  if (segmentConfigs.length === 0) {
    if (debug) {
      console.log(`[SurveySelector] No configurations found for segment: ${userSegment}`);
    }
    return null;
  }
  
  // Find eligible surveys based on trigger conditions
  const eligibleSurveys = segmentConfigs.filter(config => 
    evaluateTriggerConditions(config.triggerConditions, context, userActivity)
  );
  
  if (eligibleSurveys.length === 0) {
    if (debug) {
      console.log(`[SurveySelector] No eligible surveys for segment ${userSegment} in context:`, context);
    }
    return null;
  }
  
  // Sort by priority (higher priority first)
  const sortedSurveys = eligibleSurveys.sort((a, b) => b.priority - a.priority);
  
  // Check frequency limits for each survey until we find one that can be shown
  for (const config of sortedSurveys) {
    const surveyKey = `${config.surveyIds[0]}_${userSegment}`;
    
    if (shouldShowSurvey(surveyKey, config.frequency)) {
      // Found a survey that can be shown
      const selectedSurveyId = selectSurveyFromConfig(config, context);
      
      if (debug) {
        console.log(`[SurveySelector] Selected survey ${selectedSurveyId} for segment ${userSegment}`);
      }
      
      // Track that we're showing this survey
      trackFrequency(surveyKey);
      
      const triggerConfig = {
        eventName: selectedSurveyId,
        delayMs: 1000,
        frequencyCap: {
          maxPerDay: config.frequency.maxPerDay,
          maxPerWeek: config.frequency.maxPerWeek,
          cooldownHours: config.frequency.cooldownDays * 24
        }
      };
      
      return (
        <SurveyTrigger
          key={`${selectedSurveyId}-${userSegment}-${context.timestamp}`}
          quoteContext={{
            quoteId: `segment-${userSegment}-${Date.now()}`,
            quoteValue: userActivity.averageQuoteValue,
            itemCount: 1,
            complexity: userActivity.quotesCreated > 10 ? 'complex' : 'simple',
            quoteType: 'mixed' as const,
            clientType: userActivity.accountAge < 30 ? 'new' : 'existing'
          }}
          config={triggerConfig}
          onSurveyTriggered={(quoteContext: QuoteContext) => handleSurveyTriggered(selectedSurveyId, quoteContext)}
        />
      );
    }
  }
  
  if (debug) {
    console.log(`[SurveySelector] All surveys for segment ${userSegment} are frequency limited`);
  }
  
  return null;
}

export { SurveySelector };
export default SurveySelector;