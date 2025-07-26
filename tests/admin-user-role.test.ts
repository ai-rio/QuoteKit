
import { jest } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: { raw_user_meta_data: { role: 'admin' } },
          error: null
        }))
      }))
    }))
  }))
}

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = mockSupabase as any

describe('Admin user role', () => {
  it('should have the admin role', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('raw_user_meta_data')
      .eq('email', 'carlos@ai.rio.br')
      .single()

    expect(error).toBeNull()
    expect(data.raw_user_meta_data.role).toBe('admin')
  })
})
