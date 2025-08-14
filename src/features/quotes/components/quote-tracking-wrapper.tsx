'use client';

import { useEffect } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { analyzeQuoteComplexity } from '@/libs/formbricks/tracking-utils';

import { Quote } from '../types';

interface QuoteTrackingWrapperProps {
  quote?: Quote;
  action: 'view' | 'create' | 'edit' | 'duplicate';
}

export function QuoteTrackingWrapper({ quote, action }: QuoteTrackingWrapperProps) {
  const { trackQuoteAction, trackFeatureUsage, trackPageView } = useFormbricksTracking();

  useEffect(() => {
    if (action === 'view' && quote) {
      // Track quote page view
      trackPageView(`/quotes/${quote.id}`, {
        quoteStatus: quote.status,
        quoteValue: quote.total,
        hasItems: quote.quote_data && quote.quote_data.length > 0,
      });
    }

    if (action === 'create') {
      trackFeatureUsage('quote_creator', 'used', {
        section: 'new_quote',
      });
    }

    if (action === 'edit' && quote) {
      trackFeatureUsage('quote_editor', 'used', {
        quoteId: quote.id,
        quoteStatus: quote.status,
      });
    }

    if (action === 'duplicate' && quote) {
      const complexity = analyzeQuoteComplexity({
        itemCount: quote.quote_data?.length || 0,
        totalValue: quote.total || 0,
        hasCustomItems: false, // This could be calculated
        hasDiscounts: false, // This could be calculated
        hasTax: (quote.tax_rate || 0) > 0,
      });

      trackQuoteAction('duplicated', {
        quoteId: quote.id,
        quoteValue: quote.total,
        itemCount: quote.quote_data?.length || 0,
        complexity,
      });
    }
  }, [quote, action, trackQuoteAction, trackFeatureUsage, trackPageView]);

  return null; // This component only handles tracking
}