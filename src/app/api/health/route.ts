import { NextResponse } from 'next/server';

/**
 * Health check endpoint for monitoring and load balancer checks
 * Returns basic application status and health information
 */
export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      node_version: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      checks: {
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        stripe: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        resend: !!process.env.RESEND_API_KEY,
        posthog: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      }
    };

    return NextResponse.json(healthCheck, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

// Support HEAD requests for basic health checks
export async function HEAD() {
  return new Response(null, { status: 200 });
}