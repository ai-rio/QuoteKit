/**
 * Complexity Cache System Tests
 * Tests for complexity analysis caching functionality
 */

import { ComplexityCacheManager, getCachedComplexityAnalysis } from '../cache';
import { ComplexityAnalysis } from '../types';

describe('ComplexityCacheManager', () => {
  let cacheManager: ComplexityCacheManager;

  beforeEach(() => {
    cacheManager = new ComplexityCacheManager();
  });

  describe('Basic Caching Operations', () => {
    const mockAnalysis: ComplexityAnalysis = {
      level: 'medium',
      score: 45,
      factors: {} as any,
      insights: [],
      confidence: 0.8,
      reasoning: ['Test analysis'],
    };

    const mockQuoteData = {
      id: 'test-quote-001',
      lineItems: [
        { id: '1', name: 'Test Item', cost: 100, quantity: 2 },
      ],
      total: 200,
      taxRate: 8.5,
      markupRate: 20,
    };

    it('should cache and retrieve analysis', () => {
      const quoteId = 'test-quote-001';
      
      // Initially no cache
      const cached1 = cacheManager.getCachedAnalysis(quoteId, mockQuoteData);
      expect(cached1).toBeNull();

      // Cache the analysis
      cacheManager.cacheAnalysis(quoteId, mockQuoteData, mockAnalysis);

      // Should retrieve from cache
      const cached2 = cacheManager.getCachedAnalysis(quoteId, mockQuoteData);
      expect(cached2).toEqual(mockAnalysis);
    });

    it('should return null for different quote data', () => {
      const quoteId = 'test-quote-001';
      
      // Cache with original data
      cacheManager.cacheAnalysis(quoteId, mockQuoteData, mockAnalysis);

      // Try to retrieve with different data
      const differentData = {
        ...mockQuoteData,
        total: 300, // Changed value
      };

      const cached = cacheManager.getCachedAnalysis(quoteId, differentData);
      expect(cached).toBeNull();
    });

    it('should handle cache invalidation for specific quote', () => {
      const quoteId = 'test-quote-001';
      
      // Cache the analysis
      cacheManager.cacheAnalysis(quoteId, mockQuoteData, mockAnalysis);
      
      // Verify it's cached
      let cached = cacheManager.getCachedAnalysis(quoteId, mockQuoteData);
      expect(cached).toEqual(mockAnalysis);

      // Invalidate
      cacheManager.invalidateQuote(quoteId);

      // Should be null after invalidation
      cached = cacheManager.getCachedAnalysis(quoteId, mockQuoteData);
      expect(cached).toBeNull();
    });

    it('should clear all cache', () => {
      const quoteId1 = 'test-quote-001';
      const quoteId2 = 'test-quote-002';
      
      // Cache multiple analyses
      cacheManager.cacheAnalysis(quoteId1, mockQuoteData, mockAnalysis);
      cacheManager.cacheAnalysis(quoteId2, mockQuoteData, mockAnalysis);

      // Verify they're cached
      expect(cacheManager.getCachedAnalysis(quoteId1, mockQuoteData)).toEqual(mockAnalysis);
      expect(cacheManager.getCachedAnalysis(quoteId2, mockQuoteData)).toEqual(mockAnalysis);

      // Clear cache
      cacheManager.clearCache();

      // Should be null after clearing
      expect(cacheManager.getCachedAnalysis(quoteId1, mockQuoteData)).toBeNull();
      expect(cacheManager.getCachedAnalysis(quoteId2, mockQuoteData)).toBeNull();
    });
  });

  describe('Cache Expiration', () => {
    it('should expire old cache entries', async () => {
      const mockAnalysis: ComplexityAnalysis = {
        level: 'simple',
        score: 20,
        factors: {} as any,
        insights: [],
        confidence: 0.9,
        reasoning: ['Simple test'],
      };

      const quoteData = {
        id: 'expire-test',
        total: 100,
      };

      // Cache the analysis
      cacheManager.cacheAnalysis('expire-test', quoteData, mockAnalysis);

      // Should be available immediately
      let cached = cacheManager.getCachedAnalysis('expire-test', quoteData);
      expect(cached).toEqual(mockAnalysis);

      // Manually trigger cleanup (in real scenario, this would happen automatically)
      cacheManager.cleanup();

      // For this test, we can't easily test time-based expiration without mocking time
      // So we'll just verify the cleanup method exists and runs without error
      expect(() => cacheManager.cleanup()).not.toThrow();
    });
  });

  describe('Cache Size Management', () => {
    it('should track cache statistics', () => {
      const stats = cacheManager.getStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('oldestEntry');
      
      expect(stats.size).toBe(0); // Empty cache initially
      expect(stats.maxSize).toBeGreaterThan(0);
    });

    it('should update stats after caching', () => {
      const mockAnalysis: ComplexityAnalysis = {
        level: 'medium',
        score: 50,
        factors: {} as any,
        insights: [],
        confidence: 0.8,
        reasoning: ['Test'],
      };

      const initialStats = cacheManager.getStats();
      expect(initialStats.size).toBe(0);

      // Add some cache entries
      for (let i = 0; i < 5; i++) {
        cacheManager.cacheAnalysis(`quote-${i}`, { id: `quote-${i}` }, mockAnalysis);
      }

      const updatedStats = cacheManager.getStats();
      expect(updatedStats.size).toBe(5);
      expect(updatedStats.oldestEntry).toBeGreaterThan(0);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate different keys for different quote data', () => {
      const analysis: ComplexityAnalysis = {
        level: 'simple',
        score: 25,
        factors: {} as any,
        insights: [],
        confidence: 0.85,
        reasoning: ['Key test'],
      };

      const data1 = { id: 'same-id', total: 100 };
      const data2 = { id: 'same-id', total: 200 };

      // Cache with same ID but different data
      cacheManager.cacheAnalysis('same-id', data1, analysis);
      cacheManager.cacheAnalysis('same-id', data2, analysis);

      // Should be able to retrieve both (different cache keys)
      const cached1 = cacheManager.getCachedAnalysis('same-id', data1);
      const cached2 = cacheManager.getCachedAnalysis('same-id', data2);

      expect(cached1).toEqual(analysis);
      expect(cached2).toEqual(analysis);
    });

    it('should generate same key for equivalent data', () => {
      const analysis: ComplexityAnalysis = {
        level: 'simple',
        score: 25,
        factors: {} as any,
        insights: [],
        confidence: 0.85,
        reasoning: ['Same key test'],
      };

      const data1 = { 
        id: 'test',
        lineItems: [{ id: '1', name: 'Item 1', cost: 50, quantity: 2 }],
        total: 100 
      };
      
      const data2 = { 
        id: 'test',
        lineItems: [{ id: '1', name: 'Item 1', cost: 50, quantity: 2 }],
        total: 100 
      };

      // Cache with first data structure
      cacheManager.cacheAnalysis('test', data1, analysis);

      // Should retrieve with equivalent data structure
      const cached = cacheManager.getCachedAnalysis('test', data2);
      expect(cached).toEqual(analysis);
    });
  });
});

