'use client';

import { Calendar, CheckCircle, Clock, Edit, Eye, FileText, MapPin, User } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { AssessmentOverallCondition,AssessmentStatus, PropertyAssessment, PropertyAssessmentWithDetails } from '../types';

interface AssessmentCardProps {
  assessment: PropertyAssessmentWithDetails;
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  const property = assessment.properties;
  const client = property?.clients;

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

  const getConditionColor = (condition: AssessmentOverallCondition) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
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

  const getWorkflowStatusColor = (workflowStatus?: string) => {
    switch (workflowStatus) {
      case 'completed':
        return 'bg-equipment-yellow text-charcoal border-equipment-yellow/20';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default:
        return 'bg-forest-green/10 text-forest-green border-forest-green/20';
    }
  };

  const getWorkflowStatusLabel = (workflowStatus?: string, assessmentStatus?: string) => {
    if (assessmentStatus === 'completed') {
      switch (workflowStatus) {
        case 'completed':
          return 'Quote Ready';
        case 'processing':
          return 'Generating Quote';
        case 'error':
          return 'Quote Error';
        case 'pending':
        default:
          return 'Ready for Quote';
      }
    }
    return null;
  };

  return (
    <Card className="bg-paper-white hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(assessment.assessment_status)}
            <span className="font-semibold text-forest-green">
              #{assessment.assessment_number}
            </span>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(assessment.assessment_status)}>
              {assessment.assessment_status.replace('_', ' ')}
            </Badge>
            {getWorkflowStatusLabel((assessment as any).workflow_status, assessment.assessment_status) && (
              <Badge className={getWorkflowStatusColor((assessment as any).workflow_status)}>
                {getWorkflowStatusLabel((assessment as any).workflow_status, assessment.assessment_status)}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Property and Client Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-charcoal-400" />
            <span className="font-medium text-charcoal truncate">
              {property?.service_address || 'Unknown Address'}
            </span>
          </div>
          {client && (
            <div className="flex items-center gap-2 text-sm text-charcoal-600">
              <User className="h-4 w-4 text-charcoal-400" />
              <span className="truncate">{client.name}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Assessment Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-charcoal-600">Date:</span>
              <div className="font-medium text-charcoal">
                {formatDate(assessment.assessment_date)}
              </div>
            </div>
            <div>
              <span className="text-charcoal-600">Assessor:</span>
              <div className="font-medium text-charcoal truncate">
                {assessment.assessor_name}
              </div>
            </div>
          </div>

          {/* Condition and Metrics */}
          {(assessment.overall_condition || assessment.total_estimated_hours || assessment.estimated_total_cost) && (
            <>
              <Separator />
              <div className="space-y-2">
                {assessment.overall_condition && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-charcoal-600">Condition:</span>
                    <Badge variant="outline" className={getConditionColor(assessment.overall_condition)}>
                      {assessment.overall_condition}
                    </Badge>
                  </div>
                )}
                
                {assessment.total_estimated_hours && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-600">Est. Hours:</span>
                    <span className="font-medium text-charcoal">
                      {assessment.total_estimated_hours}h
                    </span>
                  </div>
                )}

                {assessment.estimated_total_cost && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-600">Est. Cost:</span>
                    <span className="font-bold text-forest-green">
                      ${assessment.estimated_total_cost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Assessment Notes Preview */}
          {assessment.assessment_notes && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-charcoal-600">Notes:</span>
                <p className="text-sm text-charcoal mt-1 line-clamp-2">
                  {assessment.assessment_notes}
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/assessments/${assessment.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/assessments/${assessment.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
          </div>

          {/* Quote Link if exists */}
          {assessment.quote_id && (
            <div className="pt-2 border-t">
              <Button asChild variant="ghost" size="sm" className="w-full text-forest-green hover:text-forest-green/80">
                <Link href={`/quotes/${assessment.quote_id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Related Quote
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
