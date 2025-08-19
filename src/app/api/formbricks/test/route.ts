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
        message: 'Formbricks API key not configured'
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
        message: `API test failed: ${response.status} ${response.statusText} - ${errorText}`
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'API connection successful',
      data: data
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}