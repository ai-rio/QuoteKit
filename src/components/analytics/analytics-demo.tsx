"use client"

/**
 * Analytics Dashboard Demo Component
 * FB-013: Example implementation with mock data
 * 
 * This component demonstrates how to use the analytics dashboard
 * with sample data for testing and development purposes.
 */

import { BarChart3, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Separator } from '@/components/ui/separator';

import { AnalyticsDashboard } from './analytics-dashboard';
import type { FormbricksAnalyticsData } from './types';

// Mock data for demonstration
const generateMockData = (): FormbricksAnalyticsData => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Generate mock surveys
  const mockSurveys = [
    {
      id: 'survey-1',
      name: 'Post-Quote Creation Feedback',
      type: 'web' as const,
      status: 'inProgress' as const,
      questions: [
        {
          id: 'q1',
          type: 'rating' as const,
          headline: 'How satisfied are you with the quote creation process?',
          required: true,
          scale: { min: 1, max: 5, minLabel: 'Very Dissatisfied', maxLabel: 'Very Satisfied' }
        },
        {
          id: 'q2',
          type: 'openText' as const,
          headline: 'What could we improve about the quoting process?',
          required: false
        }
      ],
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      responseCount: 156,
      completionRate: 78.2
    },
    {
      id: 'survey-2',
      name: 'Dashboard Experience Survey',
      type: 'web' as const,
      status: 'inProgress' as const,
      questions: [
        {
          id: 'q1',
          type: 'nps' as const,
          headline: 'How likely are you to recommend QuoteKit to a colleague?',
          required: true,
          scale: { min: 0, max: 10 }
        }
      ],
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      responseCount: 89,
      completionRate: 65.4
    },
    {
      id: 'survey-3',
      name: 'Feature Request Feedback',
      type: 'link' as const,
      status: 'completed' as const,
      questions: [
        {
          id: 'q1',
          type: 'multipleChoiceMulti' as const,
          headline: 'Which features would you like to see next?',
          required: true,
          choices: ['Advanced Analytics', 'Mobile App', 'API Integration', 'Custom Branding']
        }
      ],
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      responseCount: 203,
      completionRate: 92.1
    }
  ];
  
  // Generate mock responses
  const mockResponses = [];
  
  for (let i = 0; i < 50; i++) {
    const surveyId = mockSurveys[Math.floor(Math.random() * mockSurveys.length)].id;
    const finished = Math.random() > 0.25; // 75% completion rate
    const responseDate = new Date(
      thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
    );
    
    mockResponses.push({
      id: `resp-${i + 1}`,
      surveyId,
      userId: Math.random() > 0.3 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
      createdAt: responseDate.toISOString(),
      updatedAt: responseDate.toISOString(),
      finished,
      data: {
        q1: finished ? (surveyId === 'survey-1' ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 11)) : undefined,
        q2: finished && Math.random() > 0.5 ? 'Great tool, very helpful for my business!' : undefined
      },
      meta: {
        source: 'web',
        url: 'https://app.quotekit.com/dashboard',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      tags: Math.random() > 0.7 ? ['high-value-user'] : []
    });
  }
  
  // Generate responses by period (last 30 days)
  const responsesByPeriod = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const count = Math.floor(Math.random() * 8) + 1; // 1-8 responses per day
    responsesByPeriod.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }
  
  // Calculate completion rates
  const completionRates = mockSurveys.map(survey => ({
    surveyId: survey.id,
    surveyName: survey.name,
    completionRate: survey.completionRate,
    responseCount: survey.responseCount,
    totalResponses: survey.responseCount,
    completedResponses: Math.floor(survey.responseCount * (survey.completionRate / 100))
  }));
  
  const avgCompletionRate = mockSurveys.reduce((sum, s) => sum + s.completionRate, 0) / mockSurveys.length;
  const totalResponses = mockResponses.length;
  
  // Generate top tags
  const topTags = [
    { name: 'high-value-user', count: 23, color: '#22c55e' },
    { name: 'new-user', count: 18, color: '#3b82f6' },
    { name: 'enterprise', count: 12, color: '#f59e0b' },
    { name: 'feedback', count: 8, color: '#ec4899' }
  ];
  
  return {
    surveys: mockSurveys,
    responses: mockResponses,
    totalResponses,
    completionRate: avgCompletionRate,
    averageCompletionTime: 120, // seconds
    responsesByPeriod,
    completionRates,
    topTags,
    lastUpdated: now.toISOString(),
    metrics: {
      totalSurveys: mockSurveys.length,
      totalResponses,
      completionRate: avgCompletionRate,
      averageCompletionTime: 120,
      averageCompletionRate: avgCompletionRate,
      activeSurveys: mockSurveys.filter(s => s.status === 'inProgress').length,
      responseRate: 68.5,
      topPerformingSurvey: mockSurveys.sort((a, b) => b.completionRate - a.completionRate)[0]?.name || 'N/A',
      conversionRate: 45.2
    }
  };
};;;

