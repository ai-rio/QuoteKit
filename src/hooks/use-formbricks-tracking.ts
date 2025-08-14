'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { useUser } from '@/hooks/use-user';
import { FormbricksManager } from '@/libs/formbricks';
import { FORMBRICKS_EVENTS,FormbricksEventName } from '@/libs/formbricks/types';

/**
 * Custom hook for tracking Formbricks events throughout the QuoteKit app
 */
export function useFormbricksTracking() {
  const { data: user } = useUser();
  // const router = useRouter();

  const trackEvent = useCallback((
    eventName: FormbricksEventName | string, 
    properties?: Record<string, any>
  ) => {
    const manager = FormbricksManager.getInstance();
    
    // Don't track if Formbricks is not initialized
    if (!manager.isInitialized()) {
      return;
    }

    const context = {
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userTier: user?.user_metadata?.subscriptionTier || 'unknown',
      sessionId: user?.id || 'anonymous',
      timestamp: new Date().toISOString(),
    };

    manager.track(eventName, {
      ...properties,
      context,
    });
  }, [user]);

  // Specialized tracking functions for common use cases
  const trackPageView = useCallback((page: string, additionalProps?: Record<string, any>) => {
    trackEvent(FORMBRICKS_EVENTS.PAGE_VIEW, {
      page,
      ...additionalProps,
    });
  }, [trackEvent]);

  const trackQuoteAction = useCallback((
    action: 'created' | 'saved_draft' | 'sent' | 'accepted' | 'rejected' | 'duplicated' | 'deleted',
    quoteData: {
      quoteId: string;
      quoteValue?: number;
      itemCount?: number;
      isTemplate?: boolean;
      complexity?: 'simple' | 'complex';
    }
  ) => {
    const eventMap = {
      created: FORMBRICKS_EVENTS.QUOTE_CREATED,
      saved_draft: FORMBRICKS_EVENTS.QUOTE_SAVED_DRAFT,
      sent: FORMBRICKS_EVENTS.QUOTE_SENT,
      accepted: FORMBRICKS_EVENTS.QUOTE_ACCEPTED,
      rejected: FORMBRICKS_EVENTS.QUOTE_REJECTED,
      duplicated: FORMBRICKS_EVENTS.QUOTE_DUPLICATED,
      deleted: FORMBRICKS_EVENTS.QUOTE_DELETED,
    };

    trackEvent(eventMap[action], {
      quoteId: quoteData.quoteId,
      quoteValue: quoteData.quoteValue,
      itemCount: quoteData.itemCount,
      isTemplate: quoteData.isTemplate,
      complexity: quoteData.complexity,
    });

    // Track special milestones
    if (action === 'created' && quoteData.complexity === 'complex') {
      trackEvent(FORMBRICKS_EVENTS.COMPLEX_QUOTE_CREATED, quoteData);
    }
    
    if (action === 'created' && quoteData.quoteValue && quoteData.quoteValue > 10000) {
      trackEvent(FORMBRICKS_EVENTS.HIGH_VALUE_QUOTE_CREATED, {
        ...quoteData,
        threshold: 10000,
      });
    }
  }, [trackEvent]);

  const trackFeatureUsage = useCallback((
    featureName: string,
    action: 'discovered' | 'used',
    additionalProps?: Record<string, any>
  ) => {
    const event = action === 'discovered' 
      ? FORMBRICKS_EVENTS.FEATURE_DISCOVERED 
      : FORMBRICKS_EVENTS.FEATURE_USED;
    
    trackEvent(event, {
      featureName,
      ...additionalProps,
    });
  }, [trackEvent]);

  const trackUserMilestone = useCallback((
    milestone: 'onboarding_completed' | 'first_quote_created' | 'power_user',
    additionalProps?: Record<string, any>
  ) => {
    const eventMap = {
      onboarding_completed: FORMBRICKS_EVENTS.ONBOARDING_COMPLETED,
      first_quote_created: FORMBRICKS_EVENTS.FIRST_QUOTE_CREATED,
      power_user: FORMBRICKS_EVENTS.POWER_USER_MILESTONE,
    };

    trackEvent(eventMap[milestone], additionalProps);
  }, [trackEvent]);

  const trackConversion = useCallback((
    action: 'initiated' | 'completed' | 'abandoned',
    additionalProps?: Record<string, any>
  ) => {
    const eventMap = {
      initiated: FORMBRICKS_EVENTS.UPGRADE_INITIATED,
      completed: FORMBRICKS_EVENTS.UPGRADE_COMPLETED,
      abandoned: FORMBRICKS_EVENTS.UPGRADE_ABANDONED,
    };

    trackEvent(eventMap[action], additionalProps);
  }, [trackEvent]);

  const trackError = useCallback((
    errorType: 'general' | 'pdf_generation' | 'email_send' | 'feature_limit',
    errorDetails: {
      errorMessage?: string;
      errorCode?: string;
      context?: Record<string, any>;
    }
  ) => {
    const eventMap = {
      general: FORMBRICKS_EVENTS.ERROR_ENCOUNTERED,
      pdf_generation: FORMBRICKS_EVENTS.PDF_GENERATION_FAILED,
      email_send: FORMBRICKS_EVENTS.EMAIL_SEND_FAILED,
      feature_limit: FORMBRICKS_EVENTS.FEATURE_LIMIT_HIT,
    };

    trackEvent(eventMap[errorType], {
      errorMessage: errorDetails.errorMessage,
      errorCode: errorDetails.errorCode,
      ...errorDetails.context,
    });
  }, [trackEvent]);

  const trackSession = useCallback((action: 'start' | 'end') => {
    const event = action === 'start' 
      ? FORMBRICKS_EVENTS.SESSION_START 
      : FORMBRICKS_EVENTS.SESSION_END;
    
    trackEvent(event, {
      sessionDuration: action === 'end' ? Date.now() : undefined,
    });
  }, [trackEvent]);

  const registerRouteChange = useCallback(() => {
    const manager = FormbricksManager.getInstance();
    manager.registerRouteChange();
    
    // Also track route change as an event
    trackEvent(FORMBRICKS_EVENTS.ROUTE_CHANGE, {
      newRoute: typeof window !== 'undefined' ? window.location.pathname : '',
    });
  }, [trackEvent]);

  const setUserAttributes = useCallback((attributes: Record<string, any>) => {
    const manager = FormbricksManager.getInstance();
    manager.setAttributes(attributes);
  }, []);

  return { 
    // Core tracking
    trackEvent, 
    registerRouteChange, 
    setUserAttributes,
    
    // Specialized tracking functions
    trackPageView,
    trackQuoteAction,
    trackFeatureUsage,
    trackUserMilestone,
    trackConversion,
    trackError,
    trackSession,
    
    // Status
    isAvailable: FormbricksManager.getInstance().isInitialized()
  };
}