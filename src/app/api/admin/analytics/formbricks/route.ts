/**
 * Admin Formbricks Analytics API Route
 * 
 * Server-side API endpoint for fetching Formbricks analytics data
 * with proper admin authentication and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';

import { formbricksAnalyticsService } from '@/libs/formbricks/analytics-service';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: isAdminUser, error: adminError } = await supabase.rpc('is_admin', { 
      user_id: user.id 
    });
    
    if (adminError || !isAdminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    switch (action) {
      case 'overview': // action=overview
        return await handleOverview(searchParams);
      
      case 'responses':
        return await handleResponses(searchParams);
      
      case 'surveys':
        return await handleSurveys();
      
      case 'search': // action=search
        return await handleSearch(searchParams);
      
      case 'export':
        return await handleExport(searchParams);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Formbricks analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle analytics overview data
 */
async function handleOverview(searchParams: URLSearchParams) {
  try {
    const filters = parseFilters(searchParams);
    const data = await formbricksAnalyticsService.fetchAnalyticsData(filters);
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Overview fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}

/**
 * Handle paginated responses
 */
async function handleResponses(searchParams: URLSearchParams) {
  try {
    const filters = parseFilters(searchParams);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    const params = {
      ...filters,
      page,
      limit,
      sort: {
        field: sortField as any,
        direction: sortDirection as 'asc' | 'desc',
      },
    };

    const data = await formbricksAnalyticsService.fetchSurveyResponses(params);
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Responses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey responses' },
      { status: 500 }
    );
  }
}

/**
 * Handle surveys list
 */
async function handleSurveys() {
  try {
    const surveys = await formbricksAnalyticsService.fetchSurveys();
    
    return NextResponse.json({
      success: true,
      data: surveys,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Surveys fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}

/**
 * Handle search requests
 */
async function handleSearch(searchParams: URLSearchParams) {
  try {
    const searchTerm = searchParams.get('q');
    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term required' },
        { status: 400 }
      );
    }

    const filters = parseFilters(searchParams);
    const results = await formbricksAnalyticsService.searchResponses(searchTerm, filters);
    
    return NextResponse.json({
      success: true,
      data: results,
      searchTerm,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle export requests
 */
async function handleExport(searchParams: URLSearchParams) {
  try {
    const filters = parseFilters(searchParams);
    const format = searchParams.get('format') || 'csv';

    if (format !== 'csv') {
      return NextResponse.json(
        { error: 'Only CSV format is supported' },
        { status: 400 }
      );
    }

    const csvContent = await formbricksAnalyticsService.exportResponses(filters);
    
    // Return CSV as downloadable file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `formbricks-responses-${timestamp}.csv`;
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

/**
 * Parse filters from search parameters
 */
function parseFilters(searchParams: URLSearchParams) {
  const filters: any = {};

  const surveyId = searchParams.get('surveyId');
  if (surveyId) filters.surveyId = surveyId;

  const dateFrom = searchParams.get('dateFrom');
  if (dateFrom) filters.dateFrom = dateFrom;

  const dateTo = searchParams.get('dateTo');
  if (dateTo) filters.dateTo = dateTo;

  const finished = searchParams.get('finished');
  if (finished !== null) filters.finished = finished === 'true';

  const tags = searchParams.get('tags');
  if (tags) filters.tags = tags.split(',');

  return filters;
}

/**
 * Handle POST requests for real-time updates
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: isAdminUser, error: adminError } = await supabase.rpc('is_admin', { 
      user_id: user.id 
    });
    
    if (adminError || !isAdminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { since } = body;

    if (!since) {
      return NextResponse.json(
        { error: 'Since timestamp required' },
        { status: 400 }
      );
    }

    const latestResponses = await formbricksAnalyticsService.fetchLatestResponses(since);
    
    return NextResponse.json({
      success: true,
      data: latestResponses,
      count: latestResponses.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Real-time updates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}