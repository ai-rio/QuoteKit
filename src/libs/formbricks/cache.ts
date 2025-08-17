/**
 * Formbricks Analytics Caching Layer
 * FB-014: Implement Analytics Data Fetching
 * 
 * Provides intelligent caching strategies for analytics data with
 * automatic cache invalidation and performance optimization.
 */

import { FormbricksAnalyticsData, FormbricksSurvey,FormbricksSurveyResponse } from './types';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cache entries
  strategy: 'memory' | 'localStorage' | 'sessionStorage';
  enableCompression?: boolean;
  prefix?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  size: number;
  hits: number;
  lastAccess: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheKey {
  type: 'analytics' | 'surveys' | 'responses' | 'survey_details';
  identifier: string;
  filters?: string;
  timestamp?: number;
}

/**
 * High-performance caching system for Formbricks analytics data
 */
export class FormbricksAnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    hitRate: 0,
    memoryUsage: 0,
    oldestEntry: 0,
    newestEntry: 0,
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      strategy: 'memory',
      enableCompression: false,
      prefix: 'fb_analytics_',
      ...config,
    };

    console.log('🗄️ FormbricksAnalyticsCache initialized:', this.config);

    // Load existing cache from persistent storage if configured
    if (this.config.strategy !== 'memory') {
      this.loadFromStorage();
    }

    // Setup cleanup interval
    this.setupCleanupInterval();
  }

  /**
   * Get cached data with automatic expiration check
   */
  get<T>(key: string | CacheKey): T | null {
    const cacheKey = this.buildCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      console.log('🗑️ Cache entry expired, removing:', cacheKey);
      this.cache.delete(cacheKey);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccess = Date.now();
    this.stats.hits++;
    this.updateStats();

    console.log('✅ Cache hit for key:', cacheKey, {
      age: Date.now() - entry.timestamp,
      hits: entry.hits,
    });

    return this.deserializeData(entry.data);
  }

  /**
   * Set cached data with automatic serialization and size management
   */
  set<T>(key: string | CacheKey, data: T, customTtl?: number): void {
    const cacheKey = this.buildCacheKey(key);
    const ttl = customTtl || this.config.ttl;
    const serializedData = this.serializeData(data);
    const size = this.calculateSize(serializedData);

    console.log('💾 Caching data for key:', cacheKey, {
      size: `${(size / 1024).toFixed(2)}KB`,
      ttl: `${ttl / 1000}s`,
    });

    // Check cache size limits and evict if necessary
    this.evictIfNecessary(size);

    const entry: CacheEntry<any> = {
      data: serializedData,
      timestamp: Date.now(),
      ttl,
      key: cacheKey,
      size,
      hits: 0,
      lastAccess: Date.now(),
    };

    this.cache.set(cacheKey, entry);
    this.stats.size += size;
    this.stats.entries = this.cache.size;
    this.updateStats();

    // Persist to storage if configured
    if (this.config.strategy !== 'memory') {
      this.saveToStorage(cacheKey, entry);
    }
  }

  /**
   * Check if data exists in cache and is not expired
   */
  has(key: string | CacheKey): boolean {
    const cacheKey = this.buildCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Remove specific entry from cache
   */
  delete(key: string | CacheKey): boolean {
    const cacheKey = this.buildCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (entry) {
      this.stats.size -= entry.size;
      this.cache.delete(cacheKey);
      this.stats.entries = this.cache.size;
      this.updateStats();

      if (this.config.strategy !== 'memory') {
        this.removeFromStorage(cacheKey);
      }

      console.log('🗑️ Removed cache entry:', cacheKey);
      return true;
    }

    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    console.log('🧹 Clearing all cache entries');
    
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0,
      hitRate: 0,
      memoryUsage: 0,
      oldestEntry: 0,
      newestEntry: 0,
    };

    if (this.config.strategy !== 'memory') {
      this.clearStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Invalidate cache entries based on patterns
   */
  invalidate(pattern: string | RegExp): number {
    let invalidated = 0;
    const patternRegex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*'))
      : pattern;

    for (const [key, entry] of this.cache.entries()) {
      if (patternRegex.test(key)) {
        this.stats.size -= entry.size;
        this.cache.delete(key);
        invalidated++;

        if (this.config.strategy !== 'memory') {
          this.removeFromStorage(key);
        }
      }
    }

    this.stats.entries = this.cache.size;
    this.updateStats();

    console.log(`🗑️ Invalidated ${invalidated} cache entries matching pattern:`, pattern);
    return invalidated;
  }

  /**
   * Get cached analytics data with fallback
   */
  getAnalyticsData(filters?: any): FormbricksAnalyticsData | null {
    const key: CacheKey = {
      type: 'analytics',
      identifier: 'main',
      filters: filters ? JSON.stringify(filters) : undefined,
    };

    return this.get<FormbricksAnalyticsData>(key);
  }

  /**
   * Cache analytics data
   */
  setAnalyticsData(data: FormbricksAnalyticsData, filters?: any): void {
    const key: CacheKey = {
      type: 'analytics',
      identifier: 'main',
      filters: filters ? JSON.stringify(filters) : undefined,
    };

    // Use longer TTL for analytics data as it's expensive to compute
    this.set(key, data, 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Cache survey responses
   */
  setSurveyResponses(surveyId: string, responses: FormbricksSurveyResponse[]): void {
    const key: CacheKey = {
      type: 'responses',
      identifier: surveyId,
    };

    this.set(key, responses, 3 * 60 * 1000); // 3 minutes for responses
  }

  /**
   * Get cached survey responses
   */
  getSurveyResponses(surveyId: string): FormbricksSurveyResponse[] | null {
    const key: CacheKey = {
      type: 'responses',
      identifier: surveyId,
    };

    return this.get<FormbricksSurveyResponse[]>(key);
  }

  /**
   * Cache survey list
   */
  setSurveys(surveys: FormbricksSurvey[]): void {
    const key: CacheKey = {
      type: 'surveys',
      identifier: 'all',
    };

    this.set(key, surveys, 15 * 60 * 1000); // 15 minutes for survey list
  }

  /**
   * Get cached surveys
   */
  getSurveys(): FormbricksSurvey[] | null {
    const key: CacheKey = {
      type: 'surveys',
      identifier: 'all',
    };

    return this.get<FormbricksSurvey[]>(key);
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(dataLoader: {
    loadSurveys: () => Promise<FormbricksSurvey[]>;
    loadAnalytics: () => Promise<FormbricksAnalyticsData>;
  }): Promise<void> {
    try {
      console.log('🔥 Warming cache with frequently accessed data...');

      const [surveys, analytics] = await Promise.all([
        dataLoader.loadSurveys().catch(err => {
          console.warn('⚠️ Failed to warm surveys cache:', err);
          return null;
        }),
        dataLoader.loadAnalytics().catch(err => {
          console.warn('⚠️ Failed to warm analytics cache:', err);
          return null;
        }),
      ]);

      if (surveys) {
        this.setSurveys(surveys);
      }

      if (analytics) {
        this.setAnalyticsData(analytics);
      }

      console.log('✅ Cache warming completed');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }

  /**
   * Private helper methods
   */
  private buildCacheKey(key: string | CacheKey): string {
    if (typeof key === 'string') {
      return `${this.config.prefix}${key}`;
    }

    const parts = [this.config.prefix, key.type, key.identifier];
    
    if (key.filters) {
      // Create a stable hash of filters for consistent caching
      parts.push(this.hashString(key.filters));
    }

    if (key.timestamp) {
      // For time-based cache keys
      parts.push(String(key.timestamp));
    }

    return parts.join('_');
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private serializeData(data: any): any {
    if (this.config.enableCompression) {
      // Simple compression by JSON stringifying and compressing common patterns
      return this.compressData(JSON.stringify(data));
    }
    
    return data;
  }

  private deserializeData(data: any): any {
    if (this.config.enableCompression && typeof data === 'string') {
      try {
        return JSON.parse(this.decompressData(data));
      } catch (error) {
        console.warn('⚠️ Failed to decompress cache data, returning as-is:', error);
        return data;
      }
    }
    
    return data;
  }

  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // Approximate size in bytes for UTF-16
    }
    
    return JSON.stringify(data).length * 2;
  }

  private evictIfNecessary(newEntrySize: number): void {
    // Check if we need to evict entries to make room
    while (this.cache.size >= this.config.maxSize || 
           (this.stats.size + newEntrySize) > (this.config.maxSize * 1024 * 1024)) {
      
      const oldestEntry = this.findOldestEntry();
      if (oldestEntry) {
        console.log('🗑️ Evicting oldest cache entry:', oldestEntry.key);
        this.cache.delete(oldestEntry.key);
        this.stats.size -= oldestEntry.size;
      } else {
        break; // Safety break
      }
    }
  }

  private findOldestEntry(): CacheEntry<any> | null {
    let oldest: CacheEntry<any> | null = null;
    
    for (const entry of this.cache.values()) {
      if (!oldest || entry.lastAccess < oldest.lastAccess) {
        oldest = entry;
      }
    }
    
    return oldest;
  }

  private updateStats(): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    this.stats.entries = this.cache.size;

    // Calculate oldest and newest entries
    let oldest = Date.now();
    let newest = 0;

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }

    this.stats.oldestEntry = oldest;
    this.stats.newestEntry = newest;
    this.stats.memoryUsage = this.stats.size;
  }

  private setupCleanupInterval(): void {
    // Clean expired entries every 2 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 2 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.stats.size -= entry.size;
        cleaned++;

        if (this.config.strategy !== 'memory') {
          this.removeFromStorage(key);
        }
      }
    }

    if (cleaned > 0) {
      this.stats.entries = this.cache.size;
      this.updateStats();
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private compressData(data: string): string {
    // Simple compression - replace common patterns
    return data
      .replace(/{"id"/g, '{"i"')
      .replace(/"timestamp"/g, '"t"')
      .replace(/"data"/g, '"d"')
      .replace(/"surveyId"/g, '"s"')
      .replace(/"createdAt"/g, '"c"')
      .replace(/"updatedAt"/g, '"u"');
  }

  private decompressData(data: string): string {
    // Reverse compression
    return data
      .replace(/{"i"/g, '{"id"')
      .replace(/"t"/g, '"timestamp"')
      .replace(/"d"/g, '"data"')
      .replace(/"s"/g, '"surveyId"')
      .replace(/"c"/g, '"createdAt"')
      .replace(/"u"/g, '"updatedAt"');
  }

  /**
   * Persistent storage methods
   */
  private loadFromStorage(): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;

      const keys = Object.keys(storage).filter(key => 
        key.startsWith(this.config.prefix!)
      );

      let loaded = 0;
      for (const key of keys) {
        try {
          const entryData = storage.getItem(key);
          if (entryData) {
            const entry: CacheEntry<any> = JSON.parse(entryData);
            if (!this.isExpired(entry)) {
              this.cache.set(key, entry);
              this.stats.size += entry.size;
              loaded++;
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to load cache entry from storage:', key, error);
        }
      }

      this.stats.entries = this.cache.size;
      console.log(`📂 Loaded ${loaded} cache entries from storage`);
    } catch (error) {
      console.warn('⚠️ Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(key, JSON.stringify(entry));
      }
    } catch (error) {
      console.warn('⚠️ Failed to save cache entry to storage:', key, error);
    }
  }

  private removeFromStorage(key: string): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(key);
      }
    } catch (error) {
      console.warn('⚠️ Failed to remove cache entry from storage:', key, error);
    }
  }

  private clearStorage(): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;

      const keys = Object.keys(storage).filter(key => 
        key.startsWith(this.config.prefix!)
      );

      for (const key of keys) {
        storage.removeItem(key);
      }

      console.log('🧹 Cleared cache from storage');
    } catch (error) {
      console.warn('⚠️ Failed to clear cache from storage:', error);
    }
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    switch (this.config.strategy) {
      case 'localStorage':
        return window.localStorage;
      case 'sessionStorage':
        return window.sessionStorage;
      default:
        return null;
    }
  }
}

/**
 * Create configured cache instance
 */
export function createAnalyticsCache(config?: Partial<CacheConfig>): FormbricksAnalyticsCache {
  return new FormbricksAnalyticsCache(config);
}

/**
 * Default cache instance
 */
let defaultCache: FormbricksAnalyticsCache | null = null;

export function getDefaultCache(): FormbricksAnalyticsCache {
  if (!defaultCache) {
    defaultCache = createAnalyticsCache({
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 50,
      strategy: typeof window !== 'undefined' ? 'localStorage' : 'memory',
      enableCompression: true,
    });
  }
  
  return defaultCache;
}