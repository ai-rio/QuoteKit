'use client';

import { 
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3, 
  CheckCircle,
  DollarSign,
  Lightbulb, 
  Mail,
  Settings, 
  Target,
  TrendingUp, 
  Users} from 'lucide-react';
import Link from 'next/link';
import { useEffect,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// PostHog Analytics Service
interface PostHogMetrics {
  total_users: number;
  quotes_created: number;
  quotes_sent: number;
  quotes_accepted: number;
  total_revenue: number;
  conversion_rate: number;
  send_rate: number;
  average_quote_value: number;
  last_updated: string;
  error?: string;
}

interface EmailMetrics {
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  open_rate: number;
  click_rate: number;
}

export function PostHogAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PostHogMetrics | null>(null);
  const [emailMetrics, setEmailMetrics] = useState<EmailMetrics | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Load PostHog analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Test PostHog connection first
        const connectionResponse = await fetch('/api/admin/analytics/posthog/test-connection');
        const connectionData = await connectionResponse.json();
        
        if (!connectionData.success) {
          setConnectionStatus('error');
          setError(connectionData.message);
          return;
        }
        
        setConnectionStatus('connected');
        
        // Fetch system metrics
        const [metricsResponse, emailResponse] = await Promise.all([
          fetch('/api/admin/analytics/posthog/system-metrics'),
          fetch('/api/admin/analytics/posthog/email-metrics')
        ]);

        if (!metricsResponse.ok) {
          throw new Error(`Failed to fetch metrics: ${metricsResponse.statusText}`);
        }

        const metricsData = await metricsResponse.json();
        const emailData = emailResponse.ok ? await emailResponse.json() : null;

        setMetrics(metricsData);
        setEmailMetrics(emailData);
        
        if (metricsData.error) {
          setError(metricsData.error);
        }
      } catch (err) {
        console.error('Error loading PostHog analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        setConnectionStatus('error');
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
              PostHog Analytics
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

  return (
    <div className="min-h-screen bg-light-concrete">
      {/* Header Section */}
      <div className="bg-paper-white border-b border-stone-gray/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-6xl font-black text-forest-green">
                  PostHog Analytics
                </h1>
                <ConnectionStatusBadge status={connectionStatus} />
              </div>
              <p className="text-lg text-charcoal max-w-2xl">
                Real-time analytics powered by PostHog for comprehensive user behavior tracking and business insights.
              </p>
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700 font-medium">Analytics Error</p>
                  </div>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
                onClick={() => window.location.reload()}
              >
                <Activity className="w-5 h-5 mr-2" />
                Refresh Data
              </Button>
              <Button className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg">
                <Settings className="w-5 h-5 mr-2" />
                Configure PostHog
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <OverviewDashboard metrics={metrics} emailMetrics={emailMetrics} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-8">
            <UserAnalyticsDashboard metrics={metrics} />
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-8">
            <QuoteAnalyticsDashboard metrics={metrics} />
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-8">
            <RevenueAnalyticsDashboard metrics={metrics} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Connection Status Badge Component
function ConnectionStatusBadge({ status }: { status: 'checking' | 'connected' | 'error' }) {
  const statusConfig = {
    checking: {
      color: 'bg-yellow-100 text-yellow-700',
      icon: Activity,
      text: 'Checking...'
    },
    connected: {
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      text: 'Connected'
    },
    error: {
      color: 'bg-red-100 text-red-700',
      icon: AlertCircle,
      text: 'Connection Error'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {config.text}
    </Badge>
  );
}

// Overview Dashboard Component
function OverviewDashboard({ 
  metrics, 
  emailMetrics 
}: { 
  metrics: PostHogMetrics | null;
  emailMetrics: EmailMetrics | null;
}) {
  const overviewStats = metrics ? [
    {
      title: 'Total Users',
      value: metrics.total_users.toLocaleString(),
      change: 'Active users',
      trend: 'up',
      icon: Users,
      color: 'text-forest-green'
    },
    {
      title: 'Quotes Created',
      value: metrics.quotes_created.toLocaleString(),
      change: `${metrics.send_rate}% sent`,
      trend: metrics.send_rate > 70 ? 'up' : 'stable',
      icon: BarChart3,
      color: 'text-forest-green'
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversion_rate}%`,
      change: 'Quote to acceptance',
      trend: metrics.conversion_rate > 20 ? 'up' : metrics.conversion_rate > 10 ? 'stable' : 'down',
      icon: TrendingUp,
      color: metrics.conversion_rate > 20 ? 'text-forest-green' : metrics.conversion_rate > 10 ? 'text-charcoal' : 'text-red-600'
    },
    {
      title: 'Total Revenue',
      value: `$${metrics.total_revenue.toLocaleString()}`,
      change: `$${metrics.average_quote_value} avg`,
      trend: 'up',
      icon: DollarSign,
      color: 'text-forest-green'
    }
  ] : [];

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

      {/* Email Metrics */}
      {emailMetrics && (
        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardHeader className="p-8">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Email Performance
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Email campaign metrics and engagement rates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <p className="text-lg text-charcoal font-medium">Emails Sent</p>
                <p className="font-mono font-medium text-forest-green text-2xl mt-1">
                  {emailMetrics.emails_sent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-lg text-charcoal font-medium">Emails Opened</p>
                <p className="font-mono font-medium text-forest-green text-2xl mt-1">
                  {emailMetrics.emails_opened.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-lg text-charcoal font-medium">Emails Clicked</p>
                <p className="font-mono font-medium text-forest-green text-2xl mt-1">
                  {emailMetrics.emails_clicked.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-lg text-charcoal font-medium">Open Rate</p>
                <p className="font-mono font-medium text-forest-green text-2xl mt-1">
                  {emailMetrics.open_rate}%
                </p>
              </div>
              <div>
                <p className="text-lg text-charcoal font-medium">Click Rate</p>
                <p className="font-mono font-medium text-forest-green text-2xl mt-1">
                  {emailMetrics.click_rate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      {metrics && (
        <div className="text-center">
          <p className="text-charcoal">
            Last updated: {new Date(metrics.last_updated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

// User Analytics Dashboard Component
function UserAnalyticsDashboard({ metrics }: { metrics: PostHogMetrics | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-forest-green">User Analytics</h2>
        <p className="text-lg text-charcoal">Detailed user behavior and engagement metrics</p>
      </div>
      
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            <Users className="w-16 h-16 text-forest-green mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-charcoal mb-2">User Analytics Coming Soon</h3>
            <p className="text-charcoal">
              Detailed user behavior analysis, cohort tracking, and engagement metrics will be available here.
            </p>
            {metrics && (
              <div className="mt-6 p-4 bg-light-concrete rounded-lg">
                <p className="font-bold text-charcoal">Current Total Users</p>
                <p className="font-mono font-medium text-forest-green text-3xl">
                  {metrics.total_users.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Quote Analytics Dashboard Component
function QuoteAnalyticsDashboard({ metrics }: { metrics: PostHogMetrics | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-forest-green">Quote Analytics</h2>
        <p className="text-lg text-charcoal">Quote creation, conversion, and performance metrics</p>
      </div>
      
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-forest-green mx-auto mb-3" />
                <p className="text-lg text-charcoal font-medium">Quotes Created</p>
                <p className="font-mono font-medium text-forest-green text-3xl mt-1">
                  {metrics.quotes_created.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-forest-green mx-auto mb-3" />
                <p className="text-lg text-charcoal font-medium">Quotes Sent</p>
                <p className="font-mono font-medium text-forest-green text-3xl mt-1">
                  {metrics.quotes_sent.toLocaleString()}
                </p>
                <p className="text-sm text-charcoal mt-1">
                  {metrics.send_rate}% of created
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <Target className="w-12 h-12 text-forest-green mx-auto mb-3" />
                <p className="text-lg text-charcoal font-medium">Quotes Accepted</p>
                <p className="font-mono font-medium text-forest-green text-3xl mt-1">
                  {metrics.quotes_accepted.toLocaleString()}
                </p>
                <p className="text-sm text-charcoal mt-1">
                  {metrics.conversion_rate}% conversion
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Revenue Analytics Dashboard Component
function RevenueAnalyticsDashboard({ metrics }: { metrics: PostHogMetrics | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-forest-green">Revenue Analytics</h2>
        <p className="text-lg text-charcoal">Revenue tracking, trends, and financial performance</p>
      </div>
      
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <DollarSign className="w-16 h-16 text-forest-green mx-auto mb-4" />
                <p className="text-lg text-charcoal font-medium">Total Revenue</p>
                <p className="font-mono font-medium text-forest-green text-4xl mt-2">
                  ${metrics.total_revenue.toLocaleString()}
                </p>
                <p className="text-charcoal mt-2">
                  From {metrics.quotes_accepted} accepted quotes
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-forest-green mx-auto mb-4" />
                <p className="text-lg text-charcoal font-medium">Average Quote Value</p>
                <p className="font-mono font-medium text-forest-green text-4xl mt-2">
                  ${metrics.average_quote_value.toLocaleString()}
                </p>
                <p className="text-charcoal mt-2">
                  Per accepted quote
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
