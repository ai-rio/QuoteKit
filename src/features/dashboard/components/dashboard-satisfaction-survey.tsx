'use client';

import { useCallback,useEffect, useState } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';

interface DashboardSatisfactionSurveyProps {
  userTier: string;
  isPremium: boolean;
  stats: {
    totalQuotes: number;
    totalRevenue: number;
    acceptedQuotes: number;
    totalItems: number;
    totalTemplates: number;
  };
}

/**
 * Dashboard Satisfaction Survey Trigger Component
 * 
 * Implements a carefully designed satisfaction survey for dashboard experience
 * following UX research best practices:
 * - 3-5 questions maximum for >10% completion rate
 * - Triggered after 30 seconds of dashboard interaction
 * - Mobile-optimized and contextually relevant
 * - Focuses on usability and feature discovery
 */
export function DashboardSatisfactionSurvey({ 
  userTier, 
  isPremium, 
  stats 
}: DashboardSatisfactionSurveyProps) {
  const { trackEvent, setUserAttributes, isAvailable } = useFormbricksTracking();
  const [surveyTriggered, setSurveyTriggered] = useState(false);
  const [timeOnDashboard, setTimeOnDashboard] = useState(0);

  useEffect(() => {
    // Don't trigger if Formbricks isn't available
    if (!isAvailable) {
      console.log('🔍 Dashboard satisfaction survey: Formbricks not available, skipping survey setup');
      return;
    }

    // Track dashboard session start
    const sessionStartTime = Date.now();
    console.log('📊 Dashboard satisfaction survey: Session started, setting up triggers');

    // Set up timing tracker
    const timeTracker = setInterval(() => {
      const currentTime = Math.floor((Date.now() - sessionStartTime) / 1000);
      setTimeOnDashboard(currentTime);
    }, 1000);

    // Set user attributes for survey targeting
    setUserAttributes({
      subscriptionTier: userTier,
      isPremiumUser: isPremium,
      hasCreatedQuotes: stats.totalQuotes > 0,
      hasGeneratedRevenue: stats.totalRevenue > 0,
      dashboardExperienceLevel: getDashboardExperienceLevel(),
      lastDashboardVisit: new Date().toISOString(),
      timeSpentOnDashboard: 0, // Will be updated
    });

    // Trigger survey after 30 seconds of engagement
    const surveyTimer = setTimeout(() => {
      if (!surveyTriggered) {
        triggerDashboardSatisfactionSurvey();
        setSurveyTriggered(true);
      }
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      clearInterval(timeTracker);
      clearTimeout(surveyTimer);
      
      // Track final time spent on dashboard
      const finalTimeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      setUserAttributes({
        timeSpentOnDashboard: finalTimeSpent,
      });
      
      console.log(`📊 Dashboard satisfaction survey: Session ended after ${finalTimeSpent} seconds`);
    };
  }, [isAvailable, userTier, isPremium, stats, surveyTriggered, setUserAttributes, getDashboardExperienceLevel, triggerDashboardSatisfactionSurvey]);

  /**
   * Determine user's dashboard experience level based on usage patterns
   */
  const getDashboardExperienceLevel = useCallback((): string => {
    if (stats.totalQuotes === 0) return 'new_user';
    if (stats.totalQuotes < 5) return 'beginner';
    if (stats.totalQuotes < 20) return 'intermediate';
    return 'advanced';
  }, [stats.totalQuotes]);

  /**
   * Trigger the dashboard satisfaction survey with contextual data
   */
  const triggerDashboardSatisfactionSurvey = useCallback(() => {
    console.log('🎯 Triggering dashboard satisfaction survey');
    
    // Track survey trigger event
    trackEvent(FORMBRICKS_EVENTS.DASHBOARD_SATISFACTION_SURVEY_TRIGGERED, {
      userTier,
      isPremium,
      experienceLevel: getDashboardExperienceLevel(),
      timeBeforeTrigger: 30, // seconds
      hasQuotes: stats.totalQuotes > 0,
      hasRevenue: stats.totalRevenue > 0,
      quotesCount: stats.totalQuotes,
      revenue: stats.totalRevenue,
      triggerContext: 'dashboard_30_second_engagement',
      surveyVersion: 'v1.0',
      timestamp: new Date().toISOString(),
    });

    // Trigger the actual survey using Formbricks event
    trackEvent('dashboard_satisfaction_survey_show', {
      context: 'dashboard_main',
      userSegment: getDashboardExperienceLevel(),
      premiumStatus: isPremium ? 'premium' : 'free',
      engagementLevel: timeOnDashboard >= 30 ? 'engaged' : 'quick_visit',
    });
  }, [trackEvent, userTier, isPremium, getDashboardExperienceLevel, stats.totalQuotes, stats.totalRevenue, timeOnDashboard]);

  // Track dashboard interactions that indicate engagement
  useEffect(() => {
    const trackInteraction = (eventType: string) => {
      console.log(`📊 Dashboard interaction: ${eventType}`);
      trackEvent(FORMBRICKS_EVENTS.DASHBOARD_INTERACTION, {
        interactionType: eventType,
        timeOnPage: timeOnDashboard,
        userTier,
        isPremium,
      });
    };

    // Track scroll engagement
    const handleScroll = () => {
      if (timeOnDashboard >= 5) { // Only track after 5 seconds
        trackInteraction('scroll');
      }
    };

    // Track click engagement
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-tour]')) {
        const tourId = target.closest('[data-tour]')?.getAttribute('data-tour');
        trackInteraction(`click_${tourId}`);
      }
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
    };
  }, [timeOnDashboard, trackEvent, userTier, isPremium]);

  // This component is invisible - it only handles survey triggering logic
  return null;
}

