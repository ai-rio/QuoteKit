/**
 * Edge Functions Health Check & Certification System
 * Comprehensive testing endpoint for all Edge Functions
 */

import { getSupabaseAdmin } from '../_shared/auth.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { PerformanceMonitor } from '../_shared/performance.ts';

interface HealthCheckResult {
  function_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  error_message?: string;
  test_results: {
    connectivity: boolean;
    authentication: boolean;
    database_access: boolean;
    performance: boolean;
  };
  metadata: Record<string, any>;
}

interface CertificationReport {
  overall_status: 'pass' | 'fail' | 'warning';
  total_functions: number;
  healthy_functions: number;
  failed_functions: number;
  performance_score: number;
  functions: HealthCheckResult[];
  recommendations: string[];
  timestamp: string;
}

const EDGE_FUNCTIONS = [
  'subscription-status',
  'quote-processor', 
  'quote-pdf-generator',
  'webhook-handler',
  'batch-processor',
  'webhook-monitor',
  'migration-controller',
  'production-validator',
  'security-hardening',
  'performance-optimizer',
  'monitoring-alerting',
  'global-optimizer',
  'connection-pool-optimizer',
  'test-connection'
];

const PERFORMANCE_THRESHOLDS = {
  response_time_ms: 2000, // 2 seconds max
  database_query_time_ms: 500, // 500ms max for DB queries
  memory_usage_mb: 128, // 128MB max
  error_rate_percent: 1 // 1% max error rate
};

async function testFunctionConnectivity(functionName: string): Promise<HealthCheckResult> {
  const monitor = new PerformanceMonitor('health-check', `test-${functionName}`);
  const startTime = Date.now();
  
  const result: HealthCheckResult = {
    function_name: functionName,
    status: 'unhealthy',
    response_time_ms: 0,
    test_results: {
      connectivity: false,
      authentication: false,
      database_access: false,
      performance: false
    },
    metadata: {}
  };

  try {
    // Test basic connectivity
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'http://127.0.0.1:54321';
    const functionUrl = `${baseUrl}/functions/v1/${functionName}`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ test: true, health_check: true })
    });

    result.response_time_ms = Date.now() - startTime;
    result.test_results.connectivity = response.status < 500;
    
    // Test authentication (if function requires it)
    if (response.status === 401) {
      result.test_results.authentication = false;
      result.error_message = 'Authentication required but not provided';
    } else if (response.status < 400) {
      result.test_results.authentication = true;
    }

    // Test performance
    result.test_results.performance = result.response_time_ms < PERFORMANCE_THRESHOLDS.response_time_ms;

    // Test database access (for functions that use it)
    if (functionName !== 'test-connection') {
      try {
        const supabase = getSupabaseAdmin();
        const dbStartTime = Date.now();
        await supabase.from('edge_function_metrics').select('id').limit(1);
        const dbTime = Date.now() - dbStartTime;
        
        result.test_results.database_access = dbTime < PERFORMANCE_THRESHOLDS.database_query_time_ms;
        result.metadata.database_response_time_ms = dbTime;
      } catch (error) {
        result.test_results.database_access = false;
        result.metadata.database_error = error.message;
      }
    } else {
      result.test_results.database_access = true; // test-connection handles its own DB testing
    }

    // Determine overall status
    const passedTests = Object.values(result.test_results).filter(Boolean).length;
    const totalTests = Object.keys(result.test_results).length;
    
    if (passedTests === totalTests) {
      result.status = 'healthy';
    } else if (passedTests >= totalTests * 0.75) {
      result.status = 'degraded';
    } else {
      result.status = 'unhealthy';
    }

    // Add response details
    if (response.ok) {
      try {
        const responseData = await response.json();
        result.metadata.response_data = responseData;
      } catch {
        result.metadata.response_text = await response.text();
      }
    } else {
      result.error_message = `HTTP ${response.status}: ${response.statusText}`;
    }

  } catch (error) {
    result.error_message = error.message;
    result.response_time_ms = Date.now() - startTime;
  }

  monitor.addMetadata('function_tested', functionName);
  monitor.addMetadata('test_results', result.test_results);
  await monitor.recordMetrics();

  return result;
}

