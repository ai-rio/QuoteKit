/**
 * Server-side API route for testing Formbricks connection
 * Handles authentication server-side to keep API keys secure
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get API credentials from server environment
    const apiKey = process.env.FORMBRICKS_API_KEY;
    const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'Formbricks API key not configured',
        details: {
          hasApiKey: false,
          apiHost,
          envVars: {
            FORMBRICKS_API_KEY: 'not set',
            NEXT_PUBLIC_FORMBRICKS_API_HOST: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'not set',
            NEXT_PUBLIC_FORMBRICKS_ENV_ID: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID ? 'set' : 'not set'
          }
        }
      });
    }

    // Test with the /me endpoint
    const response = await fetch(`${apiHost}/api/v1/management/me`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      return NextResponse.json({
        success: false,
        message: `API test failed: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          errorText,
          apiHost,
          testEndpoint: `${apiHost}/api/v1/management/me`
        }
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'API connection successful',
      data: data,
      details: {
        apiHost,
        testEndpoint: `${apiHost}/api/v1/management/me`,
        responseStatus: response.status
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : 'Unknown error',
        apiHost: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com'
      }
    });
  }
}

/**
 * POST endpoint for running comprehensive Formbricks diagnostics
 */
export async function POST(request: Request) {
  try {
    const { action, eventName, properties } = await request.json();

    // Handle different debug actions
    switch (action) {
      case 'trigger_event':
        return await handleTriggerEvent(eventName, properties);
      
      case 'test_surveys':
        return await handleTestSurveys();
      
      case 'validate_environment':
        return await handleValidateEnvironment();
      
      case 'comprehensive_test':
        return await handleComprehensiveTest();
        
      default:
        return NextResponse.json({
          success: false,
          message: `Unknown action: ${action}`,
          availableActions: ['trigger_event', 'test_surveys', 'validate_environment', 'comprehensive_test']
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Debug request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : 'Unknown error'
    });
  }
}

/**
 * Handle event triggering test
 */
async function handleTriggerEvent(eventName: string, properties?: Record<string, any>) {
  if (!eventName) {
    return NextResponse.json({
      success: false,
      message: 'Event name is required for trigger_event action'
    });
  }

  // Server-side event tracking would go here if we had server-side SDK
  return NextResponse.json({
    success: true,
    message: `Event trigger request processed: ${eventName}`,
    details: {
      eventName,
      properties: properties || {},
      note: 'Event triggering is handled on the client side. This confirms the API endpoint is working.'
    }
  });
}

/**
 * Handle survey testing
 */
async function handleTestSurveys() {
  try {
    const apiKey = process.env.FORMBRICKS_API_KEY;
    const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
    const envId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

    if (!apiKey || !envId) {
      return NextResponse.json({
        success: false,
        message: 'API key or environment ID not configured for survey testing',
        details: {
          hasApiKey: !!apiKey,
          hasEnvId: !!envId
        }
      });
    }

    // Fetch surveys for this environment
    const response = await fetch(`${apiHost}/api/v1/management/surveys`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Failed to fetch surveys: ${response.status} ${response.statusText}`,
        details: { status: response.status, statusText: response.statusText }
      });
    }

    const surveys = await response.json();

    return NextResponse.json({
      success: true,
      message: `Found ${surveys.data?.length || 0} surveys`,
      data: {
        surveys: surveys.data || [],
        total: surveys.data?.length || 0,
        active: surveys.data?.filter((s: any) => s.status === 'inProgress')?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Survey test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle environment validation
 */
async function handleValidateEnvironment() {
  try {
    const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
    const envId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;

    if (!envId) {
      return NextResponse.json({
        success: false,
        message: 'Environment ID not configured',
        details: { hasEnvId: false }
      });
    }

    // Test environment accessibility
    const testUrl = `${apiHost}/api/v1/environments/${envId}`;
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'QuoteKit-Formbricks-Debug/1.0.0',
      },
    });

    return NextResponse.json({
      success: response.status === 200,
      message: response.status === 200 
        ? 'Environment ID is valid and accessible'
        : response.status === 404 
          ? 'Environment ID not found - check your Formbricks account'
          : `Environment validation returned status ${response.status}`,
      details: {
        envId: envId.substring(0, 10) + '...',
        status: response.status,
        statusText: response.statusText,
        testUrl,
        apiHost
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle comprehensive testing
 */
async function handleComprehensiveTest() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{ name: string; status: string; message: string; details?: any }>,
  };

  // Test 1: Environment Configuration
  const envId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
  const apiKey = process.env.FORMBRICKS_API_KEY;
  const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';

  results.tests.push({
    name: 'Environment Configuration',
    status: envId && apiKey ? 'success' : 'warning',
    message: envId && apiKey 
      ? 'All required environment variables are configured'
      : 'Some environment variables may be missing',
    details: {
      hasEnvId: !!envId,
      hasApiKey: !!apiKey,
      apiHost,
      envIdFormat: envId ? {
        length: envId.length,
        startsWithPrefix: /^(dev_|prd_)/.test(envId)
      } : null
    }
  });

  // Test 2: API Connectivity
  if (apiKey) {
    try {
      const response = await fetch(`${apiHost}/api/v1/management/me`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      results.tests.push({
        name: 'API Connectivity',
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? 'API connection successful'
          : `API connection failed: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          apiHost
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'API Connectivity',
        status: 'error',
        message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  } else {
    results.tests.push({
      name: 'API Connectivity',
      status: 'warning',
      message: 'Cannot test API connectivity - no API key configured',
      details: { hasApiKey: false }
    });
  }

  // Test 3: Environment Validation
  if (envId) {
    try {
      const testUrl = `${apiHost}/api/v1/environments/${envId}`;
      const response = await fetch(testUrl, { method: 'HEAD' });

      results.tests.push({
        name: 'Environment Validation',
        status: response.status === 200 ? 'success' : response.status === 404 ? 'error' : 'warning',
        message: response.status === 200 
          ? 'Environment ID is valid'
          : response.status === 404 
            ? 'Environment ID not found'
            : `Environment validation returned status ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          testUrl
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Environment Validation',
        status: 'warning',
        message: `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  // Test 4: Survey Availability
  if (apiKey && envId) {
    try {
      const response = await fetch(`${apiHost}/api/v1/management/surveys`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const surveys = await response.json();
        results.tests.push({
          name: 'Survey Availability',
          status: 'success',
          message: `Found ${surveys.data?.length || 0} surveys`,
          details: {
            total: surveys.data?.length || 0,
            active: surveys.data?.filter((s: any) => s.status === 'inProgress')?.length || 0
          }
        });
      } else {
        results.tests.push({
          name: 'Survey Availability',
          status: 'warning',
          message: `Failed to fetch surveys: ${response.status} ${response.statusText}`,
          details: { status: response.status }
        });
      }
    } catch (error) {
      results.tests.push({
        name: 'Survey Availability',
        status: 'error',
        message: `Survey test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  // Calculate summary
  const summary = {
    total: results.tests.length,
    passed: results.tests.filter(t => t.status === 'success').length,
    warnings: results.tests.filter(t => t.status === 'warning').length,
    failed: results.tests.filter(t => t.status === 'error').length
  };

  return NextResponse.json({
    success: summary.failed === 0,
    message: `Comprehensive test completed: ${summary.passed}/${summary.total} tests passed`,
    results,
    summary
  });
}
