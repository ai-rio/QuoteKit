# Monitoring and Analytics

## Overview

This document outlines the comprehensive monitoring and analytics strategy for the Formbricks integration, covering performance monitoring, user behavior analytics, survey effectiveness tracking, and business impact measurement.

## Key Metrics and KPIs

### 1. Technical Performance Metrics

#### SDK Performance
- **Initialization Time**: Time to load and initialize Formbricks SDK
- **Bundle Size Impact**: Additional JavaScript bundle size
- **Page Load Impact**: Effect on overall page load times
- **Memory Usage**: JavaScript heap usage by Formbricks components
- **Error Rate**: JavaScript errors related to Formbricks integration

#### API Performance
- **Response Time**: Average API response time for Formbricks requests
- **Success Rate**: Percentage of successful API calls
- **Timeout Rate**: Percentage of requests that timeout
- **Rate Limiting**: Frequency of rate limit hits

### 2. User Engagement Metrics

#### Survey Metrics
- **Survey Impression Rate**: Percentage of eligible users who see surveys
- **Survey Completion Rate**: Percentage of users who complete surveys
- **Survey Abandonment Rate**: Percentage of users who start but don't finish
- **Time to Complete**: Average time users take to complete surveys
- **Response Quality**: Percentage of meaningful responses vs. random/empty

#### Widget Metrics
- **Widget Visibility Rate**: How often feedback widgets are shown
- **Widget Click Rate**: Percentage of users who click feedback widgets
- **Widget Dismissal Rate**: Percentage of users who dismiss widgets
- **Widget Persistence**: How long widgets remain visible before interaction

### 3. Business Impact Metrics

#### Product Insights
- **Feature Satisfaction Scores**: User satisfaction ratings for different features
- **Pain Point Identification**: Frequency of reported issues by category
- **Feature Request Volume**: Number and type of feature requests
- **User Sentiment Trends**: Overall sentiment analysis over time

#### Conversion Impact
- **Feedback-Driven Improvements**: Number of product changes based on feedback
- **Conversion Rate Changes**: Impact on free-to-premium conversion
- **Churn Reduction**: Impact on user retention rates
- **Support Ticket Reduction**: Decrease in support requests for improved areas

## Monitoring Implementation

### 1. Performance Monitoring Service

```typescript
// lib/monitoring/performance-monitor.ts
export class FormbricksPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static startTimes: Map<string, number> = new Map();

  static startTimer(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  static endTimer(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.recordMetric(operation, duration);
    this.startTimes.delete(operation);
    
    return duration;
  }

  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }

    // Send to analytics service
    this.sendToAnalytics(name, value);
  }

  static getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static getMetricPercentile(name: string, percentile: number): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private static sendToAnalytics(name: string, value: number): void {
    // Send to your analytics service (Google Analytics, Mixpanel, etc.)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'formbricks_performance', {
        metric_name: name,
        metric_value: Math.round(value),
        timestamp: Date.now(),
      });
    }
  }

  static generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      metrics: {},
    };

    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        report.metrics[name] = {
          average: this.getAverageMetric(name),
          p50: this.getMetricPercentile(name, 50),
          p95: this.getMetricPercentile(name, 95),
          p99: this.getMetricPercentile(name, 99),
          count: values.length,
        };
      }
    }

    return report;
  }
}

interface PerformanceReport {
  timestamp: string;
  metrics: Record<string, {
    average: number;
    p50: number;
    p95: number;
    p99: number;
    count: number;
  }>;
}
```

### 2. User Behavior Analytics

