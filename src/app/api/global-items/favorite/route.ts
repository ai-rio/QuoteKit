import { NextRequest, NextResponse } from 'next/server';

import { toggleGlobalItemFavorite } from '@/features/items/global-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { globalItemId } = body;

    if (!globalItemId) {
      return NextResponse.json(
        { error: 'Global item ID is required' },
        { status: 400 }
      );
    }

    const result = await toggleGlobalItemFavorite(globalItemId);
    if (result?.error) {
      return NextResponse.json(
        { error: result?.error?.message || 'Unknown error' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      data: { isFavorite: result?.data },
      message: `Item ${result?.data ? 'added to' : 'removed from'} favorites` 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}