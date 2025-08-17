/**
 * Formbricks Data Aggregation Engine
 * FB-014: Implement Analytics Data Fetching
 * 
 * This module provides sophisticated data processing and aggregation for 
 * survey response analytics with real-time insights generation.
 */

import {
  FormbricksAnalyticsData,
  FormbricksQuestion,
  FormbricksSurvey,
  FormbricksSurveyResponse,
  QuoteWorkflowAnalytics,
  QuoteWorkflowSession,
} from './types';

export interface AggregationOptions {
  groupBy?: 'day' | 'week' | 'month' | 'survey' | 'question';
  timeZone?: string;
  includeIncomplete?: boolean;
  minResponseThreshold?: number;
}

export interface ResponseAnalytics {
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  averageResponseTime: number;
  dropoffPoints: Array<{
    questionId: string;
    questionText: string;
    dropoffRate: number;
  }>;
  popularChoices: Array<{
    questionId: string;
    choice: string;
    count: number;
    percentage: number;
  }>;
}

export interface SurveyAnalytics {
  survey: FormbricksSurvey;
  responses: FormbricksSurveyResponse[];
  analytics: ResponseAnalytics;
  questionAnalytics: QuestionAnalytics[];
  trends: TrendData[];
}

export interface QuestionAnalytics {
  question: FormbricksQuestion;
  responseCount: number;
  skipCount: number;
  averageScore?: number;
  distribution: Array<{
    value: string | number;
    count: number;
    percentage: number;
  }>;
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface TrendData {
  date: string;
  value: number;
  change: number;
  changePercentage: number;
}

export interface QuoteCreationInsights {
  totalQuoteCreations: number;
  surveyTriggerRate: number;
  surveyCompletionRate: number;
  averageComplexityScore: number;
  workflowAnalytics: QuoteWorkflowAnalytics;
  satisfactionTrends: TrendData[];
  improvementAreas: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    impactScore: number;
  }>;
}

/**
 * Advanced Data Aggregation Engine
 */
export class FormbricksDataAggregator {
  private options: AggregationOptions;

  constructor(options: AggregationOptions = {}) {
    this.options = {
      groupBy: 'day',
      timeZone: 'UTC',
      includeIncomplete: false,
      minResponseThreshold: 5,
      ...options,
    };

    console.log('🔧 FormbricksDataAggregator initialized:', this.options);
  }

  /**
   * Process and aggregate survey analytics data
   */
  aggregateAnalyticsData(
    surveys: FormbricksSurvey[],
    responses: FormbricksSurveyResponse[]
  ): FormbricksAnalyticsData {
    console.log('📊 Starting data aggregation:', {
      surveysCount: surveys.length,
      responsesCount: responses.length,
    });

    const metrics = this.calculateAdvancedMetrics(surveys, responses);
    const responsesByPeriod = this.generateResponsesByPeriod(responses);
    const completionRates = this.calculateCompletionRates(surveys, responses);

    const aggregatedData: FormbricksAnalyticsData = {
      surveys,
      responses: this.options.includeIncomplete 
        ? responses 
        : responses.filter(r => r.finished),
      metrics,
      responsesByPeriod,
      completionRates,
    };

    console.log('✅ Data aggregation complete:', {
      totalResponses: aggregatedData.responses.length,
      averageCompletionRate: metrics.averageCompletionRate,
      activeSurveys: metrics.activeSurveys,
    });

    return aggregatedData;
  }

  /**
   * Generate comprehensive survey analytics
   */
  generateSurveyAnalytics(
    survey: FormbricksSurvey,
    responses: FormbricksSurveyResponse[]
  ): SurveyAnalytics {
    console.log('📋 Generating survey analytics for:', survey.name);

    const surveyResponses = responses.filter(r => r.surveyId === survey.id);
    const analytics = this.calculateResponseAnalytics(surveyResponses, survey.questions);
    const questionAnalytics = this.generateQuestionAnalytics(survey.questions, surveyResponses);
    const trends = this.generateTrendData(surveyResponses);

    return {
      survey,
      responses: surveyResponses,
      analytics,
      questionAnalytics,
      trends,
    };
  }

  /**
   * Generate question-specific analytics
   */
  generateQuestionAnalytics(
    questions: FormbricksQuestion[],
    responses: FormbricksSurveyResponse[]
  ): QuestionAnalytics[] {
    return questions.map(question => {
      console.log('❓ Analyzing question:', question.headline);

      const questionResponses = this.extractQuestionResponses(question.id, responses);
      const responseCount = questionResponses.length;
      const skipCount = responses.length - responseCount;

      const distribution = this.calculateDistribution(question, questionResponses);
      const averageScore = this.calculateAverageScore(question, questionResponses);
      const sentiment = this.analyzeSentiment(question, questionResponses);

      return {
        question,
        responseCount,
        skipCount,
        averageScore,
        distribution,
        sentiment,
      };
    });
  }

