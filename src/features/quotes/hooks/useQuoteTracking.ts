'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { analyzeQuoteComplexity as analyzeAdvancedComplexity } from '@/libs/complexity';
import { analyzeQuoteComplexity, QuoteWorkflowTracker } from '@/libs/formbricks/tracking-utils';

import { QuoteStatus } from '../types';

// Utility function for throttling
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

interface QuoteTrackingData {
  quoteId: string;
  quoteValue?: number;
  itemCount?: number;
  clientName?: string;
  hasCustomItems?: boolean;
  hasDiscounts?: boolean;
  taxRate?: number;
  markupRate?: number;
}

export function useQuoteTracking() {
  const { trackQuoteAction, trackFeatureUsage, trackError } = useFormbricksTracking();
  const [workflowTracker, setWorkflowTracker] = useState<QuoteWorkflowTracker | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const abandonmentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  // Initialize workflow tracking session
  const initializeWorkflowTracking = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = QuoteWorkflowTracker.generateSessionId();
    }
    const tracker = QuoteWorkflowTracker.getInstance(sessionIdRef.current);
    setWorkflowTracker(tracker);
    return tracker;
  }, []);

  // Track user interactions to detect abandonment
  useEffect(() => {
    const resetAbandonmentTimer = () => {
      lastInteractionRef.current = Date.now();
      
      if (abandonmentTimerRef.current) {
        clearTimeout(abandonmentTimerRef.current);
      }

      // Set abandonment timer for 5 minutes of inactivity
      abandonmentTimerRef.current = setTimeout(() => {
        if (workflowTracker && !workflowTracker.getSessionData().hasBeenAbandoned) {
          workflowTracker.abandonWorkflow('inactivity_timeout', {
            lastInteraction: lastInteractionRef.current,
            timeoutDuration: 300000, // 5 minutes
          });
        }
      }, 300000); // 5 minutes
    };

    // Track various user interactions
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    const throttledResetTimer = throttle(resetAbandonmentTimer, 1000);

    events.forEach(event => {
      document.addEventListener(event, throttledResetTimer, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledResetTimer);
      });
      if (abandonmentTimerRef.current) {
        clearTimeout(abandonmentTimerRef.current);
      }
    };
  }, [workflowTracker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workflowTracker && !workflowTracker.getSessionData().hasBeenAbandoned) {
        workflowTracker.abandonWorkflow('page_unload', {
          reason: 'Component unmounted or page navigation',
        });
      }
    };
  }, [workflowTracker]);

  // Workflow step tracking functions
  const startWorkflowStep = useCallback((
    step: 'client_selection' | 'item_addition' | 'item_configuration' | 'pricing_setup' | 'preview' | 'finalization',
    metadata?: Record<string, any>
  ) => {
    const tracker = workflowTracker || initializeWorkflowTracking();
    tracker.startStep(step, metadata);
  }, [workflowTracker, initializeWorkflowTracking]);

  const completeWorkflowStep = useCallback((metadata?: Record<string, any>) => {
    if (workflowTracker) {
      workflowTracker.completeCurrentStep(metadata);
    }
  }, [workflowTracker]);

  const trackWorkflowInteraction = useCallback((
    interactionType: 'item_search' | 'quantity_change' | 'template_use' | 'autosave' | 'manual_save' | 'error',
    data?: Record<string, any>
  ) => {
    if (workflowTracker) {
      workflowTracker.trackInteraction(interactionType, data);
    }
  }, [workflowTracker]);

  const trackWorkflowAbandonment = useCallback((reason?: string, errorDetails?: any) => {
    if (workflowTracker) {
      workflowTracker.abandonWorkflow(reason, errorDetails);
    }
  }, [workflowTracker]);

  const completeWorkflow = useCallback((quoteId: string, success: boolean, metadata?: Record<string, any>) => {
    if (workflowTracker) {
      workflowTracker.completeWorkflow(quoteId, success, metadata);
    }
  }, [workflowTracker]);

  const trackPDFGenerationWorkflow = useCallback((
    startTime: number,
    endTime?: number,
    success?: boolean,
    error?: string
  ) => {
    if (workflowTracker) {
      workflowTracker.trackPDFGeneration(startTime, endTime, success, error);
    }
  }, [workflowTracker]);

  // Enhanced quote creation tracking with workflow integration
  const trackQuoteCreationStart = useCallback((metadata?: Record<string, any>) => {
    const tracker = initializeWorkflowTracking();
    tracker.startStep('client_selection', {
      triggerSource: 'quote_creation_page',
      hasTemplate: !!metadata?.templateId,
      ...metadata,
    });
    
    trackFeatureUsage('quote_creator', 'used', {
      section: 'new_quote',
      sessionId: sessionIdRef.current,
      ...metadata,
    });
  }, [initializeWorkflowTracking, trackFeatureUsage]);

  const trackClientSelection = useCallback((clientData: {
    clientId?: string;
    clientName?: string;
    isNewClient: boolean;
    selectionMethod: 'search' | 'recent' | 'manual_entry';
    searchQuery?: string;
    timeTaken?: number;
  }) => {
    completeWorkflowStep({
      clientSource: clientData.isNewClient ? 'new' : 'existing',
      selectionMethod: clientData.selectionMethod,
      searchQuery: clientData.searchQuery,
      timeTaken: clientData.timeTaken,
    });

    startWorkflowStep('item_addition', {
      clientSelected: true,
      clientType: clientData.isNewClient ? 'new' : 'existing',
    });
  }, [completeWorkflowStep, startWorkflowStep]);

  const trackItemAddition = useCallback((itemData: {
    itemId: string;
    itemName: string;
    isFirstItem: boolean;
    additionMethod: 'search' | 'browse' | 'recent' | 'global_library';
    searchQuery?: string;
    quantity: number;
    cost: number;
  }) => {
    if (itemData.isFirstItem) {
      completeWorkflowStep({
        firstItemAdded: true,
        additionMethod: itemData.additionMethod,
        searchQuery: itemData.searchQuery,
      });
      startWorkflowStep('item_configuration', {
        hasItems: true,
        firstItemValue: itemData.cost,
      });
    }

    trackWorkflowInteraction('item_search', {
      itemId: itemData.itemId,
      itemName: itemData.itemName,
      additionMethod: itemData.additionMethod,
      searchQuery: itemData.searchQuery,
      quantity: itemData.quantity,
      cost: itemData.cost,
    });
  }, [completeWorkflowStep, startWorkflowStep, trackWorkflowInteraction]);

  const trackItemConfiguration = useCallback((configData: {
    totalItems: number;
    totalValue: number;
    hasCustomItems: boolean;
    averageItemValue: number;
    quantityChanges: number;
    removalCount: number;
  }) => {
    completeWorkflowStep({
      totalItems: configData.totalItems,
      totalValue: configData.totalValue,
      hasCustomItems: configData.hasCustomItems,
      averageItemValue: configData.averageItemValue,
      quantityChanges: configData.quantityChanges,
      removalCount: configData.removalCount,
    });

    startWorkflowStep('pricing_setup', {
      itemsConfigured: true,
      itemCount: configData.totalItems,
      estimatedValue: configData.totalValue,
    });
  }, [completeWorkflowStep, startWorkflowStep]);

  const trackPricingConfiguration = useCallback((pricingData: {
    taxRate: number;
    markupRate: number;
    hasTax: boolean;
    hasMarkup: boolean;
    finalTotal: number;
    profitMargin: number;
  }) => {
    completeWorkflowStep({
      taxRate: pricingData.taxRate,
      markupRate: pricingData.markupRate,
      hasTax: pricingData.hasTax,
      hasMarkup: pricingData.hasMarkup,
      finalTotal: pricingData.finalTotal,
      profitMargin: pricingData.profitMargin,
    });

    startWorkflowStep('preview', {
      pricingConfigured: true,
      finalTotal: pricingData.finalTotal,
    });
  }, [completeWorkflowStep, startWorkflowStep]);

  const trackQuotePreview = useCallback((previewData: {
    previewDuration: number;
    modificationsAfterPreview: number;
    backToEditCount: number;
  }) => {
    completeWorkflowStep({
      previewDuration: previewData.previewDuration,
      modificationsAfterPreview: previewData.modificationsAfterPreview,
      backToEditCount: previewData.backToEditCount,
    });

    startWorkflowStep('finalization', {
      previewViewed: true,
      readyForFinalization: true,
    });
  }, [completeWorkflowStep, startWorkflowStep]);

  const trackQuoteFinalization = useCallback((finalizationData: {
    quoteId: string;
    success: boolean;
    finalTotal: number;
    itemCount: number;
    timeTaken: number;
    generationMethod: 'pdf' | 'save_draft' | 'send_email';
    errorMessage?: string;
  }) => {
    if (finalizationData.success) {
      completeWorkflow(finalizationData.quoteId, true, {
        finalTotal: finalizationData.finalTotal,
        itemCount: finalizationData.itemCount,
        timeTaken: finalizationData.timeTaken,
        generationMethod: finalizationData.generationMethod,
      });
    } else {
      trackWorkflowInteraction('error', {
        errorType: 'finalization_failed',
        errorMessage: finalizationData.errorMessage,
        generationMethod: finalizationData.generationMethod,
      });
    }
  }, [completeWorkflow, trackWorkflowInteraction]);

  // Session and timing analytics
  const getWorkflowSessionData = useCallback(() => {
    return workflowTracker?.getSessionData() || null;
  }, [workflowTracker]);

  const getWorkflowAnalytics = useCallback(() => {
    const sessionData = getWorkflowSessionData();
    if (!sessionData) return null;

    const totalDuration = sessionData.totalDuration;
    const completedSteps = sessionData.steps.filter(s => s.completed);
    const averageStepDuration = completedSteps.length > 0 
      ? completedSteps.reduce((sum, step) => sum + (step.duration || 0), 0) / completedSteps.length 
      : 0;

    return {
      sessionId: sessionData.sessionId,
      totalDuration,
      currentStep: sessionData.currentStep,
      stepsCompleted: completedSteps.length,
      totalSteps: sessionData.steps.length,
      averageStepDuration,
      completionRate: sessionData.steps.length > 0 ? (completedSteps.length / sessionData.steps.length) * 100 : 0,
      hasBeenAbandoned: sessionData.hasBeenAbandoned,
      stepBreakdown: sessionData.steps.map(step => ({
        step: step.step,
        duration: step.duration || 0,
        completed: step.completed,
        abandoned: step.abandoned || false,
      })),
    };
  }, [getWorkflowSessionData]);

  const trackQuoteCreated = useCallback((quoteData: QuoteTrackingData, isTemplate = false) => {
    const complexity = analyzeQuoteComplexity({
      itemCount: quoteData.itemCount || 0,
      totalValue: quoteData.quoteValue || 0,
      hasCustomItems: quoteData.hasCustomItems || false,
      hasDiscounts: quoteData.hasDiscounts || false,
      hasTax: (quoteData.taxRate || 0) > 0,
    });

    trackQuoteAction('created', {
      quoteId: quoteData.quoteId,
      quoteValue: quoteData.quoteValue,
      itemCount: quoteData.itemCount,
      isTemplate,
      complexity,
      hasMarkup: (quoteData.markupRate || 0) > 0,
      hasTax: (quoteData.taxRate || 0) > 0,
    } as any);
  }, [trackQuoteAction]);

  const trackQuoteSaved = useCallback((quoteData: QuoteTrackingData) => {
    trackQuoteAction('saved_draft', {
      quoteId: quoteData.quoteId,
      quoteValue: quoteData.quoteValue,
      itemCount: quoteData.itemCount,
    });
  }, [trackQuoteAction]);

  const trackQuoteSent = useCallback((quoteData: QuoteTrackingData, method: 'email' | 'download') => {
    trackQuoteAction('sent', {
      quoteId: quoteData.quoteId,
      quoteValue: quoteData.quoteValue,
      method,
      clientName: quoteData.clientName,
    } as any);
  }, [trackQuoteAction]);

  const trackQuoteStatusChange = useCallback((
    quoteData: QuoteTrackingData,
    oldStatus: QuoteStatus,
    newStatus: QuoteStatus
  ) => {
    const actionMap: Record<QuoteStatus, 'created' | 'saved_draft' | 'sent' | 'accepted' | 'rejected' | 'duplicated' | 'deleted'> = {
      draft: 'saved_draft',
      sent: 'sent',
      accepted: 'accepted',
      rejected: 'rejected',
    } as any;

    if (actionMap[newStatus]) {
      trackQuoteAction(actionMap[newStatus], {
        quoteId: quoteData.quoteId,
        quoteValue: quoteData.quoteValue,
        previousStatus: oldStatus,
        newStatus,
      } as any);
    }
  }, [trackQuoteAction]);

  const trackQuoteDeleted = useCallback((quoteData: QuoteTrackingData) => {
    trackQuoteAction('deleted', {
      quoteId: quoteData.quoteId,
      quoteValue: quoteData.quoteValue,
      itemCount: quoteData.itemCount,
    });
  }, [trackQuoteAction]);

  const trackBulkAction = useCallback((
    action: 'delete' | 'status_change' | 'export',
    quoteCount: number,
    additionalData?: Record<string, any>
  ) => {
    trackFeatureUsage('bulk_actions', 'used', {
      bulkAction: action,
      quoteCount,
      ...additionalData,
    });
  }, [trackFeatureUsage]);

  const trackTemplateUsage = useCallback((templateId: string, templateName?: string) => {
    trackFeatureUsage('quote_templates', 'used', {
      templateId,
      templateName,
    });
  }, [trackFeatureUsage]);

  const trackQuoteError = useCallback((
    errorType: 'creation_failed' | 'save_failed' | 'send_failed' | 'pdf_failed',
    quoteData: Partial<QuoteTrackingData>,
    errorMessage?: string
  ) => {
    trackError('general', {
      errorMessage,
      context: {
        errorType,
        quoteId: quoteData.quoteId,
        feature: 'quotes',
      },
    });
  }, [trackError]);

  const trackPDFGeneration = useCallback((
    quoteData: QuoteTrackingData,
    success: boolean,
    timeTaken?: number
  ) => {
    if (success) {
      trackFeatureUsage('pdf_generation', 'used', {
        quoteId: quoteData.quoteId,
        quoteValue: quoteData.quoteValue,
        timeTaken,
      });
    } else {
      trackError('pdf_generation', {
        context: {
          quoteId: quoteData.quoteId,
          timeTaken,
        },
      });
    }
  }, [trackFeatureUsage, trackError]);

  const trackEmailSent = useCallback((
    quoteData: QuoteTrackingData,
    success: boolean,
    recipientEmail?: string
  ) => {
    if (success) {
      trackQuoteAction('sent', {
        quoteId: quoteData.quoteId,
        quoteValue: quoteData.quoteValue,
        method: 'email',
        recipientEmail,
      } as any);
    } else {
      trackError('email_send', {
        context: {
          quoteId: quoteData.quoteId,
          recipientEmail,
        },
      });
    }
  }, [trackQuoteAction, trackError]);

  return {
    // Legacy tracking functions (maintained for backward compatibility)
    trackQuoteCreated,
    trackQuoteSaved,
    trackQuoteSent,
    trackQuoteStatusChange,
    trackQuoteDeleted,
    trackBulkAction,
    trackTemplateUsage,
    trackQuoteError,
    trackPDFGeneration,
    trackEmailSent,

    // New workflow tracking functions
    initializeWorkflowTracking,
    startWorkflowStep,
    completeWorkflowStep,
    trackWorkflowInteraction,
    trackWorkflowAbandonment,
    completeWorkflow,
    trackPDFGenerationWorkflow,

    // Enhanced step-specific tracking
    trackQuoteCreationStart,
    trackClientSelection,
    trackItemAddition,
    trackItemConfiguration,
    trackPricingConfiguration,
    trackQuotePreview,
    trackQuoteFinalization,

    // Session analytics
    getWorkflowSessionData,
    getWorkflowAnalytics,

    // Workflow session ID for external tracking
    sessionId: sessionIdRef.current,
  };
}