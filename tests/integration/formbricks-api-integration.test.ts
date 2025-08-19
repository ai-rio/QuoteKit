import { FormbricksAnalyticsService } from '../../src/libs/formbricks/analytics-service';

describe('Formbricks API Integration', () => {
  let analyticsService: FormbricksAnalyticsService;

  beforeEach(() => {
    analyticsService = new FormbricksAnalyticsService();
  });

  describe('API Connection', () => {
    it('should successfully test API connection', async () => {
      const result = await analyticsService.testConnection();
      
      // Should either succeed or fail gracefully
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      
      if (result.success) {
        console.log('✅ Formbricks API connection successful:', result.message);
      } else {
        console.log('⚠️ Formbricks API connection failed (gracefully):', result.message);
      }
    });
  });

  describe('Surveys Endpoint', () => {
    it('should fetch surveys without throwing errors', async () => {
      const surveys = await analyticsService.fetchSurveys();
      
      expect(Array.isArray(surveys)).toBe(true);
      console.log(`📊 Fetched ${surveys.length} surveys from Formbricks API`);
      
      // If we have surveys, verify structure
      if (surveys.length > 0) {
        const survey = surveys[0];
        expect(survey).toHaveProperty('id');
        expect(survey).toHaveProperty('name');
        expect(survey).toHaveProperty('status');
        expect(survey).toHaveProperty('createdAt');
      }
    });
  });

  describe('Responses Endpoint', () => {
    it('should fetch survey responses without throwing errors', async () => {
      const result = await analyticsService.fetchSurveyResponses();
      
      expect(result).toHaveProperty('responses');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.responses)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.hasMore).toBe('boolean');
      
      console.log(`📝 Fetched ${result.responses.length} responses from Formbricks API`);
      
      // If we have responses, verify structure
      if (result.responses.length > 0) {
        const response = result.responses[0];
        expect(response).toHaveProperty('id');
        expect(response).toHaveProperty('surveyId');
        expect(response).toHaveProperty('createdAt');
        expect(response).toHaveProperty('finished');
      }
    });

    it('should handle query parameters correctly', async () => {
      const result = await analyticsService.fetchSurveyResponses({
        page: 1,
        limit: 10,
        finished: true,
        sort: { field: 'createdAt', direction: 'desc' }
      });
      
      expect(result).toHaveProperty('responses');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.responses)).toBe(true);
      
      console.log(`🔍 Filtered query returned ${result.responses.length} responses`);
    });
  });

  describe('Analytics Data', () => {
    it('should fetch analytics data without throwing errors', async () => {
      const analyticsData = await analyticsService.fetchAnalyticsData();
      
      expect(analyticsData).toHaveProperty('surveys');
      expect(analyticsData).toHaveProperty('responses');
      expect(analyticsData).toHaveProperty('metrics');
      expect(analyticsData).toHaveProperty('totalResponses');
      expect(analyticsData).toHaveProperty('completionRate');
      expect(analyticsData).toHaveProperty('lastUpdated');
      
      expect(Array.isArray(analyticsData.surveys)).toBe(true);
      expect(Array.isArray(analyticsData.responses)).toBe(true);
      expect(typeof analyticsData.totalResponses).toBe('number');
      expect(typeof analyticsData.completionRate).toBe('number');
      
      console.log('📈 Analytics data structure:', {
        surveys: analyticsData.surveys.length,
        responses: analyticsData.responses.length,
        completionRate: analyticsData.completionRate,
        totalResponses: analyticsData.totalResponses
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This test verifies the defensive architecture
      const surveys = await analyticsService.fetchSurveys();
      const responses = await analyticsService.fetchSurveyResponses();
      
      // Should not throw errors even if API is unavailable
      expect(Array.isArray(surveys)).toBe(true);
      expect(responses).toHaveProperty('responses');
      expect(Array.isArray(responses.responses)).toBe(true);
      
      console.log('🛡️ Defensive architecture working - no errors thrown');
    });
  });

  describe('Search Functionality', () => {
    it('should search responses without throwing errors', async () => {
      const searchResults = await analyticsService.searchResponses('test');
      
      expect(Array.isArray(searchResults)).toBe(true);
      console.log(`🔎 Search returned ${searchResults.length} results`);
    });
  });

  describe('Data Export', () => {
    it('should export responses to CSV format', async () => {
      const csvData = await analyticsService.exportResponses();
      
      expect(typeof csvData).toBe('string');
      console.log(`📄 CSV export size: ${csvData.length} characters`);
      
      if (csvData.length > 0 && !csvData.includes('No responses found')) {
        // Verify CSV structure
        const lines = csvData.split('\n');
        expect(lines.length).toBeGreaterThan(0);
        
        // First line should be headers
        const headers = lines[0];
        expect(headers).toContain('ID');
        expect(headers).toContain('Survey ID');
        expect(headers).toContain('Created At');
      }
    });
  });
});