export function AnalyticsDemo() {
  const [mockData, setMockData] = useState<FormbricksAnalyticsData>(generateMockData());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshMockData = async () => {
    setIsRefreshing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMockData(generateMockData());
    setIsRefreshing(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <Card className="bg-gradient-to-r from-forest-green/5 to-success-green/5 border-forest-green/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-forest-green/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-forest-green" />
              </div>
              <div>
                <CardTitle className="text-xl text-charcoal">
                  Analytics Dashboard Demo
                </CardTitle>
                <CardDescription>
                  FB-013 Implementation - Interactive demo with mock Formbricks data
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-forest-green border-forest-green">
                Demo Mode
              </Badge>
              <EnhancedButton
                variant="outline"
                size="default"
                onClick={refreshMockData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </EnhancedButton>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-charcoal/70">Mock Surveys</p>
              <p className="text-lg font-bold text-charcoal">{mockData.surveys.length}</p>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-charcoal/70">Mock Responses</p>
              <p className="text-lg font-bold text-charcoal">{mockData.responses.length}</p>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-charcoal/70">Avg Completion</p>
              <p className="text-lg font-bold text-charcoal">
                {mockData.metrics?.averageCompletionRate?.toFixed(1) || '0'}%
              </p>
            </div>
          </div>
          
          <div className="text-sm text-charcoal/70">
            <p className="mb-2">
              <strong>Demo Features:</strong> This demonstrates all analytics dashboard components with realistic mock data.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Real-time metrics cards with trend calculations</li>
              <li>Interactive response charts and completion rate visualizations</li>
              <li>Advanced filtering and search capabilities</li>
              <li>Data export functionality (simulated)</li>
              <li>Mobile-responsive design and accessibility features</li>
              <li>Loading states and error handling demonstrations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        initialData={mockData}
        autoRefresh={false} // Disabled in demo mode
        refreshInterval={30000}
      />
      
      {/* Implementation Notes */}
      <Card className="border-stone-gray/30">
        <CardHeader>
          <CardTitle className="text-lg">Implementation Notes</CardTitle>
          <CardDescription>
            Key considerations for production deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-charcoal mb-2">API Integration</h4>
              <ul className="text-sm text-charcoal/70 space-y-1 list-disc list-inside">
                <li>Implement <code className="bg-stone-gray/20 px-1 rounded">/api/analytics/formbricks</code> endpoint</li>
                <li>Add proper error handling and rate limiting</li>
                <li>Configure Formbricks API credentials</li>
                <li>Implement data caching for performance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-charcoal mb-2">Production Setup</h4>
              <ul className="text-sm text-charcoal/70 space-y-1 list-disc list-inside">
                <li>Configure real Formbricks environment variables</li>
                <li>Set up data export file storage</li>
                <li>Implement user permissions and access control</li>
                <li>Add comprehensive error monitoring</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold text-charcoal mb-2">Component Usage</h4>
            <div className="bg-slate-50 border border-stone-gray/30 rounded-lg p-4">
              <pre className="text-sm text-charcoal overflow-x-auto">
{`// Import the analytics dashboard
import { AnalyticsDashboard } from '@/components/analytics';

// Use in your component
<AnalyticsDashboard
  initialData={analyticsData}
  autoRefresh={true}
  refreshInterval={30000}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}