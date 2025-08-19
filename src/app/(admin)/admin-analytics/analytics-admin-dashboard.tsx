'use client';

import { 
  Activity,
  ArrowRight,
  BarChart3, 
  Lightbulb, 
  Settings, 
  Target,
  TrendingUp, 
  Users} from 'lucide-react';
import Link from 'next/link';
import { useEffect,useState } from 'react';

import { CohortAnalysisDashboard } from '@/components/analytics/cohort-analysis-dashboard';
// Import our existing analytics components
import { TrendAnalysisDashboard } from '@/components/analytics/trend-analysis-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formbricksAnalyticsService } from '@/libs/formbricks/analytics-service';
import { trendAnalysisService } from '@/libs/formbricks/trend-analysis-service';
import { FormbricksSurvey,FormbricksSurveyResponse } from '@/libs/formbricks/types';

export function AnalyticsAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    surveys: FormbricksSurvey[];
    responses: FormbricksSurveyResponse[];
    totalResponses: number;
    completionRate: number;
    activeSurveys: number;
    segments: number;
    insights: number;
  } | null>(null);

  // Load real analytics data on component mount
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [surveysData, responsesData] = await Promise.all([
          formbricksAnalyticsService.fetchSurveys(),
          formbricksAnalyticsService.fetchSurveyResponses({ limit: 10000 })
        ]);

        const activeSurveysCount = surveysData.filter(s => s.status === 'inProgress').length;
        const completionRateCalc = responsesData.responses.length > 0 
          ? (responsesData.responses.filter(r => r.finished).length / responsesData.responses.length) * 100
          : 0;

        setAnalyticsData({
          surveys: surveysData,
          responses: responsesData.responses,
          totalResponses: responsesData.responses.length,
          completionRate: Math.round(completionRateCalc),
          activeSurveys: activeSurveysCount,
          segments: 24, // Mock value for now
          insights: 47  // Mock value for now
        });
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-light-concrete">
        <div className="bg-paper-white border-b border-stone-gray/20">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-4xl md:text-6xl font-black text-forest-green mb-2">
              Advanced Analytics
            </h1>
            <p className="text-lg text-charcoal">
              Loading analytics data...
            </p>
          </div>
        </div>
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-stone-gray/20 rounded w-3/4"></div>
                    <div className="h-8 bg-stone-gray/20 rounded w-1/3"></div>
                    <div className="h-3 bg-stone-gray/20 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-light-concrete">
        <div className="bg-paper-white border-b border-stone-gray/20">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-4xl md:text-6xl font-black text-forest-green mb-2">
              Advanced Analytics
            </h1>
            <p className="text-lg text-charcoal">
              Error loading analytics data
            </p>
          </div>
        </div>
        <div className="container mx-auto px-6 py-8">
          <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-charcoal mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-concrete">
      {/* Header Section */}
      <div className="bg-paper-white border-b border-stone-gray/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-forest-green mb-2">
                Advanced Analytics
              </h1>
              <p className="text-lg text-charcoal max-w-2xl">
                Comprehensive analytics dashboard for user segmentation, trend analysis, 
                cohort insights, and automated recommendations.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
              <Button className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg">
                <Activity className="w-5 h-5 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <OverviewDashboard analyticsData={analyticsData} />
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-8">
            <SegmentManagementDashboard />
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-8">
            <TrendAnalysisDashboard 
              responses={analyticsData?.responses || []} 
              surveys={analyticsData?.surveys || []} 
            />
          </TabsContent>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts" className="space-y-8">
            <CohortAnalysisDashboard 
              responses={analyticsData?.responses || []} 
            />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-8">
            <InsightRecommendationDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Overview Dashboard Component
