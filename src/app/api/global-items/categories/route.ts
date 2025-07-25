import { NextResponse } from 'next/server';

import { getGlobalCategories } from '@/features/items/global-actions';

export async function GET() {
  try {
    const result = await getGlobalCategories();
  if (result?.error) {
      return NextResponse.json(
        { error: result?.error?.message || 'Unknown error' },
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