'use client';

import { useCallback, useMemo,useState } from 'react';

import { 
  SegmentSurveyConfig,
  SurveyFrequency,
  TriggerCondition,
  UserActivity, 
  UserSegment} from '@/components/feedback/types';
import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client';

interface UseSegmentSurveysReturn {
  /** Get user's activity data */
  getUserActivity: (userId: string) => Promise<UserActivity | null>;
  /** Determine user segment based on tier and activity */
  getUserSegment: (userId: string, tier: string, activity: UserActivity) => Promise<UserSegment>;
  /** Get survey configurations for a segment */
  getSegmentConfigs: (segment: UserSegment) => Promise<SegmentSurveyConfig[]>;
  /** Check if a survey should be triggered */
  shouldTriggerSurvey: (
    userId: string, 
    config: SegmentSurveyConfig, 
    activity: UserActivity, 
    currentPage: string
  ) => Promise<boolean>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Hook for managing segment-specific surveys
 * Handles user segmentation, activity tracking, and survey configuration
 */
export function useSegmentSurveys(): UseSegmentSurveysReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user activity data from database
  const getUserActivity = useCallback(async (userId: string): Promise<UserActivity | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createSupabaseClientClient();

      // Get user registration date
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      // Get quotes data for activity metrics
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('created_at, total_amount')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error fetching quotes data:', quotesError);
        // Continue with limited data
      }

      // Calculate activity metrics
      const now = new Date();
      const createdAt = new Date(userData.created_at);
      const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      const quotes = quotesData || [];
      const quotesCreated = quotes.length;
      const totalValue = quotes.reduce((sum: number, quote: any) => sum + (quote.total_amount || 0), 0);
      const averageQuoteValue = quotesCreated > 0 ? totalValue / quotesCreated : 0;

      // Determine login frequency based on recent activity
      const recentQuotes = quotes.filter((quote: any) => {
        const quoteDate = new Date(quote.created_at);
        const daysSince = (now.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });

      let loginFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
      if (recentQuotes.length >= 20) {
        loginFrequency = 'daily';
      } else if (recentQuotes.length >= 8) {
        loginFrequency = 'weekly';
      } else if (recentQuotes.length >= 2) {
        loginFrequency = 'monthly';
      } else {
        loginFrequency = 'rarely';
      }

      const lastActiveDate = quotes.length > 0 ? new Date(quotes[0].created_at) : createdAt;

      const activity: UserActivity = {
        quotesCreated,
        lastActiveDate,
        accountAge,
        averageQuoteValue,
        featureUsage: {
          quotes: quotesCreated,
          // Add more feature usage tracking as needed
        },
        loginFrequency
      };

      return activity;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting user activity:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Determine user segment based on tier and activity
  const getUserSegment = useCallback(async (
    userId: string, 
    tier: string, 
    activity: UserActivity
  ): Promise<UserSegment> => {
    // Primary segmentation by subscription tier
    if (tier === 'enterprise') {
      return 'enterprise';
    }
    
    if (tier === 'pro') {
      return 'pro';
    }

    // For free tier users, segment by activity patterns
    if (tier === 'free') {
      // New users (less than 14 days)
      if (activity.accountAge < 14) {
        return 'new_user';
      }

      // Heavy users (lots of quotes despite being free)
      if (activity.quotesCreated >= 20 || activity.loginFrequency === 'daily') {
        return 'heavy_user';
      }

      // Light users (minimal activity)
      if (activity.quotesCreated <= 3 || activity.loginFrequency === 'rarely') {
        return 'light_user';
      }

      // Default free tier
      return 'free';
    }

    // Fallback for unknown tiers
    return activity.accountAge < 14 ? 'new_user' : 'free';
  }, []);

  // Get survey configurations for a specific segment
  const getSegmentConfigs = useCallback(async (segment: UserSegment): Promise<SegmentSurveyConfig[]> => {
    try {
      // Import the configurations dynamically to avoid circular dependencies
      const { getEnabledSegmentConfigs } = await import('@/components/feedback/segment-survey-configs');
      return getEnabledSegmentConfigs(segment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting segment configs:', err);
      return [];
    }
  }, []);

  // Check if a survey should be triggered based on various conditions
  const shouldTriggerSurvey = useCallback(async (
    userId: string,
    config: SegmentSurveyConfig,
    activity: UserActivity,
    currentPage: string
  ): Promise<boolean> => {
    try {
      // Check if config is enabled
      if (!config.enabled) {
        return false;
      }

      // Check trigger conditions
      const conditionsMet = config.triggerConditions.every(condition => {
        switch (condition.type) {
          case 'activity':
            const activityValue = activity[condition.field as keyof UserActivity];
            return evaluateCondition(activityValue, condition);
          case 'event':
            return evaluateCondition(currentPage, condition);
          case 'time':
            const now = Date.now();
            return evaluateCondition(now, condition);
          default:
            return true;
        }
      });

      if (!conditionsMet) {
        return false;
      }

      // Check frequency limits (simplified)
      const canTrigger = await checkFrequencyLimits(userId, config.frequency);
      
      return canTrigger;
    } catch (err) {
      console.error('Error checking survey trigger:', err);
      return false;
    }
  }, []);

  return {
    getUserActivity,
    getUserSegment,
    getSegmentConfigs,
    shouldTriggerSurvey,
    isLoading,
    error
  };
}

// Helper function to evaluate trigger conditions
function evaluateCondition(actualValue: any, condition: TriggerCondition): boolean {
  switch (condition.operator) {
    case 'equals':
      return actualValue === condition.value;
    case 'greater_than':
      return Number(actualValue) > Number(condition.value);
    case 'less_than':
      return Number(actualValue) < Number(condition.value);
    case 'contains':
      return String(actualValue).includes(String(condition.value));
    default:
      return false;
  }
}

// Helper function to check frequency limits
async function checkFrequencyLimits(userId: string, frequency: SurveyFrequency): Promise<boolean> {
  try {
    // Simple localStorage-based frequency checking
    const now = new Date();
    const today = now.toDateString();
    const thisWeek = getWeekKey(now);
    
    // Check daily limit
    const dailyKey = `survey_daily_${userId}_${today}`;
    const dailyCount = parseInt(localStorage.getItem(dailyKey) || '0', 10);
    if (dailyCount >= frequency.maxPerDay) {
      return false;
    }

    // Check weekly limit
    const weeklyKey = `survey_weekly_${userId}_${thisWeek}`;
    const weeklyCount = parseInt(localStorage.getItem(weeklyKey) || '0', 10);
    if (weeklyCount >= frequency.maxPerWeek) {
      return false;
    }

    // Check cooldown
    const lastSurveyKey = `last_survey_${userId}`;
    const lastSurveyTime = parseInt(localStorage.getItem(lastSurveyKey) || '0', 10);
    const cooldownMs = frequency.cooldownDays * 24 * 60 * 60 * 1000;
    
    if (now.getTime() - lastSurveyTime < cooldownMs) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error checking frequency limits:', error);
    return true; // Allow on error
  }
}

// Helper function to get week key for weekly limits
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const weekNum = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
  return `${year}-W${weekNum}`;
}

