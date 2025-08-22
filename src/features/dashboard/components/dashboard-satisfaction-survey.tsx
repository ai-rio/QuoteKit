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
  // TEMPORARILY DISABLED - This component was causing excessive API calls
  // and rate limiting issues with Formbricks
  
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