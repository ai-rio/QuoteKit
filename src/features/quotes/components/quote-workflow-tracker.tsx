'use client';

import { useRouter } from 'next/navigation';
import { ReactNode,useEffect, useRef } from 'react';

import { useUser } from '@/hooks/use-user';

import { useQuoteTracking } from '../hooks/useQuoteTracking';

interface QuoteWorkflowTrackerProps {
  children: ReactNode;
  templateId?: string;
  draftId?: string;
  mode: 'create' | 'edit' | 'template';
  onWorkflowComplete?: (sessionData: any) => void;
  onWorkflowAbandoned?: (reason: string, sessionData: any) => void;
}

/**
 * QuoteWorkflowTracker - Comprehensive workflow tracking wrapper for quote creation
 * 
 * This component provides complete tracking for the quote creation process including:
 * - Step-by-step workflow progression
 * - Time spent on each step
 * - Abandonment point detection
 * - Exit intent tracking
 * - Performance analytics
 * - User behavior pattern analysis
 */
export function QuoteWorkflowTracker({
  children,
  templateId,
  draftId,
  mode,
  onWorkflowComplete,
  onWorkflowAbandoned
}: QuoteWorkflowTrackerProps) {
  const router = useRouter();
  const { data: user } = useUser();
  const {
    trackQuoteCreationStart,
    getWorkflowSessionData,
    getWorkflowAnalytics,
    trackWorkflowAbandonment,
    sessionId
  } = useQuoteTracking();

  const hasInitialized = useRef(false);
  const pageStartTime = useRef(Date.now());
  const sessionIdRef = useRef(sessionId);

  // Initialize workflow tracking when component mounts
  useEffect(() => {
    if (!hasInitialized.current && mode === 'create') {
      hasInitialized.current = true;
      
      trackQuoteCreationStart({
        templateId,
        draftId,
        mode,
        userTier: user?.user_metadata?.subscriptionTier || 'free',
        pageStartTime: pageStartTime.current,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      });
    }
  }, [mode, templateId, draftId, user, trackQuoteCreationStart]);

  // Handle page visibility changes to detect abandonment
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from tab - potential abandonment
        const sessionData = getWorkflowSessionData();
        if (sessionData && !sessionData.hasBeenAbandoned) {
          // Don't immediately abandon, but track the event
          // Real abandonment will be detected by timeout or navigation
          console.log('User switched away from quote creation tab', sessionData);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [getWorkflowSessionData]);

  // Handle beforeunload to track abandonment on page navigation/close
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const sessionData = getWorkflowSessionData();
      if (sessionData && !sessionData.hasBeenAbandoned) {
        const analytics = getWorkflowAnalytics();
        
        // Track abandonment
        trackWorkflowAbandonment('page_navigation', {
          currentStep: sessionData.currentStep,
          totalDuration: Date.now() - pageStartTime.current,
          stepsCompleted: sessionData.steps.filter(s => s.completed).length,
          completionRate: analytics?.completionRate || 0,
          navigationTrigger: 'beforeunload',
        });

        // Call callback if provided
        if (onWorkflowAbandoned) {
          onWorkflowAbandoned('page_navigation', {
            sessionData,
            analytics,
          });
        }

        // Optionally show warning for incomplete quotes
        if (analytics && analytics.stepsCompleted > 0 && analytics.completionRate < 100) {
          event.preventDefault();
          event.returnValue = 'You have an incomplete quote. Are you sure you want to leave?';
          return event.returnValue;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [getWorkflowSessionData, getWorkflowAnalytics, trackWorkflowAbandonment, onWorkflowAbandoned]);

  // Handle route changes (Next.js navigation)
  // Note: App Router doesn't have router.events, using visibility change as alternative
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const sessionData = getWorkflowSessionData();
        if (sessionData && !sessionData.hasBeenAbandoned) {
          const analytics = getWorkflowAnalytics();
          
          trackWorkflowAbandonment('route_change', {
            currentStep: sessionData.currentStep,
            totalDuration: Date.now() - pageStartTime.current,
            stepsCompleted: sessionData.steps.filter(s => s.completed).length,
            completionRate: analytics?.completionRate || 0,
            navigationTrigger: 'visibility_change',
          });

          if (onWorkflowAbandoned) {
            onWorkflowAbandoned('route_change', {
              sessionData,
              analytics,
            });
          }
        }
      }
    };

    // Listen for visibility changes (covers navigation away)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getWorkflowSessionData, getWorkflowAnalytics, trackWorkflowAbandonment, onWorkflowAbandoned]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Final cleanup - if workflow is still active, mark as abandoned
      const sessionData = getWorkflowSessionData();
      if (sessionData && !sessionData.hasBeenAbandoned) {
        trackWorkflowAbandonment('component_unmount', {
          currentStep: sessionData.currentStep,
          totalDuration: Date.now() - pageStartTime.current,
          unmountReason: 'component_cleanup',
        });
      }
    };
  }, [getWorkflowSessionData, trackWorkflowAbandonment]);

  return (
    <QuoteWorkflowContext.Provider value={{
      sessionId: sessionIdRef.current,
      pageStartTime: pageStartTime.current,
      mode,
      templateId,
      draftId,
      getSessionData: getWorkflowSessionData,
      getAnalytics: getWorkflowAnalytics,
    }}>
      {children}
    </QuoteWorkflowContext.Provider>
  );
}

