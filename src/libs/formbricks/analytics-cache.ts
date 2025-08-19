/**
 * FB-022: Analytics Data Caching Service
 * Simple in-memory cache with TTL for analytics data optimization
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class AnalyticsCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Store data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Clean up expired entries periodically
    if (this.cache.size > 50) {
      this.cleanup();
    }
  }

  /**
   * Get data from cache if not expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific key or all cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalKeys: number;
    expiredKeys: number;
    activeKeys: number;
  } {
    const now = Date.now();
    let expiredKeys = 0;
    
    this.cache.forEach((item) => {
      if (now - item.timestamp > item.ttl) {
        expiredKeys++;
      }
    });

    return {
      totalKeys: this.cache.size,
      expiredKeys,
      activeKeys: this.cache.size - expiredKeys
    };
  }

  /**
   * Generate cache key from parameters
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `${prefix}:${sortedParams}`;
  }
}

// Singleton instance
export const analyticsCache = new AnalyticsCache();