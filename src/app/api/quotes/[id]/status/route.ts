import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/features/account/controllers/get-session';
import { QuoteStatus } from '@/features/quotes/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface UpdateStatusRequest {
  status: QuoteStatus;
}

const VALID_STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined', 'expired', 'converted'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status }: UpdateStatusRequest = await request.json();
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    // Validate status value
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if quote exists and belongs to user
    const { data: existingQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Update quote status with timestamp
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set specific timestamps based on status
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Failed to update quote status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update quote status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: `Quote status updated to ${status}`,
    });

  } catch (error) {
    console.error('Status update API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}