"use client"

/**
 * Response Chart Component
 * FB-013: Data visualization for response trends over time
 */

import { BarChart3,TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { AnalyticsLoadingState } from './analytics-loading-state';
import type { ChartDataPoint } from './types';

interface ResponseChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  title?: string;
  description?: string;
}

export function ResponseChart({
  data,
  loading = false,
  title = "Response Trends",
  description = "Survey responses over time"
}: ResponseChartProps) {
  // Calculate trend and statistics
  const chartStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        total: 0,
        average: 0,
        trend: 0,
        maxValue: 0,
        minValue: 0
      };
    }

    const total = data.reduce((sum, point) => sum + point.count, 0);
    const average = total / data.length;
    const maxValue = Math.max(...data.map(point => point.count));
    const minValue = Math.min(...data.map(point => point.count));
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, point) => sum + point.count, 0) / firstHalf.length 
      : 0;
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, point) => sum + point.count, 0) / secondHalf.length 
      : 0;
    
    const trend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    return {
      total,
      average: Math.round(average * 10) / 10,
      trend: Math.round(trend * 10) / 10,
      maxValue,
      minValue
    };
  }, [data]);

  if (loading) {
    return <AnalyticsLoadingState variant="chart" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <BarChart3 className="h-12 w-12 text-charcoal/20" />
            <div className="text-center">
              <p className="text-charcoal/70 font-medium">No data available</p>
              <p className="text-sm text-charcoal/50">Chart will appear when data is available</p>
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
              <BarChart3 className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {/* Trend Indicator */}
          <div className="flex items-center space-x-2">
            {chartStats.trend !== 0 && (
              <Badge 
                variant="outline" 
                className={`${
                  chartStats.trend > 0 
                    ? 'text-success-green border-success-green bg-success-green/5' 
                    : 'text-red-500 border-red-500 bg-red-500/5'
                }`}
              >
                {chartStats.trend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(chartStats.trend).toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-light-concrete rounded-lg">
          <div className="text-center">
            <p className="text-sm text-charcoal/70">Total</p>
            <p className="text-lg font-mono font-bold text-charcoal">
              {chartStats.total.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-charcoal/70">Average</p>
            <p className="text-lg font-mono font-bold text-charcoal">
              {chartStats.average.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-charcoal/70">Peak</p>
            <p className="text-lg font-mono font-bold text-charcoal">
              {chartStats.maxValue.toLocaleString()}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Simple Bar Chart */}
        <div className="space-y-4">
          <div className="flex items-end justify-between h-64 px-2">
            {data.map((point, index) => {
              const height = chartStats.maxValue > 0 
                ? (point.count / chartStats.maxValue) * 100 
                : 0;
              const isHighest = point.count === chartStats.maxValue;
              const isLowest = point.count === chartStats.minValue && chartStats.minValue !== chartStats.maxValue;
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                  {/* Bar */}
                  <div className="relative flex flex-col justify-end h-48 w-full max-w-8">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 hover:opacity-80 ${
                        isHighest 
                          ? 'bg-success-green' 
                          : isLowest 
                            ? 'bg-equipment-yellow' 
                            : 'bg-forest-green'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${point.count} responses on ${new Date(point.date).toLocaleDateString()}`}
                    >
                      {/* Value label on hover */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-charcoal text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {point.count}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date Label */}
                  <div className="text-xs text-charcoal/60 text-center leading-tight">
                    <div>{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-forest-green rounded-sm"></div>
              <span className="text-charcoal/70">Normal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success-green rounded-sm"></div>
              <span className="text-charcoal/70">Peak</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-equipment-yellow rounded-sm"></div>
              <span className="text-charcoal/70">Low</span>
            </div>
          </div>
          
          {/* Data Period */}
          <div className="text-center text-xs text-charcoal/60 border-t border-stone-gray/30 pt-3">
            {data.length > 0 && (
              <span>
                {new Date(data[0].date).toLocaleDateString()} - {new Date(data[data.length - 1].date).toLocaleDateString()}
                {' '}({data.length} data points)
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}