  /**
   * Generate insights specific to quote creation workflow
   */
  generateQuoteCreationInsights(
    responses: FormbricksSurveyResponse[],
    workflowSessions: QuoteWorkflowSession[] = []
  ): QuoteCreationInsights {
    console.log('🏗️ Generating quote creation insights...');

    // Filter responses related to quote creation
    const quoteResponses = responses.filter(r => 
      r.data && (
        r.data.quoteId ||
        r.data.complexity ||
        r.data.surveyType?.includes('quote')
      )
    );

    const totalQuoteCreations = new Set(
      quoteResponses.map(r => r.data?.quoteId).filter(Boolean)
    ).size;

    const surveyTriggerRate = workflowSessions.length > 0 
      ? quoteResponses.length / workflowSessions.length 
      : 0;

    const surveyCompletionRate = quoteResponses.length > 0
      ? quoteResponses.filter(r => r.finished).length / quoteResponses.length
      : 0;

    const complexityScores = quoteResponses
      .map(r => r.data?.complexityScore)
      .filter(Boolean) as number[];

    const averageComplexityScore = complexityScores.length > 0
      ? complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length
      : 0;

    const workflowAnalytics = this.calculateWorkflowAnalytics(workflowSessions);
    const satisfactionTrends = this.generateSatisfactionTrends(quoteResponses);
    const improvementAreas = this.identifyImprovementAreas(quoteResponses, workflowAnalytics);

    return {
      totalQuoteCreations,
      surveyTriggerRate: Math.round(surveyTriggerRate * 1000) / 1000,
      surveyCompletionRate: Math.round(surveyCompletionRate * 1000) / 1000,
      averageComplexityScore: Math.round(averageComplexityScore * 100) / 100,
      workflowAnalytics,
      satisfactionTrends,
      improvementAreas,
    };
  }

  /**
   * Calculate advanced metrics with additional insights
   */
  private calculateAdvancedMetrics(
    surveys: FormbricksSurvey[],
    responses: FormbricksSurveyResponse[]
  ) {
    const totalSurveys = surveys.length;
    const activeSurveys = surveys.filter(s => s.status === 'inProgress').length;
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.finished).length;

    // Calculate response rate (responses per survey)
    const responseRate = totalSurveys > 0 ? totalResponses / totalSurveys : 0;

    // Calculate average completion rate across all surveys
    const completionRates = surveys.map(survey => {
      const surveyResponses = responses.filter(r => r.surveyId === survey.id);
      const completed = surveyResponses.filter(r => r.finished).length;
      return surveyResponses.length > 0 ? completed / surveyResponses.length : 0;
    });

    const averageCompletionRate = completionRates.length > 0
      ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
      : 0;

