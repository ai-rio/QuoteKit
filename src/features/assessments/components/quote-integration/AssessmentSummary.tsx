import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AssessmentMetrics } from './types';

interface AssessmentSummaryProps {
  metrics: AssessmentMetrics;
  laborHours?: number;
  estimatedTotal?: number;
}

export function AssessmentSummary({
  metrics,
  laborHours,
  estimatedTotal
}: AssessmentSummaryProps) {
  return (
    <Card className="bg-sage-50 border-sage-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-sage-700">
          Assessment Quality Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-forest-green">
              {metrics.completeness}%
            </div>
            <div className="text-sm text-gray-600">Completeness</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-forest-green">
              {metrics.dataQuality}%
            </div>
            <div className="text-sm text-gray-600">Data Quality</div>
          </div>
          <div className="text-center">
            <Badge 
              variant="outline" 
              className={`text-xs px-2 py-1 ${
                metrics.confidenceLevel === 'high' ? 'bg-green-50 text-green-700 border-green-200' :
                metrics.confidenceLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {metrics.confidenceLevel.toUpperCase()}
            </Badge>
            <div className="text-sm text-gray-600 mt-1">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-forest-green">
              {metrics.estimatedAccuracy}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
        </div>
        
        {(laborHours || estimatedTotal) && (
          <div className="mt-4 pt-4 border-t border-sage-200 grid grid-cols-2 gap-4 text-center">
            {laborHours && (
              <div>
                <div className="text-lg font-semibold text-forest-green">
                  {laborHours}h
                </div>
                <div className="text-sm text-gray-600">Est. Labor</div>
              </div>
            )}
            {estimatedTotal && (
              <div>
                <div className="text-lg font-semibold text-forest-green">
                  ${estimatedTotal.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Est. Total</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}