'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
// import { trackPageView } from '@/libs/formbricks/tracking-utils';

export function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { registerRouteChange, trackPageView: trackPageViewHook } = useFormbricksTracking();

  useEffect(() => {
    // Track route change
    registerRouteChange();
    
    // Track page view with additional context
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    // Determine page context
    let pageContext = 'unknown';
    let section = 'general';
    
    if (pathname.startsWith('/dashboard')) {
      pageContext = 'dashboard';
      section = 'app';
    } else if (pathname.startsWith('/quotes')) {
      pageContext = 'quotes';
      section = 'app';
      if (pathname.includes('/new')) pageContext = 'quote_creation';
      if (pathname.includes('/edit')) pageContext = 'quote_editing';
    } else if (pathname.startsWith('/items')) {
      pageContext = 'items';
      section = 'app';
    } else if (pathname.startsWith('/settings')) {
      pageContext = 'settings';
      section = 'app';
    } else if (pathname.startsWith('/account')) {
      pageContext = 'account';
      section = 'billing';
    } else if (pathname.startsWith('/pricing')) {
      pageContext = 'pricing';
      section = 'marketing';
    } else if (pathname.startsWith('/auth')) {
      pageContext = 'authentication';
      section = 'auth';
    } else if (pathname === '/') {
      pageContext = 'landing';
      section = 'marketing';
    }

    trackPageViewHook(pathname, {
      url,
      pageContext,
      section,
      hasParams: searchParams.toString().length > 0,
    });

  }, [pathname, searchParams, registerRouteChange, trackPageViewHook]);

  return null; // This component only handles tracking
}