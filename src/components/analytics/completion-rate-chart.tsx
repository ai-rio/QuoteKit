"use client"

/**
 * Completion Rate Chart Component
 * FB-013: Visualization for survey completion rates
 */

import { CheckCircle,Target, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { AnalyticsLoadingState } from './analytics-loading-state';
import type { CompletionRateData } from './types';

interface CompletionRateChartProps {
  data: CompletionRateData[];
  loading?: boolean;
  title?: string;
  description?: string;
}

export function CompletionRateChart({
  data,
  loading = false,
  title = "Completion Rates",
  description = "Survey completion rates by survey"
}: CompletionRateChartProps) {
  // Calculate statistics
  const chartStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        averageRate: 0,
        topPerformer: null,
        totalResponses: 0,
        totalCompleted: 0
      };
    }

    const totalResponses = data.reduce((sum, item) => sum + item.totalResponses, 0);
    const totalCompleted = data.reduce((sum, item) => sum + item.completedResponses, 0);
    const averageRate = totalResponses > 0 ? (totalCompleted / totalResponses) * 100 : 0;
    
    // Find top performer
    const topPerformer = data.reduce((best, current) => {
      return current.completionRate > best.completionRate ? current : best;
    }, data[0]);
    
    return {
      averageRate: Math.round(averageRate * 10) / 10,
      topPerformer,
      totalResponses,
      totalCompleted
    };
  }, [data]);

  // Sort data by completion rate for better visualization
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.completionRate - a.completionRate);
  }, [data]);

  if (loading) {
    return <AnalyticsLoadingState variant="chart" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <Target className="h-12 w-12 text-charcoal/20" />
            <div className="text-center">
              <p className="text-charcoal/70 font-medium">No completion data available</p>
              <p className="text-sm text-charcoal/50">Chart will appear when surveys have responses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-paper-white border-stone-gray shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {/* Overall Average Badge */}
          <Badge 
            variant="outline" 
            className={`${
              chartStats.averageRate >= 70 
                ? 'text-success-green border-success-green bg-success-green/5' 
                : chartStats.averageRate >= 40 
                  ? 'text-equipment-yellow border-equipment-yellow bg-equipment-yellow/5' 
                  : 'text-red-500 border-red-500 bg-red-500/5'
            }`}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {chartStats.averageRate.toFixed(1)}% avg
          </Badge>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-light-concrete rounded-lg">
          <div className="text-center">
            <p className="text-sm text-charcoal/70">Total Responses</p>
            <p className="text-lg font-mono font-bold text-charcoal">
              {chartStats.totalResponses.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-charcoal/70">Completed</p>
            <p className="text-lg font-mono font-bold text-charcoal">
              {chartStats.totalCompleted.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-charcoal/70">Top Rate</p>
            <p className="text-lg font-mono font-bold text-charcoal">
              {chartStats.topPerformer?.completionRate.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Survey Completion Rates */}
          <div className="space-y-4">
            {sortedData.map((survey, _index) => {
              const isTopPerformer = survey === chartStats.topPerformer;
              const completionRate = survey.completionRate;
              const rateColor = completionRate >= 70 
                ? 'text-success-green' 
                : completionRate >= 40 
                  ? 'text-equipment-yellow' 
                  : 'text-red-500';
              
              return (
                <div key={survey.surveyId} className="space-y-2">
                  {/* Survey Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-charcoal line-clamp-1">
                          {survey.surveyName}
                        </h4>
                        <p className="text-xs text-charcoal/60">
                          {survey.completedResponses} of {survey.totalResponses} completed
                        </p>
                      </div>
                      {isTopPerformer && (
                        <Badge variant="outline" className="text-success-green border-success-green bg-success-green/5 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Best
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${rateColor}`}>
                        {completionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <Progress 
                      value={completionRate} 
                      className="h-2"
                      aria-label={`${survey.surveyName} completion rate: ${completionRate.toFixed(1)}%`}
                    />
                    
                    {/* Completion Rate Categories */}
                    <div className="flex justify-between text-xs text-charcoal/50">
                      <span>0%</span>
                      <span className="text-equipment-yellow">40%</span>
                      <span className="text-success-green">70%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Performance Categories */}
          <div className="border-t border-stone-gray/30 pt-4">
            <h4 className="text-sm font-medium text-charcoal mb-3">Performance Distribution</h4>
            <div className="grid grid-cols-3 gap-3">
              {/* High Performers */}
              <div className="text-center p-3 bg-success-green/5 border border-success-green/20 rounded-lg">
                <div className="text-lg font-bold text-success-green">
                  {sortedData.filter(s => s.completionRate >= 70).length}
                </div>
                <div className="text-xs text-success-green font-medium">High (70%+)</div>
              </div>
              
              {/* Medium Performers */}
              <div className="text-center p-3 bg-equipment-yellow/5 border border-equipment-yellow/20 rounded-lg">
                <div className="text-lg font-bold text-equipment-yellow">
                  {sortedData.filter(s => s.completionRate >= 40 && s.completionRate < 70).length}
                </div>
                <div className="text-xs text-equipment-yellow font-medium">Medium (40-69%)</div>
              </div>
              
              {/* Low Performers */}
              <div className="text-center p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="text-lg font-bold text-red-500">
                  {sortedData.filter(s => s.completionRate < 40).length}
                </div>
                <div className="text-xs text-red-500 font-medium">Low (&lt;40%)</div>
              </div>
            </div>
          </div>
          
          {/* Insights */}
          {chartStats.topPerformer && (
            <div className="bg-light-concrete rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-success-green mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-charcoal">
                    Top Performing Survey
                  </h4>
                  <p className="text-sm text-charcoal/70 mt-1">
                    <span className="font-medium">{chartStats.topPerformer.surveyName}</span> has the highest completion rate at{' '}
                    <span className="font-bold text-success-green">
                      {chartStats.topPerformer.completionRate.toFixed(1)}%
                    </span>
                    {' '}with {chartStats.topPerformer.completedResponses} completed responses.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}