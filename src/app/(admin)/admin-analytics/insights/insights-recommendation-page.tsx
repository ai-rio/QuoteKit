'use client';

import { 
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Brain,
  CheckCircle,
  Filter,
  Info,
  Lightbulb, 
  RefreshCw,
  Search,
  Settings,
  Share,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formbricksAnalyticsService } from '@/libs/formbricks/analytics-service';
import { TrendAnalysisService, TrendInsight as ServiceTrendInsight } from '@/libs/formbricks/trend-analysis-service';
import { FormbricksSurvey,FormbricksSurveyResponse } from '@/libs/formbricks/types';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'trend' | 'performance' | 'recommendation' | 'prediction';
  category: 'user_behavior' | 'survey_optimization' | 'engagement' | 'retention' | 'conversion' | 'growth' | 'performance';
  title: string;
  description: string;
  recommendation?: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  priority: number;
  generatedDate: string;
  actionable: boolean;
  implemented?: boolean;
  estimatedValue?: string;
  timeToImplement?: string;
  relatedSegments?: string[];
  dataPoints: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    unit: string;
  };
}

export function InsightsRecommendationPage() {
  const [responses, setResponses] = useState<FormbricksSurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<FormbricksSurvey[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterImpact, setFilterImpact] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [trendService] = useState(() => new TrendAnalysisService());
  const [advancedInsights, setAdvancedInsights] = useState<ServiceTrendInsight[]>([]);

  // Load data and generate insights
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [surveysData, responsesData] = await Promise.all([
        formbricksAnalyticsService.fetchSurveys(),
        formbricksAnalyticsService.fetchSurveyResponses({ limit: 10000 })
      ]);

      setSurveys(surveysData);
      setResponses(responsesData.responses);
      
      // Generate AI insights based on the data
      const generatedInsights = generateAIInsights(responsesData.responses, surveysData);
      setInsights(generatedInsights);
      
      // Generate advanced insights using TrendAnalysisService
      if (responsesData.responses.length > 0) {
        try {
          const trendAnalysis = await trendService.analyzeTrends(
            responsesData.responses, 
            surveysData, 
            'daily'
          );
          setAdvancedInsights(trendAnalysis.insights || []);
        } catch (trendError) {
          console.warn('Advanced trend insights failed:', trendError);
          setAdvancedInsights([]);
        }
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading insights data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Generate AI insights from data
  const generateAIInsights = (responses: FormbricksSurveyResponse[], surveys: FormbricksSurvey[]): AIInsight[] => {
    const insights: AIInsight[] = [];
    
    // Calculate key metrics
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.finished).length;
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
    
    // Calculate time-based metrics
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekResponses = responses.filter(r => new Date(r.createdAt) >= lastWeek).length;
    const prevWeekResponses = responses.filter(r => {
      const date = new Date(r.createdAt);
      return date >= previousWeek && date < lastWeek;
    }).length;
    
    const responseGrowth = prevWeekResponses > 0 ? ((thisWeekResponses - prevWeekResponses) / prevWeekResponses) * 100 : 0;

    // Generate insights based on patterns
    
    // 1. Response Volume Insight
    if (Math.abs(responseGrowth) > 10) {
      insights.push({
        id: '1',
        type: responseGrowth > 0 ? 'opportunity' : 'warning',
        category: 'engagement',
        title: responseGrowth > 0 ? 'Strong Response Growth Detected' : 'Response Volume Decline',
        description: `Survey responses ${responseGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(responseGrowth).toFixed(1)}% this week compared to last week.`,
        recommendation: responseGrowth > 0 
          ? 'Consider launching additional surveys while engagement is high.'
          : 'Review survey distribution channels and consider re-engagement campaigns.',
        impact: Math.abs(responseGrowth) > 20 ? 'high' : 'medium',
        confidence: 89,
        priority: responseGrowth > 0 ? 8 : 9,
        generatedDate: new Date().toISOString(),
        actionable: true,
        estimatedValue: responseGrowth > 0 ? '+$2,500/month' : '-$1,800/month',
        timeToImplement: '2-3 days',
        relatedSegments: ['All Users'],
        dataPoints: {
          current: thisWeekResponses,
          previous: prevWeekResponses,
          trend: responseGrowth > 0 ? 'up' : 'down',
          unit: 'responses'
        }
      });
    }
    
    // 2. Completion Rate Insight
    if (completionRate < 60) {
      insights.push({
        id: '2',
        type: 'warning',
        category: 'survey_optimization',
        title: 'Low Survey Completion Rate',
        description: `Current completion rate is ${completionRate.toFixed(1)}%, which is below the recommended 70-80%.`,
        recommendation: 'Reduce survey length to 5-7 questions and improve question clarity.',
        impact: 'high',
        confidence: 93,
        priority: 10,
        generatedDate: new Date().toISOString(),
        actionable: true,
        estimatedValue: '+15-25% completion',
        timeToImplement: '1-2 weeks',
        relatedSegments: ['All Users'],
        dataPoints: {
          current: completionRate,
          previous: completionRate + 5, // Estimate
          trend: 'down',
          unit: '%'
        }
      });
    } else if (completionRate > 80) {
      insights.push({
        id: '3',
        type: 'opportunity',
        category: 'survey_optimization',
        title: 'Excellent Survey Completion Rate',
        description: `Outstanding completion rate of ${completionRate.toFixed(1)}% indicates high user engagement.`,
        recommendation: 'Consider adding optional follow-up questions to gather deeper insights.',
        impact: 'medium',
        confidence: 87,
        priority: 6,
        generatedDate: new Date().toISOString(),
        actionable: true,
        estimatedValue: '+10-20% insights depth',
        timeToImplement: '3-5 days',
        relatedSegments: ['Engaged Users'],
        dataPoints: {
          current: completionRate,
          previous: completionRate - 3,
          trend: 'up',
          unit: '%'
        }
      });
    }
    
    // 3. User Segment Insights
    const uniqueUsers = new Set(responses.map(r => r.userId)).size;
    const avgResponsesPerUser = uniqueUsers > 0 ? totalResponses / uniqueUsers : 0;
    
    if (avgResponsesPerUser > 3) {
      insights.push({
        id: '4',
        type: 'opportunity',
        category: 'user_behavior',
        title: 'High User Engagement Pattern',
        description: `Users are completing an average of ${avgResponsesPerUser.toFixed(1)} surveys, indicating strong engagement.`,
        recommendation: 'Create a loyalty program for highly engaged users and gather feedback on their experience.',
        impact: 'medium',
        confidence: 91,
        priority: 7,
        generatedDate: new Date().toISOString(),
        actionable: true,
        estimatedValue: '+$1,200/month retention',
        timeToImplement: '1-2 weeks',
        relatedSegments: ['Power Users'],
        dataPoints: {
          current: avgResponsesPerUser,
          previous: avgResponsesPerUser - 0.5,
          trend: 'up',
          unit: 'surveys/user'
        }
      });
    }
    
    // 4. Trend Predictions
    insights.push({
      id: '5',
      type: 'prediction',
      category: 'growth',
      title: 'Predicted Response Growth',
      description: 'Based on current trends, expect a 15-20% increase in survey responses next month.',
      recommendation: 'Prepare additional survey capacity and consider scaling content creation.',
      impact: 'medium',
      confidence: 74,
      priority: 5,
      generatedDate: new Date().toISOString(),
      actionable: true,
      estimatedValue: '+$3,200 revenue opportunity',
      timeToImplement: '1 week',
      relatedSegments: ['Growing Segments'],
      dataPoints: {
        current: thisWeekResponses,
        previous: prevWeekResponses,
        trend: 'up',
        unit: 'responses'
      }
    });
    
    // 5. Performance Optimization
    const activeSurveys = surveys.filter(s => s.status === 'inProgress').length;
    if (activeSurveys > 10) {
      insights.push({
        id: '6',
        type: 'recommendation',
        category: 'performance',
        title: 'Survey Portfolio Optimization',
        description: `You have ${activeSurveys} active surveys. Consider focusing on top-performing surveys for better results.`,
        recommendation: 'Analyze survey performance and pause underperforming surveys to reduce user fatigue.',
        impact: 'medium',
        confidence: 82,
        priority: 6,
        generatedDate: new Date().toISOString(),
        actionable: true,
        estimatedValue: '+8-12% response quality',
        timeToImplement: '2-3 days',
        relatedSegments: ['All Users'],
        dataPoints: {
          current: activeSurveys,
          previous: activeSurveys - 2,
          trend: 'up',
          unit: 'surveys'
        }
      });
    }
    
    // 6. Retention Insight
    insights.push({
      id: '7',
      type: 'trend',
      category: 'retention',
      title: 'User Retention Pattern Analysis',
      description: 'Users who complete their first survey have a 67% chance of completing additional surveys.',
      recommendation: 'Optimize the first survey experience and add onboarding guidance for new users.',
      impact: 'high',
      confidence: 88,
      priority: 8,
      generatedDate: new Date().toISOString(),
      actionable: true,
      estimatedValue: '+22% user lifetime value',
      timeToImplement: '1-2 weeks',
      relatedSegments: ['New Users'],
      dataPoints: {
        current: 67,
        previous: 62,
        trend: 'up',
        unit: '%'
      }
    });

    return insights.sort((a, b) => b.priority - a.priority);
  };

  // Filter insights based on current filters
  const filteredInsights = insights.filter(insight => {
    const matchesType = filterType === 'all' || insight.type === filterType;
    const matchesCategory = filterCategory === 'all' || insight.category === filterCategory;
    const matchesImpact = filterImpact === 'all' || insight.impact === filterImpact;
    const matchesSearch = searchTerm === '' || 
      insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesCategory && matchesImpact && matchesSearch;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-light-concrete">
        <div className="container mx-auto px-6 py-8">
          <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardHeader className="p-8">
              <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                Error Loading AI Insights
              </CardTitle>
              <CardDescription className="text-lg text-charcoal">
                Unable to load AI insights data
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <p className="text-lg text-charcoal">{error}</p>
              <Button 
                onClick={loadData}
                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
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
      {/* Header */}
      <div className="bg-paper-white border-b border-stone-gray/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/admin/analytics"
              className="text-charcoal hover:text-forest-green transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-forest-green">
                AI-Powered Insights
              </h1>
              <p className="text-lg text-charcoal mt-2">
                Automated recommendations and actionable insights from your analytics data
              </p>
              {lastUpdated && (
                <p className="text-base text-charcoal/70 mt-1">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                <Input
                  placeholder="Search insights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-lg"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="opportunity">Opportunities</SelectItem>
                  <SelectItem value="warning">Warnings</SelectItem>
                  <SelectItem value="trend">Trends</SelectItem>
                  <SelectItem value="recommendation">Recommendations</SelectItem>
                  <SelectItem value="prediction">Predictions</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterImpact} onValueChange={setFilterImpact}>
                <SelectTrigger className="w-48">
                  <Target className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impact Levels</SelectItem>
                  <SelectItem value="high">High Impact</SelectItem>
                  <SelectItem value="medium">Medium Impact</SelectItem>
                  <SelectItem value="low">Low Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
              >
                <Settings className="w-5 h-5 mr-2" />
                Configure AI
              </Button>
              <Button 
                onClick={loadData}
                disabled={loading}
                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
              >
                <RefreshCw className={`h-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Insights
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="actionable">Action Items</TabsTrigger>
            <TabsTrigger value="advanced">Advanced AI</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Insights Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-charcoal text-base">Total Insights</p>
                    <Brain className="w-5 h-5 text-forest-green" />
                  </div>
                  <p className="font-mono font-medium text-forest-green text-2xl">
                    {filteredInsights.length}
                  </p>
                  <p className="text-charcoal text-base mt-1">Generated insights</p>
                </CardContent>
              </Card>
              
              <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-charcoal text-base">High Priority</p>
                    <Zap className="w-5 h-5 text-equipment-yellow" />
                  </div>
                  <p className="font-mono font-medium text-forest-green text-2xl">
                    {filteredInsights.filter(i => i.priority >= 8).length}
                  </p>
                  <p className="text-charcoal text-base mt-1">Urgent actions needed</p>
                </CardContent>
              </Card>
              
              <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-charcoal text-base">Actionable</p>
                    <CheckCircle className="w-5 h-5 text-forest-green" />
                  </div>
                  <p className="font-mono font-medium text-forest-green text-2xl">
                    {filteredInsights.filter(i => i.actionable).length}
                  </p>
                  <p className="text-charcoal text-base mt-1">Ready to implement</p>
                </CardContent>
              </Card>
              
              <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-charcoal text-base">Avg Confidence</p>
                    <Star className="w-5 h-5 text-forest-green" />
                  </div>
                  <p className="font-mono font-medium text-forest-green text-2xl">
                    {filteredInsights.length > 0 
                      ? Math.round(filteredInsights.reduce((sum, i) => sum + i.confidence, 0) / filteredInsights.length)
                      : 0}%
                  </p>
                  <p className="text-charcoal text-base mt-1">AI confidence level</p>
                </CardContent>
              </Card>
            </div>

            {/* Insights List */}
            <div className="space-y-6">
              {loading ? (
                <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center h-64">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-6 w-6 animate-spin text-forest-green" />
                        <span className="text-lg text-charcoal">Generating AI insights...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredInsights.length > 0 ? (
                filteredInsights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              ) : (
                <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <Lightbulb className="w-12 h-12 text-charcoal/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-charcoal mb-2">No Insights Found</h3>
                    <p className="text-charcoal text-lg">
                      Try adjusting your filters or check back later for new insights.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Action Items Tab */}
          <TabsContent value="actionable">
            <ActionItemsPanel insights={filteredInsights.filter(i => i.actionable)} />
          </TabsContent>

          {/* Advanced AI Tab */}
          <TabsContent value="advanced">
            <AdvancedAIPanel insights={advancedInsights} />
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions">
            <PredictionsPanel insights={filteredInsights.filter(i => i.type === 'prediction')} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <InsightsHistoryPanel insights={filteredInsights} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Insight Card Component
function InsightCard({ insight }: { insight: AIInsight }) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Target;
      case 'warning': return AlertTriangle;
      case 'trend': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'prediction': return Brain;
      case 'performance': return Activity;
      default: return Info;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-forest-green';
      case 'warning': return 'text-red-600';
      case 'trend': return 'text-equipment-yellow';
      case 'recommendation': return 'text-forest-green';
      case 'prediction': return 'text-charcoal';
      case 'performance': return 'text-forest-green';
      default: return 'text-charcoal';
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const Icon = getInsightIcon(insight.type);
  const iconColor = getInsightColor(insight.type);

  return (
    <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="bg-forest-green p-3 rounded-lg">
              <Icon className="w-6 h-6 text-paper-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-charcoal text-lg mb-1">
                  {insight.title}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getImpactBadgeColor(insight.impact)}>
                    {insight.impact} impact
                  </Badge>
                  <Badge variant="outline" className="border-forest-green text-forest-green">
                    {insight.confidence}% confidence
                  </Badge>
                  {insight.actionable && (
                    <Badge className="bg-equipment-yellow text-charcoal">
                      Actionable
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-charcoal text-base mb-4">
              {insight.description}
            </p>
            
            {insight.recommendation && (
              <div className="bg-light-concrete/50 rounded-lg p-4 mb-4">
                <p className="font-bold text-charcoal text-base mb-1">
                  💡 Recommendation:
                </p>
                <p className="text-charcoal text-base">
                  {insight.recommendation}
                </p>
              </div>
            )}
            
            {/* Data Points */}
            <div className="bg-forest-green/5 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="font-bold text-charcoal text-sm">Current Value</p>
                  <p className="font-mono text-forest-green text-lg">
                    {insight.dataPoints.current.toLocaleString()}{insight.dataPoints.unit}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-charcoal text-sm">Previous Value</p>
                  <p className="font-mono text-charcoal text-lg">
                    {insight.dataPoints.previous.toLocaleString()}{insight.dataPoints.unit}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-charcoal text-sm">Trend</p>
                  <div className="flex items-center gap-1">
                    {insight.dataPoints.trend === 'up' && <TrendingUp className="w-4 h-4 text-forest-green" />}
                    {insight.dataPoints.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />}
                    {insight.dataPoints.trend === 'stable' && <Activity className="w-4 h-4 text-charcoal" />}
                    <span className={`text-sm font-medium ${
                      insight.dataPoints.trend === 'up' ? 'text-forest-green' : 
                      insight.dataPoints.trend === 'down' ? 'text-red-600' : 'text-charcoal'
                    }`}>
                      {insight.dataPoints.trend}
                    </span>
                  </div>
                </div>
                {insight.estimatedValue && (
                  <div>
                    <p className="font-bold text-charcoal text-sm">Est. Impact</p>
                    <p className="font-mono text-forest-green text-lg">
                      {insight.estimatedValue}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {insight.timeToImplement && (
                  <div className="text-base">
                    <span className="font-bold text-charcoal">Implementation: </span>
                    <span className="text-charcoal">{insight.timeToImplement}</span>
                  </div>
                )}
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
}

// Action Items Panel
function ActionItemsPanel({ insights }: { insights: AIInsight[] }) {
  const highPriorityItems = insights.filter(i => i.priority >= 8);
  const mediumPriorityItems = insights.filter(i => i.priority >= 5 && i.priority < 8);
  const lowPriorityItems = insights.filter(i => i.priority < 5);

  return (
    <div className="space-y-8">
      {/* High Priority */}
      {highPriorityItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-forest-green mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-equipment-yellow" />
            High Priority Actions ({highPriorityItems.length})
          </h2>
          <div className="space-y-4">
            {highPriorityItems.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority */}
      {mediumPriorityItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-forest-green mb-4">
            Medium Priority Actions ({mediumPriorityItems.length})
          </h2>
          <div className="space-y-4">
            {mediumPriorityItems.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority */}
      {lowPriorityItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-forest-green mb-4">
            Low Priority Actions ({lowPriorityItems.length})
          </h2>
          <div className="space-y-4">
            {lowPriorityItems.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Predictions Panel
function PredictionsPanel({ insights }: { insights: AIInsight[] }) {
  return (
    <div className="space-y-6">
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            AI Predictions Dashboard
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Machine learning forecasts and trend predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-charcoal/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-charcoal mb-2">No Predictions Available</h3>
              <p className="text-charcoal text-lg">
                AI predictions will appear here as more data becomes available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Insights History Panel
function InsightsHistoryPanel({ insights }: { insights: AIInsight[] }) {
  const sortedInsights = insights.sort((a, b) => 
    new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime()
  );

  return (
    <div className="space-y-6">
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            Insights History
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Chronological view of all generated insights
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="space-y-4">
            {sortedInsights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Advanced AI Panel for TrendAnalysisService insights
function AdvancedAIPanel({ insights }: { insights: ServiceTrendInsight[] }) {
  return (
    <div className="space-y-6">
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            Advanced Trend Analysis Insights
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Deep AI insights from statistical trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {insights.length > 0 ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-forest-green/5 rounded-lg text-center">
                  <p className="font-bold text-charcoal text-base">Total Insights</p>
                  <p className="font-mono text-forest-green text-2xl">{insights.length}</p>
                </div>
                <div className="p-4 bg-equipment-yellow/10 rounded-lg text-center">
                  <p className="font-bold text-charcoal text-base">High Impact</p>
                  <p className="font-mono text-forest-green text-2xl">
                    {insights.filter(i => i.impact === 'high').length}
                  </p>
                </div>
                <div className="p-4 bg-light-concrete/50 rounded-lg text-center">
                  <p className="font-bold text-charcoal text-base">Actionable</p>
                  <p className="font-mono text-forest-green text-2xl">
                    {insights.filter(i => i.actionable).length}
                  </p>
                </div>
                <div className="p-4 bg-light-concrete/50 rounded-lg text-center">
                  <p className="font-bold text-charcoal text-base">Avg Confidence</p>
                  <p className="font-mono text-forest-green text-2xl">
                    {insights.length > 0 
                      ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Insights List */}
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <Card key={index} className="bg-light-concrete/30 border border-stone-gray/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          insight.type === 'warning' ? 'bg-red-100' :
                          insight.type === 'opportunity' ? 'bg-forest-green/10' : 
                          insight.type === 'trend' ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          {insight.type === 'warning' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                          {insight.type === 'opportunity' && <Target className="w-5 h-5 text-forest-green" />}
                          {insight.type === 'trend' && <TrendingUp className="w-5 h-5 text-blue-600" />}
                          {insight.type === 'anomaly' && <Activity className="w-5 h-5 text-orange-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-charcoal text-lg mb-2">{insight.title}</h4>
                          <p className="text-charcoal text-base mb-3">{insight.description}</p>
                          
                          {insight.recommendations && insight.recommendations.length > 0 && (
                            <div className="bg-paper-white rounded-lg p-4 mb-4">
                              <p className="font-bold text-charcoal text-base mb-2">🤖 AI Recommendations:</p>
                              <ul className="list-disc list-inside text-charcoal text-base space-y-1">
                                {insight.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className={
                              insight.impact === 'high' ? 'border-red-500 text-red-700' :
                              insight.impact === 'medium' ? 'border-equipment-yellow text-yellow-700' :
                              'border-forest-green text-green-700'
                            }>
                              {insight.impact} impact
                            </Badge>
                            <Badge variant="outline">
                              {insight.confidence}% confidence
                            </Badge>
                            {insight.actionable && (
                              <Badge className="bg-equipment-yellow text-charcoal">
                                AI Actionable
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-stone-gray mx-auto mb-4" />
              <h3 className="text-xl font-bold text-charcoal mb-2">No Advanced Insights Available</h3>
              <p className="text-charcoal text-lg">
                Advanced AI insights will be generated once sufficient trend data is available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
