export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          internal_id: string
          id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          user_id: string
          status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          cancel_at_period_end: boolean | null
          created: string
          current_period_start: string
          current_period_end: string
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          internal_id?: string
          id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          user_id: string
          status?: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          cancel_at_period_end?: boolean | null
          created?: string
          current_period_start?: string
          current_period_end?: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          internal_id?: string
          id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          user_id?: string
          status?: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          cancel_at_period_end?: boolean | null
          created?: string
          current_period_start?: string
          current_period_end?: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          id: string
          stripe_event_id: string
          event_type: string
          processed: boolean | null
          created_at: string | null
          processed_at: string | null
          data: Json | null
          error_message?: string | null
          retry_count: number | null
          last_retry_at: string | null
        }
        Insert: {
          id?: string
          stripe_event_id: string
          event_type: string
          processed?: boolean | null
          created_at?: string | null
          processed_at?: string | null
          data?: Json | null
          error_message?: string | null
          retry_count?: number | null
          last_retry_at?: string | null
        }
        Update: {
          id?: string
          stripe_event_id?: string
          event_type?: string
          processed?: boolean | null
          created_at?: string | null
          processed_at?: string | null
          data?: Json | null
          error_message?: string | null
          retry_count?: number | null
          last_retry_at?: string | null
        }
        Relationships: []
      }
      stripe_prices: {
        Row: {
          id: string
          stripe_price_id: string
          stripe_product_id: string
          active: boolean | null
          description: string | null
          unit_amount: number | null
          currency: string | null
          recurring_interval: string | null
          recurring_interval_count: number | null
          trial_period_days: number | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          stripe_price_id: string
          stripe_product_id: string
          active?: boolean | null
          description?: string | null
          unit_amount?: number | null
          currency?: string | null
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          stripe_price_id?: string
          stripe_product_id?: string
          active?: boolean | null
          description?: string | null
          unit_amount?: number | null
          currency?: string | null
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          id: string
          stripe_product_id: string
          active: boolean | null
          name: string | null
          description: string | null
          image: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          stripe_product_id: string
          active?: boolean | null
          name?: string | null
          description?: string | null
          image?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          stripe_product_id?: string
          active?: boolean | null
          name?: string | null
          description?: string | null
          image?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      // Add other essential tables for core functionality
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      create_free_plan_subscription: {
        Args: {
          p_user_id: string
          p_price_id: string
        }
        Returns: string
      }
      upgrade_subscription_to_paid: {
        Args: {
          p_user_id: string
          p_stripe_subscription_id: string
          p_stripe_customer_id: string
          p_price_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never