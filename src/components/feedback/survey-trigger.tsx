'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';

export interface QuoteContext {
  quoteId: string;
  quoteValue: number;
  itemCount: number;
  complexity: 'simple' | 'complex';
  quoteType: 'service' | 'product' | 'mixed';
  creationDuration?: number; // in seconds
  clientType?: 'new' | 'existing';
  isFromTemplate?: boolean;
  templateName?: string;
}

export interface SurveyTriggerConfig {
  eventName: string;
  delayMs?: number; // Default: 2000ms (2 seconds)
  frequencyCap?: {
    maxPerDay?: number;
    maxPerWeek?: number;
    cooldownHours?: number;
  };
  conditions?: {
    minQuoteValue?: number;
    minItemCount?: number;
    complexityRequired?: 'simple' | 'complex';
    onlyForNewClients?: boolean;
  };
}

interface SurveyTriggerProps {
  quoteContext: QuoteContext;
  config: SurveyTriggerConfig;
  onSurveyTriggered?: (context: QuoteContext) => void;
  children?: React.ReactNode;
}

/**
 * SurveyTrigger - Handles automatic survey triggering after quote creation success
 * Integrates with existing Formbricks infrastructure and provides configurable timing/frequency controls
 */
export function SurveyTrigger({ 
  quoteContext, 
  config, 
  onSurveyTriggered,
  children 
}: SurveyTriggerProps) {
  const { trackEvent, setUserAttributes, isAvailable } = useFormbricksTracking();
  const [hasSurveyTriggered, setHasSurveyTriggered] = useState(false);
  const triggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate storage keys for frequency capping
  const getStorageKey = (type: 'daily' | 'weekly' | 'cooldown') => {
    return `formbricks_survey_${config.eventName}_${type}`;
  };

  // Check frequency limits
  const checkFrequencyLimits = useCallback((): boolean => {
    if (!config.frequencyCap) return true;

    const now = new Date();
    const today = now.toDateString();
    const thisWeek = getWeekKey(now);

    // Check daily limit
    if (config.frequencyCap.maxPerDay) {
      const dailyKey = getStorageKey('daily');
      const dailyData = getStorageData(dailyKey);
      
      if (dailyData.date === today && dailyData.count >= config.frequencyCap.maxPerDay) {
        console.log('🚫 Survey frequency limit: Daily limit reached');
        return false;
      }
    }

    // Check weekly limit
    if (config.frequencyCap.maxPerWeek) {
      const weeklyKey = getStorageKey('weekly');
      const weeklyData = getStorageData(weeklyKey);
      
      if (weeklyData.date === thisWeek && weeklyData.count >= config.frequencyCap.maxPerWeek) {
        console.log('🚫 Survey frequency limit: Weekly limit reached');
        return false;
      }
    }

    // Check cooldown period
    if (config.frequencyCap.cooldownHours) {
      const cooldownKey = getStorageKey('cooldown');
      const lastShown = localStorage.getItem(cooldownKey);
      
      if (lastShown) {
        const lastShownTime = new Date(lastShown);
        const cooldownMs = config.frequencyCap.cooldownHours * 60 * 60 * 1000;
        
        if (now.getTime() - lastShownTime.getTime() < cooldownMs) {
          console.log('🚫 Survey frequency limit: Still in cooldown period');
          return false;
        }
      }
    }

    return true;
  }, [config.frequencyCap, config.eventName]);

  // Check conditions
  const checkConditions = useCallback((): boolean => {
    if (!config.conditions) return true;

    // Check minimum quote value
    if (config.conditions.minQuoteValue && quoteContext.quoteValue < config.conditions.minQuoteValue) {
      console.log(`🚫 Survey condition: Quote value ${quoteContext.quoteValue} below minimum ${config.conditions.minQuoteValue}`);
      return false;
    }

    // Check minimum item count
    if (config.conditions.minItemCount && quoteContext.itemCount < config.conditions.minItemCount) {
      console.log(`🚫 Survey condition: Item count ${quoteContext.itemCount} below minimum ${config.conditions.minItemCount}`);
      return false;
    }

    // Check complexity requirement
    if (config.conditions.complexityRequired && quoteContext.complexity !== config.conditions.complexityRequired) {
      console.log(`🚫 Survey condition: Complexity ${quoteContext.complexity} doesn't match required ${config.conditions.complexityRequired}`);
      return false;
    }

    // Check new clients only
    if (config.conditions.onlyForNewClients && quoteContext.clientType !== 'new') {
      console.log('🚫 Survey condition: Only for new clients, but this is an existing client');
      return false;
    }

    return true;
  }, [config.conditions, quoteContext]);

  // Update frequency counters
  const updateFrequencyCounters = useCallback(() => {
    if (!config.frequencyCap) return;

    const now = new Date();
    const today = now.toDateString();
    const thisWeek = getWeekKey(now);

    // Update daily counter
    if (config.frequencyCap.maxPerDay) {
      const dailyKey = getStorageKey('daily');
      const dailyData = getStorageData(dailyKey);
      
      if (dailyData.date === today) {
        setStorageData(dailyKey, { date: today, count: dailyData.count + 1 });
      } else {
        setStorageData(dailyKey, { date: today, count: 1 });
      }
    }

    // Update weekly counter
    if (config.frequencyCap.maxPerWeek) {
      const weeklyKey = getStorageKey('weekly');
      const weeklyData = getStorageData(weeklyKey);
      
      if (weeklyData.date === thisWeek) {
        setStorageData(weeklyKey, { date: thisWeek, count: weeklyData.count + 1 });
      } else {
        setStorageData(weeklyKey, { date: thisWeek, count: 1 });
      }
    }

    // Update cooldown timestamp
    if (config.frequencyCap.cooldownHours) {
      const cooldownKey = getStorageKey('cooldown');
      localStorage.setItem(cooldownKey, now.toISOString());
    }
  }, [config.frequencyCap, config.eventName]);

  // Trigger the survey
  const triggerSurvey = useCallback(() => {
    if (!isAvailable) {
      console.warn('⚠️ Formbricks not available, skipping survey trigger');
      return;
    }

    if (hasSurveyTriggered) {
      console.log('🔄 Survey already triggered for this context');
      return;
    }

    // Check frequency limits
    if (!checkFrequencyLimits()) {
      return;
    }

    // Check conditions
    if (!checkConditions()) {
      return;
    }

    console.log('📊 Triggering post-quote creation survey', {
      eventName: config.eventName,
      quoteContext,
      delay: config.delayMs || 2000
    });

    // Set user attributes with quote context
    setUserAttributes({
      lastQuoteValue: quoteContext.quoteValue,
      lastQuoteComplexity: quoteContext.complexity,
      lastQuoteItemCount: quoteContext.itemCount,
      lastQuoteType: quoteContext.quoteType,
      lastQuoteFromTemplate: quoteContext.isFromTemplate || false,
      quotesCreatedThisSession: 1, // Could be enhanced to track multiple quotes per session
    });

    // Track the survey trigger event with full context
    trackEvent(config.eventName, {
      quoteId: quoteContext.quoteId,
      quoteValue: quoteContext.quoteValue,
      itemCount: quoteContext.itemCount,
      complexity: quoteContext.complexity,
      quoteType: quoteContext.quoteType,
      creationDuration: quoteContext.creationDuration,
      clientType: quoteContext.clientType,
      isFromTemplate: quoteContext.isFromTemplate,
      templateName: quoteContext.templateName,
      triggerDelay: config.delayMs || 2000,
      surveyContext: 'post_quote_creation'
    });

    // Track quote creation success for analytics
    trackEvent(FORMBRICKS_EVENTS.QUOTE_CREATED, {
      quoteId: quoteContext.quoteId,
      quoteValue: quoteContext.quoteValue,
      itemCount: quoteContext.itemCount,
      complexity: quoteContext.complexity,
      quoteType: quoteContext.quoteType,
      hasSurveyTriggered: true
    });

    // Update frequency counters
    updateFrequencyCounters();

    // Mark as triggered
    setHasSurveyTriggered(true);

    // Call callback if provided
    onSurveyTriggered?.(quoteContext);

    console.log('✅ Post-quote creation survey triggered successfully');
  }, [
    isAvailable,
    hasSurveyTriggered,
    checkFrequencyLimits,
    checkConditions,
    config,
    quoteContext,
    setUserAttributes,
    trackEvent,
    updateFrequencyCounters,
    onSurveyTriggered
  ]);

  // Effect to trigger survey with delay
  useEffect(() => {
    if (quoteContext.quoteId && !hasSurveyTriggered) {
      // Clear any existing timeout
      if (triggerTimeoutRef.current) {
        clearTimeout(triggerTimeoutRef.current);
      }

      // Set new timeout
      const delay = config.delayMs || 2000;
      triggerTimeoutRef.current = setTimeout(() => {
        triggerSurvey();
      }, delay);

      console.log(`⏰ Survey trigger scheduled in ${delay}ms for quote ${quoteContext.quoteId}`);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (triggerTimeoutRef.current) {
        clearTimeout(triggerTimeoutRef.current);
        triggerTimeoutRef.current = null;
      }
    };
  }, [quoteContext.quoteId, hasSurveyTriggered, triggerSurvey, config.delayMs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (triggerTimeoutRef.current) {
        clearTimeout(triggerTimeoutRef.current);
      }
    };
  }, []);

  // This component is invisible - it only handles survey triggering logic
  return children ? <>{children}</> : null;
}

