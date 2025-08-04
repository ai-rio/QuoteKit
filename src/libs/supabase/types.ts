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
      admin_alerts: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          invoice_url: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id: string
          invoice_url?: string | null
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          default_markup_rate: number | null
          default_tax_rate: number | null
          id: string
          logo_file_name: string | null
          logo_url: string | null
          preferred_currency: string | null
          quote_terms: string | null
          updated_at: string | null
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          default_markup_rate?: number | null
          default_tax_rate?: number | null
          id: string
          logo_file_name?: string | null
          logo_url?: string | null
          preferred_currency?: string | null
          quote_terms?: string | null
          updated_at?: string | null
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          default_markup_rate?: number | null
          default_tax_rate?: number | null
          id?: string
          logo_file_name?: string | null
          logo_url?: string | null
          preferred_currency?: string | null
          quote_terms?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      dispute_evidence: {
        Row: {
          created_at: string | null
          dispute_id: string
          evidence_data: Json
          id: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dispute_id: string
          evidence_data: Json
          id?: string
          submitted_at: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dispute_id?: string
          evidence_data?: Json
          id?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "payment_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_case_analytics: {
        Row: {
          generated_at: string | null
          handler_breakdown: Json | null
          id: string
          period_end: string
          period_start: string
          success_rate: number
          successful_events: number
          total_events: number
        }
        Insert: {
          generated_at?: string | null
          handler_breakdown?: Json | null
          id?: string
          period_end: string
          period_start: string
          success_rate?: number
          successful_events?: number
          total_events?: number
        }
        Update: {
          generated_at?: string | null
          handler_breakdown?: Json | null
          id?: string
          period_end?: string
          period_start?: string
          success_rate?: number
          successful_events?: number
          total_events?: number
        }
        Relationships: []
      }
      edge_case_events: {
        Row: {
          actions: string[] | null
          context_metadata: Json | null
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          event_id: string
          event_type: string
          handler_used: string
          id: string
          invoice_id: string | null
          next_steps: string[] | null
          payment_method_id: string | null
          result_metadata: Json | null
          subscription_id: string | null
          success: boolean
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actions?: string[] | null
          context_metadata?: Json | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          handler_used: string
          id?: string
          invoice_id?: string | null
          next_steps?: string[] | null
          payment_method_id?: string | null
          result_metadata?: Json | null
          subscription_id?: string | null
          success?: boolean
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actions?: string[] | null
          context_metadata?: Json | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          handler_used?: string
          id?: string
          invoice_id?: string | null
          next_steps?: string[] | null
          payment_method_id?: string | null
          result_metadata?: Json | null
          subscription_id?: string | null
          success?: boolean
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      item_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      line_items: {
        Row: {
          category: string | null
          cost: number
          created_at: string | null
          id: string
          is_favorite: boolean | null
          last_used_at: string | null
          name: string
          tags: string[] | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          cost: number
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          name: string
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          name?: string
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_disputes: {
        Row: {
          amount: number
          charge_id: string
          closed_at: string | null
          created_at: string | null
          currency: string
          evidence_due_by: string | null
          id: string
          last_event_type: string | null
          reason: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          charge_id: string
          closed_at?: string | null
          created_at?: string | null
          currency: string
          evidence_due_by?: string | null
          id: string
          last_event_type?: string | null
          reason: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          charge_id?: string
          closed_at?: string | null
          created_at?: string | null
          currency?: string
          evidence_due_by?: string | null
          id?: string
          last_event_type?: string | null
          reason?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_method_failures: {
        Row: {
          created_at: string | null
          failure_code: string | null
          failure_message: string | null
          failure_type: string
          id: string
          occurred_at: string
          payment_method_id: string
          resolution_method: string | null
          resolved_at: string | null
          retryable: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          failure_type: string
          id?: string
          occurred_at: string
          payment_method_id: string
          resolution_method?: string | null
          resolved_at?: string | null
          retryable?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          failure_type?: string
          id?: string
          occurred_at?: string
          payment_method_id?: string
          resolution_method?: string | null
          resolved_at?: string | null
          retryable?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          stripe_payment_method_id: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id: string
          is_default?: boolean | null
          stripe_payment_method_id: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_contact: string | null
          client_id: string | null
          client_name: string
          created_at: string | null
          expires_at: string | null
          follow_up_date: string | null
          id: string
          is_template: boolean | null
          markup_rate: number
          notes: string | null
          quote_data: Json
          quote_number: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          subtotal: number
          tax_rate: number
          template_name: string | null
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_contact?: string | null
          client_id?: string | null
          client_name: string
          created_at?: string | null
          expires_at?: string | null
          follow_up_date?: string | null
          id?: string
          is_template?: boolean | null
          markup_rate: number
          notes?: string | null
          quote_data: Json
          quote_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          subtotal: number
          tax_rate: number
          template_name?: string | null
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_contact?: string | null
          client_id?: string | null
          client_name?: string
          created_at?: string | null
          expires_at?: string | null
          follow_up_date?: string | null
          id?: string
          is_template?: boolean | null
          markup_rate?: number
          notes?: string | null
          quote_data?: Json
          quote_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          subtotal?: number
          tax_rate?: number
          template_name?: string | null
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_follow_ups: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          event_id: string
          event_type: string
          handler_used: string
          id: string
          next_steps: string[] | null
          scheduled_for: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          event_id: string
          event_type: string
          handler_used: string
          id?: string
          next_steps?: string[] | null
          scheduled_for: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          event_id?: string
          event_type?: string
          handler_used?: string
          id?: string
          next_steps?: string[] | null
          scheduled_for?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_prices: {
        Row: {
          active: boolean | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          stripe_product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          stripe_product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          stripe_product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_prices_stripe_product_id_fkey"
            columns: ["stripe_product_id"]
            isOneToOne: false
            referencedRelation: "stripe_products"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          data: Json | null
          error_message: string | null
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscription_changes: {
        Row: {
          change_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          subscription_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          change_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          subscription_id?: string | null
          timestamp: string
          user_id?: string | null
        }
        Update: {
          change_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          subscription_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id: string
          metadata?: Json | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_stripe_price_id_fkey"
            columns: ["stripe_price_id"]
            isOneToOne: false
            referencedRelation: "stripe_prices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          created_at: string | null
          full_name: string | null
          id: string
          payment_method: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      client_analytics: {
        Row: {
          acceptance_rate_percent: number | null
          accepted_quotes: number | null
          accepted_value: number | null
          average_quote_value: number | null
          client_id: string | null
          client_name: string | null
          client_since: string | null
          declined_quotes: number | null
          email: string | null
          last_quote_date: string | null
          phone: string | null
          total_quote_value: number | null
          total_quotes: number | null
          user_id: string | null
        }
        Relationships: []
      }
      quote_analytics: {
        Row: {
          acceptance_rate_percent: number | null
          accepted_quotes: number | null
          accepted_value: number | null
          average_quote_value: number | null
          converted_quotes: number | null
          declined_quotes: number | null
          draft_quotes: number | null
          expired_quotes: number | null
          sent_quotes: number | null
          template_count: number | null
          total_quote_value: number | null
          total_quotes: number | null
          unique_clients_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_admin_functions: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_quote_number: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_admin_user_details: {
        Args: { user_id?: string }
        Returns: {
          id: string
          email: string
          full_name: string
          is_admin: boolean
          created_at: string
        }[]
      }
      get_pending_admin_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          type: string
          title: string
          message: string
          severity: string
          created_at: string
          metadata: Json
        }[]
      }
      get_user_edge_case_summary: {
        Args: { p_user_id: string }
        Returns: {
          total_events: number
          successful_events: number
          failed_events: number
          recent_failures: number
          unread_notifications: number
          active_disputes: number
        }[]
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      mark_notification_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      update_item_last_used: {
        Args: { item_id: string }
        Returns: undefined
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
        | "converted"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "declined",
        "expired",
        "converted",
      ],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const