    return {
      totalSurveys,
      totalResponses,
      averageCompletionRate: Math.round(averageCompletionRate * 10000) / 100, // Percentage with 2 decimals
      responseRate: Math.round(responseRate * 100) / 100,
      activeSurveys,
    };
  }

  /**
   * Generate responses grouped by time period
   */
  private generateResponsesByPeriod(responses: FormbricksSurveyResponse[]) {
    const groupedResponses = new Map<string, number>();

    responses.forEach(response => {
      const date = new Date(response.createdAt);
      const key = this.formatDateKey(date);
      groupedResponses.set(key, (groupedResponses.get(key) || 0) + 1);
    });

    return Array.from(groupedResponses.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate completion rates with detailed analysis
   */
  private calculateCompletionRates(
    surveys: FormbricksSurvey[],
    responses: FormbricksSurveyResponse[]
  ) {
    return surveys.map(survey => {
      const surveyResponses = responses.filter(r => r.surveyId === survey.id);
      const completedResponses = surveyResponses.filter(r => r.finished);
      
      const completionRate = surveyResponses.length > 0
        ? (completedResponses.length / surveyResponses.length) * 100
        : 0;

      return {
        surveyId: survey.id,
        surveyName: survey.name,
        completionRate: Math.round(completionRate * 100) / 100,
        totalResponses: surveyResponses.length,
        completedResponses: completedResponses.length,
      };
    });
  }

  /**
   * Calculate response analytics for a set of responses
   */
  private calculateResponseAnalytics(
    responses: FormbricksSurveyResponse[],
    questions: FormbricksQuestion[]
  ): ResponseAnalytics {
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.finished).length;
    const completionRate = totalResponses > 0 ? completedResponses / totalResponses : 0;

    // Calculate average response time (if available in metadata)
    const responseTimes = responses
      .map(r => (r.meta as any)?.responseTime)
      .filter(Boolean) as number[];
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    // Calculate dropoff points
    const dropoffPoints = this.calculateDropoffPoints(questions, responses);

    // Calculate popular choices
    const popularChoices = this.calculatePopularChoices(questions, responses);

    return {
      totalResponses,
      completedResponses,
      completionRate: Math.round(completionRate * 10000) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      dropoffPoints,
      popularChoices,
    };
  }

  /**
   * Extract responses for a specific question
   */
  private extractQuestionResponses(questionId: string, responses: FormbricksSurveyResponse[]) {
    return responses
      .map(response => response.data[questionId])
      .filter(answer => answer !== undefined && answer !== null && answer !== '');
  }

  /**
   * Calculate distribution of answers for a question
   */
  private calculateDistribution(question: FormbricksQuestion, answers: any[]) {
    const distribution = new Map<string, number>();

    answers.forEach(answer => {
      const key = this.normalizeAnswer(answer);
      distribution.set(key, (distribution.get(key) || 0) + 1);
    });

    const total = answers.length;
    return Array.from(distribution.entries())
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate average score for rating/NPS questions
   */
  private calculateAverageScore(question: FormbricksQuestion, answers: any[]): number | undefined {
    if (question.type !== 'rating' && question.type !== 'nps') {
      return undefined;
    }

    const numericAnswers = answers
      .map(answer => typeof answer === 'number' ? answer : parseFloat(answer))
      .filter(num => !isNaN(num));

    if (numericAnswers.length === 0) {
      return undefined;
    }

    const average = numericAnswers.reduce((sum, num) => sum + num, 0) / numericAnswers.length;
    return Math.round(average * 100) / 100;
  }

  /**
   * Analyze sentiment for open text responses
   */
  private analyzeSentiment(question: FormbricksQuestion, answers: any[]) {
    if (question.type !== 'openText') {
      return undefined;
    }

    // Simple sentiment analysis based on keywords
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    const positiveKeywords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'wonderful', 'fantastic'];
    const negativeKeywords = ['terrible', 'awful', 'hate', 'horrible', 'bad', 'poor', 'disappointing'];

    answers.forEach(answer => {
      if (typeof answer !== 'string') return;
      
      const text = answer.toLowerCase();
      const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
      const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));

      if (hasPositive && !hasNegative) {
        positive++;
      } else if (hasNegative && !hasPositive) {
        negative++;
      } else {
        neutral++;
      }
    });

    const total = answers.length;
    return {
      positive: total > 0 ? Math.round((positive / total) * 10000) / 100 : 0,
      neutral: total > 0 ? Math.round((neutral / total) * 10000) / 100 : 0,
      negative: total > 0 ? Math.round((negative / total) * 10000) / 100 : 0,
    };
  }

  /**
   * Generate trend data over time
   */
  private generateTrendData(responses: FormbricksSurveyResponse[]): TrendData[] {
    const grouped = this.groupResponsesByPeriod(responses);
    const trends: TrendData[] = [];

    const sortedDates = Array.from(grouped.keys()).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const value = grouped.get(date) || 0;
      const previousValue = i > 0 ? (grouped.get(sortedDates[i - 1]) || 0) : 0;
      
      const change = value - previousValue;
      const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0;

      trends.push({
        date,
        value,
        change,
        changePercentage: Math.round(changePercentage * 100) / 100,
      });
    }

    return trends;
  }

  /**
   * Calculate workflow analytics from session data
   */
  private calculateWorkflowAnalytics(sessions: QuoteWorkflowSession[]): QuoteWorkflowAnalytics {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed).length;
    const abandonedSessions = sessions.filter(s => s.abandoned).length;

    const conversionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

    const durations = sessions
      .filter(s => s.totalDuration)
      .map(s => s.totalDuration!);
    
    const averageDuration = durations.length > 0
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;

    // Calculate step completion rates and durations
    const stepCompletionRates: Record<string, number> = {};
    const averageStepDurations: Record<string, number> = {};
    const abandonmentPoints: Record<string, number> = {};
    const errorRates: Record<string, number> = {};

    const steps = ['client_selection', 'item_addition', 'item_configuration', 'pricing_setup', 'preview', 'finalization'];

    steps.forEach(step => {
      const stepSessions = sessions.filter(s => s.steps.some(st => st.step === step));
      const completedSteps = stepSessions.filter(s => 
        s.steps.find(st => st.step === step)?.completed
      );
      
      stepCompletionRates[step] = stepSessions.length > 0 
        ? completedSteps.length / stepSessions.length 
        : 0;

      const stepDurations = sessions
        .flatMap(s => s.steps)
        .filter(st => st.step === step && st.endTime && st.startTime)
        .map(st => st.endTime! - st.startTime);
      
      averageStepDurations[step] = stepDurations.length > 0
        ? stepDurations.reduce((sum, duration) => sum + duration, 0) / stepDurations.length
        : 0;

      const abandonedAtStep = sessions.filter(s => s.abandonnmentPoint === step).length;
      abandonmentPoints[step] = totalSessions > 0 ? abandonedAtStep / totalSessions : 0;

      const errorsAtStep = sessions
        .flatMap(s => s.steps)
        .filter(st => st.step === step && st.errorOccurred).length;
      
      errorRates[step] = stepSessions.length > 0 ? errorsAtStep / stepSessions.length : 0;
    });

    return {
      totalSessions,
      completedSessions,
      abandonedSessions,
      conversionRate: Math.round(conversionRate * 10000) / 100,
      averageDuration: Math.round(averageDuration),
      stepCompletionRates,
      averageStepDurations,
      abandonmentPoints,
      errorRates,
    };
  }

  /**
   * Helper methods
   */
  private formatDateKey(date: Date): string {
    switch (this.options.groupBy) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private normalizeAnswer(answer: any): string {
    if (typeof answer === 'object') {
      return JSON.stringify(answer);
    }
    return String(answer);
  }

  private groupResponsesByPeriod(responses: FormbricksSurveyResponse[]): Map<string, number> {
    const grouped = new Map<string, number>();

    responses.forEach(response => {
      const date = new Date(response.createdAt);
      const key = this.formatDateKey(date);
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return grouped;
  }

  private calculateDropoffPoints(
    questions: FormbricksQuestion[],
    responses: FormbricksSurveyResponse[]
  ) {
    return questions.map(question => {
      const answered = responses.filter(r => r.data[question.id] !== undefined).length;
      const dropoffRate = responses.length > 0 ? 1 - (answered / responses.length) : 0;

      return {
        questionId: question.id,
        questionText: question.headline,
        dropoffRate: Math.round(dropoffRate * 10000) / 100,
      };
    });
  }

  private calculatePopularChoices(
    questions: FormbricksQuestion[],
    responses: FormbricksSurveyResponse[]
  ) {
    const choices: Array<{
      questionId: string;
      choice: string;
      count: number;
      percentage: number;
    }> = [];

    questions.forEach(question => {
      if (question.choices) {
        const answers = this.extractQuestionResponses(question.id, responses);
        const distribution = this.calculateDistribution(question, answers);
        
        distribution.forEach(item => {
          choices.push({
            questionId: question.id,
            choice: item.value,
            count: item.count,
            percentage: item.percentage,
          });
        });
      }
    });

    return choices.sort((a, b) => b.count - a.count).slice(0, 10);
  }

  private generateSatisfactionTrends(responses: FormbricksSurveyResponse[]): TrendData[] {
    // Filter for satisfaction-related responses
    const satisfactionResponses = responses.filter(r => 
      r.data && Object.keys(r.data).some(key => 
        key.toLowerCase().includes('satisfaction') ||
        key.toLowerCase().includes('rating') ||
        key.toLowerCase().includes('score')
      )
    );

    return this.generateTrendData(satisfactionResponses);
  }

  private identifyImprovementAreas(
    responses: FormbricksSurveyResponse[],
    workflowAnalytics: QuoteWorkflowAnalytics
  ) {
    const areas = [];

    // Check for high abandonment points
    Object.entries(workflowAnalytics.abandonmentPoints).forEach(([step, rate]) => {
      if (rate > 0.2) { // 20% abandonment threshold
        areas.push({
          area: `${step.replace('_', ' ')} workflow step`,
          priority: rate > 0.4 ? 'high' : 'medium' as 'high' | 'medium' | 'low',
          suggestion: `Reduce friction in ${step.replace('_', ' ')} step`,
          impactScore: Math.round(rate * 100),
        });
      }
    });

    // Check for low completion rates
    if (workflowAnalytics.conversionRate < 70) {
      areas.push({
        area: 'Overall workflow conversion',
        priority: 'high' as 'high' | 'medium' | 'low',
        suggestion: 'Optimize end-to-end quote creation flow',
        impactScore: 100 - workflowAnalytics.conversionRate,
      });
    }

    return areas.sort((a, b) => b.impactScore - a.impactScore);
  }
}

/**
 * Create configured data aggregator
 */
export function createDataAggregator(options?: AggregationOptions): FormbricksDataAggregator {
  return new FormbricksDataAggregator(options);
}