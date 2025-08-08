import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ function: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const functionName = resolvedParams.function;

    // Get the Supabase URL and construct the Edge Function URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    };

    // Make the request to the Edge Function
    const startTime = Date.now();
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const responseTime = Date.now() - startTime;
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        const textResponse = await response.text();
        responseData = { 
          message: textResponse,
          contentType,
          raw: textResponse
        };
      }
    } catch (parseError) {
      responseData = {
        message: 'Failed to parse response',
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      };
    }

    // Return the response with additional metadata
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
      functionName,
      timestamp: new Date().toISOString()
    }, { 
      status: 200 // Always return 200 so we can see the actual response
    });

  } catch (error) {
    console.error(`Error calling Edge Function:`, error);
    
    // Try to get function name for error response
    let functionName = 'unknown';
    try {
      const resolvedParams = await params;
      functionName = resolvedParams.function;
    } catch {
      // Ignore params resolution error in error handler
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      functionName,
      timestamp: new Date().toISOString()
    }, { 
      status: 200 // Return 200 so the frontend can handle the error
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ function: string }> }
) {
  // Handle GET requests by converting to POST with empty body
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ test: true, health_check: true })
  });
  
  return POST(mockRequest, { params });
}
