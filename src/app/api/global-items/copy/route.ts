import { NextRequest, NextResponse } from 'next/server';

import { copyGlobalItemToPersonal } from '@/features/items/global-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { globalItemId, customCost } = body;

    if (!globalItemId) {
      return NextResponse.json(
        { error: 'Global item ID is required' },
        { status: 400 }
      );
    }

    const result = await copyGlobalItemToPersonal(globalItemId, customCost);
    if (result?.error) {
      return NextResponse.json(
        { error: result?.error?.message || 'Unknown error' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      data: result?.data,
      message: 'Item copied to personal library successfully' 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}