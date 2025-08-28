'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { toast } from '@/components/ui/use-toast';
import { Property, PropertyWithClient } from '@/features/clients/types';

import { createAssessment, updateAssessment } from '../actions/assessment-actions';
import { CreateAssessmentData, PropertyAssessment, UpdateAssessmentData } from '../types';
import { AssessmentCompletionBridge } from './AssessmentCompletionBridge';
import { CleanAssessmentForm as AssessmentForm } from './CleanAssessmentForm';

interface EnhancedAssessmentFormProps {
  mode: 'create' | 'edit';
  assessment?: PropertyAssessment;
  initialProperty?: Property | null;
  initialClientId?: string | null;
  onCancel?: () => void;
  onSuccess?: (assessmentId: string) => void;
}

export function EnhancedAssessmentForm({
  mode,
  assessment,
  initialProperty,
  initialClientId,
  onCancel,
  onSuccess
}: EnhancedAssessmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCompletionBridge, setShowCompletionBridge] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState<PropertyAssessment | null>(null);
  const [assessmentProperty, setAssessmentProperty] = useState<Property | null>(initialProperty || null);

  const handleFormSubmit = async (data: CreateAssessmentData | UpdateAssessmentData) => {
    startTransition(async () => {
      try {
        let result;
        
        if (mode === 'edit' && assessment) {
          result = await updateAssessment(assessment.id, data as UpdateAssessmentData);
          
          if (result?.error) {
            toast({
              title: 'Update Failed',
              description: result.error.message || 'Failed to update assessment',
              variant: 'destructive',
            });
            return;
          }

          if (result?.data) {
            // Check if assessment status was changed to 'completed'
            const updatedData = data as UpdateAssessmentData;
            const wasCompleted = assessment.assessment_status === 'completed';
            const nowCompleted = updatedData.assessment_status === 'completed';
            
            if (!wasCompleted && nowCompleted) {
              // Assessment just completed - show bridge modal
              setCompletedAssessment(result.data);
              setShowCompletionBridge(true);
              return; // Don't redirect yet
            }
            
            toast({
              title: 'Assessment Updated',
              description: 'Assessment has been successfully updated',
            });
          }
        } else {
          result = await createAssessment(data as CreateAssessmentData);
          
          if (result?.error) {
            toast({
              title: 'Creation Failed',
              description: result.error.message || 'Failed to create assessment',
              variant: 'destructive',
            });
            return;
          }

          if (result?.data) {
            toast({
              title: 'Assessment Created',
              description: 'Assessment has been successfully created',
            });
          }
        }

        // Handle success
        if (result?.data) {
          if (onSuccess) {
            onSuccess(result.data.id);
          } else {
            router.push('/assessments');
          }
        }
      } catch (error) {
        console.error('Error submitting assessment:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    });
  };

  const handleCompletionBridgeClose = () => {
    setShowCompletionBridge(false);
    setCompletedAssessment(null);
    
    // Now redirect after modal is closed
    if (onSuccess && completedAssessment) {
      onSuccess(completedAssessment.id);
    } else {
      router.push('/assessments');
    }
  };

  const handleQuoteGenerated = (quoteId: string) => {
    // Redirect to the generated quote
    router.push(`/quotes/${quoteId}`);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/assessments');
    }
  };

  const propertyForBridge: PropertyWithClient | null = assessmentProperty ? {
    ...assessmentProperty,
    client_name: assessmentProperty.clients?.name || 'Unknown Client',
  } : null;

  return (
    <>
      <AssessmentForm
        mode={mode}
        assessment={assessment}
        initialProperty={initialProperty}
        initialClientId={initialClientId}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isSubmitting={isPending}
      />

      {/* Assessment Completion Bridge Modal */}
      {showCompletionBridge && completedAssessment && propertyForBridge && (
        <AssessmentCompletionBridge
          assessment={completedAssessment}
          property={propertyForBridge}
          isOpen={showCompletionBridge}
          onClose={handleCompletionBridgeClose}
          onQuoteGenerated={handleQuoteGenerated}
        />
      )}
    </>
  );
}