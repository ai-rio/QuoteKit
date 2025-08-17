/**
 * Formbricks Analytics API Integration
 * FB-014: Implement Analytics Data Fetching
 * 
 * This module provides comprehensive API integration for fetching and processing
 * survey response data from Formbricks Cloud.
 */

import { 
  FormbricksAnalyticsData,
  FormbricksAnalyticsFilters,
  FormbricksQuestion,
  FormbricksSurvey,
  FormbricksSurveyResponse} from './types';

export interface FormbricksAPIConfig {
  environmentId: string;
  apiKey?: string;
  apiHost?: string;
}

export interface APIResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Enhanced Formbricks Analytics API Client
 */
export class FormbricksAnalyticsAPI {
  private config: FormbricksAPIConfig;
  private baseUrl: string;
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  };

  constructor(config: FormbricksAPIConfig) {
    this.config = config;
    this.baseUrl = config.apiHost || 'https://app.formbricks.com';
    
    console.log('🔧 FormbricksAnalyticsAPI initialized:', {
      environmentId: config.environmentId,
      baseUrl: this.baseUrl,
      hasApiKey: !!config.apiKey,
    });
  }

  /**
   * Fetch all surveys for the environment
   */
  async getSurveys(): Promise<FormbricksSurvey[]> {
    try {
      console.log('📊 Fetching surveys from Formbricks...');
      
      const url = `${this.baseUrl}/api/v1/management/surveys`;
      const response = await this.makeRequest<FormbricksSurvey[]>(url);
      
      console.log('✅ Surveys fetched successfully:', {
        count: response.data.length,
        surveys: response.data.map(s => ({ id: s.id, name: s.name, status: s.status }))
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch surveys:', error);
      throw this.handleAPIError(error, 'Failed to fetch surveys');
    }
  }

  /**
   * Fetch survey responses with pagination and filtering
   */
  async getSurveyResponses(filters?: FormbricksAnalyticsFilters): Promise<APIResponse<FormbricksSurveyResponse[]>> {
    try {
      console.log('📋 Fetching survey responses:', filters);
      
      const params = this.buildQueryParams(filters);
      const url = `${this.baseUrl}/api/v1/management/responses?${params}`;
      
      const response = await this.makeRequest<FormbricksSurveyResponse[]>(url);
      
      console.log('✅ Survey responses fetched:', {
        count: response.data.length,
        hasMore: response.meta?.hasMore,
        total: response.meta?.total,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch survey responses:', error);
      throw this.handleAPIError(error, 'Failed to fetch survey responses');
    }
  }

  /**
   * Fetch responses for a specific survey
   */
  async getSurveyResponsesBySurveyId(surveyId: string, filters?: FormbricksAnalyticsFilters): Promise<FormbricksSurveyResponse[]> {
    try {
      console.log('📋 Fetching responses for survey:', surveyId);
      
      const params = this.buildQueryParams({ ...filters, surveyId });
      const url = `${this.baseUrl}/api/v1/management/responses?${params}`;
      
      const response = await this.makeRequest<FormbricksSurveyResponse[]>(url);
      
      console.log('✅ Survey responses fetched for survey:', {
        surveyId,
        count: response.data.length,
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch survey responses for survey:', surveyId, error);
      throw this.handleAPIError(error, `Failed to fetch responses for survey ${surveyId}`);
    }
  }

  /**
   * Fetch detailed survey information including questions
   */
  async getSurveyDetails(surveyId: string): Promise<FormbricksSurvey> {
    try {
      console.log('📋 Fetching survey details for:', surveyId);
      
      const url = `${this.baseUrl}/api/v1/management/surveys/${surveyId}`;
      const response = await this.makeRequest<FormbricksSurvey>(url);
      
      console.log('✅ Survey details fetched:', {
        surveyId,
        name: response.data.name,
        questionCount: response.data.questions?.length || 0,
        status: response.data.status,
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch survey details:', surveyId, error);
      throw this.handleAPIError(error, `Failed to fetch survey details for ${surveyId}`);
    }
  }

  /**
   * Fetch aggregated analytics data
   */
  async getAnalyticsData(filters?: FormbricksAnalyticsFilters): Promise<FormbricksAnalyticsData> {
    try {
      console.log('📊 Fetching analytics data...');
      
      // Fetch surveys and responses in parallel
      const [surveys, responsesResult] = await Promise.all([
        this.getSurveys(),
        this.getSurveyResponses(filters),
      ]);
      
      const responses = responsesResult.data;
      
      // Calculate metrics
      const metrics = this.calculateMetrics(surveys, responses);
      
      // Generate time series data
      const responsesByPeriod = this.generateResponsesByPeriod(responses, filters?.dateRange);
      
      // Calculate completion rates by survey
      const completionRates = this.calculateCompletionRates(surveys, responses);
      
      const analyticsData: FormbricksAnalyticsData = {
        surveys,
        responses,
        metrics,
        responsesByPeriod,
        completionRates,
      };
      
      console.log('✅ Analytics data compiled:', {
        surveysCount: surveys.length,
        responsesCount: responses.length,
        activeSurveys: metrics.activeSurveys,
        averageCompletionRate: metrics.averageCompletionRate,
      });
      
      return analyticsData;
    } catch (error) {
      console.error('❌ Failed to fetch analytics data:', error);
      throw this.handleAPIError(error, 'Failed to fetch analytics data');
    }
  }

  /**
   * Test API connectivity and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Formbricks API connection...');
      
      const url = `${this.baseUrl}/api/v1/management/me`;
      await this.makeRequest(url, { method: 'HEAD' });
      
      console.log('✅ API connection test successful');
      return true;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async makeRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`🌐 API Request (attempt ${attempt}/${this.retryConfig.maxRetries}):`, {
          url: url.replace(this.config.environmentId, '[ENV_ID]'),
          method: options.method || 'GET',
        });
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'QuoteKit-Analytics/1.0.0',
            ...this.getAuthHeaders(),
            ...options.headers,
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
        
        // Handle HEAD requests (no body)
        if (options.method === 'HEAD') {
          return { data: null as unknown as T };
        }
        
        const data = await response.json();
        
        // Handle different response formats
        if (data.data !== undefined) {
          return {
            data: data.data,
            meta: data.meta,
          };
        } else {
          return {
            data,
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.warn(`⚠️ API request failed (attempt ${attempt}/${this.retryConfig.maxRetries}):`, {
          error: lastError.message,
          url: url.replace(this.config.environmentId, '[ENV_ID]'),
        });
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          );
          
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }
    
    return headers;
  }

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters?: FormbricksAnalyticsFilters): string {
    const params = new URLSearchParams();
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString());
      params.append('endDate', filters.dateRange.end.toISOString());
    }
    
    if (filters?.surveyIds?.length) {
      filters.surveyIds.forEach(id => params.append('surveyId', id));
    }
    
    if (filters?.status?.length) {
      filters.status.forEach(status => params.append('status', status));
    }
    
    if (filters?.completed !== undefined) {
      params.append('completed', String(filters.completed));
    }
    
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }
    
    if (filters?.offset) {
      params.append('offset', String(filters.offset));
    }
    
    return params.toString();
  }

  /**
   * Calculate aggregated metrics
   */
  private calculateMetrics(surveys: FormbricksSurvey[], responses: FormbricksSurveyResponse[]) {
    const totalSurveys = surveys.length;
    const activeSurveys = surveys.filter(s => s.status === 'inProgress').length;
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.finished).length;
    
    const averageCompletionRate = surveys.length > 0 
      ? surveys.reduce((sum, survey) => sum + (survey.completionRate || 0), 0) / surveys.length
      : 0;
    
    const responseRate = totalSurveys > 0 ? totalResponses / totalSurveys : 0;
    
    return {
      totalSurveys,
      totalResponses,
      averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
      activeSurveys,
    };
  }

  /**
   * Generate responses by time period
   */
  private generateResponsesByPeriod(
    responses: FormbricksSurveyResponse[], 
    dateRange?: { start: Date; end: Date }
  ) {
    const responsesMap = new Map<string, number>();
    
    responses.forEach(response => {
      const date = new Date(response.createdAt).toDateString();
      responsesMap.set(date, (responsesMap.get(date) || 0) + 1);
    });
    
    return Array.from(responsesMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate completion rates by survey
   */
  private calculateCompletionRates(surveys: FormbricksSurvey[], responses: FormbricksSurveyResponse[]) {
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
   * Handle API errors with enhanced context
   */
  private handleAPIError(error: unknown, context: string): APIError {
    if (error instanceof Error) {
      return {
        message: `${context}: ${error.message}`,
        details: error,
      };
    }
    
    return {
      message: `${context}: Unknown error occurred`,
      details: error,
    };
  }
}

/**
 * Create a configured analytics API instance
 */
export function createFormbricksAnalyticsAPI(config: FormbricksAPIConfig): FormbricksAnalyticsAPI {
  return new FormbricksAnalyticsAPI(config);
}

/**
 * Default API instance using environment variables
 */
export function getDefaultAnalyticsAPI(): FormbricksAnalyticsAPI {
  const environmentId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
  const apiKey = process.env.FORMBRICKS_API_KEY;
  const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;
  
  if (!environmentId) {
    throw new Error('NEXT_PUBLIC_FORMBRICKS_ENV_ID environment variable is required');
  }
  
  return createFormbricksAnalyticsAPI({
    environmentId,
    apiKey,
    apiHost,
  });
}