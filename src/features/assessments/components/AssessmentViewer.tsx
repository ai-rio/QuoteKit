'use client';

import { ArrowLeft, Calendar, DollarSign,Edit, FileText, MapPin, User } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { AssessmentOverallCondition,AssessmentStatus, PropertyAssessment, PropertyAssessmentWithDetails } from '../types';
import { AssessmentReport } from './AssessmentReport';
import { AssessmentToQuoteIntegration } from './AssessmentToQuoteIntegration';

interface AssessmentViewerProps {
  assessment: PropertyAssessmentWithDetails;
}

export function AssessmentViewer({ assessment }: AssessmentViewerProps) {
  const property = assessment.properties;
  const client = property?.clients;
  const relatedQuotes = assessment.quotes || [];

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/assessments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-forest-green">
                Assessment #{assessment.assessment_number}
              </h1>
              <Badge className={getStatusColor(assessment.assessment_status)}>
                {assessment.assessment_status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-charcoal-600 mt-1">
              {property?.service_address || 'Property Assessment'}
            </p>
          </div>
        </div>
        <Button asChild className="bg-equipment-yellow hover:bg-equipment-yellow/90 text-charcoal">
          <Link href={`/assessments/${assessment.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Assessment
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Assessment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="bg-paper-white">
            <CardHeader>
              <CardTitle className="text-forest-green">Assessment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-charcoal-600">Assessment Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-charcoal-400" />
                    <span className="text-charcoal">{formatDate(assessment.assessment_date)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-charcoal-600">Assessor</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-charcoal-400" />
                    <span className="text-charcoal">{assessment.assessor_name}</span>
                  </div>
                </div>
              </div>

              {assessment.weather_conditions && (
                <div>
                  <label className="text-sm font-medium text-charcoal-600">Weather Conditions</label>
                  <p className="text-charcoal mt-1">{assessment.weather_conditions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card className="bg-paper-white">
            <CardHeader>
              <CardTitle className="text-forest-green">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-charcoal-400" />
                <span className="text-charcoal">{property?.service_address}</span>
              </div>
              
              {client && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-charcoal-400" />
                  <span className="text-charcoal">{client.name}</span>
                  {client.email && (
                    <span className="text-charcoal-600">• {client.email}</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-charcoal-600">Property Type</label>
                  <p className="text-charcoal mt-1 capitalize">{property?.property_type || 'Not specified'}</p>
                </div>
                {assessment.lawn_area_measured && (
                  <div>
                    <label className="text-sm font-medium text-charcoal-600">Lawn Area</label>
                    <p className="text-charcoal mt-1">{assessment.lawn_area_measured} sq ft</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assessment Notes */}
          {(assessment.assessment_notes || assessment.recommendations) && (
            <Card className="bg-paper-white">
              <CardHeader>
                <CardTitle className="text-forest-green">Notes & Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assessment.assessment_notes && (
                  <div>
                    <label className="text-sm font-medium text-charcoal-600">Assessment Notes</label>
                    <p className="text-charcoal mt-1 whitespace-pre-wrap">{assessment.assessment_notes}</p>
                  </div>
                )}
                
                {assessment.recommendations && (
                  <>
                    {assessment.assessment_notes && <Separator />}
                    <div>
                      <label className="text-sm font-medium text-charcoal-600">Recommendations</label>
                      <p className="text-charcoal mt-1 whitespace-pre-wrap">{assessment.recommendations}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assessment Summary */}
          <Card className="bg-paper-white">
            <CardHeader>
              <CardTitle className="text-forest-green">Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.overall_condition && (
                <div>
                  <label className="text-sm font-medium text-charcoal-600">Overall Condition</label>
                  <div className="mt-1">
                    <Badge className={getConditionColor(assessment.overall_condition)}>
                      {assessment.overall_condition}
                    </Badge>
                  </div>
                </div>
              )}

              {assessment.complexity_score && (
                <div>
                  <label className="text-sm font-medium text-charcoal-600">Complexity Score</label>
                  <p className="text-2xl font-bold text-forest-green mt-1">
                    {assessment.complexity_score}/10
                  </p>
                </div>
              )}

              {assessment.total_estimated_hours && (
                <div>
                  <label className="text-sm font-medium text-charcoal-600">Estimated Hours</label>
                  <p className="text-lg font-semibold text-charcoal mt-1">
                    {assessment.total_estimated_hours}h
                  </p>
                </div>
              )}

              {assessment.estimated_total_cost && (
                <div>
                  <label className="text-sm font-medium text-charcoal-600">Estimated Cost</label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold text-green-600">
                      {assessment.estimated_total_cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Quotes */}
          {relatedQuotes.length > 0 && (
            <Card className="bg-paper-white">
              <CardHeader>
                <CardTitle className="text-forest-green">Related Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatedQuotes.map((quote: any) => (
                    <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-charcoal">
                          Quote #{quote.quote_number}
                        </div>
                        <div className="text-sm text-charcoal-600">
                          {formatDate(quote.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-forest-green">
                          ${quote.total.toFixed(2)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {quote.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quote Generation Section */}
      {/* Assessment Report */}
      {assessment.assessment_status === 'completed' && (
        <AssessmentReport
          assessment={assessment}
          property={property as any} // Type assertion for now - property structure is compatible
          showActions={true}
        />
      )}

      {/* Quote Generation */}
      {assessment.assessment_status === 'completed' && !assessment.quote_id && (
        <Card className="bg-paper-white">
          <CardHeader>
            <CardTitle className="text-forest-green">Generate Quote from Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <AssessmentToQuoteIntegration
              assessment={assessment}
              property={undefined} // We'll need to fetch the full Property object if needed
              availableItems={[]} // This would need to be fetched
              onQuoteCreated={(quoteId) => {
                // Handle quote creation success
                window.location.href = `/quotes/${quoteId}`;
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
