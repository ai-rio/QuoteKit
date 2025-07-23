'use client'

import { useCallback, useEffect, useState } from 'react'

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  company_name: string
  role: 'admin' | 'user'
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  quote_count: number
  total_revenue: number
  accepted_quotes: number
  acceptance_rate: number
  event_count: number
  last_active: string | null
  status: 'active' | 'inactive'
}

export interface UsersPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UseAdminUsersResult {
  users: AdminUser[]
  loading: boolean
  error: string | null
  pagination: UsersPagination | null
  refreshUsers: () => Promise<void>
  updateUserRole: (userId: string, role: 'admin' | 'user') => Promise<boolean>
  updateUserProfile: (userId: string, data: { full_name: string }) => Promise<boolean>
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => Promise<boolean>
}

export function useAdminUsers(page: number = 1, limit: number = 20): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<UsersPagination | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/users?page=${page}&limit=${limit}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users')
      }
      
      if (result.success) {
        setUsers(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching admin users:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  const updateUserRole = async (userId: string, role: 'admin' | 'user'): Promise<boolean> => {
    try {
      const action = role === 'admin' ? 'grant_admin' : 'revoke_admin'
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          role
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user role')
      }
      
      if (result.success) {
        // Refresh users list to reflect the change
        await fetchUsers()
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error updating user role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user role')
      return false
    }
  }

  const updateUserProfile = async (userId: string, data: { full_name: string }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user profile')
      }
      
      if (result.success) {
        // Refresh users list to reflect the change
        await fetchUsers()
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error updating user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user profile')
      return false
    }
  }

  const updateUserStatus = async (userId: string, status: 'active' | 'inactive'): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user status')
      }
      
      if (result.success) {
        // Refresh users list to reflect the change
        await fetchUsers()
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error updating user status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user status')
      return false
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, limit, fetchUsers])

  return {
    users,
    loading,
    error,
    pagination,
    refreshUsers: fetchUsers,
    updateUserRole,
    updateUserProfile,
    updateUserStatus
  }
}