'use client';

import { useCallback } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { analyzeQuoteComplexity } from '@/libs/formbricks/tracking-utils';

import { QuoteStatus } from '../types';

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
  };
}