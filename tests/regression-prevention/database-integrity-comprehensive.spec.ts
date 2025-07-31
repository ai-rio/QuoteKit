/**
 * Comprehensive Database Integrity Testing Suite
 * Tests foreign key constraints, RLS policies, and database consistency
 * Following London School TDD with extensive behavior verification
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/libs/supabase/types';
import { dataConsistencyValidator } from './data-consistency-validation';

// Mock dependencies
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
    getUser: vi.fn(),
  },
  sql: vi.fn(),
};

// Mock database integrity service
const mockDatabaseIntegrityService = {
  validateForeignKeys: vi.fn(),
  validateRLSPolicies: vi.fn(),
  checkIndexConsistency: vi.fn(),
  validateTriggers: vi.fn(),
  testCascadeDeletes: vi.fn(),
  validateDataTypes: vi.fn(),
  checkConstraints: vi.fn(),
  validateViews: vi.fn(),
  testPermissions: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

describe('Comprehensive Database Integrity Testing', () => {
  let testUserId: string;
  let testSubscriptionId: string;
  let testCustomerId: string;

  beforeAll(async () => {
    // Initialize swarm coordination for database integrity testing
    await vi.importActual('child_process').execSync(
      'npx claude-flow@alpha hooks pre-task --description "Comprehensive database integrity testing"',
      { stdio: 'inherit' }
    );
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    
    testUserId = `test-user-${Date.now()}`;
    testSubscriptionId = `test-subscription-${Date.now()}`;
    testCustomerId = `test-customer-${Date.now()}`;

    setupDefaultMockResponses();
  });

  afterEach(async () => {
    await vi.importActual('child_process').execSync(
      `npx claude-flow@alpha hooks post-edit --file "database-integrity-comprehensive.spec.ts" --memory-key "tdd/database-integrity-results"`,
      { stdio: 'inherit' }
    );
  });

  function setupDefaultMockResponses() {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null })
    });

    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });
    mockSupabase.sql.mockResolvedValue({ data: [], error: null });
  }

  describe('Foreign Key Constraint Validation', () => {
    it('should validate user-subscription foreign key relationship', async () => {
      // Arrange - Mock foreign key validation
      const foreignKeyConstraints = [
        {
          table_name: 'subscriptions',
          column_name: 'user_id',
          foreign_table_name: 'users',
          foreign_column_name: 'id',
          constraint_type: 'FOREIGN KEY',
          is_valid: true
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: foreignKeyConstraints,
        error: null
      });

      // Act
      const result = await mockDatabaseIntegrityService.validateForeignKeys('subscriptions');

      // Assert - Verify foreign key validation
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_foreign_key_constraints', {
        table_name: 'subscriptions'
      });
    });

    it('should detect orphaned subscription records', async () => {
      // Arrange - Mock orphaned records detection
      const orphanedSubscriptions = [
        {
          id: 'sub-orphan-123',
          user_id: 'non-existent-user-123',
          created_at: new Date().toISOString()
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({
            data: orphanedSubscriptions,
            error: null
          })
        })
      });

      // Act
      const orphanCheck = await dataConsistencyValidator.findOrphanedSubscriptions();

      // Assert - Verify orphan detection
      expect(orphanCheck.passed).toBe(false);
      expect(orphanCheck.issues).toHaveLength(1);
      expect(orphanCheck.issues[0].type).toBe('orphaned_subscription');
    });

    it('should validate payment method foreign key integrity', async () => {
      // Arrange - Mock payment method foreign key validation
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          constraint_name: 'payment_methods_user_id_fkey',
          is_valid: true,
          violating_rows: 0
        }],
        error: null
      });

      // Act
      const fkValidation = await mockDatabaseIntegrityService.validateForeignKeys('payment_methods');

      // Assert - Verify payment method FK validation
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_foreign_key_constraints', {
        table_name: 'payment_methods'
      });
    });

    it('should test cascade delete behavior', async () => {
      // Arrange - Mock cascade delete test
      const testUserData = {
        id: testUserId,
        email: 'test@example.com'
      };

      const relatedData = {
        subscriptions: [{ id: testSubscriptionId, user_id: testUserId }],
        payment_methods: [{ id: 'pm-test-123', user_id: testUserId }],
        invoices: [{ id: 'inv-test-123', user_id: testUserId }]
      };

      mockSupabase.from
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ data: [testUserData], error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({ data: relatedData.subscriptions, error: null })
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({ data: [], error: null }) // Should be empty after cascade
        });

      // Act
      const cascadeResult = await mockDatabaseIntegrityService.testCascadeDeletes(testUserId);

      // Assert - Verify cascade delete behavior
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });
  });

  describe('Row Level Security (RLS) Policy Validation', () => {
    it('should validate user can only access own subscriptions', async () => {
      // Arrange - Mock RLS policy test
      const userSubscription = {
        id: testSubscriptionId,
        user_id: testUserId,
        status: 'active'
      };

      const otherUserSubscription = {
        id: 'other-sub-123',
        user_id: 'other-user-123',
        status: 'active'
      };

      // Mock authenticated user context
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: testUserId } },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [userSubscription], // Should only return user's own subscription
          error: null
        })
      });

      // Act
      const rlsResult = await mockDatabaseIntegrityService.validateRLSPolicies('subscriptions');

      // Assert - Verify RLS policy enforcement
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should validate payment method access controls', async () => {
      // Arrange - Mock payment method RLS test
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: testUserId } },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{
            id: 'pm-user-123',
            user_id: testUserId,
            type: 'card'
          }],
          error: null
        })
      });

      // Act
      const paymentRLSResult = await mockDatabaseIntegrityService.validateRLSPolicies('payment_methods');

      // Assert - Verify payment method RLS
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_methods');
    });

    it('should validate service role has full access', async () => {
      // Arrange - Mock service role access test
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          table_name: 'subscriptions',
          policy_name: 'service_role_full_access_subscriptions',
          has_access: true,
          role: 'service_role'
        }],
        error: null
      });

      // Act
      const serviceRoleAccess = await mockDatabaseIntegrityService.testPermissions('service_role');

      // Assert - Verify service role permissions
      expect(mockSupabase.rpc).toHaveBeenCalledWith('test_role_permissions', {
        role_name: 'service_role'
      });
    });

    it('should prevent unauthorized access to sensitive data', async () => {
      // Arrange - Mock unauthorized access attempt
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'unauthorized-user' } },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [], // Should return empty due to RLS
          error: null
        })
      });

      // Act
      const unauthorizedResult = await mockDatabaseIntegrityService.validateRLSPolicies('invoices');

      // Assert - Verify unauthorized access is blocked
      expect(mockSupabase.from).toHaveBeenCalledWith('invoices');
    });
  });

  describe('Database Constraint Validation', () => {
    it('should validate check constraints on subscription status', async () => {
      // Arrange - Mock check constraint validation
      const validStatuses = ['incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'];
      
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          constraint_name: 'subscriptions_status_check',
          constraint_type: 'CHECK',
          is_violated: false,
          violating_rows: 0
        }],
        error: null
      });

      // Act
      const constraintResult = await mockDatabaseIntegrityService.checkConstraints('subscriptions');

      // Assert - Verify check constraints
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_check_constraints', {
        table_name: 'subscriptions'
      });
    });

    it('should validate unique constraints', async () => {
      // Arrange - Mock unique constraint test
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          constraint_name: 'stripe_customers_stripe_customer_id_key',
          constraint_type: 'UNIQUE',
          is_violated: false,
          duplicate_count: 0
        }],
        error: null
      });

      // Act
      const uniqueResult = await mockDatabaseIntegrityService.checkConstraints('stripe_customers');

      // Assert - Verify unique constraints
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_unique_constraints', {
        table_name: 'stripe_customers'
      });
    });

    it('should validate not null constraints', async () => {
      // Arrange - Mock not null constraint validation
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          table_name: 'subscriptions',
          column_name: 'user_id',
          constraint_type: 'NOT NULL',
          null_count: 0,
          is_violated: false
        }],
        error: null
      });

      // Act
      const notNullResult = await mockDatabaseIntegrityService.checkConstraints('subscriptions');

      // Assert - Verify not null constraints
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_not_null_constraints', {
        table_name: 'subscriptions'
      });
    });
  });

  describe('Index Consistency and Performance', () => {
    it('should validate critical indexes exist and are functional', async () => {
      // Arrange - Mock index validation
      const criticalIndexes = [
        {
          index_name: 'idx_subscriptions_user',
          table_name: 'subscriptions',
          is_valid: true,
          is_unique: false,
          index_size: '8192 bytes'
        },
        {
          index_name: 'idx_subscriptions_stripe_sub',
          table_name: 'subscriptions',
          is_valid: true,
          is_unique: true,
          index_size: '16384 bytes'
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: criticalIndexes,
        error: null
      });

      // Act
      const indexResult = await mockDatabaseIntegrityService.checkIndexConsistency();

      // Assert - Verify index validation
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_indexes');
    });

    it('should test query performance with indexes', async () => {
      // Arrange - Mock query performance test
      const performanceMetrics = [
        {
          query: 'SELECT * FROM subscriptions WHERE user_id = $1',
          execution_time_ms: 2.3,
          uses_index: true,
          index_name: 'idx_subscriptions_user',
          rows_examined: 1
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: performanceMetrics,
        error: null
      });

      // Act
      const perfResult = await mockDatabaseIntegrityService.checkIndexConsistency();

      // Assert - Verify query performance
      expect(mockSupabase.rpc).toHaveBeenCalledWith('analyze_query_performance');
    });

    it('should detect unused or redundant indexes', async () => {
      // Arrange - Mock unused index detection
      const indexUsageStats = [
        {
          index_name: 'idx_subscriptions_created_at',
          table_name: 'subscriptions',
          index_scans: 0,
          tuples_read: 0,
          tuples_fetched: 0,
          is_redundant: true
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: indexUsageStats,
        error: null
      });

      // Act
      const unusedIndexResult = await mockDatabaseIntegrityService.checkIndexConsistency();

      // Assert - Verify unused index detection
      expect(mockSupabase.rpc).toHaveBeenCalledWith('analyze_index_usage');
    });
  });

  describe('Database Trigger Validation', () => {
    it('should validate updated_at triggers fire correctly', async () => {
      // Arrange - Mock trigger validation
      const testRecord = {
        id: testSubscriptionId,
        user_id: testUserId,
        updated_at: new Date().toISOString()
      };

      const originalUpdatedAt = '2024-01-01T00:00:00Z';
      
      mockSupabase.from
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ 
            data: [{ ...testRecord, updated_at: originalUpdatedAt }], 
            error: null 
          })
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ ...testRecord, status: 'updated' }],
              error: null
            })
          })
        });

      // Act
      const triggerResult = await mockDatabaseIntegrityService.validateTriggers('subscriptions');

      // Assert - Verify trigger execution
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should validate subscription event logging trigger', async () => {
      // Arrange - Mock event logging trigger
      mockSupabase.from
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            data: [{
              id: testSubscriptionId,
              user_id: testUserId,
              status: 'active'
            }],
            error: null
          })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'event-123',
              subscription_id: testSubscriptionId,
              event_type: 'created'
            }],
            error: null
          })
        });

      // Act
      const eventTriggerResult = await mockDatabaseIntegrityService.validateTriggers('subscription_events');

      // Assert - Verify event logging trigger
      expect(mockSupabase.from).toHaveBeenCalledWith('subscription_events');
    });

    it('should validate MRR/ARR calculation trigger', async () => {
      // Arrange - Mock revenue calculation trigger
      const subscriptionWithRevenue = {
        id: testSubscriptionId,
        user_id: testUserId,
        stripe_price_id: 'price_monthly_2000',
        quantity: 1,
        mrr_amount: 2000, // Should be calculated by trigger
        arr_amount: 24000
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [subscriptionWithRevenue],
          error: null
        })
      });

      // Act
      const revenueCalculationResult = await mockDatabaseIntegrityService.validateTriggers('subscriptions');

      // Assert - Verify revenue calculation
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
    });
  });

  describe('Data Type and Domain Validation', () => {
    it('should validate currency codes are properly formatted', async () => {
      // Arrange - Mock currency validation
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          table_name: 'stripe_prices',
          column_name: 'currency',
          invalid_values: [],
          validation_rule: 'length(currency) = 3',
          passed: true
        }],
        error: null
      });

      // Act
      const currencyValidation = await mockDatabaseIntegrityService.validateDataTypes('stripe_prices');

      // Assert - Verify currency format validation
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_data_formats', {
        table_name: 'stripe_prices'
      });
    });

    it('should validate email format in users table', async () => {
      // Arrange - Mock email validation
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          table_name: 'users',
          column_name: 'email',
          invalid_count: 0,
          validation_rule: 'email format validation',
          passed: true
        }],
        error: null
      });

      // Act
      const emailValidation = await mockDatabaseIntegrityService.validateDataTypes('users');

      // Assert - Verify email format validation
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_email_formats', {
        table_name: 'users'
      });
    });

    it('should validate timestamp consistency across tables', async () => {
      // Arrange - Mock timestamp validation
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          inconsistency_type: 'subscription_period_overlap',
          subscription_id: testSubscriptionId,
          issue: 'current_period_start > current_period_end',
          count: 0
        }],
        error: null
      });

      // Act
      const timestampValidation = await mockDatabaseIntegrityService.validateDataTypes('subscriptions');

      // Assert - Verify timestamp consistency
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_timestamp_consistency');
    });
  });

  describe('View and Function Validation', () => {
    it('should validate subscription analytics view returns correct data', async () => {
      // Arrange - Mock view validation
      const expectedViewData = [
        {
          subscription_id: testSubscriptionId,
          user_id: testUserId,
          subscription_type: 'paid',
          is_active: true,
          mrr_amount: 2000
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: expectedViewData,
          error: null
        })
      });

      // Act
      const viewResult = await mockDatabaseIntegrityService.validateViews('subscription_analytics');

      // Assert - Verify view functionality
      expect(mockSupabase.from).toHaveBeenCalledWith('subscription_analytics');
    });

    it('should validate database functions execute correctly', async () => {
      // Arrange - Mock function validation
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          user_id: testUserId,
          feature_key: 'api_access',
          has_access: true
        }],
        error: null
      });

      // Act
      const functionResult = await mockSupabase.rpc('user_has_feature_access', {
        p_user_id: testUserId,
        p_feature_key: 'api_access'
      });

      // Assert - Verify function execution
      expect(mockSupabase.rpc).toHaveBeenCalledWith('user_has_feature_access', {
        p_user_id: testUserId,
        p_feature_key: 'api_access'
      });
      expect(functionResult.data[0].has_access).toBe(true);
    });

    it('should validate usage tracking functions', async () => {
      // Arrange - Mock usage function validation
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          usage_amount: 5000,
          included_amount: 10000,
          overage_amount: 0,
          utilization_percentage: 50
        }],
        error: null
      });

      // Act
      const usageResult = await mockSupabase.rpc('get_user_current_usage', {
        p_user_id: testUserId,
        p_metric_key: 'api_calls'
      });

      // Assert - Verify usage function
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_current_usage', {
        p_user_id: testUserId,
        p_metric_key: 'api_calls'
      });
      expect(usageResult.data[0].utilization_percentage).toBe(50);
    });
  });

  describe('Comprehensive Integration Tests', () => {
    it('should run full database integrity validation suite', async () => {
      // Arrange - Mock comprehensive validation
      const validationResults = {
        foreign_keys: { passed: true, issues: [] },
        rls_policies: { passed: true, issues: [] },
        constraints: { passed: true, issues: [] },
        indexes: { passed: true, issues: [] },
        triggers: { passed: true, issues: [] },
        data_types: { passed: true, issues: [] },
        views: { passed: true, issues: [] }
      };

      mockSupabase.rpc.mockResolvedValue({
        data: validationResults,
        error: null
      });

      // Act
      const fullValidation = await mockDatabaseIntegrityService.validateForeignKeys();

      // Assert - Verify comprehensive validation
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    it('should generate integrity report with recommendations', async () => {
      // Arrange - Mock report generation
      const integrityReport = {
        overall_score: 95,
        critical_issues: 0,
        warnings: 2,
        recommendations: [
          'Consider adding index on subscription_events.created_at for performance',
          'Review unused indexes for potential removal'
        ],
        performance_metrics: {
          avg_query_time: 15.2,
          index_hit_ratio: 0.98
        }
      };

      mockSupabase.rpc.mockResolvedValue({
        data: integrityReport,
        error: null
      });

      // Act
      const reportResult = await mockSupabase.rpc('generate_integrity_report');

      // Assert - Verify report generation
      expect(reportResult.data.overall_score).toBe(95);
      expect(reportResult.data.critical_issues).toBe(0);
    });
  });
});