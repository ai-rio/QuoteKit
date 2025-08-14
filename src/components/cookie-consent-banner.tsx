'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { CookiePreferences, useCookieConsent } from '@/contexts/cookie-consent-context';
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
      {/* Minimalist Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-paper-white/95 backdrop-blur-sm border-t border-stone-gray/20 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Minimal text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-charcoal/80">
                We use cookies to improve your experience.{' '}
                <Link href="/cookies" className="text-forest-green hover:underline font-medium">
                  Learn more
                </Link>
              </p>
            </div>
            
            {/* Compact button group */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="text-charcoal hover:text-forest-green hover:bg-light-concrete text-xs sm:text-sm"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                Settings
              </EnhancedButton>
              
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={rejectNonEssential}
                className="text-charcoal border-stone-gray/30 hover:bg-light-concrete hover:text-forest-green text-xs sm:text-sm"
              >
                Reject
              </EnhancedButton>
              
              <EnhancedButton
                variant="secondary"
                size="sm"
                onClick={acceptAll}
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-semibold text-xs sm:text-sm"
              >
                Accept All
              </EnhancedButton>
            </div>
          </div>
        </div>
      </div>

      {/* Streamlined Cookie Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-paper-white">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-charcoal">
              Cookie Settings
            </DialogTitle>
            <DialogDescription className="text-sm text-charcoal/70">
              Choose which cookies you&apos;d like to accept.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Essential Cookies */}
            <div className="flex items-center justify-between p-3 bg-light-concrete/50 rounded-lg">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-charcoal">Essential Cookies</h4>
                <p className="text-xs text-charcoal/60 mt-1">
                  Required for the website to function properly.
                </p>
              </div>
              <div className="flex items-center ml-4">
                <div className="w-10 h-6 bg-forest-green rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-paper-white rounded-full"></div>
                </div>
                <span className="ml-2 text-xs font-medium text-forest-green">Always On</span>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-stone-gray/20">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-charcoal">Functional Cookies</h4>
                <p className="text-xs text-charcoal/60 mt-1">
                  Remember your preferences and settings.
                </p>
              </div>
              <MinimalToggle
                enabled={preferences.functional}
                onChange={(value) => handlePreferenceChange('functional', value)}
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-stone-gray/20">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-charcoal">Analytics Cookies</h4>
                <p className="text-xs text-charcoal/60 mt-1">
                  Help us understand how you use our website.
                </p>
              </div>
              <MinimalToggle
                enabled={preferences.analytics}
                onChange={(value) => handlePreferenceChange('analytics', value)}
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-stone-gray/20 opacity-60">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-charcoal">Marketing Cookies</h4>
                <p className="text-xs text-charcoal/60 mt-1">
                  Currently not used. We don&apos;t track you for advertising.
                </p>
              </div>
              <MinimalToggle
                enabled={preferences.marketing}
                onChange={(value) => handlePreferenceChange('marketing', value)}
                disabled={true}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-stone-gray/20">
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={rejectNonEssential}
              className="text-charcoal border-stone-gray/30 hover:bg-light-concrete hover:text-forest-green"
            >
              Reject All Non-Essential
            </EnhancedButton>
            
            <EnhancedButton
              variant="secondary"
              size="sm"
              onClick={handleSavePreferences}
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-semibold"
            >
              Save Preferences
            </EnhancedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Minimal Toggle Component
interface MinimalToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function MinimalToggle({ enabled, onChange, disabled = false }: MinimalToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer ml-4">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={enabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className={cn(
        "w-10 h-6 rounded-full peer transition-all duration-200",
        enabled ? "bg-forest-green" : "bg-stone-gray/50",
        disabled && "opacity-50 cursor-not-allowed",
        "peer-checked:bg-forest-green peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
      )}>
      </div>
    </label>
  );
}
