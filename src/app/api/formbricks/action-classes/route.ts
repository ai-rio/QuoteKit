/**
 * Server-side API route for Formbricks action classes
 * Handles authentication server-side to keep API keys secure
 */

import { NextRequest, NextResponse } from 'next/server';

interface FormbricksActionClass {
  id: string;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export async function GET() {
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

    // Use the Management API endpoint for action classes
    const url = `${apiHost}/api/v1/management/action-classes`;
    
    console.log('Fetching action classes from Formbricks API:', { url, hasApiKey: !!apiKey });

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
      console.warn('Formbricks action classes API failed:', {
        status: response.status,
        statusText: response.statusText,
        url,
        error: errorText
      });
      // Return empty array instead of error to prevent client-side failures
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const data = await response.json();
    console.log('Formbricks action classes API response:', { dataType: typeof data, isArray: Array.isArray(data) });
    
    // Ensure we return data in expected format
    let actionClasses: FormbricksActionClass[] = [];
    if (Array.isArray(data)) {
      actionClasses = data;
    } else if (data.data && Array.isArray(data.data)) {
      actionClasses = data.data;
    }

    console.log('Returning action classes data:', { count: actionClasses.length });

    return NextResponse.json({ 
      data: actionClasses,
      total: actionClasses.length,
      success: true 
    });

  } catch (error) {
    console.warn('Error fetching Formbricks action classes:', error);
    // Return empty array instead of error
    return NextResponse.json({ 
      data: [], 
      total: 0, 
      success: false,
      message: 'Unable to fetch action classes at this time'
    }, { status: 200 });
  }
}

/**
 * POST - Create a new action class
 */
export async function POST(request: NextRequest) {
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
        success: false,
        message: 'API credentials not configured'
      }, { status: 500 });
    }

    // Parse request body
    const actionClassData = await request.json();
    
    // Validate required fields
    if (!actionClassData.name || !actionClassData.description) {
      return NextResponse.json({
        success: false,
        message: 'Action class name and description are required'
      }, { status: 400 });
    }

    // Add environment ID to action class data
    const actionClassPayload = {
      ...actionClassData,
      environmentId: environmentId,
      type: actionClassData.type || 'code'
    };

    console.log('Creating action class in Formbricks:', { 
      name: actionClassPayload.name,
      type: actionClassPayload.type,
      environmentId: actionClassPayload.environmentId
    });

    // Create action class via Formbricks Management API
    const url = `${apiHost}/api/v1/management/action-classes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actionClassPayload)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('Failed to create action class:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json({
        success: false,
        message: `Failed to create action class: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const createdActionClass = await response.json();
    console.log('Action class created successfully:', { 
      id: createdActionClass.id,
      name: createdActionClass.name 
    });

    return NextResponse.json({
      success: true,
      message: 'Action class created successfully',
      data: createdActionClass
    });

  } catch (error) {
    console.error('Error creating action class:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create action class',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}