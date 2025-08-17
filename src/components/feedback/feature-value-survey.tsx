'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface FeatureValueSurveyProps {
  onComplete: (responses: FeatureValueResponses) => void;
  onDismiss: () => void;
  isVisible: boolean;
  triggerContext: 'feature_interaction' | 'time_based' | 'pricing_page';
}

export interface FeatureValueResponses {
  mostValuedFeatures: string[];
  featureImportanceRatings: Record<string, number>;
  currentPainPoints: string[];
  businessImpactExpectation: string;
  priceValuePerception: string;
  competitiveComparison: string;
  decisionInfluencers: string[];
  timeToValue: string;
  additionalFeatureRequests: string;
  completionTime: number;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'customization' | 'collaboration' | 'automation';
}

/**
 * Survey component that assesses perceived value of premium features
 * Implements FB-020: Feature value assessment surveys
 */
export function FeatureValueSurvey({
  onComplete,
  onDismiss,
  isVisible,
  triggerContext,
}: FeatureValueSurveyProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [startTime] = useState(Date.now());
  const [responses, setResponses] = useState<Partial<FeatureValueResponses>>({
    mostValuedFeatures: [],
    featureImportanceRatings: {},
    currentPainPoints: [],
    decisionInfluencers: [],
    additionalFeatureRequests: '',
  });

  const features: Feature[] = [
    {
      id: 'unlimited_quotes',
      name: 'Unlimited Quotes',
      description: 'Create as many quotes as you need without limits',
      category: 'productivity',
    },
    {
      id: 'advanced_templates',
      name: 'Advanced Templates',
      description: 'Professional quote templates with custom branding',
      category: 'customization',
    },
    {
      id: 'team_collaboration',
      name: 'Team Collaboration',
      description: 'Share and collaborate on quotes with team members',
      category: 'collaboration',
    },
    {
      id: 'automated_follow_ups',
      name: 'Automated Follow-ups',
      description: 'Automatic email reminders for pending quotes',
      category: 'automation',
    },
    {
      id: 'custom_branding',
      name: 'Custom Branding',
      description: 'Add your logo, colors, and brand styling',
      category: 'customization',
    },
    {
      id: 'analytics_dashboard',
      name: 'Analytics Dashboard',
      description: 'Track quote performance and business metrics',
      category: 'productivity',
    },
    {
      id: 'priority_support',
      name: 'Priority Support',
      description: 'Get help faster with priority customer support',
      category: 'productivity',
    },
    {
      id: 'api_integrations',
      name: 'API Integrations',
      description: 'Connect with your existing business tools',
      category: 'automation',
    },
  ];

  const painPointOptions = [
    { value: 'quote_limits', label: 'Running out of quote allowances' },
    { value: 'manual_follow_ups', label: 'Manually following up on quotes' },
    { value: 'basic_templates', label: 'Limited template customization' },
    { value: 'no_branding', label: 'Can\'t add professional branding' },
    { value: 'team_coordination', label: 'Difficulty coordinating with team' },
    { value: 'tracking_performance', label: 'No way to track quote performance' },
    { value: 'integration_needs', label: 'Need better tool integrations' },
    { value: 'support_delays', label: 'Slow customer support response' },
  ];

  const businessImpactOptions = [
    { value: 'save_time', label: 'Primarily save time on quote creation' },
    { value: 'increase_conversions', label: 'Increase quote acceptance rates' },
    { value: 'professional_image', label: 'Improve professional image' },
    { value: 'scale_business', label: 'Support business growth and scaling' },
    { value: 'team_efficiency', label: 'Improve team efficiency and collaboration' },
    { value: 'data_insights', label: 'Get better business insights and analytics' },
  ];

  const priceValueOptions = [
    { value: 'great_value', label: 'Great value - features justify the cost' },
    { value: 'fair_value', label: 'Fair value - reasonable for what\'s included' },
    { value: 'expensive', label: 'Expensive - not sure it\'s worth the cost' },
    { value: 'need_roi_proof', label: 'Need to see ROI before deciding' },
    { value: 'budget_constraints', label: 'Price is beyond my current budget' },
  ];

  const decisionInfluencerOptions = [
    { value: 'cost_savings', label: 'Potential cost savings' },
    { value: 'time_savings', label: 'Time savings' },
    { value: 'revenue_increase', label: 'Potential revenue increase' },
    { value: 'professional_appearance', label: 'More professional appearance' },
    { value: 'team_productivity', label: 'Improved team productivity' },
    { value: 'customer_experience', label: 'Better customer experience' },
    { value: 'competitive_advantage', label: 'Competitive advantage' },
    { value: 'business_insights', label: 'Better business insights' },
  ];

  const timeToValueOptions = [
    { value: 'immediate', label: 'Immediately - within days' },
    { value: 'weeks', label: 'Within a few weeks' },
    { value: 'months', label: 'Within a few months' },
    { value: 'uncertain', label: 'I\'m not sure' },
  ];

  const handleFeatureToggle = useCallback((featureId: string) => {
    setResponses(prev => ({
      ...prev,
      mostValuedFeatures: prev.mostValuedFeatures?.includes(featureId)
        ? prev.mostValuedFeatures.filter(id => id !== featureId)
        : [...(prev.mostValuedFeatures || []), featureId],
    }));
  }, []);

  const handleFeatureRating = useCallback((featureId: string, rating: number) => {
    setResponses(prev => ({
      ...prev,
      featureImportanceRatings: {
        ...prev.featureImportanceRatings,
        [featureId]: rating,
      },
    }));
  }, []);

  const handlePainPointToggle = useCallback((painPoint: string) => {
    setResponses(prev => ({
      ...prev,
      currentPainPoints: prev.currentPainPoints?.includes(painPoint)
        ? prev.currentPainPoints.filter(point => point !== painPoint)
        : [...(prev.currentPainPoints || []), painPoint],
    }));
  }, []);

  const handleRadioChange = useCallback((field: keyof FeatureValueResponses, value: string) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDecisionInfluencerToggle = useCallback((influencer: string) => {
    setResponses(prev => ({
      ...prev,
      decisionInfluencers: prev.decisionInfluencers?.includes(influencer)
        ? prev.decisionInfluencers.filter(inf => inf !== influencer)
        : [...(prev.decisionInfluencers || []), influencer],
    }));
  }, []);

  const handleTextareaChange = useCallback((value: string) => {
    setResponses(prev => ({ ...prev, additionalFeatureRequests: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handleComplete = useCallback(() => {
    const completionTime = Date.now() - startTime;
    const completeResponses: FeatureValueResponses = {
      mostValuedFeatures: responses.mostValuedFeatures || [],
      featureImportanceRatings: responses.featureImportanceRatings || {},
      currentPainPoints: responses.currentPainPoints || [],
      businessImpactExpectation: responses.businessImpactExpectation || '',
      priceValuePerception: responses.priceValuePerception || '',
      competitiveComparison: responses.competitiveComparison || '',
      decisionInfluencers: responses.decisionInfluencers || [],
      timeToValue: responses.timeToValue || '',
      additionalFeatureRequests: responses.additionalFeatureRequests || '',
      completionTime,
    };
    
    onComplete(completeResponses);
  }, [responses, startTime, onComplete]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (responses.mostValuedFeatures?.length || 0) > 0;
      case 2:
        return !!responses.businessImpactExpectation;
      case 3:
        return !!responses.priceValuePerception;
      case 4:
        return true; // Optional step
      default:
        return false;
    }
  };

  if (!isVisible) return null;

  const getTriggerMessage = () => {
    switch (triggerContext) {
      case 'feature_interaction':
        return 'Which premium features would be most valuable for your business?';
      case 'time_based':
        return 'Help us understand what features matter most to you.';
      case 'pricing_page':
        return 'Before you decide, tell us what features are most important to you.';
      default:
        return 'Help us understand your feature priorities.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-forest-green">
            {currentStep === 1 && 'Feature Priorities'}
            {currentStep === 2 && 'Business Impact'}
            {currentStep === 3 && 'Value Assessment'}
            {currentStep === 4 && 'Additional Input'}
          </CardTitle>
          <p className="text-sm text-charcoal">
            {currentStep === 1 && getTriggerMessage()}
            {currentStep === 2 && 'How do you expect these features to impact your business?'}
            {currentStep === 3 && 'Help us understand your perspective on pricing and value.'}
            {currentStep === 4 && 'Any additional thoughts or feature requests?'}
          </p>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`h-1 flex-1 rounded ${
                  step <= currentStep ? 'bg-sage-green' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal">
                  Select the features that would be most valuable to you: (Choose 3-5)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {features.map(feature => (
                    <div
                      key={feature.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        responses.mostValuedFeatures?.includes(feature.id)
                          ? 'border-sage-green bg-sage-green/10'
                          : 'border-gray-200 hover:border-sage-green/50'
                      }`}
                      onClick={() => handleFeatureToggle(feature.id)}
                    >
                      <div className="font-medium text-sm text-charcoal">{feature.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{feature.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal">
                  What are your biggest pain points with your current setup?
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {painPointOptions.map(option => (
                    <div
                      key={option.value}
                      className={`p-2 border rounded cursor-pointer transition-colors text-sm ${
                        responses.currentPainPoints?.includes(option.value)
                          ? 'border-sage-green bg-sage-green/10'
                          : 'border-gray-200 hover:border-sage-green/50'
                      }`}
                      onClick={() => handlePainPointToggle(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal">
                  What&apos;s your primary goal with premium features?
                </Label>
                <RadioGroup
                  value={responses.businessImpactExpectation}
                  onValueChange={(value) => handleRadioChange('businessImpactExpectation', value)}
                  className="space-y-2"
                >
                  {businessImpactOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="text-sm text-charcoal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal">
                  When would you expect to see value from these features?
                </Label>
                <RadioGroup
                  value={responses.timeToValue}
                  onValueChange={(value) => handleRadioChange('timeToValue', value)}
                  className="space-y-2"
                >
                  {timeToValueOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="text-sm text-charcoal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal">
                  What would most influence your upgrade decision?
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {decisionInfluencerOptions.map(option => (
                    <div
                      key={option.value}
                      className={`p-2 border rounded cursor-pointer transition-colors text-sm ${
                        responses.decisionInfluencers?.includes(option.value)
                          ? 'border-sage-green bg-sage-green/10'
                          : 'border-gray-200 hover:border-sage-green/50'
                      }`}
                      onClick={() => handleDecisionInfluencerToggle(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal">
                  How do you feel about the pricing?
                </Label>
                <RadioGroup
                  value={responses.priceValuePerception}
                  onValueChange={(value) => handleRadioChange('priceValuePerception', value)}
                  className="space-y-2"
                >
                  {priceValueOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="text-sm text-charcoal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal">
                  Rate the importance of your selected features (1-10):
                </Label>
                <div className="space-y-3">
                  {responses.mostValuedFeatures?.map(featureId => {
                    const feature = features.find(f => f.id === featureId);
                    if (!feature) return null;
                    
                    return (
                      <div key={featureId} className="space-y-2">
                        <div className="flex justify-between items-center gap-4">
                          <Label className="text-sm text-charcoal flex-1">{feature.name}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={responses.featureImportanceRatings?.[featureId] || 5}
                              onChange={(e) => handleFeatureRating(featureId, parseInt(e.target.value) || 5)}
                              className="w-16 text-center"
                            />
                            <span className="text-xs text-gray-500">/ 10</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="additional-features" className="text-sm font-medium text-charcoal">
                  Are there any features not mentioned that would be valuable to you?
                </Label>
                <Textarea
                  id="additional-features"
                  placeholder="Describe any additional features or improvements you'd like to see..."
                  value={responses.additionalFeatureRequests}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                Thank you for your feedback! This helps us understand what features matter most to our users.
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onDismiss}
              className="text-charcoal border-charcoal hover:bg-gray-50"
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-sage-green hover:bg-sage-green/90 text-white"
            >
              {currentStep === 4 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}