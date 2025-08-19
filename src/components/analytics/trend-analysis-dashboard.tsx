"use client"

/**
 * FB-021: Trend Analysis Dashboard Component
 * 
 * Provides comprehensive trend visualization including:
 * - Time-series charts for responses and completion rates
 * - Trend analysis with statistical insights
 * - Automated insight generation and recommendations
 * - Interactive filtering and time period selection
 */

import { AlertTriangle, BarChart3, Calendar, Lightbulb, Target,TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useEffect,useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TimeSeriesData, 
  TrendAnalysis, 
  TrendAnalysisService, 
  TrendDataPoint, 
  TrendInsight} from '@/libs/formbricks/trend-analysis-service';
import { FormbricksSurvey,FormbricksSurveyResponse } from '@/libs/formbricks/types';

interface TrendAnalysisDashboardProps {
  responses: FormbricksSurveyResponse[];
  surveys: FormbricksSurvey[];
  className?: string;
}

export function TrendAnalysisDashboard({ 
  responses, 
  surveys, 
  className 
}: TrendAnalysisDashboardProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedMetric, setSelectedMetric] = useState<'responses' | 'completion'>('responses');
  const [loading, setLoading] = useState(true);
  
  // Trend analysis data
  const [trendData, setTrendData] = useState<{
    responsesTrend: TimeSeriesData;
    completionTrend: TimeSeriesData;
    surveyPerformanceTrend: Array<{
      surveyId: string;
      surveyName: string;
      trend: TrendAnalysis;
      data: TrendDataPoint[];
    }>;
    insights: TrendInsight[];
  } | null>(null);

  const trendService = useMemo(() => new TrendAnalysisService(), []);

  // Load trend analysis data
  useEffect(() => {
    const loadTrendData = async () => {
      setLoading(true);
      try {
        const analysis = await trendService.analyzeTrends(responses, surveys, timeframe);
        setTrendData(analysis);
      } catch (error) {
        console.error('Error loading trend analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    if (responses.length > 0) {
      loadTrendData();
    }
  }, [responses, surveys, timeframe, trendService]);

  // Chart configuration for shadcn/ui charts
  const chartConfig = {
    responses: {
      label: "Responses",
      color: "hsl(var(--forest-green))",
    },
    completion: {
      label: "Completion Rate",
      color: "hsl(var(--equipment-yellow))",
    },
  };

  // Get current trend data based on selected metric and timeframe
  const currentTrendData = useMemo(() => {
    if (!trendData) return [];
    
    const data = selectedMetric === 'responses' 
      ? trendData.responsesTrend[timeframe]
      : trendData.completionTrend[timeframe];
    
    return data.map(point => ({
      ...point,
      displayDate: formatDateForDisplay(point.date, timeframe)
    }));
  }, [trendData, selectedMetric, timeframe]);

  // Calculate overall trend analysis
  const overallTrend = useMemo(() => {
    if (!trendData || currentTrendData.length === 0) return null;
    
    return trendService.calculateTrend ? 
      trendService.calculateTrend(currentTrendData) : null;
  }, [currentTrendData, trendService]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-stone-gray/20 rounded w-3/4"></div>
                <div className="h-3 bg-stone-gray/20 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-stone-gray/20 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-stone-gray/20 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trendData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-lg text-charcoal">No trend data available</p>
          <p className="text-sm text-stone-gray">Add more survey responses to see trend analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-forest-green">Trend Analysis</h1>
          <p className="text-lg text-charcoal mt-2">
            Comprehensive trend insights and statistical analysis
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedMetric} onValueChange={(value: 'responses' | 'completion') => setSelectedMetric(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="responses">Response Volume</SelectItem>
              <SelectItem value="completion">Completion Rate</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeframe} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trend Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Trend
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overallTrend ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {overallTrend.trend === 'increasing' ? (
                    <TrendingUp className="h-4 w-4 text-forest-green" />
                  ) : overallTrend.trend === 'decreasing' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-stone-gray" />
                  )}
                  <span className="font-mono font-medium text-forest-green capitalize">
                    {overallTrend.trend}
                  </span>
                  <Badge variant={overallTrend.strength === 'strong' ? 'default' : 'secondary'}>
                    {overallTrend.strength}
                  </Badge>
                </div>
                <div className="text-sm text-charcoal">
                  <p>Confidence: <span className="font-mono font-medium text-forest-green">{overallTrend.confidence}%</span></p>
                  <p>Correlation: <span className="font-mono font-medium text-forest-green">{overallTrend.correlation}</span></p>
                </div>
                {overallTrend.seasonality?.detected && (
                  <div className="text-sm text-charcoal">
                    <p>Seasonality detected (period: {overallTrend.seasonality.period})</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-lg text-charcoal">Insufficient data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <Target className="h-5 w-5" />
              Current Value
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Latest {selectedMetric === 'responses' ? 'response count' : 'completion rate'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentTrendData.length > 0 ? (
              <div className="space-y-2">
                <div className="text-3xl font-mono font-medium text-forest-green">
                  {selectedMetric === 'responses' 
                    ? currentTrendData[currentTrendData.length - 1].value
                    : `${currentTrendData[currentTrendData.length - 1].value}%`
                  }
                </div>
                {currentTrendData[currentTrendData.length - 1].changePercent !== undefined && (
                  <div className={`text-sm flex items-center gap-1 ${
                    currentTrendData[currentTrendData.length - 1].changePercent! > 0 
                      ? 'text-forest-green' 
                      : 'text-red-500'
                  }`}>
                    {currentTrendData[currentTrendData.length - 1].changePercent! > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-mono">
                      {Math.abs(currentTrendData[currentTrendData.length - 1].changePercent!).toFixed(1)}%
                    </span>
                    <span>vs previous period</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-lg text-charcoal">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Active Insights
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Automated recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-mono font-medium text-forest-green">
                {trendData.insights.length}
              </div>
              <div className="text-sm text-charcoal">
                {trendData.insights.filter(i => i.actionable).length} actionable insights
              </div>
              <div className="flex gap-1">
                {trendData.insights.slice(0, 3).map(insight => (
                  <Badge 
                    key={insight.id} 
                    variant={insight.type === 'warning' ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {insight.type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            {selectedMetric === 'responses' ? 'Response Volume' : 'Completion Rate'} Trend
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} trend visualization with statistical analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simple Trend Visualization */}
          <div className="space-y-4">
            <div className="flex items-end justify-between h-64 px-2">
              {currentTrendData.slice(-20).map((point, index) => {
                const maxValue = Math.max(...currentTrendData.map(p => p.value));
                const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                    <div className="relative flex flex-col justify-end h-48 w-full max-w-8">
                      <div
                        className="w-full rounded-t-sm bg-forest-green transition-all duration-300 hover:opacity-80"
                        style={{ height: `${height}%` }}
                        title={`${point.value}${selectedMetric === 'completion' ? '%' : ''} on ${point.displayDate}`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                          <div className="bg-charcoal text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {point.value}{selectedMetric === 'completion' ? '%' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-charcoal/60 text-center leading-tight">
                      <div>{point.displayDate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Insights & Recommendations</TabsTrigger>
          <TabsTrigger value="surveys">Survey Performance</TabsTrigger>
          <TabsTrigger value="statistics">Statistical Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {trendData.insights.length > 0 ? (
              trendData.insights.map(insight => (
                <Card key={insight.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {insight.type === 'opportunity' && <Lightbulb className="h-4 w-4 text-forest-green" />}
                        {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                        {insight.type === 'anomaly' && <BarChart3 className="h-4 w-4 text-orange-500" />}
                        <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
                          {insight.title}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-lg text-charcoal">
                      {insight.description}
                    </CardDescription>
                  </CardHeader>
                  {insight.recommendations && (
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-forest-green">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-lg text-charcoal">
                          {insight.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-lg text-charcoal">No insights available yet</p>
                  <p className="text-sm text-stone-gray">More data is needed to generate meaningful insights</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <div className="grid gap-4">
            {trendData.surveyPerformanceTrend.map(survey => (
              <Card key={survey.surveyId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
                      {survey.surveyName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {survey.trend.trend === 'increasing' ? (
                        <TrendingUp className="h-4 w-4 text-forest-green" />
                      ) : survey.trend.trend === 'decreasing' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <BarChart3 className="h-4 w-4 text-stone-gray" />
                      )}
                      <Badge variant={survey.trend.strength === 'strong' ? 'default' : 'secondary'}>
                        {survey.trend.trend} ({survey.trend.strength})
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-lg text-charcoal">
                    Confidence: {survey.trend.confidence}% | Correlation: {survey.trend.correlation}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Simple Line Chart */}
                  <div className="space-y-4">
                    <div className="flex items-end justify-between h-48 px-2">
                      {survey.data.slice(-10).map((point, index) => {
                        const maxValue = Math.max(...survey.data.map(p => p.value));
                        const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
                        
                        return (
                          <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                            <div className="relative flex flex-col justify-end h-40 w-full max-w-6">
                              <div
                                className="w-full rounded-t-sm bg-forest-green transition-all duration-300 hover:opacity-80"
                                style={{ height: `${height}%` }}
                                title={`${point.value} on ${formatDateForDisplay(point.date, timeframe)}`}
                              >
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                                  <div className="bg-charcoal text-white text-xs px-1 py-0.5 rounded">
                                    {point.value}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-charcoal/60 text-center">
                              {formatDateForDisplay(point.date, timeframe)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">Response Statistics</CardTitle>
                <CardDescription className="text-lg text-charcoal">
                  Statistical analysis of response trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {overallTrend && (
                  <div className="grid grid-cols-2 gap-4 text-lg">
                    <div>
                      <p className="text-charcoal">Slope:</p>
                      <p className="font-mono font-medium text-forest-green">{overallTrend.slope}</p>
                    </div>
                    <div>
                      <p className="text-charcoal">R-value:</p>
                      <p className="font-mono font-medium text-forest-green">{overallTrend.correlation}</p>
                    </div>
                    <div>
                      <p className="text-charcoal">Confidence:</p>
                      <p className="font-mono font-medium text-forest-green">{overallTrend.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-charcoal">Strength:</p>
                      <p className="font-mono font-medium text-forest-green">{overallTrend.strength}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">Data Summary</CardTitle>
                <CardDescription className="text-lg text-charcoal">
                  Overview of trend analysis data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div>
                    <p className="text-charcoal">Data Points:</p>
                    <p className="font-mono font-medium text-forest-green">{currentTrendData.length}</p>
                  </div>
                  <div>
                    <p className="text-charcoal">Time Range:</p>
                    <p className="font-mono font-medium text-forest-green">{timeframe}</p>
                  </div>
                  <div>
                    <p className="text-charcoal">Total Surveys:</p>
                    <p className="font-mono font-medium text-forest-green">{surveys.length}</p>
                  </div>
                  <div>
                    <p className="text-charcoal">Total Responses:</p>
                    <p className="font-mono font-medium text-forest-green">{responses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Format date for display based on timeframe
 */
function formatDateForDisplay(date: string, timeframe: 'daily' | 'weekly' | 'monthly'): string {
  const dateObj = new Date(date);
  
  switch (timeframe) {
    case 'daily':
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'weekly':
      return `Week ${date.split('-W')[1]}`;
    case 'monthly':
      return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    default:
      return date;
  }
}
