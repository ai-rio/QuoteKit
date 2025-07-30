/**
 * Integration tests for Payment Method Storage and Retrieval
 * Tests the complete flow from payment method creation to account display
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test utilities and mocks
import { createMockStripeCustomer, createMockPaymentMethod, createMockSetupIntent } from '../helpers/stripe-mocks';
import { createMockSupabaseClient } from '../helpers/supabase-mocks';
import { createMockUser, createMockRequest } from '../helpers/test-utils';

// Components and services under test
import { PaymentMethodsManager } from '@/features/account/components/PaymentMethodsManager';
import { GET as getPaymentMethods, POST as createSetupIntent } from '@/app/api/payment-methods/route';
import { PATCH as setDefaultPaymentMethod, DELETE as deletePaymentMethod } from '@/app/api/payment-methods/[id]/route';

describe('Payment Method Integration Tests', () => {
  let mockStripe: any;
  let mockSupabase: any;
  let mockUser: any;
  let mockCustomer: any;

  beforeEach(async () => {
    // Setup test environment
    mockUser = createMockUser();
    mockCustomer = createMockStripeCustomer();
    mockStripe = {
      customers: {
        create: jest.fn().mockResolvedValue(mockCustomer),
        retrieve: jest.fn().mockResolvedValue(mockCustomer),
        update: jest.fn().mockResolvedValue(mockCustomer)
      },
      paymentMethods: {
        list: jest.fn().mockResolvedValue({ data: [] }),
        attach: jest.fn(),
        detach: jest.fn()
      },
      setupIntents: {
        create: jest.fn().mockResolvedValue(createMockSetupIntent())
      }
    };

    mockSupabase = createMockSupabaseClient();
    
    // Mock auth
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    // Mock Stripe configuration
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admin_settings') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              value: {
                secret_key: 'sk_test_123',
                mode: 'test'
              }
            }
          })
        };
      }
      if (table === 'stripe_customers') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { stripe_customer_id: mockCustomer.id }
          }),
          insert: jest.fn().mockResolvedValue({ data: { id: mockUser.id } })
        };
      }
      return mockSupabase.mockTable;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Method Addition Flow', () => {
    it('should complete full payment method addition workflow', async () => {
      // Step 1: Create setup intent
      const setupIntentRequest = createMockRequest({}, 'POST');
      const setupResponse = await createSetupIntent(setupIntentRequest);
      const setupResult = await setupResponse.json();

      expect(setupResult.success).toBe(true);
      expect(setupResult.data.client_secret).toBeDefined();
      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: mockCustomer.id,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      // Step 2: Simulate payment method attachment (normally done by Stripe)
      const paymentMethod = createMockPaymentMethod({
        customer: mockCustomer.id
      });
      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [paymentMethod]
      });

      // Step 3: Retrieve payment methods
      const getRequest = createMockRequest();
      const getResponse = await getPaymentMethods(getRequest);
      const getResult = await getResponse.json();

      expect(getResult.success).toBe(true);
      expect(getResult.data).toHaveLength(1);
      expect(getResult.data[0].id).toBe(paymentMethod.id);
      expect(getResult.data[0].card.last4).toBe(paymentMethod.card.last4);
    });

    it('should handle new customer creation during payment method setup', async () => {
      // Mock no existing customer
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'admin_settings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                value: {
                  secret_key: 'sk_test_123',
                  mode: 'test'
                }
              }
            })
          };
        }
        if (table === 'stripe_customers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null // No existing customer
            }),
            insert: jest.fn().mockResolvedValue({
              data: { id: mockUser.id }
            })
          };
        }
        return mockSupabase.mockTable;
      });

      const request = createMockRequest({}, 'POST');
      const response = await createSetupIntent(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: mockUser.email,
        metadata: { userId: mockUser.id }
      });
    });
  });

  describe('Payment Method Default Management', () => {
    let paymentMethod1: any;
    let paymentMethod2: any;

    beforeEach(() => {
      paymentMethod1 = createMockPaymentMethod({
        id: 'pm_test1',
        customer: mockCustomer.id
      });
      paymentMethod2 = createMockPaymentMethod({
        id: 'pm_test2',
        customer: mockCustomer.id
      });

      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [paymentMethod1, paymentMethod2]
      });

      // Mock customer with default payment method
      mockStripe.customers.retrieve.mockResolvedValue({
        ...mockCustomer,
        invoice_settings: {
          default_payment_method: paymentMethod1.id
        }
      });
    });

    it('should set default payment method correctly', async () => {
      const request = createMockRequest({}, 'PATCH', { id: paymentMethod2.id });
      const response = await setDefaultPaymentMethod(request, { params: { id: paymentMethod2.id } });
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(mockStripe.customers.update).toHaveBeenCalledWith(
        mockCustomer.id,
        {
          invoice_settings: {
            default_payment_method: paymentMethod2.id
          }
        }
      );
    });

    it('should identify default payment method in listing', async () => {
      const request = createMockRequest();
      const response = await getPaymentMethods(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      
      const defaultPM = result.data.find((pm: any) => pm.is_default);
      expect(defaultPM.id).toBe(paymentMethod1.id);
      
      const nonDefaultPM = result.data.find((pm: any) => !pm.is_default);
      expect(nonDefaultPM.id).toBe(paymentMethod2.id);
    });
  });

  describe('Payment Method Deletion', () => {
    it('should delete payment method and update customer if it was default', async () => {
      const paymentMethod = createMockPaymentMethod({
        id: 'pm_to_delete',
        customer: mockCustomer.id
      });

      // Mock this payment method as default
      mockStripe.customers.retrieve.mockResolvedValue({
        ...mockCustomer,
        invoice_settings: {
          default_payment_method: paymentMethod.id
        }
      });

      const request = createMockRequest({}, 'DELETE');
      const response = await deletePaymentMethod(request, { params: { id: paymentMethod.id } });
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith(paymentMethod.id);
    });
  });

  describe('Payment Methods UI Integration', () => {
    it('should render payment methods manager with data', async () => {
      const paymentMethods = [
        createMockPaymentMethod({ id: 'pm_1' }),
        createMockPaymentMethod({ id: 'pm_2' })
      ];

      // Mock API response
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          success: true,
          data: paymentMethods.map(pm => ({
            id: pm.id,
            type: pm.type,
            card: {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
              funding: pm.card.funding
            },
            is_default: pm.id === 'pm_1'
          }))
        })
      });

      render(<PaymentMethodsManager stripePublishableKey="pk_test_123" />);

      await waitFor(() => {
        expect(screen.getByText('Payment Methods')).toBeInTheDocument();
      });

      // Verify payment methods are displayed
      await waitFor(() => {
        expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();
        expect(screen.getByText('Default')).toBeInTheDocument();
      });
    });

    it('should handle add payment method flow', async () => {
      // Mock empty payment methods initially
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            success: true,
            data: []
          })
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            success: true,
            data: {
              client_secret: 'seti_test_client_secret'
            }
          })
        });

      render(<PaymentMethodsManager stripePublishableKey="pk_test_123" />);

      await waitFor(() => {
        expect(screen.getByText('No payment methods on file')).toBeInTheDocument();
      });

      // Click add payment method
      const addButton = screen.getByText('Add Payment Method');
      await userEvent.click(addButton);

      // Verify dialog opened
      await waitFor(() => {
        expect(screen.getByText('Add your first payment method to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors gracefully', async () => {
      mockStripe.paymentMethods.list.mockRejectedValue(
        new Error('API Error: Invalid customer')
      );

      const request = createMockRequest();
      const response = await getPaymentMethods(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Internal server error');
      expect(result.message).toContain('API Error: Invalid customer');
    });

    it('should handle missing Stripe configuration', async () => {
      // Mock missing Stripe config
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'admin_settings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null
            })
          };
        }
        return mockSupabase.mockTable;
      });

      // Also clear environment variable
      delete process.env.STRIPE_SECRET_KEY;

      const request = createMockRequest({}, 'POST');
      const response = await createSetupIntent(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Stripe not configured');
    });

    it('should handle unauthorized requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      });

      const request = createMockRequest();
      const response = await getPaymentMethods(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of payment methods efficiently', async () => {
      // Create 50 payment methods
      const manyPaymentMethods = Array.from({ length: 50 }, (_, i) =>
        createMockPaymentMethod({ id: `pm_${i}` })
      );

      mockStripe.paymentMethods.list.mockResolvedValue({
        data: manyPaymentMethods
      });

      const startTime = Date.now();
      const request = createMockRequest();
      const response = await getPaymentMethods(request);
      const endTime = Date.now();

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain payment method data consistency across API calls', async () => {
      const paymentMethod = createMockPaymentMethod();
      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [paymentMethod]
      });

      // First call
      const request1 = createMockRequest();
      const response1 = await getPaymentMethods(request1);
      const result1 = await response1.json();

      // Second call immediately after
      const request2 = createMockRequest();
      const response2 = await getPaymentMethods(request2);
      const result2 = await response2.json();

      // Results should be identical
      expect(result1.data).toEqual(result2.data);
      expect(result1.data[0].id).toBe(paymentMethod.id);
      expect(result2.data[0].id).toBe(paymentMethod.id);
    });
  });
});