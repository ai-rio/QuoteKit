'use client';

import { useEffect } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { checkAndTrackMilestones } from '@/libs/formbricks/tracking-utils';

import { DashboardStats } from '../types';

interface DashboardTrackingWrapperProps {
  stats: DashboardStats;
  userTier: string;
  isPremium: boolean;
}

export function DashboardTrackingWrapper({ 
  stats, 
  userTier, 
  isPremium 
}: DashboardTrackingWrapperProps) {
  const { 
    trackPageView: trackPageViewHook,
    trackUserMilestone,
    setUserAttributes
  } = useFormbricksTracking();

  useEffect(() => {
    // Track dashboard visit
    trackPageViewHook('/dashboard', {
      userTier,
      isPremium,
      hasQuotes: stats.totalQuotes > 0,
      hasRevenue: stats.totalRevenue > 0,
    });

    // Set user attributes for Formbricks
    setUserAttributes({
      subscriptionTier: userTier,
      quotesCreated: stats.totalQuotes,
      revenue: stats.totalRevenue,
      itemsInLibrary: stats.totalItems,
      templates: stats.totalTemplates,
      lastDashboardVisit: new Date().toISOString(),
    });

    // Check and track user milestones
    checkAndTrackMilestones({
      quotesCreated: stats.totalQuotes,
      totalRevenue: stats.totalRevenue,
      daysActive: 1, // This could be calculated from user data
      featuresUsed: ['dashboard', 'quotes', 'items'], // This could be dynamic
    });

    // Track first quote milestone
    if (stats.totalQuotes === 1) {
      trackUserMilestone('first_quote_created', {
        revenue: stats.totalRevenue,
        daysSinceSignup: 1, // This could be calculated
      });
    }
  }, [
    stats, 
    userTier, 
    isPremium, 
    trackPageViewHook,
    trackUserMilestone,
    setUserAttributes
  ]);

  return null; // This component only handles tracking, no UI
}