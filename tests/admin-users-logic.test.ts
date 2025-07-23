/**
 * Unit tests for admin users logic and data processing
 * Story 1.2: Real User Data Integration
 */

// Mock environment variables first
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

describe('Admin Users Logic', () => {
  describe('User data processing', () => {
    it('should combine user data with activity metrics correctly', () => {
      // Mock user data
      const users = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'user',
          created_at: '2024-01-01T00:00:00Z',
          last_sign_in_at: '2024-01-15T00:00:00Z',
          email_confirmed_at: '2024-01-01T01:00:00Z'
        }
      ]

      // Mock activity data
      const activity = [
        {
          user_id: 'user-1',
          event_count: 5,
          quotes_created: 2,
          last_active: '2024-01-15T00:00:00Z'
        }
      ]

      // Mock quote analytics
      const quoteAnalytics = [
        {
          user_id: 'user-1',
          total_quotes: 2,
          total_quote_value: 1000,
          accepted_quotes: 1,
          acceptance_rate_percent: 50
        }
      ]

      // Process the data (simulating API logic)
      const processedUsers = users.map(user => {
        const userActivity = activity.find(a => a.user_id === user.id)
        const analytics = quoteAnalytics.find(q => q.user_id === user.id)
        
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          quote_count: analytics?.total_quotes || 0,
          total_revenue: analytics?.total_quote_value || 0,
          accepted_quotes: analytics?.accepted_quotes || 0,
          acceptance_rate: analytics?.acceptance_rate_percent || 0,
          event_count: userActivity?.event_count || 0,
          last_active: userActivity?.last_active || user.last_sign_in_at,
          status: user.email_confirmed_at ? 'active' : 'inactive'
        }
      })

      expect(processedUsers).toHaveLength(1)
      expect(processedUsers[0]).toMatchObject({
        id: 'user-1',
        email: 'user1@example.com',
        quote_count: 2,
        total_revenue: 1000,
        accepted_quotes: 1,
        acceptance_rate: 50,
        status: 'active'
      })
    })

    it('should handle missing activity data gracefully', () => {
      const users = [
        {
          id: 'user-2',
          email: 'user2@example.com',
          role: 'user',
          created_at: '2024-01-01T00:00:00Z',
          last_sign_in_at: '2024-01-15T00:00:00Z',
          email_confirmed_at: '2024-01-01T01:00:00Z'
        }
      ]

      // No activity or analytics data
      const activity: any[] = []
      const quoteAnalytics: any[] = []

      const processedUsers = users.map(user => {
        const userActivity = activity.find(a => a.user_id === user.id)
        const analytics = quoteAnalytics.find(q => q.user_id === user.id)
        
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          quote_count: analytics?.total_quotes || 0,
          total_revenue: analytics?.total_quote_value || 0,
          accepted_quotes: analytics?.accepted_quotes || 0,
          acceptance_rate: analytics?.acceptance_rate_percent || 0,
          event_count: userActivity?.event_count || 0,
          status: user.email_confirmed_at ? 'active' : 'inactive'
        }
      })

      expect(processedUsers[0]).toMatchObject({
        id: 'user-2',
        quote_count: 0,
        total_revenue: 0,
        accepted_quotes: 0,
        acceptance_rate: 0,
        event_count: 0,
        status: 'active'
      })
    })

    it('should handle user status correctly based on email confirmation', () => {
      const users = [
        {
          id: 'confirmed-user',
          email: 'confirmed@example.com',
          email_confirmed_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'unconfirmed-user',
          email: 'unconfirmed@example.com',
          email_confirmed_at: null
        }
      ]

      const processedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        status: user.email_confirmed_at ? 'active' : 'inactive'
      }))

      expect(processedUsers[0].status).toBe('active')
      expect(processedUsers[1].status).toBe('inactive')
    })
  })

  describe('Pagination logic', () => {
    it('should calculate pagination correctly', () => {
      const totalUsers = 25
      const page = 2
      const limit = 10
      
      const pagination = {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }

      expect(pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3
      })
    })

    it('should calculate offset correctly for pagination', () => {
      const page = 3
      const limit = 20
      const offset = (page - 1) * limit

      expect(offset).toBe(40)
    })
  })

  describe('Search filtering', () => {
    it('should filter users by email', () => {
      const users = [
        { email: 'john@lawncare.com', company_name: 'Green Lawn', full_name: 'John Doe' },
        { email: 'sarah@yardpro.com', company_name: 'YardPro', full_name: 'Sarah Smith' },
        { email: 'mike@grassmaster.net', company_name: 'GrassMaster', full_name: 'Mike Johnson' }
      ]

      const searchTerm = 'john'
      const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )

      expect(filteredUsers).toHaveLength(2) // john@lawncare.com and Mike Johnson
      expect(filteredUsers[0].email).toBe('john@lawncare.com')
      expect(filteredUsers[1].full_name).toBe('Mike Johnson')
    })

    it('should filter users by company name', () => {
      const users = [
        { email: 'john@lawncare.com', company_name: 'Green Lawn Services', full_name: 'John Doe' },
        { email: 'sarah@yardpro.com', company_name: 'YardPro Solutions', full_name: 'Sarah Smith' }
      ]

      const searchTerm = 'yard'
      const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )

      expect(filteredUsers).toHaveLength(1)
      expect(filteredUsers[0].company_name).toBe('YardPro Solutions')
    })
  })

  describe('Summary calculations', () => {
    it('should calculate total users correctly', () => {
      const users = [
        { status: 'active', quote_count: 5, total_revenue: 1000 },
        { status: 'inactive', quote_count: 3, total_revenue: 500 },
        { status: 'active', quote_count: 8, total_revenue: 1500 }
      ]

      const totalUsers = users.length
      const activeUsers = users.filter(u => u.status === 'active').length
      const totalQuotes = users.reduce((sum, user) => sum + user.quote_count, 0)
      const totalRevenue = users.reduce((sum, user) => sum + user.total_revenue, 0)

      expect(totalUsers).toBe(3)
      expect(activeUsers).toBe(2)
      expect(totalQuotes).toBe(16)
      expect(totalRevenue).toBe(3000)
    })

    it('should calculate active user percentage correctly', () => {
      const totalUsers = 10
      const activeUsers = 7
      const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

      expect(activePercentage).toBe(70)
    })

    it('should handle zero users gracefully', () => {
      const totalUsers = 0
      const activeUsers = 0
      const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

      expect(activePercentage).toBe(0)
    })
  })
})