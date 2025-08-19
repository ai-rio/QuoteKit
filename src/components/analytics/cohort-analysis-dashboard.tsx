"use client"

/**
 * FB-021: Cohort Analysis Dashboard Component
 * 
 * Provides comprehensive cohort analysis including:
 * - User cohort tracking and retention analysis
 * - Completion rate trends by cohort
 * - Cohort comparison and performance metrics
 * - Interactive cohort visualization
 */

import { BarChart3,Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { useEffect,useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CohortData, 
  TrendAnalysisService} from '@/libs/formbricks/trend-analysis-service';
import { FormbricksSurveyResponse } from '@/libs/formbricks/types';

interface CohortAnalysisDashboardProps {
  responses: FormbricksSurveyResponse[];
  className?: string;
}

export function CohortAnalysisDashboard({ 
  responses, 
  className 
}: CohortAnalysisDashboardProps) {
  const [cohortType, setCohortType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cohort analysis data
  const [cohortData, setCohortData] = useState<CohortData[]>([]);

  const trendService = useMemo(() => new TrendAnalysisService(), []);

  // Load cohort analysis data
  useEffect(() => {
    const loadCohortData = async () => {
      setLoading(true);
      try {
        const cohorts = await trendService.analyzeCohorts(responses, cohortType);
        setCohortData(cohorts);
        if (cohorts.length > 0 && !selectedCohort) {
          setSelectedCohort(cohorts[0].cohortId);
        }
      } catch (error) {
        console.error('Error loading cohort analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    if (responses.length > 0) {
      loadCohortData();
    }
  }, [responses, cohortType, trendService]);

  // Chart configuration
  const chartConfig = {
    retention: {
      label: "Retention Rate",
      color: "hsl(var(--forest-green))",
    },
    completion: {
      label: "Completion Rate",
      color: "hsl(var(--equipment-yellow))",
    },
    responseTime: {
      label: "Avg Response Time",
      color: "hsl(var(--blue-500))",
    },
  };

  // Get selected cohort data
  const selectedCohortData = useMemo(() => {
    return cohortData.find(cohort => cohort.cohortId === selectedCohort);
  }, [cohortData, selectedCohort]);

  // Prepare retention heatmap data
  const retentionHeatmapData = useMemo(() => {
    return cohortData.map(cohort => ({
      cohortName: cohort.cohortName,
      cohortId: cohort.cohortId,
      userCount: cohort.userCount,
      periods: cohort.retentionRates.map((rate, index) => ({
        period: index,
        rate: rate,
        color: getHeatmapColor(rate)
      }))
    }));
  }, [cohortData]);

  // Prepare cohort comparison data
  const cohortComparisonData = useMemo(() => {
    return cohortData.map(cohort => ({
      cohortName: cohort.cohortName,
      userCount: cohort.userCount,
      avgRetention: cohort.retentionRates.length > 0 
        ? cohort.retentionRates.reduce((a, b) => a + b, 0) / cohort.retentionRates.length 
        : 0,
      avgCompletion: cohort.completionRates.length > 0 
        ? cohort.completionRates.reduce((a, b) => a + b, 0) / cohort.completionRates.length 
        : 0,
      avgResponseTime: cohort.avgResponseTime.length > 0 
        ? cohort.avgResponseTime.reduce((a, b) => a + b, 0) / cohort.avgResponseTime.length 
        : 0,
    }));
  }, [cohortData]);

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
      </div>
    );
  }

  if (cohortData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-lg text-charcoal">No cohort data available</p>
          <p className="text-sm text-stone-gray">Add more survey responses to see cohort analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-forest-green">Cohort Analysis</h1>
          <p className="text-lg text-charcoal mt-2">
            User retention and engagement analysis by cohort
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={cohortType} onValueChange={(value: 'weekly' | 'monthly') => setCohortType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCohort || ''} onValueChange={setSelectedCohort}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select cohort" />
            </SelectTrigger>
            <SelectContent>
              {cohortData.map(cohort => (
                <SelectItem key={cohort.cohortId} value={cohort.cohortId}>
                  {cohort.cohortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cohort Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Cohorts
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Active user cohorts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-medium text-forest-green">
              {cohortData.length}
            </div>
            <div className="text-sm text-charcoal mt-1">
              {cohortType} cohorts tracked
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Total Users
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Across all cohorts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-medium text-forest-green">
              {cohortData.reduce((sum, cohort) => sum + cohort.userCount, 0)}
            </div>
            <div className="text-sm text-charcoal mt-1">
              Unique users tracked
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Avg Retention
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Overall retention rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-medium text-forest-green">
              {cohortComparisonData.length > 0 
                ? Math.round(cohortComparisonData.reduce((sum, cohort) => sum + cohort.avgRetention, 0) / cohortComparisonData.length)
                : 0
              }%
            </div>
            <div className="text-sm text-charcoal mt-1">
              Average across cohorts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Avg Response Time
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Time to complete surveys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-medium text-forest-green">
              {cohortComparisonData.length > 0 
                ? Math.round(cohortComparisonData.reduce((sum, cohort) => sum + cohort.avgResponseTime, 0) / cohortComparisonData.length)
                : 0
              }s
            </div>
            <div className="text-sm text-charcoal mt-1">
              Average completion time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="retention" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="retention">Retention Heatmap</TabsTrigger>
          <TabsTrigger value="trends">Cohort Trends</TabsTrigger>
          <TabsTrigger value="comparison">Cohort Comparison</TabsTrigger>
          <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
                Retention Rate Heatmap
              </CardTitle>
              <CardDescription className="text-lg text-charcoal">
                User retention rates by cohort and time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Heatmap Header */}
                <div className="grid grid-cols-[200px_repeat(10,1fr)] gap-1 text-sm">
                  <div className="font-bold text-forest-green">Cohort</div>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="text-center font-bold text-forest-green">
                      P{i}
                    </div>
                  ))}
                </div>
                
                {/* Heatmap Rows */}
                {retentionHeatmapData.map(cohort => (
                  <div key={cohort.cohortId} className="grid grid-cols-[200px_repeat(10,1fr)] gap-1">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-charcoal">{cohort.cohortName}</div>
                        <div className="text-sm text-stone-gray">{cohort.userCount} users</div>
                      </div>
                    </div>
                    {Array.from({ length: 10 }, (_, i) => {
                      const period = cohort.periods[i];
                      return (
                        <div
                          key={i}
                          className="h-12 rounded flex items-center justify-center text-sm font-mono font-medium"
                          style={{
                            backgroundColor: period ? period.color : '#f3f4f6',
                            color: period && period.rate > 50 ? 'white' : '#374151'
                          }}
                        >
                          {period ? `${Math.round(period.rate)}%` : '-'}
                        </div>
                      );
                    })}
                  </div>
                ))}
                
                {/* Legend */}
                <div className="flex items-center gap-4 mt-6">
                  <span className="text-sm font-medium text-charcoal">Retention Rate:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatmapColor(0) }}></div>
                    <span className="text-sm text-charcoal">0%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatmapColor(50) }}></div>
                    <span className="text-sm text-charcoal">50%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatmapColor(100) }}></div>
                    <span className="text-sm text-charcoal">100%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {selectedCohortData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
                  {selectedCohortData.cohortName} - Trend Analysis
                </CardTitle>
                <CardDescription className="text-lg text-charcoal">
                  Retention and completion trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Simple Trend Chart */}
                <div className="space-y-4">
                  <div className="flex items-end justify-between h-64 px-2">
                    {selectedCohortData.retentionRates.slice(0, 10).map((rate, index) => {
                      const maxRate = Math.max(...selectedCohortData.retentionRates.slice(0, 10));
                      const height = maxRate > 0 ? (rate / maxRate) * 100 : 0;
                      const completionRate = selectedCohortData.completionRates[index] || 0;
                      
                      return (
                        <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                          <div className="relative flex flex-col justify-end h-48 w-full max-w-8">
                            <div
                              className="w-full rounded-t-sm bg-forest-green transition-all duration-300 hover:opacity-80"
                              style={{ height: `${height}%` }}
                              title={`P${index}: ${rate.toFixed(1)}% retention, ${completionRate.toFixed(1)}% completion`}
                            >
                              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                                <div className="bg-charcoal text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  <div>Retention: {rate.toFixed(1)}%</div>
                                  <div>Completion: {completionRate.toFixed(1)}%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-charcoal/60 text-center">
                            P{index}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
                Cohort Performance Comparison
              </CardTitle>
              <CardDescription className="text-lg text-charcoal">
                Compare key metrics across all cohorts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple Bar Chart */}
              <div className="space-y-4">
                <div className="flex items-end justify-between h-64 px-2">
                  {cohortComparisonData.slice(0, 8).map((cohort, index) => {
                    const maxRetention = Math.max(...cohortComparisonData.map(c => c.avgRetention));
                    const retentionHeight = maxRetention > 0 ? (cohort.avgRetention / maxRetention) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                        <div className="relative flex flex-col justify-end h-48 w-full max-w-12">
                          <div
                            className="w-full rounded-t-sm bg-forest-green transition-all duration-300 hover:opacity-80"
                            style={{ height: `${retentionHeight}%` }}
                            title={`${cohort.cohortName}: ${cohort.avgRetention.toFixed(1)}% retention, ${cohort.avgCompletion.toFixed(1)}% completion`}
                          >
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                              <div className="bg-charcoal text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                <div>{cohort.cohortName}</div>
                                <div>Retention: {cohort.avgRetention.toFixed(1)}%</div>
                                <div>Completion: {cohort.avgCompletion.toFixed(1)}%</div>
                                <div>Users: {cohort.userCount}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-charcoal/60 text-center leading-tight">
                          <div>{cohort.cohortName.split(' ')[0]}</div>
                          <div>{cohort.cohortName.split(' ')[1]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            {cohortData.map(cohort => (
              <Card key={cohort.cohortId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
                      {cohort.cohortName}
                    </CardTitle>
                    <Badge variant="outline">
                      {cohort.userCount} users
                    </Badge>
                  </div>
                  <CardDescription className="text-lg text-charcoal">
                    Started: {new Date(cohort.startDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-lg font-bold text-forest-green mb-2">Retention Rates</h4>
                      <div className="space-y-1">
                        {cohort.retentionRates.slice(0, 5).map((rate, index) => (
                          <div key={index} className="flex justify-between text-lg">
                            <span className="text-charcoal">P{index}:</span>
                            <span className="font-mono font-medium text-forest-green">{rate.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-bold text-forest-green mb-2">Completion Rates</h4>
                      <div className="space-y-1">
                        {cohort.completionRates.slice(0, 5).map((rate, index) => (
                          <div key={index} className="flex justify-between text-lg">
                            <span className="text-charcoal">P{index}:</span>
                            <span className="font-mono font-medium text-forest-green">{rate.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-bold text-forest-green mb-2">Response Times</h4>
                      <div className="space-y-1">
                        {cohort.avgResponseTime.slice(0, 5).map((time, index) => (
                          <div key={index} className="flex justify-between text-lg">
                            <span className="text-charcoal">P{index}:</span>
                            <span className="font-mono font-medium text-forest-green">{time.toFixed(0)}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Get heatmap color based on retention rate
 */
function getHeatmapColor(rate: number): string {
  if (rate >= 80) return '#059669'; // green-600
  if (rate >= 60) return '#10b981'; // green-500
  if (rate >= 40) return '#fbbf24'; // yellow-400
  if (rate >= 20) return '#f59e0b'; // yellow-500
  if (rate > 0) return '#ef4444';   // red-500
  return '#e5e7eb';                 // gray-200
}
