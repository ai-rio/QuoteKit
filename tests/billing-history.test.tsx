/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BillingHistoryTable } from '@/features/account/components/BillingHistoryTable';

// Mock the useBillingHistory hook
jest.mock('@/features/account/hooks/useBillingHistory', () => ({
  useBillingHistory: jest.fn(),
}));

const mockUseBillingHistory = require('@/features/account/hooks/useBillingHistory').useBillingHistory;

// Mock data
const mockBillingData = [
  {
    id: 'inv_1',
    date: '2025-01-15T10:00:00Z',
    amount: 2999, // $29.99 in cents
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
  {
    id: 'inv_3',
    date: '2024-11-15T10:00:00Z',
    amount: 2999,
    status: 'pending',
    invoice_url: 'https://invoice.stripe.com/inv_3',
    description: 'Pro Plan Subscription',
  },
];

describe('BillingHistoryTable', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockUseBillingHistory.mockReset();
  });

  it('renders loading state correctly', () => {
    mockUseBillingHistory.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    expect(screen.getByText('Billing History')).toBeInTheDocument();
    // Should show skeleton loading state
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders empty state when no billing history', () => {
    mockUseBillingHistory.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    expect(screen.getByText('No billing history available')).toBeInTheDocument();
    expect(screen.getByText('Your invoices and receipts will appear here once you have billing activity.')).toBeInTheDocument();
  });

  it('renders billing history data correctly', () => {
    mockUseBillingHistory.mockReturnValue({
      data: mockBillingData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    // Check if data is rendered
    expect(screen.getByText('Pro Plan Subscription')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    
    // Check if showing correct count
    expect(screen.getByText('Showing 3 of 3 invoices')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    mockUseBillingHistory.mockReturnValue({
      data: mockBillingData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    const searchInput = screen.getByPlaceholderText('Search invoices...');
    fireEvent.change(searchInput, { target: { value: 'Pro Plan' } });
    
    // All items should still be visible since they all match "Pro Plan"
    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 invoices')).toBeInTheDocument();
    });
  });

  it('handles status filtering', async () => {
    mockUseBillingHistory.mockReturnValue({
      data: mockBillingData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    // Find and click the status filter
    const statusFilter = screen.getByRole('combobox');
    fireEvent.click(statusFilter);
    
    // Select "paid" status
    const paidOption = screen.getByText('Paid');
    fireEvent.click(paidOption);
    
    // Should show filtered results
    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 invoices')).toBeInTheDocument();
    });
  });

  it('handles sorting functionality', () => {
    mockUseBillingHistory.mockReturnValue({
      data: mockBillingData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    // Click on Date header to sort
    const dateHeader = screen.getByText('Date');
    fireEvent.click(dateHeader);
    
    // Should show sort indicator
    expect(dateHeader.textContent).toContain('↑');
  });

  it('handles download invoice functionality', () => {
    // Mock window.open
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      writable: true,
      value: mockOpen,
    });

    mockUseBillingHistory.mockReturnValue({
      data: mockBillingData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    // Find and click download button
    const downloadButtons = screen.getAllByTitle('Download Invoice');
    fireEvent.click(downloadButtons[0]);
    
    // Should call window.open with correct URL
    expect(mockOpen).toHaveBeenCalledWith(
      'https://invoice.stripe.com/inv_1',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('handles error state correctly', () => {
    const mockRefetch = jest.fn();
    mockUseBillingHistory.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to load billing history'),
      refetch: mockRefetch,
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    expect(screen.getByText('Failed to load billing history')).toBeInTheDocument();
    expect(screen.getByText('Failed to load billing history')).toBeInTheDocument();
    
    // Click try again button
    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);
    
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('handles refresh functionality', () => {
    const mockRefetch = jest.fn();
    mockUseBillingHistory.mockReturnValue({
      data: mockBillingData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows pagination when there are many items', () => {
    // Create more than 10 items to trigger pagination
    const manyItems = Array.from({ length: 15 }, (_, i) => ({
      id: `inv_${i}`,
      date: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      amount: 2999,
      status: 'paid',
      invoice_url: `https://invoice.stripe.com/inv_${i}`,
      description: `Invoice ${i + 1}`,
    }));

    mockUseBillingHistory.mockReturnValue({
      data: manyItems,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable />);
    
    // Should show pagination controls
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Should show correct count
    expect(screen.getByText('Showing 10 of 15 invoices')).toBeInTheDocument();
  });

  it('renders with initial data prop', () => {
    mockUseBillingHistory.mockReturnValue({
      data: mockBillingData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<BillingHistoryTable initialData={mockBillingData} />);
    
    expect(screen.getByText('Pro Plan Subscription')).toBeInTheDocument();
    expect(mockUseBillingHistory).toHaveBeenCalledWith(mockBillingData);
  });
});
