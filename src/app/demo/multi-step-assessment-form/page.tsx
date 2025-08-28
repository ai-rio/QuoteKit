'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MultiStepAssessmentForm } from '@/features/assessments/components/MultiStepAssessmentForm';
import { CreateAssessmentData, UpdateAssessmentData } from '@/features/assessments/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MultiStepAssessmentFormDemo() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: CreateAssessmentData | UpdateAssessmentData) => {
    console.log('🚀 Multi-step form submitted with data:', data);
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Assessment created successfully!\\n\\nData:\\n${JSON.stringify(data, null, 2)}`);
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    console.log('Multi-step form cancelled');
    setShowDemo(false);
  };

  if (!showDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-concrete via-paper-white to-stone-gray/20 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mb-6 bg-paper-white border-stone-gray/50 text-charcoal hover:bg-stone-gray/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-forest-green mb-4">
                Multi-Step Assessment Form
              </h1>
              <p className="text-charcoal text-xl mb-8">
                Experience the premium Typeform-style UX with smooth animations and progressive disclosure
              </p>
            </div>

            <div className="bg-paper-white border border-stone-gray/30 rounded-lg p-8 shadow-lg max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-forest-green mb-6 text-center">
                ✨ Premium Features
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-forest-green rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-charcoal">One Question Per Screen</h3>
                    <p className="text-sm text-charcoal opacity-80">Focus user attention on each step</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-forest-green rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-charcoal">Smooth Slide Animations</h3>
                    <p className="text-sm text-charcoal opacity-80">Powered by Framer Motion</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-forest-green rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-charcoal">Visual Progress Tracking</h3>
                    <p className="text-sm text-charcoal opacity-80">Animated progress bar with percentage</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-forest-green rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-charcoal">Step-by-Step Validation</h3>
                    <p className="text-sm text-charcoal opacity-80">Each step validates before proceeding</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-forest-green rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-charcoal">QuoteKit Design Integration</h3>
                    <p className="text-sm text-charcoal opacity-80">Perfect styling with forest-green accents</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowDemo(true)}
                className="w-full bg-forest-green hover:bg-forest-green/90 text-paper-white font-semibold py-4 text-lg"
              >
                🚀 Try the Multi-Step Form
              </Button>
            </div>

            <div className="mt-12 max-w-3xl mx-auto">
              <div className="bg-paper-white border border-stone-gray/30 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-forest-green mb-4">
                  Form Steps Overview:
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center p-3 bg-light-concrete/30 rounded-lg">
                    <div className="w-8 h-8 bg-forest-green text-paper-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                    <p className="font-medium text-charcoal">Select Client</p>
                  </div>
                  <div className="text-center p-3 bg-light-concrete/30 rounded-lg">
                    <div className="w-8 h-8 bg-forest-green text-paper-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                    <p className="font-medium text-charcoal">Choose Property</p>
                  </div>
                  <div className="text-center p-3 bg-light-concrete/30 rounded-lg">
                    <div className="w-8 h-8 bg-forest-green text-paper-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                    <p className="font-medium text-charcoal">Assessor Info</p>
                  </div>
                  <div className="text-center p-3 bg-light-concrete/30 rounded-lg">
                    <div className="w-8 h-8 bg-forest-green text-paper-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
                    <p className="font-medium text-charcoal">Schedule</p>
                  </div>
                  <div className="text-center p-3 bg-light-concrete/30 rounded-lg">
                    <div className="w-8 h-8 bg-forest-green text-paper-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">5</div>
                    <p className="font-medium text-charcoal">Review</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-concrete via-paper-white to-stone-gray/20 py-8">
      <div className="container mx-auto px-4">
        <Button 
          variant="outline" 
          onClick={() => setShowDemo(false)}
          className="mb-6 bg-paper-white border-stone-gray/50 text-charcoal hover:bg-stone-gray/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Overview
        </Button>
        
        <MultiStepAssessmentForm
          mode="create"
          initialProperty={null}
          initialClientId={null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}