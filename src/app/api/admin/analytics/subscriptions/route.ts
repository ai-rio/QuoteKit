import { NextRequest, NextResponse } from 'next/server';

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { isAdmin } from '@/libs/supabase/admin-utils';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

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

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const userIsAdmin = await isAdmin(user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get Stripe configuration
    const { data: stripeConfigRecord } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    const stripeConfig = stripeConfigRecord?.value as any;
    if (!stripeConfig?.secret_key) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Get subscription data from database
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stripe_prices (
          id,
          unit_amount,
          currency,
          interval,
          stripe_product_id,
          stripe_products (
            name,
            description
          )
        )
      `)
      .order('created', { ascending: false });

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 500 });
    }

    // Calculate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const totalSubscriptions = subscriptions?.length || 0;
    const activeSubscriptions = subscriptions?.filter((sub: any) => sub.status === 'active').length || 0;
    const trialingSubscriptions = subscriptions?.filter((sub: any) => sub.status === 'trialing').length || 0;
    const canceledSubscriptions = subscriptions?.filter((sub: any) => sub.status === 'canceled').length || 0;

    // Calculate revenue metrics
    const activeAndTrialingSubs = subscriptions?.filter((sub: any) => 
      sub.status === 'active' || sub.status === 'trialing'
    ) || [];

    const monthlyRevenue = activeAndTrialingSubs
      .filter((sub: any) => sub.stripe_prices?.interval === 'month')
      .reduce((sum: any, sub: any) => sum + (sub.stripe_prices?.unit_amount || 0) * (sub.quantity || 1), 0) / 100;

    const annualRevenue = activeAndTrialingSubs
      .filter((sub: any) => sub.stripe_prices?.interval === 'year')
      .reduce((sum: any, sub: any) => sum + (sub.stripe_prices?.unit_amount || 0) * (sub.quantity || 1), 0) / 100;

    const monthlyRecurringRevenue = monthlyRevenue + (annualRevenue / 12);
    const annualRecurringRevenue = (monthlyRevenue * 12) + annualRevenue;

    // Calculate churn rate (simplified)
    const recentCancellations = subscriptions?.filter((sub: any) => 
      sub.status === 'canceled' && 
      sub.canceled_at && 
      new Date(sub.canceled_at) >= thirtyDaysAgo
    ).length || 0;

    const previousPeriodActive = subscriptions?.filter((sub: any) => 
      sub.created_at && new Date(sub.created_at) <= thirtyDaysAgo
    ).length || 1; // Avoid division by zero

    const churnRate = (recentCancellations / previousPeriodActive) * 100;

    // Calculate ARPU and CLV (simplified)
    const averageRevenuePerUser = totalSubscriptions > 0 ? monthlyRecurringRevenue / totalSubscriptions : 0;
    const customerLifetimeValue = averageRevenuePerUser * 12; // Simplified 1-year CLV

    // Get recent subscriptions
    const recentSubscriptions = subscriptions?.slice(0, 10).map((sub: any) => ({
      id: sub.id,
      user_id: sub.user_id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      price_id: sub.stripe_price_id,
      product_name: sub.stripe_prices?.stripe_products?.name || 'Unknown Product',
      amount: (sub.stripe_prices?.unit_amount || 0) / 100,
      currency: sub.stripe_prices?.currency || 'usd',
      interval: sub.stripe_prices?.interval || 'month'
    })) || [];

    // Calculate revenue by month (last 6 months)
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthSubs = subscriptions?.filter((sub: any) => {
        const createdDate = new Date(sub.created_at);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }) || [];

      const revenue = monthSubs.reduce((sum: any, sub: any) => 
        sum + ((sub.stripe_prices?.unit_amount || 0) / 100) * (sub.quantity || 1), 0
      );

      revenueByMonth.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        subscriptions: monthSubs.length
      });
    }

    // Calculate subscriptions by status
    const statusCounts = {
      active: activeSubscriptions,
      trialing: trialingSubscriptions,
      canceled: canceledSubscriptions,
      others: totalSubscriptions - activeSubscriptions - trialingSubscriptions - canceledSubscriptions
    };

    const subscriptionsByStatus = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        count,
        percentage: totalSubscriptions > 0 ? (count / totalSubscriptions) * 100 : 0
      }));

    const metrics: SubscriptionMetrics = {
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      canceledSubscriptions,
      totalRevenue: monthlyRecurringRevenue + annualRevenue,
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      churnRate,
      averageRevenuePerUser,
      customerLifetimeValue,
      recentSubscriptions,
      revenueByMonth,
      subscriptionsByStatus
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}