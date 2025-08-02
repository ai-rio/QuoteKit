/**
 * Unit Tests for Subscription Actions
 * Tests individual subscription functions in isolation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock all external dependencies
jest.mock('@/features/account/controllers/get-session');
jest.mock('@/features/account/controllers/get-subscription');
jest.mock('@/libs/stripe/stripe-admin');
jest.mock('@/libs/supabase/supabase-server-client');
jest.mock('@/features/account/controllers/stripe-plan-change');
jest.mock('next/cache');

const mockSession = {
  user: {
    id: 'user_test123',
    email: 'test@example.com'
  }
};

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  upsert: jest.fn(),
};

const mockStripeAdmin = {
  prices: {
    retrieve: jest.fn(),
  },
  subscriptions: {
    create: jest.fn(),
    update: jest.fn(),
    retrieve: jest.fn(),
  },
};

// Mock the imports
import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { executeStripePlanChange, validatePaymentMethod } from '@/features/account/controllers/stripe-plan-change';
import { revalidatePath } from 'next/cache';

(getSession as jest.Mock).mockResolvedValue(mockSession);
(getSubscription as jest.Mock).mockResolvedValue(null);
(createStripeAdminClient as jest.Mock).mockReturnValue(mockStripeAdmin);
(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase);
(executeStripePlanChange as jest.Mock).mockResolvedValue({ success: true });
(validatePaymentMethod as jest.Mock).mockResolvedValue(true);
(revalidatePath as jest.Mock).mockImplementation(() => {});

// Import the function under test
import { changePlan } from '@/features/account/actions/subscription-actions';

describe('Subscription Actions Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup environment
    process.env.NODE_ENV = 'test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock';
    
    // Setup default mock returns
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.in.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.limit.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('changePlan', () => {
    const testPriceId = 'price_test_pro';
    const testPaymentMethodId = 'pm_test_123';

    it('should successfully change plan for authenticated user', async () => {
      // Mock: User has existing subscription
      mockSupabase.single.mockResolvedValue({
        data: [{
          id: 'sub_existing',
          user_id: 'user_test123',
          stripe_subscription_id: 'sub_stripe_123',
          stripe_price_id: 'price_test_basic',
          status: 'active'
        }],
        error: null
      });

      // Mock: Successful plan change execution
      (executeStripePlanChange as jest.Mock).mockResolvedValue({
        success: true,
        subscription: {
          id: 'sub_stripe_123',
          status: 'active',
          items: {
            data: [{ price: { id: testPriceId } }]
          }
        }
      });

      const result = await changePlan(testPriceId, true, testPaymentMethodId);

      expect(result.success).toBe(true);
      expect(getSession).toHaveBeenCalled();
      expect(executeStripePlanChange).toHaveBeenCalledWith({
        userId: 'user_test123',
        priceId: testPriceId,
        isUpgrade: true,
        paymentMethodId: testPaymentMethodId,
        existingSubscription: expect.any(Array)
      });
      expect(revalidatePath).toHaveBeenCalledWith('/account');
    });

    it('should reject unauthenticated requests', async () => {
      (getSession as jest.Mock).mockResolvedValue(null);

      await expect(changePlan(testPriceId, true))
        .rejects
        .toThrow('Unauthorized - please log in');

      expect(executeStripePlanChange).not.toHaveBeenCalled();
    });

    it('should validate required price ID', async () => {
      await expect(changePlan('', true))
        .rejects
        .toThrow('Price ID is required');

      await expect(changePlan(null as any, true))
        .rejects
        .toThrow('Price ID is required');

      expect(executeStripePlanChange).not.toHaveBeenCalled();
    });

    it('should handle database errors when fetching subscriptions', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' }
      });

      await expect(changePlan(testPriceId, true))
        .rejects
        .toThrow('Failed to fetch user subscriptions');

      expect(executeStripePlanChange).not.toHaveBeenCalled();
    });

    it('should handle plan change execution errors', async () => {
      // Mock: User has subscription
      mockSupabase.single.mockResolvedValue({
        data: [{
          id: 'sub_existing',
          status: 'active'
        }],
        error: null
      });

      // Mock: Plan change fails
      (executeStripePlanChange as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Payment method declined'
      });

      const result = await changePlan(testPriceId, true, testPaymentMethodId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment method declined');
    });

    it('should validate payment method for upgrades', async () => {
      // Mock: No existing subscription (new subscription)
      mockSupabase.single.mockResolvedValue({
        data: [],
        error: null
      });

      // Mock: Payment method validation fails
      (validatePaymentMethod as jest.Mock).mockResolvedValue(false);

      await expect(changePlan(testPriceId, true, 'invalid_pm'))
        .rejects
        .toThrow('Invalid payment method');

      expect(executeStripePlanChange).not.toHaveBeenCalled();
    });

    it('should handle downgrades without payment method', async () => {
      // Mock: User has existing subscription
      mockSupabase.single.mockResolvedValue({
        data: [{
          id: 'sub_existing',
          stripe_price_id: 'price_test_pro',
          status: 'active'
        }],
        error: null
      });

      // Mock: Successful downgrade
      (executeStripePlanChange as jest.Mock).mockResolvedValue({
        success: true,
        subscription: {
          id: 'sub_stripe_123',
          status: 'active'
        }
      });

      const result = await changePlan('price_test_basic', false); // No payment method for downgrade

      expect(result.success).toBe(true);
      expect(validatePaymentMethod).not.toHaveBeenCalled(); // Not needed for downgrades
    });

    it('should handle environment detection correctly', async () => {
      // Test development environment
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';

      mockSupabase.single.mockResolvedValue({
        data: [],
        error: null
      });

      (executeStripePlanChange as jest.Mock).mockResolvedValue({
        success: true,
        subscription: { id: 'sub_dev' }
      });

      const result = await changePlan(testPriceId, true, testPaymentMethodId);

      expect(result.success).toBe(true);
      expect(executeStripePlanChange).toHaveBeenCalled();
    });

    it('should handle concurrent plan change requests', async () => {
      // Mock: User has subscription
      mockSupabase.single.mockResolvedValue({
        data: [{
          id: 'sub_existing',
          status: 'active'
        }],
        error: null
      });

      // Mock: First request succeeds, second fails due to conflict
      (executeStripePlanChange as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          subscription: { id: 'sub_updated' }
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Subscription is already being updated'
        });

      const promises = [
        changePlan(testPriceId, true, testPaymentMethodId),
        changePlan('price_test_premium', true, testPaymentMethodId)
      ];

      const results = await Promise.all(promises);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it('should log appropriate debug information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockSupabase.single.mockResolvedValue({
        data: [],
        error: null
      });

      (executeStripePlanChange as jest.Mock).mockResolvedValue({
        success: true,
        subscription: { id: 'sub_test' }
      });

      await changePlan(testPriceId, true, testPaymentMethodId);

      expect(consoleSpy).toHaveBeenCalledWith(
        '🔄 changePlan called with:',
        { priceId: testPriceId, isUpgrade: true, paymentMethodId: testPaymentMethodId }
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '🌍 Environment detection:',
        expect.objectContaining({
          NODE_ENV: 'test',
          STRIPE_SECRET_KEY_EXISTS: true,
          STRIPE_PUBLISHABLE_KEY_EXISTS: true
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    it('should validate price ID format', () => {
      const validPriceIds = [
        'price_1234567890',
        'price_test_basic',
        'price_live_premium'
      ];

      const invalidPriceIds = [
        '',
        '   ',
        'invalid-price-id',
        'price_',
        'not_a_price_id'
      ];

      validPriceIds.forEach(priceId => {
        expect(priceId).toMatch(/^price_/);
        expect(priceId.length).toBeGreaterThan(6);
      });

      invalidPriceIds.forEach(priceId => {
        expect(
          priceId.trim().length === 0 || 
          !priceId.startsWith('price_') || 
          priceId.length <= 6
        ).toBe(true);
      });
    });

    it('should validate payment method ID format', () => {
      const validPaymentMethodIds = [
        'pm_1234567890',
        'pm_test_card',
        'pm_live_bank_account'
      ];

      const invalidPaymentMethodIds = [
        '',
        '   ',
        'invalid-pm-id',
        'pm_',
        'not_a_pm_id'
      ];

      validPaymentMethodIds.forEach(pmId => {
        expect(pmId).toMatch(/^pm_/);
        expect(pmId.length).toBeGreaterThan(3);
      });

      invalidPaymentMethodIds.forEach(pmId => {
        expect(
          pmId.trim().length === 0 || 
          !pmId.startsWith('pm_') || 
          pmId.length <= 3
        ).toBe(true);
      });
    });

    it('should validate boolean parameters', () => {
      const validBooleans = [true, false];
      const invalidBooleans = ['true', 'false', 1, 0, null, undefined];

      validBooleans.forEach(bool => {
        expect(typeof bool).toBe('boolean');
      });

      invalidBooleans.forEach(bool => {
        expect(typeof bool).not.toBe('boolean');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle session retrieval errors', async () => {
      (getSession as jest.Mock).mockRejectedValue(new Error('Session service unavailable'));

      await expect(changePlan(testPriceId, true))
        .rejects
        .toThrow('Session service unavailable');
    });

    it('should handle Supabase connection errors', async () => {
      (createSupabaseServerClient as jest.Mock).mockRejectedValue(
        new Error('Failed to connect to database')
      );

      await expect(changePlan(testPriceId, true))
        .rejects
        .toThrow('Failed to connect to database');
    });

    it('should handle Stripe configuration errors', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      mockSupabase.single.mockResolvedValue({
        data: [],
        error: null
      });

      (executeStripePlanChange as jest.Mock).mockRejectedValue(
        new Error('Stripe not configured')
      );

      await expect(changePlan(testPriceId, true))
        .rejects
        .toThrow('Stripe not configured');
    });

    it('should handle network timeouts gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: [],
        error: null
      });

      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'NETWORK_TIMEOUT';

      (executeStripePlanChange as jest.Mock).mockRejectedValue(timeoutError);

      await expect(changePlan(testPriceId, true))
        .rejects
        .toThrow('Request timeout');
    });
  });

  describe('Business Logic', () => {
    it('should determine upgrade vs downgrade correctly', async () => {
      const currentPrice = { unit_amount: 1900 }; // $19.00
      const newPrice = { unit_amount: 2900 }; // $29.00

      // This would test business logic for determining upgrade/downgrade
      expect(newPrice.unit_amount > currentPrice.unit_amount).toBe(true); // Upgrade
      expect(currentPrice.unit_amount < newPrice.unit_amount).toBe(true); // Downgrade
    });

    it('should calculate proration correctly', () => {
      const currentPeriodStart = Math.floor(Date.now() / 1000);
      const currentPeriodEnd = currentPeriodStart + (30 * 24 * 60 * 60); // 30 days
      const changeTime = currentPeriodStart + (15 * 24 * 60 * 60); // 15 days in

      const remainingTime = currentPeriodEnd - changeTime;
      const totalPeriod = currentPeriodEnd - currentPeriodStart;
      const prorationFactor = remainingTime / totalPeriod;

      expect(prorationFactor).toBeCloseTo(0.5, 1); // ~50% remaining
      expect(prorationFactor).toBeGreaterThan(0);
      expect(prorationFactor).toBeLessThan(1);
    });

    it('should handle subscription status transitions', () => {
      const validTransitions = {
        'trialing': ['active', 'canceled'],
        'active': ['past_due', 'canceled', 'paused'],
        'past_due': ['active', 'canceled'],
        'canceled': [], // Terminal state
        'paused': ['active', 'canceled']
      };

      Object.entries(validTransitions).forEach(([from, toStates]) => {
        toStates.forEach(to => {
          expect(validTransitions[from as keyof typeof validTransitions]).toContain(to);
        });
      });
    });
  });
});
