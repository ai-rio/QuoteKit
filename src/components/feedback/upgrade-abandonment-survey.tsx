'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface UpgradeAbandonmentSurveyProps {
  onComplete: (responses: UpgradeAbandonmentResponses) => void;
  onDismiss: () => void;
  isVisible: boolean;
  abandonmentType: 'exit_intent' | 'extended_time' | 'navigation_attempt';
}

export interface UpgradeAbandonmentResponses {
  primaryReason: string;
  secondaryReasons: string[];
  priceRelated: boolean;
  featureRelated: boolean;
  timingRelated: boolean;
  additionalFeedback: string;
  wouldConsiderLater: boolean;
  preferredContactMethod: string;
  completionTime: number;
}

/**
 * Survey component that captures reasons for upgrade abandonment
 * Implements FB-020: Upgrade abandonment survey with multi-question logic
 */
export function UpgradeAbandonmentSurvey({
  onComplete,
  onDismiss,
  isVisible,
  abandonmentType,
}: UpgradeAbandonmentSurveyProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [startTime] = useState(Date.now());
  const [responses, setResponses] = useState<Partial<UpgradeAbandonmentResponses>>({
    secondaryReasons: [],
    priceRelated: false,
    featureRelated: false,
    timingRelated: false,
    additionalFeedback: '',
    wouldConsiderLater: false,
    preferredContactMethod: '',
  });

  const handlePrimaryReasonChange = useCallback((value: string) => {
    setResponses(prev => ({ ...prev, primaryReason: value }));
  }, []);

  const handleSecondaryReasonToggle = useCallback((reason: string, checked: boolean) => {
    setResponses(prev => {
      const currentReasons = prev.secondaryReasons || [];
      if (checked) {
        return { 
          ...prev, 
          secondaryReasons: [...currentReasons, reason] 
        };
      } else {
        return { 
          ...prev, 
          secondaryReasons: currentReasons.filter(r => r !== reason) 
        };
      }
    });
  }, []);

  const handleCategoryToggle = useCallback((category: keyof UpgradeAbandonmentResponses, checked: boolean) => {
    setResponses(prev => ({ ...prev, [category]: checked }));
  }, []);

  const handleTextChange = useCallback((field: keyof UpgradeAbandonmentResponses, value: string) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleComplete = useCallback(() => {
    const completionTime = Date.now() - startTime;
    const finalResponses: UpgradeAbandonmentResponses = {
      primaryReason: responses.primaryReason || '',
      secondaryReasons: responses.secondaryReasons || [],
      priceRelated: responses.priceRelated || false,
      featureRelated: responses.featureRelated || false,
      timingRelated: responses.timingRelated || false,
      additionalFeedback: responses.additionalFeedback || '',
      wouldConsiderLater: responses.wouldConsiderLater || false,
      preferredContactMethod: responses.preferredContactMethod || '',
      completionTime,
    };
    onComplete(finalResponses);
  }, [responses, startTime, onComplete]);

  const canProceedToStep2 = responses.primaryReason;
  const canProceedToStep3 = (responses.secondaryReasons && responses.secondaryReasons.length > 0) || 
                           responses.priceRelated || responses.featureRelated || responses.timingRelated;

  if (!isVisible) return null;

  const primaryReasons = [
    { value: 'price_too_high', label: 'Price is too high for our budget' },
    { value: 'unclear_value', label: 'Value proposition is not clear enough' },
    { value: 'missing_features', label: 'Missing key features I need' },
    { value: 'not_right_time', label: 'Not the right time for our business' },
    { value: 'need_approval', label: 'Need to get approval from others' },
    { value: 'comparing_options', label: 'Still comparing with other options' },
    { value: 'trial_not_enough', label: 'Trial period was not long enough' },
    { value: 'setup_concerns', label: 'Concerns about setup and implementation' },
    { value: 'data_migration', label: 'Worried about data migration complexity' },
    { value: 'other', label: 'Other (please specify)' },
  ];

  const secondaryReasons = [
    'Need more training resources',
    'Concerned about ongoing support',
    'Integration with existing tools',
    'Team adoption challenges',
    'Security and compliance requirements',
    'Performance and reliability concerns',
  ];

  const contactMethods = [
    { value: 'email', label: 'Email with more information' },
    { value: 'demo', label: 'Schedule a personalized demo' },
    { value: 'trial_extension', label: 'Extend my trial period' },
    { value: 'pricing_discussion', label: 'Discuss pricing options' },
    { value: 'no_contact', label: 'No follow-up needed' },
  ];

  return (
    <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4 z-50 shadow-2xl border-2">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-forest-green">
              Help us understand what happened
            </CardTitle>
            <p className="text-charcoal mt-2">
              Your feedback helps us improve the upgrade experience for everyone. 
              This will take about 2-3 minutes.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </Button>
        </div>
        <div className="mt-4">
          <div className="flex space-x-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full ${
                  step <= currentStep ? 'bg-forest-green' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">Step {currentStep} of 3</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold text-forest-green block mb-4">
                What was the main reason you didn&apos;t upgrade today?
              </Label>
              <RadioGroup
                value={responses.primaryReason || ''}
                onValueChange={handlePrimaryReasonChange}
                className="space-y-3"
              >
                {primaryReasons.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label 
                      htmlFor={reason.value} 
                      className="text-sm text-charcoal cursor-pointer flex-1"
                    >
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {responses.primaryReason === 'other' && (
                <div className="mt-4">
                  <Label htmlFor="other-reason" className="text-sm font-medium text-forest-green">
                    Please specify:
                  </Label>
                  <Textarea
                    id="other-reason"
                    placeholder="Tell us more about your specific concern..."
                    value={responses.additionalFeedback || ''}
                    onChange={(e) => handleTextChange('additionalFeedback', e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onDismiss}>
                Skip survey
              </Button>
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep2}
                className="bg-forest-green hover:bg-forest-green/90"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold text-forest-green block mb-4">
                Are there any other concerns you have? (Select all that apply)
              </Label>
              <div className="space-y-3">
                {secondaryReasons.map((reason) => (
                  <div key={reason} className="flex items-center space-x-2">
                    <Checkbox checked={(responses.secondaryReasons || []).includes(reason)}
                      onCheckedChange={(checked) => handleSecondaryReasonToggle(reason, !!checked)}
                    />
                    <Label 
                      htmlFor={`secondary-${reason}`} 
                      className="text-sm text-charcoal cursor-pointer"
                    >
                      {reason}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-lg font-semibold text-forest-green block mb-4">
                Which categories best describe your concerns?
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={responses.priceRelated || false}
                    onCheckedChange={(checked) => handleCategoryToggle('priceRelated', !!checked)}
                  />
                  <Label htmlFor="price-related" className="text-sm text-charcoal cursor-pointer">
                    Price and billing related
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={responses.featureRelated || false}
                    onCheckedChange={(checked) => handleCategoryToggle('featureRelated', !!checked)}
                  />
                  <Label htmlFor="feature-related" className="text-sm text-charcoal cursor-pointer">
                    Features and functionality
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={responses.timingRelated || false}
                    onCheckedChange={(checked) => handleCategoryToggle('timingRelated', !!checked)}
                  />
                  <Label htmlFor="timing-related" className="text-sm text-charcoal cursor-pointer">
                    Timing and readiness
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <div className="space-x-3">
                <Button variant="outline" onClick={onDismiss}>
                  Skip survey
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedToStep3}
                  className="bg-forest-green hover:bg-forest-green/90"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold text-forest-green block mb-4">
                Any additional feedback about the upgrade process?
              </Label>
              <Textarea
                placeholder="Tell us how we could improve the upgrade experience..."
                value={responses.additionalFeedback || ''}
                onChange={(e) => handleTextChange('additionalFeedback', e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-lg font-semibold text-forest-green block mb-4">
                Would you consider upgrading in the future?
              </Label>
              <RadioGroup
                value={responses.wouldConsiderLater ? 'yes' : 'no'}
                onValueChange={(value) => handleCategoryToggle('wouldConsiderLater', value === 'yes')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="consider-yes" />
                  <Label htmlFor="consider-yes" className="text-sm text-charcoal cursor-pointer">
                    Yes, when the time is right
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="consider-no" />
                  <Label htmlFor="consider-no" className="text-sm text-charcoal cursor-pointer">
                    No, not likely
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {responses.wouldConsiderLater && (
              <div>
                <Label className="text-lg font-semibold text-forest-green block mb-4">
                  How would you prefer us to follow up?
                </Label>
                <RadioGroup
                  value={responses.preferredContactMethod || ''}
                  onValueChange={(value) => handleTextChange('preferredContactMethod', value)}
                >
                  {contactMethods.map((method) => (
                    <div key={method.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={method.value} id={method.value} />
                      <Label 
                        htmlFor={method.value} 
                        className="text-sm text-charcoal cursor-pointer"
                      >
                        {method.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <div className="space-x-3">
                <Button variant="outline" onClick={onDismiss}>
                  Skip survey
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="bg-forest-green hover:bg-forest-green/90"
                >
                  Complete Survey
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}