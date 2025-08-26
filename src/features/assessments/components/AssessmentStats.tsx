'use client';

import { BarChart3, Calendar, CheckCircle, Clock, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { PropertyAssessment } from '../types';

interface AssessmentStatsProps {
  assessments: PropertyAssessment[];
}

export function AssessmentStats({ assessments }: AssessmentStatsProps) {
  const stats = useMemo(() => {
    const total = assessments.length;
    const completed = assessments.filter(a => a.assessment_status === 'completed').length;
    const inProgress = assessments.filter(a => a.assessment_status === 'in_progress').length;
    const scheduled = assessments.filter(a => a.assessment_status === 'scheduled').length;
    const withQuotes = assessments.filter(a => a.quote_id).length;
    
    const totalEstimatedValue = assessments
      .filter(a => a.estimated_total_cost)
      .reduce((sum, a) => sum + (a.estimated_total_cost || 0), 0);
    
    const averageValue = totalEstimatedValue > 0 ? totalEstimatedValue / assessments.filter(a => a.estimated_total_cost).length : 0;
    
    const conversionRate = total > 0 ? (withQuotes / total) * 100 : 0;

    // This week's assessments
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = assessments.filter(a => new Date(a.assessment_date) >= oneWeekAgo).length;

    return {
      total,
      completed,
      inProgress,
      scheduled,
      withQuotes,
      totalEstimatedValue,
      averageValue,
      conversionRate,
      thisWeek
    };
  }, [assessments]);

  const statCards = [
    {
      title: 'Total Assessments',
      value: stats.total,
      icon: FileText,
      color: 'text-forest-green',
      bgColor: 'bg-forest-green/10'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Scheduled',
      value: stats.scheduled,
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Total Est. Value',
      value: `$${stats.totalEstimatedValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Avg. Assessment Value',
      value: `$${stats.averageValue.toLocaleString()}`,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Quote Conversion',
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'This Week',
      value: stats.thisWeek,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-paper-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
