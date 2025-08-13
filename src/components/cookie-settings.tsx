'use client';

import { Cookie, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { CookiePreferences,useCookieConsent } from '@/contexts/cookie-consent-context';
import { cn } from '@/utils/cn';

export function CookieSettings() {
  const { preferences, savePreferences, resetConsent } = useCookieConsent();
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    const newPreferences = { ...localPreferences, [type]: value };
    setLocalPreferences(newPreferences);
    setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(preferences));
  };

  const handleSave = () => {
    savePreferences(localPreferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const handleResetConsent = () => {
    resetConsent();
    setHasChanges(false);
  };

  return (
    <div className="bg-paper-white p-8 rounded-2xl border border-stone-gray/20 shadow-lg">
      {/* Header following style guide */}
      <div className="flex items-center gap-4 mb-6">
        <Cookie className="w-8 h-8 text-forest-green" />
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-charcoal">
            Cookie Preferences
          </h2>
          <p className="text-lg text-charcoal/70 mt-2">
            Manage your cookie preferences and control how we use cookies on your device.
          </p>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Essential Cookies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-charcoal mb-2">Essential Cookies</h3>
              <p className="text-lg text-charcoal/70">
                Required for the website to function properly
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
            Authentication, security, load balancing, and basic functionality.
          </p>
        </div>

        {/* Functional Cookies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-charcoal mb-2">Functional Cookies</h3>
              <p className="text-lg text-charcoal/70">
                Remember your preferences and settings
              </p>
            </div>
            <StyleGuideToggle
              enabled={localPreferences.functional}
              onChange={(value) => handlePreferenceChange('functional', value)}
            />
          </div>
          <p className="text-sm text-charcoal/60 bg-light-concrete p-4 rounded-lg">
            Language preferences, theme settings, and form data persistence.
          </p>
        </div>

        {/* Analytics Cookies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-charcoal mb-2">Analytics Cookies</h3>
              <p className="text-lg text-charcoal/70">
                Help us improve the website experience
              </p>
            </div>
            <StyleGuideToggle
              enabled={localPreferences.analytics}
              onChange={(value) => handlePreferenceChange('analytics', value)}
            />
          </div>
          <p className="text-sm text-charcoal/60 bg-light-concrete p-4 rounded-lg">
            Anonymous usage statistics, page views, and performance monitoring.
          </p>
        </div>

        {/* Marketing Cookies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-charcoal mb-2">Marketing Cookies</h3>
              <p className="text-lg text-charcoal/70">
                Currently not used by LawnQuote
              </p>
            </div>
            <StyleGuideToggle
              enabled={localPreferences.marketing}
              onChange={(value) => handlePreferenceChange('marketing', value)}
              disabled={true}
            />
          </div>
          <p className="text-sm text-charcoal/60 bg-light-concrete p-4 rounded-lg">
            We don&apos;t use marketing cookies or track users for advertising.
          </p>
        </div>

        {/* Action Buttons following style guide */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-stone-gray/20">
          {/* Primary CTA - Equipment Yellow */}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(
              "bg-equipment-yellow text-charcoal font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-lg",
              !hasChanges && "opacity-50 cursor-not-allowed hover:brightness-100"
            )}
          >
            Save Preferences
          </button>
          
          {/* Standard Button - Forest Green */}
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className={cn(
              "bg-forest-green text-paper-white font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-opacity text-lg flex items-center gap-2",
              !hasChanges && "opacity-50 cursor-not-allowed"
            )}
          >
            <RotateCcw className="w-5 h-5" />
            Reset Changes
          </button>
          
          {/* Secondary CTA - Ghost Style */}
          <button
            onClick={handleResetConsent}
            className="bg-paper-white/20 text-charcoal font-bold px-8 py-4 rounded-lg hover:bg-paper-white/30 transition-all duration-200 border border-stone-gray/30 text-lg"
          >
            Reset All Consent
          </button>
        </div>

        <div className="text-sm text-charcoal/60 pt-4">
          <p>
            Learn more about our cookie usage in our{' '}
            <a href="/cookies" className="text-forest-green hover:underline font-medium">
              Cookie Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// Style Guide Compliant Toggle Component (same as in banner)
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
