import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the authenticated user (optional for analytics)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get analytics data from request body
    const body = await request.json();
    const { 
      event, 
      feature, 
      trigger, 
      variant, 
      action, 
      currentUsage, 
      limit, 
      timestamp,
      userAgent,
      referrer,
      pathname
    } = body;

    // Validate required fields
    if (!event || !feature || !trigger || !variant || !timestamp) {
      return NextResponse.json({ error: 'Missing required analytics fields' }, { status: 400 });
    }

    // Create analytics record
    const analyticsRecord = {
      user_id: user?.id || null,
      event_type: event,
      feature,
      trigger,
      variant,
      action: action || null,
      current_usage: currentUsage || null,
      usage_limit: limit || null,
      user_agent: userAgent || null,
      referrer: referrer || null,
      pathname: pathname || null,
      created_at: timestamp,
      // Add session context
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
    };

    // Store in upgrade_prompt_analytics table
    const { error: insertError } = await supabase
      .from('upgrade_prompt_analytics')
      .insert(analyticsRecord);

    if (insertError) {
      console.error('Error storing analytics:', insertError);
      // Don't fail the request - analytics is not critical
      return NextResponse.json({ success: false, error: 'Analytics storage failed' }, { status: 200 });
    }

    // Return success without exposing internal details
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    // Don't fail the request - analytics should never break user experience
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 200 });
  }
}