'use client';

import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Property } from '@/features/clients/types';

import { createAssessment } from '../actions/assessment-actions';
import { CreateAssessmentData, UpdateAssessmentData } from '../types';
import { AssessmentFormRefactored as AssessmentForm } from './AssessmentForm';

interface NewAssessmentFormProps {
  initialProperty?: Property | null;
  initialClientId?: string | null;
}

export function NewAssessmentForm({ initialProperty, initialClientId }: NewAssessmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateAssessmentData | UpdateAssessmentData) => {
    setIsSubmitting(true);
    
    try {
      // For new assessments, we know it's CreateAssessmentData
      const result = await createAssessment(data as CreateAssessmentData);
      
      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error.message || 'Failed to create assessment',
          variant: 'destructive',
        });
        return;
      }

      if (result?.data) {
        toast({
          title: 'Success',
          description: 'Assessment created successfully',
        });
        
        // Navigate to the new assessment
        router.push(`/assessments/${result.data.id}`);
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
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
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/assessments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-forest-green">New Property Assessment</h1>
          <p className="text-charcoal mt-1">
            Create a detailed assessment for accurate quoting and service planning
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
            mode="create"
            initialProperty={initialProperty}
            initialClientId={initialClientId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
