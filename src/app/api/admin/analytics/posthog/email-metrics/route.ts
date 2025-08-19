import { NextRequest, NextResponse } from 'next/server';

import { getEmailMetrics } from '@/libs/posthog/posthog-admin';

export async function GET(request: NextRequest) {
  try {
    const emailMetrics = await getEmailMetrics();
    return NextResponse.json(emailMetrics);
  } catch (error) {
    console.error('Error fetching PostHog email metrics:', error);
    
    // Return mock email metrics for development
    const mockEmailMetrics = {
      emails_sent: 0,
      emails_opened: 0,
      emails_clicked: 0,
      open_rate: 0,
      click_rate: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch PostHog email metrics'
    };
    
    return NextResponse.json(mockEmailMetrics);
  }
}
