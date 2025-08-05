'use client';

import { Cookie, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter,DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CookiePreferences,useCookieConsent } from '@/contexts/cookie-consent-context';
import { cn } from '@/utils/cn';

export function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectNonEssential, savePreferences } = useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  if (!showBanner) return null;

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [type]: value }));
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    setShowPreferences(false);
  };

  return (
    <>
      {/* Main Cookie Banner - Following style guide card pattern */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-paper-white/95 backdrop-blur-lg border-t border-stone-gray/50 shadow-lg">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-paper-white p-8 rounded-2xl border border-stone-gray/20 shadow-lg">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <Cookie className="w-8 h-8 text-forest-green" />
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Following H3 typography from style guide */}
                <h3 className="text-xl md:text-2xl font-bold text-charcoal mb-3">
                  We use cookies to improve your experience
                </h3>
                
                {/* Following Body typography from style guide */}
                <p className="text-lg text-charcoal/70 mb-6 leading-relaxed">
                  We use essential cookies to make our site work. We'd also like to set optional cookies to help us improve our website and analyze how it's used. We won't set optional cookies unless you enable them.
                </p>
                
                {/* Button group following style guide patterns */}
                <div className="flex flex-wrap gap-4 mb-4">
                  {/* Primary CTA - Equipment Yellow */}
                  <button
                    onClick={acceptAll}
                    className="bg-equipment-yellow text-charcoal font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
                  >
                    Accept All Cookies
                  </button>
                  
                  {/* Standard Button - Forest Green */}
                  <button
                    onClick={rejectNonEssential}
                    className="bg-forest-green text-paper-white font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-opacity text-lg"
                  >
                    Reject Non-Essential
                  </button>
                  
                  {/* Secondary CTA - Ghost Style */}
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="bg-paper-white/20 text-charcoal font-bold px-8 py-4 rounded-lg hover:bg-paper-white/30 transition-all duration-200 border border-stone-gray/30 text-lg flex items-center gap-2"
                  >
                    <Settings className="w-5 h-5" />
                    Customize
                  </button>
                </div>
                
                {/* Subtle text following style guide */}
                <p className="text-sm text-charcoal/60">
                  Learn more in our{' '}
                  <Link href="/cookies" className="text-forest-green hover:underline font-medium">
                    Cookie Policy
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-forest-green hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Preferences Dialog - Following style guide patterns */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-paper-white">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-3xl md:text-4xl font-black text-charcoal">
              Cookie Preferences
            </DialogTitle>
            <DialogDescription className="text-lg text-charcoal/70 mt-3">
              Choose which cookies you'd like to accept. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Essential Cookies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-charcoal mb-2">Essential Cookies</h4>
                  <p className="text-lg text-charcoal/70">
                    Required for the website to function properly. Cannot be disabled.
                  </p>
                </div>
                <div className="flex items-center ml-6">
                  <div className="w-14 h-8 bg-forest-green rounded-full flex items-center justify-end px-1">
                    <div className="w-6 h-6 bg-paper-white rounded-full"></div>
                  </div>
                  <span className="ml-3 text-sm font-bold text-forest-green">Always On</span>
                </div>
              </div>
              <p className="text-sm text-charcoal/60 bg-light-concrete p-4 rounded-lg">
                These cookies are necessary for authentication, security, and basic website functionality.
              </p>
            </div>

            {/* Functional Cookies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-charcoal mb-2">Functional Cookies</h4>
                  <p className="text-lg text-charcoal/70">
                    Remember your preferences and settings for a better experience.
                  </p>
                </div>
                <StyleGuideToggle
                  enabled={preferences.functional}
                  onChange={(value) => handlePreferenceChange('functional', value)}
                />
              </div>
              <p className="text-sm text-charcoal/60 bg-light-concrete p-4 rounded-lg">
                These cookies remember your language preferences, theme settings, and form data.
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-charcoal mb-2">Analytics Cookies</h4>
                  <p className="text-lg text-charcoal/70">
                    Help us understand how you use our website to improve it.
                  </p>
                </div>
                <StyleGuideToggle
                  enabled={preferences.analytics}
                  onChange={(value) => handlePreferenceChange('analytics', value)}
                />
              </div>
              <p className="text-sm text-charcoal/60 bg-light-concrete p-4 rounded-lg">
                These cookies collect anonymous information about page views and user interactions.
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-charcoal mb-2">Marketing Cookies</h4>
                  <p className="text-lg text-charcoal/70">
                    Currently not used. We don't track you for advertising.
                  </p>
                </div>
                <StyleGuideToggle
                  enabled={preferences.marketing}
                  onChange={(value) => handlePreferenceChange('marketing', value)}
                  disabled={true}
                />
              </div>
              <p className="text-sm text-charcoal/60 bg-light-concrete p-4 rounded-lg">
                LawnQuote doesn't use marketing cookies or track users for advertising purposes.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-stone-gray/20">
            {/* Standard Button - Forest Green */}
            <button
              onClick={rejectNonEssential}
              className="bg-forest-green text-paper-white font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-opacity text-lg"
            >
              Reject All Non-Essential
            </button>
            
            {/* Primary CTA - Equipment Yellow */}
            <button
              onClick={handleSavePreferences}
              className="bg-equipment-yellow text-charcoal font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              Save Preferences
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Style Guide Compliant Toggle Component
interface StyleGuideToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function StyleGuideToggle({ enabled, onChange, disabled = false }: StyleGuideToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer ml-6">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={enabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className={cn(
        "w-14 h-8 rounded-full peer transition-all duration-200",
        enabled ? "bg-forest-green" : "bg-stone-gray/50",
        disabled && "opacity-50 cursor-not-allowed",
        "peer-checked:bg-forest-green peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"
      )}>
      </div>
    </label>
  );
}
