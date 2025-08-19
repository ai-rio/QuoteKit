/**
 * FB-021: Trend Analysis Service
 * 
 * Provides comprehensive trend analysis functionality for Formbricks analytics.
 * Implements time-series data processing, trend calculation algorithms,
 * cohort analysis, and automated insight generation.
 */

import { 
  FormbricksAnalyticsFilters, 
  FormbricksSurvey,
  FormbricksSurveyResponse} from './types';

// Trend Analysis Types
export interface TrendDataPoint {
  date: string;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number; // 0-100
  slope: number;
  correlation: number;
  seasonality?: {
    detected: boolean;
    period?: number;
    strength?: number;
  };
}

export interface CohortData {
  cohortId: string;
  cohortName: string;
  startDate: string;
  userCount: number;
  retentionRates: number[]; // Weekly retention rates
  completionRates: number[]; // Weekly completion rates
  avgResponseTime: number[];
}

export interface TrendInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
  data?: any;
  createdAt: string;
}

export interface TimeSeriesData {
  daily: TrendDataPoint[];
  weekly: TrendDataPoint[];
  monthly: TrendDataPoint[];
}

export class TrendAnalysisService {
  /**
   * Generate comprehensive trend analysis for survey responses
   */
  async analyzeTrends(
    responses: FormbricksSurveyResponse[],
    surveys: FormbricksSurvey[],
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<{
    responsesTrend: TimeSeriesData;
    completionTrend: TimeSeriesData;
    surveyPerformanceTrend: Array<{
      surveyId: string;
      surveyName: string;
      trend: TrendAnalysis;
      data: TrendDataPoint[];
    }>;
    insights: TrendInsight[];
  }> {
    // Process time-series data
    const responsesTrend = this.generateTimeSeriesData(responses, 'responses', timeframe);
    const completionTrend = this.generateTimeSeriesData(responses, 'completion', timeframe);
    
    // Analyze individual survey performance trends
    const surveyPerformanceTrend = surveys.map(survey => {
      const surveyResponses = responses.filter(r => r.surveyId === survey.id);
      const surveyData = this.generateTimeSeriesData(surveyResponses, 'responses', timeframe);
      const trend = this.calculateTrendAnalysis(surveyData.daily);
      
      return {
        surveyId: survey.id,
        surveyName: survey.name,
        trend,
        data: surveyData.daily
      };
    });

    // Generate automated insights
    const insights = await this.generateInsights(
      responsesTrend,
      completionTrend,
      surveyPerformanceTrend,
      responses,
      surveys
    );

    return {
      responsesTrend,
      completionTrend,
      surveyPerformanceTrend,
      insights
    };
  }

  /**
   * Perform cohort analysis on survey responses
   */
  async analyzeCohorts(
    responses: FormbricksSurveyResponse[],
    cohortType: 'weekly' | 'monthly' = 'weekly'
  ): Promise<CohortData[]> {
    const cohorts: Map<string, FormbricksSurveyResponse[]> = new Map();
    
    // Group responses into cohorts based on creation date
    responses.forEach(response => {
      const cohortKey = this.getCohortKey(new Date(response.createdAt), cohortType);
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, []);
      }
      cohorts.get(cohortKey)!.push(response);
    });

    // Calculate cohort metrics
    const cohortData: CohortData[] = [];
    
    for (const [cohortKey, cohortResponses] of cohorts.entries()) {
      const cohortStartDate = cohortResponses[0].createdAt;
      const userCount = new Set(cohortResponses.map(r => r.userId || r.personId || r.id)).size;
      
      // Calculate retention and completion rates over time
      const retentionRates = this.calculateRetentionRates(cohortResponses, cohortType);
      const completionRates = this.calculateCompletionRates(cohortResponses, cohortType);
      const avgResponseTime = this.calculateAvgResponseTime(cohortResponses, cohortType);
      
      cohortData.push({
        cohortId: cohortKey,
        cohortName: this.formatCohortName(cohortKey, cohortType),
        startDate: cohortStartDate,
        userCount,
        retentionRates,
        completionRates,
        avgResponseTime
      });
    }

    return cohortData.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  /**
   * Generate time-series data for different metrics
   */
  private generateTimeSeriesData(
    responses: FormbricksSurveyResponse[],
    metric: 'responses' | 'completion',
    timeframe: 'daily' | 'weekly' | 'monthly'
  ): TimeSeriesData {
    const daily = this.aggregateByPeriod(responses, metric, 'daily');
    const weekly = this.aggregateByPeriod(responses, metric, 'weekly');
    const monthly = this.aggregateByPeriod(responses, metric, 'monthly');

    return { daily, weekly, monthly };
  }