```typescript
// lib/analytics/behavior-tracker.ts
export class BehaviorTracker {
  private static events: AnalyticsEvent[] = [];
  private static sessionId: string = this.generateSessionId();

  static trackSurveyImpression(surveyId: string, context: Record<string, any>): void {
    this.trackEvent('survey_impression', {
      survey_id: surveyId,
      context,
      timestamp: Date.now(),
    });
  }

  static trackSurveyStart(surveyId: string, context: Record<string, any>): void {
    this.trackEvent('survey_start', {
      survey_id: surveyId,
      context,
      timestamp: Date.now(),
    });
  }

  static trackSurveyComplete(
    surveyId: string, 
    responses: Record<string, any>,
    completionTime: number
  ): void {
    this.trackEvent('survey_complete', {
      survey_id: surveyId,
      responses,
      completion_time: completionTime,
      timestamp: Date.now(),
    });
  }

  static trackSurveyAbandon(
    surveyId: string, 
    lastQuestionIndex: number,
    timeSpent: number
  ): void {
    this.trackEvent('survey_abandon', {
      survey_id: surveyId,
      last_question_index: lastQuestionIndex,
      time_spent: timeSpent,
      timestamp: Date.now(),
    });
  }

  static trackWidgetInteraction(
    action: 'show' | 'click' | 'dismiss',
    widgetType: string,
    context: Record<string, any>
  ): void {
    this.trackEvent('widget_interaction', {
      action,
      widget_type: widgetType,
      context,
      timestamp: Date.now(),
    });
  }

  private static trackEvent(eventName: string, properties: Record<string, any>): void {
    const event: AnalyticsEvent = {
      event_name: eventName,
      session_id: this.sessionId,
      user_id: this.getCurrentUserId(),
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);
    this.sendEventToAnalytics(event);

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  private static sendEventToAnalytics(event: AnalyticsEvent): void {
    // Send to multiple analytics services
    this.sendToGoogleAnalytics(event);
    this.sendToMixpanel(event);
    this.sendToCustomAnalytics(event);
  }

  private static sendToGoogleAnalytics(event: AnalyticsEvent): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.event_name, {
        session_id: event.session_id,
        user_id: event.user_id,
        ...event.properties,
      });
    }
  }

  private static sendToMixpanel(event: AnalyticsEvent): void {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.track(event.event_name, {
        session_id: event.session_id,
        user_id: event.user_id,
        ...event.properties,
      });
    }
  }

  private static sendToCustomAnalytics(event: AnalyticsEvent): void {
    // Send to your custom analytics endpoint
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(error => {
      console.error('Failed to send analytics event:', error);
    });
  }

  private static getCurrentUserId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id');
    }
    return null;
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getSessionEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  static generateBehaviorReport(): BehaviorReport {
    const events = this.getSessionEvents();
    
    return {
      session_id: this.sessionId,
      total_events: events.length,
      event_breakdown: this.getEventBreakdown(events),
      survey_funnel: this.calculateSurveyFunnel(events),
      widget_engagement: this.calculateWidgetEngagement(events),
      timestamp: new Date().toISOString(),
    };
  }

  private static getEventBreakdown(events: AnalyticsEvent[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    events.forEach(event => {
      breakdown[event.event_name] = (breakdown[event.event_name] || 0) + 1;
    });
    
    return breakdown;
  }

  private static calculateSurveyFunnel(events: AnalyticsEvent[]): SurveyFunnel {
    const impressions = events.filter(e => e.event_name === 'survey_impression').length;
    const starts = events.filter(e => e.event_name === 'survey_start').length;
    const completions = events.filter(e => e.event_name === 'survey_complete').length;
    const abandons = events.filter(e => e.event_name === 'survey_abandon').length;

    return {
      impressions,
      starts,
      completions,
      abandons,
      impression_to_start_rate: impressions > 0 ? starts / impressions : 0,
      start_to_completion_rate: starts > 0 ? completions / starts : 0,
      abandonment_rate: starts > 0 ? abandons / starts : 0,
    };
  }

  private static calculateWidgetEngagement(events: AnalyticsEvent[]): WidgetEngagement {
    const widgetEvents = events.filter(e => e.event_name === 'widget_interaction');
    
    const shows = widgetEvents.filter(e => e.properties.action === 'show').length;
    const clicks = widgetEvents.filter(e => e.properties.action === 'click').length;
    const dismissals = widgetEvents.filter(e => e.properties.action === 'dismiss').length;

    return {
      shows,
      clicks,
      dismissals,
      click_through_rate: shows > 0 ? clicks / shows : 0,
      dismissal_rate: shows > 0 ? dismissals / shows : 0,
    };
  }
}

interface AnalyticsEvent {
  event_name: string;
  session_id: string;
  user_id: string | null;
  properties: Record<string, any>;
  timestamp: number;
}

interface BehaviorReport {
  session_id: string;
  total_events: number;
  event_breakdown: Record<string, number>;
  survey_funnel: SurveyFunnel;
  widget_engagement: WidgetEngagement;
  timestamp: string;
}

interface SurveyFunnel {
  impressions: number;
  starts: number;
  completions: number;
  abandons: number;
  impression_to_start_rate: number;
  start_to_completion_rate: number;
  abandonment_rate: number;
}

interface WidgetEngagement {
  shows: number;
  clicks: number;
  dismissals: number;
  click_through_rate: number;
  dismissal_rate: number;
}
```

