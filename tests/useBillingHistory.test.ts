/**
 * Test for useBillingHistory hook
 */

import { renderHook, act } from '@testing-library/react';
import { useBillingHistory } from '@/features/account/hooks/useBillingHistory';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock data
const mockBillingData = [
  {
    id: 'inv_1',
    date: '2025-01-15T10:00:00Z',
    amount: 2999,
    status: 'paid',
    invoice_url: 'https://invoice.stripe.com/inv_1',
    description: 'Pro Plan Subscription',
  },
  {
    id: 'inv_2',
    date: '2024-12-15T10:00:00Z',
    amount: 2999,
    status: 'paid',
    invoice_url: 'https://invoice.stripe.com/inv_2',
    description: 'Pro Plan Subscription',
  },
];

describe('useBillingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with loading state when no initial data', () => {
    const { result } = renderHook(() => useBillingHistory());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.isRefetching).toBe(false);
  });

  it('should initialize with provided initial data', () => {
    const { result } = renderHook(() => useBillingHistory(mockBillingData));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockBillingData);
    expect(result.current.error).toBe(null);
  });

  it('should fetch data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockBillingData }),
    } as Response);

    const { result } = renderHook(() => useBillingHistory());

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockBillingData);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Failed to fetch';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useBillingHistory());

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useBillingHistory());

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Server error');
  });

  it('should refetch data when refetch is called', async () => {
    // Initial successful fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockBillingData }),
    } as Response);

    const { result } = renderHook(() => useBillingHistory());

    // Wait for initial fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockBillingData);

    // Mock refetch with new data
    const newData = [...mockBillingData, {
      id: 'inv_3',
      date: '2025-02-15T10:00:00Z',
      amount: 2999,
      status: 'paid',
      invoice_url: 'https://invoice.stripe.com/inv_3',
      description: 'Pro Plan Subscription',
    }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: newData }),
    } as Response);

    // Call refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual(newData);
    expect(result.current.isRefetching).toBe(false);
  });

  it('should validate response data structure', async () => {
    // Mock invalid response (not an array)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'invalid' }),
    } as Response);

    const { result } = renderHook(() => useBillingHistory());

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Invalid response format');
  });

  it('should validate individual billing items', async () => {
    // Mock response with invalid item
    const invalidData = [
      {
        id: 'inv_1',
        // missing date and amount
        status: 'paid',
        invoice_url: 'https://invoice.stripe.com/inv_1',
        description: 'Pro Plan Subscription',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: invalidData }),
    } as Response);

    const { result } = renderHook(() => useBillingHistory());

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Invalid billing history item');
  });

  it('should provide default values for optional fields', async () => {
    const minimalData = [
      {
        id: 'inv_1',
        date: '2025-01-15T10:00:00Z',
        amount: 2999,
        // missing optional fields
      },
    ];

    const expectedData = [
      {
        id: 'inv_1',
        date: '2025-01-15T10:00:00Z',
        amount: 2999,
        status: 'unknown',
        invoice_url: '#',
        description: 'Invoice',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: minimalData }),
    } as Response);

    const { result } = renderHook(() => useBillingHistory());

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(expectedData);
    expect(result.current.error).toBe(null);
  });
});
