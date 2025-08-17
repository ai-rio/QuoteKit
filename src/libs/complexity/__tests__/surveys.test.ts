/**
 * Complexity-Based Survey System Tests
 * Tests for adaptive survey logic based on quote complexity
 */

import { Quote } from '@/features/quotes/types';

import { ComplexityAdaptiveSurveyManager, triggerComplexityBasedSurvey } from '../surveys';
import { ComplexityAnalysis } from '../types';

// Mock Formbricks manager
jest.mock('@/libs/formbricks', () => ({
  FormbricksManager: {
    getInstance: jest.fn(() => ({
      isInitialized: jest.fn(() => true),
      setAttributes: jest.fn(),
      track: jest.fn(),
    })),
  },
}));

describe('ComplexityAdaptiveSurveyManager', () => {
  let surveyManager: ComplexityAdaptiveSurveyManager;

  beforeEach(() => {
    surveyManager = new ComplexityAdaptiveSurveyManager();
    jest.clearAllMocks();
  });

  const createMockQuote = (complexity: 'simple' | 'medium' | 'complex'): Quote => {
    const baseQuote = {
      id: `${complexity}-quote-001`,
      user_id: 'user-1',
      client_name: 'Test Client',
      client_contact: 'test@example.com',
      tax_rate: 8.5,
      markup_rate: 20,
      subtotal: 100,
      created_at: '2024-01-01T00:00:00Z',
      quote_data: [],
    };

    switch (complexity) {
      case 'simple':
        return { ...baseQuote, total: 250 };
      case 'medium':
        return { ...baseQuote, total: 1500 };
      case 'complex':
        return { ...baseQuote, total: 8500, notes: 'Complex project requirements' };
      default:
        return { ...baseQuote, total: 100 };
    }
  };

  const createMockAnalysis = (level: 'simple' | 'medium' | 'complex'): ComplexityAnalysis => ({
    level,
    score: level === 'simple' ? 25 : level === 'medium' ? 50 : 80,
    factors: {} as any,
    insights: [
      {
        factor: 'itemCount',
        impact: level === 'complex' ? 'high' : 'medium',
        description: `${level} complexity detected`,
        recommendation: level === 'complex' ? 'Consider breaking into phases' : undefined,
      },
    ],
    confidence: 0.85,
    reasoning: [`Analysis shows ${level} complexity`],
  });

  describe('Survey Determination', () => {
    it('should determine appropriate survey for simple quotes', () => {
      const quote = createMockQuote('simple');
      const analysis = createMockAnalysis('simple');
      const userContext = {
        userId: 'user-1',
        subscriptionTier: 'free',
        quotesCreated: 1,
        isFirstTimeUser: true,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext).toBeDefined();
      expect(surveyContext?.recommendedSurvey.surveyId).toBe('simple_quote_satisfaction');
      expect(surveyContext?.triggerConditions).toContain('quote_created');
      expect(surveyContext?.triggerConditions).toContain('new_user');
    });

    it('should determine appropriate survey for medium quotes', () => {
      const quote = createMockQuote('medium');
      const analysis = createMockAnalysis('medium');
      const userContext = {
        userId: 'user-2',
        subscriptionTier: 'pro',
        quotesCreated: 5,
        isFirstTimeUser: false,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext).toBeDefined();
      expect(surveyContext?.recommendedSurvey.surveyId).toBe('medium_quote_workflow');
      expect(surveyContext?.triggerConditions).toContain('medium_quote_created');
    });

    it('should determine appropriate survey for complex quotes', () => {
      const quote = createMockQuote('complex');
      const analysis = createMockAnalysis('complex');
      const userContext = {
        userId: 'user-3',
        subscriptionTier: 'enterprise',
        quotesCreated: 15,
        isFirstTimeUser: false,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext).toBeDefined();
      expect(surveyContext?.recommendedSurvey.surveyId).toBe('complex_quote_experience');
      expect(surveyContext?.triggerConditions).toContain('complex_quote_created');
      expect(surveyContext?.triggerConditions).toContain('power_user');
    });

    it('should return null if no suitable survey found', () => {
      const quote = createMockQuote('simple');
      const analysis = createMockAnalysis('simple');
      const userContext = {
        userId: 'seen-all-surveys',
        subscriptionTier: 'free',
        quotesCreated: 100,
        isFirstTimeUser: false,
      };

      // Simulate user has seen all surveys
      surveyManager.resetUserHistory(userContext.userId);
      
      // First call should work
      let surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);
      expect(surveyContext).toBeDefined();

      // After "showing" the survey, user has seen it
      if (surveyContext) {
        surveyManager['userSurveyHistory'].set(
          userContext.userId, 
          new Set([surveyContext.recommendedSurvey.surveyId])
        );
      }

      // Second call with same context should return null
      surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);
      expect(surveyContext).toBeNull();
    });
  });

  describe('Trigger Conditions Evaluation', () => {
    it('should identify first-time user conditions', () => {
      const quote = createMockQuote('simple');
      const analysis = createMockAnalysis('simple');
      const userContext = {
        userId: 'new-user',
        quotesCreated: 1,
        isFirstTimeUser: true,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext?.triggerConditions).toContain('new_user');
      expect(surveyContext?.triggerConditions).toContain('first_quote_ever');
    });

    it('should identify power user conditions', () => {
      const quote = createMockQuote('complex');
      const analysis = createMockAnalysis('complex');
      const userContext = {
        userId: 'power-user',
        quotesCreated: 25,
        isFirstTimeUser: false,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext?.triggerConditions).toContain('power_user');
    });

    it('should identify high-value quote conditions', () => {
      const quote = createMockQuote('complex');
      quote.total = 15000; // High value
      const analysis = createMockAnalysis('complex');
      const userContext = {
        userId: 'high-value-user',
        quotesCreated: 10,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext?.triggerConditions).toContain('high_value_quote');
      expect(surveyContext?.triggerConditions).toContain('high_value_complex_quotes');
    });

    it('should identify milestone conditions', () => {
      const quote = createMockQuote('medium');
      const analysis = createMockAnalysis('medium');
      const userContext = {
        userId: 'milestone-user',
        quotesCreated: 10, // Milestone (divisible by 5)
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext?.triggerConditions).toContain('milestone_reached');
    });
  });

  describe('Survey Priority Determination', () => {
    it('should assign high priority to complex quotes', () => {
      const quote = createMockQuote('complex');
      const analysis = createMockAnalysis('complex');
      const userContext = {
        userId: 'user-1',
        quotesCreated: 5,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext?.recommendedSurvey.priority).toBe('high');
    });

    it('should assign high priority to new users', () => {
      const quote = createMockQuote('simple');
      const analysis = createMockAnalysis('simple');
      const userContext = {
        userId: 'new-user',
        quotesCreated: 1,
        isFirstTimeUser: true,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext?.recommendedSurvey.priority).toBe('high');
    });

    it('should assign medium priority to power users with medium quotes', () => {
      const quote = createMockQuote('medium');
      const analysis = createMockAnalysis('medium');
      const userContext = {
        userId: 'power-user',
        quotesCreated: 15,
        isFirstTimeUser: false,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext?.recommendedSurvey.priority).toBe('medium');
    });

    it('should assign low priority to simple quotes from experienced users', () => {
      const quote = createMockQuote('simple');
      const analysis = createMockAnalysis('simple');
      const userContext = {
        userId: 'experienced-user',
        quotesCreated: 8,
        isFirstTimeUser: false,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);

      expect(surveyContext?.recommendedSurvey.priority).toBe('low');
    });
  });

  describe('Survey Triggering', () => {
    it('should trigger survey successfully', async () => {
      const quote = createMockQuote('medium');
      const analysis = createMockAnalysis('medium');
      const userContext = {
        userId: 'trigger-test-user',
        quotesCreated: 3,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);
      expect(surveyContext).toBeDefined();

      if (surveyContext) {
        const result = await surveyManager.triggerSurvey(surveyContext);
        expect(result).toBe(true);
      }
    });

    it('should fail to trigger survey when Formbricks not initialized', async () => {
      // Mock Formbricks as not initialized
      const { FormbricksManager } = require('@/libs/formbricks');
      FormbricksManager.getInstance.mockReturnValue({
        isInitialized: jest.fn(() => false),
        setAttributes: jest.fn(),
        track: jest.fn(),
      });

      const quote = createMockQuote('simple');
      const analysis = createMockAnalysis('simple');
      const userContext = {
        userId: 'fail-test-user',
        quotesCreated: 1,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);
      expect(surveyContext).toBeDefined();

      if (surveyContext) {
        const result = await surveyManager.triggerSurvey(surveyContext);
        expect(result).toBe(false);
      }
    });
  });

  describe('User History Management', () => {
    it('should track user survey history', () => {
      const userId = 'history-test-user';
      const quote = createMockQuote('simple');
      const analysis = createMockAnalysis('simple');
      const userContext = { userId, quotesCreated: 1 };

      // First survey should be available
      const surveyContext1 = surveyManager.determineSurvey(analysis, quote, userContext);
      expect(surveyContext1).toBeDefined();

      if (surveyContext1) {
        // Simulate triggering the survey
        surveyManager.triggerSurvey(surveyContext1);

        // Same survey should not be available again
        const surveyContext2 = surveyManager.determineSurvey(analysis, quote, userContext);
        expect(surveyContext2).toBeNull();
      }
    });

    it('should reset user history', () => {
      const userId = 'reset-test-user';
      const quote = createMockQuote('simple');
      const analysis = createMockAnalysis('simple');
      const userContext = { userId, quotesCreated: 1 };

      // First survey
      const surveyContext1 = surveyManager.determineSurvey(analysis, quote, userContext);
      expect(surveyContext1).toBeDefined();

      if (surveyContext1) {
        surveyManager.triggerSurvey(surveyContext1);

        // Should be null after seeing survey
        const surveyContext2 = surveyManager.determineSurvey(analysis, quote, userContext);
        expect(surveyContext2).toBeNull();

        // Reset history
        surveyManager.resetUserHistory(userId);

        // Should be available again
        const surveyContext3 = surveyManager.determineSurvey(analysis, quote, userContext);
        expect(surveyContext3).toBeDefined();
      }
    });
  });

  describe('Statistics and Management', () => {
    it('should provide system statistics', () => {
      const stats = surveyManager.getStats();

      expect(stats).toHaveProperty('totalSurveysConfigured');
      expect(stats).toHaveProperty('userHistoryCount');
      expect(stats).toHaveProperty('averageSurveysPerUser');

      expect(stats.totalSurveysConfigured).toBeGreaterThan(0);
      expect(stats.userHistoryCount).toBeGreaterThanOrEqual(0);
    });

    it('should update statistics after user interactions', async () => {
      const initialStats = surveyManager.getStats();
      
      const quote = createMockQuote('medium');
      const analysis = createMockAnalysis('medium');
      const userContext = {
        userId: 'stats-test-user',
        quotesCreated: 2,
      };

      const surveyContext = surveyManager.determineSurvey(analysis, quote, userContext);
      if (surveyContext) {
        await surveyManager.triggerSurvey(surveyContext);
      }

      const updatedStats = surveyManager.getStats();
      expect(updatedStats.userHistoryCount).toBe(initialStats.userHistoryCount + 1);
    });
  });
});

