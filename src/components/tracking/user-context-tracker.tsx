'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { useUser } from '@/hooks/use-user';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';

interface UserContextTrackerProps {
  /** Additional custom attributes to sync */
  customAttributes?: Record<string, any>;
  /** How frequently to sync context (ms) */
  syncInterval?: number;
  /** Whether to track usage statistics */
  trackUsageStats?: boolean;
  /** Whether to track session events */
  trackSessionEvents?: boolean;
}

interface UsageMetrics {
  quotesCreated: number;
  quotesThisMonth: number;
  totalRevenue: number;
  averageQuoteValue: number;
  lastActiveDate: string;
  daysActive: number;
  featuresUsed: string[];
}

export function UserContextTracker({
  customAttributes = {},
  syncInterval = 30000, // 30 seconds
  trackUsageStats = true,
  trackSessionEvents = true
}: UserContextTrackerProps) {
  const { data: user } = useUser();
  const { setUserAttributes, trackSession, trackEvent, isAvailable } = useFormbricksTracking();
  const lastSyncRef = useRef<string>('');
  const sessionStartedRef = useRef<boolean>(false);
  const usageMetricsRef = useRef<UsageMetrics | null>(null);

  // Get current subscription tier
  const getSubscriptionTier = useCallback(async () => {
    if (!user) return 'anonymous';

    try {
      // Check if user has subscription data in metadata
      if (user.user_metadata?.subscriptionTier) {
        return user.user_metadata.subscriptionTier;
      }

      // Fallback to checking subscription status via API
      const response = await fetch('/api/subscription-status');
      if (response.ok) {
        const data = await response.json();
        return data.tier || 'free';
      }
      
      return 'free';
    } catch (error) {
      console.warn('Error getting subscription tier:', error);
      return 'free';
    }
  }, [user]);

  // Fetch usage statistics
  const getUsageMetrics = useCallback(async (): Promise<UsageMetrics | null> => {
    if (!user || !trackUsageStats) return null;

    try {
      const response = await fetch('/api/features/usage');
      if (response.ok) {
        const data = await response.json();
        return {
          quotesCreated: data.totalQuotes || 0,
          quotesThisMonth: data.quotesThisMonth || 0,
          totalRevenue: data.totalRevenue || 0,
          averageQuoteValue: data.averageQuoteValue || 0,
          lastActiveDate: new Date().toISOString(),
          daysActive: data.daysActive || 1,
          featuresUsed: data.featuresUsed || []
        };
      }
    } catch (error) {
      console.warn('Error fetching usage metrics:', error);
    }
    
    return null;
  }, [user, trackUsageStats]);

  // Sync user context to Formbricks
  const syncUserContext = useCallback(async () => {
    if (!user || !isAvailable) return;

    try {
      const subscriptionTier = await getSubscriptionTier();
      const usageMetrics = await getUsageMetrics();
      
      // Store metrics for later use
      if (usageMetrics) {
        usageMetricsRef.current = usageMetrics;
      }

      // Build comprehensive user attributes
      const userAttributes = {
        // Basic user info
        userId: user.id,
        email: user.email || '',
        emailDomain: user.email?.split('@')[1] || '',
        signupDate: user.created_at || '',
        
        // Subscription info
        subscriptionTier,
        isPremium: subscriptionTier !== 'free' && subscriptionTier !== 'anonymous',
        
        // Usage statistics (if available)
        ...(usageMetrics && {
          quotesCreated: usageMetrics.quotesCreated,
          quotesThisMonth: usageMetrics.quotesThisMonth,
          totalRevenue: usageMetrics.totalRevenue,
          averageQuoteValue: usageMetrics.averageQuoteValue,
          lastActiveDate: usageMetrics.lastActiveDate,
          daysActive: usageMetrics.daysActive,
          featuresUsed: usageMetrics.featuresUsed.join(','),
          
          // Calculated metrics
          revenueCategory: usageMetrics.totalRevenue > 50000 ? 'high' : 
                          usageMetrics.totalRevenue > 10000 ? 'medium' : 'low',
          userType: usageMetrics.quotesCreated > 50 ? 'power_user' :
                   usageMetrics.quotesCreated > 10 ? 'regular_user' : 'new_user',
          activityLevel: usageMetrics.daysActive > 30 ? 'very_active' :
                        usageMetrics.daysActive > 7 ? 'active' : 'new'
        }),
        
        // Browser/session context
        currentPage: typeof window !== 'undefined' ? window.location.pathname : '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        screenResolution: typeof window !== 'undefined' ? 
          `${window.screen.width}x${window.screen.height}` : '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: typeof window !== 'undefined' ? 
          window.navigator.language : '',
        
        // Custom attributes
        ...customAttributes,
        
        // Sync metadata
        lastSyncTime: new Date().toISOString(),
        contextVersion: '1.0.0'
      };

      // Generate a hash of current attributes to avoid unnecessary syncs
      const currentAttributesHash = JSON.stringify(userAttributes);
      if (lastSyncRef.current === currentAttributesHash) {
        return; // No changes, skip sync
      }

      // Sync to Formbricks
      setUserAttributes(userAttributes);
      lastSyncRef.current = currentAttributesHash;

      console.log('🔄 User context synced to Formbricks:', {
        userId: user.id,
        tier: subscriptionTier,
        metrics: usageMetrics ? 'included' : 'not_available',
        attributeCount: Object.keys(userAttributes).length
      });

      // Track context sync event
      trackEvent(FORMBRICKS_EVENTS.DAILY_ACTIVE_USER, {
        syncedAt: new Date().toISOString(),
        contextVersion: '1.0.0',
        attributeCount: Object.keys(userAttributes).length
      });

    } catch (error) {
      console.error('Error syncing user context:', error);
    }
  }, [user, isAvailable, getSubscriptionTier, getUsageMetrics, customAttributes, setUserAttributes, trackEvent]);

  // Track session start
  const handleSessionStart = useCallback(() => {
    if (!trackSessionEvents || !isAvailable || sessionStartedRef.current) return;
    
    sessionStartedRef.current = true;
    trackSession('start');
    
    // Also track as a page view for dashboard analytics
    trackEvent(FORMBRICKS_EVENTS.SESSION_START, {
      sessionId: user?.id || 'anonymous',
      startPage: typeof window !== 'undefined' ? window.location.pathname : '',
      startTime: new Date().toISOString()
    });
  }, [trackSessionEvents, isAvailable, trackSession, trackEvent, user]);

  // Track session end
  const handleSessionEnd = useCallback(() => {
    if (!trackSessionEvents || !isAvailable || !sessionStartedRef.current) return;
    
    trackSession('end');
    sessionStartedRef.current = false;
  }, [trackSessionEvents, isAvailable, trackSession]);

  // Track milestones based on usage metrics
  const trackUserMilestones = useCallback(() => {
    if (!usageMetricsRef.current || !isAvailable) return;
    
    const metrics = usageMetricsRef.current;
    
    // First quote milestone
    if (metrics.quotesCreated === 1) {
      trackEvent(FORMBRICKS_EVENTS.FIRST_QUOTE_CREATED, {
        totalRevenue: metrics.totalRevenue,
        daysActive: metrics.daysActive
      });
    }
    
    // Power user milestone (50+ quotes)
    if (metrics.quotesCreated >= 50 && metrics.quotesCreated < 55) {
      trackEvent(FORMBRICKS_EVENTS.POWER_USER_MILESTONE, {
        quotesCreated: metrics.quotesCreated,
        totalRevenue: metrics.totalRevenue,
        averageQuoteValue: metrics.averageQuoteValue,
        daysActive: metrics.daysActive
      });
    }
    
    // High value milestone ($10,000+ revenue)
    if (metrics.totalRevenue >= 10000 && metrics.totalRevenue < 12000) {
      trackEvent(FORMBRICKS_EVENTS.HIGH_VALUE_QUOTE_CREATED, {
        totalRevenue: metrics.totalRevenue,
        quotesCreated: metrics.quotesCreated,
        averageQuoteValue: metrics.averageQuoteValue
      });
    }
  }, [trackEvent, isAvailable]);

  // Initial sync when component mounts
  useEffect(() => {
    if (user && isAvailable) {
      syncUserContext();
      handleSessionStart();
    }
  }, [user, isAvailable, syncUserContext, handleSessionStart]);

  // Set up periodic context sync
  useEffect(() => {
    if (!user || !isAvailable || syncInterval <= 0) return;

    const intervalId = setInterval(() => {
      syncUserContext();
      trackUserMilestones();
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, [user, isAvailable, syncInterval, syncUserContext, trackUserMilestones]);

  // Handle session end on unmount
  useEffect(() => {
    return () => {
      handleSessionEnd();
    };
  }, [handleSessionEnd]);

  // Handle page visibility changes for session tracking
  useEffect(() => {
    if (!trackSessionEvents || typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSessionStart();
      } else {
        handleSessionEnd();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackSessionEvents, handleSessionStart, handleSessionEnd]);

  // Handle route changes to update context
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRouteChange = () => {
      // Sync context with new page info
      setTimeout(syncUserContext, 100); // Small delay to ensure page has updated
    };

    // Listen for navigation changes
    window.addEventListener('popstate', handleRouteChange);
    
    // Also listen for pushstate/replacestate (for Next.js navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [syncUserContext]);

  // This is a tracking component that doesn't render anything
  return null;
}