function OverviewDashboard({ analyticsData }: { 
  analyticsData: {
    surveys: FormbricksSurvey[];
    responses: FormbricksSurveyResponse[];
    totalResponses: number;
    completionRate: number;
    activeSurveys: number;
    segments: number;
    insights: number;
  } | null 
}) {
  const overviewStats = analyticsData ? [
    {
      title: 'Total Survey Responses',
      value: analyticsData.totalResponses.toString(),
      change: '+15% this month',
      trend: 'up',
      icon: Users,
      color: 'text-forest-green'
    },
    {
      title: 'Active Surveys',
      value: analyticsData.activeSurveys.toString(),
      change: analyticsData.activeSurveys > 0 ? 'Currently running' : 'None active',
      trend: analyticsData.activeSurveys > 0 ? 'up' : 'stable', 
      icon: TrendingUp,
      color: analyticsData.activeSurveys > 0 ? 'text-forest-green' : 'text-charcoal'
    },
    {
      title: 'Completion Rate',
      value: `${analyticsData.completionRate}%`,
      change: analyticsData.completionRate > 70 ? 'Excellent rate' : analyticsData.completionRate > 50 ? 'Good rate' : 'Needs improvement',
      trend: analyticsData.completionRate > 70 ? 'up' : analyticsData.completionRate > 50 ? 'stable' : 'down',
      icon: BarChart3,
      color: analyticsData.completionRate > 70 ? 'text-forest-green' : analyticsData.completionRate > 50 ? 'text-charcoal' : 'text-red-600'
    },
    {
      title: 'Total Surveys',
      value: analyticsData.surveys.length.toString(),
      change: `${analyticsData.activeSurveys} active`,
      trend: 'stable',
      icon: Lightbulb,
      color: 'text-forest-green'
    }
  ] : [];

  const quickActions = [
    {
      title: 'Create New Segment',
      description: 'Define custom user segments with advanced targeting rules',
      href: '/admin/analytics/segments',
      icon: Target,
      color: 'bg-forest-green'
    },
    {
      title: 'Analyze Trends',
      description: 'Explore time-series data and identify patterns',
      href: '/admin/analytics/trends', 
      icon: TrendingUp,
      color: 'bg-equipment-yellow'
    },
    {
      title: 'Review Cohorts',
      description: 'Examine user behavior across different cohorts',
      href: '/admin/analytics/cohorts',
      icon: BarChart3,
      color: 'bg-forest-green'
    },
    {
      title: 'View Insights',
      description: 'Get automated recommendations and insights',
      href: '/admin/analytics/insights',
      icon: Lightbulb,
      color: 'bg-equipment-yellow'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.length > 0 ? overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg text-charcoal font-medium">{stat.title}</p>
                    <p className="font-mono font-medium text-forest-green text-2xl mt-1">
                      {stat.value}
                    </p>
                    <p className={`text-sm mt-1 ${stat.color}`}>
                      {stat.change}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          // Loading placeholder
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-stone-gray/20 rounded w-3/4"></div>
                  <div className="h-8 bg-stone-gray/20 rounded w-1/3"></div>
                  <div className="h-3 bg-stone-gray/20 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Jump to key analytics sections
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Card className="bg-paper-white border border-stone-gray/20 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`${action.color} p-3 rounded-lg text-paper-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-charcoal text-lg">{action.title}</h3>
                          <p className="text-charcoal text-base">{action.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-charcoal group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Segment Management Dashboard Component
function SegmentManagementDashboard() {
  const [segments] = useState([
    {
      id: '1',
      name: 'High-Value Users',
      description: 'Users with premium plans and high engagement',
      userCount: 1247,
      criteria: ['Plan: Premium', 'Engagement: High', 'Tenure: >6 months'],
      status: 'active',
      createdDate: '2024-01-15'
    },
    {
      id: '2', 
      name: 'New User Onboarding',
      description: 'Recently registered users in first 30 days',
      userCount: 892,
      criteria: ['Registration: <30 days', 'Surveys: <5', 'Plan: Free'],
      status: 'active',
      createdDate: '2024-02-01'
    },
    {
      id: '3',
      name: 'Churned Users',
      description: 'Users who have cancelled or downgraded',
      userCount: 234,
      criteria: ['Status: Cancelled', 'Last Activity: >30 days'],
      status: 'monitoring',
      createdDate: '2024-01-28'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-forest-green">
            User Segments
          </h2>
          <p className="text-lg text-charcoal">
            Manage and analyze user segments for targeted campaigns
          </p>
        </div>
        <Button className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg">
          <Users className="w-5 h-5 mr-2" />
          Create Segment
        </Button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <Card key={segment.id} className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardHeader className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-forest-green">
                    {segment.name}
                  </CardTitle>
                  <CardDescription className="text-lg text-charcoal mt-2">
                    {segment.description}
                  </CardDescription>
                </div>
                <Badge 
                  variant={segment.status === 'active' ? 'default' : 'secondary'}
                  className={segment.status === 'active' 
                    ? 'bg-forest-green text-paper-white' 
                    : 'bg-equipment-yellow text-charcoal'
                  }
                >
                  {segment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-charcoal text-base">User Count</p>
                  <p className="font-mono font-medium text-forest-green text-xl">
                    {segment.userCount.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="font-bold text-charcoal text-base mb-2">Criteria</p>
                  <div className="space-y-1">
                    {segment.criteria.map((criterion, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {criterion}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-gray/20">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Insight Recommendation Dashboard Component
function InsightRecommendationDashboard() {
  const insights = [
    {
      id: '1',
      type: 'opportunity',
      title: 'High Churn Risk Segment Identified',
      description: 'Users with 2-4 surveys and no engagement in 14+ days show 73% churn probability',
      impact: 'high',
      actionable: true,
      recommendation: 'Launch targeted re-engagement campaign',
      confidence: 89,
      generatedDate: '2024-02-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'trend', 
      title: 'Premium Plan Conversion Trending Up',
      description: 'Free-to-premium conversions increased 34% after survey completion milestone',
      impact: 'medium',
      actionable: true,
      recommendation: 'Optimize survey completion flow and add premium CTAs',
      confidence: 76,
      generatedDate: '2024-02-14T15:45:00Z'
    },
    {
      id: '3',
      type: 'performance',
      title: 'Survey Response Rates Declining',
      description: 'Overall response rates dropped 12% over past 30 days across all segments',
      impact: 'high',
      actionable: true,
      recommendation: 'Review survey length and incentive strategies',
      confidence: 92,
      generatedDate: '2024-02-13T09:20:00Z'
    },
    {
      id: '4',
      type: 'cohort',
      title: 'Strong Retention in Q4 Cohort',
      description: 'Q4 2023 user cohort shows 23% better 90-day retention than average',
      impact: 'medium',
      actionable: false,
      recommendation: 'Study Q4 onboarding process for replication',
      confidence: 84,
      generatedDate: '2024-02-12T14:10:00Z'
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Target;
      case 'trend': return TrendingUp;
      case 'performance': return Activity;
      case 'cohort': return Users;
      default: return Lightbulb;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-equipment-yellow';
      case 'low': return 'text-forest-green';
      default: return 'text-charcoal';
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-forest-green">
            AI-Powered Insights
          </h2>
          <p className="text-lg text-charcoal">
            Automated recommendations and actionable insights from your data
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
          >
            Refresh Insights
          </Button>
          <Button className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg">
            Configure AI
          </Button>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="space-y-4">
        {insights.map((insight) => {
          const Icon = getInsightIcon(insight.type);
          return (
            <Card key={insight.id} className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="bg-forest-green p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-paper-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-charcoal text-lg">
                        {insight.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary"
                          className={getImpactBadgeColor(insight.impact)}
                        >
                          {insight.impact} impact
                        </Badge>
                        {insight.actionable && (
                          <Badge className="bg-forest-green text-paper-white">
                            Actionable
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-charcoal text-base mb-3">
                      {insight.description}
                    </p>
                    
                    <div className="bg-light-concrete rounded-lg p-4 mb-4">
                      <p className="font-bold text-charcoal text-base mb-1">
                        Recommendation:
                      </p>
                      <p className="text-charcoal text-base">
                        {insight.recommendation}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-base">
                          <span className="font-bold text-charcoal">Confidence: </span>
                          <span className="font-mono font-medium text-forest-green">
                            {insight.confidence}%
                          </span>
                        </div>
                        <div className="text-base">
                          <span className="font-bold text-charcoal">Generated: </span>
                          <span className="text-charcoal">
                            {new Date(insight.generatedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 py-2 rounded-lg transition-all duration-200"
                        >
                          Learn More
                        </Button>
                        {insight.actionable && (
                          <Button 
                            size="sm"
                            className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold px-4 py-2 rounded-lg transition-all duration-200"
                          >
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
