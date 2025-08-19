/**
 * Server-side API route for Formbricks surveys
 * Handles authentication server-side to keep API keys secure
 */

import { NextRequest, NextResponse } from 'next/server';

interface FormbricksSurvey {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Use environment-specific endpoint for surveys
    const url = `${apiHost}/api/v1/management/environments/${environmentId}/surveys`;
    
    console.log('Fetching surveys from Formbricks API:', { url, hasApiKey: !!apiKey });

    // Make request to Formbricks API
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      // Add cache control
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.warn('Formbricks surveys API failed:', {
        status: response.status,
        statusText: response.statusText,
        url,
        error: errorText
      });
      // Return empty array instead of error to prevent client-side failures
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const data = await response.json();
    console.log('Formbricks surveys API response:', { dataType: typeof data, isArray: Array.isArray(data) });
    
    // Ensure we return data in expected format
    let surveys: FormbricksSurvey[] = [];
    if (Array.isArray(data)) {
      surveys = data;
    } else if (data.data && Array.isArray(data.data)) {
      surveys = data.data;
    }

    console.log('Returning surveys data:', { count: surveys.length });

    return NextResponse.json({ 
      data: surveys,
      total: surveys.length,
      success: true 
    });

  } catch (error) {
    console.warn('Error fetching Formbricks surveys:', error);
    // Return empty array instead of error
    return NextResponse.json({ 
      data: [], 
      total: 0, 
      success: false,
      message: 'Unable to fetch surveys at this time'
    }, { status: 200 });
  }
}