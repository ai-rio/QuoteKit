import { NextRequest, NextResponse } from 'next/server';

import { getGlobalItems } from '@/features/items/global-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getGlobalItems({ category_id, search });
    if (result?.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result?.data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}