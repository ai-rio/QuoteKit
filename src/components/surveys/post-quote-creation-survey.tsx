'use client';

import { useEffect, useRef } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { analyzeQuoteComplexity } from '@/libs/complexity/analysis';

/**
 * FB-010: Post-Quote Creation Survey Component
 * 
 * Triggers surveys 5 seconds after successful quote creation
 * Implements complexity-based survey selection (FB-011)
 */

interface PostQuoteCreationSurveyProps {
  quoteId: string;
  quoteData: {
    total: number;
    itemCount: number;
    clientType?: 'new' | 'existing';
    creationDuration?: number;
    isFromTemplate?: boolean;
    templateName?: string;
  };
  onSurveyTriggered?: (surveyType: string) => void;
}

export function PostQuoteCreationSurvey({ 
  quoteId, 
  quoteData, 
  onSurveyTriggered 
}: PostQuoteCreationSurveyProps) {
  const { trackQuoteCreationSurvey, isAvailable } = useFormbricksTracking();
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Only trigger once per quote creation
    if (hasTriggered.current || !isAvailable) {
      return;
    }

    console.log('🎯 FB-010: Scheduling post-quote creation survey for 5 seconds...');

    // FB-010: 5-second delay before triggering survey
    const surveyTimer = setTimeout(() => {
      if (hasTriggered.current) return;
      
      hasTriggered.current = true;
      
      try {
        // FB-011: Analyze quote complexity to determine survey type
        const complexity = analyzeQuoteComplexity({
          itemCount: quoteData.itemCount,
          totalValue: quoteData.total,
          hasCustomItems: false, // Could be enhanced to detect custom items
          hasTax: true, // Assume tax is applied
          hasMarkup: true, // Assume markup is applied
        });

        console.log('📊 Quote complexity analysis:', complexity);

        // Determine survey type based on complexity and other factors
        let surveyType: 'post_creation' | 'high_value' | 'complex' | 'new_client' = 'post_creation';
        
        if (complexity.level === 'complex') {
          surveyType = 'complex';
        } else if (quoteData.total > 5000) {
          surveyType = 'high_value';
        } else if (quoteData.clientType === 'new') {
          surveyType = 'new_client';
        }

        console.log(`🔔 FB-010: Triggering ${surveyType} survey for quote ${quoteId}`);

        // Track the survey trigger event
        trackQuoteCreationSurvey(surveyType, {
          quoteId,
          quoteValue: quoteData.total,
          itemCount: quoteData.itemCount,
          complexity: complexity.level,
          quoteType: 'mixed', // Could be enhanced to detect service vs product
          clientType: quoteData.clientType,
          creationDuration: quoteData.creationDuration,
          isFromTemplate: quoteData.isFromTemplate,
          templateName: quoteData.templateName,
        });

        // Notify parent component
        if (onSurveyTriggered) {
          onSurveyTriggered(surveyType);
        }

        console.log('✅ FB-010: Post-quote creation survey triggered successfully');

      } catch (error) {
        console.error('❌ FB-010: Failed to trigger post-quote creation survey:', error);
      }
    }, 5000); // FB-010: 5-second delay

    // Cleanup timer on unmount
    return () => {
      clearTimeout(surveyTimer);
    };
  }, [quoteId, quoteData, trackQuoteCreationSurvey, isAvailable, onSurveyTriggered]);

  // This component doesn't render anything visible
  // It's purely for triggering the survey logic
  return null;
}

/**
 * Hook for easier integration with quote creation flows
 */
export function usePostQuoteCreationSurvey() {
  const { trackQuoteCreationSurvey, isAvailable } = useFormbricksTracking();

  const triggerSurvey = (quoteId: string, quoteData: PostQuoteCreationSurveyProps['quoteData']) => {
    if (!isAvailable) {
      console.warn('⚠️ Formbricks not available, cannot trigger survey');
      return;
    }

    console.log('🎯 FB-010: Manually triggering post-quote creation survey...');

    // Analyze complexity
    const complexity = analyzeQuoteComplexity({
      itemCount: quoteData.itemCount,
      totalValue: quoteData.total,
      hasCustomItems: false,
      hasTax: true,
      hasMarkup: true,
    });

    // Determine survey type
    let surveyType: 'post_creation' | 'high_value' | 'complex' | 'new_client' = 'post_creation';
    
    if (complexity.level === 'complex') {
      surveyType = 'complex';
    } else if (quoteData.total > 5000) {
      surveyType = 'high_value';
    } else if (quoteData.clientType === 'new') {
      surveyType = 'new_client';
    }

    // Track immediately (no delay for manual trigger)
    trackQuoteCreationSurvey(surveyType, {
      quoteId,
      quoteValue: quoteData.total,
      itemCount: quoteData.itemCount,
      complexity: complexity.level,
      quoteType: 'mixed',
      clientType: quoteData.clientType,
      creationDuration: quoteData.creationDuration,
      isFromTemplate: quoteData.isFromTemplate,
      templateName: quoteData.templateName,
    });

    return surveyType;
  };

  return {
    triggerSurvey,
    isAvailable,
  };
}
