// ============================================================================
// CLEAN SUBSCRIPTION TYPES v2.0
// ============================================================================
// Generated TypeScript types for the clean subscription schema
// These replace the messy existing types with clear, consistent interfaces
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// 1. ENUMS
// ============================================================================

export type SubscriptionStatus = 
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export type RecurringInterval = 'day' | 'week' | 'month' | 'year'

export type SubscriptionType = 'free' | 'paid'

// ============================================================================
// 2. DATABASE TABLES
// ============================================================================

export interface Database {
  public: {
    Tables: {
      // Users table - minimal core data
      users: {
        Row: {
          id: string // uuid
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string // timestamptz
          updated_at: string // timestamptz
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Stripe customers - user to customer mapping
      stripe_customers: {
        Row: {
          user_id: string // uuid, primary key
          stripe_customer_id: string
          email: string
          created_at: string // timestamptz
          updated_at: string // timestamptz
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
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      // Stripe products - product catalog
      stripe_products: {
        Row: {
          stripe_product_id: string // primary key
          name: string
          description: string | null
          active: boolean
          metadata: Json
          created_at: string // timestamptz
          updated_at: string // timestamptz
        }
        Insert: {
          stripe_product_id: string
          name: string
          description?: string | null
          active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_product_id?: string
          name?: string
          description?: string | null
          active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // Stripe prices - pricing information
      stripe_prices: {
        Row: {
          stripe_price_id: string // primary key
          stripe_product_id: string
          unit_amount: number | null // null for free
          currency: string
          recurring_interval: RecurringInterval | null
          recurring_interval_count: number
          active: boolean
          metadata: Json
          created_at: string // timestamptz
          updated_at: string // timestamptz
        }
        Insert: {
          stripe_price_id: string
          stripe_product_id: string
          unit_amount?: number | null
          currency?: string
          recurring_interval?: RecurringInterval | null
          recurring_interval_count?: number
          active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_price_id?: string
          stripe_product_id?: string
          unit_amount?: number | null
          currency?: string
          recurring_interval?: RecurringInterval | null
          recurring_interval_count?: number
          active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_prices_stripe_product_id_fkey"
            columns: ["stripe_product_id"]
            referencedRelation: "stripe_products"
            referencedColumns: ["stripe_product_id"]
          }
        ]
      }

      // Subscriptions - core subscription data
      subscriptions: {
        Row: {
          id: string // uuid, primary key
          user_id: string // uuid
          stripe_subscription_id: string | null // null for free plans
          stripe_customer_id: string | null
          stripe_price_id: string
          status: SubscriptionStatus
          quantity: number
          current_period_start: string // timestamptz
          current_period_end: string // timestamptz
          cancel_at_period_end: boolean
          cancel_at: string | null // timestamptz
          canceled_at: string | null // timestamptz
          ended_at: string | null // timestamptz
          trial_start: string | null // timestamptz
          trial_end: string | null // timestamptz
          metadata: Json
          created_at: string // timestamptz
          updated_at: string // timestamptz
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id: string
          status?: SubscriptionStatus
          quantity?: number
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          canceled_at?: string | null
          ended_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string
          status?: SubscriptionStatus
          quantity?: number
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          canceled_at?: string | null
          ended_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_stripe_customer_id_fkey"
            columns: ["stripe_customer_id"]
            referencedRelation: "stripe_customers"
            referencedColumns: ["stripe_customer_id"]
          },
          {
            foreignKeyName: "subscriptions_stripe_price_id_fkey"
            columns: ["stripe_price_id"]
            referencedRelation: "stripe_prices"
            referencedColumns: ["stripe_price_id"]
          }
        ]
      }

      // Webhook events - for idempotency and debugging
      webhook_events: {
        Row: {
          id: string // uuid
          stripe_event_id: string
          event_type: string
          processed_at: string | null // timestamptz
          error_message: string | null
          retry_count: number
          event_data: Json
          created_at: string // timestamptz
        }
        Insert: {
          id?: string
          stripe_event_id: string
          event_type: string
          processed_at?: string | null
          error_message?: string | null
          retry_count?: number
          event_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          stripe_event_id?: string
          event_type?: string
          processed_at?: string | null
          error_message?: string | null
          retry_count?: number
          event_data?: Json
          created_at?: string
        }
        Relationships: []
      }
    }

    // ========================================================================
    // 3. VIEWS
    // ========================================================================
    Views: {
      subscription_details: {
        Row: {
          subscription_id: string
          user_id: string
          user_email: string
          stripe_subscription_id: string | null
          status: SubscriptionStatus
          stripe_product_id: string
          product_name: string
          product_description: string | null
          stripe_price_id: string
          unit_amount: number | null
          currency: string
          recurring_interval: RecurringInterval | null
          current_period_start: string
          current_period_end: string
          trial_start: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          ended_at: string | null
          quantity: number
          subscription_metadata: Json
          created_at: string
          updated_at: string
          subscription_type: SubscriptionType
          is_active: boolean
        }
        Relationships: []
      }
    }

    // ========================================================================
    // 4. FUNCTIONS
    // ========================================================================
    Functions: {
      get_user_active_subscription: {
        Args: {
          p_user_id: string
        }
        Returns: {
          subscription_id: string
          stripe_subscription_id: string | null
          stripe_price_id: string
          product_name: string
          unit_amount: number | null
          currency: string
          status: SubscriptionStatus
          current_period_end: string
        }[]
      }

      upsert_subscription: {
        Args: {
          p_user_id: string
          p_stripe_subscription_id: string
          p_stripe_customer_id: string
          p_stripe_price_id: string
          p_status: SubscriptionStatus
          p_quantity: number
          p_current_period_start: string
          p_current_period_end: string
          p_cancel_at_period_end: boolean
          p_cancel_at: string | null
          p_canceled_at: string | null
          p_ended_at: string | null
          p_trial_start: string | null
          p_trial_end: string | null
          p_metadata: Json
        }
        Returns: string // subscription id
      }

      create_free_subscription: {
        Args: {
          p_user_id: string
          p_stripe_price_id: string
        }
        Returns: string // subscription id
      }
    }

    Enums: {
      subscription_status: SubscriptionStatus
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// 5. HELPER TYPES FOR APPLICATION USE
// ============================================================================

// Extract table types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Specific table types
export type User = Tables<'users'>
export type StripeCustomer = Tables<'stripe_customers'>
export type StripeProduct = Tables<'stripe_products'>
export type StripePrice = Tables<'stripe_prices'>
export type Subscription = Tables<'subscriptions'>
export type WebhookEvent = Tables<'webhook_events'>

// View types
export type SubscriptionDetails = Database['public']['Views']['subscription_details']['Row']

// Function return types
export type UserActiveSubscription = Database['public']['Functions']['get_user_active_subscription']['Returns'][0]

// ============================================================================
// 6. APPLICATION-SPECIFIC INTERFACES
// ============================================================================

// Complete subscription info with related data
export interface SubscriptionWithDetails {
  subscription: Subscription
  user: User
  customer: StripeCustomer | null
  price: StripePrice
  product: StripeProduct
}

// Subscription creation payload
export interface CreateSubscriptionParams {
  userId: string
  stripePriceId: string
  stripeSubscriptionId?: string | null
  stripeCustomerId?: string | null
  quantity?: number
  trialEnd?: string | null
}

// Subscription update payload
export interface UpdateSubscriptionParams {
  subscriptionId: string
  status?: SubscriptionStatus
  cancelAtPeriodEnd?: boolean
  currentPeriodEnd?: string
  quantity?: number
}

// Price with product info for display
export interface PriceWithProduct {
  price: StripePrice
  product: StripeProduct
}

// User's subscription status for UI
export interface UserSubscriptionStatus {
  hasActiveSubscription: boolean
  subscriptionType: SubscriptionType
  currentPlan: {
    name: string
    price: number | null
    currency: string
    interval: RecurringInterval | null
  } | null
  trialEndsAt: string | null
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string
}

// ============================================================================
// 7. API RESPONSE TYPES
// ============================================================================

export interface SubscriptionApiResponse {
  subscription: SubscriptionDetails
  success: boolean
  message?: string
}

export interface PricingApiResponse {
  prices: PriceWithProduct[]
  success: boolean
  message?: string
}

export interface WebhookEventApiResponse {
  event: WebhookEvent
  processed: boolean
  success: boolean
  error?: string
}

// ============================================================================
// TYPE VALIDATION COMPLETE
// ============================================================================
// These types provide:
// ✅ Full type safety for all database operations
// ✅ Clear separation between database and application types
// ✅ Proper nullable handling
// ✅ Relationship type safety
// ✅ Function signature types
// ✅ View types for complex queries
// ✅ Application-specific interfaces
// ✅ API response types
// ============================================================================