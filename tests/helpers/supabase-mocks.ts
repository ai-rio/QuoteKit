/**
 * Supabase client mocks for integration testing
 */

import { jest } from '@jest/globals';

// Mock Supabase client factory
export const createMockSupabaseClient = () => {
  const mockTable = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    csv: jest.fn().mockResolvedValue({ data: '', error: null }),
    geojson: jest.fn().mockResolvedValue({ data: null, error: null }),
    explain: jest.fn().mockResolvedValue({ data: null, error: null }),
    rollback: jest.fn().mockResolvedValue({ data: null, error: null }),
    returns: jest.fn().mockReturnThis()
  };

  const mockAuth = {
    getUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null
    }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({
      data: {},
      error: null
    }),
    updateUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null
    }),
    setSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
    refreshSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  };

  const mockStorage = {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: null, error: null }),
      download: jest.fn().mockResolvedValue({ data: null, error: null }),
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ 
        data: { signedUrl: 'https://example.com/signed-url' }, 
        error: null 
      }),
      createSignedUrls: jest.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ 
        data: { publicUrl: 'https://example.com/public-url' } 
      }),
      move: jest.fn().mockResolvedValue({ data: null, error: null }),
      copy: jest.fn().mockResolvedValue({ data: null, error: null })
    })
  };

  const mockRealtime = {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue(Promise.resolve('SUBSCRIBED')),
      unsubscribe: jest.fn().mockReturnValue(Promise.resolve('CLOSED')),
      send: jest.fn().mockReturnThis()
    }),
    removeChannel: jest.fn(),
    removeAllChannels: jest.fn(),
    getChannels: jest.fn().mockReturnValue([])
  };

  const mockFunctions = {
    invoke: jest.fn().mockResolvedValue({ data: null, error: null })
  };

  const mockClient = {
    from: jest.fn().mockReturnValue(mockTable),
    auth: mockAuth,
    storage: mockStorage,
    realtime: mockRealtime,
    functions: mockFunctions,
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    mockTable // Expose mockTable for direct access in tests
  };

  return mockClient;
};

// Mock admin client factory
export const createMockSupabaseAdminClient = () => {
  const adminClient = createMockSupabaseClient();
  
  // Admin-specific methods
  adminClient.auth = {
    ...adminClient.auth,
    admin: {
      listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      createUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      deleteUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
      updateUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      inviteUserByEmail: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      generateLink: jest.fn().mockResolvedValue({ 
        data: { 
          properties: { 
            action_link: 'https://example.com/auth/callback',
            email_otp: '123456',
            hashed_token: 'hashed_token_123',
            verification_type: 'signup'
          } 
        }, 
        error: null 
      })
    }
  };

  return adminClient;
};

// Helper to mock successful database operations
export const mockSuccessfulDatabaseOperation = (mockClient: any, table: string, data: any) => {
  mockClient.from.mockImplementation((tableName: string) => {
    if (tableName === table) {
      return {
        ...mockClient.mockTable,
        single: jest.fn().mockResolvedValue({ data, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data, error: null })
      };
    }
    return mockClient.mockTable;
  });
};

// Helper to mock database errors
export const mockDatabaseError = (mockClient: any, table: string, operation: string, error: any) => {
  mockClient.from.mockImplementation((tableName: string) => {
    if (tableName === table) {
      const mockOperations: any = { ...mockClient.mockTable };
      mockOperations[operation] = jest.fn().mockResolvedValue({ data: null, error });
      return mockOperations;
    }
    return mockClient.mockTable;
  });
};

// Helper to mock authentication states
export const mockAuthenticatedUser = (mockClient: any, user: any) => {
  mockClient.auth.getUser.mockResolvedValue({
    data: { user },
    error: null
  });
  
  mockClient.auth.getSession.mockResolvedValue({
    data: { 
      session: { 
        user, 
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token'
      } 
    },
    error: null
  });
};

export const mockUnauthenticatedUser = (mockClient: any) => {
  mockClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'User not authenticated' }
  });
  
  mockClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: { message: 'No session found' }
  });
};

