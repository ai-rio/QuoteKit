'use client';

import { Download, FileText, Share2 } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ConditionSummary } from './ConditionSummary';
import { MediaGallery } from './MediaGallery';
import { ReportHeader } from './ReportHeader';
import { AssessmentReportProps } from './types';

export function AssessmentReport({ 
  assessment, 
  showActions = true 
}: AssessmentReportProps) {
  const reportId = `RPT-${assessment.assessment_number}`;
  const generatedAt = new Date();

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    console.log('Download PDF for assessment:', assessment.id);
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    console.log('Share assessment report:', assessment.id);
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <ReportHeader 
        assessment={assessment}
        reportId={reportId}
        generatedAt={generatedAt}
      />

      {/* Actions */}
      {showActions && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share Report
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Full Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-forest-green">Assessment Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-charcoal/70">Status</div>
              <Badge variant={assessment.assessment_status === 'completed' ? 'default' : 'secondary'}>
                {assessment.assessment_status?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-charcoal/70">Overall Condition</div>
              <div className="font-medium">
                {assessment.overall_condition?.replace('_', ' ').toUpperCase() || 'Not assessed'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-charcoal/70">Priority Level</div>
              <div className="font-medium">{assessment.priority_level}/10</div>
            </div>
          </div>

          {assessment.assessment_notes && (
            <div>
              <div className="text-sm font-medium text-charcoal/70 mb-2">Assessment Notes</div>
              <div className="text-sm bg-gray-50 p-3 rounded-lg">
                {assessment.assessment_notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Condition Summary */}
      <ConditionSummary assessment={assessment} />

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-forest-green">Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-charcoal/70">Property Address</div>
                <div>{assessment.properties?.service_address || assessment.service_address || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-charcoal/70">Property Type</div>
                <div>{assessment.properties?.property_type || assessment.property_type || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-charcoal/70">Assessor</div>
                <div>{assessment.assessor_name}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-charcoal/70">Assessment Date</div>
                <div>{new Date(assessment.assessment_date).toLocaleDateString()}</div>
              </div>
              {assessment.completed_date && (
                <div>
                  <div className="text-sm font-medium text-charcoal/70">Completed Date</div>
                  <div>{new Date(assessment.completed_date).toLocaleDateString()}</div>
                </div>
              )}
              {assessment.weather_conditions && (
                <div>
                  <div className="text-sm font-medium text-charcoal/70">Weather Conditions</div>
                  <div>{assessment.weather_conditions}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Estimates */}
      {assessment.estimated_total_cost && (
        <Card>
          <CardHeader>
            <CardTitle className="text-forest-green">Cost Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {assessment.estimated_labor_cost && (
                <div>
                  <div className="text-sm font-medium text-charcoal/70">Labor Cost</div>
                  <div className="text-lg font-semibold">${assessment.estimated_labor_cost.toLocaleString()}</div>
                </div>
              )}
              {assessment.estimated_material_cost && (
                <div>
                  <div className="text-sm font-medium text-charcoal/70">Material Cost</div>
                  <div className="text-lg font-semibold">${assessment.estimated_material_cost.toLocaleString()}</div>
                </div>
              )}
              {assessment.estimated_equipment_cost && (
                <div>
                  <div className="text-sm font-medium text-charcoal/70">Equipment Cost</div>
                  <div className="text-lg font-semibold">${assessment.estimated_equipment_cost.toLocaleString()}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-charcoal/70">Total Estimate</div>
                <div className="text-xl font-bold text-forest-green">${assessment.estimated_total_cost.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Gallery */}
      <MediaGallery assessment={assessment} />

      {/* Recommendations */}
      {assessment.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-forest-green">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm bg-blue-50 p-4 rounded-lg">
              {assessment.recommendations}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