### 3. Survey Effectiveness Tracking

```typescript
// lib/analytics/survey-effectiveness.ts
export class SurveyEffectivenessTracker {
  static async analyzeSurveyPerformance(surveyId: string): Promise<SurveyAnalysis> {
    const responses = await this.getSurveyResponses(surveyId);
    const metadata = await this.getSurveyMetadata(surveyId);

    return {
      survey_id: surveyId,
      total_responses: responses.length,
      completion_rate: this.calculateCompletionRate(surveyId),
      average_completion_time: this.calculateAverageCompletionTime(responses),
      response_quality_score: this.calculateResponseQuality(responses),
      sentiment_analysis: this.analyzeSentiment(responses),
      question_performance: this.analyzeQuestionPerformance(responses, metadata),
      demographic_breakdown: this.analyzeByDemographics(responses),
      timestamp: new Date().toISOString(),
    };
  }

  private static async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    // Fetch from your database
    const response = await fetch(`/api/surveys/${surveyId}/responses`);
    return response.json();
  }

  private static async getSurveyMetadata(surveyId: string): Promise<SurveyMetadata> {
    const response = await fetch(`/api/surveys/${surveyId}/metadata`);
    return response.json();
  }

  private static calculateCompletionRate(surveyId: string): number {
    // Calculate from analytics events
    const events = BehaviorTracker.getSessionEvents();
    const starts = events.filter(e => 
      e.event_name === 'survey_start' && 
      e.properties.survey_id === surveyId
    ).length;
    
    const completions = events.filter(e => 
      e.event_name === 'survey_complete' && 
      e.properties.survey_id === surveyId
    ).length;

    return starts > 0 ? completions / starts : 0;
  }

  private static calculateAverageCompletionTime(responses: SurveyResponse[]): number {
    const completionTimes = responses
      .filter(r => r.completion_time > 0)
      .map(r => r.completion_time);

    if (completionTimes.length === 0) return 0;

    return completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  }

  private static calculateResponseQuality(responses: SurveyResponse[]): number {
    let qualityScore = 0;
    let totalQuestions = 0;

    responses.forEach(response => {
      Object.values(response.answers).forEach(answer => {
        totalQuestions++;
        
        if (typeof answer === 'string') {
          // Text responses
          if (answer.length > 10 && !this.isGibberish(answer)) {
            qualityScore += 1;
          } else if (answer.length > 3) {
            qualityScore += 0.5;
          }
        } else if (typeof answer === 'number') {
          // Rating responses
          qualityScore += 1;
        }
      });
    });

    return totalQuestions > 0 ? qualityScore / totalQuestions : 0;
  }

  private static isGibberish(text: string): boolean {
    // Simple heuristic to detect random text
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const commonWordCount = words.filter(word => commonWords.includes(word)).length;
    
    return commonWordCount / words.length < 0.1 && words.length > 3;
  }

  private static analyzeSentiment(responses: SurveyResponse[]): SentimentAnalysis {
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    responses.forEach(response => {
      Object.values(response.answers).forEach(answer => {
        if (typeof answer === 'string') {
          const sentiment = this.getSentiment(answer);
          if (sentiment > 0.1) positive++;
          else if (sentiment < -0.1) negative++;
          else neutral++;
        } else if (typeof answer === 'number') {
          // Assume rating scale 1-5
          if (answer >= 4) positive++;
          else if (answer <= 2) negative++;
          else neutral++;
        }
      });
    });

    const total = positive + neutral + negative;
    
    return {
      positive_percentage: total > 0 ? positive / total : 0,
      neutral_percentage: total > 0 ? neutral / total : 0,
      negative_percentage: total > 0 ? negative / total : 0,
      overall_sentiment: total > 0 ? (positive - negative) / total : 0,
    };
  }

  private static getSentiment(text: string): number {
    // Simple sentiment analysis - in production, use a proper NLP service
    const positiveWords = ['good', 'great', 'excellent', 'love', 'like', 'amazing', 'awesome', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'useless', 'confusing'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return score / words.length;
  }

  private static analyzeQuestionPerformance(
    responses: SurveyResponse[], 
    metadata: SurveyMetadata
  ): QuestionPerformance[] {
    const questionPerformance: QuestionPerformance[] = [];

    metadata.questions.forEach(question => {
      const questionResponses = responses
        .map(r => r.answers[question.id])
        .filter(answer => answer !== undefined && answer !== null);

      const responseRate = questionResponses.length / responses.length;
      const averageTime = this.calculateQuestionAverageTime(question.id, responses);

      questionPerformance.push({
        question_id: question.id,
        question_text: question.text,
        response_rate: responseRate,
        average_time: averageTime,
        skip_rate: 1 - responseRate,
        response_distribution: this.getResponseDistribution(questionResponses),
      });
    });

    return questionPerformance;
  }

  private static calculateQuestionAverageTime(
    questionId: string, 
    responses: SurveyResponse[]
  ): number {
    const times = responses
      .map(r => r.question_times?.[questionId])
      .filter(time => time && time > 0);

    if (times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  private static getResponseDistribution(responses: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    responses.forEach(response => {
      const key = typeof response === 'object' ? JSON.stringify(response) : String(response);
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return distribution;
  }

  private static analyzeByDemographics(responses: SurveyResponse[]): DemographicBreakdown {
    const breakdown: DemographicBreakdown = {
      by_subscription_tier: {},
      by_company_size: {},
      by_industry: {},
      by_user_tenure: {},
    };

    responses.forEach(response => {
      const user = response.user_context;
      
      // By subscription tier
      const tier = user.subscription_tier || 'unknown';
      breakdown.by_subscription_tier[tier] = (breakdown.by_subscription_tier[tier] || 0) + 1;

      // By company size
      const size = user.company_size || 'unknown';
      breakdown.by_company_size[size] = (breakdown.by_company_size[size] || 0) + 1;

      // By industry
      const industry = user.industry || 'unknown';
      breakdown.by_industry[industry] = (breakdown.by_industry[industry] || 0) + 1;

      // By user tenure
      const tenure = this.calculateUserTenure(user.signup_date);
      breakdown.by_user_tenure[tenure] = (breakdown.by_user_tenure[tenure] || 0) + 1;
    });

    return breakdown;
  }

  private static calculateUserTenure(signupDate: string): string {
    const signup = new Date(signupDate);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - signup.getFullYear()) * 12 + 
                      (now.getMonth() - signup.getMonth());

    if (monthsDiff < 1) return 'new_user';
    if (monthsDiff < 6) return 'recent_user';
    if (monthsDiff < 12) return 'established_user';
    return 'long_term_user';
  }
}

interface SurveyAnalysis {
  survey_id: string;
  total_responses: number;
  completion_rate: number;
  average_completion_time: number;
  response_quality_score: number;
  sentiment_analysis: SentimentAnalysis;
  question_performance: QuestionPerformance[];
  demographic_breakdown: DemographicBreakdown;
  timestamp: string;
}

interface SentimentAnalysis {
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
  overall_sentiment: number;
}

interface QuestionPerformance {
  question_id: string;
  question_text: string;
  response_rate: number;
  average_time: number;
  skip_rate: number;
  response_distribution: Record<string, number>;
}

interface DemographicBreakdown {
  by_subscription_tier: Record<string, number>;
  by_company_size: Record<string, number>;
  by_industry: Record<string, number>;
  by_user_tenure: Record<string, number>;
}

interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  answers: Record<string, any>;
  completion_time: number;
  question_times?: Record<string, number>;
  user_context: {
    subscription_tier: string;
    company_size: string;
    industry: string;
    signup_date: string;
  };
  created_at: string;
}

interface SurveyMetadata {
  id: string;
  title: string;
  questions: {
    id: string;
    text: string;
    type: string;
  }[];
}
```

This monitoring and analytics implementation provides comprehensive insights into the Formbricks integration performance, user behavior, and business impact, enabling data-driven optimization and decision-making.