// Helper to mock RLS policy violations
export const mockRLSViolation = (mockClient: any, table: string) => {
  mockClient.from.mockImplementation((tableName: string) => {
    if (tableName === table) {
      return {
        ...mockClient.mockTable,
        select: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: 'PGRST301',
            message: 'Row level security violation',
            details: 'Policy violation'
          }
        }),
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: 'PGRST301',
            message: 'Row level security violation',
            details: 'Policy violation'
          }
        })
      };
    }
    return mockClient.mockTable;
  });
};

// Helper to mock subscription data queries
export const mockSubscriptionQuery = (mockClient: any, subscriptions: any[]) => {
  mockClient.from.mockImplementation((table: string) => {
    if (table === 'subscriptions') {
      return {
        ...mockClient.mockTable,
        single: jest.fn().mockResolvedValue({
          data: subscriptions[0] || null,
          error: subscriptions.length === 0 ? { code: 'PGRST116' } : null
        })
      };
    }
    return mockClient.mockTable;
  });
};

// Helper to mock customer data queries
export const mockCustomerQuery = (mockClient: any, customers: any[]) => {
  mockClient.from.mockImplementation((table: string) => {
    if (table === 'stripe_customers') {
      return {
        ...mockClient.mockTable,
        single: jest.fn().mockResolvedValue({
          data: customers[0] || null,
          error: customers.length === 0 ? { code: 'PGRST116' } : null
        })
      };
    }
    return mockClient.mockTable;
  });
};

// Helper to mock webhook events table
export const mockWebhookEventsQuery = (mockClient: any, events: any[] = []) => {
  mockClient.from.mockImplementation((table: string) => {
    if (table === 'stripe_webhook_events') {
      return {
        ...mockClient.mockTable,
        single: jest.fn().mockResolvedValue({
          data: events[0] || null,
          error: events.length === 0 ? { code: 'PGRST116' } : null
        }),
        upsert: jest.fn().mockResolvedValue({ data: events, error: null }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis()
      };
    }
    return mockClient.mockTable;
  });
};

// Helper to mock admin settings queries
export const mockAdminSettingsQuery = (mockClient: any, settings: Record<string, any> = {}) => {
  mockClient.from.mockImplementation((table: string) => {
    if (table === 'admin_settings') {
      return {
        ...mockClient.mockTable,
        single: jest.fn().mockImplementation(() => {
          const key = 'stripe_config'; // Default key for most tests
          const value = settings[key] || null;
          return Promise.resolve({
            data: value ? { key, value } : null,
            error: value ? null : { code: 'PGRST116' }
          });
        })
      };
    }
    return mockClient.mockTable;
  });
};

// Helper to mock multiple table queries in sequence
export const mockMultipleTableQueries = (mockClient: any, tableConfigs: Record<string, any>) => {
  mockClient.from.mockImplementation((table: string) => {
    const config = tableConfigs[table];
    if (config) {
      return {
        ...mockClient.mockTable,
        ...config
      };
    }
    return mockClient.mockTable;
  });
};

// Helper to reset all mocks
export const resetSupabaseMocks = (mockClient: any) => {
  Object.values(mockClient.mockTable).forEach((fn: any) => {
    if (jest.isMockFunction(fn)) {
      fn.mockClear();
    }
  });
  
  Object.values(mockClient.auth).forEach((fn: any) => {
    if (jest.isMockFunction(fn)) {
      fn.mockClear();
    }
  });
  
  mockClient.from.mockClear();
  mockClient.rpc.mockClear();
};

// Helper to verify database operations
export const verifyDatabaseOperation = (mockClient: any, table: string, operation: string, expectedData?: any) => {
  expect(mockClient.from).toHaveBeenCalledWith(table);
  
  if (expectedData) {
    expect(mockClient.mockTable[operation]).toHaveBeenCalledWith(
      expect.objectContaining(expectedData)
    );
  } else {
    expect(mockClient.mockTable[operation]).toHaveBeenCalled();
  }
};

// Helper to count database operations
export const countDatabaseOperations = (mockClient: any, table: string, operation: string): number => {
  const fromCalls = mockClient.from.mock.calls.filter((call: any[]) => call[0] === table);
  return fromCalls.length;
};