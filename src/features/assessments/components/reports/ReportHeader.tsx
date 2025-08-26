'use client';

import { Calendar, MapPin, User } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ReportHeaderProps } from './types';

export function ReportHeader({ 
  assessment, 
  reportId, 
  generatedAt 
}: ReportHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl text-forest-green">
              Property Assessment Report
            </CardTitle>
            <div className="text-sm text-charcoal/70 mt-1">
              Report ID: {reportId}
            </div>
          </div>
          <Badge variant="outline">
            {assessment.assessment_status?.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-charcoal/70" />
            <div>
              <div className="text-sm font-medium">Property</div>
              <div className="text-sm text-charcoal/70">
                {assessment.properties?.service_address || assessment.service_address || 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-charcoal/70" />
            <div>
              <div className="text-sm font-medium">Assessor</div>
              <div className="text-sm text-charcoal/70">
                {assessment.assessor_name}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-charcoal/70" />
            <div>
              <div className="text-sm font-medium">Assessment Date</div>
              <div className="text-sm text-charcoal/70">
                {new Date(assessment.assessment_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-charcoal/50">
            Report generated on {generatedAt.toLocaleDateString()} at {generatedAt.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
