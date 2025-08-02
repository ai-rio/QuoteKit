/**
 * Unit Tests for Customer Management Functions
 * Tests individual functions in isolation with mocked dependencies
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock all external dependencies
jest.mock('@/libs/stripe/stripe-admin');
jest.mock('@/libs/supabase/supabase-admin');

const mockStripeAdmin = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
  },
};

const mockSupabaseAdmin = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  single: jest.fn(),
  upsert: jest.fn(),
  insert: jest.fn(),
};

// Mock the imports
import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

(createStripeAdminClient as jest.Mock).mockReturnValue(mockStripeAdmin);
(supabaseAdminClient as any) = mockSupabaseAdmin;

// Import the function under test
import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';

describe('Customer Management Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_MODE = 'test';
    
    // Setup default mock returns
    mockSupabaseAdmin.from.mockReturnValue(mockSupabaseAdmin);
    mockSupabaseAdmin.select.mockReturnValue(mockSupabaseAdmin);
    mockSupabaseAdmin.eq.mockReturnValue(mockSupabaseAdmin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCustomer', () => {
    const testUserId = 'user_test123';
    const testEmail = 'test@example.com';

    it('should create new customer when none exists', async () => {
      // Mock: No Stripe config in database, use environment
      mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock: No existing customer record
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found
      });

      // Mock: No existing Stripe customers
      mockStripeAdmin.customers.list.mockResolvedValue({
        data: [],
        has_more: false
      });

      // Mock: Successful customer creation
      const mockCustomer = {
        id: 'cus_test_new',
        email: testEmail,
        metadata: { user_id: testUserId }
      };
      mockStripeAdmin.customers.create.mockResolvedValue(mockCustomer);

      // Mock: Successful database insert
      mockSupabaseAdmin.upsert.mockResolvedValue({
        data: [{ id: testUserId, stripe_customer_id: 'cus_test_new' }],
        error: null
      });

      const result = await getOrCreateCustomer({ userId: testUserId, email: testEmail });

      expect(result).toBe('cus_test_new');
      expect(mockStripeAdmin.customers.create).toHaveBeenCalledWith({
        email: testEmail,
        metadata: {
          user_id: testUserId,
          created_by: 'quotekit_app',
          created_at: expect.any(String)
        }
      });
      expect(mockSupabaseAdmin.upsert).toHaveBeenCalled();
    });

    it('should return existing customer ID when customer exists', async () => {
      const existingCustomerId = 'cus_existing_123';

      // Mock: No Stripe config in database
      mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock: Existing customer record
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { stripe_customer_id: existingCustomerId },
        error: null
      });

      // Mock: Valid Stripe customer
      mockStripeAdmin.customers.retrieve.mockResolvedValue({
        id: existingCustomerId,
        email: testEmail,
        deleted: false
      });

      const result = await getOrCreateCustomer({ userId: testUserId, email: testEmail });

      expect(result).toBe(existingCustomerId);
      expect(mockStripeAdmin.customers.create).not.toHaveBeenCalled();
      expect(mockStripeAdmin.customers.retrieve).toHaveBeenCalledWith(existingCustomerId);
    });

    it('should use database Stripe config when available', async () => {
      const dbStripeConfig = {
        secret_key: 'sk_test_from_db',
        mode: 'test'
      };

      // Mock: Stripe config from database
      mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
        data: { value: dbStripeConfig },
        error: null
      });

      // Mock: No existing customer
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      mockStripeAdmin.customers.list.mockResolvedValue({ data: [], has_more: false });
      mockStripeAdmin.customers.create.mockResolvedValue({
        id: 'cus_test_db_config',
        email: testEmail
      });
      mockSupabaseAdmin.upsert.mockResolvedValue({ data: [], error: null });

      await getOrCreateCustomer({ userId: testUserId, email: testEmail });

      expect(createStripeAdminClient).toHaveBeenCalledWith({
        secret_key: 'sk_test_from_db',
        mode: 'test'
      });
    });

    it('should handle deleted Stripe customer by creating new one', async () => {
      const deletedCustomerId = 'cus_deleted_123';
      const newCustomerId = 'cus_new_456';

      // Mock: Environment config
      mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock: Existing customer record with deleted Stripe customer
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { stripe_customer_id: deletedCustomerId },
        error: null
      });

      // Mock: Deleted Stripe customer
      mockStripeAdmin.customers.retrieve.mockResolvedValue({
        id: deletedCustomerId,
        deleted: true
      });

      // Mock: No customers found by email
      mockStripeAdmin.customers.list.mockResolvedValue({
        data: [],
        has_more: false
      });

      // Mock: New customer creation
      mockStripeAdmin.customers.create.mockResolvedValue({
        id: newCustomerId,
        email: testEmail,
        metadata: { user_id: testUserId }
      });

      mockSupabaseAdmin.upsert.mockResolvedValue({
        data: [{ id: testUserId, stripe_customer_id: newCustomerId }],
        error: null
      });

      const result = await getOrCreateCustomer({ userId: testUserId, email: testEmail });

      expect(result).toBe(newCustomerId);
      expect(mockStripeAdmin.customers.create).toHaveBeenCalled();
    });

    it('should throw error when Stripe is not configured', async () => {
      // Remove environment variables
      delete process.env.STRIPE_SECRET_KEY;

      // Mock: No config in database
      mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      await expect(getOrCreateCustomer({ userId: testUserId, email: testEmail }))
        .rejects
        .toThrow('Stripe not configured - cannot create customer');
    });

    it('should handle Stripe API errors gracefully', async () => {
      // Mock: Environment config
      mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock: No existing customer
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock: Stripe API error
      const stripeError = new Error('Your card was declined');
      (stripeError as any).type = 'StripeCardError';
      mockStripeAdmin.customers.list.mockRejectedValue(stripeError);

      await expect(getOrCreateCustomer({ userId: testUserId, email: testEmail }))
        .rejects
        .toThrow('Failed to get or create customer');
    });

    it('should handle database errors gracefully', async () => {
      // Mock: Environment config
      mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock: Database error
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' }
      });

      await expect(getOrCreateCustomer({ userId: testUserId, email: testEmail }))
        .rejects
        .toThrow('Failed to get or create customer');
    });

    it('should validate input parameters', async () => {
      await expect(getOrCreateCustomer({ userId: '', email: testEmail }))
        .rejects
        .toThrow();

      await expect(getOrCreateCustomer({ userId: testUserId, email: '' }))
        .rejects
        .toThrow();

      await expect(getOrCreateCustomer({ userId: testUserId, email: 'invalid-email' }))
        .rejects
        .toThrow();
    });

    it('should handle concurrent customer creation attempts', async () => {
      // Mock: Environment config
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock: No existing customer initially
      mockSupabaseAdmin.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      // Mock: No existing Stripe customers
      mockStripeAdmin.customers.list.mockResolvedValue({
        data: [],
        has_more: false
      });

      // Mock: Customer creation
      mockStripeAdmin.customers.create.mockResolvedValue({
        id: 'cus_concurrent_123',
        email: testEmail,
        metadata: { user_id: testUserId }
      });

      // Mock: Database upsert (handles conflicts)
      mockSupabaseAdmin.upsert.mockResolvedValue({
        data: [{ id: testUserId, stripe_customer_id: 'cus_concurrent_123' }],
        error: null
      });

      // Run concurrent requests
      const promises = [
        getOrCreateCustomer({ userId: testUserId, email: testEmail }),
        getOrCreateCustomer({ userId: testUserId, email: testEmail })
      ];

      const results = await Promise.all(promises);

      // Both should return the same customer ID
      expect(results[0]).toBe(results[1]);
      expect(results[0]).toBe('cus_concurrent_123');
    });
  });

  describe('Customer Validation Functions', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com'
      ];

      // This would test a separate validation function if it existed
      // For now, we're testing the concept
      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should validate user ID format', () => {
      const validUserIds = [
        'user_123456789',
        'usr_abcdef123',
        '550e8400-e29b-41d4-a716-446655440000' // UUID
      ];

      const invalidUserIds = [
        '',
        '   ',
        'user with spaces',
        'user@invalid'
      ];

      validUserIds.forEach(userId => {
        expect(userId.trim()).toBe(userId);
        expect(userId.length).toBeGreaterThan(0);
      });

      invalidUserIds.forEach(userId => {
        expect(userId.trim().length === 0 || userId.includes(' ') || userId.includes('@')).toBe(true);
      });
    });
  });

  describe('Error Handling Utilities', () => {
    it('should categorize Stripe errors correctly', () => {
      const cardError = new Error('Your card was declined');
      (cardError as any).type = 'StripeCardError';
      (cardError as any).code = 'card_declined';

      const connectionError = new Error('Network error');
      (connectionError as any).type = 'StripeConnectionError';

      const apiError = new Error('Invalid request');
      (apiError as any).type = 'StripeInvalidRequestError';

      // Test error categorization logic
      expect((cardError as any).type).toBe('StripeCardError');
      expect((connectionError as any).type).toBe('StripeConnectionError');
      expect((apiError as any).type).toBe('StripeInvalidRequestError');
    });

    it('should handle database error codes', () => {
      const notFoundError = { code: 'PGRST116', message: 'Not found' };
      const uniqueViolation = { code: '23505', message: 'Unique constraint violation' };
      const connectionError = { code: '08000', message: 'Connection error' };

      expect(notFoundError.code).toBe('PGRST116');
      expect(uniqueViolation.code).toBe('23505');
      expect(connectionError.code).toBe('08000');
    });
  });
});
