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
    
    if (!apiKey) {
      console.warn('Formbricks API key not configured');
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Make request to Formbricks API
    const response = await fetch(`${apiHost}/api/v1/management/surveys`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      // Add cache control
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      console.warn('Formbricks surveys API failed:', {
        status: response.status,
        statusText: response.statusText
      });
      // Return empty array instead of error to prevent client-side failures
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const data = await response.json();
    
    // Ensure we return data in expected format
    let surveys: FormbricksSurvey[] = [];
    if (Array.isArray(data)) {
      surveys = data;
    } else if (data.data && Array.isArray(data.data)) {
      surveys = data.data;
    }

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