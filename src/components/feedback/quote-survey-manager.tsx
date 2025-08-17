'use client';

import { useCallback, useEffect, useState } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';

import { QuoteContext, SURVEY_CONFIGS, SurveyTrigger } from './survey-trigger';

interface QuoteSurveyManagerProps {
  quoteContext: QuoteContext;
  onSurveyTriggered?: (surveyType: string, context: QuoteContext) => void;
}

/**
 * QuoteSurveyManager - Intelligently manages multiple survey triggers based on quote characteristics
 * 
 * This component analyzes the quote context and determines which surveys should be triggered:
 * - Standard post-creation survey for all quotes
 * - High-value survey for quotes above threshold
 * - Complex quote survey for detailed quotes
 * - New client experience survey for first-time clients
 * 
 * Each survey has its own frequency capping and conditions to prevent survey fatigue.
 */
export function QuoteSurveyManager({ 
  quoteContext, 
  onSurveyTriggered 
}: QuoteSurveyManagerProps) {
  const { trackQuoteCreationSurvey } = useFormbricksTracking();
  const [activeSurveys, setActiveSurveys] = useState<string[]>([]);

  // Determine which surveys should be triggered based on quote context
  const determineSurveyTypes = useCallback((context: QuoteContext): string[] => {
    const surveys: string[] = [];

    // Always consider the basic post-creation survey
    surveys.push('post_creation');

    // High-value quote survey (threshold: $5,000)
    if (context.quoteValue >= 5000) {
      surveys.push('high_value');
    }

    // Complex quote survey (5+ items OR high value)
    if (context.complexity === 'complex') {
      surveys.push('complex');
    }

    // New client experience survey
    if (context.clientType === 'new') {
      surveys.push('new_client');
    }

    console.log('📊 Determined survey types for quote:', {
      quoteId: context.quoteId,
      quoteValue: context.quoteValue,
      complexity: context.complexity,
      clientType: context.clientType,
      surveys
    });

    return surveys;
  }, []);

  // Handle survey trigger callback
  const handleSurveyTriggered = useCallback((surveyType: string, context: QuoteContext) => {
    console.log(`📋 Survey triggered: ${surveyType} for quote ${context.quoteId}`);
    
    // Track the survey trigger
    trackQuoteCreationSurvey(
      surveyType as 'post_creation' | 'high_value' | 'complex' | 'new_client',
      context
    );

    // Call parent callback if provided
    onSurveyTriggered?.(surveyType, context);
  }, [trackQuoteCreationSurvey, onSurveyTriggered]);

  // Update active surveys when quote context changes
  useEffect(() => {
    if (quoteContext.quoteId) {
      const surveys = determineSurveyTypes(quoteContext);
      setActiveSurveys(surveys);
    }
  }, [quoteContext, determineSurveyTypes]);

  // Survey configuration mapping
  const getSurveyConfig = (surveyType: string) => {
    switch (surveyType) {
      case 'post_creation':
        return SURVEY_CONFIGS.POST_QUOTE_CREATION;
      case 'high_value':
        return SURVEY_CONFIGS.HIGH_VALUE_QUOTE;
      case 'complex':
        return SURVEY_CONFIGS.COMPLEX_QUOTE_FEEDBACK;
      case 'new_client':
        return SURVEY_CONFIGS.NEW_CLIENT_EXPERIENCE;
      default:
        return SURVEY_CONFIGS.POST_QUOTE_CREATION;
    }
  };

  // Render survey triggers with staggered delays to prevent conflicts
  return (
    <>
      {activeSurveys.map((surveyType, index) => {
        const config = getSurveyConfig(surveyType);
        
        // Stagger survey triggers to prevent conflicts
        // Each subsequent survey gets an additional 10-second delay
        const staggeredConfig = {
          ...config,
          delayMs: (config.delayMs || 3000) + (index * 10000),
          eventName: `${config.eventName}_${quoteContext.quoteId}`
        };

        return (
          <SurveyTrigger
            key={`${surveyType}-${quoteContext.quoteId}`}
            quoteContext={quoteContext}
            config={staggeredConfig}
            onSurveyTriggered={(context) => handleSurveyTriggered(surveyType, context)}
          />
        );
      })}
    </>
  );
}

/**
 * Utility function to check if a quote should trigger specific survey types
 */
export function shouldTriggerSurvey(
  surveyType: 'post_creation' | 'high_value' | 'complex' | 'new_client',
  quoteContext: QuoteContext
): boolean {
  switch (surveyType) {
    case 'post_creation':
      // All quotes should trigger this
      return true;
      
    case 'high_value':
      // Only quotes above $5,000
      return quoteContext.quoteValue >= 5000;
      
    case 'complex':
      // Complex quotes with many items or high value
      return quoteContext.complexity === 'complex';
      
    case 'new_client':
      // Only for new clients
      return quoteContext.clientType === 'new';
      
    default:
      return false;
  }
}

/**
 * Utility function to get recommended survey priority order
 */
export function getSurveyPriorityOrder(quoteContext: QuoteContext): string[] {
  const surveys: { type: string; priority: number }[] = [];

  // Base survey - always included, low priority
  surveys.push({ type: 'post_creation', priority: 1 });

  // New client experience - highest priority for user onboarding
  if (quoteContext.clientType === 'new') {
    surveys.push({ type: 'new_client', priority: 4 });
  }

  // High-value feedback - high priority for business insights
  if (quoteContext.quoteValue >= 5000) {
    surveys.push({ type: 'high_value', priority: 3 });
  }

  // Complex quote feedback - medium priority for process improvement
  if (quoteContext.complexity === 'complex') {
    surveys.push({ type: 'complex', priority: 2 });
  }

  // Sort by priority (highest first) and return types
  return surveys
    .sort((a, b) => b.priority - a.priority)
    .map(s => s.type);
}