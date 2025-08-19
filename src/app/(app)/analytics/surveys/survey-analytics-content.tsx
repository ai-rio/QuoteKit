"use client"

/**
 * Survey Analytics Content Component
 * 
 * Provides navigation and access to different survey analytics views:
 * - Main Formbricks dashboard
 * - Advanced trend analysis (FB-021)
 * - Survey performance metrics
 */

import { BarChart3, ExternalLink, Lock,Settings, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SurveyAnalyticsContentProps {
  hasAccess: boolean;
}

export function SurveyAnalyticsContent({ hasAccess }: SurveyAnalyticsContentProps) {
  const [activeView, setActiveView] = useState<'overview' | 'dashboard' | 'trends'>('overview');

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-forest-green">Survey Analytics</h1>
          <p className="text-lg text-charcoal mt-2">
            Advanced survey analytics and feedback insights
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Analytics Access Required
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Upgrade your plan to access survey analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-charcoal">
              Survey analytics provides comprehensive insights into user feedback, survey performance, 
              and trend analysis to help you make data-driven decisions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-forest-green">Features Include:</h4>
                <ul className="list-disc list-inside space-y-1 text-lg text-charcoal">
                  <li>Real-time survey response tracking</li>
                  <li>Advanced trend analysis and forecasting</li>
                  <li>User cohort analysis and retention metrics</li>
                  <li>Automated insights and recommendations</li>
                  <li>Data export and reporting tools</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-forest-green">Available In:</h4>
                <ul className="list-disc list-inside space-y-1 text-lg text-charcoal">
                  <li>Pro Plan ($29/month)</li>
                  <li>Enterprise Plan ($99/month)</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/settings/billing">
                <EnhancedButton>
                  Upgrade Plan
                </EnhancedButton>
              </Link>
              <Link href="/analytics">
                <EnhancedButton variant="outline">
                  Back to Analytics
                </EnhancedButton>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-6xl font-black text-forest-green">Survey Analytics</h1>
        <p className="text-lg text-charcoal mt-2">
          Comprehensive survey analytics and feedback insights powered by Formbricks
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`cursor-pointer transition-all hover:shadow-lg ${
          activeView === 'overview' ? 'ring-2 ring-forest-green' : ''
        }`} onClick={() => setActiveView('overview')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Analytics navigation and quick stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-charcoal">
              Navigate between different analytics views and see key metrics at a glance.
            </p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-lg ${
          activeView === 'dashboard' ? 'ring-2 ring-forest-green' : ''
        }`} onClick={() => setActiveView('dashboard')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <Users className="h-5 w-5" />
              Survey Dashboard
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Real-time survey responses and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-charcoal">
              View live survey data, response rates, and detailed analytics from your Formbricks integration.
            </p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-lg ${
          activeView === 'trends' ? 'ring-2 ring-forest-green' : ''
        }`} onClick={() => setActiveView('trends')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trend Analysis
              <Badge variant="secondary">New</Badge>
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Advanced statistical analysis and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-charcoal">
              Deep dive into trends, cohort analysis, and automated insights with statistical modeling.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeView === 'overview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
                  Analytics Overview
                </CardTitle>
                <CardDescription className="text-lg text-charcoal">
                  Choose your analytics view
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl md:text-2xl font-bold text-forest-green">Survey Dashboard</h3>
                    <p className="text-lg text-charcoal">
                      Real-time survey analytics with response tracking, completion rates, and user feedback analysis.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-lg text-charcoal">
                      <li>Live response monitoring</li>
                      <li>Survey performance metrics</li>
                      <li>Response filtering and search</li>
                      <li>Data export capabilities</li>
                    </ul>
                    <EnhancedButton 
                      onClick={() => setActiveView('dashboard')}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Dashboard
                    </EnhancedButton>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl md:text-2xl font-bold text-forest-green">Trend Analysis</h3>
                      <Badge variant="secondary">FB-021</Badge>
                    </div>
                    <p className="text-lg text-charcoal">
                      Advanced statistical analysis with trend detection, cohort analysis, and automated insights.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-lg text-charcoal">
                      <li>Time-series trend analysis</li>
                      <li>User cohort tracking</li>
                      <li>Statistical modeling</li>
                      <li>Automated recommendations</li>
                    </ul>
                    <div className="flex gap-3">
                      <EnhancedButton 
                        onClick={() => setActiveView('trends')}
                        className="flex items-center gap-2"
                      >
                        <TrendingUp className="h-4 w-4" />
                        View Trends
                      </EnhancedButton>
                      <Link href="/admin/analytics/trends">
                        <EnhancedButton 
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Full Page
                        </EnhancedButton>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xl md:text-2xl font-bold text-forest-green mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/settings/integrations">
                      <EnhancedButton variant="outline" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Formbricks Settings
                      </EnhancedButton>
                    </Link>
                    <Link href="/analytics">
                      <EnhancedButton variant="outline">
                        Business Analytics
                      </EnhancedButton>
                    </Link>
                    <Link href="/dashboard">
                      <EnhancedButton variant="outline">
                        Main Dashboard
                      </EnhancedButton>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-4xl font-black text-forest-green">Survey Dashboard</h2>
              <EnhancedButton 
                variant="outline" 
                onClick={() => setActiveView('overview')}
              >
                Back to Overview
              </EnhancedButton>
            </div>
            <AnalyticsDashboard />
          </div>
        )}

        {activeView === 'trends' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-4xl font-black text-forest-green">Trend Analysis</h2>
                <Badge variant="secondary">FB-021</Badge>
              </div>
              <div className="flex gap-3">
                <Link href="/admin/analytics/trends">
                  <EnhancedButton className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Full Page View
                  </EnhancedButton>
                </Link>
                <EnhancedButton 
                  variant="outline" 
                  onClick={() => setActiveView('overview')}
                >
                  Back to Overview
                </EnhancedButton>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <TrendingUp className="h-16 w-16 text-forest-green mx-auto" />
                  <h3 className="text-xl md:text-2xl font-bold text-forest-green">Advanced Trend Analysis</h3>
                  <p className="text-lg text-charcoal max-w-2xl mx-auto">
                    The trend analysis dashboard provides comprehensive statistical analysis, 
                    cohort tracking, and automated insights. For the best experience, 
                    view it in full-page mode.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link href="/admin/analytics/trends">
                      <EnhancedButton className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Open Trend Analysis
                      </EnhancedButton>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
