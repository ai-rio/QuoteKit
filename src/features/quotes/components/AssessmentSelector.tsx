'use client';

import { CheckCircle, Clock, FileText, MapPin } from 'lucide-react';
import { useEffect,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { getAssessmentsForProperty } from '@/features/assessments/actions/assessment-actions';
import { AssessmentStatus,PropertyAssessment } from '@/features/assessments/types';
import { Property } from '@/features/clients/types';

interface AssessmentSelectorProps {
  property: Property | null;
  selectedAssessmentId?: string;
  onAssessmentSelect: (assessmentId: string | null, assessment: PropertyAssessment | null) => void;
  onCreateNewAssessment?: () => void;
}

export function AssessmentSelector({
  property,
  selectedAssessmentId,
  onAssessmentSelect,
  onCreateNewAssessment
}: AssessmentSelectorProps) {
  const [assessments, setAssessments] = useState<PropertyAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(selectedAssessmentId || 'none');

  // Load assessments when property changes
  useEffect(() => {
    if (property?.id) {
      loadAssessments(property.id);
    } else {
      setAssessments([]);
    }
  }, [property?.id]);

  const loadAssessments = async (propertyId: string) => {
    setLoading(true);
    try {
      const result = await getAssessmentsForProperty(propertyId);
      if (result?.error) {
        toast({
          title: 'Error',
          description: 'Failed to load assessments for this property',
          variant: 'destructive',
        });
        return;
      }
      
      setAssessments(result?.data || []);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading assessments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (value: string) => {
    setSelectedValue(value);
    
    if (value === 'none') {
      onAssessmentSelect(null, null);
    } else {
      const assessment = assessments.find(a => a.id === value);
      onAssessmentSelect(value, assessment || null);
    }
  };

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'requires_followup':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case 'completed':
      case 'reviewed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!property) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-forest-green">Assessment Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-charcoal-600">Select a property first to view available assessments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-forest-green">
          <FileText className="h-5 w-5" />
          Assessment Selection
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-charcoal-600">
          <MapPin className="h-4 w-4" />
          {property.service_address}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <RadioGroup value={selectedValue} onValueChange={handleSelectionChange}>
            {/* No Assessment Option */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>Create quote without assessment</span>
                  <Badge variant="outline">Manual</Badge>
                </div>
              </Label>
            </div>

            {assessments.length > 0 && <Separator />}

            {/* Available Assessments */}
            {assessments.map((assessment) => (
              <div key={assessment.id} className="flex items-start space-x-2">
                <RadioGroupItem value={assessment.id} id={assessment.id} className="mt-1" />
                <Label htmlFor={assessment.id} className="flex-1 cursor-pointer">
                  <Card className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="space-y-2">
                      {/* Assessment Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(assessment.assessment_status)}
                          <span className="font-medium">
                            Assessment #{assessment.assessment_number}
                          </span>
                        </div>
                        <Badge className={getStatusColor(assessment.assessment_status)}>
                          {assessment.assessment_status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Assessment Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm text-charcoal-600">
                        <div>
                          <span className="font-medium">Date:</span>{' '}
                          {formatDate(assessment.assessment_date)}
                        </div>
                        <div>
                          <span className="font-medium">Assessor:</span>{' '}
                          {assessment.assessor_name}
                        </div>
                        {assessment.overall_condition && (
                          <div>
                            <span className="font-medium">Condition:</span>{' '}
                            <Badge variant="outline" className="ml-1">
                              {assessment.overall_condition}
                            </Badge>
                          </div>
                        )}
                        {assessment.total_estimated_hours && (
                          <div>
                            <span className="font-medium">Est. Hours:</span>{' '}
                            {assessment.total_estimated_hours}h
                          </div>
                        )}
                      </div>

                      {/* Assessment Summary */}
                      {assessment.assessment_notes && (
                        <div className="text-sm text-charcoal-600">
                          <span className="font-medium">Notes:</span>{' '}
                          {assessment.assessment_notes.length > 100
                            ? `${assessment.assessment_notes.substring(0, 100)}...`
                            : assessment.assessment_notes
                          }
                        </div>
                      )}

                      {/* Pricing Indicators */}
                      {assessment.estimated_total_cost && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm font-medium text-forest-green">
                            Estimated Total:
                          </span>
                          <span className="text-lg font-bold text-forest-green">
                            ${assessment.estimated_total_cost.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* No Assessments Available */}
        {!loading && assessments.length === 0 && (
          <div className="text-center py-6 space-y-3">
            <FileText className="h-12 w-12 text-charcoal-400 mx-auto" />
            <div>
              <h3 className="font-medium text-charcoal">No assessments available</h3>
              <p className="text-sm text-charcoal-600 mt-1">
                Create an assessment for this property to enable assessment-based quoting.
              </p>
            </div>
            {onCreateNewAssessment && (
              <Button
                onClick={onCreateNewAssessment}
                variant="outline"
                className="mt-3"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create New Assessment
              </Button>
            )}
          </div>
        )}

        {/* Assessment Count */}
        {assessments.length > 0 && (
          <div className="text-sm text-charcoal-600 text-center pt-2 border-t">
            {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} available for this property
          </div>
        )}
      </CardContent>
    </Card>
  );
}
