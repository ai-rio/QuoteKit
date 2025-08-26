'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { ConditionSummaryProps } from './types';

export function ConditionSummary({ assessment }: ConditionSummaryProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
      case 'pristine':
        return 'bg-green-500';
      case 'good':
      case 'healthy':
        return 'bg-blue-500';
      case 'fair':
      case 'patchy':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-orange-500';
      case 'critical':
      case 'dead':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConditionScore = (condition: string) => {
    switch (condition) {
      case 'excellent':
      case 'pristine':
        return 100;
      case 'good':
      case 'healthy':
        return 80;
      case 'fair':
      case 'patchy':
        return 60;
      case 'poor':
        return 40;
      case 'critical':
      case 'dead':
        return 20;
      default:
        return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-forest-green">Condition Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Condition */}
        {assessment.overall_condition && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Condition</span>
              <Badge className={getConditionColor(assessment.overall_condition)}>
                {assessment.overall_condition.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <Progress 
              value={getConditionScore(assessment.overall_condition)} 
              className="h-2"
            />
          </div>
        )}

        {/* Lawn Condition */}
        {assessment.lawn_condition && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Lawn Condition</span>
              <Badge className={getConditionColor(assessment.lawn_condition)}>
                {assessment.lawn_condition.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <Progress 
              value={getConditionScore(assessment.lawn_condition)} 
              className="h-2"
            />
          </div>
        )}

        {/* Soil Condition */}
        {assessment.soil_condition && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Soil Condition</span>
              <Badge className={getConditionColor(assessment.soil_condition)}>
                {assessment.soil_condition.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <Progress 
              value={getConditionScore(assessment.soil_condition)} 
              className="h-2"
            />
          </div>
        )}

        {/* Measurements Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          {assessment.lawn_area_measured && (
            <div>
              <div className="text-sm font-medium text-charcoal/70">Lawn Area</div>
              <div className="text-lg font-semibold">{assessment.lawn_area_measured.toLocaleString()} sq ft</div>
            </div>
          )}
          
          {assessment.tree_count > 0 && (
            <div>
              <div className="text-sm font-medium text-charcoal/70">Trees</div>
              <div className="text-lg font-semibold">{assessment.tree_count}</div>
            </div>
          )}
          
          {assessment.shrub_count > 0 && (
            <div>
              <div className="text-sm font-medium text-charcoal/70">Shrubs</div>
              <div className="text-lg font-semibold">{assessment.shrub_count}</div>
            </div>
          )}
          
          {assessment.complexity_score && (
            <div>
              <div className="text-sm font-medium text-charcoal/70">Complexity</div>
              <div className="text-lg font-semibold">{assessment.complexity_score}/10</div>
            </div>
          )}
        </div>

        {/* Issues and Challenges */}
        {(assessment.weed_coverage_percent || assessment.bare_spots_count || assessment.erosion_issues) && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Issues Identified</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {assessment.weed_coverage_percent && assessment.weed_coverage_percent > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800">Weed Coverage</div>
                  <div className="text-lg font-semibold text-yellow-900">{assessment.weed_coverage_percent}%</div>
                </div>
              )}
              
              {assessment.bare_spots_count > 0 && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-orange-800">Bare Spots</div>
                  <div className="text-lg font-semibold text-orange-900">{assessment.bare_spots_count}</div>
                </div>
              )}
              
              {assessment.erosion_issues && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-red-800">Erosion Issues</div>
                  <div className="text-sm text-red-900">Present</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
