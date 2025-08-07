import { getSupabaseAdmin,requireAuth } from '../_shared/auth.ts';
import { createCorsResponse,handleCors } from '../_shared/cors.ts';
import { trackedQuery,withPerformanceTracking } from '../_shared/performance.ts';
import { 
  FeatureAccess, 
  Subscription, 
  SubscriptionStatusResponse} from '../_shared/types.ts';
import { 
  createErrorResponse,
  createSuccessResponse,
  getRequestParams, 
  parseFeatureMetadata} from '../_shared/utils.ts';

const FUNCTION_NAME = 'subscription-status';

/**
 * Subscription Status Edge Function
 * 
 * Consolidates multiple API endpoints into a single function:
 * - /api/subscription-status (subscription diagnostics)
 * - /api/debug-subscription (subscription debugging) 
 * - /api/features/usage (feature usage tracking)
 * - /api/sync-my-subscription (manual sync capabilities)
 * 
 * Provides comprehensive subscription status with:
 * - Current subscription details
 * - Feature access and limits
 * - Usage tracking and remaining quotas
 * - Diagnostic information
 * - Sync capabilities
 */
Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return withPerformanceTracking(
    FUNCTION_NAME,
    'subscription_status_check',
    undefined, // Will be set after auth
    async (monitor) => {
      try {
        // Authentication
        const { response: authResponse, user } = await requireAuth(req);
        if (authResponse) return authResponse;

        monitor.addMetadata('user_id', user!.id);

        const url = new URL(req.url);
        const params = getRequestParams(url);
        const includeSync = params.include_sync === 'true';
        const includeDiagnostics = params.include_diagnostics !== 'false'; // Default true

        // Get Supabase admin client for database operations
        const supabase = getSupabaseAdmin();

        // Get user's subscription with related data
        const subscriptionData = await trackedQuery(
          monitor,
          async () => {
            const { data, error } = await supabase
              .from('subscriptions')
              .select(`
                *,
                stripe_prices!inner (
                  id,
                  unit_amount,
                  currency,
                  interval,
                  stripe_products!inner (
                    id,
                    name,
                    description,
                    metadata
                  )
                )
              `)
              .eq('user_id', user!.id)
              .eq('status', 'active')
              .order('created', { ascending: false })
              .limit(1);

            if (error) throw error;
            return data?.[0] || null;
          },
          'subscription_query'
        );

        // Get user's customer record
        const customerData = await trackedQuery(
          monitor,
          async () => {
            const { data, error } = await supabase
              .from('stripe_customers')
              .select('stripe_customer_id, email')
              .eq('id', user!.id)
              .single();

            return { data: data || null, error };
          },
          'customer_query'
        );

        // Get current usage data
        const usageData = await trackedQuery(
          monitor,
          async () => {
            const { data, error } = await supabase
              .rpc('get_current_usage', { p_user_id: user!.id })
              .single();

            if (error) throw error;
            return data;
          },
          'usage_query'
        );

        // Parse feature access from subscription metadata
        const features: FeatureAccess = subscriptionData?.stripe_prices?.stripe_products?.metadata
          ? parseFeatureMetadata(subscriptionData.stripe_prices.stripe_products.metadata)
          : {
              max_quotes: 5, // Free plan defaults
              max_clients: 3,
              pdf_export: false,
              email_quotes: false,
              custom_branding: false,
              analytics: false,
              api_access: false,
            };

        // Calculate usage and limits
        const currentUsage = {
          quotes: usageData?.quotes_count || 0,
          clients: usageData?.clients_count || 0,
          periodStart: usageData?.period_start || new Date().toISOString(),
          periodEnd: usageData?.period_end || new Date().toISOString(),
        };

        const limits = {
          quotes: features.max_quotes,
          clients: features.max_clients,
          quotesRemaining: features.max_quotes === -1 ? -1 : Math.max(0, features.max_quotes - currentUsage.quotes),
          clientsRemaining: features.max_clients === -1 ? -1 : Math.max(0, features.max_clients - currentUsage.clients),
        };

        // Build response data
        const responseData: SubscriptionStatusResponse = {
          user: {
            id: user!.id,
            email: user!.email,
          },
          subscription: subscriptionData as Subscription || null,
          features,
          usage: currentUsage,
          limits,
        };

        // Add diagnostics if requested
        if (includeDiagnostics) {
          const diagnostics = [];

          // Check for common issues
          if (!customerData.data?.stripe_customer_id) {
            diagnostics.push({
              level: 'warning' as const,
              message: 'No Stripe customer mapping found',
              recommendation: 'Contact support if you have made a payment',
            });
          }

          if (!subscriptionData && customerData.data?.stripe_customer_id) {
            diagnostics.push({
              level: 'info' as const,
              message: 'No active subscription found',
              recommendation: 'Use the sync button if you recently made a payment',
            });
          }

          if (currentUsage.quotes >= limits.quotes && limits.quotes !== -1) {
            diagnostics.push({
              level: 'warning' as const,
              message: `You have reached your quote limit of ${limits.quotes}`,
              recommendation: 'Upgrade to Pro for unlimited quotes',
            });
          }

          responseData.diagnostics = diagnostics;
        }

        // Add sync capabilities if requested
        if (includeSync && customerData.data?.stripe_customer_id) {
          monitor.addMetadata('sync_available', true);
          
          // Get recent webhook activity for diagnostics
          const recentWebhooks = await trackedQuery(
            monitor,
            async () => {
              const { data } = await supabase
                .from('stripe_webhook_events')
                .select('stripe_event_id, event_type, processed, created_at, error_message')
                .order('created_at', { ascending: false })
                .limit(10);

              return data || [];
            },
            'webhook_history_query'
          );

          const failedWebhooks = recentWebhooks.filter(w => !w.processed).length;
          if (failedWebhooks > 0) {
            responseData.diagnostics = responseData.diagnostics || [];
            responseData.diagnostics.push({
              level: 'error' as const,
              message: `${failedWebhooks} recent webhook events failed to process`,
              recommendation: 'Try the sync button or contact support',
            });
          }
        }

        monitor.addMetadata('subscription_active', !!subscriptionData);
        monitor.addMetadata('has_customer_id', !!customerData.data?.stripe_customer_id);
        monitor.addMetadata('quotes_used', currentUsage.quotes);
        monitor.addMetadata('quotes_limit', limits.quotes);

        return createCorsResponse({
          success: true,
          data: responseData,
          message: 'Subscription status retrieved successfully',
          metadata: {
            function: FUNCTION_NAME,
            timestamp: new Date().toISOString(),
            cached: false, // TODO: Implement caching
          },
        });

      } catch (error) {
        console.error(`Error in ${FUNCTION_NAME}:`, error);
        monitor.incrementErrors();
        
        return createCorsResponse({
          success: false,
          error: 'Failed to retrieve subscription status',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SUBSCRIPTION_STATUS_ERROR',
        }, 500);
      }
    }
  );
});

/**
 * Subscription sync operation
 * Manually synchronizes subscription data from Stripe
 */
async function syncSubscription(userId: string, customerId: string, monitor: any) {
  // TODO: Implement subscription sync logic
  // This would call Stripe API to get latest subscription data
  // and update the database accordingly
  
  monitor.incrementApiCalls(); // Stripe API call
  monitor.addMetadata('sync_performed', true);
  
  return {
    success: true,
    message: 'Subscription sync completed',
    lastSync: new Date().toISOString(),
  };
}