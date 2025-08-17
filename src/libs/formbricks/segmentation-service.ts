/**
 * FB-018: User Segmentation Service
 * Implements automatic user segmentation for targeted surveys
 */

import { UserActivity,UserSegment } from '@/components/feedback/types';

export interface UserSegmentData {
  segment: UserSegment;
  confidence: number;
  lastUpdated: Date;
  criteria: {
    subscriptionTier?: string;
    usagePattern?: string;
    businessValue?: string;
    accountAge?: number;
    quotesCreated?: number;
  };
}

export class SegmentationService {
  /**
   * Calculate user segment based on comprehensive criteria
   */
  static calculateUserSegment(userActivity: UserActivity): UserSegmentData {
    const { subscriptionTier, accountAge, quotesCreated, averageQuoteValue } = userActivity;
    
    // Determine segment based on multiple factors
    let segment: UserSegment;
    let confidence = 0.8;
    
    // New users (< 30 days)
    if (accountAge < 30) {
      segment = 'new_user';
      confidence = 0.9;
    }
    // Heavy users (50+ quotes)
    else if (quotesCreated >= 50) {
      segment = 'heavy_user';
      confidence = 0.9;
    }
    // Enterprise tier users
    else if (subscriptionTier === 'enterprise') {
      segment = 'enterprise';
      confidence = 0.95;
    }
    // Pro tier users
    else if (subscriptionTier === 'pro') {
      segment = 'pro';
      confidence = 0.9;
    }
    // Light users (< 5 quotes in 90+ days)
    else if (quotesCreated < 5 && accountAge > 90) {
      segment = 'light_user';
      confidence = 0.85;
    }
    // Default to free tier
    else {
      segment = 'free';
      confidence = 0.8;
    }

    return {
      segment,
      confidence,
      lastUpdated: new Date(),
      criteria: {
        subscriptionTier,
        accountAge,
        quotesCreated,
        usagePattern: this.determineUsagePattern(userActivity),
        businessValue: this.determineBusinessValue(averageQuoteValue),
      }
    };
  }

  /**
   * Determine usage pattern based on activity
   */
  private static determineUsagePattern(userActivity: UserActivity): string {
    const { quotesCreated, accountAge } = userActivity;
    const quotesPerMonth = quotesCreated / Math.max(1, accountAge / 30);
    
    if (quotesPerMonth >= 10) return 'heavy';
    if (quotesPerMonth >= 3) return 'moderate';
    if (quotesPerMonth >= 1) return 'light';
    return 'minimal';
  }

  /**
   * Determine business value tier based on quote values
   */
  private static determineBusinessValue(averageQuoteValue: number): string {
    if (averageQuoteValue >= 100000) return 'enterprise';
    if (averageQuoteValue >= 25000) return 'mid_market';
    if (averageQuoteValue >= 5000) return 'small_business';
    return 'startup';
  }

  /**
   * Update user segment in Formbricks user attributes
   */
  static async updateUserSegment(userId: string, segmentData: UserSegmentData): Promise<void> {
    try {
      // Get Formbricks instance
      const formbricks = (window as any).formbricks;
      if (!formbricks) {
        console.warn('[SegmentationService] Formbricks not available');
        return;
      }

      // Set user attributes in Formbricks
      await formbricks.setUserId(userId);
      await formbricks.setUserAttribute('segment', segmentData.segment);
      await formbricks.setUserAttribute('segment_confidence', segmentData.confidence);
      await formbricks.setUserAttribute('segment_last_updated', segmentData.lastUpdated.toISOString());
      await formbricks.setUserAttribute('usage_pattern', segmentData.criteria.usagePattern);
      await formbricks.setUserAttribute('business_value', segmentData.criteria.businessValue);
      
      console.log(`[SegmentationService] Updated user ${userId} segment to: ${segmentData.segment}`);
    } catch (error) {
      console.error('[SegmentationService] Failed to update user segment:', error);
    }
  }

  /**
   * Get cached segment data from localStorage
   */
  static getCachedSegment(userId: string): UserSegmentData | null {
    try {
      const cached = localStorage.getItem(`user_segment_${userId}`);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();
      
      // Check if cache is still valid (24 hours)
      const cacheAgeHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      if (cacheAgeHours > 24) return null;
      
      return {
        ...data,
        lastUpdated
      };
    } catch (error) {
      console.error('[SegmentationService] Failed to get cached segment:', error);
      return null;
    }
  }

  /**
   * Cache segment data in localStorage
   */
  static setCachedSegment(userId: string, segmentData: UserSegmentData): void {
    try {
      localStorage.setItem(`user_segment_${userId}`, JSON.stringify(segmentData));
    } catch (error) {
      console.error('[SegmentationService] Failed to cache segment data:', error);
    }
  }
}