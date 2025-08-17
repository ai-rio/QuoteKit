/**
 * Complexity Analysis Display Component
 * Shows real-time complexity analysis during quote creation
 */

'use client';

import { AlertCircle, BarChart3, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ComplexityAnalysis } from '@/libs/complexity/types';

interface ComplexityAnalysisDisplayProps {
  analysis: ComplexityAnalysis | null;
  isLoading?: boolean;
  showDetails?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

export function ComplexityAnalysisDisplay({
  analysis,
  isLoading = false,
  showDetails = true,
  showRecommendations = true,
  className = '',
}: ComplexityAnalysisDisplayProps) {
  const complexityConfig = useMemo(() => {
    if (!analysis) return null;

    const { level, score } = analysis;
    
    switch (level) {
      case 'simple':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          description: 'Straightforward quote with standard pricing',
        };
      case 'medium':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: BarChart3,
          description: 'Moderately complex quote with multiple factors',
        };
      case 'complex':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: TrendingUp,
          description: 'Sophisticated quote requiring careful attention',
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: Info,
          description: 'Analysis in progress',
        };
    }
  }, [analysis]);

  if (isLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || !complexityConfig) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Add items to see complexity analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = complexityConfig.icon;
  const highImpactInsights = analysis.insights.filter(insight => insight.impact === 'high');

  return (
    <TooltipProvider>
      <Card className={`${className} ${complexityConfig.borderColor} ${complexityConfig.bgColor}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className={`h-5 w-5 ${complexityConfig.textColor}`} />
              <span className="text-base font-semibold">Quote Complexity</span>
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant="secondary" 
                    className={`${complexityConfig.color} text-white hover:${complexityConfig.color}/90`}
                  >
                    {analysis.level.toUpperCase()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{complexityConfig.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{analysis.score.toFixed(1)}/100</div>
              <div className="text-xs text-gray-500">
                {(analysis.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress 
              value={analysis.score} 
              className="h-2"
              style={{
                '--progress-foreground': complexityConfig.color.replace('bg-', ''),
              } as any}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Simple (0-30)</span>
              <span>Medium (31-65)</span>
              <span>Complex (66-100)</span>
            </div>
          </div>

          {/* Key factors */}
          {showDetails && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Key Factors</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium">{analysis.factors.itemCount.value}</span>
                </div>
                <div className="flex justify-between">
                  <span>Value:</span>
                  <span className="font-medium">${analysis.factors.totalValue.value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Types:</span>
                  <span className="font-medium">{analysis.factors.uniqueItemTypes.value}</span>
                </div>
                <div className="flex justify-between">
                  <span>Custom:</span>
                  <span className="font-medium">{analysis.factors.customItems.value.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* High impact insights */}
          {showDetails && highImpactInsights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Key Insights</h4>
              <div className="space-y-1">
                {highImpactInsights.slice(0, 2).map((insight, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    <div className="flex items-start space-x-1">
                      <AlertCircle className="h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
                      <span>{insight.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {showRecommendations && analysis.insights.some(insight => insight.recommendation) && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs">
                <strong>Tip:</strong> {' '}
                {analysis.insights.find(insight => insight.recommendation)?.recommendation}
              </AlertDescription>
            </Alert>
          )}

          {/* Reasoning (collapsible or tooltip) */}
          {showDetails && analysis.reasoning.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-xs text-gray-500 hover:text-gray-700 underline">
                  View detailed analysis
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm">
                <div className="space-y-1">
                  {analysis.reasoning.map((reason, index) => (
                    <p key={index} className="text-xs">{reason}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

/**
 * Compact version for use in tables or small spaces
 */
export function ComplexityBadge({ 
  analysis, 
  showScore = false 
}: { 
  analysis: ComplexityAnalysis | null; 
  showScore?: boolean;
}) {
  if (!analysis) {
    return <Badge variant="outline">Unknown</Badge>;
  }

  const config = {
    simple: { color: 'bg-green-500', text: 'Simple' },
    medium: { color: 'bg-yellow-500', text: 'Medium' },
    complex: { color: 'bg-red-500', text: 'Complex' },
  };

  const { color, text } = config[analysis.level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${color} text-white hover:${color}/90`}>
            {text}
            {showScore && ` (${analysis.score.toFixed(0)})`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Complexity: {analysis.level}</p>
            <p>Score: {analysis.score.toFixed(1)}/100</p>
            <p>Confidence: {(analysis.confidence * 100).toFixed(0)}%</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}