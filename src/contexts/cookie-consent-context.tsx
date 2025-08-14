'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type CookiePreferences = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

type CookieConsentContextType = {
  hasConsent: boolean;
  preferences: CookiePreferences;
  showBanner: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (preferences: CookiePreferences) => void;
  resetConsent: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const COOKIE_CONSENT_KEY = 'lawnquote-cookie-consent-v2';
const COOKIE_PREFERENCES_KEY = 'lawnquote-cookie-preferences-v2';

const defaultPreferences: CookiePreferences = {
  essential: true, // Always true, cannot be disabled
  functional: false,
  analytics: false,
  marketing: false,
};

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsent, setHasConsent] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (consent === 'true') {
      setHasConsent(true);
      setShowBanner(false);
      
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          setPreferences({ ...defaultPreferences, ...parsed });
        } catch (error) {
          console.error('Error parsing cookie preferences:', error);
        }
      }
    } else {
      // Show banner after a short delay to avoid flash
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const saveConsentAndPreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    setHasConsent(true);
    setShowBanner(false);
    setPreferences(newPreferences);
    
    // Trigger any analytics or tracking based on preferences
    if (newPreferences.analytics) {
      // Initialize analytics
      console.log('Analytics cookies accepted');
    }
    
    if (newPreferences.marketing) {
      // Initialize marketing cookies
      console.log('Marketing cookies accepted');
    }
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsentAndPreferences(allAccepted);
  };

  const rejectNonEssential = () => {
    saveConsentAndPreferences(defaultPreferences);
  };

  const savePreferences = (newPreferences: CookiePreferences) => {
    // Ensure essential cookies are always enabled
    const finalPreferences = { ...newPreferences, essential: true };
    saveConsentAndPreferences(finalPreferences);
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    setHasConsent(false);
    setShowBanner(true);
    setPreferences(defaultPreferences);
  };

  return (
    <CookieConsentContext.Provider
      value={{
        hasConsent,
        preferences,
        showBanner,
        acceptAll,
        rejectNonEssential,
        savePreferences,
        resetConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}