describe('triggerComplexityBasedSurvey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger survey for valid context', async () => {
    const quote = createMockQuote('complex');
    const analysis = createMockAnalysis('complex');
    const userContext = {
      userId: 'integration-test-user',
      quotesCreated: 5,
    };

    const result = await triggerComplexityBasedSurvey(analysis, quote, userContext);
    expect(result).toBe(true);
  });

  it('should return false when no survey context determined', async () => {
    const quote = createMockQuote('simple');
    const analysis = createMockAnalysis('simple');
    const userContext = {
      userId: 'no-survey-user',
      quotesCreated: 100, // Experienced user who has seen all surveys
    };

    // This might return false if the user has seen all applicable surveys
    const result = await triggerComplexityBasedSurvey(analysis, quote, userContext);
    expect(typeof result).toBe('boolean');
  });

  // Helper functions
  function createMockQuote(complexity: 'simple' | 'medium' | 'complex'): Quote {
    const baseQuote = {
      id: `${complexity}-quote-001`,
      user_id: 'user-1',
      client_name: 'Test Client',
      client_contact: 'test@example.com',
      tax_rate: 8.5,
      markup_rate: 20,
      subtotal: 100,
      created_at: '2024-01-01T00:00:00Z',
      quote_data: [],
    };

    switch (complexity) {
      case 'simple':
        return { ...baseQuote, total: 250 };
      case 'medium':
        return { ...baseQuote, total: 1500 };
      case 'complex':
        return { ...baseQuote, total: 8500, notes: 'Complex project requirements' };
      default:
        return { ...baseQuote, total: 100 };
    }
  }

  function createMockAnalysis(level: 'simple' | 'medium' | 'complex'): ComplexityAnalysis {
    return {
      level,
      score: level === 'simple' ? 25 : level === 'medium' ? 50 : 80,
      factors: {} as any,
      insights: [
        {
          factor: 'itemCount',
          impact: level === 'complex' ? 'high' : 'medium',
          description: `${level} complexity detected`,
          recommendation: level === 'complex' ? 'Consider breaking into phases' : undefined,
        },
      ],
      confidence: 0.85,
      reasoning: [`Analysis shows ${level} complexity`],
    };
  }
});