'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CleanAssessmentForm } from '@/features/assessments/components/CleanAssessmentForm';
import { CreateAssessmentData, UpdateAssessmentData } from '@/features/assessments/types';

export default function CleanAssessmentFormDemo() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: CreateAssessmentData | UpdateAssessmentData) => {
    console.log('🚀 Form submitted with data:', data);
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Assessment created successfully!\n\nData:\n${JSON.stringify(data, null, 2)}`);
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-concrete via-paper-white to-stone-gray/20 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-forest-green mb-2">
            CleanAssessmentForm Demo
          </h1>
          <p className="text-charcoal text-lg">
            Test the new clean assessment form component
          </p>
        </div>

        <div className="flex justify-center">
          <CleanAssessmentForm
            mode="create"
            initialProperty={null}
            initialClientId={null}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-paper-white border border-stone-gray/30 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-forest-green mb-3">
              Testing Instructions:
            </h2>
            <ul className="text-charcoal space-y-2 text-sm">
              <li>• <strong>No infinite loops:</strong> Form state is managed by React Hook Form</li>
              <li>• <strong>Clean client/property selection:</strong> Properties auto-filter by selected client</li>
              <li>• <strong>Form validation:</strong> Required fields are validated before submission</li>
              <li>• <strong>Loading states:</strong> Smooth loading indicators for async operations</li>
              <li>• <strong>Responsive design:</strong> Works on mobile and desktop</li>
              <li>• <strong>QuoteKit styling:</strong> Forest green accents, proper typography</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}