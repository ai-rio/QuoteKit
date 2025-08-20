/**
 * Server-side API route for Formbricks survey responses
 * Handles authentication server-side to keep API keys secure
 */

import { NextRequest, NextResponse } from 'next/server';

interface FormbricksSurveyResponse {
  id: string;
  surveyId: string;
  createdAt: string;
  finished: boolean;
  data: any;
  meta: any;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get API credentials from server environment
    const apiKey = process.env.FORMBRICKS_API_KEY;
    const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';
    const environmentId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
    
    if (!apiKey || !environmentId) {
      console.warn('Formbricks API credentials not fully configured', {
        hasApiKey: !!apiKey,
        hasEnvId: !!environmentId
      });
      return NextResponse.json({ 
        data: [], 
        total: 0, 
        hasMore: false 
      }, { status: 200 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();
    
    // Forward allowed query parameters
    const allowedParams = ['page', 'limit', 'sortBy', 'sortOrder', 'surveyId', 'finished', 'dateFrom', 'dateTo'];
    allowedParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        queryParams.append(param, value);
      }
    });

    // Use the updated Management API endpoint for responses
    const url = `${apiHost}/api/v1/management/responses?${queryParams.toString()}`;
    
    console.log('Fetching responses from Formbricks API:', { 
      url, 
      hasApiKey: !!apiKey, 
      queryParams: queryParams.toString() 
    });

    // Make request to Formbricks API
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      // Add cache control
      next: { revalidate: 180 } // Cache for 3 minutes
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.warn('Formbricks responses API failed:', {
        status: response.status,
        statusText: response.statusText,
        url,
        error: errorText
      });
      // Return empty result instead of error
      return NextResponse.json({ 
        data: [], 
        total: 0, 
        hasMore: false 
      }, { status: 200 });
    }

    const data = await response.json();
    console.log('Formbricks responses API response:', { 
      dataType: typeof data, 
      isArray: Array.isArray(data),
      hasData: !!(data && data.data),
      dataLength: data && data.data ? data.data.length : 'N/A'
    });
    
    // Ensure we return data in expected format
    let responses: FormbricksSurveyResponse[] = [];
    let total = 0;
    let hasMore = false;

    if (Array.isArray(data)) {
      responses = data;
      total = data.length;
      hasMore = false;
    } else if (data.data && Array.isArray(data.data)) {
      responses = data.data;
      total = data.total || data.data.length;
      hasMore = data.hasMore || false;
    }

    console.log('Returning responses data:', { 
      count: responses.length, 
      total, 
      hasMore 
    });

    return NextResponse.json({ 
      data: responses,
      responses: responses, // For backwards compatibility
      total,
      hasMore,
      success: true 
    });

  } catch (error) {
    console.warn('Error fetching Formbricks responses:', error);
    // Return empty result instead of error
    return NextResponse.json({ 
      data: [], 
      responses: [],
      total: 0, 
      hasMore: false,
      success: false,
      message: 'Unable to fetch responses at this time'
    }, { status: 200 });
  }
}