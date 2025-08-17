/**
 * Complexity Analysis Cache System
 * Optimizes performance by caching complexity calculations
 */

import { ComplexityAnalysis, ComplexityCache, ComplexityPerformanceMetrics } from './types';

/**
 * Cache manager for complexity analysis
 */
export class ComplexityCacheManager {
  private cache = new Map<string, ComplexityCache>();
  private maxCacheSize = 1000;
  private cacheVersion = '1.0.0';
  private defaultTtl = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Generate cache key for a quote
   */
  private generateCacheKey(quoteId: string, quoteData: any): string {
    // Create a hash of the quote data to detect changes
    const dataString = JSON.stringify({
      id: quoteId,
      lineItems: quoteData.lineItems?.map((item: any) => ({
        id: item.id,
        name: item.name,
        cost: item.cost,
        quantity: item.quantity,
      })),
      total: quoteData.total,
      taxRate: quoteData.taxRate,
      markupRate: quoteData.markupRate,
      notes: quoteData.notes,
      isTemplate: quoteData.isTemplate,
    });

    // Simple hash function (for production, consider using a crypto hash)
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `${quoteId}_${Math.abs(hash)}`;
  }

  /**
   * Get cached analysis if available and valid
   */
  public getCachedAnalysis(quoteId: string, quoteData: any): ComplexityAnalysis | null {
    const cacheKey = this.generateCacheKey(quoteId, quoteData);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if cache entry is expired
    const now = Date.now();
    if (now - cached.timestamp > this.defaultTtl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Check version compatibility
    if (cached.version !== this.cacheVersion) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.analysis;
  }

  /**
   * Cache analysis result
   */
  public cacheAnalysis(
    quoteId: string,
    quoteData: any,
    analysis: ComplexityAnalysis
  ): void {
    // Manage cache size
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntries();
    }

    const cacheKey = this.generateCacheKey(quoteId, quoteData);
    const cacheEntry: ComplexityCache = {
      quoteId,
      analysis,
      timestamp: Date.now(),
      version: this.cacheVersion,
    };

    this.cache.set(cacheKey, cacheEntry);
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp, oldest first
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clear cache for specific quote
   */
  public invalidateQuote(quoteId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${quoteId}_`)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    const entries = Array.from(this.cache.values());
    const oldestTimestamp = entries.length > 0 
      ? Math.min(...entries.map(entry => entry.timestamp))
      : null;

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // This would be tracked separately in real implementation
      oldestEntry: oldestTimestamp,
    };
  }

  /**
   * Cleanup expired entries
   */
  public cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.defaultTtl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

/**
 * Global cache instance
 */
const globalCacheManager = new ComplexityCacheManager();

/**
 * Cached complexity detection function
 */
export function getCachedComplexityAnalysis(
  quoteId: string,
  quoteData: any,
  analysisFunction: () => ComplexityAnalysis
): { analysis: ComplexityAnalysis; fromCache: boolean } {
  const startTime = performance.now();
  
  // Try to get from cache first
  const cached = globalCacheManager.getCachedAnalysis(quoteId, quoteData);
  if (cached) {
    return {
      analysis: cached,
      fromCache: true,
    };
  }

  // Calculate new analysis
  const analysis = analysisFunction();
  
  // Cache the result
  globalCacheManager.cacheAnalysis(quoteId, quoteData, analysis);

  return {
    analysis,
    fromCache: false,
  };
}

/**
 * Export cache manager for direct access
 */
export { globalCacheManager as cacheManager };

/**
 * Utility to warm up cache with common quote patterns
 */
export function warmUpCache(commonQuotes: Array<{ id: string; data: any }>): void {
  // This could be used to pre-populate cache with common quote patterns
  // Implementation would depend on your specific needs
  console.log(`Warming up cache with ${commonQuotes.length} common quotes`);
}