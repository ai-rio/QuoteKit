/**
 * User Management Tests - Story 1.3
 * Comprehensive tests for user edit modal, API endpoints, and user management actions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock the toast hook
const mockToast = jest.fn()
jest.mock('../src/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

// Mock fetch
global.fetch = jest.fn()

describe('User Management - Story 1.3', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('UserEditModal Component', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      full_name: 'Test User',
      company_name: 'Test Company',
      role: 'user' as const,
      created_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-23T12:00:00Z',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      quote_count: 5,
      total_revenue: 1250,
      accepted_quotes: 3,
      acceptance_rate: 60,
      event_count: 15,
      last_active: '2024-01-23T12:00:00Z',
      status: 'active' as const
    }

    const mockProps = {
      user: mockUser,
      isOpen: true,
      onClose: jest.fn(),
      onUserUpdated: jest.fn()
    }

    it('renders user edit modal with correct information', async () => {
      const { UserEditModal } = await import('../src/components/admin/user-edit-modal')
      
      render(<UserEditModal {...mockProps} />)

      expect(screen.getByText('Edit User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
    })

    it('displays user statistics correctly', async () => {
      const { UserEditModal } = await import('../src/components/admin/user-edit-modal')
      
      render(<UserEditModal {...mockProps} />)

      expect(screen.getByText('5')).toBeInTheDocument() // quote_count
      expect(screen.getByText('$1,250')).toBeInTheDocument() // total_revenue
      expect(screen.getByText('3')).toBeInTheDocument() // accepted_quotes
      expect(screen.getByText('60.0%')).toBeInTheDocument() // acceptance_rate
    })

    it('shows tabs for Profile & Settings and Activity Timeline', async () => {
      const { UserEditModal } = await import('../src/components/admin/user-edit-modal')
      
      render(<UserEditModal {...mockProps} />)

      expect(screen.getByText('Profile & Settings')).toBeInTheDocument()
      expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
    })

    it('handles form submission for profile update', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const { UserEditModal } = await import('../src/components/admin/user-edit-modal')
      
      render(<UserEditModal {...mockProps} />)

      const nameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: 'Updated Name' })
        })
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: "User updated successfully",
        description: "test@example.com has been updated."
      })
    })

    it('handles role change to admin', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const { UserEditModal } = await import('../src/components/admin/user-edit-modal')
      
      render(<UserEditModal {...mockProps} />)

      const adminButton = screen.getByText('Admin')
      fireEvent.click(adminButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user-123',
            action: 'grant_admin',
            role: 'admin'
          })
        })
      })
    })

    it('handles status toggle', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const { UserEditModal } = await import('../src/components/admin/user-edit-modal')
      
      render(<UserEditModal {...mockProps} />)

      const disableButton = screen.getByText('Disable Account')
      fireEvent.click(disableButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-123/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'inactive' })
        })
      })
    })

    it('handles API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update user' })
      })

      const { UserEditModal } = await import('../src/components/admin/user-edit-modal')
      
      render(<UserEditModal {...mockProps} />)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error updating user",
          description: "Failed to update user",
          variant: "destructive"
        })
      })
    })

    it('does not render when user is null', async () => {
      const { UserEditModal } = await import('../src/components/admin/user-edit-modal')
      
      const { container } = render(<UserEditModal {...mockProps} user={null} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('UserActivityTimeline Component', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      full_name: 'Test User',
      company_name: 'Test Company',
      role: 'user' as const,
      created_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-23T12:00:00Z',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      quote_count: 5,
      total_revenue: 1250,
      accepted_quotes: 3,
      acceptance_rate: 60,
      event_count: 15,
      last_active: '2024-01-23T12:00:00Z',
      status: 'active' as const
    }

    const mockActivityData = [
      {
        id: '1',
        type: 'login',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        description: 'User logged into the platform'
      },
      {
        id: '2',
        type: 'quote_created',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        description: 'Created a new quote for lawn maintenance service'
      }
    ]

    it('displays loading state initially', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      const { UserActivityTimeline } = await import('../src/components/admin/user-activity-timeline')
      
      render(<UserActivityTimeline user={mockUser} />)

      expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      expect(screen.getByText('Recent user activity and events')).toBeInTheDocument()
    })

    it('displays activity data when loaded', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockActivityData })
      })

      const { UserActivityTimeline } = await import('../src/components/admin/user-activity-timeline')
      
      render(<UserActivityTimeline user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('User logged into the platform')).toBeInTheDocument()
        expect(screen.getByText('Created a new quote for lawn maintenance service')).toBeInTheDocument()
      })
    })

    it('handles empty activity data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      const { UserActivityTimeline } = await import('../src/components/admin/user-activity-timeline')
      
      render(<UserActivityTimeline user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('No activity found for this user')).toBeInTheDocument()
      })
    })

    it('handles API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch activity' })
      })

      const { UserActivityTimeline } = await import('../src/components/admin/user-activity-timeline')
      
      render(<UserActivityTimeline user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load activity timeline')).toBeInTheDocument()
        expect(screen.getByText('Failed to fetch activity')).toBeInTheDocument()
      })
    })

    it('formats timestamps correctly', async () => {
      const recentActivity = [{
        id: '1',
        type: 'login',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        description: 'Recent login'
      }]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: recentActivity })
      })

      const { UserActivityTimeline } = await import('../src/components/admin/user-activity-timeline')
      
      render(<UserActivityTimeline user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText(/30 minutes ago/)).toBeInTheDocument()
      })
    })
  })

  describe('useAdminUsers Hook', () => {
    it('fetches users on mount', async () => {
      const mockUsersData = {
        success: true,
        data: [mockUser],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData
      })

      const { useAdminUsers } = await import('../src/hooks/use-admin-users')
      const { result } = renderHook(() => useAdminUsers(1, 20))

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.users).toEqual([mockUser])
      })
    })

    it('handles updateUserProfile function', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })

      const { useAdminUsers } = await import('../src/hooks/use-admin-users')
      const { result } = renderHook(() => useAdminUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const success = await result.current.updateUserProfile('user-123', { full_name: 'New Name' })

      expect(success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: 'New Name' })
      })
    })

    it('handles updateUserStatus function', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })

      const { useAdminUsers } = await import('../src/hooks/use-admin-users')
      const { result } = renderHook(() => useAdminUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const success = await result.current.updateUserStatus('user-123', 'inactive')

      expect(success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-123/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' })
      })
    })
  })

  describe('Users Overview Page Integration', () => {
    it('opens edit modal when edit button is clicked', async () => {
      const mockUsersData = {
        success: true,
        data: [mockUser],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockUsersData
      })

      const UsersOverview = (await import('../src/app/(admin)/users/overview/page')).default
      
      render(<UsersOverview />)

      await waitFor(() => {
        const editButton = screen.getByText('Edit')
        expect(editButton).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
      })
    })
  })
})

// Helper function for rendering hooks
function renderHook(callback: () => any) {
  let result: { current: any } = { current: null }
  
  function TestComponent() {
    result.current = callback()
    return null
  }
  
  render(<TestComponent />)
  
  return { result }
}

// Mock user data for tests
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  company_name: 'Test Company',
  role: 'user' as const,
  created_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-23T12:00:00Z',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  quote_count: 5,
  total_revenue: 1250,
  accepted_quotes: 3,
  acceptance_rate: 60,
  event_count: 15,
  last_active: '2024-01-23T12:00:00Z',
  status: 'active' as const
}