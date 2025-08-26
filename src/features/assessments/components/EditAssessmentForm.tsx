'use client';

import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

import { updateAssessment } from '../actions/assessment-actions';
import { PropertyAssessment, PropertyAssessmentWithDetails, UpdateAssessmentData } from '../types';
import { AssessmentFormRefactored as AssessmentForm } from './AssessmentForm';

interface EditAssessmentFormProps {
  assessment: PropertyAssessmentWithDetails;
}

export function EditAssessmentForm({ assessment }: EditAssessmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const property = assessment.properties;

  const handleSubmit = async (data: UpdateAssessmentData) => {
    setIsSubmitting(true);
    
    try {
      const result = await updateAssessment(assessment.id, data);
      
      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error.message || 'Failed to update assessment',
          variant: 'destructive',
        });
        return;
      }

      if (result?.data) {
        toast({
          title: 'Success',
          description: 'Assessment updated successfully',
        });
        
        // Navigate back to the assessment view
        router.push(`/assessments/${assessment.id}`);
      }
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/assessments/${assessment.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/assessments/${assessment.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessment
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-forest-green">
            Edit Assessment #{assessment.assessment_number}
          </h1>
          <p className="text-charcoal-600 mt-1">
            {property?.service_address || 'Property Assessment'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="text-forest-green">Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AssessmentForm
            mode="edit"
            assessment={assessment}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
