"use client"

/**
 * FB-021: Trend Analysis Page Content
 * 
 * Client component that handles data fetching and state management
 * for the trend analysis dashboard.
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CohortAnalysisDashboard } from '@/components/analytics/cohort-analysis-dashboard';
import { TrendAnalysisDashboard } from '@/components/analytics/trend-analysis-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formbricksAnalyticsService } from '@/libs/formbricks/analytics-service';
import { FormbricksSurvey,FormbricksSurveyResponse } from '@/libs/formbricks/types';

export function TrendAnalysisPageContent() {
  const [responses, setResponses] = useState<FormbricksSurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<FormbricksSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch surveys and responses
      const [surveysData, responsesData] = await Promise.all([
        formbricksAnalyticsService.fetchSurveys(),
        formbricksAnalyticsService.fetchSurveyResponses({ limit: 10000 }) // Get all responses for analysis
      ]);

      setSurveys(surveysData);
      setResponses(responsesData.responses);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading trend analysis data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Loading Trend Analysis
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Unable to load trend analysis data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-charcoal">{error}</p>
          <EnhancedButton 
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </EnhancedButton>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!loading && responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            No Survey Data Available
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Trend analysis requires survey response data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-charcoal">
            To see trend analysis, you need survey responses from your Formbricks integration.
          </p>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-forest-green">Next Steps:</h4>
            <ul className="list-disc list-inside space-y-1 text-lg text-charcoal">
              <li>Ensure your Formbricks integration is active</li>
              <li>Create and publish surveys to collect responses</li>
              <li>Wait for users to complete surveys</li>
              <li>Return here to view trend analysis</li>
            </ul>
          </div>
          <EnhancedButton 
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Check Again
          </EnhancedButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-forest-green">Advanced Analytics</h1>
          <p className="text-lg text-charcoal mt-2">
            Comprehensive trend analysis and cohort tracking
          </p>
          {lastUpdated && (
            <p className="text-sm text-stone-gray mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        
        <EnhancedButton 
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </EnhancedButton>
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
              Survey Responses
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Total responses for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-medium text-forest-green">
              {loading ? '...' : responses.length.toLocaleString()}
            </div>
            <div className="text-sm text-charcoal mt-1">
              Across {loading ? '...' : surveys.length} surveys
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
              Completed Responses
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Finished survey responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-medium text-forest-green">
              {loading ? '...' : responses.filter(r => r.finished).length.toLocaleString()}
            </div>
            <div className="text-sm text-charcoal mt-1">
              {loading ? '...' : Math.round((responses.filter(r => r.finished).length / Math.max(responses.length, 1)) * 100)}% completion rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
              Date Range
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Analysis time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-lg text-charcoal">Loading...</div>
            ) : responses.length > 0 ? (
              <div className="space-y-1">
                <div className="text-lg font-mono font-medium text-forest-green">
                  {Math.ceil((new Date(Math.max(...responses.map(r => new Date(r.createdAt).getTime()))).getTime() - 
                             new Date(Math.min(...responses.map(r => new Date(r.createdAt).getTime()))).getTime()) / 
                             (1000 * 60 * 60 * 24))} days
                </div>
                <div className="text-sm text-charcoal">
                  {new Date(Math.min(...responses.map(r => new Date(r.createdAt).getTime()))).toLocaleDateString()} - {' '}
                  {new Date(Math.max(...responses.map(r => new Date(r.createdAt).getTime()))).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-lg text-charcoal">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-forest-green" />
                    <span className="text-lg text-charcoal">Loading trend analysis...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <TrendAnalysisDashboard 
              responses={responses}
              surveys={surveys}
            />
          )}
        </TabsContent>

        <TabsContent value="cohorts">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-forest-green" />
                    <span className="text-lg text-charcoal">Loading cohort analysis...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CohortAnalysisDashboard 
              responses={responses}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
