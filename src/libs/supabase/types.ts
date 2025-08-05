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
      users: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          billing_address: Json | null
          payment_method: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          payment_method?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          payment_method?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      company_settings: {
        Row: {
          id: string
          company_name: string | null
          company_address: string | null
          company_email: string | null
          company_phone: string | null
          logo_url: string | null
          logo_file_name: string | null
          default_tax_rate: number | null
          default_markup_rate: number | null
          preferred_currency: string | null
          quote_terms: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          company_name?: string | null
          company_address?: string | null
          company_email?: string | null
          company_phone?: string | null
          logo_url?: string | null
          logo_file_name?: string | null
          default_tax_rate?: number | null
          default_markup_rate?: number | null
          preferred_currency?: string | null
          quote_terms?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_name?: string | null
          company_address?: string | null
          company_email?: string | null
          company_phone?: string | null
          logo_url?: string | null
          logo_file_name?: string | null
          default_tax_rate?: number | null
          default_markup_rate?: number | null
          preferred_currency?: string | null
          quote_terms?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          client_name: string
          client_contact: string | null
          quote_number: string | null
          quote_data: Json
          subtotal: number
          tax_rate: number
          markup_rate: number
          total: number
          status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted'
          sent_at: string | null
          expires_at: string | null
          follow_up_date: string | null
          notes: string | null
          is_template: boolean | null
          template_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          client_name: string
          client_contact?: string | null
          quote_number?: string | null
          quote_data: Json
          subtotal: number
          tax_rate: number
          markup_rate: number
          total: number
          status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted'
          sent_at?: string | null
          expires_at?: string | null
          follow_up_date?: string | null
          notes?: string | null
          is_template?: boolean | null
          template_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          client_name?: string
          client_contact?: string | null
          quote_number?: string | null
          quote_data?: Json
          subtotal?: number
          tax_rate?: number
          markup_rate?: number
          total?: number
          status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted'
          sent_at?: string | null
          expires_at?: string | null
          follow_up_date?: string | null
          notes?: string | null
          is_template?: boolean | null
          template_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      line_items: {
        Row: {
          id: string
          user_id: string
          name: string
          unit: string | null
          cost: number
          category: string | null
          tags: string[] | null
          is_favorite: boolean | null
          last_used_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          unit?: string | null
          cost: number
          category?: string | null
          tags?: string[] | null
          is_favorite?: boolean | null
          last_used_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          unit?: string | null
          cost?: number
          category?: string | null
          tags?: string[] | null
          is_favorite?: boolean | null
          last_used_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          active: boolean | null
          name: string | null
          description: string | null
          image: string | null
          metadata: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          active?: boolean | null
          name?: string | null
          description?: string | null
          image?: string | null
          metadata?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          active?: boolean | null
          name?: string | null
          description?: string | null
          image?: string | null
          metadata?: Json
          created_at?: string | null
          updated_at?: string | null
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string | null
          active: boolean | null
          description: string | null
          unit_amount: number | null
          currency: string | null
          type: 'one_time' | 'recurring' | null
          interval: 'day' | 'week' | 'month' | 'year' | null
          interval_count: number | null
          trial_period_days: number | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
          // Relationships
          products?: {
            id: string
            name: string | null
            description: string | null
            active: boolean | null
            metadata: Json
          }
        }
        Insert: {
          id: string
          product_id?: string | null
          active?: boolean | null
          description?: string | null
          unit_amount?: number | null
          currency?: string | null
          type?: 'one_time' | 'recurring' | null
          interval?: 'day' | 'week' | 'month' | 'year' | null
          interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          active?: boolean | null
          description?: string | null
          unit_amount?: number | null
          currency?: string | null
          type?: 'one_time' | 'recurring' | null
          interval?: 'day' | 'week' | 'month' | 'year' | null
          interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
      }
      billing_history: {
        Row: {
          id: string
          user_id: string
          stripe_invoice_id: string | null
          amount: number | null
          currency: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_invoice_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_invoice_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused' | null
          metadata: Json | null
          price_id: string | null
          stripe_subscription_id: string | null
          quantity: number | null
          cancel_at_period_end: boolean | null
          created: string | null
          current_period_start: string | null
          current_period_end: string | null
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          // Relationships
          prices?: {
            id: string
            unit_amount: number | null
            products?: {
              id: string
              name: string | null
            }
          }
        }
        Insert: {
          id: string
          user_id: string
          status?: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused' | null
          metadata?: Json | null
          price_id?: string | null
          stripe_subscription_id?: string | null
          quantity?: number | null
          cancel_at_period_end?: boolean | null
          created?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused' | null
          metadata?: Json | null
          price_id?: string | null
          stripe_subscription_id?: string | null
          quantity?: number | null
          cancel_at_period_end?: boolean | null
          created?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      quote_status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted'
      subscription_status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused'
      pricing_type: 'one_time' | 'recurring'
      pricing_plan_interval: 'day' | 'week' | 'month' | 'year'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof (Database["public"]["Enums"])
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicEnumNameOrOptions["schema"]]["Enums"])
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicEnumNameOrOptions["schema"]]["Enums"])[EnumName]
  : PublicEnumNameOrOptions extends keyof (Database["public"]["Enums"])
  ? (Database["public"]["Enums"])[PublicEnumNameOrOptions]
  : never
