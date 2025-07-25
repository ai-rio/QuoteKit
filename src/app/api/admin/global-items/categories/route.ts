import { NextRequest, NextResponse } from 'next/server';

import { createGlobalCategory } from '@/features/items/global-actions';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all categories (including inactive for admin)
    const { data, error } = await supabase
      .from('global_categories' as any)
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createGlobalCategory(formData);

    if (result?.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    if (!result?.data) {
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      data: result.data,
      message: 'Category created successfully' 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}