// Temporary basic Supabase types - TODO: Generate real types in Sprint 2
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          raw_user_meta_data?: any
          user_metadata?: any
        }
        Insert: any
        Update: any
      }
      quotes: {
        Row: {
          id: string
          client_name: string
          client_contact: string | null
          quote_data: any
          subtotal: number
          tax_rate: number
          total: number
          created_at: string
          user_id: string
        }
        Insert: any
        Update: any
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          value: any
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
    }
    Views: {
      quote_analytics: {
        Row: {
          user_id: string
          email: string
          quote_count: number
          total_revenue: number
          last_active: string
        }
      }
    }
    Functions: {
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]