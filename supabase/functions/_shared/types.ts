/**
 * Shared TypeScript types for Edge Functions
 * Ensures consistency across all functions
 */

// User and authentication types
export interface User {
  id: string;
  email?: string;
  created_at: string;
  updated_at?: string;
}

// Subscription types
export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  stripe_price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  quantity?: number;
  created_at: string;
  updated_at?: string;
}

// Quote types
export interface Quote {
  id: string;
  user_id: string;
  quote_number: string;
  client_name: string;
  client_id?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  line_items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  valid_until?: string;
  is_template?: boolean;
  template_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface LineItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
  category?: string;
}

// Feature access types
export interface FeatureAccess {
  max_quotes: number;
  max_clients: number;
  pdf_export: boolean;
  email_quotes: boolean;
  custom_branding: boolean;
  analytics: boolean;
  api_access: boolean;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Performance metrics types
export interface PerformanceMetrics {
  executionTimeMs: number;
  databaseQueries: number;
  apiCalls: number;
  memoryUsageMb?: number;
  errorCount: number;
}

// Edge Function context
export interface EdgeFunctionContext {
  user?: User;
  isAdmin: boolean;
  functionName: string;
  operationType: string;
  requestId: string;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Subscription status response
export interface SubscriptionStatusResponse {
  user: {
    id: string;
    email?: string;
  };
  subscription: Subscription | null;
  features: FeatureAccess;
  usage: {
    quotes: number;
    clients: number;
    periodStart: string;
    periodEnd: string;
  };
  limits: {
    quotes: number;
    clients: number;
    quotesRemaining: number;
    clientsRemaining: number;
  };
  diagnostics?: Array<{
    level: 'info' | 'warning' | 'error';
    message: string;
    recommendation?: string;
  }>;
}

// Analytics types
export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  created: number;
  livemode: boolean;
}

// Bulk operation types
export interface BulkOperation {
  operation: 'delete' | 'update' | 'export';
  items: string[];
  options?: Record<string, any>;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  results?: any[];
}