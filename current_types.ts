export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
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
          default_markup_rate?: number | null
          default_tax_rate?: number | null
          id?: string
          logo_file_name?: string | null
          logo_url?: string | null
          preferred_currency?: string | null
          quote_terms?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      global_categories: {
        Row: {
          access_tier: Database["public"]["Enums"]["item_access_tier"] | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          access_tier?: Database["public"]["Enums"]["item_access_tier"] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          access_tier?: Database["public"]["Enums"]["item_access_tier"] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      global_items: {
        Row: {
          access_tier: Database["public"]["Enums"]["item_access_tier"] | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          sort_order: number | null
          subcategory: string | null
          tags: string[] | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          access_tier?: Database["public"]["Enums"]["item_access_tier"] | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          access_tier?: Database["public"]["Enums"]["item_access_tier"] | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "global_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      item_categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "line_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_data: Json | null
          created_at: string
          id: string
          is_default: boolean | null
          metadata: Json | null
          stripe_customer_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_data?: Json | null
          created_at?: string
          id: string
          is_default?: boolean | null
          metadata?: Json | null
          stripe_customer_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_data?: Json | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          stripe_customer_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
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
          {
            foreignKeyName: "quotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          address: Json | null
          created_at: string
          currency: string | null
          email: string
          name: string | null
          phone: string | null
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          currency?: string | null
          email: string
          name?: string | null
          phone?: string | null
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          currency?: string | null
          email?: string
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_prices: {
        Row: {
          active: boolean | null
          created_at: string | null
          currency: string
          id: string
          recurring_interval: string | null
          stripe_price_id: string
          stripe_product_id: string
          unit_amount: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          currency: string
          id?: string
          recurring_interval?: string | null
          stripe_price_id: string
          stripe_product_id: string
          unit_amount: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          currency?: string
          id?: string
          recurring_interval?: string | null
          stripe_price_id?: string
          stripe_product_id?: string
          unit_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stripe_prices_product_id"
            columns: ["stripe_product_id"]
            isOneToOne: false
            referencedRelation: "stripe_products"
            referencedColumns: ["stripe_product_id"]
          },
          {
            foreignKeyName: "stripe_prices_stripe_product_id_fkey"
            columns: ["stripe_product_id"]
            isOneToOne: false
            referencedRelation: "stripe_products"
            referencedColumns: ["stripe_product_id"]
          },
        ]
      }
      stripe_products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          stripe_product_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          stripe_product_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          stripe_product_id?: string
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
          last_retry_at: string | null
          processed: boolean | null
          processed_at: string | null
          retry_count: number | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          event_type: string
          id?: string
          last_retry_at?: string | null
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          event_type?: string
          id?: string
          last_retry_at?: string | null
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscription_changes: {
        Row: {
          change_type: string
          created_at: string
          effective_date: string
          id: string
          new_price_id: string
          old_price_id: string | null
          proration_amount: number | null
          reason: string | null
          stripe_subscription_id: string
          subscription_id: string
          subscription_internal_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          change_type: string
          created_at?: string
          effective_date: string
          id?: string
          new_price_id: string
          old_price_id?: string | null
          proration_amount?: number | null
          reason?: string | null
          stripe_subscription_id: string
          subscription_id: string
          subscription_internal_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          change_type?: string
          created_at?: string
          effective_date?: string
          id?: string
          new_price_id?: string
          old_price_id?: string | null
          proration_amount?: number | null
          reason?: string | null
          stripe_subscription_id?: string
          subscription_id?: string
          subscription_internal_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_changes_new_price_id_fkey"
            columns: ["new_price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_old_price_id_fkey"
            columns: ["old_price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_subscription_internal_id_fkey"
            columns: ["subscription_internal_id"]
            isOneToOne: false
            referencedRelation: "subscription_details"
            referencedColumns: ["internal_id"]
          },
          {
            foreignKeyName: "subscription_changes_subscription_internal_id_fkey"
            columns: ["subscription_internal_id"]
            isOneToOne: false
            referencedRelation: "subscription_diagnostics"
            referencedColumns: ["internal_id"]
          },
          {
            foreignKeyName: "subscription_changes_subscription_internal_id_fkey"
            columns: ["subscription_internal_id"]
            isOneToOne: false
            referencedRelation: "subscription_with_plan_details"
            referencedColumns: ["internal_id"]
          },
          {
            foreignKeyName: "subscription_changes_subscription_internal_id_fkey"
            columns: ["subscription_internal_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["internal_id"]
          },
          {
            foreignKeyName: "subscription_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string | null
          internal_id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string | null
          internal_id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string | null
          internal_id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "stripe_prices"
            referencedColumns: ["stripe_price_id"]
          },
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "subscription_diagnostics"
            referencedColumns: ["stripe_price_id"]
          },
          {
            foreignKeyName: "subscriptions_stripe_price_id_fkey"
            columns: ["stripe_price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_global_item_usage: {
        Row: {
          created_at: string | null
          global_item_id: string
          id: string
          is_favorite: boolean | null
          last_used_at: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          global_item_id: string
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          global_item_id?: string
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_global_item_usage_global_item_id_fkey"
            columns: ["global_item_id"]
            isOneToOne: false
            referencedRelation: "global_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_global_item_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          id: string
          payment_method: Json | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_sign_in_at: string | null
          name: string | null
          price_currency: string | null
          price_interval:
            | Database["public"]["Enums"]["pricing_plan_interval"]
            | null
          price_unit_amount: number | null
          product_name: string | null
          stripe_customer_id: string | null
          subscription_cancel_at_period_end: boolean | null
          subscription_current_period_end: string | null
          subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Relationships: []
      }
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
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "quotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_analytics: {
        Row: {
          billing_interval:
            | Database["public"]["Enums"]["pricing_plan_interval"]
            | null
          canceled_at: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          is_active: boolean | null
          is_trialing: boolean | null
          metadata: Json | null
          monthly_revenue_cents: number | null
          product_name: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          subscription_age_days: number | null
          subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          unit_amount: number | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_details: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          internal_id: string | null
          metadata: Json | null
          price_amount: number | null
          price_currency: string | null
          price_description: string | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_id_legacy: string | null
          subscription_type: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "stripe_prices"
            referencedColumns: ["stripe_price_id"]
          },
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "subscription_diagnostics"
            referencedColumns: ["stripe_price_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_diagnostics: {
        Row: {
          created: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_stripe_id: string | null
          internal_id: string | null
          price_id: string | null
          product_name: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_id_legacy: string | null
          subscription_type: string | null
          unit_amount: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "stripe_prices"
            referencedColumns: ["stripe_price_id"]
          },
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "subscription_diagnostics"
            referencedColumns: ["stripe_price_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_with_plan_details: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          display_name: string | null
          ended_at: string | null
          internal_id: string | null
          price_active: boolean | null
          price_id: string | null
          product_active: boolean | null
          product_description: string | null
          product_name: string | null
          recurring_interval: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_id_legacy: string | null
          subscription_type: string | null
          unit_amount: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "stripe_prices"
            referencedColumns: ["stripe_price_id"]
          },
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "subscription_diagnostics"
            referencedColumns: ["stripe_price_id"]
          },
          {
            foreignKeyName: "subscriptions_stripe_price_id_fkey"
            columns: ["stripe_price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_tier: {
        Args: {
          required_tier: Database["public"]["Enums"]["item_access_tier"]
          user_id?: string
        }
        Returns: boolean
      }
      copy_global_item_to_personal: {
        Args: {
          global_item_id: string
          custom_cost?: number
        }
        Returns: string
      }
      create_free_plan_subscription: {
        Args: {
          p_user_id: string
          p_price_id: string
        }
        Returns: string
      }
      ensure_subscription_plan_data: {
        Args: {
          p_stripe_price_id: string
        }
        Returns: boolean
      }
      generate_quote_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_subscription_with_plan: {
        Args: {
          p_user_id: string
        }
        Returns: {
          internal_id: string
          stripe_subscription_id: string
          user_id: string
          status: string
          stripe_price_id: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created: string
          canceled_at: string
          ended_at: string
          unit_amount: number
          currency: string
          recurring_interval: string
          product_name: string
          product_description: string
          subscription_type: string
          display_name: string
        }[]
      }
      get_user_active_subscription: {
        Args: {
          user_uuid: string
        }
        Returns: {
          internal_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          price_id: string
          subscription_type: string
          price_description: string
          price_amount: number
          price_currency: string
        }[]
      }
      get_user_subscription_details_v2: {
        Args: {
          p_user_id: string
        }
        Returns: {
          subscription_id: string
          product_name: string
          status: string
          current_period_end: string
          is_trialing: boolean
        }[]
      }
      get_user_tier: {
        Args: {
          user_id?: string
        }
        Returns: Database["public"]["Enums"]["item_access_tier"]
      }
      get_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          role: string
          created_at: string
          last_sign_in_at: string
          email_confirmed_at: string
        }[]
      }
      grant_admin_role: {
        Args: {
          target_user_id: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: {
          user_id?: string
        }
        Returns: boolean
      }
      revoke_admin_role: {
        Args: {
          target_user_id: string
        }
        Returns: undefined
      }
      toggle_global_item_favorite: {
        Args: {
          global_item_id: string
        }
        Returns: boolean
      }
      update_item_last_used: {
        Args: {
          item_id: string
        }
        Returns: undefined
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
      item_access_tier: "free" | "paid" | "premium"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

