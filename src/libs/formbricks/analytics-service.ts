/**
 * Formbricks Analytics Data Service
 * 
 * Provides data fetching functionality for the analytics dashboard.
 * Handles survey response data, filtering, sorting, and real-time updates.
 * 
 * Updated to use the correct Formbricks Management API endpoints and authentication.
 */

import { 
  FormbricksAnalyticsData,
  FormbricksAnalyticsFilters,
  FormbricksAnalyticsQueryParams,
  FormbricksSurvey,
  FormbricksSurveyResponse
} from './types';

export class FormbricksAnalyticsService {
  private apiKey: string;
  private apiHost: string;
  private environmentId: string;

  constructor() {
    this.apiKey = process.env.FORMBRICKS_API_KEY || '';
    this.apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
    this.environmentId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID || '';

    if (!this.apiKey || !this.environmentId) {
      console.warn('Formbricks API credentials not fully configured');
    }
  }

  /**
   * Fetch all surveys from Formbricks using Management API
   */
  async fetchSurveys(): Promise<FormbricksSurvey[]> {
    try {
      const response = await fetch(
        `${this.apiHost}/api/v1/management/surveys`,
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Survey fetch error details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: `${this.apiHost}/api/v1/management/surveys`
        });
        throw new Error(`Failed to fetch surveys: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Surveys API response:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('Unexpected surveys response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      throw error;
    }
  }

  /**
   * Fetch survey responses with filtering and pagination using Management API
   */
  async fetchSurveyResponses(params: FormbricksAnalyticsQueryParams = {}): Promise<{
    responses: FormbricksSurveyResponse[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add sorting
      if (params.sort) {
        queryParams.append('sortBy', params.sort.field);
        queryParams.append('sortOrder', params.sort.direction);
      }
      
      // Add filters
      if (params.surveyId) queryParams.append('surveyId', params.surveyId);
      if (params.finished !== undefined) queryParams.append('finished', params.finished.toString());
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);

      const url = `${this.apiHost}/api/v1/management/responses?${queryParams.toString()}`;
      console.log('Fetching responses from:', url);

      const response = await fetch(url, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Responses fetch error details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: url
        });
        throw new Error(`Failed to fetch responses: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Responses API response:', data);
      
      // Handle different response formats
      let responses: FormbricksSurveyResponse[] = [];
      let total = 0;
      let hasMore = false;

      if (Array.isArray(data)) {
        responses = data;
        total = data.length;
        hasMore = false;
      } else if (data.data && Array.isArray(data.data)) {
        responses = data.data;
        total = data.total || data.data.length;
        hasMore = data.hasMore || false;
      } else {
        console.warn('Unexpected responses response format:', data);
      }
      
      return {
        responses,
        total,
        hasMore,
      };
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      throw error;
    }
  }

