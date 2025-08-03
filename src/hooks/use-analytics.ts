'use client';

import { useEffect } from 'react';
import { useCookieConsent } from '@/contexts/cookie-consent-context';

export function useAnalytics() {
  const { hasConsent, preferences } = useCookieConsent();

  useEffect(() => {
    if (hasConsent && preferences.analytics) {
      // Initialize analytics only if user has consented
      console.log('Analytics initialized with user consent');
      
      // Here you would initialize your analytics service
      // For example, Google Analytics, PostHog, etc.
      // Example:
      // gtag('config', 'GA_MEASUREMENT_ID');
      // posthog.init('PROJECT_API_KEY');
    }
  }, [hasConsent, preferences.analytics]);

  // Return functions that only work if analytics is enabled
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (hasConsent && preferences.analytics) {
      console.log('Tracking event:', eventName, properties);
      // Your analytics tracking code here
      // gtag('event', eventName, properties);
      // posthog.capture(eventName, properties);
    }
  };

  const trackPageView = (path: string) => {
    if (hasConsent && preferences.analytics) {
      console.log('Tracking page view:', path);
      // Your page view tracking code here
      // gtag('config', 'GA_MEASUREMENT_ID', { page_path: path });
      // posthog.capture('$pageview', { $current_url: path });
    }
  };

  return {
    isEnabled: hasConsent && preferences.analytics,
    trackEvent,
    trackPageView,
  };
}