  /**
   * Aggregate responses by time period
   */
  private aggregateByPeriod(
    responses: FormbricksSurveyResponse[],
    metric: 'responses' | 'completion',
    period: 'daily' | 'weekly' | 'monthly'
  ): TrendDataPoint[] {
    const grouped: Map<string, FormbricksSurveyResponse[]> = new Map();
    
    responses.forEach(response => {
      const key = this.getPeriodKey(new Date(response.createdAt), period);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(response);
    });

    const dataPoints: TrendDataPoint[] = [];
    const sortedKeys = Array.from(grouped.keys()).sort();

    sortedKeys.forEach((key, index) => {
      const periodResponses = grouped.get(key)!;
      let value: number;

      if (metric === 'responses') {
        value = periodResponses.length;
      } else {
        // completion metric
        const completed = periodResponses.filter(r => r.finished).length;
        value = periodResponses.length > 0 ? (completed / periodResponses.length) * 100 : 0;
      }

      // Calculate change from previous period
      let change = 0;
      let changePercent = 0;
      
      if (index > 0) {
        const prevValue = dataPoints[index - 1].value;
        change = value - prevValue;
        changePercent = prevValue > 0 ? (change / prevValue) * 100 : 0;
      }

      dataPoints.push({
        date: key,
        value: Math.round(value * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100
      });
    });

    return dataPoints;
  }

  /**
   * Calculate trend analysis using linear regression and statistical methods
   */
  private calculateTrendAnalysis(data: TrendDataPoint[]): TrendAnalysis {
    if (data.length < 3) {
      return {
        trend: 'stable',
        strength: 'weak',
        confidence: 0,
        slope: 0,
        correlation: 0
      };
    }

    // Prepare data for linear regression
    const x = data.map((_, index) => index);
    const y = data.map(point => point.value);
    
    // Calculate linear regression
    const n = data.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate correlation coefficient
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    
    const correlation = denomX * denomY > 0 ? numerator / (denomX * denomY) : 0;
    
    // Determine trend direction and strength
    const absSlope = Math.abs(slope);
    const absCorrelation = Math.abs(correlation);
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (absSlope < 0.1 || absCorrelation < 0.3) {
      trend = 'stable';
    } else {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    }
    
    let strength: 'strong' | 'moderate' | 'weak';
    if (absCorrelation > 0.7) {
      strength = 'strong';
    } else if (absCorrelation > 0.4) {
      strength = 'moderate';
    } else {
      strength = 'weak';
    }
    
    const confidence = Math.round(absCorrelation * 100);
    
    // Detect seasonality (basic implementation)
    const seasonality = this.detectSeasonality(data);

    return {
      trend,
      strength,
      confidence,
      slope: Math.round(slope * 1000) / 1000,
      correlation: Math.round(correlation * 1000) / 1000,
      seasonality
    };
  }

  /**
   * Detect seasonal patterns in the data
   */
  private detectSeasonality(data: TrendDataPoint[]): { detected: boolean; period?: number; strength?: number } {
    if (data.length < 14) {
      return { detected: false };
    }

    // Simple autocorrelation-based seasonality detection
    const values = data.map(d => d.value);
    const maxLag = Math.min(Math.floor(data.length / 2), 30);
    
    let maxCorrelation = 0;
    let bestPeriod = 0;
    
    for (let lag = 2; lag <= maxLag; lag++) {
      const correlation = this.calculateAutocorrelation(values, lag);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = lag;
      }
    }
    
    const detected = maxCorrelation > 0.5;
    
    return {
      detected,
      period: detected ? bestPeriod : undefined,
      strength: detected ? Math.round(maxCorrelation * 100) / 100 : undefined
    };
  }

  /**
   * Calculate autocorrelation for seasonality detection
   */
  private calculateAutocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;
    
