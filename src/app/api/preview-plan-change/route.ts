import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/features/account/controllers/get-session';
import { previewPlanChange } from '@/features/account/controllers/stripe-plan-change';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { stripeCustomerId, stripeSubscriptionId, newPriceId } = body;

    // Validate required parameters
    if (!stripeCustomerId || !stripeSubscriptionId || !newPriceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: stripeCustomerId, stripeSubscriptionId, newPriceId' },
        { status: 400 }
      );
    }

    console.log('🔍 Preview plan change request:', {
      userId: session.user.id,
      stripeCustomerId,
      stripeSubscriptionId,
      newPriceId
    });

    // Get proration preview from Stripe
    const preview = await previewPlanChange(
      stripeCustomerId,
      stripeSubscriptionId,
      newPriceId
    );

    console.log('✅ Proration preview generated:', preview);

    return NextResponse.json({
      success: true,
      preview
    });

  } catch (error) {
    console.error('❌ Preview plan change error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to preview plan change',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
