/**
 * Server-side tracking utilities for Formbricks integration
 * 
 * These utilities allow server actions to track events directly
 * without requiring client-side JavaScript execution.
 */

import { FORMBRICKS_EVENTS } from './types';

/**
 * Server-side event tracking for quote creation workflow
 */
export interface ServerTrackingEvent {
  eventName: string;
  userId: string;
  sessionId?: string;
  properties: Record<string, any>;
  timestamp: string;
}

/**
 * Queue server-side events for client-side transmission
 * This approach stores events in a temporary format that can be
 * picked up by the client-side Formbricks manager
 */
export class ServerSideTracker {
  private static events: ServerTrackingEvent[] = [];

  /**
   * Track a server-side event that will be transmitted when the client loads
   */
  static trackEvent(
    eventName: string,
    userId: string,
    properties: Record<string, any>,
    sessionId?: string
  ): void {
    const event: ServerTrackingEvent = {
      eventName,
      userId,
      sessionId,
      properties: {
        ...properties,
        serverSide: true,
        source: 'server_action',
      },
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // In production, you might want to send these directly to Formbricks
    // or store them in a database for later transmission
    console.log('Server-side event tracked:', event);
  }

  /**
   * Get and clear pending events for transmission
   */
  static getPendingEvents(): ServerTrackingEvent[] {
    const events = [...this.events];
    this.events = [];
    return events;
  }

  /**
   * Track quote creation server events
   */
  static trackQuoteCreated(
    userId: string,
    quoteData: {
      quoteId: string;
      clientId?: string;
      itemCount: number;
      totalValue: number;
      hasTax: boolean;
      hasMarkup: boolean;
      complexity: 'simple' | 'complex';
      creationDuration?: number;
      sessionId?: string;
    }
  ): void {
    this.trackEvent(
      FORMBRICKS_EVENTS.QUOTE_CREATED,
      userId,
      {
        quoteId: quoteData.quoteId,
        clientId: quoteData.clientId,
        itemCount: quoteData.itemCount,
        totalValue: quoteData.totalValue,
        hasTax: quoteData.hasTax,
        hasMarkup: quoteData.hasMarkup,
        complexity: quoteData.complexity,
        creationDuration: quoteData.creationDuration,
        serverTimestamp: new Date().toISOString(),
      },
      quoteData.sessionId
    );

    // Track complexity-specific events
    if (quoteData.complexity === 'complex') {
      this.trackEvent(
        FORMBRICKS_EVENTS.COMPLEX_QUOTE_CREATED,
        userId,
        {
          quoteId: quoteData.quoteId,
          itemCount: quoteData.itemCount,
          totalValue: quoteData.totalValue,
        },
        quoteData.sessionId
      );
    }

    if (quoteData.totalValue > 10000) {
      this.trackEvent(
        FORMBRICKS_EVENTS.HIGH_VALUE_QUOTE_CREATED,
        userId,
        {
          quoteId: quoteData.quoteId,
          totalValue: quoteData.totalValue,
          threshold: 10000,
        },
        quoteData.sessionId
      );
    }
  }

  /**
   * Track quote draft saved
   */
  static trackDraftSaved(
    userId: string,
    draftData: {
      draftId: string;
      isNewDraft: boolean;
      itemCount: number;
      estimatedValue: number;
      sessionId?: string;
    }
  ): void {
    this.trackEvent(
      FORMBRICKS_EVENTS.QUOTE_SAVED_DRAFT,
      userId,
      {
        draftId: draftData.draftId,
        isNewDraft: draftData.isNewDraft,
        itemCount: draftData.itemCount,
        estimatedValue: draftData.estimatedValue,
        serverTimestamp: new Date().toISOString(),
      },
      draftData.sessionId
    );
  }

  /**
   * Track server-side errors during quote operations
   */
  static trackServerError(
    userId: string,
    errorData: {
      errorType: 'quote_creation_failed' | 'draft_save_failed' | 'validation_error' | 'database_error';
      errorMessage: string;
      errorCode?: string;
      context: Record<string, any>;
      sessionId?: string;
    }
  ): void {
    this.trackEvent(
      FORMBRICKS_EVENTS.ERROR_ENCOUNTERED,
      userId,
      {
        errorType: errorData.errorType,
        errorMessage: errorData.errorMessage,
        errorCode: errorData.errorCode,
        serverSide: true,
        context: errorData.context,
        serverTimestamp: new Date().toISOString(),
      },
      errorData.sessionId
    );
  }

  /**
   * Track quote workflow completion from server side
   */
  static trackWorkflowConversion(
    userId: string,
    conversionData: {
      quoteId: string;
      success: boolean;
      totalValue: number;
      itemCount: number;
      processingTime: number;
      sessionId?: string;
    }
  ): void {
    const eventName = conversionData.success 
      ? FORMBRICKS_EVENTS.QUOTE_WORKFLOW_CONVERSION_SUCCESS
      : FORMBRICKS_EVENTS.QUOTE_WORKFLOW_CONVERSION_FAILURE;

    this.trackEvent(
      eventName,
      userId,
      {
        quoteId: conversionData.quoteId,
        totalValue: conversionData.totalValue,
        itemCount: conversionData.itemCount,
        processingTime: conversionData.processingTime,
        serverTimestamp: new Date().toISOString(),
      },
      conversionData.sessionId
    );
  }

  /**
   * Track feature usage limits hit on server side
   */
  static trackFeatureLimitHit(
    userId: string,
    limitData: {
      feature: string;
      currentUsage: number;
      limit: number;
      userTier: string;
      sessionId?: string;
    }
  ): void {
    this.trackEvent(
      FORMBRICKS_EVENTS.FEATURE_LIMIT_HIT,
      userId,
      {
        feature: limitData.feature,
        currentUsage: limitData.currentUsage,
        limit: limitData.limit,
        userTier: limitData.userTier,
        severity: 'blocked',
        serverTimestamp: new Date().toISOString(),
      },
      limitData.sessionId
    );
  }
}

/**
 * Utility function to determine quote complexity on server side
 */
export function analyzeQuoteComplexityServer(quoteData: {
  itemCount: number;
  totalValue: number;
  hasTax: boolean;
  hasMarkup: boolean;
  hasCustomItems?: boolean;
  hasDiscounts?: boolean;
}): 'simple' | 'complex' {
  const complexityFactors = [
    quoteData.itemCount > 10,
    quoteData.totalValue > 5000,
    quoteData.hasTax,
    quoteData.hasMarkup,
    quoteData.hasCustomItems || false,
    quoteData.hasDiscounts || false,
  ];

  const complexityScore = complexityFactors.filter(Boolean).length;
  return complexityScore >= 2 ? 'complex' : 'simple';
}

/**
 * Extract session ID from headers or generate one
 */
export function extractOrGenerateSessionId(headers?: Headers): string {
  if (headers) {
    const sessionId = headers.get('x-quote-session-id');
    if (sessionId) return sessionId;
  }
  
  return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}