    const n = values.length - lag;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Generate automated insights from trend analysis
   */
  private async generateInsights(
    responsesTrend: TimeSeriesData,
    completionTrend: TimeSeriesData,
    surveyPerformanceTrend: Array<{ surveyId: string; surveyName: string; trend: TrendAnalysis; data: TrendDataPoint[] }>,
    responses: FormbricksSurveyResponse[],
    surveys: FormbricksSurvey[]
  ): Promise<TrendInsight[]> {
    const insights: TrendInsight[] = [];
    
    // Analyze overall response trends
    const responseTrendAnalysis = this.calculateTrendAnalysis(responsesTrend.daily);
    if (responseTrendAnalysis.confidence > 70) {
      insights.push({
        id: `response-trend-${Date.now()}`,
        type: responseTrendAnalysis.trend === 'decreasing' ? 'warning' : 'trend',
        title: `Response Volume ${responseTrendAnalysis.trend === 'increasing' ? 'Growing' : responseTrendAnalysis.trend === 'decreasing' ? 'Declining' : 'Stable'}`,
        description: `Survey responses are ${responseTrendAnalysis.trend} with ${responseTrendAnalysis.strength} confidence (${responseTrendAnalysis.confidence}%).`,
        impact: responseTrendAnalysis.strength === 'strong' ? 'high' : responseTrendAnalysis.strength === 'moderate' ? 'medium' : 'low',
        confidence: responseTrendAnalysis.confidence,
        actionable: responseTrendAnalysis.trend === 'decreasing',
        recommendations: responseTrendAnalysis.trend === 'decreasing' ? [
          'Review survey placement and timing',
          'Consider incentivizing survey completion',
          'Analyze user feedback for survey fatigue'
        ] : undefined,
        createdAt: new Date().toISOString()
      });
    }

    // Analyze completion rate trends
    const completionTrendAnalysis = this.calculateTrendAnalysis(completionTrend.daily);
    if (completionTrendAnalysis.confidence > 60) {
      insights.push({
        id: `completion-trend-${Date.now()}`,
        type: completionTrendAnalysis.trend === 'decreasing' ? 'warning' : 'opportunity',
        title: `Completion Rate ${completionTrendAnalysis.trend === 'increasing' ? 'Improving' : completionTrendAnalysis.trend === 'decreasing' ? 'Declining' : 'Stable'}`,
        description: `Survey completion rates are ${completionTrendAnalysis.trend} with ${completionTrendAnalysis.strength} strength.`,
        impact: 'medium',
        confidence: completionTrendAnalysis.confidence,
        actionable: true,
        recommendations: completionTrendAnalysis.trend === 'decreasing' ? [
          'Shorten survey length',
          'Improve question clarity',
          'Add progress indicators'
        ] : [
          'Maintain current survey design',
          'Consider expanding survey reach'
        ],
        createdAt: new Date().toISOString()
      });
    }

    // Analyze individual survey performance
    surveyPerformanceTrend.forEach(survey => {
      if (survey.trend.confidence > 50 && survey.trend.trend !== 'stable') {
        insights.push({
          id: `survey-${survey.surveyId}-trend-${Date.now()}`,
          type: survey.trend.trend === 'decreasing' ? 'warning' : 'opportunity',
          title: `${survey.surveyName} Performance ${survey.trend.trend === 'increasing' ? 'Improving' : 'Declining'}`,
          description: `This survey shows a ${survey.trend.strength} ${survey.trend.trend} trend.`,
          impact: survey.trend.strength === 'strong' ? 'high' : 'medium',
          confidence: survey.trend.confidence,
          actionable: true,
          data: { surveyId: survey.surveyId, trend: survey.trend },
          createdAt: new Date().toISOString()
        });
      }
    });

    // Detect anomalies in recent data
    const recentAnomalies = this.detectAnomalies(responsesTrend.daily.slice(-7)); // Last 7 days
    recentAnomalies.forEach(anomaly => {
      insights.push({
        id: `anomaly-${Date.now()}-${Math.random()}`,
        type: 'anomaly',
        title: 'Unusual Response Pattern Detected',
        description: `Detected ${anomaly.type} in response volume on ${anomaly.date}.`,
        impact: 'medium',
        confidence: anomaly.confidence,
        actionable: true,
        recommendations: [
          'Investigate potential causes',
          'Check for technical issues',
          'Review user feedback'
        ],
        data: anomaly,
        createdAt: new Date().toISOString()
      });
    });

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect anomalies in trend data
   */
  private detectAnomalies(data: TrendDataPoint[]): Array<{
    date: string;
    type: 'spike' | 'drop';
    confidence: number;
    value: number;
    expected: number;
  }> {
    if (data.length < 5) return [];
    
    const anomalies: Array<{
      date: string;
      type: 'spike' | 'drop';
      confidence: number;
      value: number;
      expected: number;
    }> = [];
    
    // Calculate moving average and standard deviation
    const windowSize = Math.min(5, data.length - 1);
    
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const mean = window.reduce((sum, point) => sum + point.value, 0) / window.length;
      const variance = window.reduce((sum, point) => sum + Math.pow(point.value - mean, 2), 0) / window.length;
      const stdDev = Math.sqrt(variance);
      
      const currentValue = data[i].value;
      const zScore = stdDev > 0 ? Math.abs(currentValue - mean) / stdDev : 0;
      
      // Detect anomalies (z-score > 2)
      if (zScore > 2) {
        anomalies.push({
          date: data[i].date,
          type: currentValue > mean ? 'spike' : 'drop',
          confidence: Math.min(95, Math.round(zScore * 30)),
          value: currentValue,
          expected: Math.round(mean * 100) / 100
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Calculate retention rates for cohort analysis
   */
  private calculateRetentionRates(responses: FormbricksSurveyResponse[], cohortType: 'weekly' | 'monthly'): number[] {
    // Group responses by user and time period
    const userActivity: Map<string, Set<string>> = new Map();
    
    responses.forEach(response => {
      const userId = response.userId || response.personId || response.id;
      const periodKey = this.getPeriodKey(new Date(response.createdAt), cohortType);
      
      if (!userActivity.has(userId)) {
        userActivity.set(userId, new Set());
      }
      userActivity.get(userId)!.add(periodKey);
    });
    
    // Calculate retention rates for each period
    const totalUsers = userActivity.size;
    const periods = Array.from(new Set(responses.map(r => 
      this.getPeriodKey(new Date(r.createdAt), cohortType)
    ))).sort();
    
    const retentionRates: number[] = [];
    
    periods.forEach((period, index) => {
      const activeUsers = Array.from(userActivity.values()).filter(userPeriods => 
        userPeriods.has(period)
      ).length;
      
      const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
      retentionRates.push(Math.round(retentionRate * 100) / 100);
    });
    
    return retentionRates;
  }

  /**
   * Calculate completion rates for cohort analysis
   */
  private calculateCompletionRates(responses: FormbricksSurveyResponse[], cohortType: 'weekly' | 'monthly'): number[] {
    const periodGroups: Map<string, FormbricksSurveyResponse[]> = new Map();
    
    responses.forEach(response => {
      const periodKey = this.getPeriodKey(new Date(response.createdAt), cohortType);
      if (!periodGroups.has(periodKey)) {
        periodGroups.set(periodKey, []);
      }
      periodGroups.get(periodKey)!.push(response);
    });
    
    const completionRates: number[] = [];
    
    Array.from(periodGroups.keys()).sort().forEach(period => {
      const periodResponses = periodGroups.get(period)!;
      const completed = periodResponses.filter(r => r.finished).length;
      const completionRate = periodResponses.length > 0 ? (completed / periodResponses.length) * 100 : 0;
      completionRates.push(Math.round(completionRate * 100) / 100);
    });
    
    return completionRates;
  }

  /**
   * Calculate average response time for cohort analysis
   */
  private calculateAvgResponseTime(responses: FormbricksSurveyResponse[], cohortType: 'weekly' | 'monthly'): number[] {
    const periodGroups: Map<string, number[]> = new Map();
    
    responses.forEach(response => {
      const periodKey = this.getPeriodKey(new Date(response.createdAt), cohortType);
      // Calculate estimated response time based on survey complexity or use default
      const responseTime = 120; // Default 2 minutes - could be enhanced with actual timing data
      
      if (!periodGroups.has(periodKey)) {
        periodGroups.set(periodKey, []);
      }
      periodGroups.get(periodKey)!.push(responseTime);
    });
    
    const avgResponseTimes: number[] = [];
    
    Array.from(periodGroups.keys()).sort().forEach(period => {
      const times = periodGroups.get(period)!;
      const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      avgResponseTimes.push(Math.round(avgTime * 100) / 100);
    });
    
    return avgResponseTimes;
  }

  /**
   * Get period key for grouping data
   */
  private getPeriodKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    switch (period) {
      case 'daily':
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
      case 'monthly':
        return `${year}-${String(month + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  /**
   * Get cohort key for grouping users
   */
  private getCohortKey(date: Date, cohortType: 'weekly' | 'monthly'): string {
    if (cohortType === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  /**
   * Format cohort name for display
   */
  private formatCohortName(cohortKey: string, cohortType: 'weekly' | 'monthly'): string {
    if (cohortType === 'weekly') {
      const [year, week] = cohortKey.split('-W');
      return `Week ${week}, ${year}`;
    } else {
      const [year, month] = cohortKey.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
  }

  /**
   * Public method to calculate trend analysis (exposed for components)
   */
  public calculateTrend(data: TrendDataPoint[]): TrendAnalysis {
    return this.calculateTrendAnalysis(data);
  }
}

// Singleton instance
export const trendAnalysisService = new TrendAnalysisService();
