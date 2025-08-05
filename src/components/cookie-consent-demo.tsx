'use client';

import { BarChart3, Cookie, Settings,Shield } from 'lucide-react';

import { useCookieConsent } from '@/contexts/cookie-consent-context';
import { useAnalytics } from '@/hooks/use-analytics';

export function CookieConsentDemo() {
  const { hasConsent, preferences, resetConsent } = useCookieConsent();
  const { isEnabled, trackEvent } = useAnalytics();

  const handleTestTracking = () => {
    trackEvent('demo_button_clicked', {
      timestamp: new Date().toISOString(),
      page: 'cookie-demo'
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-paper-white p-8 rounded-2xl border border-stone-gray/20 shadow-lg">
      {/* Header following style guide */}
      <div className="flex items-center gap-4 mb-8">
        <Cookie className="w-8 h-8 text-forest-green" />
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-charcoal">
            Cookie Consent System Demo
          </h2>
          <p className="text-lg text-charcoal/70 mt-2">
            See how the cookie consent system works in real-time
          </p>
        </div>
      </div>
      
      <div className="space-y-8">
        
        {/* Consent Status */}
        <div className="flex items-center justify-between p-6 bg-light-concrete rounded-lg">
          <div>
            <h3 className="text-xl font-bold text-charcoal mb-2">Consent Status</h3>
            <p className="text-lg text-charcoal/70">
              {hasConsent ? 'User has provided consent' : 'No consent given yet'}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
            hasConsent 
              ? 'bg-forest-green text-paper-white' 
              : 'bg-stone-gray/50 text-charcoal'
          }`}>
            {hasConsent ? 'Consented' : 'Pending'}
          </div>
        </div>

        {/* Cookie Preferences */}
        {hasConsent && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-charcoal flex items-center gap-3">
              <Settings className="w-6 h-6 text-forest-green" />
              Current Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-light-concrete rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-forest-green" />
                  <span className="text-lg font-medium text-charcoal">Essential</span>
                </div>
                <div className="px-3 py-1 bg-forest-green text-paper-white rounded-lg font-bold text-sm">
                  Always On
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-concrete rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6" />
                  <span className="text-lg font-medium text-charcoal">Functional</span>
                </div>
                <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                  preferences.functional 
                    ? 'bg-forest-green text-paper-white' 
                    : 'bg-stone-gray/50 text-charcoal'
                }`}>
                  {preferences.functional ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-concrete rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-lg font-medium text-charcoal">Analytics</span>
                </div>
                <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                  preferences.analytics 
                    ? 'bg-forest-green text-paper-white' 
                    : 'bg-stone-gray/50 text-charcoal'
                }`}>
                  {preferences.analytics ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-concrete rounded-lg">
                <div className="flex items-center gap-3">
                  <Cookie className="w-6 h-6" />
                  <span className="text-lg font-medium text-charcoal">Marketing</span>
                </div>
                <div className="px-3 py-1 bg-stone-gray/50 text-charcoal rounded-lg font-bold text-sm">
                  Not Used
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Demo */}
        {hasConsent && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-charcoal">Analytics Integration</h3>
            <div className="p-6 bg-light-concrete rounded-lg">
              <p className="text-lg text-charcoal/70 mb-4">
                Analytics tracking is <span className="font-bold">{isEnabled ? 'enabled' : 'disabled'}</span> based on your cookie preferences.
              </p>
              
              {/* Primary CTA - Equipment Yellow */}
              <button
                onClick={handleTestTracking}
                disabled={!isEnabled}
                className={`bg-equipment-yellow text-charcoal font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-lg ${
                  !isEnabled ? 'opacity-50 cursor-not-allowed hover:brightness-100' : ''
                }`}
              >
                Test Analytics Event
              </button>
              
              {!isEnabled && (
                <p className="text-sm text-charcoal/60 mt-3">
                  Enable analytics cookies to test event tracking
                </p>
              )}
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="pt-6 border-t border-stone-gray/20">
          {/* Secondary CTA - Ghost Style */}
          <button
            onClick={resetConsent}
            className="bg-paper-white/20 text-charcoal font-bold px-8 py-4 rounded-lg hover:bg-paper-white/30 transition-all duration-200 border border-stone-gray/30 text-lg"
          >
            Reset Consent (Show Banner Again)
          </button>
        </div>

      </div>
    </div>
  );
}
