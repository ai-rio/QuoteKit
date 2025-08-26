import { TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { AssessmentMetrics } from './types';

interface MetricsDashboardProps {
  metrics: AssessmentMetrics;
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  return (
    <Card className="bg-gradient-to-br from-sage-50 to-sage-100 border-sage-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-forest-green">
          <TrendingUp className="h-5 w-5" />
          Assessment Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-forest-green mb-1">
              {metrics.completeness}%
            </div>
            <div className="text-sm font-medium text-gray-600">Data Completeness</div>
            <Progress 
              value={metrics.completeness} 
              className="mt-2 h-2"
            />
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-forest-green mb-1">
              {metrics.dataQuality}%
            </div>
            <div className="text-sm font-medium text-gray-600">Data Quality</div>
            <Progress 
              value={metrics.dataQuality} 
              className="mt-2 h-2"
            />
          </div>
          
          <div className="text-center">
            <Badge 
              variant="outline" 
              className={`text-sm px-3 py-1 mb-2 ${
                metrics.confidenceLevel === 'high' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : metrics.confidenceLevel === 'medium' 
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}
            >
              {metrics.confidenceLevel.toUpperCase()}
            </Badge>
            <div className="text-sm font-medium text-gray-600">Confidence Level</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-forest-green mb-1">
              {metrics.estimatedAccuracy}%
            </div>
            <div className="text-sm font-medium text-gray-600">Est. Accuracy</div>
            <Progress 
              value={metrics.estimatedAccuracy} 
              className="mt-2 h-2"
            />
          </div>
        </div>

        {/* Confidence Level Details */}
        <div className="bg-white rounded-lg p-4 border border-sage-200">
          <h4 className="font-medium text-gray-900 mb-2">Quality Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overall Score:</span>
              <span className="font-medium">
                {Math.round((metrics.completeness + metrics.dataQuality) / 2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pricing Confidence:</span>
              <Badge 
                variant="outline" 
                size="sm"
                className={
                  metrics.confidenceLevel === 'high' 
                    ? 'text-green-700 border-green-300' 
                    : metrics.confidenceLevel === 'medium' 
                    ? 'text-yellow-700 border-yellow-300'
                    : 'text-red-700 border-red-300'
                }
              >
                {metrics.confidenceLevel}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}