// Context for accessing workflow data in child components
import { createContext, useContext } from 'react';

interface QuoteWorkflowContextValue {
  sessionId: string | null;
  pageStartTime: number;
  mode: 'create' | 'edit' | 'template';
  templateId?: string;
  draftId?: string;
  getSessionData: () => any;
  getAnalytics: () => any;
}

const QuoteWorkflowContext = createContext<QuoteWorkflowContextValue | null>(null);

export function useQuoteWorkflowContext() {
  const context = useContext(QuoteWorkflowContext);
  if (!context) {
    throw new Error('useQuoteWorkflowContext must be used within a QuoteWorkflowTracker');
  }
  return context;
}

// Utility hook for tracking specific workflow interactions
export function useWorkflowStepTracking() {
  const {
    trackClientSelection,
    trackItemAddition,
    trackItemConfiguration,
    trackPricingConfiguration,
    trackQuotePreview,
    trackQuoteFinalization,
    trackWorkflowInteraction,
  } = useQuoteTracking();

  const context = useQuoteWorkflowContext();

  return {
    // Step transition tracking
    trackClientSelected: (clientData: {
      clientId?: string;
      clientName?: string;
      isNewClient: boolean;
      selectionMethod: 'search' | 'recent' | 'manual_entry';
      searchQuery?: string;
    }) => {
      const startTime = Date.now();
      trackClientSelection({
        ...clientData,
        timeTaken: startTime - context.pageStartTime,
      });
    },

    // Item interaction tracking
    trackItemAdded: (itemData: {
      itemId: string;
      itemName: string;
      isFirstItem: boolean;
      additionMethod: 'search' | 'browse' | 'recent' | 'global_library';
      searchQuery?: string;
      quantity: number;
      cost: number;
    }) => {
      trackItemAddition(itemData);
    },

    // Configuration tracking
    trackItemsConfigured: (configData: {
      totalItems: number;
      totalValue: number;
      hasCustomItems: boolean;
      averageItemValue: number;
      quantityChanges: number;
      removalCount: number;
    }) => {
      trackItemConfiguration(configData);
    },

    // Pricing tracking
    trackPricingSet: (pricingData: {
      taxRate: number;
      markupRate: number;
      hasTax: boolean;
      hasMarkup: boolean;
      finalTotal: number;
      profitMargin: number;
    }) => {
      trackPricingConfiguration(pricingData);
    },

    // Preview tracking
    trackPreviewViewed: (previewData: {
      previewDuration: number;
      modificationsAfterPreview: number;
      backToEditCount: number;
    }) => {
      trackQuotePreview(previewData);
    },

    // Finalization tracking
    trackQuoteFinalized: (finalizationData: {
      quoteId: string;
      success: boolean;
      finalTotal: number;
      itemCount: number;
      timeTaken: number;
      generationMethod: 'pdf' | 'save_draft' | 'send_email';
      errorMessage?: string;
    }) => {
      trackQuoteFinalization(finalizationData);
    },

    // Micro-interaction tracking
    trackSearchUsed: (searchData: {
      query: string;
      resultsCount: number;
      selectedResult?: string;
    }) => {
      trackWorkflowInteraction('item_search', searchData);
    },

    trackQuantityChanged: (quantityData: {
      itemId: string;
      oldQuantity: number;
      newQuantity: number;
      changeType: 'increase' | 'decrease' | 'direct_edit';
    }) => {
      trackWorkflowInteraction('quantity_change', quantityData);
    },

    trackTemplateUsed: (templateData: {
      templateId: string;
      templateName?: string;
      itemCount: number;
      templateValue: number;
    }) => {
      trackWorkflowInteraction('template_use', templateData);
    },

    trackAutosave: (autosaveData: {
      triggerReason: 'timer' | 'field_change' | 'step_transition';
      dataChanged: string[];
      saveSuccess: boolean;
    }) => {
      trackWorkflowInteraction('autosave', autosaveData);
    },

    trackManualSave: (saveData: {
      buttonType: 'save_draft' | 'save_and_continue';
      dataState: 'complete' | 'partial' | 'minimal';
      saveSuccess: boolean;
    }) => {
      trackWorkflowInteraction('manual_save', saveData);
    },

    trackError: (errorData: {
      errorType: string;
      errorMessage: string;
      errorContext: Record<string, any>;
      recoveryAction?: string;
    }) => {
      trackWorkflowInteraction('error', errorData);
    },

    // Session data access
    getSessionId: () => context.sessionId,
    getSessionAnalytics: context.getAnalytics,
  };
}