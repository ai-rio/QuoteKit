import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if PostHog is configured
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'PostHog API key not configured. Please set NEXT_PUBLIC_POSTHOG_KEY environment variable.'
      });
    }

    if (!host) {
      return NextResponse.json({
        success: false,
        message: 'PostHog host not configured. Please set NEXT_PUBLIC_POSTHOG_HOST environment variable.'
      });
    }

    // Test connection by making a simple request to PostHog
    // For now, we'll just check if the environment variables are set
    // In a real implementation, you might want to test the actual connection
    
    return NextResponse.json({
      success: true,
      message: 'PostHog configuration found',
      config: {
        host: host,
        keyConfigured: !!apiKey
      }
    });
  } catch (error) {
    console.error('PostHog connection test error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error testing PostHog connection'
    }, { status: 500 });
  }
}
