'use client';

import { FormbricksManager } from './formbricks-manager';
import { FORMBRICKS_EVENTS } from './types';

export interface UserContext {
  userId: string;
  email: string;
  subscriptionTier: 'free' | 'premium' | 'enterprise' | 'anonymous';
  quotesCreated: number;
  totalRevenue: number;
  userType: 'new_user' | 'regular_user' | 'power_user';
  activityLevel: 'new' | 'active' | 'very_active';
  features?: string[];
  [key: string]: any;
}

export interface SyncOptions {
  immediate?: boolean;
  includeUsageStats?: boolean;
  includeBrowserContext?: boolean;
  customAttributes?: Record<string, any>;
}

/**
 * Context synchronization utilities for Formbricks
 */
export class FormbricksContextSync {
  private static instance: FormbricksContextSync;
  private lastSyncHash: string = '';
  private syncInProgress: boolean = false;

  private constructor() {}

  static getInstance(): FormbricksContextSync {
    if (!FormbricksContextSync.instance) {
      FormbricksContextSync.instance = new FormbricksContextSync();
    }
    return FormbricksContextSync.instance;
  }

  /**
   * Sync user context to Formbricks with deduplication
   */
  async syncUserContext(context: UserContext, options: SyncOptions = {}): Promise<boolean> {
    if (this.syncInProgress && !options.immediate) {
      console.log('🔄 Context sync already in progress, skipping...');
      return false;
    }

    this.syncInProgress = true;

    try {
      const manager = FormbricksManager.getInstance();
      
      if (!manager.isInitialized()) {
        console.warn('⚠️ Formbricks not initialized, queuing context sync');
        return false;
      }

      // Build comprehensive attributes
      const attributes = await this.buildAttributes(context, options);
      
      // Check if context has changed
      const contextHash = this.generateContextHash(attributes);
      if (this.lastSyncHash === contextHash && !options.immediate) {
        console.log('🔄 Context unchanged, skipping sync');
        return false;
      }

      // Sync to Formbricks
      manager.setAttributes(attributes);
      this.lastSyncHash = contextHash;

      // Track sync event
      manager.track(FORMBRICKS_EVENTS.DAILY_ACTIVE_USER, {
        syncedAt: new Date().toISOString(),
        attributeCount: Object.keys(attributes).length,
        hasUsageStats: options.includeUsageStats,
        hasBrowserContext: options.includeBrowserContext
      });

      console.log('✅ User context synced successfully', {
        userId: context.userId,
        tier: context.subscriptionTier,
        attributeCount: Object.keys(attributes).length
      });

      return true;

    } catch (error) {
      console.error('❌ Failed to sync user context:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Update specific context attributes without full sync
   */
  async updateContextAttributes(updates: Record<string, any>): Promise<boolean> {
    try {
      const manager = FormbricksManager.getInstance();
      
      if (!manager.isInitialized()) {
        console.warn('⚠️ Formbricks not initialized, cannot update attributes');
        return false;
      }

      manager.setAttributes({
        ...updates,
        lastUpdateTime: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to update context attributes:', error);
      return false;
    }
  }

  /**
   * Sync usage statistics separately
   */
  async syncUsageStats(stats: {
    quotesCreated: number;
    totalRevenue: number;
    quotesThisMonth: number;
    averageQuoteValue: number;
    daysActive: number;
  }): Promise<boolean> {
    return this.updateContextAttributes({
      quotesCreated: stats.quotesCreated,
      totalRevenue: stats.totalRevenue,
      quotesThisMonth: stats.quotesThisMonth,
      averageQuoteValue: stats.averageQuoteValue,
      daysActive: stats.daysActive,
      revenueCategory: this.categorizeRevenue(stats.totalRevenue),
      userType: this.categorizeUser(stats.quotesCreated),
      activityLevel: this.categorizeActivity(stats.daysActive),
      usageStatsUpdatedAt: new Date().toISOString()
    });
  }

  /**
   * Sync subscription changes
   */
  async syncSubscriptionChange(newTier: string, additionalData?: Record<string, any>): Promise<boolean> {
    const manager = FormbricksManager.getInstance();
    
    // Track subscription change event
    manager.track(FORMBRICKS_EVENTS.UPGRADE_COMPLETED, {
      newTier,
      previousTier: 'unknown', // Would need to be tracked separately
      changeDate: new Date().toISOString(),
      ...additionalData
    });

    // Update context
    return this.updateContextAttributes({
      subscriptionTier: newTier,
      isPremium: newTier !== 'free',
      subscriptionUpdatedAt: new Date().toISOString(),
      ...additionalData
    });
  }

  /**
   * Build comprehensive attributes object
   */
  private async buildAttributes(context: UserContext, options: SyncOptions): Promise<Record<string, any>> {
    const attributes: Record<string, any> = {
      // Basic user info
      userId: context.userId,
      email: context.email,
      emailDomain: context.email.split('@')[1] || '',
      
      // Subscription info
      subscriptionTier: context.subscriptionTier,
      isPremium: context.subscriptionTier !== 'free' && context.subscriptionTier !== 'anonymous',
      
      // User categorization
      userType: context.userType,
      activityLevel: context.activityLevel,
    };

    // Add usage statistics
    if (options.includeUsageStats) {
      attributes.quotesCreated = context.quotesCreated;
      attributes.totalRevenue = context.totalRevenue;
      attributes.revenueCategory = this.categorizeRevenue(context.totalRevenue);
      
      if (context.features) {
        attributes.featuresUsed = context.features.join(',');
        attributes.featureCount = context.features.length;
      }
    }

    // Add browser context
    if (options.includeBrowserContext && typeof window !== 'undefined') {
      attributes.currentPage = window.location.pathname;
      attributes.referrer = document.referrer;
      attributes.screenResolution = `${window.screen.width}x${window.screen.height}`;
      attributes.userAgent = window.navigator.userAgent;
      attributes.language = window.navigator.language;
      attributes.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      attributes.cookiesEnabled = navigator.cookieEnabled;
    }

    // Add custom attributes
    if (options.customAttributes) {
      Object.assign(attributes, options.customAttributes);
    }

    // Add sync metadata
    attributes.lastSyncTime = new Date().toISOString();
    attributes.contextVersion = '1.0.0';

    return attributes;
  }

  /**
   * Generate hash for context change detection
   */
  private generateContextHash(attributes: Record<string, any>): string {
    // Create a stable hash by sorting keys and stringifying
    const sortedKeys = Object.keys(attributes).sort();
    const stableString = sortedKeys.map(key => `${key}:${attributes[key]}`).join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < stableString.length; i++) {
      const char = stableString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Categorize revenue for segmentation
   */
  private categorizeRevenue(revenue: number): 'low' | 'medium' | 'high' | 'enterprise' {
    if (revenue >= 100000) return 'enterprise';
    if (revenue >= 50000) return 'high';
    if (revenue >= 10000) return 'medium';
    return 'low';
  }

  /**
   * Categorize user based on quote count
   */
  private categorizeUser(quotesCreated: number): 'new_user' | 'regular_user' | 'power_user' {
    if (quotesCreated >= 50) return 'power_user';
    if (quotesCreated >= 10) return 'regular_user';
    return 'new_user';
  }

  /**
   * Categorize activity level
   */
  private categorizeActivity(daysActive: number): 'new' | 'active' | 'very_active' {
    if (daysActive >= 30) return 'very_active';
    if (daysActive >= 7) return 'active';
    return 'new';
  }

  /**
   * Clear sync state (useful for testing)
   */
  clearSyncState(): void {
    this.lastSyncHash = '';
    this.syncInProgress = false;
  }
}

/**
 * Convenience function to get the singleton instance
 */
export const getContextSync = () => FormbricksContextSync.getInstance();