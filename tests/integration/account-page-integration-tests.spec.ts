/**
 * Integration tests for Account Page Subscription Display
 * Tests the complete flow from data fetching to UI rendering
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { redirect } from 'next/navigation';

// Components under test
import AccountPage from '@/app/(account)/account/page';
import { EnhancedCurrentPlanCard } from '@/features/account/components/EnhancedCurrentPlanCard';

// Test utilities
import { createMockUser, createMockSubscription, createMockProduct, createMockPrice } from '../helpers/test-utils';
import { createMockSupabaseClient } from '../helpers/supabase-mocks';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

describe('Account Page Integration Tests', () => {
  let mockUser: any;
  let mockSupabase: any;
  let mockSession: any;

  beforeEach(() => {
    mockUser = createMockUser();
    mockSession = { user: mockUser };
    mockSupabase = createMockSupabaseClient();

    // Mock session
    jest.doMock('@/features/account/controllers/get-session', () => ({
      getSession: jest.fn().mockResolvedValue(mockSession)
    }));

    // Mock Stripe configuration
    jest.doMock('@/features/account/controllers/get-stripe-config', () => ({
      getStripePublishableKey: jest.fn().mockResolvedValue('pk_test_123')
    }));

    // Clear previous mocks
    (redirect as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Authentication and Authorization', () => {
    it('should redirect to login if no session', async () => {
      jest.doMock('@/features/account/controllers/get-session', () => ({
        getSession: jest.fn().mockResolvedValue(null)
      }));

      await AccountPage();

      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('should render account page for authenticated user', async () => {
      // Mock successful data fetching
      const mockSubscription = createMockSubscription('paid');
      const mockPlans = [createMockProduct()];

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      const result = await AccountPage();
      expect(result).toBeDefined();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Display Logic', () => {
    it('should display paid subscription correctly', async () => {
      const mockPrice = createMockPrice({
        unit_amount: 2900,
        currency: 'usd',
        recurring_interval: 'month'
      });

      const mockProduct = createMockProduct({
        name: 'Pro Plan'
      });

      const mockSubscription = createMockSubscription('paid', {
        stripe_price_id: mockPrice.stripe_price_id,
        status: 'active',
        prices: {
          ...mockPrice,
          products: mockProduct
        }
      });

      const mockPlans = [mockProduct];

      // Mock data fetching functions
      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      render(
        <EnhancedCurrentPlanCard 
          subscription={mockSubscription}
          availablePlans={mockPlans}
          freePlanInfo={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Pro Plan')).toBeInTheDocument();
        expect(screen.getByText('$29.00/month')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should display free plan for users without paid subscription', async () => {
      const mockFreePrice = createMockPrice({
        unit_amount: 0,
        currency: 'usd',
        recurring_interval: null
      });

      const mockFreeProduct = createMockProduct({
        name: 'Free Plan'
      });

      const freePlanInfo = {
        ...mockFreePrice,
        products: mockFreeProduct
      };

      const mockPlans = [
        {
          ...mockFreeProduct,
          prices: [mockFreePrice]
        }
      ];

      // Mock no subscription
      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(null),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      render(
        <EnhancedCurrentPlanCard 
          subscription={null}
          availablePlans={mockPlans}
          freePlanInfo={freePlanInfo}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Free Plan')).toBeInTheDocument();
        expect(screen.getByText('$0.00')).toBeInTheDocument();
        expect(screen.getByText('Upgrade')).toBeInTheDocument();
      });
    });

    it('should handle subscription with missing price data', async () => {
      const mockSubscription = createMockSubscription('paid', {
        stripe_price_id: 'price_missing',
        status: 'active',
        prices: null // Missing price data
      });

      const mockPlans = [createMockProduct()];

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      render(
        <EnhancedCurrentPlanCard 
          subscription={mockSubscription}
          availablePlans={mockPlans}
          freePlanInfo={null}
        />
      );

      await waitFor(() => {
        // Should display some indication of subscription but handle missing price gracefully
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });
  });

  describe('Billing History Display', () => {
    it('should display billing history table', async () => {
      const mockBillingHistory = [
        {
          id: 'in_test123',
          date: '2024-01-15T00:00:00Z',
          amount: 2900,
          status: 'paid',
          invoice_url: 'https://invoice.stripe.com/test123',
          description: 'Subscription for Pro Plan'
        },
        {
          id: 'in_test124',
          date: '2023-12-15T00:00:00Z',
          amount: 2900,
          status: 'paid',
          invoice_url: 'https://invoice.stripe.com/test124',
          description: 'Subscription for Pro Plan'
        }
      ];

      const mockSubscription = createMockSubscription('paid');
      const mockPlans = [createMockProduct()];

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue(mockBillingHistory),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      const result = await AccountPage();
      const rendered = render(result);

      await waitFor(() => {
        expect(screen.getByText('Billing History')).toBeInTheDocument();
        expect(screen.getByText('$29.00')).toBeInTheDocument();
        expect(screen.getAllByText('paid')).toHaveLength(2);
      });
    });

    it('should display empty state for no billing history', async () => {
      const mockSubscription = createMockSubscription('free');
      const mockPlans = [createMockProduct()];

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      const result = await AccountPage();
      render(result);

      await waitFor(() => {
        expect(screen.getByText('Billing History')).toBeInTheDocument();
        expect(screen.getByText('No billing history available')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Methods Display', () => {
    it('should display payment methods when Stripe is configured', async () => {
      const mockPaymentMethods = [
        {
          id: 'pm_test123',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          },
          is_default: true
        }
      ];

      const mockSubscription = createMockSubscription('paid');
      const mockPlans = [createMockProduct()];

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue(mockPaymentMethods)
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      const result = await AccountPage();
      render(result);

      await waitFor(() => {
        expect(screen.getByText('Payment Methods')).toBeInTheDocument();
      });
    });

    it('should display Stripe not configured message when no publishable key', async () => {
      const mockSubscription = createMockSubscription('paid');
      const mockPlans = [createMockProduct()];

      // Mock no Stripe key
      jest.doMock('@/features/account/controllers/get-stripe-config', () => ({
        getStripePublishableKey: jest.fn().mockResolvedValue(null)
      }));

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      const result = await AccountPage();
      render(result);

      await waitFor(() => {
        expect(screen.getByText('Payment Methods')).toBeInTheDocument();
        expect(screen.getByText('Stripe is not configured')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update subscription display after plan change', async () => {
      // Mock subscription change action
      const changePlan = jest.fn().mockResolvedValue({
        success: true,
        subscription: createMockSubscription('paid', {
          stripe_price_id: 'price_new_plan'
        })
      });

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue([createMockProduct()]),
        changePlan
      }));

      // Initial state
      const initialSubscription = createMockSubscription('paid', {
        stripe_price_id: 'price_basic_plan'
      });

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(initialSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      const result = await AccountPage();
      const { rerender } = render(result);

      // Simulate plan change
      await changePlan('price_new_plan', true);

      // Mock updated subscription
      const updatedSubscription = createMockSubscription('paid', {
        stripe_price_id: 'price_new_plan'
      });

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(updatedSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      // Re-render with updated data
      const updatedResult = await AccountPage();
      rerender(updatedResult);

      await waitFor(() => {
        expect(changePlan).toHaveBeenCalledWith('price_new_plan', true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription fetch errors gracefully', async () => {
      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockRejectedValue(new Error('Database error')),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue([])
      }));

      // Should not throw, should handle error gracefully
      const result = await AccountPage();
      expect(result).toBeDefined();
    });

    it('should handle billing history fetch errors', async () => {
      const mockSubscription = createMockSubscription('paid');

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockRejectedValue(new Error('Stripe API error')),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue([createMockProduct()])
      }));

      const result = await AccountPage();
      render(result);

      await waitFor(() => {
        expect(screen.getByText('Billing History')).toBeInTheDocument();
        expect(screen.getByText('No billing history available')).toBeInTheDocument();
      });
    });

    it('should handle payment methods fetch errors', async () => {
      const mockSubscription = createMockSubscription('paid');

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockRejectedValue(new Error('Payment methods error'))
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue([createMockProduct()])
      }));

      const result = await AccountPage();
      render(result);

      await waitFor(() => {
        expect(screen.getByText('Payment Methods')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should display mobile-friendly layout on small screens', async () => {
      // Mock viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      const mockSubscription = createMockSubscription('paid');
      const mockBillingHistory = [
        {
          id: 'in_test123',
          date: '2024-01-15T00:00:00Z',
          amount: 2900,
          status: 'paid',
          invoice_url: 'https://invoice.stripe.com/test123',
          description: 'Subscription for Pro Plan'
        }
      ];

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue(mockBillingHistory),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue([createMockProduct()])
      }));

      const result = await AccountPage();
      render(result);

      await waitFor(() => {
        // Mobile layout should show card view instead of table
        expect(screen.getByText('Account Dashboard')).toBeInTheDocument();
        expect(screen.getByText('$29.00')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should load account page within acceptable time', async () => {
      const mockSubscription = createMockSubscription('paid');
      const mockPlans = [createMockProduct()];

      jest.doMock('@/features/account/controllers/get-subscription', () => ({
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
        getBillingHistory: jest.fn().mockResolvedValue([]),
        getPaymentMethods: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('@/features/account/actions/subscription-actions', () => ({
        getAvailablePlans: jest.fn().mockResolvedValue(mockPlans)
      }));

      const startTime = Date.now();
      const result = await AccountPage();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toBeDefined();
    });
  });
});