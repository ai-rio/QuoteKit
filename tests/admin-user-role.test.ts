
import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

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