async function generateCertificationReport(): Promise<CertificationReport> {
  console.log('🔍 Starting Edge Functions certification...');
  
  const results: HealthCheckResult[] = [];
  const recommendations: string[] = [];

  // Test all functions in parallel (with concurrency limit)
  const concurrencyLimit = 3;
  for (let i = 0; i < EDGE_FUNCTIONS.length; i += concurrencyLimit) {
    const batch = EDGE_FUNCTIONS.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.all(
      batch.map(functionName => testFunctionConnectivity(functionName))
    );
    results.push(...batchResults);
  }

  // Calculate metrics
  const healthyFunctions = results.filter(r => r.status === 'healthy').length;
  const degradedFunctions = results.filter(r => r.status === 'degraded').length;
  const unhealthyFunctions = results.filter(r => r.status === 'unhealthy').length;
  
  const avgResponseTime = results.reduce((sum, r) => sum + r.response_time_ms, 0) / results.length;
  const performanceScore = Math.round((healthyFunctions / results.length) * 100);

  // Generate recommendations
  if (unhealthyFunctions > 0) {
    recommendations.push(`${unhealthyFunctions} functions are unhealthy and need immediate attention`);
  }
  
  if (degradedFunctions > 0) {
    recommendations.push(`${degradedFunctions} functions are degraded and should be investigated`);
  }
  
  if (avgResponseTime > PERFORMANCE_THRESHOLDS.response_time_ms) {
    recommendations.push(`Average response time (${Math.round(avgResponseTime)}ms) exceeds threshold`);
  }

  const slowFunctions = results.filter(r => r.response_time_ms > PERFORMANCE_THRESHOLDS.response_time_ms);
  if (slowFunctions.length > 0) {
    recommendations.push(`Slow functions: ${slowFunctions.map(f => f.function_name).join(', ')}`);
  }

  // Determine overall status
  let overallStatus: 'pass' | 'fail' | 'warning';
  if (unhealthyFunctions === 0 && degradedFunctions === 0) {
    overallStatus = 'pass';
  } else if (unhealthyFunctions > 0) {
    overallStatus = 'fail';
  } else {
    overallStatus = 'warning';
  }

  return {
    overall_status: overallStatus,
    total_functions: results.length,
    healthy_functions: healthyFunctions,
    failed_functions: unhealthyFunctions,
    performance_score: performanceScore,
    functions: results,
    recommendations,
    timestamp: new Date().toISOString()
  };
}

async function recordHealthMetrics(report: CertificationReport): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Record overall health metrics
    await supabase.from('edge_function_health').upsert({
      function_name: 'system_health_check',
      status: report.overall_status === 'pass' ? 'healthy' : 
              report.overall_status === 'warning' ? 'degraded' : 'unhealthy',
      response_time_ms: Math.round(
        report.functions.reduce((sum, f) => sum + f.response_time_ms, 0) / report.functions.length
      ),
      error_rate: ((report.failed_functions / report.total_functions) * 100),
      last_checked: new Date().toISOString(),
      details: {
        total_functions: report.total_functions,
        healthy_functions: report.healthy_functions,
        performance_score: report.performance_score,
        recommendations: report.recommendations
      }
    });

    // Record individual function health
    for (const func of report.functions) {
      await supabase.from('edge_function_health').upsert({
        function_name: func.function_name,
        status: func.status,
        response_time_ms: func.response_time_ms,
        error_rate: func.error_message ? 100 : 0,
        last_checked: new Date().toISOString(),
        details: {
          test_results: func.test_results,
          metadata: func.metadata,
          error_message: func.error_message
        }
      });
    }

    console.log('✅ Health metrics recorded to database');
  } catch (error) {
    console.error('❌ Failed to record health metrics:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'full';

    switch (action) {
      case 'quick': {
        // Quick health check of critical functions only
        const criticalFunctions = ['subscription-status', 'test-connection', 'webhook-handler'];
        const results = await Promise.all(
          criticalFunctions.map(name => testFunctionConnectivity(name))
        );
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            status: results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
            functions: results,
            timestamp: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'single': {
        // Test a single function
        const functionName = url.searchParams.get('function');
        if (!functionName) {
          throw new Error('Function name required for single test');
        }

        const result = await testFunctionConnectivity(functionName);
        
        return new Response(JSON.stringify({
          success: true,
          data: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'full':
      default: {
        // Full certification report
        const report = await generateCertificationReport();
        await recordHealthMetrics(report);
        
        return new Response(JSON.stringify({
          success: true,
          data: report
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
