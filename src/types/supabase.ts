
export type Database = {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string
          status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          quantity: number
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          cancel_at: string | null
          canceled_at: string | null
          ended_at: string | null
          trial_start: string | null
          trial_end: string | null
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id: string
          status?: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          quantity?: number
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          canceled_at?: string | null
          ended_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string
          status?: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          quantity?: number
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          canceled_at?: string | null
          ended_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      stripe_customers: {
        Row: {
          user_id: string
          stripe_customer_id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          stripe_customer_id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          stripe_customer_id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      stripe_products: {
        Row: {
          stripe_product_id: string
          name: string
          description: string | null
          active: boolean
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          stripe_product_id: string
          name: string
          description?: string | null
          active?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_product_id?: string
          name?: string
          description?: string | null
          active?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      stripe_prices: {
        Row: {
          stripe_price_id: string
          stripe_product_id: string
          unit_amount: number | null
          currency: string
          recurring_interval: string | null
          recurring_interval_count: number | null
          active: boolean
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          stripe_price_id: string
          stripe_product_id: string
          unit_amount?: number | null
          currency?: string
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          active?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_price_id?: string
          stripe_product_id?: string
          unit_amount?: number | null
          currency?: string
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          active?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      subscription_details: {
        Row: {
          subscription_id: string
          user_id: string
          stripe_subscription_id: string | null
          status: string
          stripe_product_id: string
          product_name: string
          product_description: string | null
          stripe_price_id: string
          unit_amount: number | null
          currency: string
          recurring_interval: string | null
          current_period_start: string
          current_period_end: string
          trial_start: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          ended_at: string | null
          quantity: number
          subscription_metadata: Record<string, any>
          created_at: string
          updated_at: string
          subscription_type: string
          is_active: boolean
        }
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          client_name: string
          total: number
          status: string
          quote_number: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_name: string
          total: number
          status: string
          quote_number: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_name?: string
          total?: number
          status?: string
          quote_number?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_user_active_subscription: {
        Args: { p_user_id: string }
        Returns: {
          subscription_id: string
          stripe_subscription_id: string | null
          stripe_price_id: string
          product_name: string
          unit_amount: number | null
          currency: string
          status: string
          current_period_end: string
        }[]
      }
    }
  }
}