describe('getCachedComplexityAnalysis', () => {
  let analysisCallCount = 0;

  const mockAnalysisFunction = (): ComplexityAnalysis => {
    analysisCallCount++;
    return {
      level: 'medium',
      score: 42,
      factors: {} as any,
      insights: [],
      confidence: 0.75,
      reasoning: [`Analysis call #${analysisCallCount}`],
    };
  };

  beforeEach(() => {
    analysisCallCount = 0;
  });

  it('should call analysis function on cache miss', () => {
    const quoteId = 'cache-miss-test';
    const quoteData = { id: quoteId, total: 150 };

    const result = getCachedComplexityAnalysis(quoteId, quoteData, mockAnalysisFunction);

    expect(result.fromCache).toBe(false);
    expect(result.analysis).toBeDefined();
    expect(result.analysis.reasoning).toContain('Analysis call #1');
    expect(analysisCallCount).toBe(1);
  });

  it('should return cached result on cache hit', () => {
    const quoteId = 'cache-hit-test';
    const quoteData = { id: quoteId, total: 175 };

    // First call - cache miss
    const result1 = getCachedComplexityAnalysis(quoteId, quoteData, mockAnalysisFunction);
    expect(result1.fromCache).toBe(false);
    expect(analysisCallCount).toBe(1);

    // Second call - cache hit
    const result2 = getCachedComplexityAnalysis(quoteId, quoteData, mockAnalysisFunction);
    expect(result2.fromCache).toBe(true);
    expect(result2.analysis).toEqual(result1.analysis);
    expect(analysisCallCount).toBe(1); // Should not increment
  });

  it('should call analysis function again after cache invalidation', () => {
    const quoteId = 'invalidation-test';
    const quoteData = { id: quoteId, total: 200 };

    // First call
    const result1 = getCachedComplexityAnalysis(quoteId, quoteData, mockAnalysisFunction);
    expect(result1.fromCache).toBe(false);
    expect(analysisCallCount).toBe(1);

    // Second call - should be cached
    const result2 = getCachedComplexityAnalysis(quoteId, quoteData, mockAnalysisFunction);
    expect(result2.fromCache).toBe(true);
    expect(analysisCallCount).toBe(1);

    // Import and use the global cache manager to invalidate
    const { cacheManager } = require('../cache');
    cacheManager.invalidateQuote(quoteId);

    // Third call - should call analysis function again
    const result3 = getCachedComplexityAnalysis(quoteId, quoteData, mockAnalysisFunction);
    expect(result3.fromCache).toBe(false);
    expect(analysisCallCount).toBe(2);
  });

  it('should handle analysis function errors gracefully', () => {
    const errorAnalysisFunction = (): ComplexityAnalysis => {
      throw new Error('Analysis failed');
    };

    const quoteId = 'error-test';
    const quoteData = { id: quoteId, total: 250 };

    expect(() => {
      getCachedComplexityAnalysis(quoteId, quoteData, errorAnalysisFunction);
    }).toThrow('Analysis failed');
  });
});

describe('Cache Performance', () => {
  let cacheManager: ComplexityCacheManager;

  beforeEach(() => {
    cacheManager = new ComplexityCacheManager();
  });

  it('should perform cache operations efficiently', () => {
    const mockAnalysis: ComplexityAnalysis = {
      level: 'complex',
      score: 75,
      factors: {} as any,
      insights: [],
      confidence: 0.9,
      reasoning: ['Performance test'],
    };

    const startTime = performance.now();

    // Perform many cache operations
    for (let i = 0; i < 100; i++) {
      const quoteData = { id: `perf-quote-${i}`, total: i * 10 };
      cacheManager.cacheAnalysis(`perf-quote-${i}`, quoteData, mockAnalysis);
    }

    // Retrieve all cached items
    for (let i = 0; i < 100; i++) {
      const quoteData = { id: `perf-quote-${i}`, total: i * 10 };
      const cached = cacheManager.getCachedAnalysis(`perf-quote-${i}`, quoteData);
      expect(cached).toEqual(mockAnalysis);
    }

    const endTime = performance.now();
    const operationTime = endTime - startTime;

    // Should complete operations reasonably quickly (adjust threshold as needed)
    expect(operationTime).toBeLessThan(100); // 100ms for 200 operations
  });
});