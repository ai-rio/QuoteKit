/**
 * Test Connection Edge Function
 * Simple function to verify Edge Functions are working and connectivity is established
 */

import { getSupabaseAdmin } from '../_shared/auth.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface TestConnectionRequest {
  test?: boolean;
  includeDbTest?: boolean;
}

interface TestConnectionResponse {
  success: boolean;
  message: string;
  timestamp: string;
  environment: {
    deno_version: string;
    supabase_url: string;
    has_service_key: boolean;
  };
  database_test?: {
    connected: boolean;
    query_time_ms?: number;
    error?: string;
  };
  performance: {
    execution_time_ms: number;
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const startTime = performance.now();

  try {
    console.log('🔍 Test connection request received');

    // Parse request body
    let requestData: TestConnectionRequest = {};
    try {
      if (req.method === 'POST') {
        requestData = await req.json();
      }
    } catch (error) {
      console.log('No JSON body provided, using defaults');
    }

    // Basic environment check
    const environment = {
      deno_version: Deno.version.deno,
      supabase_url: Deno.env.get('SUPABASE_URL') || 'not_set',
      has_service_key: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    };

    console.log('Environment check:', environment);

    // Database connectivity test (optional)
    let database_test;
    if (requestData.includeDbTest !== false) {
      const dbStartTime = performance.now();
      try {
        const supabase = getSupabaseAdmin();
        
        // Simple query to test database connectivity
        const { data, error } = await supabase
          .from('edge_function_metrics')
          .select('id')
          .limit(1);

        const dbQueryTime = Math.round(performance.now() - dbStartTime);

        if (error) {
          database_test = {
            connected: false,
            query_time_ms: dbQueryTime,
            error: error.message
          };
          console.log('❌ Database test failed:', error.message);
        } else {
          database_test = {
            connected: true,
            query_time_ms: dbQueryTime
          };
          console.log('✅ Database test passed:', dbQueryTime + 'ms');
        }
      } catch (error) {
        database_test = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown database error'
        };
        console.log('❌ Database test exception:', error);
      }
    }

    const executionTime = Math.round(performance.now() - startTime);

    const response: TestConnectionResponse = {
      success: true,
      message: 'Edge Function is working correctly',
      timestamp: new Date().toISOString(),
      environment,
      database_test,
      performance: {
        execution_time_ms: executionTime
      }
    };

    console.log('✅ Test connection successful:', executionTime + 'ms');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    const executionTime = Math.round(performance.now() - startTime);
    console.error('❌ Test connection failed:', error);

    const errorResponse = {
      success: false,
      message: 'Edge Function test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      performance: {
        execution_time_ms: executionTime
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
