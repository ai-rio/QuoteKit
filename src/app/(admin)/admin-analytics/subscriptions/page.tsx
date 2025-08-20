'use client';

import {
  AlertCircle,
  BarChart3,
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  recentSubscriptions: Array<{
    id: string;
    user_id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    price_id: string;
    product_name: string;
    amount: number;
    currency: string;
    interval: string;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
  }>;
  subscriptionsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export default function SubscriptionAnalyticsPage() {
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/analytics/subscriptions');
      const result = await response.json();

      if (result.success) {
        setMetrics(result.data);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Failed to fetch subscription analytics');
      }
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      setError('Failed to fetch subscription analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'trialing':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'canceled':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-stone-gray/10 text-charcoal/70 border-stone-gray';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-charcoal/50" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-charcoal">Error Loading Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-charcoal/70 mb-4">{error}</p>
            <Button onClick={fetchMetrics} className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal">Subscription Analytics</h1>
          <p className="text-charcoal/70">Real-time subscription metrics and revenue tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-charcoal/60">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={fetchMetrics} 
            variant="outline"
            size="sm"
            className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 py-2 rounded-lg transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-forest-green" />
              <span className="text-sm font-medium text-charcoal/70">Total Subscriptions</span>
            </div>
            <p className="text-2xl font-bold text-charcoal mt-2">{metrics.totalSubscriptions}</p>
            <p className="text-xs text-charcoal/60 mt-1">
              {metrics.activeSubscriptions} active, {metrics.trialingSubscriptions} trialing
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-forest-green" />
              <span className="text-sm font-medium text-charcoal/70">MRR</span>
            </div>
            <p className="text-2xl font-bold text-charcoal mt-2">
              {formatCurrency(metrics.monthlyRecurringRevenue)}
            </p>
            <p className="text-xs text-charcoal/60 mt-1">Monthly Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-forest-green" />
              <span className="text-sm font-medium text-charcoal/70">ARR</span>
            </div>
            <p className="text-2xl font-bold text-charcoal mt-2">
              {formatCurrency(metrics.annualRecurringRevenue)}
            </p>
            <p className="text-xs text-charcoal/60 mt-1">Annual Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-forest-green" />
              <span className="text-sm font-medium text-charcoal/70">Churn Rate</span>
            </div>
            <p className="text-2xl font-bold text-charcoal mt-2">{metrics.churnRate.toFixed(1)}%</p>
            <p className="text-xs text-charcoal/60 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader>
            <CardTitle className="text-section-title text-charcoal">Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-charcoal/70">Average Revenue Per User</span>
              <span className="font-semibold text-charcoal">
                {formatCurrency(metrics.averageRevenuePerUser)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-charcoal/70">Customer Lifetime Value</span>
              <span className="font-semibold text-charcoal">
                {formatCurrency(metrics.customerLifetimeValue)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-charcoal/70">Total Revenue</span>
              <span className="font-semibold text-charcoal">
                {formatCurrency(metrics.totalRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader>
            <CardTitle className="text-section-title text-charcoal">Subscriptions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.subscriptionsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    <span className="text-charcoal/70 capitalize">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-charcoal">{item.count}</span>
                    <span className="text-xs text-charcoal/60 ml-2">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="text-section-title text-charcoal">Revenue Trend (Last 6 Months)</CardTitle>
          <CardDescription className="text-charcoal/70">
            Monthly revenue and subscription count over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.revenueByMonth.map((item) => (
              <div key={item.month} className="flex items-center justify-between p-3 rounded-lg border border-stone-gray/50">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-forest-green" />
                  <span className="font-medium text-charcoal">{item.month}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-charcoal">
                    {formatCurrency(item.revenue)}
                  </div>
                  <div className="text-xs text-charcoal/60">
                    {item.subscriptions} subscription{item.subscriptions !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Subscriptions */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="text-section-title text-charcoal">Recent Subscriptions</CardTitle>
          <CardDescription className="text-charcoal/70">
            Latest subscription activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.recentSubscriptions.length === 0 ? (
              <p className="text-charcoal/60 text-center py-4">No recent subscriptions</p>
            ) : (
              <div className="space-y-3">
                {/* Mobile-friendly table */}
                <div className="block md:hidden space-y-3">
                  {metrics.recentSubscriptions.map((sub) => (
                    <div key={sub.id} className="p-3 rounded-lg border border-stone-gray/50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={getStatusColor(sub.status)}>
                          {sub.status}
                        </Badge>
                        <span className="font-semibold text-charcoal">
                          {formatCurrency(sub.amount, sub.currency)}
                        </span>
                      </div>
                      <div className="text-sm text-charcoal/70">
                        <div>{sub.product_name}</div>
                        <div className="mt-1">
                          {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-gray/30">
                        <th className="text-left py-2 text-sm font-medium text-charcoal/70">Status</th>
                        <th className="text-left py-2 text-sm font-medium text-charcoal/70">Product</th>
                        <th className="text-left py-2 text-sm font-medium text-charcoal/70">Amount</th>
                        <th className="text-left py-2 text-sm font-medium text-charcoal/70">Period</th>
                        <th className="text-left py-2 text-sm font-medium text-charcoal/70">Interval</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recentSubscriptions.map((sub) => (
                        <tr key={sub.id} className="border-b border-stone-gray/20">
                          <td className="py-2">
                            <Badge variant="outline" className={getStatusColor(sub.status)}>
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-charcoal">{sub.product_name}</td>
                          <td className="py-2 font-semibold text-charcoal">
                            {formatCurrency(sub.amount, sub.currency)}
                          </td>
                          <td className="py-2 text-charcoal/70">
                            {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}
                          </td>
                          <td className="py-2 text-charcoal/70 capitalize">{sub.interval}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}