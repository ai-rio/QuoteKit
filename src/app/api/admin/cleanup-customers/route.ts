import { NextRequest, NextResponse } from 'next/server';

import { checkAndCleanupDuplicates,cleanupDuplicateCustomers } from '@/features/account/controllers/cleanup-duplicate-customers';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 POST /api/admin/cleanup-customers - Starting...');
    
    // Check authentication and admin status
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('❌ Authentication failed:', error?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      console.log('❌ Admin check failed:', adminError?.message);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, userId, action = 'check' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (action === 'cleanup' && !userId) {
      return NextResponse.json({ error: 'User ID is required for cleanup' }, { status: 400 });
    }

    console.log(`🔄 ${action} duplicates for email: ${email}`);

    if (action === 'cleanup') {
      // Perform cleanup
      const keptCustomerId = await cleanupDuplicateCustomers(email, userId);
      
      return NextResponse.json({
        success: true,
        message: 'Duplicate customers cleaned up successfully',
        data: {
          keptCustomerId,
          email,
          userId
        }
      });
    } else {
      // Just check for duplicates
      const customerId = await checkAndCleanupDuplicates(email, userId || 'unknown');
      
      return NextResponse.json({
        success: true,
        message: customerId ? 'Customer found or cleaned up' : 'No customer found',
        data: {
          customerId,
          email,
          hasDuplicates: false // checkAndCleanupDuplicates handles cleanup automatically
        }
      });
    }

  } catch (error) {
    console.error('💥 Error in cleanup-customers:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/cleanup-customers - Starting...');
    
    // Check authentication and admin status
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Check for duplicates without cleanup
    const customerId = await checkAndCleanupDuplicates(email, 'check-only');
    
    return NextResponse.json({
      success: true,
      data: {
        email,
        customerId,
        hasCustomer: !!customerId
      }
    });

  } catch (error) {
    console.error('💥 Error checking customers:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
