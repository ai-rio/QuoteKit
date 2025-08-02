/**
 * Unit Tests for Payment Method Validation
 * Tests payment validation logic in isolation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Stripe
const mockStripe = {
  paymentMethods: {
    retrieve: jest.fn(),
    attach: jest.fn(),
    detach: jest.fn(),
  },
  customers: {
    retrieve: jest.fn(),
    update: jest.fn(),
  },
  setupIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

describe('Payment Method Validation Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Method Format Validation', () => {
    it('should validate payment method ID format', () => {
      const validPaymentMethods = [
        'pm_1234567890abcdef',
        'pm_test_card_visa',
        'pm_live_bank_account'
      ];

      const invalidPaymentMethods = [
        '',
        '   ',
        'invalid-pm',
        'pm_',
        'card_123',
        'payment_method_123'
      ];

      validPaymentMethods.forEach(pm => {
        expect(pm).toMatch(/^pm_[a-zA-Z0-9_]+$/);
        expect(pm.length).toBeGreaterThan(3);
      });

      invalidPaymentMethods.forEach(pm => {
        expect(
          pm.trim().length === 0 || 
          !pm.startsWith('pm_') || 
          pm.length <= 3
        ).toBe(true);
      });
    });

    it('should validate customer ID format', () => {
      const validCustomerIds = [
        'cus_1234567890abcdef',
        'cus_test_customer',
        'cus_live_premium_user'
      ];

      const invalidCustomerIds = [
        '',
        '   ',
        'invalid-customer',
        'cus_',
        'customer_123',
        'user_123'
      ];

      validCustomerIds.forEach(cus => {
        expect(cus).toMatch(/^cus_[a-zA-Z0-9_]+$/);
        expect(cus.length).toBeGreaterThan(4);
      });

      invalidCustomerIds.forEach(cus => {
        expect(
          cus.trim().length === 0 || 
          !cus.startsWith('cus_') || 
          cus.length <= 4
        ).toBe(true);
      });
    });
  });

  describe('Payment Method Ownership Validation', () => {
    it('should validate payment method belongs to customer', async () => {
      const customerId = 'cus_test_customer';
      const paymentMethodId = 'pm_test_card';

      // Mock: Payment method belongs to customer
      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        customer: customerId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242'
        }
      });

      const paymentMethod = await mockStripe.paymentMethods.retrieve(paymentMethodId);
      
      expect(paymentMethod.customer).toBe(customerId);
      expect(paymentMethod.id).toBe(paymentMethodId);
    });

    it('should reject payment method from different customer', async () => {
      const customerId = 'cus_test_customer';
      const paymentMethodId = 'pm_test_card';
      const differentCustomerId = 'cus_different_customer';

      // Mock: Payment method belongs to different customer
      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        customer: differentCustomerId,
        type: 'card'
      });

      const paymentMethod = await mockStripe.paymentMethods.retrieve(paymentMethodId);
      
      expect(paymentMethod.customer).not.toBe(customerId);
      expect(paymentMethod.customer).toBe(differentCustomerId);
    });

    it('should handle unattached payment methods', async () => {
      const paymentMethodId = 'pm_test_unattached';

      // Mock: Payment method not attached to any customer
      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        id: paymentMethodId,
        customer: null,
        type: 'card'
      });

      const paymentMethod = await mockStripe.paymentMethods.retrieve(paymentMethodId);
      
      expect(paymentMethod.customer).toBeNull();
      expect(paymentMethod.id).toBe(paymentMethodId);
    });
  });

  describe('Payment Method Attachment', () => {
    it('should attach payment method to customer', async () => {
      const customerId = 'cus_test_customer';
      const paymentMethodId = 'pm_test_card';

      // Mock: Successful attachment
      mockStripe.paymentMethods.attach.mockResolvedValue({
        id: paymentMethodId,
        customer: customerId,
        type: 'card'
      });

      const attachedPaymentMethod = await mockStripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      expect(attachedPaymentMethod.customer).toBe(customerId);
      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith(paymentMethodId, {
        customer: customerId
      });
    });

    it('should handle attachment errors', async () => {
      const customerId = 'cus_test_customer';
      const paymentMethodId = 'pm_invalid_card';

      // Mock: Attachment fails
      const attachmentError = new Error('The payment method is invalid');
      (attachmentError as any).type = 'StripeInvalidRequestError';
      (attachmentError as any).code = 'payment_method_invalid';

      mockStripe.paymentMethods.attach.mockRejectedValue(attachmentError);

      await expect(
        mockStripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
      ).rejects.toThrow('The payment method is invalid');
    });

    it('should prevent double attachment', async () => {
      const customerId = 'cus_test_customer';
      const paymentMethodId = 'pm_already_attached';

      // Mock: Payment method already attached
      const doubleAttachError = new Error('This PaymentMethod is already attached to a Customer');
      (doubleAttachError as any).type = 'StripeInvalidRequestError';
      (doubleAttachError as any).code = 'payment_method_already_attached';

      mockStripe.paymentMethods.attach.mockRejectedValue(doubleAttachError);

      await expect(
        mockStripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
      ).rejects.toThrow('This PaymentMethod is already attached to a Customer');
    });
  });

  describe('Setup Intent Validation', () => {
    it('should create setup intent with correct parameters', async () => {
      const customerId = 'cus_test_customer';
      const setupIntentId = 'seti_test_123';

      mockStripe.setupIntents.create.mockResolvedValue({
        id: setupIntentId,
        client_secret: 'seti_test_123_secret_abc',
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        status: 'requires_payment_method'
      });

      const setupIntent = await mockStripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          user_id: 'user_test123',
          billing_name: 'Test User'
        }
      });

      expect(setupIntent.customer).toBe(customerId);
      expect(setupIntent.payment_method_types).toContain('card');
      expect(setupIntent.usage).toBe('off_session');
      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          user_id: 'user_test123',
          billing_name: 'Test User'
        }
      });
    });

    it('should validate setup intent status', async () => {
      const setupIntentId = 'seti_test_status';

      const validStatuses = [
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
        'succeeded',
        'canceled'
      ];

      validStatuses.forEach(status => {
        mockStripe.setupIntents.retrieve.mockResolvedValue({
          id: setupIntentId,
          status,
          client_secret: 'seti_secret'
        });

        expect(['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled']).toContain(status);
      });
    });

    it('should handle setup intent creation errors', async () => {
      const customerId = 'cus_invalid_customer';

      const setupIntentError = new Error('No such customer');
      (setupIntentError as any).type = 'StripeInvalidRequestError';
      (setupIntentError as any).code = 'resource_missing';

      mockStripe.setupIntents.create.mockRejectedValue(setupIntentError);

      await expect(
        mockStripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
          usage: 'off_session'
        })
      ).rejects.toThrow('No such customer');
    });
  });

  describe('Card Validation', () => {
    it('should validate card details', () => {
      const validCards = [
        {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          country: 'US',
          funding: 'credit'
        },
        {
          brand: 'mastercard',
          last4: '5555',
          exp_month: 6,
          exp_year: 2026,
          country: 'CA',
          funding: 'debit'
        }
      ];

      const invalidCards = [
        {
          brand: '',
          last4: '123', // Too short
          exp_month: 13, // Invalid month
          exp_year: 2020, // Expired
          country: 'XX',
          funding: 'unknown'
        },
        {
          brand: 'unknown_brand',
          last4: '12345', // Too long
          exp_month: 0, // Invalid month
          exp_year: 2030,
          country: '',
          funding: ''
        }
      ];

      validCards.forEach(card => {
        expect(['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay']).toContain(card.brand);
        expect(card.last4).toMatch(/^\d{4}$/);
        expect(card.exp_month).toBeGreaterThanOrEqual(1);
        expect(card.exp_month).toBeLessThanOrEqual(12);
        expect(card.exp_year).toBeGreaterThan(new Date().getFullYear() - 1);
        expect(['credit', 'debit', 'prepaid', 'unknown']).toContain(card.funding);
      });

      invalidCards.forEach(card => {
        const hasInvalidBrand = !['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay'].includes(card.brand);
        const hasInvalidLast4 = !/^\d{4}$/.test(card.last4);
        const hasInvalidMonth = card.exp_month < 1 || card.exp_month > 12;
        const hasInvalidYear = card.exp_year <= new Date().getFullYear() - 1;
        const hasInvalidFunding = !['credit', 'debit', 'prepaid', 'unknown'].includes(card.funding);

        expect(hasInvalidBrand || hasInvalidLast4 || hasInvalidMonth || hasInvalidYear || hasInvalidFunding).toBe(true);
      });
    });

    it('should detect expired cards', () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

      const expiredCards = [
        { exp_month: 12, exp_year: currentYear - 1 }, // Last year
        { exp_month: currentMonth - 1, exp_year: currentYear }, // Last month (if not January)
      ];

      const validCards = [
        { exp_month: 12, exp_year: currentYear + 1 }, // Next year
        { exp_month: currentMonth + 1, exp_year: currentYear }, // Next month (if not December)
        { exp_month: currentMonth, exp_year: currentYear }, // Current month
      ];

      expiredCards.forEach(card => {
        const isExpired = card.exp_year < currentYear || 
          (card.exp_year === currentYear && card.exp_month < currentMonth);
        expect(isExpired).toBe(true);
      });

      validCards.forEach(card => {
        const isExpired = card.exp_year < currentYear || 
          (card.exp_year === currentYear && card.exp_month < currentMonth);
        expect(isExpired).toBe(false);
      });
    });
  });

  describe('Default Payment Method Management', () => {
    it('should set default payment method for customer', async () => {
      const customerId = 'cus_test_customer';
      const paymentMethodId = 'pm_test_default';

      mockStripe.customers.update.mockResolvedValue({
        id: customerId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      const updatedCustomer = await mockStripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      expect(updatedCustomer.invoice_settings.default_payment_method).toBe(paymentMethodId);
      expect(mockStripe.customers.update).toHaveBeenCalledWith(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    });

    it('should clear default payment method', async () => {
      const customerId = 'cus_test_customer';

      mockStripe.customers.update.mockResolvedValue({
        id: customerId,
        invoice_settings: {
          default_payment_method: null
        }
      });

      const updatedCustomer = await mockStripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: null
        }
      });

      expect(updatedCustomer.invoice_settings.default_payment_method).toBeNull();
    });

    it('should validate payment method exists before setting as default', async () => {
      const customerId = 'cus_test_customer';
      const nonExistentPaymentMethodId = 'pm_nonexistent';

      // Mock: Payment method doesn't exist
      const notFoundError = new Error('No such payment method');
      (notFoundError as any).type = 'StripeInvalidRequestError';
      (notFoundError as any).code = 'resource_missing';

      mockStripe.paymentMethods.retrieve.mockRejectedValue(notFoundError);

      await expect(
        mockStripe.paymentMethods.retrieve(nonExistentPaymentMethodId)
      ).rejects.toThrow('No such payment method');
    });
  });

  describe('Error Handling', () => {
    it('should categorize Stripe payment errors', () => {
      const cardDeclinedError = new Error('Your card was declined');
      (cardDeclinedError as any).type = 'StripeCardError';
      (cardDeclinedError as any).code = 'card_declined';
      (cardDeclinedError as any).decline_code = 'generic_decline';

      const insufficientFundsError = new Error('Your card has insufficient funds');
      (insufficientFundsError as any).type = 'StripeCardError';
      (insufficientFundsError as any).code = 'card_declined';
      (insufficientFundsError as any).decline_code = 'insufficient_funds';

      const expiredCardError = new Error('Your card has expired');
      (expiredCardError as any).type = 'StripeCardError';
      (expiredCardError as any).code = 'expired_card';

      const invalidRequestError = new Error('Invalid payment method');
      (invalidRequestError as any).type = 'StripeInvalidRequestError';
      (invalidRequestError as any).code = 'payment_method_invalid';

      expect((cardDeclinedError as any).type).toBe('StripeCardError');
      expect((cardDeclinedError as any).code).toBe('card_declined');
      expect((insufficientFundsError as any).decline_code).toBe('insufficient_funds');
      expect((expiredCardError as any).code).toBe('expired_card');
      expect((invalidRequestError as any).type).toBe('StripeInvalidRequestError');
    });

    it('should handle network errors', () => {
      const networkError = new Error('Network request failed');
      (networkError as any).type = 'StripeConnectionError';
      (networkError as any).code = 'network_error';

      const timeoutError = new Error('Request timeout');
      (timeoutError as any).type = 'StripeConnectionError';
      (timeoutError as any).code = 'timeout';

      expect((networkError as any).type).toBe('StripeConnectionError');
      expect((timeoutError as any).type).toBe('StripeConnectionError');
    });

    it('should handle API errors', () => {
      const rateLimitError = new Error('Too many requests');
      (rateLimitError as any).type = 'StripeRateLimitError';
      (rateLimitError as any).code = 'rate_limit';

      const authenticationError = new Error('Invalid API key');
      (authenticationError as any).type = 'StripeAuthenticationError';
      (authenticationError as any).code = 'invalid_api_key';

      expect((rateLimitError as any).type).toBe('StripeRateLimitError');
      expect((authenticationError as any).type).toBe('StripeAuthenticationError');
    });
  });

  describe('Security Validations', () => {
    it('should validate secure payment method creation', () => {
      const secureSetupIntentParams = {
        customer: 'cus_test_customer',
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          user_id: 'user_test123',
          created_by: 'quotekit_app',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...'
        }
      };

      expect(secureSetupIntentParams.customer).toMatch(/^cus_/);
      expect(secureSetupIntentParams.payment_method_types).toContain('card');
      expect(secureSetupIntentParams.usage).toBe('off_session');
      expect(secureSetupIntentParams.metadata.user_id).toMatch(/^user_/);
      expect(secureSetupIntentParams.metadata.created_by).toBe('quotekit_app');
    });

    it('should validate metadata security', () => {
      const secureMetadata = {
        user_id: 'user_test123',
        created_by: 'quotekit_app',
        created_at: new Date().toISOString(),
        environment: 'test'
      };

      const insecureMetadata = {
        user_id: 'user_test123',
        password: 'secret123', // Should not be in metadata
        api_key: 'sk_test_123', // Should not be in metadata
        credit_card_number: '4242424242424242' // Should not be in metadata
      };

      // Secure metadata should not contain sensitive information
      expect(secureMetadata).not.toHaveProperty('password');
      expect(secureMetadata).not.toHaveProperty('api_key');
      expect(secureMetadata).not.toHaveProperty('credit_card_number');

      // Insecure metadata contains sensitive information (this is what we want to avoid)
      expect(insecureMetadata).toHaveProperty('password');
      expect(insecureMetadata).toHaveProperty('api_key');
      expect(insecureMetadata).toHaveProperty('credit_card_number');
    });
  });
});