/**
 * Dashboard Satisfaction Survey Questions Configuration
 * 
 * This configuration defines the survey structure that should be set up
 * in Formbricks Cloud. It follows UX research best practices for high
 * completion rates and actionable insights.
 */
export const DASHBOARD_SATISFACTION_SURVEY_CONFIG = {
  id: 'dashboard_satisfaction_v1',
  name: 'Dashboard Satisfaction Survey',
  description: 'Measure user satisfaction with QuoteKit dashboard experience',
  
  // Trigger conditions
  triggers: {
    event: 'dashboard_satisfaction_survey_show',
    conditions: {
      timeOnPage: '>=30', // At least 30 seconds
      userSegment: ['new_user', 'beginner', 'intermediate', 'advanced'],
      premiumStatus: ['premium', 'free'],
    }
  },

  // Survey questions (max 5 for high completion rate)
  questions: [
    {
      id: 'satisfaction_rating',
      type: 'rating',
      question: 'How satisfied are you with the QuoteKit dashboard?',
      scale: {
        min: 1,
        max: 5,
        labels: {
          1: 'Very Unsatisfied',
          2: 'Unsatisfied', 
          3: 'Neutral',
          4: 'Satisfied',
          5: 'Very Satisfied'
        }
      },
      required: true,
      description: 'Your overall satisfaction with the dashboard experience'
    },
    {
      id: 'ease_of_use',
      type: 'rating',
      question: 'How easy is it to find what you need on the dashboard?',
      scale: {
        min: 1,
        max: 5,
        labels: {
          1: 'Very Difficult',
          2: 'Difficult',
          3: 'Okay',
          4: 'Easy', 
          5: 'Very Easy'
        }
      },
      required: true,
      description: 'Rate the usability and navigation of the dashboard'
    },
    {
      id: 'feature_discovery',
      type: 'multipleChoice',
      question: 'Which features have you discovered and used from the dashboard?',
      options: [
        'Quick Stats Overview',
        'Recent Activity',
        'Quick Actions Panel',
        'Analytics (Premium)',
        'Create New Quote',
        'Item Library Access',
        'Account Settings',
        'None of these'
      ],
      allowMultiple: true,
      required: false,
      description: 'Help us understand feature adoption'
    },
    {
      id: 'improvement_priority',
      type: 'multipleChoice',
      question: 'What would improve your dashboard experience the most?',
      options: [
        'More detailed analytics',
        'Faster loading times',
        'Better mobile experience',
        'More customization options',
        'Clearer navigation',
        'Additional quick actions',
        'Better visual design',
        'Everything is great as is'
      ],
      allowMultiple: false,
      required: false,
      description: 'Prioritize improvements based on user needs'
    },
    {
      id: 'open_feedback',
      type: 'openText',
      question: 'Any additional thoughts on improving the dashboard?',
      placeholder: 'Share any specific suggestions or feedback...',
      required: false,
      maxLength: 500,
      description: 'Optional detailed feedback for qualitative insights'
    }
  ],

  // Targeting and display settings
  targeting: {
    userAttributes: {
      subscriptionTier: ['free', 'premium'],
      hasCreatedQuotes: [true, false],
      dashboardExperienceLevel: ['new_user', 'beginner', 'intermediate', 'advanced']
    },
    frequency: {
      maxShowsPerUser: 1, // Only show once per user
      cooldownPeriod: '30 days', // Don't reshown for 30 days
    }
  },

  // Display configuration for mobile optimization
  display: {
    placement: 'center',
    overlay: true,
    closeButton: true,
    mobileOptimized: true,
    styling: {
      backgroundColor: '#ffffff',
      textColor: '#2A3D2F', // charcoal
      primaryColor: '#2A3D2F', // forest-green
      borderRadius: '16px',
      fontSize: '16px'
    }
  },

  // Success metrics to track
  metrics: {
    targetCompletionRate: 0.15, // 15% completion rate target
    targetResponseTime: 120, // 2 minutes average response time
    segmentationMetrics: [
      'completion_by_user_tier',
      'satisfaction_by_experience_level',
      'feature_adoption_by_segment'
    ]
  }
};