// Utility functions for localStorage management
function getStorageData(key: string): { date: string; count: number } {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Error reading survey frequency data:', error);
  }
  return { date: '', count: 0 };
}

function setStorageData(key: string, data: { date: string; count: number }) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Error storing survey frequency data:', error);
  }
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week}`;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Preset configurations for common use cases
export const SURVEY_CONFIGS = {
  POST_QUOTE_CREATION: {
    eventName: 'post_quote_creation_survey',
    delayMs: 3000, // 3 second delay to let user process the success
    frequencyCap: {
      maxPerDay: 2,
      maxPerWeek: 5,
      cooldownHours: 4
    }
  } as SurveyTriggerConfig,

  HIGH_VALUE_QUOTE: {
    eventName: 'high_value_quote_feedback',
    delayMs: 2000,
    frequencyCap: {
      maxPerDay: 1,
      maxPerWeek: 3,
      cooldownHours: 8
    },
    conditions: {
      minQuoteValue: 5000
    }
  } as SurveyTriggerConfig,

  COMPLEX_QUOTE_FEEDBACK: {
    eventName: 'complex_quote_feedback',
    delayMs: 4000,
    frequencyCap: {
      maxPerDay: 1,
      maxPerWeek: 2,
      cooldownHours: 12
    },
    conditions: {
      complexityRequired: 'complex',
      minItemCount: 5
    }
  } as SurveyTriggerConfig,

  NEW_CLIENT_EXPERIENCE: {
    eventName: 'new_client_quote_experience',
    delayMs: 5000,
    frequencyCap: {
      maxPerDay: 1,
      maxPerWeek: 3,
      cooldownHours: 6
    },
    conditions: {
      onlyForNewClients: true
    }
  } as SurveyTriggerConfig,
} as const;