import { NextRequest, NextResponse } from 'next/server';

import { getSystemMetrics } from '@/libs/posthog/posthog-admin';

export async function GET(request: NextRequest) {
  try {
    const metrics = await getSystemMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching PostHog system metrics:', error);
    
    // Return empty metrics with error message for development
    const emptyMetrics = {
      total_users: 0,
      quotes_created: 0,
      quotes_sent: 0,
      quotes_accepted: 0,
      total_revenue: 0,
      conversion_rate: 0,
      send_rate: 0,
      average_quote_value: 0,
      last_updated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch PostHog metrics'
    };
    
    return NextResponse.json(emptyMetrics);
  }
}