  /**
   * Fetch analytics metrics and aggregated data
   */
  async fetchAnalyticsData(filters: FormbricksAnalyticsFilters = {}): Promise<FormbricksAnalyticsData> {
    try {
      const [surveys, responsesData] = await Promise.all([
        this.fetchSurveys(),
        this.fetchSurveyResponses({ ...filters, limit: 1000 }) // Get all for metrics
      ]);

      const responses = responsesData.responses;

      // Calculate metrics
      const totalSurveys = surveys.length;
      const totalResponses = responses.length;
      const activeSurveys = surveys.filter(survey => survey.status === 'inProgress').length;
      
      // Calculate completion rates
      const completionRates = surveys.map(survey => {
        const surveyResponses = responses.filter(r => r.surveyId === survey.id);
        const completedResponses = surveyResponses.filter(r => r.finished);
        const completionRate = surveyResponses.length > 0 
          ? (completedResponses.length / surveyResponses.length) * 100 
          : 0;
        
        return {
          surveyId: survey.id,
          surveyName: survey.name,
          completionRate: Math.round(completionRate * 100) / 100,
          responseCount: surveyResponses.length,
          totalResponses: surveyResponses.length,
          completedResponses: completedResponses.length,
        };
      });

      const averageCompletionRate = completionRates.length > 0
        ? completionRates.reduce((acc, curr) => acc + curr.completionRate, 0) / completionRates.length
        : 0;

      // Calculate response rate (responses vs surveys)
      const responseRate = totalSurveys > 0 ? (totalResponses / totalSurveys) : 0;

      // Group responses by date for trend analysis
      const responsesByPeriod = this.groupResponsesByDate(responses);

      const completionRate = totalResponses > 0 ? responses.filter(r => r.finished).length / totalResponses : 0;
      const metrics = {
        totalSurveys,
        totalResponses,
        completionRate: Math.round(completionRate * 100) / 100,
        averageCompletionTime: 120, // Mock average completion time in seconds
        averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
        responseRate: Math.round(responseRate * 100) / 100,
        activeSurveys,
        topPerformingSurvey: surveys.length > 0 ? surveys.reduce((top, survey) => 
          (survey.completionRate || 0) > (top.completionRate || 0) ? survey : top
        ).name || 'N/A' : 'N/A',
        conversionRate: Math.round(completionRate * 0.8 * 100) / 100,
      };

      return {
        surveys,
        responses,
        totalResponses: metrics.totalResponses,
        completionRate: metrics.completionRate,
        averageCompletionTime: metrics.averageCompletionTime,
        responsesByPeriod,
        completionRates,
        topTags: [], // Mock empty array for now
        lastUpdated: new Date().toISOString(),
        metrics,
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  /**
   * Search responses by content
   */
  async searchResponses(searchTerm: string, filters: FormbricksAnalyticsFilters = {}): Promise<FormbricksSurveyResponse[]> {
    try {
      const { responses } = await this.fetchSurveyResponses({
        ...filters,
        limit: 1000, // Get all responses for client-side search
      });

      // Client-side search through response data
      const searchLower = searchTerm.toLowerCase();
      
      return responses.filter(response => {
        // Search in response data values
        const dataString = JSON.stringify(response.data).toLowerCase();
        const metaString = JSON.stringify(response.meta).toLowerCase();
        
        return dataString.includes(searchLower) || 
               metaString.includes(searchLower) ||
               response.id.toLowerCase().includes(searchLower);
      });
    } catch (error) {
      console.error('Error searching responses:', error);
      throw error;
    }
  }

  /**
   * Fetch real-time updates for responses
   */
  async fetchLatestResponses(since: string): Promise<FormbricksSurveyResponse[]> {
    try {
      const { responses } = await this.fetchSurveyResponses({
        dateFrom: since,
        limit: 100,
        sort: { field: 'createdAt', direction: 'desc' }
      });

      return responses;
    } catch (error) {
      console.error('Error fetching latest responses:', error);
      return [];
    }
  }

  /**
   * Group responses by date for trend visualization
   */
  private groupResponsesByDate(responses: FormbricksSurveyResponse[]): Array<{ date: string; count: number }> {
    const grouped = responses.reduce((acc, response) => {
      const date = new Date(response.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Export responses to CSV format
   */
  async exportResponses(filters: FormbricksAnalyticsFilters = {}): Promise<string> {
    try {
      const { responses } = await this.fetchSurveyResponses({ 
        ...filters, 
        limit: 10000 // Large limit for export
      });

      if (responses.length === 0) {
        return 'No responses found for the selected criteria.';
      }

      // Create CSV headers
      const headers = ['ID', 'Survey ID', 'Created At', 'Finished', 'Response Data', 'Source'];
      
      // Convert responses to CSV rows
      const rows = responses.map(response => [
        response.id,
        response.surveyId,
        response.createdAt,
        response.finished ? 'Yes' : 'No',
        JSON.stringify(response.data),
        response.meta?.source || 'Unknown'
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting responses:', error);
      throw error;
    }
  }

  /**
   * Test API connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing Formbricks API connection...');
      
      // Test with the /me endpoint which is simpler
      const response = await fetch(`${this.apiHost}/api/v1/management/me`, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `API test failed: ${response.status} ${response.statusText} - ${errorText}`
        };
      }

      const data = await response.json();
      console.log('API connection test successful:', data);
      
      return {
        success: true,
        message: 'API connection successful'
      };
    } catch (error) {
      console.error('API connection test failed:', error);
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Singleton instance
export const formbricksAnalyticsService = new FormbricksAnalyticsService();
